## Why

The legacy scheduled sync workflow created a daily `sync/YYYY-MM-DD` remote branch and opened a PR, but never deleted the branch afterward. Over ~50 days this left 50 stale `sync/*` branches on the remote until manual cleanup. Any internal CI sync that creates ephemeral sync branches must tear them down when the run finishes (or when the PR merges) so branch clutter does not accumulate again.

## What Changes

- Add GitHub API helpers in `lib/github.mjs` to list and delete remote branches matching `sync/*`
- Add a **branch cleanup** step to the sync CI workflow that runs at the end of every job (success or failure)
- Cleanup policy: delete merged `sync/*` branches; delete the current run's branch when no PR was opened (no upstream changes); retain branches with open PRs until merge
- Optionally restore CI sync mode in `scripts/sync.mjs` (GitHub Actions path) if the workflow moves back from dry-run to live sync — cleanup runs regardless
- No change to local `npm run sync` behavior (maintainer applies upstream locally, reviews overlays)

## Capabilities

### New Capabilities

<!-- None — branch lifecycle is part of upstream sync CI behavior. -->

### Modified Capabilities

- `upstream-sync`: Add requirements for CI sync branch lifecycle — ephemeral `sync/*` branches MUST be deleted when the CI run completes or after PR merge
- `tooling`: Add requirements for GitHub branch cleanup helpers and sync workflow integration

## Impact

- **Primary files**: `lib/github.mjs` (new `listBranches`, `deleteBranch`, `cleanupSyncBranches`); `.github/workflows/sync.yaml` (cleanup step + permissions)
- **Secondary files**: `scripts/sync.mjs` if CI sync mode is re-enabled; `test/github.test.mjs` for cleanup logic
- **Skill types affected**:
  - **Foreign/source skills**: CI sync updates these upstream — cleanup is orthogonal to overlay workflow
  - **Customized skills (overlays)**: unchanged; overlays still applied locally after sync lands on main
  - **Local-only skills**: unaffected
- **Dependencies**: existing `@octokit/rest`; workflow needs `contents: write` for branch deletion
- **Deferred**: auto-merge PR flow restoration (separate decision); webhook-based cleanup on `pull_request` closed event (only if workflow-step cleanup is insufficient)
