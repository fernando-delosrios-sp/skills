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
- **Required** for this `<env>` (yes/no + default if optional)
- **Consumed by** (service + evidence path)
- **Source service** (Stripe, Neon, Fly, etc.)

Names only — no values. See [CONFIG-GUIDE.md](CONFIG-GUIDE.md) for classes.

**Done when:** every runtime dependency in `architecture.md` maps to a named var with class and source service, or an explicit "none needed" note.

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

For each resource:

1. Check whether it already exists (CLI list/describe)
2. If missing and user approves, create with minimal config — record name, ID, region in `configuration.md` → **Scaffold registry**
3. Update affected Catalog vars — newly available IDs/names become obtainable in Document/Harvest

Re-run Scaffold during Harvest when a blocker is "resource does not exist."

**Done when:** every Catalog var whose obtain path requires a platform resource either has that resource scaffolded and recorded, or has an explicit defer/blocker with user acknowledgment.

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

## Harvest — Phase 4b (iterative)

Requires Arm-ready complete. **Tool-first** — run mapped MCPs, skills, **and CLIs** before manual paste. Agent executes CLI commands; do not only print them. See [TOOLING.md](TOOLING.md).

**Iterative loop** — not one pass. Repeat until the user declares Harvest **finished** (they may unblock blockers between rounds by creating resources, granting access, or pasting values).

Each round:

1. **Scaffold** any newly unblocked resources (Phase 3c mini-pass)
2. **Collect** — MCP → skill → CLI per var's chain; manual only when automated paths failed or opt-out
3. **Validate** → write `.deploy-mate/<env>/.env` (`chmod 600`) → update Harvest status + `Via:` note
4. **Report** — vars collected, validated, blocked; what user action would unblock next round
5. **Ask** — "Continue Harvest or mark finished?"

Follow [CONFIG-GUIDE.md](CONFIG-GUIDE.md) Harvest protocol. Group by source service. Never overwrite existing `.env` values silently. Do not echo secrets in chat.

**Done when:** user declares Harvest finished **and** every **Required: yes** var is Collected + Validated (with `via:` recorded) or has an explicit Blocker the user accepts.

## Forge — Phase 5

Requires Document complete. Always invoke `deployment-pipeline-design` for pipeline structure. On-demand: `cicd-pipeline-generator`, stack-specific deployment skills.

Produce:

| Output | Location |
|--------|----------|
| Process doc | `.deploy-mate/<env>/deployment.md` |
| CI workflow | `.github/workflows/*.yml` when applicable |
| Container config | `Dockerfile`, `docker-compose.yml` |
| Platform config | `fly.toml`, `vercel.json`, `infra/*.tf`, etc. |

List every generated file in `deployment.md` and `<env>/progress.md`. Reference var **names** from `.env` only. Existing files: show diff and confirm before overwrite.

Observability, DNS, and migrations — only when project or user requires.

**Deploy action** is blocked until `.env` is complete. Artifacts and files are ready; user triggers deploy.

**Done when:** `deployment.md` exists, all generated files are listed, and overwrites are confirmed.

## Re-runs

Diff existing artifacts against current repo state. In `<env>/progress.md`, mark each section: `unchanged | updated | new | removed`. Never overwrite `.env` values or generated deployment files without confirmation.

## Gates (summary)

| Gate | Blocks |
|------|--------|
| Survey sign-off | Catalog through Harvest |
| Arm-ready complete | Scaffold, Harvest |
| Scaffold acknowledged | Harvest (first pass) |
| Document complete | Forge |
| `.env` complete | Deploy action |
