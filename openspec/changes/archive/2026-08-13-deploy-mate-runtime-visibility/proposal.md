## Why

deploy-mate ships applications through an eight-phase pipeline but does not require agents or users to prepare **runtime visibility** — read paths for health, status, logs, and errors from deployed components. Verify (Phase 7) assumes those commands already exist in `deployment.md` → Steps, while Forge treats observability as optional and often deferred. Without prepared feedback loops, post-deploy debugging is ad hoc and deployments cannot be confidently validated or fixed.

## What Changes

- Introduce **runtime visibility** as a first-class concern: per-component tier-1 (health/status, runtime first) and tier-2 (logs, CI confirmation second) read paths
- Add **`arm visibility`** subcommand after Forge proposal sign-off to map **Runtime visibility tooling** and verify platform CLI access
- Require runtime visibility plan at **Forge proposal sign-off** (hard gate for downstream phases)
- Extend **Verify** to run tier-1 (with retry/backoff) then tier-2 in a single pass; tier-2 deferrals allowed with explicit user ack
- Add **Deploy hard gate**: tier-1 commands documented in `deployment.md` → Steps **and** runtime visibility tooling rows terminal — Inject is **not** blocked
- Extend artifacts: `architecture.md` Components **Visibility** column; `deployment.md` **Runtime visibility** section; `configuration.md` third tooling table; two new `progress.md` checklist rows
- Replace Forge optional "Observability: deferred" default with required runtime visibility planning

## Capabilities

### New Capabilities

- `engineering-deploy-mate`: deploy-mate skill behavior for runtime visibility planning, tooling, gates, and verify execution

### Modified Capabilities

- `ubiquitous-language`: add domain terms for runtime visibility, tier-1/tier-2, read chain, and runtime visibility tooling

## Impact

- **Local-only skill** (no upstream `source` in manifest): `skills/engineering/deploy-mate/`
- Files: `SKILL.md`, `COMMANDS.md`, `ARTIFACTS.md`, `DELEGATION.md`, `TOOLING.md`, `CONFIG-GUIDE.md` (gates cross-reference only)
- No changes to `lib/`, npm scripts, or overlay pipeline
- **Non-breaking** for existing `.deploy-mate/<env>/` artifacts — reconcile may prompt visibility backfill on re-run
