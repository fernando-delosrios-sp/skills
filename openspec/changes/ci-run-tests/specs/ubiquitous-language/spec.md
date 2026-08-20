## ADDED Requirements

### Requirement: Validate workflow glossary entry

The glossary SHALL define **Validate workflow** as the GitHub Actions workflow in `.github/workflows/validate.yaml` that is this repository’s merge gate on push and pull request to `main`.

#### Scenario: Validate workflow definition

- **GIVEN** a maintainer reads the ubiquitous-language spec
- **WHEN** they look up Validate workflow
- **THEN** the definition MUST name `.github/workflows/validate.yaml`
- **AND** MUST state it is the merge gate for this repository
- **AND** MUST distinguish it from the Sync workflow in `.github/workflows/sync.yaml`

#### Scenario: Merge gate steps documented

- **GIVEN** the glossary entry for Validate workflow
- **WHEN** notes describe what the job runs
- **THEN** they MUST state the job runs `npm test` then full `npm run validate`
- **AND** MUST NOT describe this repo’s merge gate as structure-only validate

## MODIFIED Requirements

### Requirement: Structure validation glossary entry

The glossary SHALL define **Structure validation** as checks that the repository is well-formed without inspecting git blend state. Notes MAY mention `npm run validate -- --structure-only` as an optional flag. Notes MUST NOT claim that this repository’s Validate workflow is structure-only.

#### Scenario: Structure validation definition

- **GIVEN** a maintainer reads the ubiquitous-language spec
- **WHEN** they look up Structure validation
- **THEN** the definition MUST list: manifests, SKILL.md frontmatter, overlay YAML shape, static file refs, generator output presence, and marketplace sync
- **AND** MUST explicitly state it does not call `auditSkill` or inspect `blended_ref`

#### Scenario: Structure-only is not the Validate workflow

- **GIVEN** a maintainer reads Structure validation notes
- **WHEN** they compare them to the Validate workflow
- **THEN** `--structure-only` MUST be described as an optional CLI flag
- **AND** MUST NOT be equated with this repository’s Validate workflow merge gate
