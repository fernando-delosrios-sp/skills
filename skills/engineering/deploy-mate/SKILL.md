---
name: deploy-mate
description: End-to-end deployment readiness — architecture, env vars, CI/CD artifacts. Invoke with `/deploy-mate`.
disable-model-invocation: true
---

# deploy-mate

Greenfield or brownfield deployment readiness for one environment at a time. **Agent-first** discovery; delegate to skills only when confidence is low or the user asks. Outputs live under `.deploy-mate/`; generated repo files reference env var **names** only — never embed secrets.

## Artifacts

```
.deploy-mate/
├── progress.md
└── <env>/
    ├── architecture.md
    ├── configuration.md   ← 4a must complete before Phase 5
    ├── deployment.md
    └── .env                 ← gitignored, real values, chmod 600
```

New envs inherit from an existing env folder; document deltas only. Templates: [ARTIFACTS.md](ARTIFACTS.md). On-demand skills and MCPs: [DELEGATION.md](DELEGATION.md).

## Phase 0 — Environment

1. Ask which environment (e.g. `staging`, `production`) unless already stated.
2. If `.deploy-mate/` exists, read `progress.md` and the target env folder — treat as a **re-run** (see Re-runs).
3. Create missing dirs and seed `progress.md` from [ARTIFACTS.md](ARTIFACTS.md) if new.

**Done when:** target `<env>` is named and prior artifacts are loaded or scaffolded.

## Phase 1 — Architecture (agent-first)

Read manifests, infra configs, specs, and README. Draft `.deploy-mate/<env>/architecture.md` with **evidence** per component:

| Confidence | Meaning |
|------------|---------|
| `confirmed` | Explicit config or code reference cited |
| `inferred` | Reasonable deduction; cite what you read |
| `unknown` | Not determined — blocks sign-off for prod components |

**Legwork first.** Invoke skills only when:

- Any production component is `inferred` with no strong evidence
- Stack or platform is ambiguous after file scan
- User asks for deeper analysis

On-demand: `find-docs`, `design-doc-mermaid`, `c4-diagram`, platform diagram skills, `find-skills` (niche stack). **Excluded:** `graphify`, `improve-codebase-architecture`.

Present draft; **gate** — do not proceed until user sign-off on architecture.

**Done when:** `architecture.md` exists, every prod component is `confirmed` or explicitly accepted by user, and sign-off is recorded in `progress.md`.

## Phase 2 — Env key inventory

From architecture, list every env var **name** required at runtime (no values). Add to `configuration.md` tooling section and a names-only block — source for Phase 4.

**Done when:** every runtime dependency in `architecture.md` maps to a named var or an explicit "none needed" note.

## Phase 3 — Tooling map

Map deployment targets to MCPs and skills in `configuration.md` (tooling section). Use `find-skills` and MCP catalogs when the stack is niche or unfamiliar.

**Done when:** each deploy target in architecture has a tooling row (MCP, skill, or "agent-only").

## Phase 3b — MCP setup (skippable)

If user wants MCPs wired: guide install (`npx`, config paths); do not assume credentials. User may skip — record `skipped` in `progress.md`.

**Done when:** requested MCPs are configured or explicitly skipped.

## Phase 4a — Configuration docs (hard gate)

For **every** var from Phase 2, add per-var instructions in `configuration.md`: purpose, where to obtain, format constraints, which service consumes it.

**Gate:** Phase 5 is blocked until 4a is complete — every var has instructions.

**Done when:** `configuration.md` has no placeholder rows; `progress.md` marks 4a complete.

## Phase 4b — Assisted `.env` collection (parallel)

Non-blocking alongside 4a. Collect real values into `.deploy-mate/<env>/.env` (chmod 600, gitignored). Never overwrite existing values silently — diff and confirm. Optional: `env-secrets-manager` when user wants it.

**Done when:** user confirms `.env` complete or defers (deploy action stays blocked until complete).

## Phase 5 — Deployment artifacts

Requires 4a complete. Always invoke `deployment-pipeline-design` for pipeline structure. On-demand: `cicd-pipeline-generator`, stack-specific deployment skills.

Produce:

| Output | Location |
|--------|----------|
| Process doc | `.deploy-mate/<env>/deployment.md` |
| CI workflow | `.github/workflows/*.yml` when applicable |
| Container config | `Dockerfile`, `docker-compose.yml` |
| Platform config | `fly.toml`, `vercel.json`, `infra/*.tf`, etc. |

List every generated file in `deployment.md` and `progress.md`. Reference var **names** from `.env` only. Existing files: show diff and confirm before overwrite.

Observability, DNS, and migrations — only when project or user requires.

**Deploy action** is blocked until `.env` is complete. Artifacts and files are ready; user triggers deploy.

**Done when:** `deployment.md` exists, all generated files are listed, and overwrites are confirmed.

## Re-runs

Diff existing artifacts against current repo state. In `progress.md`, mark each section: `unchanged | updated | new | removed`. Never overwrite `.env` values or generated deployment files without confirmation.

## Gates (summary)

| Gate | Blocks |
|------|--------|
| Architecture sign-off | Phases 2–4 |
| 4a complete | Phase 5 |
| `.env` complete | Deploy action |
