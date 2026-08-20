## ADDED Requirements

### Requirement: Upstream lock load tests without live file overwrite

The unit test suite SHALL cover valid Upstream lock object parse, invalid JSON failure, non-object JSON failure, and missing-file empty load. Those tests MUST NOT write this repository’s live `.locks/upstream.json`. Existing tests that read the committed lock file for blend-metadata assertions MUST remain and MUST NOT be weakened.

#### Scenario: Parse and missing-file cases run in locks tests

- **GIVEN** `test/locks.test.mjs`
- **WHEN** `node --test test/locks.test.mjs` runs
- **THEN** it MUST include a case that parses a valid object map
- **AND** it MUST include a case that fails on invalid JSON
- **AND** it MUST include a case that fails on a JSON array
- **AND** it MUST include a case that returns an empty object for a missing file under a temporary directory

#### Scenario: Tests do not overwrite the live lock file

- **GIVEN** the new Upstream lock load tests
- **WHEN** those tests run
- **THEN** they MUST NOT write this repository’s `.locks/upstream.json`
