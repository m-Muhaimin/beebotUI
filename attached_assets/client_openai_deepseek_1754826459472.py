import asyncio
import sys
import json
from typing import Optional, Any, Dict, List
from contextlib import AsyncExitStack

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

import httpx

# Deepseek config (set your env vars or hardcode here)
DEEPSEEK_API_URL = "https://api.deepseek.com"  # Replace with actual Deepseek URL
DEEPSEEK_API_KEY = "sk-1414609620f448b6966346842d3b64db"  # Replace with your actual key
DEEPSEEK_MODEL = "deepseek-chat"  # Use the correct model name


class DeepseekClient:
    def __init__(self, base_url: str, api_key: str, timeout: int = 30):
        self.base_url = base_url
        self.api_key = api_key
        self.timeout = timeout
        self._client = httpx.AsyncClient(timeout=self.timeout)

    async def chat_stream(self, messages: List[Dict[str, str]]):
        # Stream chat completions from Deepseek API
        url = f"{self.base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": "deepseek-chat",
            "messages": messages,
            "stream": True
        }

        async with httpx.AsyncClient(timeout=None) as client:
            async with client.stream("POST", url, headers=headers, json=payload) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data_str = line[len("data: "):].strip()
                        if data_str == "[DONE]":
                            break
                        try:
                            data = json.loads(data_str)
                            yield data
                        except Exception:
                            pass

    async def close(self):
        await self._client.aclose()


class MCPClient:
    def __init__(self, server_script_path: str):
        self.server_script_path = server_script_path
        self.session: Optional[ClientSession] = None
        self.exit_stack = AsyncExitStack()
        self.deepseek = DeepseekClient(DEEPSEEK_API_URL, DEEPSEEK_API_KEY)

    async def connect_to_server(self):
        is_python = self.server_script_path.endswith(".py")
        if not is_python:
            raise ValueError("Server script must be a Python file (.py)")

        server_params = StdioServerParameters(
            command="python",
            args=[self.server_script_path],
            env=None,
        )

        stdio_transport = await self.exit_stack.enter_async_context(stdio_client(server_params))
        self.stdio, self.write = stdio_transport
        self.session = await self.exit_stack.enter_async_context(ClientSession(self.stdio, self.write))

        await self.session.initialize()

        response = await self.session.list_tools()
        tools = response.tools
        print("\nConnected to server with tools:", [tool.name for tool in tools])

    async def process_query(self, query: str):
        messages = [{"role": "user", "content": query}]
        print("\nStreaming response:")

        async for chunk in self.deepseek.chat_stream(messages):
            # Check if this chunk contains a tool call
            if "function_call" in chunk["choices"][0]["delta"]:
                # Extract function call info
                function_call = chunk["choices"][0]["delta"]["function_call"]
                tool_name = function_call.get("name")
                tool_args = function_call.get("arguments")

                # Call your local tool with these arguments
                tool_result = await self.call_tool(tool_name, tool_args)

                # Send tool result back to server as a message
                messages.append({
                    "role": "function",
                    "name": tool_name,
                    "content": tool_result
                })
                # You may need to restart or continue chat_stream with updated messages

            # Otherwise, print normal content
            content = chunk["choices"][0]["delta"].get("content")
            if content:
                print(content, end="", flush=True)

            if chunk["choices"][0].get("finish_reason") == "stop":
                break
        print()

    async def chat_loop(self):
        print("\nMCP Client Started (Deepseek)!")
        print("Type your queries or 'quit' to exit.")
        while True:
            query = input("\nQuery: ").strip()
            if query.lower() == "quit":
                break
            try:
                await self.process_query(query)
            except Exception as e:
                print(f"Error: {e}")

    async def cleanup(self):
        try:
            await self.exit_stack.aclose()
        except Exception:
            pass
        try:
            await self.deepseek.close()
        except Exception:
            pass


async def main():
    if len(sys.argv) < 2:
        print("Usage: python client_deepseek.py <path_to_server_script.py>")
        sys.exit(1)

    client = MCPClient(sys.argv[1])
    try:
        await client.connect_to_server()
        await client.chat_loop()
    finally:
        await client.cleanup()


if __name__ == "__main__":
    asyncio.run(main())
