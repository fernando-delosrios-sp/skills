## ADDED Requirements

### Requirement: plain-and-simple listed as local-only productivity skill

The productivity Manifest SHALL include an entry `{ "name": "plain-and-simple" }` with no `source` block. The skill name MUST remain unique across all Manifests.

#### Scenario: Productivity manifest lists plain-and-simple without source

- **GIVEN** `skills/productivity/skills.json`
- **WHEN** a maintainer inspects the skills array
- **THEN** an entry MUST exist whose `name` is `plain-and-simple`
- **AND** that entry MUST omit `source`

#### Scenario: Name remains unique

- **GIVEN** all category Manifests
- **WHEN** `npm run validate` runs after adding `plain-and-simple`
- **THEN** validation MUST NOT report a duplicate-name error for `plain-and-simple`
