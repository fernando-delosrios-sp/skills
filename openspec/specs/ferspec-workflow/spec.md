# Ferspec Workflow

## Purpose

OpenSpec ferspec schema workflow rules for planning, apply, and archive phases.

## Requirements

### Requirement: Archive commit after sync and move

The ferspec archive phase MUST commit archive output after the built-in `/opsx:archive` sync and move steps complete. The OpenSpec CLI MUST NOT be treated as having committed changes. When `git status --porcelain` is non-empty after sync and move, the agent MUST stage `openspec/specs/` and `openspec/changes/` plus any paths touched during sync, then create a commit.

#### Scenario: Non-empty porcelain after archive move

- **GIVEN** a ferspec change has been synced and moved under `openspec/changes/archive/`
- **AND** `git status --porcelain` shows changes under `openspec/specs/` or `openspec/changes/`
- **WHEN** the archive phase completes
- **THEN** a git commit MUST exist that includes those paths
- **AND** the agent MUST NOT report archive complete before the commit

#### Scenario: git-commit skill preferred

- **GIVEN** the git-commit skill is available in the agent environment
- **WHEN** archive output must be committed
- **THEN** the agent MUST invoke git-commit with change name and archive context
- **AND** MUST NOT skip commit because the skill is present

#### Scenario: Manual fallback when git-commit absent

- **GIVEN** the git-commit skill is not available
- **AND** `git status --porcelain` is non-empty after sync and move
- **WHEN** the archive phase commits archive output
- **THEN** the agent MUST create a conventional commit manually (e.g. `docs(openspec): archive <change-name> and sync specs`)
- **AND** MUST NOT skip commit when porcelain is non-empty

### Requirement: Archive post-commit gate

Archive MUST NOT be reported complete until the archive post-commit gate passes. The gate MUST require an empty `git status --porcelain`. When the change is under `openspec/changes/archive/`, the latest commit MUST include synced specs and the archive folder.

#### Scenario: Gate passes after commit

- **GIVEN** archive sync and move have completed
- **AND** archive output has been committed
- **WHEN** `git status --porcelain` is empty
- **AND** `git log -1 --name-only -- openspec/specs/ openspec/changes/archive/` lists the synced paths
- **THEN** the archive post-commit gate MUST pass
- **AND** the agent MAY report archive complete

#### Scenario: Re-run on archived change with uncommitted sync

- **GIVEN** a change already lives under `openspec/changes/archive/`
- **AND** spec sync left uncommitted files on disk from a prior session
- **WHEN** `/opsx:archive` is re-run or archive commit steps execute
- **THEN** the agent MUST still run commit and post-commit gate
- **AND** MUST NOT report archive complete until the gate passes

### Requirement: Archive operation guidance in config

ferspec projects MUST declare `operations.archive.guidance` in `openspec/config.yaml` with strings that instruct agents to commit archive output and run the post-commit gate. `openspec instructions archive --change "<name>" --json` MUST surface this guidance as `operationGuidance` for `/opsx:archive`.

#### Scenario: Instructions archive loads guidance

- **GIVEN** `openspec/config.yaml` contains `operations.archive.guidance` with commit and gate steps
- **WHEN** `openspec instructions archive --change "<name>" --json` runs
- **THEN** the JSON output MUST include `operationGuidance` with those strings
- **AND** agents MUST treat applicable guidance as additive to the built-in archive workflow

### Requirement: Archive remains outside apply

The ferspec apply phase MUST NOT run archive, spec sync, or archive commit. Archive commit MUST run only during manual `/opsx:archive` after apply handoff or PR merge.

#### Scenario: Apply does not commit archive output

- **GIVEN** apply-code-changes completes with passing verify last gate
- **WHEN** handoff finishes
- **THEN** apply MUST NOT invoke `/opsx:archive`
- **AND** MUST NOT commit synced specs or moved archive folders as part of apply

#### Scenario: Editing change-owned delta specs is not spec sync

- **GIVEN** apply edits delta spec files under the active change directory
- **WHEN** the agent checks whether that work belongs to archive
- **THEN** those edits MUST be treated as apply work, not spec sync
- **AND** only merging deltas into canonical `openspec/specs/` MUST wait for `/opsx:archive`

### Requirement: Apply reconciles delta specs

The ferspec apply phase MUST keep the change's own delta specs consistent with shipped behavior. When implementation lands behavior that differs from the scenario that drove it, the agent MUST rewrite that scenario's title and steps together, MUST delete scenarios the new design supersedes, and MUST update promoted `specs/ubiquitous-language/spec.md` entries. Apply MUST NOT reach handoff with a scenario title naming behavior its own steps forbid, nor with duplicate scenarios asserting the same behavior.

#### Scenario: Design fork re-resolved during apply

- **GIVEN** a delta spec scenario titled for behavior the change no longer ships
- **WHEN** apply implements the replacement behavior
- **THEN** the agent MUST rename or delete that scenario in the same apply run
- **AND** MUST NOT leave the superseded title above rewritten steps
- **AND** MUST NOT add the replacement as a parallel scenario beside it

#### Scenario: Verify PRECHECK rejects inconsistent delta specs

- **GIVEN** the verify last gate PRECHECK runs on the verification ref
- **WHEN** a delta spec has a superseded scenario title, a duplicate scenario, or a requirement contradicting its own scenarios
- **THEN** PRECHECK MUST fail
- **AND** the agent MUST fix the delta spec before running `/opsx:verify` again

#### Scenario: Verify finding deferred to a later phase

- **GIVEN** `/opsx:verify` reports a finding whose recommendation names a later phase, such as "before archive, rename or drop those leftover titles"
- **WHEN** the fix lives in the working tree or under the active change directory
- **THEN** apply MUST perform the fix in-session
- **AND** MUST NOT report apply complete while restating the finding as future work

### Requirement: Apply verify last gate

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

### Requirement: Apply operation guidance in config

ferspec projects MUST declare `operations.apply.guidance` in `openspec/config.yaml` with strings that instruct agents not to report apply complete until `/opsx:verify` has empty CRITICAL, WARNING, and SUGGESTION tiers. `openspec instructions apply --change "<name>" --json` MUST surface this guidance as `operationGuidance` for `/opsx:apply`.

#### Scenario: Instructions apply loads guidance

- **GIVEN** `openspec/config.yaml` contains `operations.apply.guidance` with last-gate verify steps
- **WHEN** `openspec instructions apply --change "<name>" --json` runs
- **THEN** the JSON output MUST include `operationGuidance` with those strings
- **AND** agents MUST treat applicable guidance as additive to the built-in apply workflow
