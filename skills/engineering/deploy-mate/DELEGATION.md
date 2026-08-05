# deploy-mate — delegation map

Fallbacks when mapped MCPs/skills cannot cover a source service. **Default path is Arm-ready install + use per [TOOLING.md](TOOLING.md)** — not manual-first.

## By phase

| Phase | Word | Always | Fallback only |
|-------|------|--------|---------------|
| 1 | Survey | Agent file analysis; Mermaid deploy topology; `c4-diagram` when 3+ containers | `find-docs`, `find-skills` (niche stack), `design-doc-mermaid` |
| 3 | Arm | Collection + deploy tooling map; `find-skills` for unmapped services | MCP catalog search |
| 3b | Arm-ready | Install, configure, verify MCPs, skills, **and local CLIs** — collaborate on auth | User opt-out → next method |
| 3c | Scaffold | Create placeholder resources via ready CLIs | User creates manually; record in registry |
| 4a | Document | Per-var obtain playbooks; `find-docs` for vendor steps | — |
| 4b | Harvest | Tool-first loop for **deploy-critical** vars only: MCP → skill → **CLI** → manual | `find-docs` for manual fallback steps |
| 5 | Forge proposal | `deployment-pipeline-design` — strategy dialog before files | `cicd-pipeline-generator`, stack-specific deployment skills (options only) |
| 5 | Forge artifacts | After strategy sign-off — generate repo files | `cicd-pipeline-generator`, stack-specific deployment skills |

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

Execute MCP/skill install/configure/verify — see [TOOLING.md](TOOLING.md) § A.

## CLI setup (Arm-ready)

Detect, install, authenticate, and verify local CLIs — see [TOOLING.md](TOOLING.md) § B. Guide user through install when agent cannot run it (sudo, GUI installer). Interactive logins (`fly auth login`) require user action in terminal — wait for confirmation, then verify. Present status table and get user ack before Scaffold/Harvest.

## Scaffold delegation

Prefer CLI scaffold commands when Arm-ready status is `ready`. When CLI cannot create (permissions, billing), guide user through console steps from CONFIG-GUIDE § Scaffold and record result in Scaffold registry.

## Forge delegation

**Proposal first** — invoke `deployment-pipeline-design` to draft strategy; present trade-offs and ask for feedback. Do **not** generate `.github/workflows/*`, `Dockerfile`, `fly.toml`, or other repo deploy files until strategy sign-off is recorded.

After sign-off, invoke `cicd-pipeline-generator` and stack-specific deployment skills to produce artifacts aligned with the approved strategy.


