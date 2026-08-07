## 1. GitHub branch cleanup helpers

- [x] 1.1 Add `listBranches(octokit, repoRef, { prefix })` to `lib/github.mjs` — paginate `octokit.paginate(octokit.repos.listBranches)` and filter by prefix
- [x] 1.2 Add `deleteBranch(octokit, repoRef, branchName)` — call `octokit.git.deleteRef` for `heads/<branchName>`; swallow 422 if ref already gone
- [x] 1.3 Add `isBranchMerged(octokit, repoRef, branchName, defaultBranch)` — compare branch tip against default branch via compare API or merge-base check
- [x] 1.4 Add `getOpenSyncPRHeads(octokit, repoRef)` — list open PRs whose head ref starts with `sync/`
- [x] 1.5 Implement `cleanupSyncBranches(octokit, repoRef, { dryRun, excludeBranches })` — delete merged `sync/*` branches not in open-PR set; return `{ deleted, skipped, errors }`

## 2. Unit tests

- [x] 2.1 Create `test/github.test.mjs` with mocked Octokit for list, delete, merged detection, and open-PR skip logic
- [x] 2.2 Test dry-run mode returns would-delete list without calling deleteRef
- [x] 2.3 Confirm tests run via existing `npm test`

## 3. CLI integration

- [x] 3.1 Add `--cleanup-branches` flag to `sync` command in `scripts/sync.mjs`
- [x] 3.2 When `--cleanup-branches` is set, call `cleanupSyncBranches` with `GITHUB_TOKEN` / `GITHUB_REPOSITORY`; support `--dry-run` passthrough
- [x] 3.3 Print summary of deleted/skipped branches to stdout

## 4. Sync workflow

- [x] 4.1 Update `.github/workflows/sync.yaml` — set `permissions.contents: write`
- [x] 4.2 Add final step "Cleanup sync branches" with `if: always()` running `npm run sync -- --cleanup-branches`
- [x] 4.3 Pass `GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}` and `GITHUB_REPOSITORY: ${{ github.repository }}` env vars to cleanup step

## 5. Verification and documentation

- [x] 5.1 Run `npm run validate` and confirm exit code 0
- [x] 5.2 Run `npm test` and confirm all pass
- [x] 5.3 Update `AGENTS.md` Commands or workflow section to note sync branch cleanup behavior
- [x] 5.4 Add CHANGELOG.md entry via changelog-generator skill (internal CI hygiene — no user-facing skill change)
- [x] 5.5 Smoke-test cleanup locally with `--dry-run` when `GITHUB_TOKEN` is available
