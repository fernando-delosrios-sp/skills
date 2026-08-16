---
name: apply-code-changes
description: Execute OpenSpec ferspec apply — tasks.md through completion gate, interactive or autonomous. Use when /opsx:apply runs on a ferspec change, or when implementing an OpenSpec change from tasks.md with TDD, commits, changelog, and optional PR handoff.
---

# Apply Code Changes

Orchestrate ferspec **apply**: read the change artifacts, execute `tasks.md` in order, run the completion gate, finish the Changelog group, and hand off (interactive stop or autonomous PR + issue link).

**Never in apply:** archive, spec sync, archive commit, `/opsx:archive`.

## Inputs

| Priority | Source | Purpose |
|---|---|---|
| HIGH | `openspec/changes/<name>/tasks.md` | Checkbox progress (tracked) |
| HIGH | `openspec/changes/<name>/specs/**/*.md` | Scenario → test coverage gate |
| HIGH | `openspec/changes/<name>/design.md` | Design/spec coherence gate |
| MED | `openspec/changes/<name>/proposal.md` | Capabilities for changelog scope |
| MED | `openspec/changes/<name>/tracking.md` | Autonomous presets + issue/PR fields |
| LOW | `docs/agents/issue-tracker.md` | Issue fetch/update workflow (when present) |

Resolve `<name>` from the user's `/opsx:apply` argument, session context, or `tracking.md` → Change.

## Mode

| Mode | When | Handoff |
|---|---|---|
| **Interactive** | Default — user present, no autonomous signal | Gate passes → changelog → STOP on branch; no PR unless user asks |
| **Autonomous** | Issue-driven apply, or user requests autonomous/PR handoff | Create or read `tracking.md` → gate → changelog → PR + issue link → STOP |

Autonomous signals: existing `tracking.md` with Issue filled, explicit user request, or CI/non-interactive context (use Presets in tracking; note assumptions).

## Steps

### 0. Pre-flight

1. Confirm change path exists under `openspec/changes/<name>/`.
2. Read `tasks.md`, delta specs, `design.md`, `proposal.md`.
3. Record `ORIGINAL_BRANCH=$(git branch --show-current)` unless `tracking.md` Presets name `base-branch`.
4. Create feature branch when none exists: `openspec/<name>` or value from tracking.

### 1. Setup (mode-specific)

**Interactive** — two gates via **structured-choices** (one gate per message):

1. **Workspace:** `local` (continue on current checkout) | `worktree` (isolated checkout — only when a worktree skill or documented project workflow exists; otherwise offer `local` only).
2. **Parallelism:** `single` (this session) | `subagent-per-group` (one subagent per numbered `##` group in tasks.md when platform supports subagents).

**Autonomous** — no dialog:

1. Create `tracking.md` from the ferspec template when missing; fill Issue, Change, Branch, Presets from issue metadata.
2. Apply Presets (`workspace`, `parallelism`, `base-branch`) without user prompts.

### 2. Execute tasks

Work through `tasks.md` in order — numbered `##` groups, then Verification, Documentation, Changelog last.

Per implementation task:

1. Map related `#### Scenario:` blocks from delta specs; name tests after scenarios.
2. Invoke **tdd** via Skill tool when present (non-blocking if absent — gate still requires tests green).
3. Implement; mark `- [ ]` → `- [x]` only when the task's tests pass.
4. Invoke **git-commit** for logical commit units (session-scoped per that skill).
5. After each `##` group (or at end when parallelism is `single`), invoke **code-review** when present — fixed point = branch base or `ORIGINAL_BRANCH`.

Documentation group: update files listed in proposal Impact and tasks.

Changelog group: invoke **changelog-generator**; mark tasks complete when entry exists.

**Parallelism `subagent-per-group`:** dispatch one subagent per `##` group with this brief: read group tasks + related specs/design; follow steps 1–4 above; return with checkboxes updated and commits on branch.

### 3. Completion gate (blocking)

Re-run until every row passes:

1. All `tasks.md` checkboxes `[x]`
2. Canonical test command from Verification group — exit 0
3. Every `#### Scenario:` in delta specs has a named automated test
4. `openspec validate --all --json` — all `"valid": true`
5. Each material `design.md` decision reflected in specs — drift = FAIL, fix before proceeding
6. Changelog task complete (generated during apply, not archive)

On FAIL: fix immediately; do not hand off.

### 4. Handoff

**Interactive:** report gate PASS, branch name, commits summary. Do not open PR unless the user asks.

**Autonomous:**

1. Push branch: `git push -u origin HEAD`
2. Open PR to `ORIGINAL_BRANCH` (or Presets `base-branch`) via `gh pr create` — title/body reference change name and linked issue.
3. Update `tracking.md` → PR with URL.
4. Link PR on the issue — follow `docs/agents/issue-tracker.md` when present; otherwise `gh issue comment` / equivalent from tracking Issue field.

**Done when:** gate passes and mode handoff completes (interactive: clean branch; autonomous: PR open + issue linked).

## Delegation

| Concern | Skill | Required |
|---|---|---|
| User gates | structured-choices | Interactive setup |
| Tests | tdd | Optional invoke; gate requires green tests |
| Commits | git-commit | Preferred; manual conventional commit only if skill absent |
| Changelog | changelog-generator | Required for Changelog group |
| Review | code-review | Optional; recommended after implementation groups |
| PR / issue | gh + issue-tracker doc | Autonomous handoff only |

## Narrowing

- No archive or spec sync inside apply.
- No marking tasks `[x]` before tests pass.
- No PR before completion gate passes (autonomous).
- No skipping Changelog — gate item 6 is blocking.
