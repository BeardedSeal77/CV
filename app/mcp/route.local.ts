// Streamable HTTP endpoint for the MCP server (local mode only). Stateless: a
// fresh server per request, so dev hot reloads never break a connected client.
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js"

import { createMcpServer } from "@/mcp/server"

async function handle(request: Request) {
  const server = createMcpServer({ baseUrl: new URL(request.url).origin })
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  })
  await server.connect(transport)
  return transport.handleRequest(request)
}

export { handle as GET, handle as POST, handle as DELETE }
