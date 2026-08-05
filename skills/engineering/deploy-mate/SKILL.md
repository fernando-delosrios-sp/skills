---
name: deploy-mate
description: End-to-end deployment readiness — architecture, env vars, CI/CD artifacts. Invoke with `/deploy-mate`.
disable-model-invocation: true
---

# deploy-mate

Greenfield or brownfield deployment readiness for **one environment at a time**. **Agent-first** discovery; delegate to skills only when confidence is low or the user asks. Primary deliverable: **actionable secret and env-var guidance** — every variable documented with step-by-step obtain instructions, then collected and validated into `.deploy-mate/<env>/.env`. Generated repo files reference var **names** only — never embed secrets.

## Process lexicon

Each **leading word** names one phase. Use it in chat, artifacts, and `progress.md` — never collapse distinct phases under "configuration."

| Word | Phase | Distinct job |
|------|-------|--------------|
| **Recon** | 0 | Name `<env>`; load or scaffold per-env artifacts |
| **Survey** | 1 | Discover runtime architecture; user sign-off |
| **Catalog** | 2 | Inventory var **names** only — class, source, consumer |
| **Arm** | 3 | Map deploy + collection tools per target and source service |
| **Arm-ready** | 3b | Install, authenticate, verify every mapped tool — **collaborate with user** |
| **Scaffold** | 3c | Create placeholder platform resources that **produce** missing config |
| **Document** | 4a | Write per-var obtain playbooks — numbered, executable steps |
| **Harvest** | 4b | Iterative value collection — tool-first loop until user finishes |
| **Forge** | 5 | CI/CD and deploy artifacts |

**Catalog ≠ Harvest.** Catalog names vars; Harvest collects values. **Arm-ready ≠ Harvest.** Arm-ready makes tools work; Harvest uses them. **Scaffold ≠ Forge.** Scaffold stages empty platform shells; Forge generates repo deploy files.

**Deploy scope** — every Catalog var is tagged `deploy-critical`, `local-dev`, or `runtime-derived`. Harvest collects **deploy-critical** only; never deploy app code to obtain config.

## Artifacts

```
.deploy-mate/
└── <env>/
    ├── progress.md        ← per environment, not shared
    ├── architecture.md
    ├── configuration.md   ← Document must complete before Forge
    ├── deployment.md
    └── .env               ← gitignored, real values, chmod 600
```

New envs inherit from an existing env folder; document deltas only. Templates: [ARTIFACTS.md](ARTIFACTS.md). Obtain playbook: [CONFIG-GUIDE.md](CONFIG-GUIDE.md). MCP/skill install & use: [TOOLING.md](TOOLING.md). Delegation fallbacks: [DELEGATION.md](DELEGATION.md).

## Recon — Phase 0

1. Ask which environment (e.g. `staging`, `production`) unless already stated.
2. If `.deploy-mate/<env>/` exists, read `progress.md` and sibling artifacts — treat as a **re-run** (see Re-runs).
3. Create missing dirs and seed `<env>/progress.md` from [ARTIFACTS.md](ARTIFACTS.md) if new.

**Done when:** target `<env>` is named and prior artifacts are loaded or scaffolded.

## Survey — Phase 1

Read manifests, infra configs, specs, and README. Draft `.deploy-mate/<env>/architecture.md` with **evidence** per component:

| Confidence | Meaning |
|------------|---------|
| `confirmed` | Explicit config or code reference cited |
| `inferred` | Reasonable deduction; cite what you read |
| `unknown` | Not determined — blocks sign-off for prod components |

### Diagram (mandatory)

Every `architecture.md` **must** include a `## Diagram` section — text-only architecture is incomplete.

1. **Deploy topology** — embedded Mermaid in `architecture.md` showing runtime components, deploy targets, and external services (always).
2. **Container view** — invoke `c4-diagram` when the system has 3+ containers; link the generated `.drawio` file from `architecture.md`. Use `design-doc-mermaid` or platform diagram skills when Mermaid layout is insufficient.

Diagram labels must match component names in the tables below.

**Legwork first** for evidence gaps. Invoke `find-docs`, `find-skills` (niche stack) only when:

- Any production component is `inferred` with no strong evidence
- Stack or platform is ambiguous after file scan
- User asks for deeper analysis

**Excluded:** `graphify`, `improve-codebase-architecture`.

Present draft; **gate** — do not proceed until user sign-off on architecture.

**Done when:** `architecture.md` exists with a populated `## Diagram` section (Mermaid + linked C4 when applicable), every prod component is `confirmed` or explicitly accepted by user, and sign-off is recorded in `<env>/progress.md`.

## Catalog — Phase 2

From architecture and code (`process.env`, `.env.example`, deploy configs, README), list every env var **name**. For each, record in `configuration.md`:

- **Class:** `secret` | `config` | `derived`
- **Deploy scope:** `deploy-critical` | `local-dev` | `runtime-derived` — see [CONFIG-GUIDE.md](CONFIG-GUIDE.md) § Deploy scope
- **Required** for this `<env>` (yes/no + default if optional) — **only** for `deploy-critical` vars does Required: yes block Harvest
- **Consumed by** (service + evidence path — cite deploy config vs local dev script)
- **Source service** (Stripe, Neon, Fly, etc.)

Names only — no values. When the same name appears in both deploy and local dev paths, split into separate Catalog entries or document both consumers with scope per path.

**Done when:** every runtime dependency in `architecture.md` maps to a named var with class, deploy scope, and source service, or an explicit "none needed" note; every var in `.env.example` is classified — none left `unknown` scope.

## Arm — Phase 3

Map **two** tool layers in `configuration.md` — see [TOOLING.md](TOOLING.md):

1. **Deploy tooling** — MCPs/skills for each deploy target (Fly, Vercel, Terraform, …)
2. **Collection tooling** — MCP, skill, **local CLI**, and fallback method per **source service** from Catalog

Every var must have at least one automated path (`mcp`, `skill`, or `cli`) before `manual`. Use `find-docs` for CLI install/auth commands; `find-skills` when no tool exists.

**Done when:** deploy targets and source services each have tooling rows with MCP, CLI, install path, primary method, and intended collection chain.

## Arm-ready — Phase 3b (gate before Scaffold and Harvest)

**Independent preliminary process** — complete before Scaffold or Harvest. **Collaborate with the user** on every auth step; do not assume credentials exist.

Execute both checklists in [TOOLING.md](TOOLING.md):

**MCPs/skills:** install → configure → authenticate (`mcp_auth`) → verify with read-only call

**Local CLIs:** detect (`which`, `--version`) → install if missing (guide user; run when approved) → authenticate (`fly auth login`, `gh auth login`, …) → verify with read-only command (`fly apps list`, `aws sts get-caller-identity`, …)

User may **opt out** per service — record `opt-out` and downgrade affected vars to the next method. Do not enter Scaffold or Harvest while any non-opt-out mapped tool or CLI remains unverified.

**Done when:** every mapped MCP, skill, and CLI is `ready` or `opt-out`; verify results in MCP setup notes and CLI setup notes; user confirms tooling is usable.

## Scaffold — Phase 3c (gate before Harvest)

Create **placeholder platform resources** the deployment will need — not the app deploy itself, but the stage that **unblocks** missing config. Use Arm-ready tools (CLIs first). See [CONFIG-GUIDE.md](CONFIG-GUIDE.md) § Scaffold.

Examples: Fly app shell, Neon project + database, Vercel project link, S3 bucket, Stripe restricted key scaffold, GitHub repo/environment, empty K8s namespace.

**Forbidden:** deploying application code (`fly deploy`, `vercel deploy`, `slack run`, `npm run deploy`, uploading bundles) to obtain env vars. Scaffold creates **empty shells** — IDs, names, tokens from platform APIs — not runtime outputs from a running app.

For each resource:

1. Check whether it already exists (CLI list/describe)
2. If missing and user approves, create with minimal config — record name, ID, region in `configuration.md` → **Scaffold registry**
3. Update affected Catalog vars — newly available IDs/names become obtainable in Document/Harvest

Re-run Scaffold during Harvest when a blocker is "resource does not exist" — still **no app deploy**.

**Done when:** every **deploy-critical** Catalog var whose obtain path requires a platform resource either has that resource scaffolded and recorded, or has an explicit defer/blocker with user acknowledgment.

## Document — Phase 4a (hard gate)

For **every** var from Catalog, write a full per-variable block in `configuration.md` following [CONFIG-GUIDE.md](CONFIG-GUIDE.md).

Each block **must** include:

- Purpose, class, required/default, consumed-by evidence
- **How to obtain** — numbered steps with console path, full URL, or exact CLI (not "get from dashboard")
- **Format & validation** — shape, constraints, verify command
- **Deploy mapping** — how the value reaches the runtime on the target platform

Reference scaffolded resources by name/ID from the Scaffold registry. Use `find-docs` when vendor obtain steps are unclear. Reject placeholder or one-line obtain instructions — they fail the gate.

**Gate:** Forge blocked until Document complete.

**Done when:** every var has a CONFIG-GUIDE block with no rejected obtain patterns; `<env>/progress.md` marks Document complete.

## Harvest — Phase 4b (iterative, hold between rounds)

Requires Arm-ready complete. **Tool-first** — run mapped MCPs, skills, **and CLIs** before manual paste. Agent executes CLI commands; do not only print them. See [TOOLING.md](TOOLING.md).

**Deploy scope filter** — Harvest collects **deploy-critical** vars only. See [CONFIG-GUIDE.md](CONFIG-GUIDE.md) § Deploy scope. `local-dev` vars get Harvest status `excluded — local-dev` (placeholder optional, user may supply). `runtime-derived` vars get `excluded — runtime-derived` — document in Catalog/Document but never block Harvest or trigger deploy.

**Hold** — Harvest is a loop with mandatory pauses. Do **not** enter Forge, generate deployment files, **deploy the application**, or treat Harvest as complete until the user explicitly declares it **finished**. Partial progress is not completion.

**Iterative loop** — not one pass. Repeat until the user declares Harvest **finished** (they may unblock blockers between rounds by creating resources, granting access, or pasting values).

Each round:

1. **Scaffold** any newly unblocked resources (Phase 3c mini-pass) — platform shells only, **never app deploy**
2. **Collect** — attempt **every** pending **deploy-critical** var with Required: yes in the current service cluster — MCP → skill → CLI per chain; manual only when automated paths failed or opt-out. Skip `local-dev` and `runtime-derived` unless user explicitly requests collection.
3. **Validate** → write `.deploy-mate/<env>/.env` (`chmod 600`) → update Harvest status + `Via:` note
4. **Report** — full status table: every Catalog var with scope, Collected / Validated / excluded / Blocker / pending. Name specific user actions for deploy-critical blockers only.
5. **Stop** — ask: "Continue Harvest or mark finished?" **Wait for the user's reply.** Do not start the next round, Forge, or any post-Harvest work in the same turn.

Follow [CONFIG-GUIDE.md](CONFIG-GUIDE.md) Harvest protocol. Group by source service. Never overwrite existing `.env` values silently. Do not echo secrets in chat.

**Forbidden during Harvest:** advancing to Forge; marking Harvest finished without user saying so; deploying app code to obtain vars; treating `local-dev`/`runtime-derived` gaps as blockers; treating optional vars as sufficient when **deploy-critical** Required: yes vars remain pending without accepted Blockers.

**Done when:** user declares Harvest finished **and** every **deploy-critical** var with Required: yes is Collected + Validated (with `via:` recorded) or has an explicit Blocker the user accepts; `<env>/progress.md` marks Harvest finished with date.

## Forge — Phase 5

Requires Document complete **and** Harvest finished. **Strategy before artifacts** — agree on the deployment approach with the user before creating any repo files.

### Forge proposal (gate — no repo files until sign-off)

1. **Draft** — invoke `deployment-pipeline-design` for pipeline structure. From `architecture.md`, Catalog, and tooling map, write `.deploy-mate/<env>/deployment.md` **strategy sections only** (see [ARTIFACTS.md](ARTIFACTS.md)): platform choice, CI/CD flow, container/build approach, env injection method, rollback outline, optional scope (observability, DNS, migrations).
2. **Present** — summarize the proposed strategy in chat; call out trade-offs and open questions.
3. **Dialog** — ask for feedback. Revise the proposal until the user approves or accepts explicit deferrals.
4. **Sign-off** — record approval in `deployment.md` → Sign-off and `<env>/progress.md`. **Do not proceed** until sign-off is recorded.

On-demand during proposal: `cicd-pipeline-generator`, stack-specific deployment skills — for options and comparison, not file generation yet.

### Forge artifacts (after sign-off)

Only after strategy sign-off, generate repo files:

| Output | Location |
|--------|----------|
| Process doc | `.deploy-mate/<env>/deployment.md` (complete Steps + Generated files) |
| CI workflow | `.github/workflows/*.yml` when applicable |
| Container config | `Dockerfile`, `docker-compose.yml` |
| Platform config | `fly.toml`, `vercel.json`, `infra/*.tf`, etc. |

List every generated file in `deployment.md` and `<env>/progress.md`. Reference var **names** from `.env` only. Existing files: show diff and confirm before overwrite.

Observability, DNS, and migrations — only when agreed in the Forge proposal.

**Deploy action** is blocked until `.env` is complete. Artifacts and files are ready; user triggers deploy.

**Done when:** strategy sign-off recorded, `deployment.md` exists with all generated files listed, and overwrites are confirmed.

## Re-runs

Diff existing artifacts against current repo state. In `<env>/progress.md`, mark each section: `unchanged | updated | new | removed`. Never overwrite `.env` values or generated deployment files without confirmation.

## Gates (summary)

| Gate | Blocks |
|------|--------|
| Survey sign-off | Catalog through Harvest |
| Arm-ready complete | Scaffold, Harvest |
| Scaffold acknowledged | Harvest (first pass) |
| Harvest round end | Next round, Forge — **hold until user replies** |
| Harvest finished (user declared) | Forge |
| Document complete | Forge |
| Forge strategy sign-off | Repo deploy files (workflows, Dockerfile, fly.toml, …) |
| `.env` deploy-critical complete | Deploy action |
