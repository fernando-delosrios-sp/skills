## ADDED Requirements

### Requirement: Archive post-commit gate term

The ubiquitous language spec MUST define **Archive post-commit gate** as the blocking verification after archive commit: empty working tree and latest commit includes synced specs and archive folder paths.

#### Scenario: Term used in ferspec archive docs

- **GIVEN** ferspec README or agent routing references archive completion
- **WHEN** the archive post-commit gate is described
- **THEN** documentation MUST use **Archive post-commit gate** consistently
- **AND** MUST NOT describe archive as complete without this gate passing

### Requirement: Operation guidance term

The ubiquitous language spec MUST define **Operation guidance** as advisory strings from `openspec/config.yaml` per-operation `guidance` arrays, loaded by `openspec instructions archive` or apply.

#### Scenario: Term distinguishes from schema instructions

- **GIVEN** ferspec archive commit steps are documented
- **WHEN** referring to config-driven archive strings
- **THEN** documentation MUST use **Operation guidance**
- **AND** MUST NOT conflate with `schema.yaml` apply instruction blocks
