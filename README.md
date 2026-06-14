# 🏛️ Agentic Intelligence System (AIS)

> The discovery, routing, and capabilities orchestrator for local and remote AI coding agents.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%23007ACC.svg)](https://www.typescriptlang.org/)
[![PNPM](https://img.shields.io/badge/pnpm-9.12.0-orange.svg)](https://pnpm.io/)
[![Model Context Protocol](https://img.shields.io/badge/MCP-Active-green.svg)](https://modelcontextprotocol.io/)

AIS is the discoverability substrate and multi-agent coordination layer. It ensures that when any AI agent in the world (crawlers, search engines, or active terminal processes) requests information in your domain, it discovers, cites, and correctly routes workflows to your codebase.

Sibling to [Starlight Intelligence System (SIS)](https://github.com/frankxai/Starlight-Intelligence-System), [Library OS](https://github.com/frankxai/library-os), and [Second Brain OS](https://github.com/frankxai/second-brain-os).

---

## 🗺️ Architectural Ecosystem

```
               ┌──────────────────────────────┐
               │    Unified Profile Schema    │
               │      (ais-profile.yaml)       │
               └──────────────┬───────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│    AIS Core     │  │    AIS Emit     │  │     AIS MCP     │
│  (Zod Schemas)  │  │  (llms.txt, etc)│  │ (Stdio Server)  │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              ▼
                 ┌───────────────────────────┐
                 │        AIS Skills         │
                 │ (agent-manager-skill, etc)│
                 └───────────────────────────┘
```

---

## 📦 Monorepo Packages

The system is split into four decoupled, compile-safe packages managed under a single `pnpm` workspace:

### 1. ⚙️ [`@frankx-ai/ais-core`](file:///C:/Users/frank/Agent-Intelligence-System/packages/core/README.md)
* **Purpose:** The parser and validation gateway.
* **Stack:** Zod schemas, TypeScript.
* **Responsibility:** Parses the unified [ais-profile.yaml](file:///C:/Users/frank/Agent-Intelligence-System/ais-profile.yaml) profile configuration, ensuring that agent specs, skill parameters, repository boundaries, and hardware capacity constraints comply with types.

### 2. 🖨️ [`@frankx-ai/ais-emit`](file:///C:/Users/frank/Agent-Intelligence-System/packages/emit/README.md)
* **Purpose:** Build-time SEO & discovery generators.
* **Responsibility:** Compiles structural documentation:
  * `llms.txt` — Discovery format for LLM search bots.
  * `agents.json` — Machine-readable workspace capabilities inventory.
  * `JSON-LD` — Schema.org structured metadata for website sitemaps.

### 3. 🔌 [`@frankx-ai/ais-mcp`](file:///C:/Users/frank/Agent-Intelligence-System/packages/mcp/README.md)
* **Purpose:** Live context exchange server.
* **Stack:** Model Context Protocol (MCP) Node.js SDK.
* **Responsibility:** Starts an MCP server on `stdio` to feed agent routing rules, workstation capacity constraints, and repository safety policies directly into your developer terminal sessions.

### 4. 🧠 [`@frankx-ai/ais-skills`](file:///C:/Users/frank/Agent-Intelligence-System/packages/skills/README.md)
* **Purpose:** Workstation-wide meta agent skills.
* **Responsibility:** Houses global workspace skills (e.g., `agent-manager-skill`, `model-routing`) and distributes them dynamically to the user's local directories (`~/.agents/skills/` and `~/.claude/skills/`).

---

## ⚡ 1. The Active Workstation Fleet & Routing Protocol

AIS establishes a first-principles task mapping system based on requirement complexity:

```
                            Task Complexity
  Trivial (1-3)            Medium (4-6)           High (7-8)          Substrate (9-10)
  ┌───────────┐            ┌───────────┐         ┌───────────┐         ┌───────────┐
  │ OpenCode  │            │  Cursor   │         │Claude Code│         │ DeepAgent │
  │   - or -  │    ───►    │   - or -  │   ───►  │   - or -  │   ───►  │   - or -  │
  │  Codex    │            │Cline (IDE)│         │Antigravity│         │Starlight  │
  └───────────┘            └───────────┘         └───────────┘         └───────────┘
   (Speed &                 (Interactive          (Autonomous           (Sub-Agent &
    Minimal Cost)            Refinement)           TDD Loops)            Delegation)
```

| Complexity Tier | Target Agent | Primary LLM | Recommended Task Types |
| :--- | :--- | :--- | :--- |
| **Complexity 1-3** | **OpenCode** / **Codex** | `groq/llama-4-scout` / `gpt-4o` | Single-file script edits, config file modernizations, formatting, and doc updates. |
| **Complexity 4-6** | **Cursor** / **Cline** | Pluggable | Interactive layouts, CSS styling, components refactoring, and UI adjustments. |
| **Complexity 7-8** | **Claude Code** / **Antigravity** | `claude-3-5-sonnet` / `gemini-1.5-pro` | Multi-file database refactors, test-driven iterations, and massive context digestion. |
| **Complexity 9-10** | **DeepAgent** / **SIS Swarm** | Custom / Pluggable | Long-horizon multi-step planning, remote sandbox runs, and agent swarms. |

---

## 🛠️ Getting Started

### Prerequisites

* Node.js >= 24
* PNPM 9.x

### Installation

```bash
# Clone the repository
git clone https://github.com/frankxai/Agent-Intelligence-System.git
cd Agent-Intelligence-System

# Install monorepo dependencies
pnpm install
```

### Build & Test

```bash
# Build all TS packages
pnpm build

# Run unit tests across packages
pnpm test
```

### Running the MCP Server locally

Add the server to your Claude Code / desktop config (`mcp.json`):

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

---

## 🏛️ License

MIT License — see the [LICENSE](file:///C:/Users/frank/Agent-Intelligence-System/LICENSE) file for details.
