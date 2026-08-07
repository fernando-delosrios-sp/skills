## ADDED Requirements

### Requirement: GitHub branch cleanup helpers

The repository SHALL provide functions in `lib/github.mjs` for listing and deleting remote branches used by CI sync cleanup:

- `listBranches(octokit, { owner, repo }, { prefix? })` — return branch names, optionally filtered by prefix
- `deleteBranch(octokit, { owner, repo }, branchName)` — delete a single remote branch ref
- `cleanupSyncBranches(octokit, { owner, repo }, options?)` — delete merged `sync/*` branches and optionally the current run branch when no PR was opened

All functions MUST require `GITHUB_TOKEN` via the existing `getOctokit()` helper.

#### Scenario: List sync branches

- **GIVEN** remote branches `main`, `sync/2026-08-05`, and `sync/2026-08-06` exist
- **WHEN** `listBranches` is called with `prefix: 'sync/'`
- **THEN** it MUST return `['sync/2026-08-05', 'sync/2026-08-06']`

#### Scenario: Delete branch via API

- **GIVEN** remote branch `sync/2026-08-05` is merged into default branch
- **WHEN** `deleteBranch` is called for `sync/2026-08-05`
- **THEN** the remote ref `refs/heads/sync/2026-08-05` MUST be removed

#### Scenario: Cleanup skips branches with open PRs

- **GIVEN** `sync/2026-08-07` has an open pull request
- **WHEN** `cleanupSyncBranches` runs
- **THEN** it MUST NOT delete `sync/2026-08-07`
- **AND** it MUST delete other merged `sync/*` branches

### Requirement: Sync workflow cleanup step

The `.github/workflows/sync.yaml` workflow SHALL include a final cleanup step that invokes branch cleanup. The workflow MUST grant `contents: write` permission for branch deletion.

The cleanup step MUST run even when prior sync steps fail (`if: always()` or equivalent).

#### Scenario: Cleanup step in sync workflow

- **GIVEN** the sync workflow job completes (success or failure)
- **WHEN** the cleanup step executes
- **THEN** it MUST call `cleanupSyncBranches` with `GITHUB_TOKEN` and `GITHUB_REPOSITORY` from the environment

#### Scenario: Workflow permissions for branch delete

- **GIVEN** the sync workflow runs on GitHub Actions
- **WHEN** the cleanup step deletes a remote branch
- **THEN** the job MUST have `permissions.contents: write`

### Requirement: Cleanup CLI entry point

The repository SHALL expose cleanup via `npm run sync -- --cleanup-branches` or a dedicated script invoked by the workflow, delegating to `cleanupSyncBranches` in `lib/github.mjs`.

#### Scenario: Maintainer dry-run cleanup locally

- **GIVEN** `GITHUB_TOKEN` and `GITHUB_REPOSITORY` are set
- **WHEN** a maintainer runs the cleanup command with `--dry-run`
- **THEN** it MUST report which `sync/*` branches would be deleted without deleting them
