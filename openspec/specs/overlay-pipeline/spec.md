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

The repository SHALL provide `lib/overlay-model.mjs` owning overlay discovery and content hashing. YAML load, validate, partition, and generator merge resolution SHALL live in `lib/overlay-yaml.mjs`. The model module MUST NOT perform git checkout, clone, or manifest file writes.

#### Scenario: Model layer is pure filesystem and YAML

- **WHEN** `hashOverlay`, `hashUniversalOverlay`, or `discoverOverlays` runs
- **THEN** the operation MUST be implemented in `overlay-model.mjs` without git I/O

#### Scenario: YAML primitives delegate to overlay-yaml

- **WHEN** `loadOverlay`, `partitionChanges`, or `hasOverlay` runs via `overlay-model.mjs`
- **THEN** the operation MUST delegate to `overlay-yaml.mjs` without duplicating parse logic

#### Scenario: Generator-config loads YAML layer only

- **WHEN** `lib/generator-config.mjs` needs overlay YAML or generator resolution
- **THEN** it MUST import from `overlay-yaml.mjs` (or re-exports via `overlay-model.mjs`), not from `overlay-extract.mjs`, `overlay-manifest.mjs`, or the pipeline barrel

### Requirement: Static operations submodule

The repository SHALL provide `lib/overlay-static.mjs` owning static add/replace/remove file operations from `overlays/<name>/files/` payloads into the canonical skill tree.

#### Scenario: Static apply via pipeline

- **WHEN** `npm run overlay -- static` runs
- **THEN** static operations MUST be delegated to `overlay-static.mjs` through the pipeline `static` group

#### Scenario: Static ops before semantic prepare

- **WHEN** `prepareOverlayManifest` runs with `runStatic: true`
- **THEN** static ops MUST complete before manifest content is assembled

### Requirement: Manifest preparation submodule

The repository SHALL provide `lib/overlay-manifest.mjs` owning remerge manifest and generator-only manifest generation in `.tmp/overlay-apply/`. Generator lists for manifest preparation MUST be resolved via `overlay-yaml.mjs`, not `generator-config.mjs`.

#### Scenario: Pending remerge manifest

- **WHEN** `npm run overlay -- prepare` runs for a skill with pending remerge route
- **THEN** a manifest file MUST be written via `overlay-manifest.mjs`

#### Scenario: Generator-only manifest

- **WHEN** a skill has generators but no per-skill overlay YAML
- **THEN** `prepareGeneratorManifest` MUST produce a generator apply manifest without requiring semantic changes

#### Scenario: Manifest resolves generators from YAML layer

- **WHEN** `prepareGeneratorManifest` or generator sections of `prepareOverlayManifest` assemble generator instructions
- **THEN** they MUST call `resolveGeneratorsForSkill` from `overlay-yaml.mjs`

### Requirement: Extract submodule

The repository SHALL provide `lib/overlay-extract.mjs` owning overlay draft extraction from local diffs (canonical tree, agents tree, or git commit). Extract MUST classify generator-managed paths using static imports from `overlay-yaml.mjs` — not runtime dynamic imports of `generator-config.mjs`.

#### Scenario: Extract from agents working copy

- **WHEN** `npm run extract-overlay -- --skill git-commit --from-agents` runs
- **THEN** extraction logic MUST execute in `overlay-extract.mjs` and produce a draft `OVERLAY.yaml`

#### Scenario: Extract skips existing overlay

- **GIVEN** a skill already has an overlay directory
- **WHEN** extract runs without `--force`
- **THEN** the extract submodule MUST skip the skill with status `skipped`

#### Scenario: No dynamic import cycle breaker

- **WHEN** a maintainer inspects `lib/overlay-extract.mjs`
- **THEN** it MUST NOT use `await import('./generator-config.mjs')` or other runtime imports solely to break circular dependencies

#### Scenario: Extract skips generator-only local adds

- **GIVEN** a local-only file path is declared as a generator output and absent from upstream
- **WHEN** extract converts a diff to overlay changes
- **THEN** the path MUST NOT produce a static add operation in the draft overlay

#### Scenario: Extract skips modify when local matches derived generator content

- **GIVEN** a modified file path is a generator output
- **AND** local content equals `expectedContentForPath` for that path
- **WHEN** extract converts a diff to overlay changes
- **THEN** the modify MUST NOT produce a semantic overlay change entry

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

### Requirement: Audit git prefix via skill-paths

The overlay audit pipeline SHALL resolve `git_skill_path` and blended-ref validation paths via `getGitSkillPrefix` from `lib/skill-paths.mjs`. `lib/overlay-audit.mjs` MUST NOT define a private git prefix helper.

#### Scenario: Audit result includes skill-paths git prefix

- **GIVEN** a source skill with category and name
- **WHEN** `auditSkill(skillName)` runs
- **THEN** the result `git_skill_path` MUST equal `getGitSkillPrefix(skill)` from skill-paths

#### Scenario: Blended ref validation uses git prefix

- **GIVEN** a lock entry with `blended_ref` for a source skill
- **WHEN** `isBlendedRefValid(blendedRef, skill)` runs
- **THEN** it MUST validate `${gitPrefix}/SKILL.md` where `gitPrefix` comes from skill-paths

### Requirement: Extract local tree via skill-paths

The extract submodule SHALL select the local skill tree for diffing via skill-paths: `canonicalDir` by default, `agentsDir` when `fromAgents` is true, and `gitPrefix` when `fromCommit` is set.

#### Scenario: Default extract reads canonical tree

- **GIVEN** extract runs without `--from-agents` or `--from-commit`
- **WHEN** local files are collected for diffing
- **THEN** the root directory MUST be `getCanonicalDir(skill)` from skill-paths

#### Scenario: From-agents extract reads agents tree

- **GIVEN** extract runs with `fromAgents: true`
- **WHEN** local files are collected for diffing
- **THEN** the root directory MUST be `getAgentsDir(skill)` from skill-paths

### Requirement: Structure-only overlay validation

`validateOverlays(skills)` in the overlay pipeline SHALL perform structural overlay checks only: overlay-to-skill name matching, YAML load/validate, static source file existence, unknown action detection, empty overlay warnings, and orphan overlay directory detection. It MUST NOT call `auditSkill`, `getLockEntry`, or emit route/`blended_ref` warnings.

Blend-state overlay warnings MUST be produced exclusively by `validateBlendState()` in `lib/validate.mjs`.

#### Scenario: validateOverlays does not audit routes

- **GIVEN** a source skill with a lock entry and pending remerge route
- **WHEN** `validateOverlays(skills)` runs
- **THEN** it MUST NOT emit warnings about pending route or `blended_ref`
- **AND** it MUST NOT call `auditSkill`

#### Scenario: Structural overlay errors still reported

- **GIVEN** an overlay references a static source file that does not exist
- **WHEN** `validateOverlays(skills)` runs
- **THEN** it MUST emit a structure error for the missing static source

#### Scenario: Orphan overlay directory warning

- **GIVEN** a directory under `overlays/` has no matching skill and no `OVERLAY.yaml`
- **WHEN** `validateOverlays(skills)` runs
- **THEN** it MUST emit a structure warning for the orphan directory

### Requirement: Static apply test seam

The static overlay apply path SHALL be unit-testable without reading the live overlay catalog or writing live canonical trees, by accepting injected overlay load and skill-directory resolvers (same pattern as audit/restore `deps`). Defaults MUST remain `loadOverlay`, catalog `findSkillByName`, and `getSkillDir`.

CLI scripts and `runUpdate` production defaults MUST still invoke static apply through the overlay pipeline public interface, not a second overlay loader.

#### Scenario: Injected overlay and skill dir

- **GIVEN** a unit test supplies `loadOverlayFn`, `findSkillFn`, and `getSkillDirFn` pointing at temporary directories
- **WHEN** `applyStaticOverlay` runs
- **THEN** it MUST apply static ops against those directories
- **AND** it MUST NOT read this repository’s live `overlays/<name>/OVERLAY.yaml` or live `skills/` tree

#### Scenario: Production defaults unchanged

- **GIVEN** `applyStaticOverlay` is called with only `{ dryRun }` (no loader overrides)
- **WHEN** static apply runs
- **THEN** it MUST use the current `loadOverlay` / `loadSkills` / `getSkillDir` production functions


