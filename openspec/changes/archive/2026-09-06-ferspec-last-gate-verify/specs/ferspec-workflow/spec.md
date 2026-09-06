## MODIFIED Requirements

### Requirement: Apply verify-fix loop

The ferspec apply phase MUST run a blocking **verify** last gate before handoff. The agent MUST run `/opsx:verify` on the verification ref, fix every CRITICAL, WARNING, and SUGGESTION issue autonomously, and repeat until all three tiers are empty. A **confirmation scorecard** pass (scorecard-only — no new hunting) MUST confirm the three tiers remain empty before handoff.

#### Scenario: Verify blocks handoff

- **GIVEN** apply-code-changes has finished implementation tasks
- **WHEN** `/opsx:verify` reports any CRITICAL, WARNING, or SUGGESTION issue
- **THEN** apply MUST NOT hand off
- **AND** MUST fix issues and re-run verify until all three tiers are empty

#### Scenario: Post-apply verify is empty

- **GIVEN** apply-code-changes reports handoff complete
- **WHEN** the user runs standalone `/opsx:verify`
- **THEN** the report MUST have no CRITICAL, WARNING, or SUGGESTION issues
- **AND** MUST NOT surface new issues that apply should have fixed

#### Scenario: Worktree verify runs on original branch

- **GIVEN** apply venue is `worktree`
- **WHEN** the verify last gate runs
- **THEN** the agent MUST squash-merge `apply-<name>` to `ORIGINAL_BRANCH` on main repo first
- **AND** MUST NOT run verify on the worktree checkout

## ADDED Requirements

### Requirement: Apply operation guidance in config

ferspec projects MUST declare `operations.apply.guidance` in `openspec/config.yaml` with strings that instruct agents not to report apply complete until `/opsx:verify` has empty CRITICAL, WARNING, and SUGGESTION tiers. `openspec instructions apply --change "<name>" --json` MUST surface this guidance as `operationGuidance` for `/opsx:apply`.

#### Scenario: Instructions apply loads guidance

- **GIVEN** `openspec/config.yaml` contains `operations.apply.guidance` with last-gate verify steps
- **WHEN** `openspec instructions apply --change "<name>" --json` runs
- **THEN** the JSON output MUST include `operationGuidance` with those strings
- **AND** agents MUST treat applicable guidance as additive to the built-in apply workflow
