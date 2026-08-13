## Context

deploy-mate (`skills/engineering/deploy-mate/`) is a local-only engineering skill for end-to-end deployment readiness per environment. The pipeline runs Recon → Survey → Catalog → Arm → Arm-ready → Scaffold → Document → Harvest → Forge → Inject → Deploy → Verify.

Today:
- **Verify** (Phase 7) runs smoke/health from `deployment.md` → Steps but those steps are often minimal or absent
- **Forge proposal** lists Observability under Optional scope and allows deferral
- **Arm** maps Deploy and Collection tooling only; Arm runs at Phase 3, before Forge (Phase 5)

The grilling session established that runtime visibility must be **planned** (Forge), **tooling-mapped** (post-Forge `arm visibility`), **documented** (Forge artifacts → Steps), and **executed** (Verify) — with tier-1 blocking Deploy only, not Inject.

## Goals / Non-Goals

**Goals:**

- Ensure every deploy-critical component has agent-runnable tier-1 read paths before Deploy
- Insert `arm visibility` without adding a new top-level phase word
- Extend Verify in one command (tier-1 retry, then tier-2; deferrals explicit)
- Update skill docs, artifacts templates, gates, and delegation consistently

**Non-Goals:**

- Full observability stack setup (Datadog, OpenTelemetry collectors, alerting)
- Changes to `lib/`, npm scripts, or validate tooling
- New `.deploy-mate/` artifact file (visibility lives in existing files)
- Auto-rollback on Verify failure

## Decisions

### 1. Split Forge planning from post-Forge tooling (`arm visibility`)

**Choice:** Plan in Forge proposal; map tooling via **`arm visibility`** after sign-off, before `forge artifacts`.

**Rationale:** Arm (Phase 3) runs before Forge, so visibility tooling cannot live in the initial Arm pass. A targeted subcommand mirrors `inject ci` / `inject runtime` without re-running full Arm-ready.

**Alternatives considered:**
- New top-level phase (Wire/Instrument) — rejected to preserve 8-phase lexicon
- Fold into `forge artifacts` — rejected; separates tooling verify from file generation
- Re-run full `arm` + `arm-ready` — rejected as heavy and re-audits unrelated rows

### 2. Artifact placement

**Choice:**
- `architecture.md` → Components: **Visibility** column (summary: T1/T2/chain)
- `deployment.md`: required **Runtime visibility** strategy section + runnable commands in **Steps**
- `configuration.md`: third table **Runtime visibility tooling**
- `progress.md`: two checklist rows (planned, tooling ready)

**Rationale:** Components table is the system map; deployment.md holds executable protocol; configuration.md follows existing tooling patterns.

### 3. Tiered gates

**Choice:** Tier-1 blocks **Deploy** only; tier-2 deferrable with ack in `deployment.md` + Forge sign-off.

**Rationale:** Inject pushes secrets and does not need log access; soft tier-2 matches "Standard" scope without blocking ship for log-drain gaps.

### 4. Arm-ready scope for visibility tooling

**Choice:** Platform access verify only before deploy (`fly auth`, `gh auth`, read-only list/status).

**Rationale:** App logs and health HTTP responses do not exist until after first deploy; same pattern as Collection tooling proving CLI access, not var values.

### 5. Verify protocol

**Choice:** Single `verify` command; tier-1 with 3×10s backoff (boot-time override from Forge); read chain **runtime first, CI second**; tier-2 deferrals report `deferred` without failing run.

**Alternatives considered:**
- `verify health` / `verify logs` subcommands — rejected to keep Phase 7 unified
- Separate `observe` command — rejected

### 6. Non-HTTP components

**Choice:** Tier-1 = platform process status minimum; synthetic signals when platform exposes them; no silent waivers.

### 7. Subcommand order

**Choice:** `forge proposal ✓ → arm visibility → forge artifacts → inject → deploy → verify`

Deploy gate requires both `forge artifacts` (Steps documented) and `arm visibility` complete (tooling terminal).

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Existing env folders lack visibility columns | `reconcile` recommends backfill; Forge/arm visibility on next run |
| `arm visibility` adds friction before ship | Tier-2 deferrable; only tier-1 is hard gate |
| Platform CLI verify passes but app fails at Verify | Documented limitation; tier-1 retry handles cold start |
| Doc drift across 6 skill files | tasks.md lists every file; `npm run validate` before complete |

## Migration Plan

1. Update skill docs in dependency order: ARTIFACTS templates → SKILL gates/lexicon → COMMANDS protocols → TOOLING/DELEGATION/CONFIG-GUIDE cross-refs
2. No migration for committed `.deploy-mate/<env>/` — agents backfill on next `recon`/`reconcile`
3. Archive OpenSpec change → merge `engineering-deploy-mate` spec and ubiquitous-language terms

## Open Questions

None — grilling session reached shared understanding on all frontier decisions.
