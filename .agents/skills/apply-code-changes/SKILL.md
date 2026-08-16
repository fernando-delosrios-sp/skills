---
name: apply-code-changes
description: Execute a planned change from tasks.md through completion gate and handoff — OpenSpec ferspec apply via /opsx:apply, or any folder with tasks.md (Direct adapter). TDD, commits, changelog, interactive or autonomous PR.
---

# Apply Code Changes

Orchestrate **apply**: execute `tasks.md` in order (Changelog group last), run the completion gate, and hand off (interactive stop or autonomous PR + issue link).

**Core** = steps 0–5. **Change adapter** = pre-flight path resolution — [change-adapters.md](references/change-adapters.md).

**Never in apply:** archive, spec sync, archive commit, `/opsx:archive`.

## Session variables

| Variable | When set | Meaning |
|---|---|---|
| `CHANGE_ROOT` | Pre-flight (adapter) | Adapter `changeRoot` / user path — **planning read only** after bind |
| `CHANGE_ROOT_REL` | Pre-flight | Repo-relative path from adapter `CHANGE_ROOT` — used to compute `ACTIVE_CHANGE_ROOT` |
| `TRACKING_HINT` | Pre-flight (optional) | On-disk `tracking.md` peek at adapter path — **mode detection only**; may be wrong checkout |
| `TRACKING` | Setup + bind merge | In-memory authoritative fields (Issue, Change, Branch, PR, Presets) for branch resolution and presets |
| `WORK_CHECKOUT` | Bind (step 2) | Git directory where the orchestrator runs (main repo or worktree path) |
| `ACTIVE_CHANGE_ROOT` | Bind (step 2) | `WORK_CHECKOUT` + `CHANGE_ROOT_REL` — **all artifact I/O after bind** |

## Workspace matrix (single source of truth)

After bind, follow the row for `workspace` × `parallelism`. Step 2 implements this table — do not contradict it elsewhere.

| Workspace | Parallelism | Main repo branch | `WORK_CHECKOUT` | Group work |
|---|---|---|---|---|
| `local` | `single` | `FEATURE_BRANCH` | main repo | — |
| `local` | `subagent-per-group` | `FEATURE_BRANCH` | main repo | subagents read `ACTIVE_CHANGE_ROOT`; orchestrator edits artifacts |
| `worktree` | `single` | `ORIGINAL_BRANCH` (idle) | worktree on `FEATURE_BRANCH` | — |
| `worktree` | `subagent-per-group` | `FEATURE_BRANCH` (orchestrator) | main repo | one worktree per group on `<FEATURE_BRANCH>-<slug>`; orchestrator merges to `FEATURE_BRANCH` |

**Main repo branch:** where the primary clone checkout stays for git operations not delegated to a worktree. **`worktree` + `single` only** keeps main on `ORIGINAL_BRANCH`; all other modes checkout main to `FEATURE_BRANCH` at bind.

## Inputs

After bind, paths are under `ACTIVE_CHANGE_ROOT`. Prefer OpenSpec `artifactPaths` / `contextFiles` when set.

| Priority | Source | Purpose |
|---|---|---|
| HIGH | `tasks.md` | Checkbox progress |
| HIGH | `specs/**/*.md` | Scenario → test coverage gate |
| HIGH | `design.md` | Design/spec coherence gate |
| MED | `proposal.md` | Changelog scope |
| MED | `TRACKING` / `tracking.md` | Autonomous presets + issue/PR fields |
| LOW | `docs/agents/issue-tracker.md` | Issue workflow when present |

## Mode

| Mode | When | Handoff |
|---|---|---|
| **Interactive** | Default | Execute → gate → STOP on branch; no PR unless user asks |
| **Autonomous** | `TRACKING_HINT` Issue filled, explicit request, or CI context | Setup `TRACKING` → execute → gate → PR + issue link |

## Steps

### 0. Pre-flight (adapter — planning reads only)

1. Run a **change adapter** per [change-adapters.md](references/change-adapters.md); set `CHANGE_ROOT` and `CHANGE_ROOT_REL`. Adapters **never create** on-disk `tracking.md`.
2. Read `tasks.md`, specs, `design.md`, `proposal.md` from `CHANGE_ROOT` for planning context.
3. If `tracking.md` exists at `CHANGE_ROOT`, load into **`TRACKING_HINT` only** (for autonomous mode detection). Do **not** treat this as authoritative `TRACKING` — it may be from the wrong checkout on resume.
4. Detect mode — interactive (default) vs autonomous (signals above).

### 1. Setup (mode-specific)

**Interactive** — **structured-choices** (one gate per message):

1. **Workspace:** `local` | `worktree` (only when a worktree skill or documented workflow exists; else offer `local` only).
2. **Parallelism:** `single` | `subagent-per-group` (when platform supports subagents).

**Autonomous** — no dialog:

1. Initialize **`TRACKING`**: when `TRACKING_HINT` has Issue filled, copy into `TRACKING`; else prepare from ferspec template + issue metadata (Issue, Branch, **Change** = full `CHANGE_ROOT`, Presets). **Do not write to disk.**
2. Persist adapter outputs in `TRACKING`: Presets → `store` when OpenSpec adapter set `STORE`.
3. Apply Presets from `TRACKING`. When `workspace: worktree`, **PRECHECK** worktree skill — if absent, downgrade to `local`, update `TRACKING`, note assumption; continue on `local`.

### 2. Branch resolution, bind, and tracking merge

Resolve from **`TRACKING` only** (never a fresh disk read from adapter `CHANGE_ROOT`).

1. **`FEATURE_BRANCH`:** `TRACKING` → Branch, else adapter default (`openspec/<name>` or `feature/<name>`).
2. **`ORIGINAL_BRANCH`:** must ≠ `FEATURE_BRANCH`. First match: `TRACKING` Presets → `base-branch`; else current branch when ≠ `FEATURE_BRANCH`; else repo default (`main` / `origin/HEAD`). Note assumption in autonomous mode when not preset.
3. **Create `FEATURE_BRANCH`** from `ORIGINAL_BRANCH` when missing.
4. When `TRACKING` Presets `base-branch` is empty, set `ORIGINAL_BRANCH` in `TRACKING`.
5. **Bind** per **workspace matrix** — set `WORK_CHECKOUT`, checkout main or create worktree as required, then `ACTIVE_CHANGE_ROOT = <worktree-or-main-toplevel>/<CHANGE_ROOT_REL>`:
   - **`local`:** checkout `FEATURE_BRANCH` on main → `WORK_CHECKOUT` = main repo.
   - **`worktree` + `single`:** keep main on `ORIGINAL_BRANCH`; create worktree `apply-<name>` on `FEATURE_BRANCH` → `WORK_CHECKOUT` = worktree path. Keep worktree through autonomous handoff step 4.
   - **`worktree` + `subagent-per-group`:** checkout `FEATURE_BRANCH` on main → `WORK_CHECKOUT` = main repo (orchestrator merge + artifact surface).
6. **`tracking.md` merge at bind** (at `ACTIVE_CHANGE_ROOT/tracking.md`):
   - If file exists on the bound checkout → load into `TRACKING`, **on-disk wins** for every non-empty field (Issue, Branch, PR, Presets, Change).
   - Fill only **empty** `TRACKING` fields from prepared content.
   - If file absent → write prepared `TRACKING`.
   - Never overwrite a resumed PR URL or filled Presets with empty prepared values.
7. **Re-read** `tasks.md`, specs, `design.md`, `proposal.md` from `ACTIVE_CHANGE_ROOT` — post-bind canonical copy.

**Worktree capability:** validated at setup; interactive bind-time miss → STOP with structured-choices `local` offer.

### 3. Execute tasks

**Prerequisite:** `ACTIVE_CHANGE_ROOT` bound. All artifact reads/writes use `ACTIVE_CHANGE_ROOT` only — never the pre-bind adapter `CHANGE_ROOT` absolute path.

Work through `tasks.md` in order — numbered `##` groups, then Verification, Documentation, Changelog last.

Per implementation task:

1. Map related `#### Scenario:` blocks; name tests after scenarios.
2. Invoke **tdd** when present (non-blocking if absent).
3. Implement; mark `- [ ]` → `- [x]` only when tests pass.
4. Invoke **git-commit** for logical units.
5. After each `##` group (or end when `single`), invoke **code-review** when present — fixed point = `ORIGINAL_BRANCH`.

Documentation group: update files from proposal Impact and tasks.

Changelog group: invoke **changelog-generator**.

**Parallelism `subagent-per-group`:** sequential only — never concurrent subagents on shared git state.

- **Eligible:** numbered implementation `##` groups only.
- **`local`:** subagents implement from `ACTIVE_CHANGE_ROOT`; must not run git or edit `tasks.md`. Orchestrator tests, marks checkboxes, commits.
- **`worktree`:** one worktree per group on `<FEATURE_BRANCH>-<slug>`; subagents commit on group branch; orchestrator merges sequentially into `FEATURE_BRANCH` at main `WORK_CHECKOUT`; orchestrator edits `tasks.md` / `tracking.md` at `ACTIVE_CHANGE_ROOT` on main (already on `FEATURE_BRANCH` per matrix).

Subagent brief: pass bound `ACTIVE_CHANGE_ROOT` for the subagent's checkout (orchestrator path on `local`; group worktree path on `worktree`). Pass `PLANNING_HOME` and `--store` when set.

### 4. Completion gate (blocking)

Re-run at `ACTIVE_CHANGE_ROOT` until every row passes:

1. All `tasks.md` checkboxes `[x]`
2. Canonical test command — exit 0
3. Every `#### Scenario:` has a named automated test
4. **Adapter validator** — OpenSpec: `openspec validate --all --json` from `PLANNING_HOME` with `--store` when set; Direct: skip unless user requests
5. Material `design.md` decisions reflected in specs
6. Changelog task complete

On FAIL: fix immediately; do not hand off.

### 5. Handoff

**Interactive:** report gate PASS, branch, commits. **`worktree` + `single`:** remove worktree after report; optionally checkout `FEATURE_BRANCH` in main. No PR unless user asks.

**Autonomous** — for `worktree` + `single`, worktree stays active until step 4:

1. Push `FEATURE_BRANCH` (`git push -u origin FEATURE_BRANCH`) — from `WORK_CHECKOUT` when it is the worktree; else from main on `FEATURE_BRANCH`. Skip when up to date with `origin/FEATURE_BRANCH`.
2. Open PR to `ORIGINAL_BRANCH` via `gh pr create`.
3. Set `TRACKING` → PR; write `tracking.md` at `ACTIVE_CHANGE_ROOT`; commit and push on `FEATURE_BRANCH` from `WORK_CHECKOUT`.
4. **`worktree` + `single`:** remove worktree **only after** step 3 push. Main returns to / stays on `ORIGINAL_BRANCH`.
5. Link PR on issue from `TRACKING` → Issue.

**Done when:** gate passes and mode handoff completes.

## Delegation

| Concern | Skill | Required |
|---|---|---|
| User gates | structured-choices | Interactive setup |
| Tests | tdd | Optional; gate requires green |
| Commits | git-commit | Preferred |
| Changelog | changelog-generator | Changelog group |
| Review | code-review | Optional |
| PR / issue | gh + issue-tracker doc | Autonomous |

## Narrowing

- No archive or spec sync inside apply.
- No marking tasks `[x]` before tests pass.
- No PR before gate passes (autonomous).
- No using `FEATURE_BRANCH` as `ORIGINAL_BRANCH`.
- No skipping Changelog.
- No hardcoded `openspec/changes/<name>/`.
- No concurrent subagents on shared git state.
- No adapter creating on-disk `tracking.md`.
- No branch resolution from adapter-path disk reads — use `TRACKING`.
- No post-bind artifact I/O via pre-bind adapter `CHANGE_ROOT` — use `ACTIVE_CHANGE_ROOT` (on main or in worktree per matrix).
- No treating `TRACKING_HINT` as authoritative — merge at bind only.
- No `worktree` + `single` teardown before PR URL is pushed from the worktree.
- No mixing superpowers-bridge apply with this skill on the same change.
