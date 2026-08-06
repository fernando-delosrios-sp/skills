## ADDED Requirements

### Requirement: Pending apply determined by overlay route

Pending apply for a customized source skill SHALL be determined exclusively by overlay route — routes `fresh` and `remerge` mean pending; routes `restore` and `none` mean not pending. Lock timestamp comparison (`overlay_applied_at` vs `synced_at`) MUST NOT be used as pending authority.

#### Scenario: Timestamp applied but route remerge

- **GIVEN** a lock entry where `overlay_applied_at` is set and equals or exceeds `synced_at`
- **AND** overlay or upstream hashes differ from last blend metadata
- **WHEN** pending apply is evaluated
- **THEN** the skill MUST be considered pending apply
- **AND** the route MUST be `remerge`

#### Scenario: Never applied is pending

- **GIVEN** a source skill with overlay or generators
- **AND** lock entry has no `overlay_applied_at`
- **WHEN** pending apply is evaluated
- **THEN** the skill MUST be considered pending apply
- **AND** the route MUST be `fresh`

#### Scenario: Unchanged inputs not pending

- **GIVEN** a source skill with valid blend metadata and unchanged upstream and overlay hashes
- **AND** `blended_ref` resolves in git history
- **WHEN** pending apply is evaluated
- **THEN** the skill MUST NOT be considered pending apply
- **AND** the route MUST be `restore`

#### Scenario: Generator-only skill can be pending

- **GIVEN** a source skill with no per-skill overlay YAML but universal generators enabled
- **AND** generator inputs require first-time or repeat blend
- **WHEN** pending apply is evaluated
- **THEN** the skill MUST be considered pending apply when route is `fresh` or `remerge`
