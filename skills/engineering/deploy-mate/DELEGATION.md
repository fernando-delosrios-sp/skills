# deploy-mate — delegation map

Reach for these only when agent-first **legwork** is insufficient or the user asks.

## By phase

| Phase | Always | On-demand |
|-------|--------|-----------|
| 1 | Agent file analysis; Mermaid deploy topology in `architecture.md`; `c4-diagram` when 3+ containers | `find-docs`, `design-doc-mermaid`, platform diagram skills |
| 3–4 | `find-skills`, MCP catalogs | Platform MCPs, `env-secrets-manager` |
| 5 | `deployment-pipeline-design` | `cicd-pipeline-generator`, stack-specific deployment skills |

## Excluded

Do not invoke: `graphify`, `improve-codebase-architecture`.

## When to delegate (Phase 1)

Diagrams are **not** optional — see SKILL.md Phase 1. Additional delegation when:

- Production component remains `inferred` after file scan
- Stack or platform ambiguous after reading manifests and README
- User requests deeper analysis or alternate diagram formats

## MCP setup (Phase 3b)

Guide only — show `npx` commands and config paths. Do not install or authenticate without user confirmation.

