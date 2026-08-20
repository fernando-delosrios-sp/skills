# Skill Catalog

## Purpose

Organize, name, and manifest skills in this repository by category.

## Requirements

### Requirement: Unique skill names

Every skill in the repository SHALL have a globally unique `name` across all categories.

#### Scenario: Adding a skill to a category manifest

- **GIVEN** a maintainer adds a new entry to `skills/<category>/skills.json`
- **WHEN** the `name` already exists in another category's manifest
- **THEN** validation MUST fail with a duplicate-name error

### Requirement: Category manifest completeness

Each category directory under `skills/` SHALL contain a `skills.json` manifest listing every skill in that category.

#### Scenario: Skill directory without manifest entry

- **GIVEN** a directory `skills/<category>/<name>/` exists with a valid SKILL.md
- **WHEN** `npm run validate` runs
- **THEN** validation MUST report the skill as missing from the category manifest

### Requirement: SKILL.md as canonical definition

Every skill directory SHALL contain a `SKILL.md` file as its primary definition.

#### Scenario: Skill missing SKILL.md

- **GIVEN** a skill is listed in skills.json
- **WHEN** its directory lacks SKILL.md
- **THEN** validation MUST fail

### Requirement: Source vs local-only distinction

Skills synced from upstream SHALL declare a `source` block in skills.json; locally authored skills SHALL omit `source`.

#### Scenario: Foreign skill manifest entry

- **GIVEN** a skill is imported from an external repository
- **WHEN** it is added to skills.json
- **THEN** the entry MUST include `source.repo` and `source.path`

### Requirement: Category as implicit metadata

The category of a skill SHALL be determined by its manifest path (`skills/<category>/skills.json`), not by a field on the skill entry.

#### Scenario: Skill entry shape

- **GIVEN** a valid skills.json entry
- **WHEN** the entry is inspected
- **THEN** it MUST NOT repeat the category name as a redundant field

### Requirement: Canonical path resolution via skill-paths

All tooling that resolves the canonical skill directory for a manifest entry MUST use `lib/skill-paths.mjs` rather than constructing `skills/<category>/<name>` paths inline.

#### Scenario: Validate uses canonicalDir

- **GIVEN** a skill listed in `skills/<category>/skills.json`
- **WHEN** `npm run validate` checks for SKILL.md presence
- **THEN** it MUST resolve the expected directory via skill-paths `getCanonicalDir` or `resolveSkillPaths`

#### Scenario: Sync writes to canonicalDir

- **GIVEN** sync updates a source skill from upstream
- **WHEN** it writes files to the local skill tree
- **THEN** the target directory MUST be the canonicalDir from skill-paths

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

