## Scope

Provide a local-first `harness-proxy` Agent Skill and CLI utility that routes AI coding sub-tasks across Cursor, Antigravity, and OpenCode Go based on task complexity, live quota availability, and benchmark tiers within isolated Git worktrees. Out of scope for this change: remote/headless credential synchronization across machines (Phase 2), containerized Docker sandboxing, and in-process host session hijacking.

## Language

**Harness proxy** (`promote`):
A unified dispatcher skill and CLI tool that accepts a coding sub-task, selects the most suitable external agent harness based on quota and complexity, and executes it in isolation.
_Avoid_: subagent forwarder, agent gateway

**Target harness** (`promote`):
An external AI coding environment or agent runner (specifically Cursor Agent CLI `agent`, Antigravity CLI `agy`, or OpenCode Go CLI `opencode`) invoked headlessly as a child worker.
_Avoid_: worker bot, slave agent

**Model tier** (`promote`):
A standardized capability classification (`frontier`, `workhorse`, `lightweight`) grouping models from different providers based on external coding benchmark percentiles.
_Avoid_: model level, intelligence grade

**Jev classifier** (`promote`):
A fast, lightweight task complexity evaluation engine running on a configurable endpoint (local Ollama/llama.cpp by default, falling back to cheap cloud models or heuristics) that scores task difficulty to assign a model tier.
_Avoid_: prompt router, complexity analyzer

**Quota ledger** (`promote`):
A persistent local storage store tracking token spend, timestamps, and estimated consumption against known provider allowances when live provider endpoints are unavailable.
_Avoid_: usage database, token tracker

**Worktree sandbox** (`promote`):
An ephemeral Git worktree created on branch `harness/<task-id>` where a target harness performs edits without touching the developer's active working tree.
_Avoid_: scratch directory, temp workspace

## Decisions

- **Packaging & Invocation:** Delivered as an Agent Skill + CLI utility (`harness-proxy`) allowing direct invocation by parent agents or manual terminal use.
- **Provider Targets:** Supports Cursor (`agent -p`), Antigravity (`agy -p`), and OpenCode Go (`opencode run`) using their native headless batch flags and JSON output formats.
- **Isolation Strategy:** Always spawns an isolated child process in a dedicated ephemeral Git worktree on branch `harness/<task-id>`.
- **Result Integration:** Child changes are auto-committed to `harness/<task-id>` and auto-merged into the active branch if clean. On merge conflict, the merge is aborted and the branch name with conflict details is returned to the calling agent.
- **Configuration Hierarchy:** Two-tier XDG structure (`~/.config/harness-proxy/` for global defaults, config, tiers, ledger, cache; `.harness-proxy.yaml` at repo root for optional overrides).
- **Model Classification & Maintenance:** `tiers.yaml` maps models to Frontier, Workhorse, and Lightweight tiers; kept up-to-date via periodic background sync (7-day TTL cache) against Artificial Analysis / LiveCodeBench APIs with manual `harness-proxy sync-models` trigger.
- **Routing Engine:** Two-pass evaluation: Jev assesses task complexity to choose a model tier, then the quota engine picks the provider with the best remaining balance.
- **Failover Policy:** Automatically fails over to the next provider within the same tier if quota is exhausted or a child run fails, falling back to the host harness if all subscriptions are dry.
- **Authentication:** Local-first for MVP, utilizing existing authenticated local sessions in `~/.cursor`, `~/.config/opencode`, and Antigravity.

## Open questions

- None. All major architectural forks, storage locations, failure modes, and lifecycle interactions were settled during grilling.

## Scenarios discussed

- **Clean Execution & Merge:** Child harness completes prompt in worktree -> changes committed -> merged to active branch -> summary returned to calling agent.
- **Merge Conflict:** Child harness edits overlapping active files -> auto-merge aborts -> worktree branch preserved -> calling agent receives conflict diff and branch reference to reconcile.
- **Quota Exhaustion & Failover:** Selected provider returns 429 / quota limit -> runner logs status to ledger -> re-routes to next provider in same tier -> succeeds without user intervention.
- **Unreachable Jev Classifier:** Local Ollama endpoint down -> runner falls back to configured lightweight cloud API; if offline, falls back to prompt length/file heuristic rules.
- **Benchmark Sync Expiration:** 7-day cache expires -> background fetch retrieves fresh Artificial Analysis percentiles -> updates `tiers.yaml` with newly released models while preserving user overrides.
