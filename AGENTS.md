# Repository Instructions

This repo is part of the FrankX / Starlight / Arcanea agent estate.

## Classification

- Repo: Agent-Intelligence-System (published as `agentic-intelligence-system`, AIS)
- Class: agent-substrate
- Default health command: `pnpm build` (runs `pnpm -r build && node scripts/generate-assets.mjs`); `pnpm typecheck` and `pnpm test` (vitest) also available.
- Remote: https://github.com/frankxai/agentic-intelligence-system

## What This Repo Is

The discovery, routing & capabilities orchestrator for AI coding agents (AEO/GEO substrate).

**Boundary — what AIS is not.** AIS is the public-safe *discovery, AEO/GEO, capability-routing and
workspace-legibility* layer. It is **not** a memory system (that is Second Brain OS / starlight-memory)
and **not** an orchestration UI (that is the queen dispatcher and the Observatory). AIS answers three
questions and stops: what can this repository do, which capability does this request route to, and what
is the citation. Execution belongs to whatever runtime the caller already has.

Repository and team identity are owned by the **AI Capability Registry**
(`frankxai/ai-capability-registry`), which defines the portable contracts `starlight.repo_profile.v2`
and `starlight.team_profile.v2`. AIS binds to them by reference — it never re-declares their canonical
schema and never republishes registry content, because the registry is private and AIS is public.
`node bin/ais.mjs drift . --registry <path>` reports divergence.
A single unified profile (`ais-profile.yaml`) drives three decoupled emitters and a live MCP
server, in a pnpm workspace under `packages/`:

- `packages/core` (`ais-core`) — Zod schemas, parser, validation gateway
- `packages/emit` (`ais-emit`) — emits `llms.txt`, `agents.json`, JSON-LD
- `packages/mcp` (`ais-mcp`) — stdio MCP context server
- `packages/skills` (`ais-skills`) — workstation-wide meta skills
- `lib/ais/` — **AIS.v1**: nine node types, the sanitizer, `scan()`, the route resolver, the receipt
  writer, the registry drift check, and the MCP tool definitions. Dependency-free ESM: it runs under
  plain `node` with no install, which is the point — a discovery layer that needs a build step is not
  the first thing an agent can reach for. `node bin/ais.mjs` is its CLI; `node --test "tests/*.test.mjs"`
  is its suite.

Sibling to Starlight Intelligence System (SIS), Library OS, and Second Brain OS — AIS is the
*discoverability* substrate that makes a workspace legible and routable to every agent that
touches it.

## Agent Rules

- Read this file before making changes.
- Preserve existing user work and unrelated dirty files.
- Keep edits scoped to the requested task.
- Prefer existing repo conventions over new abstractions.
- Run the health command before handoff when feasible.
- Do not publish secrets, private memory, credentials, or internal-only strategy.

## Class-Specific Guidance

- This is agent-substrate: `ais-profile.yaml` is the source of truth — emitted artifacts
  (`llms.txt`, `agents.json`, `jsonld.json`) are generated, not hand-edited.
- Uses pnpm workspaces (`pnpm-workspace.yaml`) — do not introduce npm/yarn commands or lockfiles.
- Preserve skill/plugin/MCP schemas and frontmatter.
- Validate skills, manifests, scripts, and generated registries after edits.
- Keep public/private memory boundaries explicit.

## Handoff

Summarize changed files, validation run, risks, and any follow-up needed.

## Design Taste Kernel

For any site, app, landing page, dashboard, visual identity, brand, motion, media, social, or frontend task, apply the shared Design Taste Kernel before handoff:

- C:\Users\frank\starlight\repos\design-agent-standards\DESIGN_TASTE.md
- C:\Users\frank\starlight\repos\design-agent-standards\WEB_EXPERIENCE_STANDARD.md
- C:\Users\frank\starlight\repos\design-agent-standards\MOTION_TASTE_RUBRIC.md
- C:\Users\frank\starlight\repos\design-agent-standards\MULTI_AGENT_DESIGN_COUNCIL.md
- C:\Users\frank\starlight\repos\design-agent-standards\VISUAL_QA_GATE.md

When motion, scroll, generated media, GIF/video, or premium polish matters, route through the Motion Design Studio plugin/skills and verify the result visually.
