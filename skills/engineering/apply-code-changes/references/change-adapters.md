# Change adapters

Adapters resolve **where** the change lives and **which validators** run at the completion gate. Pre-flight outputs are inputs to apply skill **bind** — not the post-bind artifact surface.

## Selection (precedence)

When multiple adapters match, use the **highest-precedence signal**:

| Precedence | Adapter | When |
|---|---|---|
| 1 (highest) | **Direct** | User supplies an explicit directory path that contains `tasks.md` |
| 2 | **OpenSpec** | `/opsx:apply`, change **name** without explicit path, or `openspec status --change "<name>"` succeeds |

**Tie-break:** explicit folder path → **Direct**; `/opsx:apply` or registered name without path → **OpenSpec**.

## Shared outputs

Every adapter sets:

| Variable | Meaning |
|---|---|
| `CHANGE_ROOT` | Adapter `changeRoot` / user path — pre-flight planning reads only |
| `CHANGE_ROOT_REL` | Repo-relative path from `CHANGE_ROOT` — skill computes `ACTIVE_CHANGE_ROOT` at bind |
| `NAME` | Basename of the change |

Post-bind artifact I/O uses **`ACTIVE_CHANGE_ROOT`** from the apply skill workspace matrix — never the pre-bind absolute `CHANGE_ROOT` when work runs on another checkout.

Optional under the change folder:

| Path | Purpose |
|---|---|
| `specs/**/*.md` | Scenario → test coverage gate |
| `design.md` | Design/spec coherence gate |
| `proposal.md` | Changelog scope |
| `tracking.md` | Loaded into `TRACKING_HINT` at pre-flight; merged into `TRACKING` at bind |

## OpenSpec adapter

Match `/opsx-apply`: paths from CLI, not repo guesses.

1. Resolve `NAME` from `/opsx:apply`, session context, or `TRACKING_HINT` / `tracking.md` → Change.
2. Resolve `--store` when user, hints, or `TRACKING` Presets include it.
3. Run `openspec status --change "<name>" --json` (append `--store` when set). Read `planningHome`, `changeRoot`, `artifactPaths`, `actionContext`.
4. Run `openspec instructions apply --change "<name>" --json` (append `--store`). Read `contextFiles`.
5. Set `CHANGE_ROOT = changeRoot`; compute `CHANGE_ROOT_REL` from repo root.
6. When invoked without prior `/opsx:apply` context, steps 3–4 are mandatory before other reads.
7. If `tracking.md` exists at `CHANGE_ROOT`, load into **`TRACKING_HINT` only** — not authoritative `TRACKING`. Persist at apply skill bind with merge rules.

**Also sets:** `PLANNING_HOME`, `STORE` (when used).

**Default feature branch:** `TRACKING` → Branch at bind, else `openspec/<name>`.

**Gate validator:** `openspec validate --all --json` from `PLANNING_HOME` with `--store` when set.

**Never:** hardcode `openspec/changes/<name>/`; create on-disk `tracking.md`.

## Direct adapter

1. Set `CHANGE_ROOT` to user path; confirm `tasks.md` exists.
2. Set `NAME` from `TRACKING_HINT` / basename of `CHANGE_ROOT`.
3. Compute `CHANGE_ROOT_REL`. Read standard layout from `CHANGE_ROOT`. Load `tracking.md` into **`TRACKING_HINT` only** when present.

**Does not set:** `PLANNING_HOME`, `STORE`, `artifactPaths`, `contextFiles`.

**Default feature branch:** `TRACKING` → Branch at bind, else `feature/<name>`.

**Gate validator:** skip OpenSpec validate unless user explicitly requests.

## superpowers-bridge contrast

| | ferspec + apply-code-changes | superpowers-bridge |
|---|---|---|
| Apply skill | **apply-code-changes** | Schema-embedded executor |
| Worktree | Workspace matrix in skill | User choice at apply step 1 |

Use **apply-code-changes** for ferspec and Direct apply. Do not mix apply paths on one change.
