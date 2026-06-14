---
name: agent-manager-skill
description: "Orchestrate, route, monitor, and hand off between AI coding agents (Claude Code, DeepAgent, Cursor, Codex, Grok, OpenCode, Antigravity) on the workstation. Triggers on: coding agent, route agent, handoff, model selector, machine status, session capacity."
priority: high
version: 1.0.0
---

# Workspace Coding Agent Orchestration (Agent Manager)

This skill provides first-principles guidance for selecting, executing, and handing off tasks between the active AI coding agents installed on this workstation.

---

## 🏛️ 1. Workstation Agent Fleet & Aliases

| Agent CLI/IDE | Command / Alias | Primary LLM | Context Window | Strength / Best For |
| :--- | :--- | :--- | :--- | :--- |
| **Claude Code** | `cl` | `claude-3-5-sonnet` | 200k / 8k | Repository exploration, TDD loops, multi-file refactors. |
| **DeepAgent** | `dcode` / `da` | Pluggable (Sonnet/GPT-4o) | Pluggable | Long-horizon tasks, sub-agent spawning, remote sandboxing. |
| **Cursor** | IDE (VS Code Fork) | Pluggable | 100k / 4k | Frontend layout, visual inline edits, human-in-the-loop writing. |
| **Codex CLI** | `cd` | `gpt-4o` | 128k / 4k | Benchmark accuracy, security audits, quick script changes. |
| **Grok CLI** | `gr` / `gk` | `grok-2` | 128k / 4k | Real-time web access, fast command shell automation. |
| **OpenCode** | `opencode` / `oa` | `groq/llama-4-scout` | 8k / 2k | Ultra-fast (<200ms latency) trivial checks and scratchpad edits. |
| **Antigravity** | `agy` / `ay` | `gemini-1.5-pro` | 1M - 2M | High-velocity workspace operations, cross-repo sync. |

---

## 🧠 2. First-Principles Routing Protocol (Selection Matrix)

Select the target agent based on the complexity level of the developer requirement:

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

1. **Complexity 1–3 (Trivial):** Single-file modifications, linting, packaging configuration changes, documentation updates.
   * *Recommendation:* Use **OpenCode** (`oa`) or **Codex** (`cd`) to minimize cost and enjoy sub-second response times.
2. **Complexity 4–6 (Medium):** CSS adjustments, interactive API design, React layout adjustments, or tasks requiring human visual feedback.
   * *Recommendation:* Use **Cursor** or **Cline** to enable step-by-step human verification of changes.
3. **Complexity 7–8 (High):** Multi-file refactors, deep codebase search, test suite debugging, system package upgrades.
   * *Recommendation:* Use **Claude Code** (`cl`) or **Antigravity** (`agy`) for deep context ingestion and autonomous reasoning loops.
4. **Complexity 9–10 (Substrate/Long-Horizon):** Sub-agent delegation, complex planning, remote sandboxed execution, internet research.
   * *Recommendation:* Use **DeepAgent** (`dcode` / `da`) for robust state saving, long logs compaction, and agent swarming.

---

## 🖥️ 3. Machine Capacity & Session Watchdog (Yoga Laptop)

When starting a session or performing heavy operations, respect the workstation's resources:
* **Status Readout:** Read machine health from [MACHINE-STATUS.md](file:///C:/Users/frank/FrankX/docs/ops/MACHINE-STATUS.md).
* **Parallel Session Guidelines:**
  * **GREEN Zone:** RAM free ≥ 3 GB, Disk ≥ 20 GB. Run up to 6 concurrent sessions.
  * **YELLOW Zone:** RAM free 1.5–3 GB, Disk 10–20 GB. Finish open work; **do not spawn new sessions** or run heavy installs.
  * **RED Zone:** RAM free < 1.5 GB, Disk < 10 GB. Stop launching new agents. Run `/pp fix` or cleanup scripts to reclaim memory/disk.

---

## 📂 4. Repository Governance & Verification

Before executing changes in any repository, lookup its profile in the registry:
1. Check [REPO-REGISTRY.md](file:///C:/Users/frank/REPO-REGISTRY.md) for its branch, purpose, and verification command.
2. Check [repo-intentions.md](file:///C:/Users/frank/.agent-harness/repo-intentions.md) for harness rules.
3. **Verify:** Always run the repository's health/test command before declaring completion (e.g. `pnpm build`, `pnpm test`).

---

## ⚡ 5. Cross-Agent Handoff Protocol

When handing off work to a more capable agent (e.g., escalating from OpenCode to Claude Code because of context window exhaustion):

1. **Stage Current State:** Stage current progress using `git add .`.
2. **Write Handoff Document:** Create a `HANDOVER.md` in the repo root using this frontmatter:
   ```yaml
   repo: <repo-name>
   branch: <feature-branch>
   risk: <production|private|library|template>
   health: <health-check-command>
   dirty_worktree: <true|false>
   production_push_allowed: <true|false>
   ```
   Provide a concise list of:
   * Current progress
   * Blockages and errors encountered
   * Explicit next steps
3. **Execute Handoff Command:** Start the target agent using its repository shortcut:
   ```powershell
   # OpenCode handoff to Claude Code for Arcanea ecosystem work
   clarc -n "Resolve test failures documented in HANDOVER.md"
   ```
