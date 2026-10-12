---
order: 2
title: DevTools
subtitle: "Developer Workbench • SQL-First • AI Agent Tooling"
featured: true
status: In daily use
tags:
  - Python
  - Flask
  - Next.js
  - MongoDB
  - Docker
  - MCP
features:
  - Schema as versioned documents
  - Reversible migrations, data preserved
  - Live architecture & BPM diagrams
  - Scenario tests with fixtures
  - Data-quality & health checks
  - MCP server for AI agents
  - Portable AI-agent setup
  - "Planning board: sagas to bugs"
  - Spec-to-code traceability
impact: "Developers and AI agents describe the change they want and DevTools writes the SQL, so nobody writes migrations by hand and an AI never touches the database directly."
---

A self-hosted development workbench that gives developers and AI coding agents full visibility into a process-driven Python codebase. It treats the database schema as versioned documents in a git-backed journal: each change is a single operation, applied to the development database straight away and compiled into a reversible migration. It reads each service's declared actions, events and processes and draws the architecture and business-process flows as live diagrams. Its planning board links every story and bug to the feature documentation, the commits and the AI cost spent on it, so each requirement can be traced from spec to code to test.
