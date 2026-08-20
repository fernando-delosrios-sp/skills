## ADDED Requirements

### Requirement: Characterization test glossary entry

The glossary SHALL define **Characterization test** as a Node unit test that records current filesystem mutation behavior of Sync write, Import copy, static overlay apply, and Update orchestration so later refactors can detect drift.

#### Scenario: Characterization test definition

- **GIVEN** a maintainer reads the ubiquitous-language spec
- **WHEN** they look up Characterization test
- **THEN** the definition MUST state it records existing mutation behavior without changing that behavior
- **AND** MUST note tests MUST exercise real filesystem writes or deletes on temporary trees, not only source greps
- **AND** MUST note the bounded context is tooling / upstream-sync

#### Scenario: Term listed in glossary

- **GIVEN** the ubiquitous-language spec glossary
- **WHEN** a reader looks for Characterization test
- **THEN** a `### Term: Characterization test` entry MUST exist
