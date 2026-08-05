# deploy-mate — artifact templates

Copy sections into `.deploy-mate/` files. Replace placeholders; delete unused sections.

## progress.md

```markdown
# deploy-mate progress

## Environment: <env>
Started: <date>
Status: in-progress | complete

## Phase checklist
- [ ] 0 Environment selected
- [ ] 1 Architecture — sign-off: pending | approved <date>
- [ ] 2 Env key inventory
- [ ] 3 Tooling map
- [ ] 3b MCP setup — done | skipped
- [ ] 4a Configuration docs (hard gate)
- [ ] 4b .env collection — complete | deferred
- [ ] 5 Deployment artifacts

## Re-run delta (<date>)
| Section | Status |
|---------|--------|
| architecture.md | unchanged \| updated \| new \| removed |
| configuration.md | … |
| deployment.md | … |
| generated files | … |

## Generated files
| File | Purpose | Created |
|------|---------|---------|
```

## architecture.md

```markdown
# Architecture — <env>

## Summary
<one paragraph>

## Components

| Component | Role | Confidence | Evidence |
|-----------|------|------------|----------|
| <name> | <runtime role> | confirmed \| inferred \| unknown | <file:line or config path> |

## Deploy targets
| Target | Platform | Notes |
|--------|----------|-------|

## Data & external services
| Service | Purpose | Env vars (names only) |
|---------|---------|----------------------|

## Sign-off
- [ ] User approved — <date or pending>
```

## configuration.md

```markdown
# Configuration — <env>

## Tooling

| Deploy target | MCP / skill | Notes |
|---------------|-------------|-------|
| | | |

## Environment variables

| Name | Required | Purpose | How to obtain | Consumed by |
|------|----------|---------|---------------|-------------|
| | yes \| no | | | |

## MCP setup notes
<install steps, config paths — or "skipped">
```

## deployment.md

```markdown
# Deployment — <env>

## Prerequisites
- [ ] 4a configuration docs complete
- [ ] `.env` complete (deploy blocked until done)

## Overview
<strategy: platform, CI/CD, containers>

## Steps
1. …

## Generated files
| File | Purpose |
|------|---------|

## Env var references
Names only — values in `.deploy-mate/<env>/.env`:
- `VAR_NAME` — used by …

## Rollback
<brief rollback notes>

## Optional (if in scope)
- Observability: …
- DNS: …
- Migrations: …
```

## .env (gitignore)

```bash
# .deploy-mate/<env>/.env — chmod 600, never commit
# KEY=value
```

Add to project `.gitignore` if missing:

```
.deploy-mate/**/.env
```
