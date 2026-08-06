## MODIFIED Requirements

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
