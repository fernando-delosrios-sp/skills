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
