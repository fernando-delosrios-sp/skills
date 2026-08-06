# Overlays

## Purpose

Customize synced skills via semantic merge, static file operations, and generators.
## Requirements
### Requirement: Per-skill overlay directory

Every customized foreign skill SHALL have an overlay at `overlays/<skill-name>/OVERLAY.yaml`.

#### Scenario: Customized skill without overlay

- **GIVEN** a source skill has local modifications beyond upstream
- **WHEN** `npm run validate` or overlay audit runs
- **THEN** the system MUST flag the skill as needing overlay reconciliation

### Requirement: Universal generator defaults

The repository SHALL provide repo-wide generator defaults in `overlays/OVERLAY.yaml` (e.g., agents/openai.yaml generation).

#### Scenario: New skill without per-skill generator override

- **GIVEN** a skill has no per-skill generator configuration
- **WHEN** overlay generators apply
- **THEN** universal defaults from `overlays/OVERLAY.yaml` MUST be used

### Requirement: Overlay apply order

Overlay operations SHALL follow: sync → static file ops → audit → restore (unchanged inputs) → prepare remerge → semantic apply/reconcile.

#### Scenario: Post-sync overlay workflow

- **GIVEN** sync has overwritten a skill with a pending overlay
- **WHEN** the maintainer completes the overlay workflow
- **THEN** static ops MUST run before semantic merge and generator apply

### Requirement: Static file payloads

Overlays SHALL support static add/replace/remove operations with file payloads under `overlays/<name>/files/`.

#### Scenario: Static replace operation

- **GIVEN** an overlay declares a replace op for a file path
- **WHEN** `npm run overlay -- static` runs
- **THEN** the target file in `skills/` MUST be replaced with the payload from `overlays/<name>/files/`

### Requirement: Semantic merge via skill-overlay skill

When upstream and overlay inputs diverge, reconciliation SHALL use the skill-overlay skill for intelligent semantic merging.

#### Scenario: Pending remerge after update

- **GIVEN** `npm run update` prepares a remerge manifest in `.tmp/overlay-apply/`
- **WHEN** the maintainer invokes skill-overlay apply
- **THEN** the blended result MUST land in `skills/<category>/<name>/` with blended_ref referencing the apply commit

### Requirement: Pending apply determined by overlay route

Pending apply for a customized source skill SHALL be determined exclusively by overlay route — routes `fresh` and `remerge` mean pending; routes `restore` and `none` mean not pending. Lock timestamp comparison (`overlay_applied_at` vs `synced_at`) MUST NOT be used as pending authority.

#### Scenario: Timestamp applied but route remerge

- **GIVEN** a lock entry where `overlay_applied_at` is set and equals or exceeds `synced_at`
- **AND** overlay or upstream hashes differ from last blend metadata
- **WHEN** pending apply is evaluated
- **THEN** the skill MUST be considered pending apply
- **AND** the route MUST be `remerge`

#### Scenario: Never applied is pending

- **GIVEN** a source skill with overlay or generators
- **AND** lock entry has no `overlay_applied_at`
- **WHEN** pending apply is evaluated
- **THEN** the skill MUST be considered pending apply
- **AND** the route MUST be `fresh`

#### Scenario: Unchanged inputs not pending

- **GIVEN** a source skill with valid blend metadata and unchanged upstream and overlay hashes
- **AND** `blended_ref` resolves in git history
- **WHEN** pending apply is evaluated
- **THEN** the skill MUST NOT be considered pending apply
- **AND** the route MUST be `restore`

#### Scenario: Generator-only skill can be pending

- **GIVEN** a source skill with no per-skill overlay YAML but universal generators enabled
- **AND** generator inputs require first-time or repeat blend
- **WHEN** pending apply is evaluated
- **THEN** the skill MUST be considered pending apply when route is `fresh` or `remerge`

