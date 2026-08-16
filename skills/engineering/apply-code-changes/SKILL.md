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
| `TRACKING_HINT` | Pre-flight (optional) | Non-authoritative adapter-path seed for mode detection, naming/store probe, and initial tracking; may be from the wrong checkout |
| `TRACKING` | Setup + pre-bind merge | In-memory authoritative fields (Issue, Change, Branch, PR, Presets). **Branch resolution reads merged `TRACKING` only** |
| `STORE_SOURCE` | Pre-flight (OpenSpec) | `explicit` for user/command `--store`, `hint` for `TRACKING_HINT` → store; only an explicit store becomes an override |
| `PRESET_OVERRIDES` | Setup / adapter | Non-persisted current-run preset values (interactive choices, the autonomous setup-time `workspace`/`parallelism` decision, and an explicit `STORE`) that override feature-branch `Presets` keys during every merge |
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
3. The adapter loads `tracking.md` at its resolved `CHANGE_ROOT` into non-authoritative **`TRACKING_HINT`** for mode detection and initial setup, re-probing OpenSpec once when that hint selects a store. Do **not** treat it as final `TRACKING` — it may be from the wrong checkout on resume.
4. Detect mode — interactive (default) vs autonomous (signals above).

### 1. Setup (mode-specific)

**Interactive** — **structured-choices** (one gate per message):

1. Initialize **`TRACKING`** when unset: copy non-empty `TRACKING_HINT` fields **field-by-field** (including individual `Presets` keys), **except Branch** — copy it only when `TRACKING_HINT`'s own Change equals `CHANGE_ROOT` (confirms the hint describes this change, not a stale checkout); otherwise leave Branch empty so branch resolution falls back to the adapter default. Then set **Change** = full `CHANGE_ROOT`. Initialize empty **`PRESET_OVERRIDES`**. **Do not write to disk.**
2. **Workspace:** `local` | `worktree` (only when a worktree skill or documented workflow exists; else offer `local` only) → set `TRACKING` Presets → `workspace` **and** `PRESET_OVERRIDES` → `workspace`.
3. **Parallelism:** `single` | `subagent-per-group` (when platform supports subagents) → set `TRACKING` Presets → `parallelism` **and** `PRESET_OVERRIDES` → `parallelism`.
4. When Presets → `workspace` is `worktree`, **PRECHECK** worktree skill — if absent, downgrade both `TRACKING` and `PRESET_OVERRIDES` → `workspace` to `local`, note assumption.
5. When the OpenSpec adapter set `STORE`, set `TRACKING` Presets → `store`; add it to `PRESET_OVERRIDES` **only** when `STORE_SOURCE` is `explicit`.

**Do not bind** until interactive setup steps 2–3 complete — step 1 only initializes tracking.

**Autonomous** — no dialog:

1. Always prepare a complete **`TRACKING`** baseline from the ferspec template + issue metadata: Issue and Branch when available, and Presets `workspace: local` + `parallelism: single`. Overlay every non-empty `TRACKING_HINT` field **field-by-field** (including individual `Presets` keys), **except Branch** — overlay it only when `TRACKING_HINT`'s own Change equals `CHANGE_ROOT` (confirms the hint describes this change, not a stale checkout); otherwise keep the issue-metadata/baseline Branch. Then set **Change** = full `CHANGE_ROOT` — the current adapter path always wins. Initialize empty **`PRESET_OVERRIDES`**. **Do not write to disk.**
2. Persist adapter outputs in `TRACKING`: when the OpenSpec adapter set `STORE`, set Presets → `store`; add it to `PRESET_OVERRIDES` **only** when `STORE_SOURCE` is `explicit`.
3. Add `workspace` and `parallelism` to `PRESET_OVERRIDES` from `TRACKING`'s current values — locks the setup-time decision through the pre-bind merge so a feature-branch `tracking.md` cannot reintroduce `worktree` unchecked. Apply Presets from `TRACKING`. When `workspace: worktree`, **PRECHECK** worktree skill — if absent, downgrade to `local` in both `TRACKING` and `PRESET_OVERRIDES`, note assumption; continue on `local`.

### 2. Pre-bind merge, branch resolution, and bind

**Pre-bind tracking merge** — before branch resolution or bind (never read adapter-path `tracking.md` for branch/preset decisions after this):

1. Candidate branch: `TRACKING` → Branch, else adapter default (`openspec/<name>` or `feature/<name>`).
2. When that branch exists locally or on `origin`: read `CHANGE_ROOT_REL/tracking.md` from it (`git show <branch>:CHANGE_ROOT_REL/tracking.md`, prefer local branch, else `origin/<branch>`). A non-empty on-disk Branch that differs from the candidate, **or a non-empty on-disk Change that differs from `CHANGE_ROOT`**, is inconsistent metadata: **STOP**; do not redirect to another branch and do not merge its Issue/PR/Presets.
3. Merge the feature-branch tracking file **field-by-field**: its non-empty Issue, Branch, and PR values win; its non-empty `Presets` **keys** win individually. Then overlay `PRESET_OVERRIDES` key-by-key and set **Change** = full `CHANGE_ROOT`. **Never replace the `Presets` object wholesale or inherit `Change` from a different checkout.**
4. When `STORE_SOURCE` is `hint` and the feature branch has a different non-empty Presets → `store`, adopt that store. For OpenSpec, rerun pre-flight status/instructions with the adopted store **without re-resolving it from the old hint**, recompute `CHANGE_ROOT` / `CHANGE_ROOT_REL`, reload `TRACKING_HINT`, and restart the pre-bind merge once. An explicit store never changes here.
5. When the branch does not exist, retain the prepared `TRACKING` baseline; it already contains non-empty `TRACKING_HINT` values.

**Branch resolution** — from merged **`TRACKING` only**:

5. **`FEATURE_BRANCH`:** `TRACKING` → Branch, else adapter default.
6. **`ORIGINAL_BRANCH`:** must ≠ `FEATURE_BRANCH`. First match: `TRACKING` Presets → `base-branch`; else current branch when ≠ `FEATURE_BRANCH`; else repo default (`main` / `origin/HEAD`). Note assumption in autonomous mode when not preset.
7. **Create `FEATURE_BRANCH`** from `ORIGINAL_BRANCH` when missing.
8. When `TRACKING` Presets `base-branch` is empty, set `ORIGINAL_BRANCH` in `TRACKING`.

**Bind** — requires merged `TRACKING` Presets → `workspace` and `parallelism` (interactive: after setup steps 2–3; autonomous: baseline from setup step 1). Set `WORK_CHECKOUT`, checkout main or create worktree, then `ACTIVE_CHANGE_ROOT = WORK_CHECKOUT + "/" + CHANGE_ROOT_REL`:

9. Per **workspace matrix** row for those Presets:
   - **`local`:** checkout `FEATURE_BRANCH` on main → `WORK_CHECKOUT` = main repo.
   - **`worktree` + `single`:** keep main on `ORIGINAL_BRANCH`; create worktree `apply-<name>` on `FEATURE_BRANCH` → `WORK_CHECKOUT` = worktree path. Keep worktree through autonomous handoff step 4.
   - **`worktree` + `subagent-per-group`:** checkout `FEATURE_BRANCH` on main → `WORK_CHECKOUT` = main repo.
10. **Persist `tracking.md`** at `ACTIVE_CHANGE_ROOT`: if absent, write merged `TRACKING`; if present, reconcile it with the same field-level formula in step 3, including `PRESET_OVERRIDES`. Never replace Presets wholesale or overwrite non-empty on-disk values with empty prepared values.
11. **Re-read** `tasks.md`, specs, `design.md`, `proposal.md` from `ACTIVE_CHANGE_ROOT`.

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
2. Open PR via `gh pr create --base ORIGINAL_BRANCH --head FEATURE_BRANCH` (explicit base — never rely on repo default).
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
- No branch resolution or bind before pre-bind merge from feature-branch `tracking.md` when that branch exists.
- No branch/bind without `TRACKING` Presets → `workspace` and `parallelism` (interactive: setup steps 2–3 only — not after step 1).
- No replacement of the `Presets` object during a tracking merge: merge keys and reapply `PRESET_OVERRIDES`.
- No autonomous setup that skips the complete `TRACKING` baseline because `TRACKING_HINT` has an Issue.
- No inheritance of `Change` from a tracking file: it is always the current adapter `CHANGE_ROOT`.
- No elevation of a hint-derived `STORE` into `PRESET_OVERRIDES`; re-resolve against feature-branch store when it differs.
- No post-bind artifact I/O via pre-bind adapter `CHANGE_ROOT` — use `ACTIVE_CHANGE_ROOT` (on main or in worktree per matrix).
- No treating adapter-path `TRACKING_HINT` as authoritative when feature-branch `tracking.md` exists.
- No copying a `TRACKING_HINT` Branch into `TRACKING` when the hint's own Change does not match `CHANGE_ROOT` — untrusted naming falls back to the adapter default.
- No merging a candidate branch's Issue/PR/Presets when its on-disk Change differs from `CHANGE_ROOT` — treat as a different change and STOP.
- No autonomous setup that leaves `workspace` out of `PRESET_OVERRIDES` — pre-bind merge could otherwise reintroduce `worktree` without the setup-time PRECHECK.
- No `gh pr create` without `--base ORIGINAL_BRANCH`.
- No `worktree` + `single` teardown before PR URL is pushed from the worktree.
- No mixing superpowers-bridge apply with this skill on the same change.
