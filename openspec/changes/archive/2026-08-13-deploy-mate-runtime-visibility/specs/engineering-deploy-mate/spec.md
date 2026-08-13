## ADDED Requirements

### Requirement: Runtime visibility plan at Forge proposal sign-off

The deploy-mate skill SHALL require a **runtime visibility** plan for every component listed in `architecture.md` → Components before Forge strategy sign-off is recorded.

Each component plan MUST specify:
- **Tier-1** (hard): health URL and/or platform status CLI — **runtime first**
- **Tier-2** (soft): log tail/stream and CI workflow conclusion when CI deploys — **CI second**
- **Read chain** order: runtime signals before CI confirmation
- Optional expected boot time for Verify backoff override

Forge proposal sign-off MUST NOT proceed while any deploy-critical component lacks a tier-1 definition.

#### Scenario: Forge blocks without per-component tier-1

- **WHEN** the agent runs `forge proposal` and a deploy-critical component has no tier-1 visibility definition
- **THEN** the agent MUST NOT record Forge strategy sign-off
- **AND** MUST list the missing component(s) as blockers

#### Scenario: Forge sign-off records visibility plan

- **WHEN** the user approves Forge proposal with complete runtime visibility per component
- **THEN** the agent MUST write the plan to `deployment.md` → Runtime visibility
- **AND** MUST update `architecture.md` → Components Visibility column
- **AND** MUST mark `progress.md` → Runtime visibility — planned (Forge sign-off) with date

### Requirement: arm visibility subcommand maps and verifies tooling

The deploy-mate skill SHALL provide an **`arm visibility`** subcommand that runs after Forge proposal sign-off and before `forge artifacts`.

The subcommand MUST:
1. Read the runtime visibility plan from `architecture.md` and `deployment.md`
2. Add or update **Runtime visibility tooling** rows in `configuration.md` (third tooling table alongside Deploy and Collection tooling)
3. Verify **platform access only** for each row (auth, read-only list/status commands) — NOT live app logs or health HTTP responses before deploy
4. Set terminal status per row: `ready | opt-out | manual-only`
5. Present an audit table and mark `progress.md` → Runtime visibility tooling — ready when all tier-1 rows are terminal

#### Scenario: arm visibility after Forge proposal

- **WHEN** Forge proposal sign-off is recorded and the user invokes `arm visibility`
- **THEN** the agent MUST populate Runtime visibility tooling rows per component and tier
- **AND** MUST run platform-access verify commands for each `ready` row
- **AND** MUST NOT re-run full Arm-ready for Deploy or Collection tooling

#### Scenario: arm visibility blocks on pending tier-1 rows

- **WHEN** any tier-1 runtime visibility tooling row remains `pending` after `arm visibility` completes
- **THEN** the agent MUST NOT mark Runtime visibility tooling — ready in `progress.md`
- **AND** MUST report pending rows as blockers for Deploy

### Requirement: Deploy gate requires tier-1 visibility preparation

The deploy-mate skill SHALL block **`deploy`** until both conditions are true for every deploy-critical component tier-1 read path:

1. Runnable commands documented in `deployment.md` → Steps (requires `forge artifacts` complete)
2. Corresponding Runtime visibility tooling rows have terminal status (`ready`, `opt-out`, or `manual-only`)

**Inject** (`inject ci`, `inject runtime`, `inject`) MUST NOT be blocked by runtime visibility preparation.

#### Scenario: Deploy blocked without documented Steps

- **WHEN** the user invokes `deploy` and tier-1 commands are missing from `deployment.md` → Steps
- **THEN** the agent MUST fail fast and name `forge artifacts` as the unlocking command

#### Scenario: Deploy blocked without visibility tooling ready

- **WHEN** the user invokes `deploy` and tier-1 Runtime visibility tooling rows are not all terminal
- **THEN** the agent MUST fail fast and name `arm visibility` as the unlocking command

#### Scenario: Inject proceeds without visibility prep

- **WHEN** runtime visibility tooling is not ready but Harvest and Inject prerequisites are met
- **THEN** the agent MUST allow `inject ci` and `inject runtime`
- **AND** MUST still block `deploy` until visibility prep is complete

### Requirement: Verify executes tier-1 then tier-2 with retry

The deploy-mate skill SHALL extend **`verify`** (single command, Phase 7) to execute prepared read paths in order:

1. **Tier-1** per component — runtime health/status first; default **3 attempts with 10s backoff** before reporting tier-1 failure (override when Forge records expected boot time)
2. **Tier-2** — logs and CI confirmation (`gh run watch` when applicable) after tier-1; components with tier-2 deferred MUST report `deferred` without failing the run

Verify outcome in `progress.md` MUST be `passed | failed` with a per-component tier summary. Tier-1 failure MUST point to `deployment.md` → Rollback; the agent MUST NOT auto-rollback.

#### Scenario: Verify tier-1 retry on cold start

- **WHEN** the first tier-1 health check fails and no boot-time override is recorded
- **THEN** the agent MUST retry up to 3 times with 10s between attempts before recording tier-1 failure

#### Scenario: Verify read chain runtime before CI

- **WHEN** the deployment strategy uses CI to deploy to a runtime platform
- **THEN** Verify MUST run runtime tier-1 checks before tier-2 CI confirmation
- **AND** MUST run CI checks only when tier-2 includes CI workflow conclusion

#### Scenario: Verify reports tier-2 deferrals

- **WHEN** a component has tier-2 marked `deferred` with user ack in `deployment.md`
- **THEN** Verify MUST skip tier-2 checks for that component
- **AND** MUST include `deferred` in the per-component summary without failing the overall run

### Requirement: Non-HTTP components use platform status for tier-1

For components without an HTTP health endpoint (workers, queue consumers, cron jobs), tier-1 MUST use platform process/container status (e.g. `fly machine list`, `kubectl get pods`) as the minimum signal.

When the platform exposes synthetic work signals (queue depth, last-run timestamp, heartbeat), the Forge plan MAY document them as supplementary tier-1 evidence. Tier-1 MUST NOT be silently waived for deploy-critical components.

#### Scenario: Worker component tier-1

- **WHEN** a deploy-critical worker component has no health URL
- **THEN** the runtime visibility plan MUST define a platform status CLI as tier-1
- **AND** Verify MUST execute that command at tier-1

### Requirement: Tier-2 deferral requires explicit acknowledgment

When the user defers tier-2 (logs/metrics) for a component, the acknowledgment MUST be recorded in both:
- `deployment.md` → Runtime visibility → per-component `tier-2: deferred` with reason and ack date
- Forge strategy sign-off (user explicitly accepts deferral)

Deferred tier-2 MUST NOT block Deploy or cause Verify to fail.

#### Scenario: User defers logs for a component

- **WHEN** the user accepts tier-2 deferral for a component during Forge proposal
- **THEN** the agent MUST record deferral reason and ack date in `deployment.md`
- **AND** MUST NOT require tier-2 tooling rows to be `ready` for Deploy

### Requirement: Pipeline order includes arm visibility

The deploy-mate guided pipeline (`run`, `continue`, `help` phase order) SHALL insert **`arm visibility`** after Forge proposal sign-off and before `forge artifacts`:

`… → forge proposal ✓ → arm visibility → forge artifacts → inject … → deploy → verify`

#### Scenario: run chains arm visibility after Forge sign-off

- **WHEN** `run` completes Forge proposal sign-off in one invocation
- **THEN** the agent MUST proceed to `arm visibility` before `forge artifacts` in the same run segment unless a gate requires user input
