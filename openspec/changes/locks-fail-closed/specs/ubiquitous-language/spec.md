## ADDED Requirements

### Requirement: Upstream lock glossary entry

The glossary SHALL define **Upstream lock** as the JSON object stored in `.locks/upstream.json` mapping skill name to sync and overlay blend metadata (including last-synced SHA, `blended_ref`, overlay hashes, and `applied_upstream_sha`).

#### Scenario: Upstream lock definition

- **GIVEN** a maintainer reads the ubiquitous-language spec
- **WHEN** they look up Upstream lock
- **THEN** the definition MUST state it is the JSON object in `.locks/upstream.json` mapping skill name to sync and overlay blend metadata
- **AND** MUST note it is not OS file locking
- **AND** MUST note the bounded context is upstream-sync / overlays

#### Scenario: Term listed in glossary

- **GIVEN** the ubiquitous-language spec glossary
- **WHEN** a reader looks for Upstream lock
- **THEN** a `### Term: Upstream lock` entry MUST exist
