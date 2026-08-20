## ADDED Requirements

### Requirement: README category catalog matches manifests

The README category catalog SHALL list, for each Category present in Manifests, exactly the Skill `name` values from that Category’s Manifest (set equality). Names in each table row MUST be comma-separated and sorted alphabetically. The table is a human cache; Install MUST continue to use Canonical trees under `skills/`, not README.

#### Scenario: Table names equal manifest names per category

- **GIVEN** each Category Manifest lists a set of Skill names
- **WHEN** a maintainer reads the README category catalog
- **THEN** each Category row MUST contain exactly those names
- **AND** MUST NOT contain names absent from that Category’s Manifest

#### Scenario: Names sorted alphabetically in each row

- **GIVEN** a Category Manifest lists more than one Skill
- **WHEN** the README category catalog row for that Category is written
- **THEN** the names MUST appear in alphabetical order

#### Scenario: README is not the install source of truth

- **GIVEN** the README category catalog lists Skill names
- **WHEN** a user installs from this repository
- **THEN** installed content MUST still come from `skills/`
