## ADDED Requirements

### Requirement: CI sync branch cleanup

When the sync GitHub Actions workflow completes, it SHALL delete remote branches matching `sync/*` that are safe to remove. A branch is safe to delete when it is fully merged into the repository default branch, or when the current workflow run created it but opened no PR (no upstream changes).

Branches with open pull requests MUST NOT be deleted until the PR is merged or closed.

#### Scenario: Merged sync branch deleted after workflow

- **GIVEN** remote branch `sync/2026-08-01` exists and its PR was merged into the default branch
- **WHEN** the sync workflow cleanup step runs
- **THEN** `sync/2026-08-01` MUST be deleted from the remote

#### Scenario: Open PR branch retained

- **GIVEN** remote branch `sync/2026-08-07` has an open pull request
- **WHEN** the sync workflow cleanup step runs
- **THEN** `sync/2026-08-07` MUST NOT be deleted

#### Scenario: No-changes run deletes same-day branch

- **GIVEN** the CI sync run created branch `sync/2026-08-07` but detected no upstream changes and opened no PR
- **WHEN** the sync workflow cleanup step runs
- **THEN** `sync/2026-08-07` MUST be deleted if it exists on the remote

#### Scenario: Cleanup runs on workflow failure

- **GIVEN** the sync workflow fails before completing sync steps
- **WHEN** the cleanup step runs in a `always()` job or step
- **THEN** merged `sync/*` branches MUST still be pruned
- **AND** branches with open PRs MUST remain

### Requirement: Sync branch naming convention

CI sync branches SHALL use the pattern `sync/YYYY-MM-DD` where the date is UTC.

#### Scenario: Branch name format

- **GIVEN** a CI sync run on 2026-08-07 UTC
- **WHEN** the workflow creates a sync branch
- **THEN** the branch name MUST be `sync/2026-08-07`
