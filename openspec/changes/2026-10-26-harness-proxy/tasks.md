## 1. Foundation & Configuration

- [x] 1.1 Initialize `go.mod` in `tools/harness-proxy/` and implement `tools/harness-proxy/internal/config/config.go` managing XDG paths (`~/.config/harness-proxy/`), `config.yaml`, and repo `.harness-proxy.yaml`
- [x] 1.2 Implement `internal/tiers/tiers.go` to parse and validate `tiers.yaml` (Frontier, Workhorse, Lightweight model mappings)
- [x] 1.3 Implement `internal/ledger/ledger.go` to record execution timestamps, token consumption, and status in `~/.config/harness-proxy/ledger.json`

## 2. Quota Discovery & Benchmark Sync

- [x] 2.1 Implement `internal/quota/quota.go` with concurrent goroutines for hybrid quota inspection (reading local credentials in `~/.cursor`, `~/.config/opencode`, Antigravity with fallback to ledger estimates)
- [x] 2.2 Implement `internal/benchmark/sync.go` querying Artificial Analysis / LiveCodeBench APIs with 7-day TTL caching
- [x] 2.3 Implement `harness-proxy quota` and `harness-proxy sync-models` subcommands in `cmd/harness-proxy/`

## 3. Jev Classifier & Routing Engine

- [x] 3.1 Implement `internal/jev/jev.go` for task complexity scoring against local Ollama/llama.cpp endpoints with cloud API / heuristic fallbacks
- [x] 3.2 Implement `internal/router/router.go` to resolve task tier to target harness based on quota availability and manage tier-level failover

## 4. Worktree Sandbox & Driver Execution

- [x] 4.1 Implement `internal/worktree/worktree.go` using `os/exec` to manage ephemeral Git worktrees on branch `harness/<task-id>`
- [x] 4.2 Implement child CLI drivers in `internal/driver/` for Cursor (`agent -p`), Antigravity (`agy -p`), and OpenCode Go (`opencode run`)
- [x] 4.3 Implement auto-commit and clean branch merge lifecycle in `internal/worktree/worktree.go`, aborting cleanly and preserving task branches on merge conflicts

## 5. CLI Binary & Skill Packaging

- [x] 5.1 Implement `cmd/harness-proxy/main.go` compiling to a single static binary and add build script / `Makefile` target
- [x] 5.2 Author `skills/engineering/harness-proxy/SKILL.md` with tool description and instructions for agent consumption
- [x] 5.3 Register `harness-proxy` in `skills/engineering/skills.json`

## 6. Verification

- [x] 6.1 Confirm canonical test command: `go test ./... && npm test && npm run validate`
- [x] 6.2 Write unit and integration tests covering worktree creation, driver execution, quota fallback, Jev classifier, and conflict abort

## 7. Documentation

- [x] 7.1 Update `README.md` documenting `harness-proxy` usage, prerequisites, and build/installation steps
- [x] 7.2 Ensure CLI provides comprehensive `--help` output and error diagnostics

## 8. Changelog

- [x] 8.1 Invoke `changelog-generator` to create changelog entry for this change
- [x] 8.2 Confirm entry covers `harness-delegation`, `quota-monitoring`, and `model-tiering` capabilities
