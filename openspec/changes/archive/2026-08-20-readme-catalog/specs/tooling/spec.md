## ADDED Requirements

### Requirement: README category catalog structure check

`validateStructure()` SHALL compare the README category catalog to Manifest names grouped by Category after skills are loaded. Comparison MUST use set equality per Category discovered from `loadSkills()`, not a hardcoded Category list. On mismatch or a missing table (no parseable `| **<category>** |` row for a discovered Category, or no Categories table), it MUST push an error with `type: 'readme-catalog'` whose message lists missing and extra names. The check MUST live in Structure validation (no git). It MUST NOT emit only a warning.

#### Scenario: Matching catalog produces no readme-catalog error

- **GIVEN** the README category catalog name sets equal Manifest names per Category
- **WHEN** `validateStructure()` runs
- **THEN** the result MUST contain no error with `type` equal to `readme-catalog`

#### Scenario: Extra or missing names fail structure validation

- **GIVEN** the README category catalog lists a name absent from that Category’s Manifest, or omits a Manifest name
- **WHEN** `validateStructure()` runs
- **THEN** it MUST include an error with `type` equal to `readme-catalog`
- **AND** the message MUST identify missing and extra names

#### Scenario: Missing table fails rather than skip

- **GIVEN** README has no parseable Categories table rows for discovered Categories
- **WHEN** `validateStructure()` runs
- **THEN** it MUST include an error with `type` equal to `readme-catalog`
- **AND** it MUST NOT skip the check

#### Scenario: Every loaded category is checked

- **GIVEN** `loadSkills()` returns skills in more Category values than engineering, productivity, and internal
- **WHEN** `validateStructure()` compares the README category catalog
- **THEN** it MUST compare every Category from `loadSkills()`
- **AND** it MUST NOT ignore a Category because it is not one of those three names

## MODIFIED Requirements

### Requirement: Structure validation layer

`validateStructure()` SHALL verify manifests, SKILL.md frontmatter (via `skill-md.mjs`), overlay YAML shape and static file references (via structure-only `validateOverlays`), generator output file presence, orphan/missing skill directories, marketplace manifest sync, and the README category catalog. It MUST NOT call `auditSkill` or inspect git `blended_ref` state.

#### Scenario: Structure layer is git-free

- **GIVEN** a repository with well-formed structure but stale blend locks
- **WHEN** `validateStructure()` runs
- **THEN** it MUST complete without git checkout or audit operations
- **AND** it MUST return only structure errors and warnings
