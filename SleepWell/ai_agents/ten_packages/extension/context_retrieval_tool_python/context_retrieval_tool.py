import json
import aiohttp
from typing import Any
from dataclasses import dataclass

from ten_runtime import Cmd
from ten_runtime.async_ten_env import AsyncTenEnv
from ten_ai_base.config import BaseConfig
from ten_ai_base.types import (
    LLMToolMetadata,
    LLMToolMetadataParameter,
    LLMToolResult,
    LLMToolResultLLMResult,
)
from ten_ai_base.llm_tool import AsyncLLMToolBaseExtension

TOOL_NAME = "retrieve_context"
TOOL_DESCRIPTION = "Retrieve relevant context from user's personal data including todos, diary entries, and mood tracking"
TOOL_PARAMETERS = [
    LLMToolMetadataParameter(
        name="query",
        type="string",
        description="The search query to find relevant personal data",
        required=True,
    ),
]

PROPERTY_API_BASE = "api_base"


@dataclass
class ContextRetrievalToolConfig(BaseConfig):
    api_base: str = "http://localhost:9999"


class ContextRetrievalToolExtension(AsyncLLMToolBaseExtension):
    def __init__(self, name: str) -> None:
        super().__init__(name)
        self.session = None
        self.ten_env = None
        self.config: ContextRetrievalToolConfig = None

    async def on_init(self, ten_env: AsyncTenEnv) -> None:
        ten_env.log_debug("ContextRetrievalToolExtension on_init")
        self.session = aiohttp.ClientSession()

    async def on_start(self, ten_env: AsyncTenEnv) -> None:
        ten_env.log_debug("ContextRetrievalToolExtension on_start")

        self.config = await ContextRetrievalToolConfig.create_async(ten_env=ten_env)
        ten_env.log_info(f"ContextRetrievalToolExtension config: {self.config}")
        
        # Always register this tool
        await super().on_start(ten_env)
        self.ten_env = ten_env

    async def on_stop(self, ten_env: AsyncTenEnv) -> None:
        ten_env.log_debug("ContextRetrievalToolExtension on_stop")

        if self.session:
            await self.session.close()
            self.session = None

    async def on_deinit(self, ten_env: AsyncTenEnv) -> None:
        ten_env.log_debug("ContextRetrievalToolExtension on_deinit")

    async def on_cmd(self, ten_env: AsyncTenEnv, cmd: Cmd) -> None:
        cmd_name = cmd.get_name()
        ten_env.log_debug(f"ContextRetrievalToolExtension on_cmd: {cmd_name}")

        await super().on_cmd(ten_env, cmd)

    def get_tool_metadata(self, ten_env: AsyncTenEnv) -> list[LLMToolMetadata]:
        return [
            LLMToolMetadata(
                name=TOOL_NAME,
                description=TOOL_DESCRIPTION,
                parameters=TOOL_PARAMETERS,
            )
        ]

    async def run_tool(
        self, ten_env: AsyncTenEnv, name: str, args: dict
    ) -> LLMToolResult | None:
        ten_env.log_info(f"ContextRetrievalToolExtension run_tool name: {name}, args: {args}")
        
        if name == TOOL_NAME:
            result = await self._retrieve_context(args)
            return LLMToolResultLLMResult(
                type="llmresult",
                content=json.dumps(result),
            )
        return None

    async def _retrieve_context(self, args: dict) -> dict:
        """Call backend API to retrieve context"""
        try:
            query = args.get("query", "")
            url = f"{self.config.api_base}/api/retrieve-context"
            headers = {"Content-Type": "application/json"}
            data = {"query": query}

            async with self.session.post(url, json=data, headers=headers, timeout=10) as response:
                response.raise_for_status()
                result = await response.json()
                return result

        except Exception as e:
            self.ten_env.log_error(f"Context retrieval failed: {str(e)}")
            return {
                "todos": [],
                "diaries": [],
                "moods": []
            }