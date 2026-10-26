## ADDED Requirements

### Requirement: Harness proxy catalog entry

The engineering skill catalog SHALL include `harness-proxy` as a locally authored engineering skill for cross-subscription harness delegation.

#### Scenario: Engineering manifest contains harness-proxy

- **GIVEN** `skills/engineering/skills.json`
- **WHEN** inspected by `npm run validate`
- **THEN** it MUST contain an entry for `{ "name": "harness-proxy" }` omitting the `source` block
- **AND** `skills/engineering/harness-proxy/SKILL.md` MUST exist with valid frontmatter declaring the tool interface
