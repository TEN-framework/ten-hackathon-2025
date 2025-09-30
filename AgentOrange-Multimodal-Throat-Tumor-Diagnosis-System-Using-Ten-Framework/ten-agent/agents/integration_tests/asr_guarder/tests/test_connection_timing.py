#!/usr/bin/env python3
#
# This file is part of TEN Framework, an open source project.
# Licensed under the Apache License, Version 2.0.
# See the LICENSE file for more information.
#

from typing import Any
from typing_extensions import override
from ten_runtime import (
    AsyncExtensionTester,
    AsyncTenEnvTester,
    Data,
    AudioFrame,
    TenError,
    TenErrorCode,
)
import json
import asyncio
import os


# Constants for audio configuration
AUDIO_CHUNK_SIZE = 320
AUDIO_SAMPLE_RATE = 16000
FRAME_INTERVAL_MS = 10

# Constants for test configuration
CONNECTION_TIMING_CONFIG_FILE = "property_en.json"
CONNECTION_TIMING_SESSION_ID = "test_connection_timing_session_123"
CONNECTION_TIMING_EXPECTED_LANGUAGE = "en-US"


class ConnectionTimingAsrTester(AsyncExtensionTester):
    """Test class for ASR extension connection timing testing."""

    def __init__(
        self,
        audio_file_path: str,
        session_id: str = CONNECTION_TIMING_SESSION_ID,
        expected_language: str = CONNECTION_TIMING_EXPECTED_LANGUAGE,
    ):
        super().__init__()
        print("=" * 80)
        print("🧪 TEST CASE: Connection Timing ASR Test")
        print("=" * 80)
        print(
            "📋 Test Description: Validate ASR extension connection timing and basic functionality"
        )
        print("🎯 Test Objectives:")
        print("   - Verify ASR extension can process audio and return results")
        print("   - Validate required fields in ASR results")
        print("   - Check language detection accuracy")
        print("   - Ensure session ID consistency")
        print("=" * 80)

        self.audio_file_path: str = audio_file_path
        self.session_id: str = session_id
        self.expected_language: str = expected_language

    def _create_audio_frame(self, data: bytes, session_id: str) -> AudioFrame:
        """Create an audio frame with the given data and session ID."""
        audio_frame = AudioFrame.create("pcm_frame")

        # Set session_id in metadata according to API specification
        metadata = {"session_id": session_id}
        audio_frame.set_property_from_json("metadata", json.dumps(metadata))

        audio_frame.alloc_buf(len(data))
        buf = audio_frame.lock_buf()
        buf[:] = data
        audio_frame.unlock_buf(buf)
        return audio_frame

    async def _send_audio_file(self, ten_env: AsyncTenEnvTester) -> None:
        """Send audio file data to ASR extension."""
        ten_env.log_info(f"Sending audio file: {self.audio_file_path}")

        with open(self.audio_file_path, "rb") as audio_file:
            while True:
                chunk = audio_file.read(AUDIO_CHUNK_SIZE)
                if not chunk:
                    break

                audio_frame = self._create_audio_frame(chunk, self.session_id)
                await ten_env.send_audio_frame(audio_frame)
                await asyncio.sleep(FRAME_INTERVAL_MS / 1000)

    async def _send_finalize_signal(self, ten_env: AsyncTenEnvTester) -> None:
        """Send asr_finalize signal to trigger finalization."""
        ten_env.log_info("Sending asr_finalize signal...")

        # Create finalize data according to protocol
        finalize_data = {
            "finalize_id": f"finalize_{self.session_id}_{int(asyncio.get_event_loop().time())}",
            "metadata": {"session_id": self.session_id},
        }

        # Create Data object for asr_finalize
        finalize_data_obj = Data.create("asr_finalize")
        finalize_data_obj.set_property_from_json(
            None, json.dumps(finalize_data)
        )

        # Send the finalize signal
        await ten_env.send_data(finalize_data_obj)

        ten_env.log_info(
            f"✅ asr_finalize signal sent with ID: {finalize_data['finalize_id']}"
        )

    async def audio_sender(self, ten_env: AsyncTenEnvTester) -> None:
        """Send audio data and finalize signal to ASR extension."""
        try:
            # Send audio file
            ten_env.log_info("=== Starting audio send ===")
            await self._send_audio_file(ten_env)

            # Wait 1.5 seconds after sending audio
            ten_env.log_info("=== Waiting 1.5 seconds after audio send ===")
            await asyncio.sleep(1.5)

            # Send finalize signal after audio send
            ten_env.log_info("=== Sending finalize signal ===")
            await self._send_finalize_signal(ten_env)

            # Wait 1.5 seconds after sending finalize signal
            ten_env.log_info(
                "=== Waiting 1.5 seconds after finalize signal ==="
            )
            await asyncio.sleep(1.5)

        except Exception as e:
            ten_env.log_error(f"Error in audio sender: {e}")
            raise

    @override
    async def on_start(self, ten_env: AsyncTenEnvTester) -> None:
        """Start the ASR integration test."""
        ten_env.log_info("Starting ASR integration test")
        await self.audio_sender(ten_env)

    def _stop_test_with_error(
        self, ten_env: AsyncTenEnvTester, error_message: str
    ) -> None:
        """Stop test with error message."""
        ten_env.stop_test(
            TenError.create(TenErrorCode.ErrorCodeGeneric, error_message)
        )

    def _log_asr_result_structure(
        self,
        ten_env: AsyncTenEnvTester,
        json_str: str,
        metadata: Any,
    ) -> None:
        """Log complete ASR result structure for debugging."""
        ten_env.log_info("=" * 80)
        ten_env.log_info("RECEIVED ASR RESULT - COMPLETE STRUCTURE:")
        ten_env.log_info("=" * 80)
        ten_env.log_info(f"Raw JSON string: {json_str}")
        ten_env.log_info(f"Metadata: {metadata}")
        ten_env.log_info(f"Metadata type: {type(metadata)}")
        ten_env.log_info("=" * 80)

    def _validate_required_fields(
        self, ten_env: AsyncTenEnvTester, json_data: dict[str, Any]
    ) -> bool:
        """Validate that all required fields exist in ASR result."""
        required_fields = [
            "id",
            "text",
            "final",
            "start_ms",
            "duration_ms",
            "language",
        ]
        missing_fields = [
            field for field in required_fields if field not in json_data
        ]

        if missing_fields:
            self._stop_test_with_error(
                ten_env, f"Missing required fields: {missing_fields}"
            )
            return False
        return True

    def _validate_language(
        self, ten_env: AsyncTenEnvTester, json_data: dict[str, Any]
    ) -> bool:
        """Validate language matches expected language."""
        language: str = json_data.get("language", "")
        if language != self.expected_language:
            self._stop_test_with_error(
                ten_env,
                f"Language mismatch, expected: {self.expected_language}, actual: {language}",
            )
            return False
        return True

    def _validate_session_id(
        self, ten_env: AsyncTenEnvTester, metadata: dict[str, Any] | None
    ) -> bool:
        """Validate session_id in metadata."""
        if (
            not metadata
            or not isinstance(metadata, dict)
            or "session_id" not in metadata
        ):
            self._stop_test_with_error(
                ten_env, "Missing session_id field in metadata"
            )
            return False

        actual_session_id: str = metadata["session_id"]
        if actual_session_id != self.session_id:
            self._stop_test_with_error(
                ten_env,
                f"session_id mismatch, expected: {self.session_id}, actual: {actual_session_id}",
            )
            return False
        return True

    def _validate_final_result(
        self,
        ten_env: AsyncTenEnvTester,
        json_data: dict[str, Any],
        metadata: dict[str, Any] | None,
    ) -> bool:
        """Validate all fields for final ASR result."""
        validations = [
            lambda: self._validate_language(ten_env, json_data),
            lambda: self._validate_session_id(ten_env, metadata),
        ]

        return all(validation() for validation in validations)

    @override
    async def on_data(self, ten_env: AsyncTenEnvTester, data: Data) -> None:
        """Handle received data from ASR extension."""
        name: str = data.get_name()

        if name != "asr_result":
            ten_env.log_info(f"Received non-ASR data: {name}")
            return

        # Parse ASR result
        json_str, _ = data.get_property_to_json(None)
        json_data: dict[str, Any] = json.loads(json_str)

        # Validate required fields first
        if not self._validate_required_fields(ten_env, json_data):
            return

        # Check if this is a final result
        is_final: bool = json_data.get("final", False)
        ten_env.log_info(f"Received ASR result - final: {is_final}")

        if not is_final:
            ten_env.log_info("Received intermediate ASR result, continuing...")
            return

        # For final results, log complete structure and validate
        ten_env.log_info("Received final ASR result, validating...")
        self._log_asr_result_structure(
            ten_env, json_str, json_data.get("metadata")
        )

        # Validate final result - metadata is part of json_data according to API spec
        metadata_dict: dict[str, Any] | None = json_data.get("metadata")
        if self._validate_final_result(ten_env, json_data, metadata_dict):
            ten_env.log_info("✅ ASR integration test passed with final result")
            ten_env.stop_test()

    @override
    async def on_stop(self, ten_env: AsyncTenEnvTester) -> None:
        """Clean up resources when test stops."""
        ten_env.log_info("Test stopped")


def test_connection_timing(extension_name: str, config_dir: str) -> None:
    """Verify extension establishes connection after startup."""

    # Audio file path
    audio_file_path = os.path.join(
        os.path.dirname(__file__), "test_data/16k_en_us.pcm"
    )

    # Get config file path
    config_file_path = os.path.join(config_dir, CONNECTION_TIMING_CONFIG_FILE)
    if not os.path.exists(config_file_path):
        raise FileNotFoundError(f"Config file not found: {config_file_path}")

    # Load config file
    with open(config_file_path, "r") as f:
        config: dict[str, Any] = json.load(f)

    # Expected test results
    expected_result = {
        "language": CONNECTION_TIMING_EXPECTED_LANGUAGE,
        "session_id": CONNECTION_TIMING_SESSION_ID,
    }

    # Log test configuration
    print(f"Using test configuration: {config}")
    print(f"Audio file path: {audio_file_path}")
    print(
        f"Expected results: language='{expected_result['language']}', session_id='{expected_result['session_id']}'"
    )

    # Create and run tester
    tester = ConnectionTimingAsrTester(
        audio_file_path=audio_file_path,
        session_id=expected_result["session_id"],
        expected_language=expected_result["language"],
    )

    tester.set_test_mode_single(extension_name, json.dumps(config))
    error = tester.run()

    # Verify test results
    assert (
        error is None
    ), f"Test failed: {error.error_message() if error else 'Unknown error'}"
