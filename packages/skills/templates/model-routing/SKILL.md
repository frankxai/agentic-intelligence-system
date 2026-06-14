---
name: model-routing
description: Intelligent model selection - routes tasks to Haiku (fast/cheap), Sonnet (balanced), or Opus (complex/strategic) based on task complexity analysis
triggers:
  - model
  - routing
  - optimize
  - cost
  - haiku
  - sonnet
  - opus
priority: high
version: 1.0.0
source: claude-flow
---

# Model Routing System

You have access to intelligent model routing. Before executing any task, analyze complexity and route to the appropriate model tier.

## Routing Decision Matrix

```
TASK COMPLEXITY ANALYSIS
────────────────────────────────────────────────────────────────

HAIKU (Fast, Cheap) - Use for:
├── Simple file operations (read, list, navigate)
├── Scaffolding and boilerplate generation
├── Deterministic transformations (format, lint, compile)
├── Status checks and health monitoring
├── SEO metadata generation
├── Deployment commands (after code is written)
├── Documentation formatting
├── Simple search and replace
│
│   Token cost: ~$0.25/1M input, $1.25/1M output
│   Latency: Fastest
│   Use when: Task has clear, unambiguous steps

SONNET (Balanced) - Use for:
├── Feature implementation (standard complexity)
├── Bug fixes requiring analysis
├── Content writing (articles, social posts)
├── Code review and quality checks
├── Test generation
├── Refactoring with clear patterns
├── API integration work
├── Database schema design
│
│   Token cost: ~$3/1M input, $15/1M output
│   Latency: Medium
│   Use when: Task requires reasoning but not deep strategy

OPUS (Strategic, Complex) - Use for:
├── Architecture decisions (system design)
├── Multi-agent coordination (council, swarm)
├── Strategic planning (business, product)
├── Complex debugging (multi-file, subtle bugs)
├── Security audits and vulnerability analysis
├── Enterprise AI system design
├── Book writing (narrative, character development)
├── Research synthesis (multiple sources)
├── Ambiguous requirements interpretation
│
│   Token cost: ~$15/1M input, $75/1M output
│   Latency: Slowest but most capable
│   Use when: Task requires reasoning, creativity, or strategy
```

## Cost Optimization

```
BEFORE (No routing):
  All tasks → Opus → $75/1M output tokens

AFTER (With routing):
  Simple tasks (40%) → Haiku  → $1.25/1M  = $0.50
  Medium tasks (45%) → Sonnet → $15/1M   = $6.75
  Complex tasks (15%) → Opus  → $75/1M   = $11.25
  ──────────────────────────────────────────────
  TOTAL: $18.50 vs $75 = 75% cost reduction
```
