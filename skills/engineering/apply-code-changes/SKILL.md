---
name: apply-code-changes
description: Execute a planned change from tasks.md through completion gate and handoff — OpenSpec ferspec apply via /opsx:apply, or any folder with tasks.md (Direct adapter). TDD, commits, changelog, interactive or autonomous PR.
---

# Apply Code Changes

Orchestrate **apply**: read change artifacts, execute `tasks.md` in order (Changelog group last), run the completion gate, and hand off (interactive stop or autonomous PR + issue link).

**Core** = steps 0–5 below. **Change adapter** = path and validator resolution — [change-adapters.md](references/change-adapters.md) (**OpenSpec** default, **Direct** when the user supplies a folder with `tasks.md`).

**Never in apply:** archive, spec sync, archive commit, `/opsx:archive`.

## Session variables

| Variable | Meaning |
|---|---|
| `CHANGE_ROOT` | Adapter output at pre-flight — pre-bind path only |
| `TRACKING` | In-memory `tracking.md` fields (Issue, Change, Branch, PR, Presets). **Branch resolution and setup read `TRACKING` only** — never re-read stale on-disk `tracking.md` from main during first-run autonomous setup |
| `ACTIVE_CHANGE_ROOT` | Bound path for all artifact I/O after step 2.5 |

## Inputs

After bind, artifact paths are relative to `ACTIVE_CHANGE_ROOT`. Prefer OpenSpec `artifactPaths` / `contextFiles` when the OpenSpec adapter ran.

| Priority | Source | Purpose |
|---|---|---|
| HIGH | `tasks.md` | Checkbox progress (tracked) |
| HIGH | `specs/**/*.md` | Scenario → test coverage gate |
| HIGH | `design.md` | Design/spec coherence gate |
| MED | `proposal.md` | Capabilities for changelog scope |
| MED | `tracking.md` / `TRACKING` | Autonomous presets + issue/PR fields |
| LOW | `docs/agents/issue-tracker.md` | Issue fetch/update workflow (when present) |

## Mode

| Mode | When | Handoff |
|---|---|---|
| **Interactive** | Default — user present, no autonomous signal | Execute (incl. Changelog) → gate → STOP on branch; no PR unless user asks |
| **Autonomous** | Issue-driven apply, or user requests autonomous/PR handoff | Prepare or load `TRACKING` → execute (incl. Changelog) → gate → PR + issue link → STOP |

Autonomous signals: existing on-disk `tracking.md` with Issue filled, explicit user request, or CI/non-interactive context (use Presets in `TRACKING`; note assumptions).

## Steps

### 0. Pre-flight

1. Select and run a **change adapter** per [change-adapters.md](references/change-adapters.md); confirm `CHANGE_ROOT` exists. Adapters **read** on-disk `tracking.md` into `TRACKING` when present — they **never create** it (autonomous preparation is setup step 1).
2. Read other artifacts from adapter `CHANGE_ROOT`: `tasks.md`, delta specs, `design.md`, `proposal.md`.
3. Detect mode — interactive (default) vs autonomous (signals above).

### 1. Setup (mode-specific)

**Interactive** — two gates via **structured-choices** (one gate per message):

1. **Workspace:** `local` (continue on current checkout) | `worktree` (isolated checkout — only when a worktree skill or documented project workflow exists; otherwise offer `local` only).
2. **Parallelism:** `single` (this session) | `subagent-per-group` (one subagent per numbered `##` group — see **Parallelism** below; only when platform supports subagents).

**Autonomous** — no dialog:

1. When `TRACKING` is unset or Issue is empty, **prepare** `TRACKING` from the ferspec template; fill Issue and Branch from issue metadata; fill **Change** with adapter `CHANGE_ROOT` (full path); fill Presets from issue metadata when present. When on-disk `tracking.md` was loaded with Issue filled, keep it in `TRACKING` — do not overwrite with empty fields. **Do not write to disk yet.**
2. Persist adapter outputs in `TRACKING`: Presets → `store` when OpenSpec adapter set `STORE`.
3. Apply Presets from `TRACKING` (`workspace`, `parallelism`, `base-branch`, `store`) without user prompts. When Presets include `workspace: worktree`, **PRECHECK** a worktree skill or documented project workflow — if absent, downgrade to `local`, update `TRACKING` Presets, and note the assumption (issue comment when Issue is set; else session log). Do not STOP — autonomous runs must continue on `local`.

### 2. Branch resolution and workspace bind

After setup — autonomous first runs have `TRACKING` with Branch filled. Resolve branches from **`TRACKING` only** (not a fresh disk read). Resolve `ORIGINAL_BRANCH` **before** creating or skipping the feature branch.

1. Resolve `FEATURE_BRANCH`: `TRACKING` → Branch, else adapter default (`openspec/<name>` or `feature/<name>` — see [change-adapters.md](references/change-adapters.md)).
2. Resolve `ORIGINAL_BRANCH` (integration branch — PR target and review base). It must not equal `FEATURE_BRANCH`. First match:
   - `TRACKING` Presets → `base-branch` when set and ≠ `FEATURE_BRANCH`
   - Else when `git branch --show-current` ≠ `FEATURE_BRANCH`: current branch
   - Else (resume or CI already on the feature branch): repo default integration branch (`main`, or `git symbolic-ref refs/remotes/origin/HEAD`); note assumption in autonomous mode when not preset
3. Ensure `FEATURE_BRANCH` exists **where work runs** (depends on workspace × parallelism):
   - **`local` workspace:** create and checkout `FEATURE_BRANCH` when not already on it; otherwise stay on the existing feature branch.
   - **`worktree` + `single`:** create `FEATURE_BRANCH` from `ORIGINAL_BRANCH` when missing. Keep **main repo checkout** on `ORIGINAL_BRANCH`.
   - **`worktree` + `subagent-per-group`:** create `FEATURE_BRANCH` from `ORIGINAL_BRANCH` when missing as the integration branch for sequential merges. Keep **main repo checkout** on `ORIGINAL_BRANCH`. Group worktrees use `<FEATURE_BRANCH>-<group-slug>`, not `FEATURE_BRANCH`.
4. When `TRACKING` Presets `base-branch` is empty, set `ORIGINAL_BRANCH` in `TRACKING` so later resumes read the preset instead of re-deriving from checkout.
5. **Bind `ACTIVE_CHANGE_ROOT`** — all change-artifact reads/writes (`tasks.md`, `tracking.md`, specs, etc.) use this path. Persist `TRACKING` → `tracking.md` on first bind:
   - **`local`:** after checkout on `FEATURE_BRANCH`, `ACTIVE_CHANGE_ROOT` = adapter `CHANGE_ROOT` (same repo-relative path on that branch).
   - **`worktree` + `single`:** create worktree `apply-<name>` on `FEATURE_BRANCH` **here** (before step 3). Bind `ACTIVE_CHANGE_ROOT` inside the worktree (same repo-relative path; `git rev-parse --show-toplevel` there + relative path from adapter). Keep worktree alive through autonomous handoff — **do not remove until PR URL is committed and pushed from the worktree.**
   - **`worktree` + `subagent-per-group`:** orchestrator checks out `FEATURE_BRANCH` in main and binds; group subagents bind inside their worktree per group during step 3.

**Workspace `worktree` capability:** validated at setup (autonomous downgrades invalid presets; interactive workspace gate omits `worktree` when absent). **Interactive edge case only:** if `worktree` was chosen but capability is missing at bind time, STOP with structured-choices `local` offer.

### 3. Execute tasks

**Prerequisite:** `ACTIVE_CHANGE_ROOT` bound (step 2.5). Never read or edit change artifacts via adapter `CHANGE_ROOT` or main checkout after bind.

Work through `tasks.md` at `ACTIVE_CHANGE_ROOT` in order — numbered `##` groups, then Verification, Documentation, Changelog last.

Per implementation task:

1. Map related `#### Scenario:` blocks from delta specs; name tests after scenarios.
2. Invoke **tdd** via Skill tool when present (non-blocking if absent — gate still requires tests green).
3. Implement; mark `- [ ]` → `- [x]` only when the task's tests pass.
4. Invoke **git-commit** for logical commit units (session-scoped per that skill).
5. After each `##` group (or at end when parallelism is `single`), invoke **code-review** when present — fixed point = branch base or `ORIGINAL_BRANCH`.

Documentation group: update files listed in proposal Impact and tasks.

Changelog group: invoke **changelog-generator**; mark tasks complete when entry exists.

**`worktree` + `single`:** steps 3–4 run entirely inside the bound worktree on `FEATURE_BRANCH`. Commits land on `FEATURE_BRANCH`. Teardown is **handoff step 4**, not here.

**Parallelism `subagent-per-group`:** never run concurrent subagents against the same checkout or branch.

- **Eligible groups:** numbered implementation `##` groups only — not Verification, Documentation, or Changelog (orchestrator runs those).
- **`local` workspace:** dispatch groups **sequentially** — wait for each subagent to return before starting the next. Subagents implement and report; they must **not** run git commands or edit `tasks.md`. Orchestrator runs tests, marks checkboxes, and invokes **git-commit** after each group. Subagent brief: read group tasks + related specs/design from `ACTIVE_CHANGE_ROOT` on `FEATURE_BRANCH`; follow implement + test steps; return evidence. Pass `ACTIVE_CHANGE_ROOT`; pass `PLANNING_HOME` and `--store` when the OpenSpec adapter set them.
- **`worktree` workspace:** one isolated worktree per group (`apply-<name>-<group-slug>`) on branch `<FEATURE_BRANCH>-<group-slug>`. Subagents may commit on their group branch. Orchestrator **merges sequentially** into `FEATURE_BRANCH` after each group returns — never merge in parallel. Mark `tasks.md` and update `tracking.md` at orchestrator `ACTIVE_CHANGE_ROOT` on `FEATURE_BRANCH` (checkout in main when needed — no worktree holds that branch). Subagent brief: bind `ACTIVE_CHANGE_ROOT` inside the group worktree (same repo-relative path); read group tasks + related specs/design from there; follow implement + test steps; return evidence. Pass group worktree `ACTIVE_CHANGE_ROOT`; pass `PLANNING_HOME` and `--store` when the OpenSpec adapter set them.

### 4. Completion gate (blocking)

Re-run at `ACTIVE_CHANGE_ROOT` until every row passes:

1. All `tasks.md` checkboxes `[x]`
2. Canonical test command from Verification group — exit 0
3. Every `#### Scenario:` in delta specs has a named automated test
4. **Adapter validator** — OpenSpec: `openspec validate --all --json` (from `PLANNING_HOME`, with `--store` when set) all `"valid": true`; Direct: skip (optional only if user requests and CLI available)
5. Each material `design.md` decision reflected in specs — drift = FAIL, fix before proceeding
6. Changelog task complete (generated during apply, not archive)

On FAIL: fix immediately; do not hand off.

### 5. Handoff

**Interactive:** report gate PASS, branch name, commits summary. **`worktree` + `single`:** remove worktree after report when done; optionally checkout `FEATURE_BRANCH` in main. Do not open PR unless the user asks.

**Autonomous** — order matters for `worktree` + `single` (worktree still active until step 4):

1. Push `FEATURE_BRANCH`: `git push -u origin FEATURE_BRANCH` — from the bound worktree when `worktree` + `single`; else explicit branch name from main. Skip when already up to date with `origin/FEATURE_BRANCH`.
2. Open PR from `FEATURE_BRANCH` to `ORIGINAL_BRANCH` via `gh pr create` — title/body reference change name and linked issue (`gh` does not require local checkout).
3. Set `TRACKING` → PR with URL; write `tracking.md` at `ACTIVE_CHANGE_ROOT`; commit and push on `FEATURE_BRANCH`. **`worktree` + `single`:** commit + push from the worktree.
4. **`worktree` + `single`:** remove the worktree per the worktree skill — **only after** step 3 push succeeds. Main checkout stays on `ORIGINAL_BRANCH`. **Interactive `worktree` + `single`:** optional checkout `FEATURE_BRANCH` in main after teardown.
5. Link PR on the issue — follow `docs/agents/issue-tracker.md` when present; otherwise `gh issue comment` / equivalent from `TRACKING` Issue field.

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
- No using the feature branch as `ORIGINAL_BRANCH` — resume must resolve integration base from Presets or repo default.
- No skipping Changelog — gate item 6 is blocking.
- No hardcoded `openspec/changes/<name>/` — OpenSpec adapter resolves `changeRoot` from CLI every session; Direct adapter uses the user-supplied path only.
- No concurrent subagents on shared git state — sequential dispatch or worktree isolation with sequential merge.
- No adapter or pre-flight **creating** on-disk `tracking.md` — prepare in `TRACKING`, persist at `ACTIVE_CHANGE_ROOT` bind only.
- No branch resolution or setup reads from on-disk `tracking.md` when prepared `TRACKING` is authoritative for this session.
- No artifact I/O via adapter `CHANGE_ROOT` or main checkout after `ACTIVE_CHANGE_ROOT` binds.
- No `worktree` + `single` teardown before PR URL is committed and pushed from the worktree.
- No mixing superpowers-bridge apply orchestration with this skill on the same change.
