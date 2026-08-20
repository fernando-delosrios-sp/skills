## ADDED Requirements

### Requirement: Characterization tests in the unit suite

The `npm test` suite SHALL include characterization tests for Sync write (`applySyncResult`), Import copy (`copySkillDir`), static overlay apply (unless blocked per overlays STOP), and Update orchestration (`runUpdate`). Those tests MUST use temporary directories. They MUST NOT clone GitHub. They MUST NOT write this repository’s live `skills/` tree or `.locks/upstream.json`. Tests that mock away all `writeFile` / `rm` / `cp` for the write paths MUST NOT satisfy this requirement. Orchestrator order tests MAY inject pipeline functions while write-path tests still hit the filesystem.

#### Scenario: Suite includes mutation-path tests

- **GIVEN** the repository test directory
- **WHEN** `npm test` runs
- **THEN** it MUST execute `test/sync-write.test.mjs`, `test/import-copy.test.mjs`, and `test/run-update.test.mjs`
- **AND** it MUST execute `test/overlay-static.test.mjs` unless static characterization is explicitly blocked

#### Scenario: Tests do not touch live catalog or network

- **GIVEN** characterization tests for Sync write, Import copy, and static overlay
- **WHEN** those tests run
- **THEN** they MUST NOT clone a remote GitHub repository
- **AND** they MUST NOT modify this repository’s `skills/` or `.locks/upstream.json`

#### Scenario: Write-path tests hit the filesystem

- **GIVEN** a Sync write or Import copy characterization test
- **WHEN** it asserts overwrite, nested write, orphan delete, or git-exclude copy
- **THEN** it MUST observe real files on a temporary directory after the production write helpers run
