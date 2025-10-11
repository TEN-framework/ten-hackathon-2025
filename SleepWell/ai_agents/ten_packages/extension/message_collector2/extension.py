#
#
# Agora Real Time Engagement
# Created by Wei Hu in 2024-08.
# Copyright (c) 2024 Agora IO. All rights reserved.
#
#
import asyncio
import uuid

from .helper import _text_to_base64_chunks
from ten_runtime import AsyncExtension, Data
from ten_runtime.async_ten_env import AsyncTenEnv

DATA_IN_MESSAGE = "message"
DATA_IN_FLUSH = "flush"
DATA_OUT_MESSAGE = "data"


class MessageCollector2Extension(AsyncExtension):
    def __init__(self, name: str):
        super().__init__(name)
        self.queue = asyncio.Queue[str]()
        self.loop = None
        self.stopped = False
        self.conversation_buffer = []
        self.session_id = str(uuid.uuid4())

    async def on_init(self, ten_env: AsyncTenEnv) -> None:
        ten_env.log_info("on_init")
        await super().on_init(ten_env)

        self.loop = asyncio.get_event_loop()

        # Start processing the queue in a background task
        asyncio.create_task(self._process_queue(ten_env))

    async def on_start(self, async_ten_env: AsyncTenEnv) -> None:
        async_ten_env.log_info("on_start")
        await super().on_start(async_ten_env)

    async def on_stop(self, async_ten_env: AsyncTenEnv) -> None:
        async_ten_env.log_info("on_stop")
        await super().on_stop(async_ten_env)
        self.stopped = True
        self.queue.put_nowait(None)

    async def on_deinit(self, async_ten_env: AsyncTenEnv) -> None:
        async_ten_env.log_info("on_deinit")
        await super().on_deinit(async_ten_env)

    async def on_data(self, ten_env: AsyncTenEnv, data: Data) -> None:
        name = data.get_name()

        if name == DATA_IN_MESSAGE:
            message, _ = data.get_property_to_json(None)
            try:
                # Generate a unique message ID for this batch of parts
                message_id = str(uuid.uuid4())[:8]
                chunks = _text_to_base64_chunks(ten_env, message, message_id)
                for chunk in chunks:
                    await self._queue_message(chunk)

            except Exception as e:
                ten_env.log_warn(f"on_data new_data error: {e}")
        elif name == DATA_IN_FLUSH:
            ten_env.log_info("Received flush command")
            # Clear the queue
            while not self.queue.empty():
                await self.queue.get()
                self.queue.task_done()
        else:
            ten_env.log_warn(f"Unknown data name: {name}")

    async def _queue_message(self, data: str):
        await self.queue.put(data)

    async def _process_queue(self, ten_env: AsyncTenEnv):
        while self.stopped is False:
            data = await self.queue.get()
            if data is None:
                break
            # process data
            ten_data = Data.create("data")
            ten_data.set_property_buf("data", data.encode())
            await ten_env.send_data(ten_data)
            self.queue.task_done()

            # Accumulate conversation for analysis
            try:
                import json
                data_dict = json.loads(data)
                if "text" in data_dict:
                    self.conversation_buffer.append(data_dict["text"])
            except:
                pass

            # Analyze conversation every 10 messages or when buffer gets large
            if len(self.conversation_buffer) >= 10 or (len(self.conversation_buffer) > 0 and len(" ".join(self.conversation_buffer)) > 500):
                await self._analyze_conversation(ten_env)
                self.conversation_buffer = []  # Reset buffer after analysis

            await asyncio.sleep(0.04)

    async def _analyze_conversation(self, ten_env: AsyncTenEnv):
        """Send conversation analysis command to smart_assistant"""
        try:
            conversation_text = " ".join(self.conversation_buffer)
            if len(conversation_text.strip()) == 0:
                return

            ten_env.log_info(f"Sending conversation for analysis: {len(conversation_text)} chars")

            # Create analyze_conversation command
            from ten_runtime import Cmd
            cmd = Cmd.create("analyze_conversation")
            cmd.set_property_string("conversation_text", conversation_text)
            cmd.set_property_string("session_id", self.session_id)

            await ten_env.send_cmd(cmd)

        except Exception as e:
            ten_env.log_error(f"Error analyzing conversation: {e}")
