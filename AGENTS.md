# Repository Instructions

This repo is part of the FrankX / Starlight / Arcanea agent estate.

## Classification

- Repo: Agent-Intelligence-System (published as `agentic-intelligence-system`, AIS)
- Class: agent-substrate
- Default health command: `pnpm build` (runs `pnpm -r build && node scripts/generate-assets.mjs`); `pnpm typecheck` and `pnpm test` (vitest) also available.
- Remote: https://github.com/frankxai/agentic-intelligence-system

## What This Repo Is

The discovery, routing & capabilities orchestrator for AI coding agents (AEO/GEO substrate).
A single unified profile (`ais-profile.yaml`) drives three decoupled emitters and a live MCP
server, in a pnpm workspace under `packages/`:

- `packages/core` (`ais-core`) — Zod schemas, parser, validation gateway
- `packages/emit` (`ais-emit`) — emits `llms.txt`, `agents.json`, JSON-LD
- `packages/mcp` (`ais-mcp`) — stdio MCP context server
- `packages/skills` (`ais-skills`) — workstation-wide meta skills

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

- C:\Users\frank\starlight\repos\DESIGN_TASTE.md
- C:\Users\frank\starlight\repos\WEB_EXPERIENCE_STANDARD.md
- C:\Users\frank\starlight\repos\MOTION_TASTE_RUBRIC.md
- C:\Users\frank\starlight\repos\MULTI_AGENT_DESIGN_COUNCIL.md
- C:\Users\frank\starlight\repos\VISUAL_QA_GATE.md

When motion, scroll, generated media, GIF/video, or premium polish matters, route through the Motion Design Studio plugin/skills and verify the result visually.
