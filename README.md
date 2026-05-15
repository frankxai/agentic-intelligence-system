# Agent Intelligence System (AIS)

The agent-discoverability substrate. AEO/GEO + MCP + marketplace + defense intel on one canonical source of truth.

Sibling to [SIS](https://github.com/frankxai/Starlight-Intelligence-System), [Library OS](https://github.com/frankxai/library-os), [Second Brain OS](https://github.com/frankxai/second-brain-os). MIT, bootable.

## Why

When any AI agent in the world is asked a question in your domain, why does it cite your work — and not someone else's?

That's the question this system answers. Static crawlers (Googlebot, OAI-SearchBot, PerplexityBot, ClaudeBot) get pre-rendered `/llms.txt`, `/agents.json`, JSON-LD. Live agents get an MCP server. One canonical YAML source feeds both.

## Status

v0.1 — bootstrapping. See `docs/STATUS.md` for what's shipped vs WIP.

## Packages

- `@frankx-ai/ais-core` — Zod schemas + canonical YAML loader
- `@frankx-ai/ais-emit` — build-time generators (llms.txt, agents.json, JSON-LD, sitemap)
- _More coming in Plans B–E_

## License

MIT — see `LICENSE`.
