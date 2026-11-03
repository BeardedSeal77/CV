"""MCP server for agents: one tool per action in the services' maps (jobs.move
becomes jobs_move), each with the handler's own input schema and description.
Every call goes through the same pipeline as POST /api/actions/<name>.
Written against the mcp SDK version on the approved list (1.30).

  python mcp_server.py            Streamable HTTP on 127.0.0.1:5401/mcp (CV_MCP_PORT)
  python mcp_server.py --stdio    for clients that only take stdio
"""

import contextlib
import json
import os
import sys
from pathlib import Path

import anyio

sys.path.insert(0, str(Path(__file__).resolve().parent))

from mcp import types  # noqa: E402
from mcp.server.lowlevel import Server  # noqa: E402
from mcp.server.streamable_http_manager import StreamableHTTPSessionManager  # noqa: E402
from mcp.server.transport_security import TransportSecuritySettings  # noqa: E402

from utils.errors import ActionError  # noqa: E402
from utils.maps import describe  # noqa: E402
from utils.pipeline import dispatch  # noqa: E402

INSTRUCTIONS = """Ed's job hunt board and CV. Jobs move through columns backlog -> applied ->
interview -> accepted / declined (archived holds ruled-out roles). Typical flow:
jobs_add a listing you found, read the CV with cv_get_section, write a cover
letter with jobs_set_letter, then jobs_move it as it progresses. Moves follow the
application lifecycle; pass correction=true only to fix a mistake."""


def _tool_name(action: str) -> str:
    return action.replace(".", "_")


_ACTIONS = {_tool_name(a["name"]): a for a in describe()}

server = Server("cv-platform", version="2.0.0", instructions=INSTRUCTIONS)


@server.list_tools()
async def list_tools() -> list[types.Tool]:
    return [
        types.Tool(name=name, description=a["description"], inputSchema=a["input_schema"])
        for name, a in _ACTIONS.items()
    ]


# The pipeline validates every payload with the handler's own model
@server.call_tool(validate_input=False)
async def call_tool(name: str, arguments: dict) -> types.CallToolResult:
    action = _ACTIONS.get(name)
    if action is None:
        return _error(f"Unknown tool: {name}")
    try:
        # Handlers are synchronous (files, and Playwright's sync API for PDFs)
        result = await anyio.to_thread.run_sync(lambda: dispatch(action["name"], arguments or {}))
    except ActionError as err:
        return _error(str(err))
    text = json.dumps(result, ensure_ascii=False, indent=2)
    return types.CallToolResult(content=[types.TextContent(type="text", text=text)])


def _error(message: str) -> types.CallToolResult:
    return types.CallToolResult(content=[types.TextContent(type="text", text=message)], isError=True)


def http_app():
    from starlette.applications import Starlette
    from starlette.routing import Route

    extra = [h.strip() for h in os.environ.get("CV_ALLOWED_HOSTS", "").split(",") if h.strip()]
    hosts = ["127.0.0.1", "localhost", "[::1]", *extra]
    manager = StreamableHTTPSessionManager(
        app=server,
        json_response=True,
        stateless=True,
        security_settings=TransportSecuritySettings(
            enable_dns_rebinding_protection=True,
            allowed_hosts=[f"{h}:*" for h in hosts],
            allowed_origins=[f"http://{h}:*" for h in hosts],
        ),
    )

    class Endpoint:
        """A raw ASGI endpoint, so /mcp is served as is (a Mount redirects it to /mcp/)."""

        async def __call__(self, scope, receive, send):
            await manager.handle_request(scope, receive, send)

    @contextlib.asynccontextmanager
    async def lifespan(_app):
        async with manager.run():
            yield

    return Starlette(routes=[Route("/mcp", endpoint=Endpoint(), methods=["GET", "POST", "DELETE"])], lifespan=lifespan)


async def run_stdio():
    from mcp.server.stdio import stdio_server

    async with stdio_server() as (read, write):
        await server.run(read, write, server.create_initialization_options())


if __name__ == "__main__":
    if "--stdio" in sys.argv:
        anyio.run(run_stdio)
    else:
        import uvicorn

        uvicorn.run(
            http_app(),
            host=os.environ.get("CV_MCP_HOST", "127.0.0.1"),
            port=int(os.environ.get("CV_MCP_PORT", "5401")),
            log_level="warning",
        )
