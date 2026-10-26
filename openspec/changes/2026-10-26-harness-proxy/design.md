## Context

Developers working across multiple AI coding subscriptions (Cursor, Antigravity, OpenCode Go) encounter rate limits, idle unspent monthly allowances, and fragmented context. While tools like `opencode-quotas` allow reading quota usage and single-vendor CLI runners support subagents in worktrees, there is no vendor-neutral proxy that dynamically evaluates task complexity, checks live multi-subscription allowances, provisions isolated Git worktrees, and executes child tasks headlessly with auto-merge.

`harness-proxy` bridges this gap as an Agent Skill and command-line tool. It abstracts child harness CLIs (`agent`, `agy`, `opencode`) behind a unified delegation interface, routing tasks based on a two-pass classification engine (Jev) and a live model capability matrix (`tiers.yaml`) synchronized against coding benchmarks.

## Architecture

[Container diagram](./diagrams/harness-proxy.drawio)

The system is organized into modular packages:
- **CLI & Dispatcher (`tools/harness-proxy/cmd/harness-proxy/main.go`):** Parses command flags and agent tool invocations, orchestrates the delegation pipeline, and reports results.
- **Jev Task Classifier (`tools/harness-proxy/internal/jev/`):** Evaluates task prompts against a local small model (Ollama/llama.cpp) or remote endpoint to determine the appropriate tier (`frontier`, `workhorse`, `lightweight`).
- **Quota & Routing Engine (`tools/harness-proxy/internal/quota/`, `tools/harness-proxy/internal/tiers/`):** Queries local provider token caches and live endpoints in parallel via goroutines, consults the tier matrix, selects the optimal target harness, and handles tier-level failover.
- **Worktree Sandbox Manager (`tools/harness-proxy/internal/worktree/`, `tools/harness-proxy/internal/driver/`):** Mounts temporary Git worktrees on branch `harness/<task-id>`, executes target harness CLIs headlessly, verifies results, and manages branch commits and merges.
- **Local State Store:** Maintains persistent state in `~/.config/harness-proxy/` (`config.yaml`, `tiers.yaml`, `ledger.json`, benchmark cache).

## Goals / Non-Goals

**Goals:**
- Provide a single `harness-proxy` Agent Skill and CLI tool for cross-subscription task delegation.
- Support headless execution for Cursor (`agent -p`), Antigravity (`agy -p`), and OpenCode Go (`opencode run`) with automated permission handling.
- Maintain a local model tiering matrix (`tiers.yaml`) synchronized against Artificial Analysis / LiveCodeBench APIs with a 7-day TTL cache.
- Run all delegated tasks in isolated Git worktrees with clean auto-commit and active branch auto-merging (preserving task branches on conflict).
- Track usage through a hybrid model: live provider queries where tokens exist, backed by a persistent local token ledger (`ledger.json`).
- Provide automatic failover within the requested tier and fallback to the host agent when subscriptions are exhausted.

**Non-Goals:**
- Docker / container sandboxing (deferred in favor of fast, repo-native Git worktrees).
- Remote headless token synchronization across machines (deferred to Phase 2; local interactive auth is assumed for MVP).
- In-process session hijacking of the calling agent (always executes as an isolated child CLI process to ensure clean worktree isolation).
- Replacing official provider CLIs or reimplementing raw internal HTTP/2 API protocols directly.

## Decisions

### D1: Implementation Language and Packaging
- **Choice**: Implement the CLI engine in **Go**, compiling to a single static zero-dependency binary, exposed to agents as the `harness-proxy` Agent Skill.
- **Reason**: Go binaries start in <10ms, have zero runtime dependencies on remote boxes/CI, provide robust standard libraries for process management (`os/exec`) and concurrent HTTP polling (goroutines for parallel quota queries across all 3 providers), and simplify cross-compilation.
- **Considered alternatives**:
  - *JavaScript / Node.js*: Rejected because of runtime dependency friction on remote boxes, slower startup time (~150ms V8 overhead), and `node_modules` distribution complexity.
  - *Standalone MCP / REST daemon*: Rejected due to environment restrictions (e.g., Cursor subscription environments blocking arbitrary MCP servers).

### D2: Child Process Execution Boundary
- **Choice**: Always spawn an isolated child CLI process (`agent -p`, `agy -p`, `opencode run`) inside a dedicated Git worktree.
- **Reason**: Eliminates complex in-session state hijacking, prevents workspace file collisions, and provides a uniform execution boundary regardless of which harness acts as the host.
- **Considered alternatives**:
  - *In-session execution when host matches target*: Rejected because in-session execution cannot isolate workspace modifications to a separate branch without risking dirty worktrees.
  - *PTY terminal automation (tmux/expect)*: Rejected because all three targets provide native headless non-interactive batch CLIs with JSON output formats.

### D3: Two-Pass Routing & Model Tiering
- **Choice**: Two-pass routing: Pass 1 uses a local Jev classifier endpoint (Ollama/llama.cpp with cheap cloud / heuristic fallback) to determine model tier; Pass 2 selects the best available provider with remaining quota in that tier.
- **Reason**: Decouples task difficulty from specific vendor models, enabling optimal quota burn across subscriptions.
- **Considered alternatives**:
  - *Cost-first waterfall*: Rejected because complex refactorings or architecture tasks routed to lightweight models fail and waste tokens.
  - *Static model assignment*: Rejected because model offerings and provider quotas fluctuate dynamically.

### D4: Worktree Merge & Conflict Lifecycle
- **Choice**: Auto-commit on task branch `harness/<task-id>` upon successful harness exit; attempt clean merge into active branch; if conflicts occur, abort the merge and return the branch name and conflicting files to the calling agent.
- **Reason**: Protects developer work from destructive overwrites while automating painless merges when files do not conflict.
- **Considered alternatives**:
  - *Apply uncommitted changes directly*: Rejected because broken or partial subagent runs leave dirty working trees that are hard to cleanly roll back.
  - *Force commit with conflict markers*: Rejected because it breaks compiler and linter states in the main workspace.

### D5: Benchmark Synchronization Engine
- **Choice**: Background synchronization against Artificial Analysis / LiveCodeBench JSON APIs with a 7-day TTL cache and manual `harness-proxy sync-models` command.
- **Reason**: Keeps model tier classifications current as frontier models update without incurring startup latency or fragile web scraping.
- **Considered alternatives**:
  - *Live query on every prompt*: Rejected due to network latency and unnecessary API calls.
  - *Static hardcoded tiers*: Rejected because model capabilities rapidly shift.

## Risks / Trade-offs

- **[Risk]** Target harness CLIs update their CLI flags or output JSON schemas.
  -> *Mitigation*: Encapsulate harness adapters behind a strict driver interface (`lib/harness-proxy/drivers/`) with integration test fixtures to detect CLI drift early.
- **[Risk]** Local session tokens in `~/.cursor` or `~/.config/opencode` expire or rotate.
  -> *Mitigation*: Hybrid quota tracking: if live queries fail with 401/403, immediately fall back to the local accounting ledger (`ledger.json`) and warn the user to refresh their CLI login.
- **[Risk]** Jev local endpoint (Ollama/llama.cpp) is offline or not installed.
  -> *Mitigation*: Fall back to a configured lightweight cloud API key (e.g. Gemini Flash / Claude Haiku); if offline, fall back to rule-based heuristics (file count, prompt length, keywords).
- **[Trade-off]** Git worktrees require disk space and a clean base commit.
  -> *Reason for acceptance*: Worktrees share the `.git` object database and create instantaneous local branch sandboxes without Docker overhead.

## Migration Plan

N/A — This is a greenfield skill and CLI tool. It does not alter existing database schemas or existing repository skills.

## Open Questions

None. All architectural and operational decisions were validated and agreed upon during grilling.
