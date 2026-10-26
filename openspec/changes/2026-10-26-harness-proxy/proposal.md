## Why

Developers frequently maintain multiple AI coding subscriptions (Cursor, Antigravity, OpenCode Go) to avoid downtime and access top-tier models. However, juggling these subscriptions manually leads to unspent quotas, abrupt rate-limit interruptions, and cognitive overhead. Currently, no unified mechanism allows an AI coding agent to delegate sub-tasks to other installed coding harnesses while optimizing quota consumption. By introducing `harness-proxy`, agents can programmatically delegate tasks to the most cost-effective harness in an isolated Git worktree based on real-time quota balances and benchmark-backed model tiers, maximizing subscription ROI while preventing workspace collision.

## What Changes

**New Skill & CLI (`harness-proxy`)**
- Introduces `skills/engineering/harness-proxy/SKILL.md` exposing the `harness-proxy` tool for agent use and shell CLI invocation.
- Adds a standalone Go CLI engine (`tools/harness-proxy/`) compiling to a single zero-dependency binary supporting headless runs for Cursor (`agent -p`), Antigravity (`agy -p`), and OpenCode Go (`opencode run`).

**Configuration & State Layer**
- Implements two-tier XDG configuration (`~/.config/harness-proxy/` and repo-level `.harness-proxy.yaml`).
- Implements persistent local quota ledger (`ledger.json`) tracking token spend and consumption history alongside cached provider quota checks.

**Model Tiering & Benchmark Sync**
- Adds `tiers.yaml` defining model classifications across `frontier`, `workhorse`, and `lightweight` tiers.
- Adds periodic background synchronization against Artificial Analysis / LiveCodeBench APIs (7-day TTL cache) with manual `sync-models` command.

**Worktree Sandbox & Git Merge Lifecycle**
- Implements ephemeral Git worktree management on `harness/<task-id>` for sub-task execution.
- Implements automated commit on completion, clean auto-merge into active branches, and conflict reporting when merges clash.

## Capabilities

### New Capabilities

- `harness-delegation`: Spawns and manages headless child harness executions inside ephemeral Git worktrees, handling auto-commit, clean branch merging, and conflict reporting.
- `quota-monitoring`: Discovers and tracks subscription allowances across Cursor, Antigravity, and OpenCode Go via local session credentials and a persistent fallback ledger.
- `model-tiering`: Classifies tasks by complexity using a configurable Jev endpoint and routes them to models mapped into Frontier, Workhorse, and Lightweight tiers synchronized against public benchmark APIs.

### Modified Capabilities

- `skill-catalog`: Registers `harness-proxy` in `skills/engineering/skills.json` as an official local engineering skill.

## Impact

- **New Files**: `skills/engineering/harness-proxy/SKILL.md`, `skills/engineering/harness-proxy/scripts/install.sh`, `skills/engineering/harness-proxy/scripts/install.ps1`, `tools/harness-proxy/go.mod`, `tools/harness-proxy/cmd/harness-proxy/main.go`, and internal Go packages under `tools/harness-proxy/internal/`.
- **Manifest Updates**: `skills/engineering/skills.json` updated with the new skill entry.
- **Dependencies**: Go standard library (`os/exec`, `net/http`, `encoding/json`) plus standard YAML library (`gopkg.in/yaml.v3`); zero external runtime dependencies.
- **System Requirements**: Go 1.22+ for building, Git, and at least one local harness installed (`agent`, `agy`, or `opencode`).
