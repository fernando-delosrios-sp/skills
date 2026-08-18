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

- **GIVEN** apply-code-changes completes with passing verify-fix loop
- **WHEN** handoff finishes
- **THEN** apply MUST NOT invoke `/opsx:archive`
- **AND** MUST NOT commit synced specs or moved archive folders as part of apply

### Requirement: Apply verify-fix loop

The ferspec apply phase MUST run a blocking verify-fix loop before handoff. The agent MUST invoke **openspec-verify-change** or `/opsx:verify` on the verification ref, fix FAILs and warnings autonomously, re-run the verify-aligned completion gate, and repeat until ✅ PASS.

#### Scenario: Verify-fix blocks handoff

- **GIVEN** apply-code-changes has finished implementation tasks
- **AND** verify-aligned completion gate rows pass
- **WHEN** `/opsx:verify` or openspec-verify-change reports ❌ FAIL or unresolved warnings
- **THEN** apply MUST NOT hand off
- **AND** MUST fix issues and re-run verify-fix until ✅ PASS

#### Scenario: Post-apply verify confirms PASS

- **GIVEN** apply-code-changes reports handoff complete
- **WHEN** the user runs standalone `/opsx:verify`
- **THEN** verify MUST confirm ✅ PASS
- **AND** MUST NOT surface new FAILs or warnings that apply should have fixed

#### Scenario: Worktree verify runs on original branch

- **GIVEN** apply venue is `worktree`
- **WHEN** verify-aligned gate and verify-fix run
- **THEN** the agent MUST squash-merge `apply-<name>` to `ORIGINAL_BRANCH` on main repo first
- **AND** MUST NOT run verify on the worktree checkout
