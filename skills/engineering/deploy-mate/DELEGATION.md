# deploy-mate — delegation map

Reach for these only when agent-first **legwork** is insufficient or the user asks.

## By phase

| Phase | Always | On-demand |
|-------|--------|-----------|
| 1 | Agent file analysis | `find-docs`, `design-doc-mermaid`, `c4-diagram`, platform diagram skills |
| 3–4 | `find-skills`, MCP catalogs | Platform MCPs, `env-secrets-manager` |
| 5 | `deployment-pipeline-design` | `cicd-pipeline-generator`, stack-specific deployment skills |

## Excluded

Do not invoke: `graphify`, `improve-codebase-architecture`.

## When to delegate (Phase 1)

- Production component remains `inferred` after file scan
- Stack or platform ambiguous after reading manifests and README
- User requests deeper analysis or diagrams

## MCP setup (Phase 3b)

Guide only — show `npx` commands and config paths. Do not install or authenticate without user confirmation.
