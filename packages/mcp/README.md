# @frankx-ai/ais-mcp

The Model Context Protocol (MCP) server for workstation capability, routing, and harness discoverability.

## Features
Exposes standard Model Context Protocol tools to connected LLMs:
* `list_agents` - Returns details about available workstation agent tools.
* `get_routing_recommendation` - Takes a complexity from 1 to 10 and returns an agent from the local runtime profile.
* `get_machine_capacity` - Returns the configured machine name and maximum parallel sessions.
* `get_repo_harness` - Looks up safety gates and verification scripts for a specific repository.

## Adding to Claude Desktop

Create a gitignored `ais-runtime.local.yaml` that satisfies `RuntimeProfileSchema` in `@frankx-ai/ais-core`. The public `ais-profile.yaml` does not contain the fields this server reads.

```json
{
  "mcpServers": {
    "agent-intelligence-system": {
      "command": "node",
      "args": ["/abs/path/to/agentic-intelligence-system/packages/mcp/dist/index.js"],
      "env": {
        "AIS_PROFILE_PATH": "/abs/path/to/agentic-intelligence-system/ais-runtime.local.yaml"
      }
    }
  }
}
```

Without a profile file the server starts with no agents configured and says so in the routing reason.
