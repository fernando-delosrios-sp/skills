---
name: apply-code-changes
description: Execute a planned change from tasks.md through completion gate and handoff — OpenSpec ferspec apply via /opsx:apply, or any folder with tasks.md (Direct adapter). TDD, commits, changelog, interactive or autonomous PR.
---

# Apply Code Changes

Orchestrate **apply**: read change artifacts, execute `tasks.md` in order (Changelog group last), run the completion gate, and hand off (interactive stop or autonomous PR + issue link).

**Core** = steps 0–5 below. **Change adapter** = path and validator resolution — [change-adapters.md](references/change-adapters.md) (**OpenSpec** default, **Direct** when the user supplies a folder with `tasks.md`).

**Never in apply:** archive, spec sync, archive commit, `/opsx:archive`.

## Inputs

Artifact paths are relative to `CHANGE_ROOT` (set by the adapter). Prefer OpenSpec `artifactPaths` / `contextFiles` when the OpenSpec adapter ran.

| Priority | Source | Purpose |
|---|---|---|
| HIGH | `tasks.md` | Checkbox progress (tracked) |
| HIGH | `specs/**/*.md` | Scenario → test coverage gate |
| HIGH | `design.md` | Design/spec coherence gate |
| MED | `proposal.md` | Capabilities for changelog scope |
| MED | `tracking.md` | Autonomous presets + issue/PR fields |
| LOW | `docs/agents/issue-tracker.md` | Issue fetch/update workflow (when present) |

## Mode

| Mode | When | Handoff |
|---|---|---|
| **Interactive** | Default — user present, no autonomous signal | Execute (incl. Changelog) → gate → STOP on branch; no PR unless user asks |
| **Autonomous** | Issue-driven apply, or user requests autonomous/PR handoff | Create or read `tracking.md` → execute (incl. Changelog) → gate → PR + issue link → STOP |

Autonomous signals: existing `tracking.md` with Issue filled, explicit user request, or CI/non-interactive context (use Presets in tracking; note assumptions).

## Steps

### 0. Pre-flight

1. Select and run a **change adapter** per [change-adapters.md](references/change-adapters.md); confirm `CHANGE_ROOT` exists.
2. Read artifacts from `CHANGE_ROOT`: `tasks.md`, delta specs, `design.md`, `proposal.md`, and `tracking.md` when present.
3. Detect mode — interactive (default) vs autonomous (signals above).

### 1. Setup (mode-specific)

**Interactive** — two gates via **structured-choices** (one gate per message):

1. **Workspace:** `local` (continue on current checkout) | `worktree` (isolated checkout — only when a worktree skill or documented project workflow exists; otherwise offer `local` only).
2. **Parallelism:** `single` (this session) | `subagent-per-group` (one subagent per numbered `##` group — see **Parallelism** below; only when platform supports subagents).

**Autonomous** — no dialog:

1. Create `tracking.md` from the ferspec template when missing; fill Issue and Branch from issue metadata; fill **Change** with adapter `CHANGE_ROOT` (full path — OpenSpec `changeRoot` from step 0, or Direct user path); fill Presets from issue metadata when present.
2. Persist adapter outputs: Presets → `store` when OpenSpec adapter set `STORE`.
3. Apply Presets (`workspace`, `parallelism`, `base-branch`, `store`) without user prompts.

### 2. Branch resolution

After setup — autonomous first runs now have `tracking.md` with Branch filled. Resolve `ORIGINAL_BRANCH` **before** creating or skipping the feature branch — current checkout is not the PR base when you are already on `FEATURE_BRANCH`.

1. Resolve `FEATURE_BRANCH`: `tracking.md` → Branch, else adapter default (`openspec/<name>` or `feature/<name>` — see [change-adapters.md](references/change-adapters.md)).
2. Resolve `ORIGINAL_BRANCH` (integration branch — PR target and review base). It must not equal `FEATURE_BRANCH`. First match:
   - `tracking.md` Presets → `base-branch` when set and ≠ `FEATURE_BRANCH`
   - Else when `git branch --show-current` ≠ `FEATURE_BRANCH`: current branch
   - Else (resume or CI already on the feature branch): repo default integration branch (`main`, or `git symbolic-ref refs/remotes/origin/HEAD`); note assumption in autonomous mode when not preset
3. Ensure `FEATURE_BRANCH` exists and is checked out **where work runs**:
   - **`local` workspace:** create and checkout `FEATURE_BRANCH` when not already on it; otherwise stay on the existing feature branch.
   - **`worktree` workspace:** create `FEATURE_BRANCH` from `ORIGINAL_BRANCH` when missing, but keep the **main repo checkout** on `ORIGINAL_BRANCH` (or any branch ≠ `FEATURE_BRANCH`). The worktree holds `FEATURE_BRANCH` — never checkout `FEATURE_BRANCH` in main while a worktree on that branch exists.
4. When `tracking.md` exists and Presets `base-branch` is empty, write `ORIGINAL_BRANCH` there so later resumes read the preset instead of re-deriving from checkout.

### 3. Execute tasks

Work through `tasks.md` in order — numbered `##` groups, then Verification, Documentation, Changelog last.

Per implementation task:

1. Map related `#### Scenario:` blocks from delta specs; name tests after scenarios.
2. Invoke **tdd** via Skill tool when present (non-blocking if absent — gate still requires tests green).
3. Implement; mark `- [ ]` → `- [x]` only when the task's tests pass.
4. Invoke **git-commit** for logical commit units (session-scoped per that skill).
5. After each `##` group (or at end when parallelism is `single`), invoke **code-review** when present — fixed point = branch base or `ORIGINAL_BRANCH`.

Documentation group: update files listed in proposal Impact and tasks.

Changelog group: invoke **changelog-generator**; mark tasks complete when entry exists.

**Workspace `worktree`:** PRECHECK a worktree skill or documented project workflow — STOP with `local` offer if absent. Main repo checkout stays on `ORIGINAL_BRANCH` (or another branch ≠ `FEATURE_BRANCH`); never hold `FEATURE_BRANCH` in two checkouts.

- **`single` parallelism:** one isolated worktree `apply-<name>` on `FEATURE_BRANCH`. Run steps 3–4 entirely inside the worktree (artifact reads/writes still use adapter `CHANGE_ROOT`). Commits land on `FEATURE_BRANCH`. Before handoff: push `FEATURE_BRANCH` from the worktree (`git push -u origin HEAD` there), remove the worktree per the worktree skill. **Interactive only:** after the worktree is gone, checkout `FEATURE_BRANCH` in the main repo if the user should land on the branch. **Autonomous:** main checkout stays on `ORIGINAL_BRANCH`.
- **`subagent-per-group` parallelism:** see below — one worktree per numbered group.

**Parallelism `subagent-per-group`:** never run concurrent subagents against the same checkout or branch.

- **Eligible groups:** numbered implementation `##` groups only — not Verification, Documentation, or Changelog (orchestrator runs those).
- **`local` workspace:** dispatch groups **sequentially** — wait for each subagent to return before starting the next. Subagents implement and report; they must **not** run git commands or edit `tasks.md`. Orchestrator runs tests, marks checkboxes, and invokes **git-commit** after each group.
- **`worktree` workspace:** one isolated worktree per group (`apply-<name>-<group-slug>`) on branch `<FEATURE_BRANCH>-<group-slug>`. Subagents may commit on their group branch. Orchestrator **merges sequentially** into `FEATURE_BRANCH` after each group returns — never merge in parallel.
- Subagent brief: read group tasks + related specs/design from `CHANGE_ROOT`; follow implement + test steps; return evidence. Pass `CHANGE_ROOT`; pass `PLANNING_HOME` and `--store` when the OpenSpec adapter set them.

### 4. Completion gate (blocking)

Re-run until every row passes:

1. All `tasks.md` checkboxes `[x]`
2. Canonical test command from Verification group — exit 0
3. Every `#### Scenario:` in delta specs has a named automated test
4. **Adapter validator** — OpenSpec: `openspec validate --all --json` (from `PLANNING_HOME`, with `--store` when set) all `"valid": true`; Direct: skip (optional only if user requests and CLI available)
5. Each material `design.md` decision reflected in specs — drift = FAIL, fix before proceeding
6. Changelog task complete (generated during apply, not archive)

On FAIL: fix immediately; do not hand off.

### 5. Handoff

**Interactive:** report gate PASS, branch name, commits summary. Do not open PR unless the user asks.

**Autonomous:**

1. Push `FEATURE_BRANCH`: `git push -u origin FEATURE_BRANCH` — explicit branch name, not `HEAD`, so push succeeds when the main checkout stayed on `ORIGINAL_BRANCH` after worktree teardown. Skip when a worktree session already pushed and `origin/FEATURE_BRANCH` is up to date.
2. Open PR from `FEATURE_BRANCH` to `ORIGINAL_BRANCH` via `gh pr create` — title/body reference change name and linked issue.
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
- No using the feature branch as `ORIGINAL_BRANCH` — resume must resolve integration base from Presets or repo default.
- No skipping Changelog — gate item 6 is blocking.
- No hardcoded `openspec/changes/<name>/` — OpenSpec adapter resolves `changeRoot` from CLI every session; Direct adapter uses the user-supplied path only.
- No concurrent subagents on shared git state — sequential dispatch or worktree isolation with sequential merge.
- No mixing superpowers-bridge apply orchestration with this skill on the same change.
