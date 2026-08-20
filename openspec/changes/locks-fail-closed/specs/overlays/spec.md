## ADDED Requirements

### Requirement: Overlay route requires intact Upstream lock

When Overlay route or Pending apply is evaluated, a corrupt or unreadable Upstream lock MUST fail the evaluation. The system MUST NOT treat that failure as missing blend metadata, Overlay route `fresh`, or Pending apply from empty locks.

#### Scenario: Corrupt lock does not masquerade as never-applied

- **GIVEN** a customized source skill with blend metadata previously recorded in the Upstream lock
- **AND** `.locks/upstream.json` is truncated or otherwise invalid JSON
- **WHEN** Overlay route or Pending apply is evaluated
- **THEN** the evaluation MUST fail
- **AND** the skill MUST NOT be treated as Overlay route `fresh` from empty locks
