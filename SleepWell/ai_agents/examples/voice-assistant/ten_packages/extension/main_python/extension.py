import asyncio
import json
import time
from typing import Literal

from .agent.decorators import agent_event_handler
from ten_runtime import (
    AsyncExtension,
    AsyncTenEnv,
    Cmd,
    Data,
)

from .agent.agent import Agent
from .agent.events import (
    ASRResultEvent,
    LLMResponseEvent,
    ToolRegisterEvent,
    UserJoinedEvent,
    UserLeftEvent,
)
from .helper import _send_cmd, _send_data, parse_sentences
from .config import MainControlConfig  # assume extracted from your base model

import uuid


class MainControlExtension(AsyncExtension):
    """
    The entry point of the agent module.
    Consumes semantic AgentEvents from the Agent class and drives the runtime behavior.
    """

    def __init__(self, name: str):
        super().__init__(name)
        self.ten_env: AsyncTenEnv = None
        self.agent: Agent = None
        self.config: MainControlConfig = None

        self.stopped: bool = False
        self._rtc_user_count: int = 0
        self.sentence_fragment: str = ""
        self.turn_id: int = 0
        self.session_id: str = "0"

    def _current_metadata(self) -> dict:
        return {"session_id": self.session_id, "turn_id": self.turn_id}

    async def on_init(self, ten_env: AsyncTenEnv):
        self.ten_env = ten_env

        # Load config from runtime properties
        config_json, _ = await ten_env.get_property_to_json(None)
        self.config = MainControlConfig.model_validate_json(config_json)

        self.agent = Agent(ten_env)

        # Now auto-register decorated methods
        for attr_name in dir(self):
            fn = getattr(self, attr_name)
            event_type = getattr(fn, "_agent_event_type", None)
            if event_type:
                self.agent.on(event_type, fn)

    # === Register handlers with decorators ===
    @agent_event_handler(UserJoinedEvent)
    async def _on_user_joined(self, event: UserJoinedEvent):
        self._rtc_user_count += 1
        if self._rtc_user_count == 1 and self.config and self.config.greeting:
            await self._send_to_tts(self.config.greeting, True)
            await self._send_transcript(
                "assistant", self.config.greeting, True, 100
            )

    @agent_event_handler(UserLeftEvent)
    async def _on_user_left(self, event: UserLeftEvent):
        self._rtc_user_count -= 1

    @agent_event_handler(ToolRegisterEvent)
    async def _on_tool_register(self, event: ToolRegisterEvent):
        await self.agent.register_llm_tool(event.tool, event.source)

    @agent_event_handler(ASRResultEvent)
    async def _on_asr_result(self, event: ASRResultEvent):
        self.session_id = event.metadata.get("session_id", "100")
        stream_id = int(self.session_id)
        if not event.text:
            return
        if event.final or len(event.text) > 2:
            await self._interrupt()
        if event.final:
            self.turn_id += 1
            await self.agent.queue_llm_input(event.text)
        await self._send_transcript("user", event.text, event.final, stream_id)

    @agent_event_handler(LLMResponseEvent)
    async def _on_llm_response(self, event: LLMResponseEvent):
        if not event.is_final and event.type == "message":
            sentences, self.sentence_fragment = parse_sentences(
                self.sentence_fragment, event.delta
            )
            for s in sentences:
                await self._send_to_tts(s, False)

        if event.is_final and event.type == "message":
            remaining_text = self.sentence_fragment or ""
            self.sentence_fragment = ""
            await self._send_to_tts(remaining_text, True)

        await self._send_transcript(
            "assistant",
            event.text,
            event.is_final,
            100,
            data_type=("reasoning" if event.type == "reasoning" else "text"),
        )

    async def on_start(self, ten_env: AsyncTenEnv):
        ten_env.log_info("[MainControlExtension] on_start")

    async def on_stop(self, ten_env: AsyncTenEnv):
        ten_env.log_info("[MainControlExtension] on_stop")
        self.stopped = True
        await self.agent.stop()

    async def _interrupt(self):
        """
        Interrupts ongoing LLM and TTS generation. Typically called when user speech is detected.
        """
        self.sentence_fragment = ""
        await self.agent.flush_llm()
        await _send_data(
            self.ten_env, "tts_flush", "tts", {"flush_id": str(uuid.uuid4())}
        )
        await _send_cmd(self.ten_env, "flush", "agora_rtc")
        self.ten_env.log_info("[MainControlExtension] Interrupt signal sent")

    async def on_cmd(self, ten_env: AsyncTenEnv, cmd: Cmd):
        cmd_name = cmd.get_name()
        ten_env.log_info(f"[MainControlExtension] on_cmd: {cmd_name}")

        if cmd_name == "conversation_analyzed":
            await self._on_conversation_analyzed(cmd)
        else:
            await self.agent.on_cmd(cmd)

    async def _on_conversation_analyzed(self, cmd: Cmd):
        """Enhanced conversation analysis results handling"""
        try:
            todos_json, _ = cmd.get_property_to_json("todos")
            mood_json, _ = cmd.get_property_to_json("mood")
            diary_summary, _ = cmd.get_property_string("diary_summary")

            self.ten_env.log_info(f"Enhanced conversation analyzed - Todos: {len(todos_json) if todos_json else 0}, Mood: {mood_json}, Summary: {diary_summary}")

            # Create a comprehensive summary response
            summary_parts = []
            
            # Handle todos with more detail
            if todos_json and len(todos_json) > 0:
                high_priority_count = sum(1 for todo in todos_json if todo.get("priority") == "high")
                if high_priority_count > 0:
                    summary_parts.append(f"I've identified {high_priority_count} high-priority task{'s' if high_priority_count > 1 else ''}")
                
                total_tasks = len(todos_json)
                if total_tasks > high_priority_count:
                    remaining = total_tasks - high_priority_count
                    summary_parts.append(f"and {remaining} other task{'s' if remaining > 1 else ''} from our conversation")
                
                # Mention categories if available
                categories = set(todo.get("category", "general") for todo in todos_json)
                if len(categories) > 1:
                    category_text = ", ".join(categories)
                    summary_parts.append(f"covering {category_text}")

            # Enhanced mood feedback
            if mood_json:
                mood_score = mood_json.get("score", 5)
                emotion = mood_json.get("emotion", "neutral")
                confidence = mood_json.get("confidence", 0.5)
                
                if confidence > 0.7:
                    confidence_text = "I'm quite confident that"
                elif confidence > 0.5:
                    confidence_text = "I believe"
                else:
                    confidence_text = "It seems"
                
                if mood_score >= 7:
                    mood_text = f"{confidence_text} you're feeling quite positive today, with {emotion} emotions and a mood score of {mood_score} out of 10."
                elif mood_score <= 3:
                    mood_text = f"{confidence_text} you might be going through a challenging time, with {emotion} feelings and a mood score of {mood_score} out of 10."
                else:
                    mood_text = f"{confidence_text} your emotional state is fairly balanced, showing {emotion} feelings with a mood score of {mood_score} out of 10."
                
                summary_parts.append(mood_text)

            # Enhanced diary handling
            if diary_summary:
                summary_parts.append("I've created a detailed summary of our conversation for your diary, capturing the key insights and emotional context.")

            # Send the comprehensive summary
            if summary_parts:
                full_summary = " ".join(summary_parts)
                await self._send_to_tts(full_summary, True)
            else:
                # Fallback message
                await self._send_to_tts("I've analyzed our conversation and will continue learning from our interactions to better assist you.", True)

        except Exception as e:
            self.ten_env.log_error(f"Error handling enhanced conversation analysis: {e}")
            # Fallback response
            await self._send_to_tts("I've processed our conversation and saved the relevant information.", True)

    async def on_data(self, ten_env: AsyncTenEnv, data: Data):
        await self.agent.on_data(data)

    # === helpers ===
    async def _send_transcript(
        self,
        role: str,
        text: str,
        final: bool,
        stream_id: int,
        data_type: Literal["text", "reasoning"] = "text",
    ):
        """
        Sends the transcript (ASR or LLM output) to the message collector.
        """
        if data_type == "text":
            await _send_data(
                self.ten_env,
                "message",
                "message_collector",
                {
                    "data_type": "transcribe",
                    "role": role,
                    "text": text,
                    "text_ts": int(time.time() * 1000),
                    "is_final": final,
                    "stream_id": stream_id,
                },
            )
        elif data_type == "reasoning":
            await _send_data(
                self.ten_env,
                "message",
                "message_collector",
                {
                    "data_type": "raw",
                    "role": role,
                    "text": json.dumps(
                        {
                            "type": "reasoning",
                            "data": {
                                "text": text,
                            },
                        }
                    ),
                    "text_ts": int(time.time() * 1000),
                    "is_final": final,
                    "stream_id": stream_id,
                },
            )
        self.ten_env.log_info(
            f"[MainControlExtension] Sent transcript: {role}, final={final}, text={text}"
        )

    async def _send_to_tts(self, text: str, is_final: bool):
        """
        Sends a sentence to the TTS system.
        """
        request_id = f"tts-request-{self.turn_id}"
        await _send_data(
            self.ten_env,
            "tts_text_input",
            "tts",
            {
                "request_id": request_id,
                "text": text,
                "text_input_end": is_final,
                "metadata": self._current_metadata(),
            },
        )
        self.ten_env.log_info(
            f"[MainControlExtension] Sent to TTS: is_final={is_final}, text={text}"
        )

    async def _interrupt(self):
        """
        Interrupts ongoing LLM and TTS generation. Typically called when user speech is detected.
        """
        self.sentence_fragment = ""
        await self.agent.flush_llm()
        await _send_data(
            self.ten_env, "tts_flush", "tts", {"flush_id": str(uuid.uuid4())}
        )
        await _send_cmd(self.ten_env, "flush", "agora_rtc")
        self.ten_env.log_info("[MainControlExtension] Interrupt signal sent")
