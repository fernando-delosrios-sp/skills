## MODIFIED Requirements

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

## ADDED Requirements

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
