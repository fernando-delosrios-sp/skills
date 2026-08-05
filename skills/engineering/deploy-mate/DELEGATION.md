# deploy-mate — delegation map

Command entry points: [COMMANDS.md](COMMANDS.md). Fallbacks when mapped MCPs/skills cannot cover a source service. **Default path is Arm-ready install + use per [TOOLING.md](TOOLING.md)** — not manual-first.

## By phase

| Phase | Word | Always | Fallback only |
|-------|------|--------|---------------|
| 1 | Survey | Agent file analysis; Mermaid deploy topology; `c4-diagram` when 3+ containers | `find-docs`, `find-skills` (niche stack), `design-doc-mermaid` |
| 3 | Arm | Collection + deploy tooling map; `find-skills` for unmapped services | MCP catalog search |
| 3b | Arm-ready | Install, verify **each tooling row**; update Status in configuration.md; tooling audit | User opt-out → row Status `opt-out` |
| 3c | Scaffold | Create placeholder resources via ready CLIs | User creates manually; record in registry |
| 4a | Document | Per-var obtain playbooks; `find-docs` for vendor steps | — |
| 4b | Harvest | Tool-first loop for **deploy-critical** vars only: MCP → skill → **CLI** → manual | `find-docs` for manual fallback steps |
| 5 | Forge proposal | `deployment-pipeline-design` — strategy dialog before files | `cicd-pipeline-generator`, stack-specific deployment skills (options only) |
| 5 | Forge artifacts | After strategy sign-off — generate repo files | `cicd-pipeline-generator`, stack-specific deployment skills |
| 5a | Inject CI | `gh secret set`, GitHub API, GitLab CLI per Deploy mapping | `env-secrets-manager`, `find-docs` for vendor syntax |
| 5b | Inject runtime | `fly secrets set`, `vercel env add`, `aws ssm put-parameter`, … | `find-docs`, platform MCPs when mapped |
| 6 | Deploy | Deploy tooling CLI/MCP/workflow dispatch | Stack-specific deployment skills |
| 7 | Verify | Commands from `deployment.md` → Steps | `find-docs` for platform health checks |

## Excluded

Do not invoke: `graphify`, `improve-codebase-architecture`.

## When to delegate (Survey)

Diagrams are **not** optional — see SKILL.md Survey. Additional delegation when:

- Production component remains `inferred` after file scan
- Stack or platform ambiguous after reading manifests and README
- User requests deeper analysis or alternate diagram formats

## When to delegate (Arm)

`find-skills` when a source service has no obvious MCP/skill in the Arm map.

## When to delegate (Harvest)

Only **after** tool-first attempt fails or user opted out:

- `find-docs` — current vendor console/CLI steps for manual fallback
- Manual collection — CONFIG-GUIDE Document steps verbatim

Do **not** skip MCP, skill, or **CLI** invocation when mapped and status is `ready`. Do **not** print CLI commands without running them unless the user must complete an interactive login in their terminal. Do **not** deploy application code or run dev runners (`slack run`, `fly deploy`, …) to obtain env vars — classify scope in Catalog instead.

## Harvest scope (Phase 4b)

Before collecting, check each var's **Deploy scope** in `configuration.md`. Only `deploy-critical` vars enter the collection loop. `local-dev` → excluded (placeholder optional). `runtime-derived` → excluded (document only). See CONFIG-GUIDE § Deploy scope.

## MCP setup (Arm-ready)

Execute per-row protocol for each mapped MCP/skill — see [TOOLING.md](TOOLING.md) § A. Update tooling table Status after verify. Do not mark Arm-ready complete while rows remain `pending`.

## CLI setup (Arm-ready)

Detect, install, authenticate, and verify each mapped CLI — see [TOOLING.md](TOOLING.md) § B. **Run verify commands**; record output in setup notes before Status → `ready`. Present tooling audit table; get user ack before Scaffold/Harvest.

## Scaffold delegation

Prefer CLI scaffold commands when Arm-ready status is `ready`. When CLI cannot create (permissions, billing), guide user through console steps from CONFIG-GUIDE § Scaffold and record result in Scaffold registry.

## Forge delegation

**Proposal first** — invoke `deployment-pipeline-design` to draft strategy; present trade-offs and ask for feedback. Do **not** generate `.github/workflows/*`, `Dockerfile`, `fly.toml`, or other repo deploy files until strategy sign-off is recorded.

After sign-off, invoke `cicd-pipeline-generator` and stack-specific deployment skills to produce artifacts aligned with the approved strategy.

## Inject delegation

**CI orchestrator** — prefer ready CLIs from Deploy tooling:

- GitHub: `gh secret set`, `gh api repos/…/environments/…/secrets`
- GitLab: `glab variable set` or API per Deploy mapping

**Runtime platform** — prefer ready CLIs:

- Fly: `fly secrets set`
- Vercel: `vercel env add`
- AWS: `aws ssm put-parameter` / Secrets Manager

When user prefers vault over direct push: `env-secrets-manager`. When CLI syntax unclear: `find-docs`. **Never** echo values; **never** skip CHECKPOINT approval.

## Verify delegation

Run health/smoke commands from `deployment.md` → Steps. Use Deploy tooling CLIs (`fly status`, workflow watch via `gh run watch`, curl health URLs). On failure, point user to Rollback section — do not auto-rollback.


