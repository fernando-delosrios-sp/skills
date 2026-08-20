# OpenSpec change packages

When the target repo has OpenSpec (`openspec/config.yaml` or `openspec/specs/`), **change packages** replace standalone `plans/` files. The advisor writes `openspec/changes/<slug>/` — one folder per selected finding or grilled candidate. Do not also write `plans/NNN-*.md` on the same run.

Read the target `openspec/config.yaml` schema field and write that schema's artifacts. **ferspec** (common default) is below.

## Slug and reconcile

- Kebab-case slug from the finding title (e.g. `ci-run-tests`, `collapse-order-intake`).
- Before creating: list `openspec/changes/` excluding `archive/` — skip if the finding is already packaged; refresh in place when drifted.
- Record `git rev-parse --short HEAD` in `design.md` for drift detection.

## Artifacts (ferspec)

| File | Content |
|---|---|
| `.openspec.yaml` | `schema: ferspec` and `created: <YYYY-MM-DD>` |
| `discovery.md` | Scope in/out; Language terms (`draft` / `promote` / `conflicts-with-canonical`); Decisions (finding rationale, forks if any); Open questions (empty when locked); Scenarios discussed for specs |
| `proposal.md` | Why; What Changes (From/To when helpful); Capabilities (new or modified domain slugs); Impact (files, skill types, deps) |
| `design.md` | Context; Goals/Non-Goals; Decisions; current-state excerpts with `file:line`; repo conventions with exemplar paths; in/out of scope; STOP conditions; drift check command; git workflow |
| `specs/<capability>/spec.md` | At least one Gherkin delta — invoke **gherkin-authoring** when present. Thin deltas are fine for tooling/docs fixes |
| `tasks.md` | Checkbox execution plan mapped from [plan-template.md](./plan-template.md) — implementation groups, Verification, mandatory Documentation and Changelog groups |

**Section mapping from plan-template:**

- "Why this matters" → `proposal.md` Why + `discovery.md` Scope
- "Current state", excerpts, conventions, vocabulary constraints → `design.md` Context + Decisions
- Scope in/out, STOP conditions, drift check, git workflow → `design.md`
- Steps, test plan, done criteria → `tasks.md` implementation groups + Verification section
- Maintenance notes → `design.md` Risks/Trade-offs or last task group note

Do **not** add an "OpenSpec prerequisite" step — the change package *is* the proposal.

## Quality bar

Same bar as plan-template "Quality bar — check before finishing":

- Executor has zero advisor-session context — everything needed is in the change folder.
- Every task verification is a command + expected result.
- Exact files and symbols, not "the relevant module."
- STOP conditions match this change's real risks.
- No secret values — locations and credential types only.
- Cite capability spec slugs/requirements the advisor actually read in recon.

## Index (chat, not a file)

After all packages, report in chat:

- Slugs in recommended execution order
- Dependency edges between changes
- Status column (TODO | IN PROGRESS | DONE | BLOCKED | REJECTED)

No `plans/README.md` in OpenSpec mode.

## Invocation remaps (OpenSpec only)

| Variant | Behavior |
|---|---|
| `plan <description>` | One change folder under `openspec/changes/<slug>/` |
| `review-plan <path>` | Critique `tasks.md` + delta specs against the quality bar; tighten in place |
| `execute <slug>` | Invoke **apply-code-changes** on `openspec/changes/<slug>/`; advisor reviews apply output — never edits source |
| `reconcile` | Walk open changes (exclude `archive/`): refresh drifted `design.md`/`tasks.md`, mark DONE/BLOCKED/REJECTED; report what's executable |
| `--issues` | Publish `proposal.md` + link to change folder per issue; record URL in chat index |

Legacy mode: unchanged — `plans/` + [closing-the-loop.md](./closing-the-loop.md).

## Apply handoff

User or advisor runs `/opsx:apply <slug>` or invokes **apply-code-changes**. The advisor does not implement; it may review apply results when asked via `execute`.
