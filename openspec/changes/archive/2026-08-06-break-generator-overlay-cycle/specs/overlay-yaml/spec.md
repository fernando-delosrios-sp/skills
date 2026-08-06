## ADDED Requirements

### Requirement: Overlay YAML module

The repository SHALL provide `lib/overlay-yaml.mjs` as the shared authority for overlay YAML loading, validation, change partitioning, and generator merge resolution. The module MUST NOT perform git checkout, clone, upstream fetch, or manifest file writes.

#### Scenario: YAML load without git

- **WHEN** `loadOverlay`, `loadGlobalOverlay`, or `partitionChanges` runs
- **THEN** the operation MUST complete using filesystem and YAML parsing only

#### Scenario: No import from overlay pipeline internals

- **WHEN** a maintainer inspects imports in `lib/overlay-yaml.mjs`
- **THEN** the module MUST NOT import from `overlay-extract.mjs`, `overlay-manifest.mjs`, `overlay-audit.mjs`, or `generator-config.mjs`

### Requirement: Generator merge resolution

The overlay YAML module SHALL expose `resolveGeneratorsForSkill(skillName)` merging universal generators from `overlays/OVERLAY.yaml` with per-skill `generators.add` and `generators.disable` from `overlays/<name>/OVERLAY.yaml` when present.

#### Scenario: Universal defaults only

- **GIVEN** a skill has no per-skill overlay YAML
- **WHEN** `resolveGeneratorsForSkill(skillName)` runs
- **THEN** it MUST return the normalized universal generator list from `overlays/OVERLAY.yaml`

#### Scenario: Per-skill disable removes generator

- **GIVEN** a skill overlay sets `generators.disable: [openai-manifest]`
- **WHEN** `resolveGeneratorsForSkill(skillName)` runs
- **THEN** the disabled generator id MUST NOT appear in the result

#### Scenario: Per-skill add overrides or extends

- **GIVEN** a skill overlay sets `generators.add` with a generator entry
- **WHEN** `resolveGeneratorsForSkill(skillName)` runs
- **THEN** the added generator MUST appear in the result with normalized `{ id, instructions, description?, file? }` fields

### Requirement: Generated path classification

The overlay YAML module SHALL expose helpers to classify skill-relative paths managed by resolved generators, including `getGeneratedPathsForSkill(skillName)` and `isGeneratedPathForSkill(skillName, relPath)`.

#### Scenario: Path matches generator file target

- **GIVEN** resolved generators include `{ id: openai-manifest, file: agents/openai.yaml }`
- **WHEN** `isGeneratedPathForSkill(skillName, 'agents/openai.yaml')` runs
- **THEN** it MUST return `true`

#### Scenario: Non-generated path rejected

- **GIVEN** a path is not listed on any resolved generator's `file` field
- **WHEN** `isGeneratedPathForSkill(skillName, relPath)` runs
- **THEN** it MUST return `false`

### Requirement: Deterministic expected generator content

The overlay YAML module SHALL expose `expectedContentForPath(skill, relPath, options)` returning deterministic YAML text for repo-known generator outputs when derivable from canonical inputs (starting with `openai-manifest` → `agents/openai.yaml` from SKILL.md frontmatter), or `null` when derivation is not supported.

#### Scenario: OpenAI manifest derived from frontmatter

- **GIVEN** a skill's SKILL.md frontmatter includes `name`, `description`, and optional `disable-model-invocation: true`
- **WHEN** `expectedContentForPath(skill, 'agents/openai.yaml', { skillDir })` runs
- **THEN** it MUST return YAML matching universal generator rules (display_name, short_description, policy when disabled)

#### Scenario: Unsupported generator returns null

- **GIVEN** a generated path has no deterministic derivation rule in the repository
- **WHEN** `expectedContentForPath` runs for that path
- **THEN** it MUST return `null`

### Requirement: Overlay model delegates to YAML layer

`lib/overlay-model.mjs` SHALL delegate or re-export YAML load, validate, and partition primitives from `overlay-yaml.mjs` so discovery and hashing remain in the model layer while YAML authority is not duplicated.

#### Scenario: Single load implementation

- **WHEN** `loadOverlay` is invoked from `overlay-model.mjs`
- **THEN** the underlying YAML parse and validation MUST originate from `overlay-yaml.mjs`
