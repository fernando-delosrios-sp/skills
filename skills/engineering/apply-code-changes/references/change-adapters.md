# Change adapters

Adapters resolve **where** the change lives and **which validators** run at the completion gate. The core apply loop is identical after adapter output is set.

## Selection (precedence)

When multiple adapters match, use the **highest-precedence signal** — not table order:

| Precedence | Adapter | When |
|---|---|---|
| 1 (highest) | **Direct** | User supplies an explicit directory path that contains `tasks.md` |
| 2 | **OpenSpec** | `/opsx:apply`, a change **name** without an explicit directory path, or `openspec status --change "<name>"` succeeds |

**Tie-break:** explicit folder path → **Direct**; `/opsx:apply` or registered change name without path → **OpenSpec**.

## Shared outputs

Every adapter sets:

| Variable | Meaning |
|---|---|
| `CHANGE_ROOT` | Directory containing `tasks.md` — adapter output at pre-flight. At apply time, bind **`ACTIVE_CHANGE_ROOT`** to the same repo-relative path on the checkout where work runs (skill step 2.5). All artifact reads/edits — including `tracking.md` — use `ACTIVE_CHANGE_ROOT`, never the pre-bind main-checkout path when work runs elsewhere |
| `NAME` | Basename of the change (for branches, PR titles, worktree names) |

Optional when present under `CHANGE_ROOT`:

| Path | Purpose |
|---|---|
| `specs/**/*.md` | Scenario → test coverage gate |
| `design.md` | Design/spec coherence gate |
| `proposal.md` | Changelog scope |
| `tracking.md` | Autonomous presets, issue/PR fields |

## OpenSpec adapter

Match `/opsx-apply`: paths come from CLI output, not repo-relative guesses.

1. Resolve `NAME` (basename only) from `/opsx:apply` argument, session context, or `tracking.md` → Change.
2. Resolve `--store <id>` when the user named a store, command hints carry it, or `tracking.md` Presets include `store`; keep sticky for the session.
3. Run `openspec status --change "<name>" --json` (append `--store` when set). Read `planningHome`, `changeRoot`, `artifactPaths`, `actionContext`.
4. Run `openspec instructions apply --change "<name>" --json` (append `--store`). Read `contextFiles` for concrete artifact paths.
5. Set `CHANGE_ROOT = changeRoot`. Prefer `artifactPaths` / `contextFiles` over reconstructing paths.
6. When invoked without prior `/opsx-apply` context, steps 3–4 are mandatory before touching artifacts.
7. Persist for autonomous/resume in `tracking.md`: Change → full `changeRoot`; Presets → `store` when used.

**Also sets:** `PLANNING_HOME` (from `planningHome.root`), `STORE` (when used).

**Default feature branch:** `tracking.md` → Branch, else `openspec/<name>`.

**Gate validator (item 4):** `openspec validate --all --json` with cwd `PLANNING_HOME` and `--store` when set — all `"valid": true`.

**Never:** hardcode `openspec/changes/<name>/` — resolve `changeRoot` from CLI every session.

## Direct adapter

For repos without OpenSpec, ad-hoc change folders, or copied ferspec-style layouts.

1. Set `CHANGE_ROOT` to the user-supplied directory (absolute or repo-relative). Confirm `tasks.md` exists — otherwise STOP and ask for the path.
2. Set `NAME` from `tracking.md` → Change basename, else basename of `CHANGE_ROOT`.
3. Read artifacts from standard layout under `CHANGE_ROOT` (same relative paths as ferspec). No CLI resolution step.
4. When `tracking.md` is missing and mode is autonomous, create it from the ferspec template if available; otherwise create a minimal stub with Issue, Change, Branch, Presets.

**Does not set:** `PLANNING_HOME`, `STORE`, `artifactPaths`, `contextFiles`.

**Default feature branch:** `tracking.md` → Branch, else `feature/<name>`.

**Gate validator (item 4):** skip OpenSpec validate. If the user explicitly asks and `openspec validate` succeeds from repo root, you may run it — never required for Direct.

## superpowers-bridge contrast

| | ferspec + apply-code-changes | superpowers-bridge |
|---|---|---|
| Apply skill | **apply-code-changes** (this skill) | Schema-embedded steps; **subagent-driven-development** executor |
| Extra artifacts | — | **plan** required; **verify.md** + **retrospective.md** inside apply |
| Archive | Manual `/opsx:archive` — never in apply | Archive commit **inside** apply step 5 |
| Verify | Completion gate in skill | **openspec-verify-change** verify-fix loop → verify.md |
| Worktree | Optional via structured-choices | User choice at apply step 1; PRECHECK for worktree skill |

Use **apply-code-changes** for ferspec and Direct task-folder apply. superpowers-bridge owns its own apply orchestration in schema.yaml — do not mix the two apply paths on one change.
