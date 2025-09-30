#
#
# Agora Real Time Engagement
# Created by Wei Hu in 2024-08.
# Copyright (c) 2024 Agora IO. All rights reserved.
#
#
import asyncio
from typing import AsyncGenerator

from ten_ai_base.llm2 import AsyncLLM2BaseExtension
from ten_ai_base.struct import LLMRequest, LLMResponse
from ten_runtime.async_ten_env import AsyncTenEnv

from .openai import OpenAIChatGPT, OpenAILLM2Config


class OpenAILLM2Extension(AsyncLLM2BaseExtension):
    def __init__(self, name: str):
        super().__init__(name)
        self.memory = []
        self.memory_cache = []
        self.config = None
        self.client = None
        self.sentence_fragment = ""
        self.tool_task_future: asyncio.Future | None = None
        self.users_count = 0
        self.last_reasoning_ts = 0

    async def on_init(self, ten_env: AsyncTenEnv) -> None:
        ten_env.log_info("on_init")
        await super().on_init(ten_env)

    async def on_start(self, async_ten_env: AsyncTenEnv) -> None:
        async_ten_env.log_info("on_start")
        await super().on_start(async_ten_env)
        config_json, _ = await self.ten_env.get_property_to_json("")
        self.config = OpenAILLM2Config.model_validate_json(config_json)

        # Mandatory properties
        if not self.config.api_key:
            async_ten_env.log_info("API key is missing, exiting on_start")
            return

        # Create instance
        try:
            self.client = OpenAIChatGPT(async_ten_env, self.config)
            async_ten_env.log_info(
                f"initialized with max_tokens: {self.config.max_tokens}, model: {self.config.model}"
            )
        except Exception as err:
            async_ten_env.log_info(f"Failed to initialize OpenAIChatGPT: {err}")

    async def on_stop(self, async_ten_env: AsyncTenEnv) -> None:
        async_ten_env.log_info("on_stop")
        await super().on_stop(async_ten_env)

    async def on_deinit(self, async_ten_env: AsyncTenEnv) -> None:
        async_ten_env.log_info("on_deinit")
        await super().on_deinit(async_ten_env)

    def on_call_chat_completion(
        self, async_ten_env: AsyncTenEnv, request_input: LLMRequest
    ) -> AsyncGenerator[LLMResponse, None]:
        return self.client.get_chat_completions(request_input)
