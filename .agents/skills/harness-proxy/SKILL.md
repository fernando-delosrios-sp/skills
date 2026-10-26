---
name: harness-proxy
description: Delegate sub-tasks across AI coding agent harnesses (Cursor, Antigravity, OpenCode Go) based on task complexity, live quota availability, and benchmark tiers inside isolated Git worktrees.
argument-hint: "[command] [flags] — run '<prompt>' | quota | models [provider] | sync-models | tiers | config-jev"
---

# harness-proxy

Multiplex coding tasks across your active AI coding subscriptions (**Cursor**, **Antigravity**, **OpenCode Go**). It acts as a smart dispatcher that classifies task complexity, checks remaining quota allowances, mounts an isolated Git worktree, headlessly drives the chosen harness, and auto-merges clean passes back into your active branch.

## Installation

Install the precompiled standalone binary from GitHub Releases:

**macOS / Linux:**
```bash
curl -fsSL https://raw.githubusercontent.com/fernando-delosrios-sp/skills/main/skills/engineering/harness-proxy/scripts/install.sh | bash
```

**Windows (PowerShell):**
```powershell
irm https://raw.githubusercontent.com/fernando-delosrios-sp/skills/main/skills/engineering/harness-proxy/scripts/install.ps1 | iex
```

*(Or build locally from repository source: `npm run build:harness-proxy`)*


## Quick Start

```bash
# Delegate a task (auto-classifies tier and selects optimal provider)
harness-proxy run "Implement unit tests for user profile service"

# Delegate with explicit tier override (frontier, workhorse, lightweight)
harness-proxy run --tier frontier "Refactor authentication middleware to use JWT"

# Delegate with explicit model override (tier classification is ignored)
harness-proxy run --model gemini-4-argon-high "Refactor database connection pool"

# Force specific provider and model
harness-proxy run --provider antigravity --model claude-sonnet-5-5-high "Task prompt"

# Inspect active subscription quotas and reset countdowns
harness-proxy quota

# List available models across all providers or for a specific provider
harness-proxy models
harness-proxy models opencode
harness-proxy models antigravity
harness-proxy models cursor

# Sync model capabilities against Artificial Analysis & LiveCodeBench benchmarks
harness-proxy sync-models

# View current tier matrix
harness-proxy tiers

# Configure Jev task classifier (interactive wizard or flags)
harness-proxy config-jev
harness-proxy config-jev --endpoint http://localhost:11434/v1 --model qwen2.5-coder:7b
```

## How It Works

1. **Three-Pass Routing:**
   - **Pass 1 (Jev Complexity Classifier):** Analyzes task prompt difficulty using an OpenAI-compatible LLM endpoint or rule heuristics to map to `frontier`, `workhorse`, or `lightweight`.
   - **Pass 2 (Quota & Provider Selection):** Inspects remaining allowances across providers in the selected tier and routes to the provider with the best remaining quota balance.
   - **Pass 3 (Model & Effort Selection via Jev):** Deduplicates provider models down to unique base models (stripping effort and modifier suffixes like `-low`, `-high`, `-thinking`, `-fast`) so variants do not dominate the candidate pool. Gathers the top base models sorted by benchmark score across quota-healthy providers (up to `candidate_models`, default 5, with `opencode-go/` prioritized over Zen when Go quota is healthy). Jev selects the best base model along with the required reasoning effort (`low`, `medium`, `high`), and the proxy resolves the precise concrete variant. Explicit `--model` overrides skip tier classification and candidate model selection.

2. **Isolated Worktree Sandbox:**
   - Mounts an ephemeral Git worktree on branch `harness/<task-id>` from `HEAD`.
   - Executes the target harness headlessly (`agent -p`, `agy -p`, or `opencode run`) with auto-approved tool permissions.
   - Commits changes to the task branch upon completion.

3. **Auto-Merge & Conflict Protection:**
   - Automatically merges the task branch into your active branch if clean.
   - If merge conflicts occur, the merge is cleanly aborted (`git merge --abort`), the task branch is preserved, and conflicting files are returned to the caller for manual or agentic resolution.

4. **Tier-Level Failover:**
   - If a target harness hits rate limits (HTTP 429) or errors during execution, `harness-proxy` automatically retries on the next available provider in the same tier.

## Configuration & Storage

Stored under the XDG standard:
* **Global Base (`~/.config/harness-proxy/`):**
  * `config.yaml`: Classifier settings, provider priority order, worktree options.
  * `tiers.yaml`: Model tier mappings across providers, ranked by benchmark score descending.
  * `ledger.json`: Historical execution timestamps, estimated tokens, and consumption.
  * `cache/`: 7-day TTL benchmark cache and quota status snapshots.
* **Workspace Override (`.harness-proxy.yaml`):** Optional repo-root file to override base directories or provider restrictions for a specific project.

### Jev Classifier Configuration

Jev classifies task difficulty and selects the optimal model using an OpenAI-compatible `/chat/completions` endpoint. Configure it directly using the binary:

```bash
# Interactive wizard mode (prompts for endpoint, model, api-key, and candidate models):
harness-proxy config-jev

# Or non-interactively via flags:
harness-proxy config-jev --endpoint http://localhost:11434/v1 --model qwen2.5-coder:7b --candidate-models 5

# Remote provider with API key:
harness-proxy config-jev --endpoint https://openrouter.ai/api/v1 --model meta-llama/llama-3.3-70b-instruct --api-key sk-or-xxx

# Save to local project override (.harness-proxy.yaml) instead of global:
harness-proxy config-jev --local --model qwen2.5-coder:7b
```

Configuration schema in `~/.config/harness-proxy/config.yaml` or `.harness-proxy.yaml`:

```yaml
jev:
  endpoint: "http://localhost:11434/v1"   # Default local Ollama endpoint
  model: "qwen2.5-coder:7b"              # Classifier model
  api_key: ""                            # Optional API key for remote providers
  candidate_models: 5                    # Number of top benchmark models passed to Jev (default: 5)
```

Timeouts (5s) and heuristic fallbacks are handled automatically by the binary: if the endpoint is unreachable or times out, Jev immediately falls back to built-in keyword/task heuristics and defaults to the top benchmark-scored model.
