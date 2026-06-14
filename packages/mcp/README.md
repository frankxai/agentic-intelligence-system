# 🔌 @frankx-ai/ais-mcp

The Model Context Protocol (MCP) server for workstation capability, routing, and harness discoverability.

## Features
Exposes standard Model Context Protocol tools to connected LLMs:
* `list_agents` - Returns details about available workstation agent tools.
* `get_routing_recommendation` - Analyzes complexity (1-10) and recommends the best agent.
* `get_machine_capacity` - Returns memory and session capacity indicators.
* `get_repo_harness` - Looks up safety gates and verification scripts for a specific repository.

## Adding to Claude Desktop

```json
{
  "mcpServers": {
    "agent-intelligence-system": {
      "command": "node",
      "args": ["C:/Users/frank/Agent-Intelligence-System/packages/mcp/dist/index.js"],
      "env": {
        "AIS_PROFILE_PATH": "C:/Users/frank/Agent-Intelligence-System/ais-profile.yaml"
      }
    }
  }
}
```
