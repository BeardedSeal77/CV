// stdio entry for MCP clients that can't connect by URL: `npm run mcp:stdio`.
// PDF building still prints from the local server (CV_LOCAL_URL, default :3000).
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"

import { createMcpServer } from "./server"

process.env.CV_MODE = "local"

const server = createMcpServer({
  baseUrl: process.env.CV_LOCAL_URL ?? "http://127.0.0.1:3000",
})
await server.connect(new StdioServerTransport())
