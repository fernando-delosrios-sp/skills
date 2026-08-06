# Skill MD

## Purpose

Shared SKILL.md frontmatter parsing used by validate, import, and overlay-yaml modules.

## Requirements

### Requirement: Shared frontmatter parser

The repository SHALL provide `lib/skill-md.mjs` exporting `parseFrontmatter(content)` as the single implementation for extracting YAML frontmatter from SKILL.md content.

Call sites that parse SKILL.md frontmatter (`lib/validate.mjs`, `lib/import.mjs`, `lib/overlay-yaml.mjs`) MUST import from `skill-md.mjs` and MUST NOT duplicate the regex/YAML parse logic locally.

#### Scenario: Valid frontmatter parsed

- **GIVEN** SKILL.md content with a well-formed `---` delimited YAML block
- **WHEN** `parseFrontmatter(content)` is called
- **THEN** it MUST return the parsed object

#### Scenario: Missing or invalid frontmatter returns null

- **GIVEN** SKILL.md content without frontmatter delimiters or with invalid YAML
- **WHEN** `parseFrontmatter(content)` is called
- **THEN** it MUST return `null`

#### Scenario: No duplicate parseFrontmatter in callers

- **GIVEN** a maintainer inspects `lib/validate.mjs`, `lib/import.mjs`, and `lib/overlay-yaml.mjs`
- **WHEN** searching for frontmatter parsing
- **THEN** each file MUST import `parseFrontmatter` from `skill-md.mjs`
- **AND** none MUST define a local `parseFrontmatter` function
