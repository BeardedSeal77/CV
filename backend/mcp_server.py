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
import frontmatter

sys.path.insert(0, str(Path(__file__).resolve().parent))

from mcp import types  # noqa: E402
from mcp.server.lowlevel import Server  # noqa: E402
from mcp.server.streamable_http_manager import StreamableHTTPSessionManager  # noqa: E402
from mcp.server.transport_security import TransportSecuritySettings  # noqa: E402

from jobs.model.profile import read_letter_rules, read_profile  # noqa: E402
from utils.errors import ActionError  # noqa: E402
from utils.maps import describe  # noqa: E402
from utils.pipeline import dispatch  # noqa: E402

INSTRUCTIONS = """Ed's job hunt board and CV. Jobs move through columns backlog -> applied ->
interview -> accepted / declined. not_interested holds roles Ed chose to skip;
expired holds listings that closed before he applied: by hand, or on their own
once a job's optional deadline (the listing's closing date) passes. Set a
deadline only when the listing gives one. Every job has an interest (High, Medium, Low) that groups the
board into bands; set it with jobs_update. Moves follow the
application lifecycle; pass correction=true only to fix a mistake.
Workflows, each also a prompt here:
- finding jobs: jobs_add each listing (it refuses duplicates);
- draft_cover_letter: jobs_letter_brief, write, jobs_set_letter, move to Ready;
- apply_to_job: jobs_next_to_apply, jobs_application_packet, fill the form, Ed
  confirms the submit, then jobs_record_application;
- triage_inbox: jobs_find_by_email for each reply, jobs_log_event with
  source "gmail:<thread id>".
Never create accounts, enter passwords, submit without Ed's yes, or invent answers."""

PROMPTS_DIR = Path(__file__).resolve().parent / "prompts"


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


# Prompts: the agent workflows, one Markdown file each in prompts/ (frontmatter
# gives the description and arguments; {argument} in the body is filled in)
def _load_prompts() -> dict:
    out = {}
    for path in sorted(PROMPTS_DIR.glob("*.md")):
        doc = frontmatter.load(path)
        out[path.stem] = {
            "description": doc.metadata.get("description", ""),
            "arguments": doc.metadata.get("arguments") or {},
            "body": doc.content.strip(),
        }
    return out


@server.list_prompts()
async def list_prompts() -> list[types.Prompt]:
    return [
        types.Prompt(
            name=name,
            description=p["description"],
            arguments=[types.PromptArgument(name=k, description=v, required=False) for k, v in p["arguments"].items()],
        )
        for name, p in _load_prompts().items()
    ]


@server.get_prompt()
async def get_prompt(name: str, arguments: dict[str, str] | None) -> types.GetPromptResult:
    prompt = _load_prompts().get(name)
    if prompt is None:
        raise ValueError(f"Unknown prompt: {name}")
    body = prompt["body"]
    for key in prompt["arguments"]:
        value = (arguments or {}).get(key) or ("the last 14 days" if key == "since" else "(not given)")
        body = body.replace("{" + key + "}", value)
    return types.GetPromptResult(
        description=prompt["description"],
        messages=[types.PromptMessage(role="user", content=types.TextContent(type="text", text=body))],
    )


# Resources: the profile, the letter rules, CV sections and jobs, readable by URI
@server.list_resources()
async def list_resources() -> list[types.Resource]:
    return [
        types.Resource(uri="jobs://profile", name="profile", description="Ed's standard application answers", mimeType="application/json"),
        types.Resource(uri="jobs://letter-rules", name="letter-rules", description="How Ed's cover letters are written", mimeType="text/markdown"),
    ]


@server.list_resource_templates()
async def list_resource_templates() -> list[types.ResourceTemplate]:
    return [
        types.ResourceTemplate(uriTemplate="jobs://job/{id}", name="job", description="One job with its timeline, description and letter", mimeType="application/json"),
        types.ResourceTemplate(uriTemplate="cv://section/{name}", name="cv-section", description="A CV section as Markdown, e.g. cv://section/about", mimeType="text/markdown"),
    ]


@server.read_resource()
async def read_resource(uri) -> str:
    uri = str(uri)

    def read() -> str:
        if uri == "jobs://profile":
            return json.dumps(read_profile(), ensure_ascii=False, indent=2)
        if uri == "jobs://letter-rules":
            return read_letter_rules()
        if uri.startswith("jobs://job/"):
            return json.dumps(dispatch("jobs.get", {"id": uri.removeprefix("jobs://job/")}), ensure_ascii=False, indent=2)
        if uri.startswith("cv://section/"):
            return dispatch("cv.get_section", {"name": uri.removeprefix("cv://section/")})["content"]
        raise ValueError(f"Unknown resource: {uri}")

    return await anyio.to_thread.run_sync(read)


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
