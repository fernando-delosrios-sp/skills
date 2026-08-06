## ADDED Requirements

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
