#
# This file is part of TEN Framework, an open source project.
# Licensed under the Apache License, Version 2.0.
# See the LICENSE file for more information.
#
import asyncio
from datetime import datetime
import os
import traceback

from ten_ai_base.helper import PCMWriter
from ten_ai_base.message import (
    ModuleError,
    ModuleErrorCode,
    ModuleErrorVendorInfo,
    ModuleType,
    ModuleVendorException,
    TTSAudioEndReason,
)
from ten_ai_base.struct import TTSTextInput
from ten_ai_base.tts2 import AsyncTTS2BaseExtension
from ten_ai_base.struct import TTSTextResult
from ten_ai_base.const import LOG_CATEGORY_KEY_POINT

from .config import StepFunTTSConfig
from .stepfun_tts import (
    StepFunTTSWebsocket,
    StepFunTTSTaskFailedException,
    EVENT_TTSSentenceEnd,
    EVENT_TTSResponse,
    EVENT_TTSTaskFinished,
)
from ten_runtime import (
    AsyncTenEnv,
    Data,
)


class StepFunTTSExtension(AsyncTTS2BaseExtension):
    def __init__(self, name: str) -> None:
        super().__init__(name)
        self.config: StepFunTTSConfig | None = None
        self.client: StepFunTTSWebsocket | None = None
        self.current_request_id: str | None = None
        self.current_turn_id: int = -1
        self.sent_ts: datetime | None = None
        self.current_request_finished: bool = False
        self.total_audio_bytes: int = 0
        self.first_chunk: bool = False
        self.recorder_map: dict[str, PCMWriter] = (
            {}
        )  # Store PCMWriter instances for different request_ids

    async def on_init(self, ten_env: AsyncTenEnv) -> None:
        try:
            await super().on_init(ten_env)
            ten_env.log_info("on_init")

            if self.config is None:
                config_json, _ = await self.ten_env.get_property_to_json("")

                # Check if config is empty or missing required fields
                if not config_json or config_json.strip() == "{}":
                    error_msg = "Configuration is empty."
                    raise ValueError(error_msg)

                self.config = StepFunTTSConfig.model_validate_json(config_json)
                # extract audio_params and additions from config
                self.config.update_params()
                self.config.validate_params()
                self.ten_env.log_info(
                    f"config: {self.config.to_str(sensitive_handling=True)}",
                    category=LOG_CATEGORY_KEY_POINT,
                )

            self.client = StepFunTTSWebsocket(
                self.config,
                ten_env,
                self.vendor(),
                lambda t: asyncio.ensure_future(self._handle_transcription(t)),
                on_error=self._handle_tts_error,
                on_audio_data=lambda audio_data, event_status, audio_timestamp: asyncio.ensure_future(
                    self._handle_audio_data(
                        audio_data, event_status, audio_timestamp
                    )
                ),
            )
            # Preheat websocket connection
            await self.client.start()
            ten_env.log_info(
                "StepFunTTSWebsocket client initialized and preheated successfully"
            )
        except Exception as e:
            ten_env.log_error(f"on_init failed: {traceback.format_exc()}")

            # Send FATAL ERROR for unexpected exceptions during initialization
            await self.send_tts_error(
                self.current_request_id or "",
                ModuleError(
                    message=f"Unexpected error during initialization: {str(e)}",
                    module=ModuleType.TTS,
                    code=int(ModuleErrorCode.FATAL_ERROR),
                    vendor_info=None,
                ),
            )

    async def on_data(self, ten_env: AsyncTenEnv, data: Data) -> None:
        data_name = data.get_name()
        ten_env.log_info(f"on_data: {data_name}")

        if data_name == "tts_flush":
            flush_id, _ = data.get_property_string("flush_id")
            if flush_id:
                ten_env.log_info(f"Received flush request for ID: {flush_id}")
                await self.client.cancel()
                if self.current_request_id and self.sent_ts:
                    ten_env.log_info(
                        f"Current request {self.current_request_id} is being flushed. Sending INTERRUPTED."
                    )
                    request_event_interval = int(
                        (datetime.now() - self.sent_ts).total_seconds() * 1000
                    )
                    duration_ms = self._calculate_audio_duration_ms()
                    await self.send_tts_audio_end(
                        self.current_request_id,
                        request_event_interval,
                        duration_ms,
                        self.current_turn_id,
                        TTSAudioEndReason.INTERRUPTED,
                    )
                    # Reset state
                    self.sent_ts = None
                    self.total_audio_bytes = 0
                    self.current_request_finished = True
        await super().on_data(ten_env, data)

    async def on_stop(self, ten_env: AsyncTenEnv) -> None:
        # Clean up client if exists
        if self.client:
            # Stop the websocket connection
            await self.client.stop()
            self.client = None

        # Clean up all PCMWriters
        for request_id, recorder in self.recorder_map.items():
            try:
                await recorder.flush()
                ten_env.log_info(
                    f"Flushed PCMWriter for request_id: {request_id}"
                )
            except Exception as e:
                ten_env.log_error(
                    f"Error flushing PCMWriter for request_id {request_id}: {e}"
                )

        await super().on_stop(ten_env)
        ten_env.log_info("on_stop")

    async def on_deinit(self, ten_env: AsyncTenEnv) -> None:
        await super().on_deinit(ten_env)
        ten_env.log_info("on_deinit")

    def vendor(self) -> str:
        return "stepfun"

    def synthesize_audio_sample_rate(self) -> int:
        if self.config:
            return self.config.get_sample_rate()
        return 16000  # StepFun TTS default sample rate

    def _calculate_audio_duration_ms(self) -> int:
        if self.config is None:
            return 0
        bytes_per_sample = 2  # Assuming 16-bit audio
        channels = 1  # Mono
        duration_sec = self.total_audio_bytes / (
            self.synthesize_audio_sample_rate() * bytes_per_sample * channels
        )
        return int(duration_sec * 1000)

    async def request_tts(self, t: TTSTextInput) -> None:
        """
        Override this method to handle TTS requests.
        This is called when the TTS request is made.
        """
        try:
            # If client is None, it means the connection was dropped or never initialized.
            # Attempt to re-establish the connection.
            self.ten_env.log_info(
                f"KEYPOINT Requesting TTS for text: {t.text}, text_input_end: {t.text_input_end} request ID: {t.request_id}"
            )
            if self.client is None:
                self.ten_env.log_info(
                    "TTS client is not initialized, something is wrong. It should have been re-created after flush."
                )
                return

            self.ten_env.log_info(
                f"current_request_id: {self.current_request_id}, new request_id: {t.request_id}, current_request_finished: {self.current_request_finished}"
            )

            if t.request_id != self.current_request_id:
                self.ten_env.log_info(
                    f"KEYPOINT New TTS request with ID: {t.request_id}"
                )
                self.first_chunk = True
                self.sent_ts = datetime.now()
                self.current_request_id = t.request_id
                self.current_request_finished = False
                self.total_audio_bytes = 0  # Reset for new request

                # Reset request start time for new request - this is now managed internally by the client instance
                if t.metadata is not None:
                    self.session_id = t.metadata.get("session_id", "")
                    self.current_turn_id = t.metadata.get("turn_id", -1)

                # Create new PCMWriter for new request_id and clean up old ones
                if self.config and self.config.dump:
                    # Clean up old PCMWriters (except current request_id)
                    old_request_ids = [
                        rid
                        for rid in self.recorder_map.keys()
                        if rid != t.request_id
                    ]
                    for old_rid in old_request_ids:
                        try:
                            await self.recorder_map[old_rid].flush()
                            del self.recorder_map[old_rid]
                            self.ten_env.log_info(
                                f"Cleaned up old PCMWriter for request_id: {old_rid}"
                            )
                        except Exception as e:
                            self.ten_env.log_error(
                                f"Error cleaning up PCMWriter for request_id {old_rid}: {e}"
                            )

                    # Create new PCMWriter
                    if t.request_id not in self.recorder_map:
                        dump_file_path = os.path.join(
                            self.config.dump_path,
                            f"stepfun_dump_{t.request_id}.pcm",
                        )
                        self.recorder_map[t.request_id] = PCMWriter(
                            dump_file_path
                        )
                        self.ten_env.log_info(
                            f"Created PCMWriter for request_id: {t.request_id}, file: {dump_file_path}"
                        )
            elif self.current_request_finished:
                error_msg = f"Received a message for a finished request_id '{t.request_id}' skip processing."
                self.ten_env.log_error(error_msg)
                return

            if t.text_input_end:
                self.ten_env.log_info(
                    f"KEYPOINT finish session for request ID: {t.request_id}"
                )
                self.current_request_finished = True

            # Send TTS request - audio data will be handled via callback
            self.ten_env.log_info(
                f"Calling client.get() with TTSTextInput: {t.text}"
            )
            await self.client.get(t)
            self.ten_env.log_info(
                "TTS request sent, audio will be processed via callback"
            )

        except StepFunTTSTaskFailedException as e:
            self.ten_env.log_error(
                f"StepFunTTSTaskFailedException in request_tts: {e.error_msg} (code: {e.error_code}). text: {t.text}"
            )
            # Use the same error handling logic as the callback mechanism
            await self._send_tts_error_for_exception(e)
        except ModuleVendorException as e:
            self.ten_env.log_error(
                f"ModuleVendorException in request_tts: {traceback.format_exc()}. text: {t.text}"
            )
            await self.send_tts_error(
                self.current_request_id or "",
                ModuleError(
                    message=str(e),
                    module=ModuleType.TTS,
                    code=int(ModuleErrorCode.NON_FATAL_ERROR),
                    vendor_info=e.error,
                ),
            )
        except Exception as e:
            self.ten_env.log_error(
                f"Error in request_tts: {traceback.format_exc()}. text: {t.text}"
            )
            await self.send_tts_error(
                self.current_request_id or "",
                ModuleError(
                    message=str(e),
                    module=ModuleType.TTS,
                    code=int(ModuleErrorCode.NON_FATAL_ERROR),
                    vendor_info=ModuleErrorVendorInfo(vendor=self.vendor()),
                ),
            )
            # When a connection error occurs, destroy the client instance.
            # It will be recreated on the next request.
            if isinstance(e, ConnectionRefusedError) and self.client:
                await self.client.cancel()  # Use cancel to swap instance
                self.ten_env.log_info(
                    "Client connection dropped, instance swapped. Will use new instance on next request."
                )

    async def _handle_audio_data(
        self, audio_data: bytes, event_status: int, audio_timestamp: int
    ) -> None:
        """Handle audio data callback"""
        try:
            self.ten_env.log_info(f"Received event_status: {event_status}")

            if event_status == EVENT_TTSResponse:
                if audio_data is not None and len(audio_data) > 0:
                    self.total_audio_bytes += len(audio_data)
                    self.ten_env.log_info(
                        f"[tts] Received audio chunk, size: {len(audio_data)} bytes, audio_timestamp: {audio_timestamp}"
                    )

                    # Send TTS audio start on first chunk
                    if self.first_chunk:
                        if self.sent_ts and self.current_request_id:
                            await self.send_tts_audio_start(
                                self.current_request_id, self.current_turn_id
                            )
                            ttfb = int(
                                (datetime.now() - self.sent_ts).total_seconds()
                                * 1000
                            )
                            if self.current_request_id:
                                await self.send_tts_ttfb_metrics(
                                    self.current_request_id,
                                    ttfb,
                                    self.current_turn_id,
                                )
                        self.first_chunk = False

                    # Write to dump file if enabled
                    if (
                        self.config
                        and self.config.dump
                        and self.current_request_id
                        and self.current_request_id in self.recorder_map
                    ):
                        asyncio.create_task(
                            self.recorder_map[self.current_request_id].write(
                                audio_data
                            )
                        )

                    # Send audio data
                    await self.send_tts_audio_data(
                        audio_data, audio_timestamp or 0
                    )
                else:
                    self.ten_env.log_error(
                        "Received empty payload for TTS response"
                    )

            elif event_status == EVENT_TTSSentenceEnd:
                self.ten_env.log_info(
                    "Received TTSSentenceEnd event from StepFun TTS"
                )

            elif event_status == EVENT_TTSTaskFinished:
                self.ten_env.log_info(
                    f"KEYPOINT Received task finished event from StepFun TTS for request ID: {self.current_request_id}"
                )
                # Send TTS audio end event
                if (
                    self.sent_ts
                    and self.current_request_finished
                    and self.current_request_id
                ):
                    request_event_interval = int(
                        (datetime.now() - self.sent_ts).total_seconds() * 1000
                    )
                    duration_ms = self._calculate_audio_duration_ms()
                    await self.send_tts_audio_end(
                        self.current_request_id,
                        request_event_interval,
                        duration_ms,
                        self.current_turn_id,
                    )
                    await self.client.cancel()
                    # Reset state for the next request
                    self.current_request_id = None
                    self.sent_ts = None
                    self.total_audio_bytes = 0
                    self.first_chunk = True
                    self.ten_env.log_info(
                        f"KEYPOINT Sent TTS audio end event, interval: {request_event_interval}ms, duration: {duration_ms}ms"
                    )

        except Exception as e:
            self.ten_env.log_error(f"Error in _handle_audio_data: {e}")

    async def _handle_transcription(self, transcription: TTSTextResult) -> None:
        """Handle transcription data callback"""
        try:
            transcription_str = transcription.model_dump_json()
            self.ten_env.log_info(
                f"send tts_text_result: {transcription_str} of request id: {transcription.request_id}",
                category=LOG_CATEGORY_KEY_POINT,
            )

            await self.send_tts_text_result(transcription)

        except Exception as e:
            self.ten_env.log_error(f"Failed to handle transcription: {e}")

    @staticmethod
    def _get_error_type_from_code(error_code: int) -> ModuleErrorCode:
        """Determine the error type based on the error code"""
        fatal_error_codes = {
            -100,  # handshake failed
        }

        if error_code in fatal_error_codes:
            return ModuleErrorCode.FATAL_ERROR
        else:
            return ModuleErrorCode.NON_FATAL_ERROR

    async def _send_tts_error_for_exception(
        self, exception: StepFunTTSTaskFailedException
    ) -> None:
        """Unified method for sending TTS exceptions"""
        # Create appropriate error based on error code
        error_code = self._get_error_type_from_code(exception.error_code)

        # Send TTS error with vendor info
        await self.send_tts_error(
            self.current_request_id or "",
            ModuleError(
                message=exception.error_msg,
                module=ModuleType.TTS,
                code=int(error_code),
                vendor_info=ModuleErrorVendorInfo(
                    vendor=self.vendor(),
                    code=str(exception.error_code),
                    message=exception.error_msg,
                ),
            ),
        )

    def _handle_tts_error(
        self, exception: StepFunTTSTaskFailedException
    ) -> None:
        """Handle internal TTS error callback"""
        try:
            self.ten_env.log_error(f"TTS internal error: {exception}")

            # Use the shared error handling method
            asyncio.create_task(self._send_tts_error_for_exception(exception))

        except Exception as e:
            self.ten_env.log_error(f"Failed to handle TTS error callback: {e}")
