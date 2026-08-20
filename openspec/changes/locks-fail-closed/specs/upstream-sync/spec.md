## MODIFIED Requirements

### Requirement: Upstream lock tracking

The repository SHALL record last-synced upstream SHAs in `.locks/upstream.json` (the Upstream lock).

Loading the Upstream lock SHALL return an empty object only when the file is missing. Invalid JSON, a JSON value that is not a non-null object, and other read errors MUST fail the load. A failed load MUST NOT be treated as empty locks. Parse error messages MUST identify `.locks/upstream.json` and MUST include `invalid JSON`. Error messages MUST NOT include the file contents.

#### Scenario: Post-sync lock update

- **GIVEN** sync completes for a source skill
- **WHEN** locks are written
- **THEN** upstream.json MUST record the SHA used for that skill's source repo/path

#### Scenario: Missing lock file is empty

- **GIVEN** `.locks/upstream.json` does not exist
- **WHEN** the Upstream lock is loaded
- **THEN** the load MUST return an empty object

#### Scenario: Invalid JSON fails the load

- **GIVEN** `.locks/upstream.json` contains truncated or otherwise invalid JSON
- **WHEN** the Upstream lock is loaded
- **THEN** the load MUST fail
- **AND** the error message MUST identify `.locks/upstream.json`
- **AND** the error message MUST include `invalid JSON`
- **AND** the error message MUST NOT include the file contents

#### Scenario: Non-object JSON fails the load

- **GIVEN** `.locks/upstream.json` parses as JSON that is not a non-null object
- **WHEN** the Upstream lock is loaded
- **THEN** the load MUST fail
- **AND** the load MUST NOT return an empty object as success
