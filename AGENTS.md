<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Working with the job hunt over MCP

- The MCP server's tools come from the backend's maps. After a redeploy, the
  Claude desktop app can keep the old tool list until it restarts: if a tool
  rejects a field its description names, or a new tool is missing, ask Ed to
  restart the app. `jobs_version` only fingerprints the data, not the code.
- Don't grep the whole repo root: `node_modules` makes it time out. Search
  `app components lib backend data` instead.
