## ADDED Requirements

### Requirement: Validate workflow runs unit tests

The `.github/workflows/validate.yaml` Validate workflow SHALL run `npm test` after `npm ci` and before `npm run validate`. The Test step MUST invoke `npm test` (the package.json `test` script) and MUST NOT use watch mode. The job MUST keep `actions/checkout@v4`, `actions/setup-node@v4`, and `node-version: '20'`.

#### Scenario: Test step after npm ci

- **GIVEN** the Validate workflow job has completed checkout, Node setup, and `npm ci`
- **WHEN** the Test step runs
- **THEN** it MUST execute `npm test`
- **AND** it MUST run before the Validate skills step

#### Scenario: Test failures fail the job

- **GIVEN** `npm test` exits non-zero
- **WHEN** the Validate workflow Test step completes
- **THEN** the job MUST fail

#### Scenario: No watch mode

- **GIVEN** a maintainer inspects `.github/workflows/validate.yaml`
- **WHEN** they read the Test step
- **THEN** the command MUST be `npm test`
- **AND** it MUST NOT include `--watch`

### Requirement: Validate workflow uses full validate

The Validate workflow SHALL run `npm run validate` without `--structure-only`. Blend-state warnings MUST NOT fail that step (existing validate command behavior). The Sync workflow (`.github/workflows/sync.yaml`) MUST remain unchanged by this requirement.

#### Scenario: Full validate on the merge gate

- **GIVEN** the Validate workflow Test step has succeeded
- **WHEN** the Validate skills step runs
- **THEN** it MUST run `npm run validate`
- **AND** the command MUST NOT include `--structure-only`

#### Scenario: Sync workflow out of scope

- **GIVEN** `.github/workflows/sync.yaml` exists as a workflow_dispatch dry-run
- **WHEN** this requirement is applied
- **THEN** that workflow MUST NOT be required to run `npm test`
