# Tooling

## Purpose

Provide CLI infrastructure in `lib/` and `scripts/` for maintainers to sync, validate, and manage skills.

## Requirements

### Requirement: Validate command

The repository SHALL provide `npm run validate` to check skills.json manifests, SKILL.md files, and overlays. Validation MUST be layered into `validateStructure()` (well-formed repo, no git audit) and `validateBlendState()` (overlay audit routes, `blended_ref`, pending apply). `validateRepo()` MUST remain as a convenience wrapper that runs both layers.

The validate CLI MUST accept `--structure-only` to run structure validation without blend checks. Default behavior (no flag) MUST run both layers.

#### Scenario: Valid repository state

- **GIVEN** all manifests, skills, overlays, and blend state are well-formed
- **WHEN** `npm run validate` runs
- **THEN** it MUST exit with code 0

#### Scenario: Invalid manifest detected

- **GIVEN** a skills.json entry violates naming or structure rules
- **WHEN** `npm run validate` runs
- **THEN** it MUST exit non-zero and report the specific violation

#### Scenario: Structure-only skips blend audit

- **GIVEN** a source skill has pending remerge with no `blended_ref`
- **WHEN** `npm run validate -- --structure-only` runs
- **THEN** it MUST NOT invoke `auditSkill` or emit blend-state warnings
- **AND** it MUST exit with code 0 if structure checks pass

#### Scenario: Full validate includes blend warnings

- **GIVEN** a source skill has pending remerge with no `blended_ref`
- **WHEN** `npm run validate` runs without `--structure-only`
- **THEN** it MUST emit a blend-state warning for that skill
- **AND** it MUST exit with code 0 (warnings do not fail validate)

### Requirement: Structure validation layer

`validateStructure()` SHALL verify manifests, SKILL.md frontmatter (via `skill-md.mjs`), overlay YAML shape and static file references (via structure-only `validateOverlays`), generator output file presence, orphan/missing skill directories, and marketplace manifest sync. It MUST NOT call `auditSkill` or inspect git `blended_ref` state.

#### Scenario: Structure layer is git-free

- **GIVEN** a repository with well-formed structure but stale blend locks
- **WHEN** `validateStructure()` runs
- **THEN** it MUST complete without git checkout or audit operations
- **AND** it MUST return only structure errors and warnings

### Requirement: Blend validation layer

`validateBlendState()` SHALL verify overlay audit routes, `blended_ref` presence for pending apply skills, and pending remerge detection for source skills with lock entries. It MUST use `auditSkill` and `isOverlayRoutePending` from the overlay pipeline — not timestamp heuristics.

#### Scenario: Blend warning for missing blended_ref

- **GIVEN** a source skill with overlay route `fresh` or `remerge` and no `blended_ref`
- **WHEN** `validateBlendState()` runs
- **THEN** it MUST emit an `overlay-lock` warning naming the skill and route

#### Scenario: Local-only skills skipped

- **GIVEN** a skill with no `source` block in skills.json
- **WHEN** `validateBlendState()` runs
- **THEN** it MUST NOT audit that skill

### Requirement: Clean command

The repository SHALL provide `npm run clean` to prune stale clone caches and optional overlay apply manifests.

#### Scenario: Clean clone caches

- **GIVEN** stale `.tmp` clone caches exist from prior sync/import
- **WHEN** `npm run clean` runs
- **THEN** those caches MUST be removed

### Requirement: Extract overlay command

The repository SHALL provide `npm run extract-overlay` to draft overlay YAML from local customizations vs upstream. Extract MUST skip generator-managed paths using `overlay-yaml.mjs` helpers (`isGeneratedPathForSkill`, `expectedContentForPath`) so drafts do not treat generator outputs as manual customizations. Local tree selection for extraction MUST resolve through `lib/skill-paths.mjs` — canonical tree by default, agents tree when `--from-agents` is set.

#### Scenario: Draft overlay from agents working copy

- **GIVEN** a maintainer runs `npm run extract-overlay -- --skill git-commit --from-agents`
- **WHEN** extraction completes
- **THEN** a draft OVERLAY.yaml MUST be produced reflecting the diff minus generator-managed paths
- **AND** the local side of the diff MUST be read from `agentsDir` returned by skill-paths

#### Scenario: Generator output absent upstream skipped

- **GIVEN** a generator declares `file: agents/openai.yaml`
- **AND** upstream has no such file but local canonical tree does
- **WHEN** extract runs for that skill
- **THEN** the draft overlay MUST NOT add a static payload for that path solely because it is local-only

#### Scenario: Extract from commit uses gitPrefix

- **GIVEN** a maintainer runs `npm run extract-overlay -- --skill git-commit --from-commit HEAD`
- **WHEN** extraction reads local files from git history
- **THEN** it MUST use `gitPrefix` from skill-paths as the tree prefix in the local repository

### Requirement: Validate uses skill-paths for directory checks

The validate command SHALL resolve indexed skill directories and orphan detection paths via skill-paths rather than inline `resolve(skillsRoot, category, name)` construction.

#### Scenario: Missing SKILL.md error references canonicalDir

- **GIVEN** a skill is listed in skills.json but its canonical tree lacks SKILL.md
- **WHEN** `npm run validate` runs
- **THEN** the error message MUST reference the path from skill-paths `getCanonicalDir`

### Requirement: Script entry points

All maintainer commands SHALL be exposed as npm scripts delegating to `scripts/sync.mjs` or dedicated modules in `lib/`.

#### Scenario: Command discoverability

- **GIVEN** a maintainer reads package.json scripts
- **WHEN** they inspect available commands
- **THEN** sync, update, import, overlay, extract-overlay, clean, validate, and install MUST be listed

### Requirement: Node.js engine constraint

Tooling SHALL require Node.js >= 18 as declared in package.json engines.

#### Scenario: Unsupported Node version

- **GIVEN** Node.js version is below 18
- **WHEN** a maintainer runs any npm script
- **THEN** npm MUST warn or fail per engines policy



