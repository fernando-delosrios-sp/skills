## Context

The legacy sync workflow (pre Aug 2026 overlay refactor) ran daily, created `sync/YYYY-MM-DD` branches via `lib/github.mjs`, opened PRs, and never deleted branches afterward. Fifty-one stale branches accumulated until manual cleanup.

Current state:

- `.github/workflows/sync.yaml` — dry-run only; `contents: read` permissions; no branch creation
- `scripts/sync.mjs` — local sync only; CI GitHub Actions path removed in `8e4ca21`
- `lib/github.mjs` — has `createBranch`, `commitFiles`, `openPR`; no delete helpers

The user wants the internal CI/CD sync process to delete `sync/*` remote branches when done. This change adds cleanup infrastructure and wires it into the sync workflow so branch deletion happens automatically regardless of whether live CI sync is re-enabled later.

## Goals / Non-Goals

**Goals:**

- Add `listBranches`, `deleteBranch`, and `cleanupSyncBranches` to `lib/github.mjs`
- Wire a cleanup step into `.github/workflows/sync.yaml` that runs on every workflow completion
- Safe deletion policy: merged branches go; open-PR branches stay; orphan same-day branches go
- Expose a CLI flag (`--cleanup-branches`) for local dry-run inspection
- Unit-test cleanup logic with mocked Octokit responses

**Non-Goals:**

- Re-enabling scheduled daily sync or live CI PR creation (can follow separately)
- Changing local `npm run sync` file-write behavior
- Overlay apply workflow changes (sync → static → audit → restore → prepare → apply)
- Deleting non-`sync/*` branches
- GitHub repo setting "Automatically delete head branches" (complementary, not a substitute — we also prune historical merged branches)

## Decisions

### 1. Cleanup runs as final workflow step with `if: always()`

**Decision:** Add a "Cleanup sync branches" step at the end of the sync job, guarded by `if: always()`, before any job-level failure exits.

**Rationale:** Merged branches from prior runs should be pruned even when today's dry-run or validate step fails. Avoids a separate workflow file for now.

**Alternative considered:** Dedicated `cleanup-sync-branches.yaml` on schedule. Rejected — couples poorly with "when sync is done"; extra workflow to maintain.

### 2. Merged-branch detection via compare API

**Decision:** For each `sync/*` branch, use `octokit.repos.compareCommitsWithBasehead` (or `getBranch` + check `merged_at` on associated PR) to determine if safe to delete. Prefer listing open PRs with `head` prefix `sync/` and excluding those heads from deletion; delete all other `sync/*` branches whose tip is an ancestor of default branch.

**Rationale:** Simple heuristic — if branch tip is contained in default branch history, it is merged. Open PR check prevents deleting in-flight work.

**Alternative considered:** Rely solely on GitHub "delete branch on merge" setting. Rejected — does not clean up the 50 historical branches and depends on UI config.

### 3. `cleanupSyncBranches` accepts `{ dryRun, excludeBranches }`

**Decision:** Export `cleanupSyncBranches(octokit, repoRef, { dryRun?, excludeBranches? })` returning `{ deleted, skipped, errors }`.

**Rationale:** Workflow passes no excludes; CI sync mode (future) can pass today's branch if PR still open. Dry-run supports local inspection.

### 4. CLI via sync command flag

**Decision:** Add `--cleanup-branches` and `--dry-run` to the existing `sync` subcommand in `scripts/sync.mjs`. When set, skip upstream sync and only run cleanup.

**Rationale:** Keeps one workflow entry point; workflow runs `npm run sync -- --cleanup-branches`.

**Alternative considered:** New `npm run cleanup-branches` script. Rejected — minor extra surface; sync workflow already uses sync script.

### 5. Permissions bump on sync workflow

**Decision:** Change sync workflow job permissions to `contents: write` (minimum needed for ref delete).

**Rationale:** Branch deletion requires write on contents. No PR write needed for cleanup-only workflow.

## Risks / Trade-offs

- **[Open PR false negative]** → Query open PRs with `head:owner:sync/...` before delete; never delete if any open PR references the branch
- **[Race with concurrent sync runs]** → Two runs same UTC day could collide on branch name if live sync restored; defer to future CI sync change (idempotent create or reuse branch)
- **[Token scope]** → `GITHUB_TOKEN` in Actions has sufficient scope for same-repo branch delete; document that fork PRs are out of scope
- **[Dry-run workflow still deletes merged branches]** → Intentional — historical cleanup is valuable even when live sync is disabled

## Migration Plan

1. Implement `lib/github.mjs` delete helpers and tests
2. Add `--cleanup-branches` to `scripts/sync.mjs`
3. Update `.github/workflows/sync.yaml` — permissions + cleanup step
4. Run workflow manually via `workflow_dispatch`; verify merged `sync/*` branches are gone (already manually cleared — add test branch to verify)
5. Update `AGENTS.md` if new flag documented; CHANGELOG entry via changelog-generator

**Rollback:** Remove cleanup step from workflow; delete helpers are inert if unused.

## Open Questions

- Should cleanup also run on `pull_request` closed (merged) events for same-day branch deletion, or is workflow-step cleanup sufficient?
- When live CI sync is re-enabled, should cleanup run before or after PR creation in the same job?
