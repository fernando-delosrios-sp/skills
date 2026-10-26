## ADDED Requirements

### Requirement: Isolated worktree lifecycle

The harness proxy SHALL execute each delegated sub-task inside an ephemeral Git worktree created on a dedicated task branch named `harness/<task-id>`.

#### Scenario: Worktree creation for sub-task

- **GIVEN** a calling agent or user invokes `harness-proxy` with a valid task prompt
- **WHEN** execution begins
- **THEN** the system MUST create a new Git branch `harness/<task-id>` from the current `HEAD`
- **AND** MUST mount a dedicated Git worktree at a temporary path linked to that branch
- **AND** MUST configure the target harness working directory to that worktree

#### Scenario: Worktree cleanup on completion

- **GIVEN** a target harness finishes executing in its worktree
- **WHEN** the results have been processed
- **THEN** the system MUST remove the ephemeral worktree directory using `git worktree remove`
- **AND** MUST retain the `harness/<task-id>` branch for history and merge tracking

### Requirement: Headless child harness execution

The harness proxy SHALL invoke the selected target harness headlessly using non-interactive CLI flags with permissions auto-approved.

#### Scenario: Cursor Agent execution

- **GIVEN** Cursor is selected as the target provider
- **WHEN** the sub-task is launched
- **THEN** the system MUST execute `agent -p "<prompt>"` with `-f` (force allow tools) and `--workspace <worktree-path>`
- **AND** MUST capture the execution exit code and structured output

#### Scenario: Antigravity CLI execution

- **GIVEN** Antigravity is selected as the target provider
- **WHEN** the sub-task is launched
- **THEN** the system MUST execute `agy -p "<prompt>"` with `--dangerously-skip-permissions` and `--add-dir <worktree-path>`
- **AND** MUST capture the execution exit code and structured output

#### Scenario: OpenCode Go execution

- **GIVEN** OpenCode Go is selected as the target provider
- **WHEN** the sub-task is launched
- **THEN** the system MUST execute `opencode run "<prompt>"` with `--auto` and `--format json` inside the worktree directory
- **AND** MUST capture the execution exit code and structured output

### Requirement: Auto-commit and clean merge

Upon successful completion of a child harness task, the harness proxy SHALL commit all workspace changes to the task branch and attempt to merge them into the active working branch.

#### Scenario: Clean automatic merge

- **GIVEN** a child harness task completes with exit code 0 and has uncommitted changes
- **WHEN** the changes are committed to `harness/<task-id>`
- **AND** `git merge --no-ff harness/<task-id>` is attempted against the active branch without conflicts
- **THEN** the merge MUST succeed
- **AND** the system MUST return the commit hash, modified files diff, and success status to the calling agent

### Requirement: Merge conflict preservation and reporting

When an auto-merge into the active branch produces conflicts, the harness proxy SHALL abort the merge cleanly, preserve the task branch, and return conflict details to the calling agent.

#### Scenario: Conflicting edits handled gracefully

- **GIVEN** a child harness produces edits that conflict with the active branch
- **WHEN** `git merge` fails due to conflicts
- **THEN** the system MUST execute `git merge --abort`
- **AND** MUST leave the active branch clean
- **AND** MUST keep the `harness/<task-id>` branch intact
- **AND** MUST return the branch name, conflicting file paths, and diff to the calling agent for manual or agentic resolution

### Requirement: Execution failover cascading

When a target harness encounters rate limiting (HTTP 429), quota exhaustion, or an execution crash, the harness proxy SHALL transparently fail over to the next available provider within the same model tier.

#### Scenario: Transparent provider failover

- **GIVEN** a selected target harness fails due to quota exhaustion or process crash
- **WHEN** another provider exists in the active model tier with remaining quota
- **THEN** the system MUST log the failure in the local quota ledger
- **AND** MUST re-dispatch the task prompt to the alternative provider in a fresh worktree
- **AND** MUST notify the caller of the failover in the final execution report

#### Scenario: Exhaustion fallback to host agent

- **GIVEN** all configured subscription providers within the required tier are exhausted
- **WHEN** delegation cannot proceed
- **THEN** the system MUST abort child execution without failing silently
- **AND** MUST return an actionable status reporting subscription exhaustion so the host agent can execute the task itself
