## ADDED Requirements

### Requirement: README category catalog glossary entry

The glossary SHALL define **README category catalog** as the Categories markdown table in `README.md` that lists Skill names grouped by Category for human browsing. It MUST state that the table is a cache of Manifest names, not the Install source of truth.

#### Scenario: README category catalog definition

- **GIVEN** a maintainer reads the ubiquitous-language spec
- **WHEN** they look up README category catalog
- **THEN** the definition MUST identify the Categories table in `README.md`
- **AND** MUST state it is not the Install source of truth
- **AND** MUST note the bounded context is skill-catalog / distribution

## MODIFIED Requirements

### Requirement: Structure validation glossary entry

The glossary SHALL define **Structure validation** as checks that the repository is well-formed without inspecting git blend state. Notes MAY mention `npm run validate -- --structure-only` as an optional flag. Notes MUST NOT claim that this repository’s Validate workflow is structure-only.

#### Scenario: Structure validation definition

- **GIVEN** a maintainer reads the ubiquitous-language spec
- **WHEN** they look up Structure validation
- **THEN** the definition MUST list: manifests, SKILL.md frontmatter, overlay YAML shape, static file refs, generator output presence, marketplace sync, and README category catalog
- **AND** MUST explicitly state it does not call `auditSkill` or inspect `blended_ref`

#### Scenario: Structure-only is not the Validate workflow

- **GIVEN** a maintainer reads Structure validation notes
- **WHEN** they compare them to the Validate workflow
- **THEN** `--structure-only` MUST be described as an optional CLI flag
- **AND** MUST NOT be equated with this repository’s Validate workflow merge gate
