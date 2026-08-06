# overlay-pipeline Specification

## Purpose
TBD - created by archiving change split-overlay-lifecycle-module. Update Purpose after archive.
## Requirements
### Requirement: Deep pipeline public interface

The overlay lifecycle SHALL expose a single public module (`lib/overlay-pipeline.mjs`) with five operation groups: `audit`, `restore`, `prepare`, `static`, and `extract`. CLI scripts (`scripts/sync.mjs`) and orchestrators (`lib/update.mjs`) MUST import from this pipeline module (or its re-export barrel) rather than from internal submodules.

#### Scenario: Update workflow uses pipeline only

- **WHEN** `npm run update` runs audit, restore, static apply, and prepare steps
- **THEN** all overlay operations MUST be invoked through the pipeline public interface

#### Scenario: Internal modules not imported by CLI

- **WHEN** a maintainer inspects imports in `scripts/sync.mjs` and `lib/update.mjs`
- **THEN** those files MUST NOT import from `overlay-model`, `overlay-static`, `overlay-manifest`, or `overlay-extract` directly

### Requirement: Overlay model submodule

The repository SHALL provide `lib/overlay-model.mjs` owning overlay discovery, YAML load/validate, change partitioning, and content hashing. This module MUST NOT perform git checkout, clone, or manifest file writes.

#### Scenario: Model layer is pure filesystem and YAML

- **WHEN** `loadOverlay`, `partitionChanges`, `hashOverlay`, or `discoverOverlays` runs
- **THEN** the operation MUST be implemented in `overlay-model.mjs` without git I/O

#### Scenario: Generator-config loads model only

- **WHEN** `lib/generator-config.mjs` needs `hasOverlay` or `loadOverlay`
- **THEN** it MUST import from `overlay-model.mjs`, not from the monolithic `overlays.mjs`

### Requirement: Static operations submodule

The repository SHALL provide `lib/overlay-static.mjs` owning static add/replace/remove file operations from `overlays/<name>/files/` payloads into the canonical skill tree.

#### Scenario: Static apply via pipeline

- **WHEN** `npm run overlay -- static` runs
- **THEN** static operations MUST be delegated to `overlay-static.mjs` through the pipeline `static` group

#### Scenario: Static ops before semantic prepare

- **WHEN** `prepareOverlayManifest` runs with `runStatic: true`
- **THEN** static ops MUST complete before manifest content is assembled

### Requirement: Manifest preparation submodule

The repository SHALL provide `lib/overlay-manifest.mjs` owning remerge manifest and generator-only manifest generation in `.tmp/overlay-apply/`.

#### Scenario: Pending remerge manifest

- **WHEN** `npm run overlay -- prepare` runs for a skill with pending remerge route
- **THEN** a manifest file MUST be written via `overlay-manifest.mjs`

#### Scenario: Generator-only manifest

- **WHEN** a skill has generators but no per-skill overlay YAML
- **THEN** `prepareGeneratorManifest` MUST produce a generator apply manifest without requiring semantic changes

### Requirement: Extract submodule

The repository SHALL provide `lib/overlay-extract.mjs` owning overlay draft extraction from local diffs (canonical tree, agents tree, or git commit).

#### Scenario: Extract from agents working copy

- **WHEN** `npm run extract-overlay -- --skill git-commit --from-agents` runs
- **THEN** extraction logic MUST execute in `overlay-extract.mjs` and produce a draft `OVERLAY.yaml`

#### Scenario: Extract skips existing overlay

- **GIVEN** a skill already has an overlay directory
- **WHEN** extract runs without `--force`
- **THEN** the extract submodule MUST skip the skill with status `skipped`

### Requirement: Backward-compatible export surface

During migration, `lib/overlays.mjs` SHALL re-export the pipeline public API so existing import paths continue to work until call sites are updated. No npm script behavior or overlay workflow order SHALL change.

#### Scenario: Validate unchanged after split

- **GIVEN** the repository state is unchanged except for the module split
- **WHEN** `npm run validate` runs
- **THEN** it MUST produce the same pass/fail results as before the split

#### Scenario: Sync does not import audit internals

- **WHEN** `lib/sync.mjs` imports overlay helpers
- **THEN** it MUST import only `hasOverlay` and `printOverlayApplyPrompt` (or pipeline equivalents), not audit/restore/manifest internals

### Requirement: Audit and restore test seam

The pipeline `audit` and `restore` groups SHALL be unit-testable without filesystem git operations by accepting injected dependencies for lock lookup and blended-ref validation.

#### Scenario: Route determination without git checkout

- **WHEN** a unit test calls audit with mocked lock entries and hash values
- **THEN** the pipeline MUST return the correct overlay route (`restore`, `remerge`, `fresh`, or `none`) without executing `git checkout`

### Requirement: Unified pending apply entry point

The overlay pipeline SHALL expose `isPendingApply(skillName)` as the single authority for whether a skill needs semantic overlay apply or first-time blend. The function MUST derive pending state from overlay route via `auditSkill` and `isOverlayRoutePending` — not from lock timestamps.

Call sites that need pending detection (`lib/sync.mjs`, `lib/tmp.mjs`, and future orchestrators) MUST use `isPendingApply` instead of timestamp heuristics or direct lock inspection.

#### Scenario: Pending when route is fresh

- **GIVEN** a source skill with a per-skill overlay and lock entry where `overlay_applied_at` is null
- **WHEN** `isPendingApply(skillName)` is called
- **THEN** it MUST return `true`
- **AND** the underlying audit route MUST be `fresh`

#### Scenario: Pending when route is remerge

- **GIVEN** a source skill with overlay or generators where upstream or overlay inputs changed since last blend
- **WHEN** `isPendingApply(skillName)` is called
- **THEN** it MUST return `true`
- **AND** the underlying audit route MUST be `remerge`

#### Scenario: Not pending when route is restore or none

- **GIVEN** a source skill where audit route is `restore` or `none`
- **WHEN** `isPendingApply(skillName)` is called
- **THEN** it MUST return `false`

#### Scenario: Sync uses pipeline pending check

- **GIVEN** sync finds unchanged upstream SHA for a source skill
- **WHEN** it sets the `overlayPending` flag on the result
- **THEN** it MUST call `isPendingApply` from the overlay pipeline
- **AND** it MUST NOT call `isOverlayPending` or compare lock timestamps directly

#### Scenario: Tmp cleanup uses pipeline pending check

- **GIVEN** `cleanOverlayApplyManifests` runs with `appliedManifestsOnly: true`
- **WHEN** deciding whether to remove a manifest for a skill
- **THEN** it MUST skip removal when `isPendingApply(skillName)` returns `true`
- **AND** it MUST NOT use timestamp-based pending heuristics

#### Scenario: Testable without git checkout

- **GIVEN** a unit test injects mocked lock entries and hash values via `deps`
- **WHEN** `isPendingApply(skillName, deps)` is called
- **THEN** it MUST return the correct boolean without executing git operations

