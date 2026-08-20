# Upstream Sync

## Purpose

Import, sync, and update skills from external repositories while preserving local-only skills.

## Requirements

### Requirement: Sync overwrites source skills

Running sync SHALL replace the contents of `skills/<category>/<name>/` for every skill that has a `source` reference.

#### Scenario: Upstream content changed

- **GIVEN** a source skill's upstream repository has new commits
- **WHEN** `npm run sync` completes
- **THEN** the local skill tree MUST reflect the latest upstream content at the synced path

### Requirement: Local-only skills preserved on sync

Sync SHALL NOT modify skill directories that lack a `source` block in skills.json.

#### Scenario: Local skill during sync

- **GIVEN** a local-only skill with no `source` entry
- **WHEN** `npm run sync` runs
- **THEN** the skill directory MUST remain unchanged

### Requirement: Import adds foreign skills

The import command SHALL clone or fetch from a specified repository and add the skill to a chosen category manifest.

#### Scenario: Single skill import

- **GIVEN** a maintainer runs `npm run import -- --repo owner/repo --path skills/name --category engineering`
- **WHEN** import succeeds
- **THEN** the skill MUST appear under `skills/engineering/<name>/` with a `source` block in skills.json

### Requirement: Upstream lock tracking

The repository SHALL record last-synced upstream SHAs in `.locks/upstream.json` (the Upstream lock).

Loading the Upstream lock SHALL return an empty object only when the file is missing. Invalid JSON, a JSON value that is not a non-null object, and other read errors MUST fail the load. A failed load MUST NOT be treated as empty locks. Parse error messages MUST identify `.locks/upstream.json` and MUST include `invalid JSON`. Error messages MUST NOT include the file contents.

#### Scenario: Post-sync lock update

- **GIVEN** sync completes for a source skill
- **WHEN** locks are written
- **THEN** upstream.json MUST record the SHA used for that skill's source repo/path

#### Scenario: Missing lock file is empty

- **GIVEN** `.locks/upstream.json` does not exist
- **WHEN** the Upstream lock is loaded
- **THEN** the load MUST return an empty object

#### Scenario: Invalid JSON fails the load

- **GIVEN** `.locks/upstream.json` contains truncated or otherwise invalid JSON
- **WHEN** the Upstream lock is loaded
- **THEN** the load MUST fail
- **AND** the error message MUST identify `.locks/upstream.json`
- **AND** the error message MUST include `invalid JSON`
- **AND** the error message MUST NOT include the file contents

#### Scenario: Non-object JSON fails the load

- **GIVEN** `.locks/upstream.json` parses as JSON that is not a non-null object
- **WHEN** the Upstream lock is loaded
- **THEN** the load MUST fail
- **AND** the load MUST NOT return an empty object as success

### Requirement: Update pipeline ordering

The full update command SHALL execute operations in order: sync → static overlay → audit → restore → prepare remerge manifests.

#### Scenario: Full update run

- **GIVEN** a maintainer runs `npm run update`
- **WHEN** the pipeline completes without error
- **THEN** each stage MUST have run in the defined order

### Requirement: Upstream git adapter seam

The repository SHALL provide a single `lib/upstream-adapter.mjs` module that owns all upstream git operations. Sync, import, and overlay extract orchestrators MUST use this adapter instead of inline `git clone` or filesystem tree-walking helpers.

The adapter public interface SHALL expose:

- `cloneRepo(repoRef, destDir)` — shallow-clone an upstream repository into a destination directory
- `readSkillTree(rootDir, skillPath?)` — walk a cloned tree and return files as `{ relPath, content }[]` relative to the skill root
- `getHeadSha(cloneDir)` — return the resolved HEAD commit SHA for a clone directory

#### Scenario: Sync uses adapter for clone and SHA

- **GIVEN** a source skill with `source.repo` set
- **WHEN** `npm run sync` clones the upstream repository
- **THEN** it MUST call `cloneRepo` and `getHeadSha` from the upstream adapter
- **AND** it MUST NOT invoke `git clone` directly in `lib/sync.mjs`

#### Scenario: Import uses adapter for clone

- **GIVEN** a maintainer runs `npm run import -- --repo owner/repo --path skills/name --category engineering`
- **WHEN** import clones the foreign repository
- **THEN** it MUST call `cloneRepo` from the upstream adapter
- **AND** it MUST NOT invoke `git clone` directly in `lib/import.mjs`

#### Scenario: Extract uses adapter for upstream tree read

- **GIVEN** a maintainer runs overlay extract against an upstream source skill
- **WHEN** extract reads the upstream skill tree from a clone
- **THEN** it MUST call `readSkillTree` from the upstream adapter
- **AND** returned files MUST use `{ relPath, content }` shape consistently

### Requirement: Upstream URL normalization

The upstream adapter SHALL normalize repository references to a cloneable git URL. Accepted input forms MUST include `owner/repo`, `https://github.com/owner/repo`, `https://github.com/owner/repo.git`, and `git@github.com:owner/repo.git`.

#### Scenario: Short repo reference normalized

- **GIVEN** a skill manifest `source.repo` value of `fernando-delosrios-sp/skills`
- **WHEN** `cloneRepo` is called
- **THEN** the adapter MUST clone from `https://github.com/fernando-delosrios-sp/skills.git`

#### Scenario: Full HTTPS URL passed through

- **GIVEN** a repository reference already in `https://` form
- **WHEN** `cloneRepo` is called
- **THEN** the adapter MUST use the URL as-is without double-appending `.git`

### Requirement: Testable filesystem injection

The upstream adapter SHALL accept an injectable filesystem adapter for tree reading so unit tests can run without network access or real git clones.

#### Scenario: Tree read with fixture filesystem

- **GIVEN** a test injects an in-memory filesystem adapter with a skill tree fixture
- **WHEN** `readSkillTree` is called against the fixture root
- **THEN** it MUST return `{ relPath, content }[]` matching the fixture
- **AND** the test MUST NOT require network access

#### Scenario: Production uses real filesystem

- **GIVEN** no filesystem adapter is injected (production default)
- **WHEN** `readSkillTree` reads a cloned directory on disk
- **THEN** it MUST use `node:fs/promises` to walk the tree
- **AND** it MUST skip `.git` directories

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

### Requirement: Sync write characterization

The repository SHALL provide unit tests that apply a `pending_update` Sync result onto a temporary skill directory via `applySyncResult`. Those tests MUST write and delete real files on that tree and MUST update the in-memory lock entry SHA and `synced_at`. They MUST NOT clone GitHub or write the live canonical catalog or `.locks/upstream.json`.

#### Scenario: Pending update writes files and deletes orphans

- **GIVEN** a temporary `localSkillDir` containing `keep.md` and `orphan.md`
- **AND** a `pending_update` result whose `upstreamFiles` include `keep.md` with new content and a nested path
- **WHEN** `applySyncResult` runs against that result and an in-memory locks object
- **THEN** `keep.md` MUST contain the upstream content
- **AND** the nested file MUST exist
- **AND** `orphan.md` MUST be gone
- **AND** `locks[skill].sha` MUST equal `result.upstreamSha`

#### Scenario: Non-pending status is a no-op

- **GIVEN** a Sync result whose status is not `pending_update`
- **WHEN** `applySyncResult` runs
- **THEN** the skill directory MUST be unchanged
- **AND** the locks object MUST be unchanged

### Requirement: Import copy characterization

`copySkillDir` SHALL be a named export. Unit tests MUST copy skill files onto a temporary destination and MUST omit git metadata (`.git` and other `GIT_EXCLUDES` names). Tests MUST NOT clone GitHub.

When `doImport` is tested, it SHALL accept optional injectable `cwd` / `loadSkills` / `saveSkills` defaulting to current production behavior. If those cannot be injected without rewriting `lib/index.mjs`, tests MAY skip `doImport` and still MUST cover `copySkillDir`.

#### Scenario: Copy excludes git metadata

- **GIVEN** a source tree with `SKILL.md` and `.git/config`
- **WHEN** `copySkillDir` copies that tree to a temporary destination
- **THEN** the destination MUST contain `SKILL.md`
- **AND** the destination MUST NOT contain `.git`

#### Scenario: Duplicate import name errors without live catalog write

- **GIVEN** `doImport` is testable via injected loaders
- **AND** the existing names set already contains the upstream skill name
- **WHEN** `doImport` runs
- **THEN** it MUST return an error naming the duplicate
- **AND** it MUST NOT write this repository’s live `skills/` catalog

### Requirement: Update orchestrator test seam

`runUpdate` SHALL accept an optional `deps` bag for `syncAllSkills`, `applyStaticOverlays`, `hasOverlay`, `auditAllSkills`, `restoreAllSkills`, `prepareOverlays`, `printSyncSummary`, and `printOverlayApplyPrompt`. Omitted functions MUST default to the current production imports. Production callers that omit `deps` MUST still invoke the real overlay pipeline (sync → static → audit → restore → prepare with `runStatic: false`). Console `kleur` output MUST remain.

#### Scenario: Default happy path call order

- **GIVEN** injected `deps` that record invocation order
- **AND** `dryRun` is false, `skipSync` is false, and `skipPrepare` is false
- **WHEN** `runUpdate` runs
- **THEN** the recorded order MUST include sync, then static overlay, then audit, then restore, then prepare with `runStatic: false`

#### Scenario: Dry run skips audit restore and prepare

- **GIVEN** injected `deps`
- **AND** `dryRun` is true
- **WHEN** `runUpdate` runs
- **THEN** sync and static overlay MUST be called with `{ dryRun: true }`
- **AND** audit, restore, and prepare MUST NOT be called

#### Scenario: Skip sync still runs static overlay

- **GIVEN** injected `deps`
- **AND** `skipSync` is true
- **WHEN** `runUpdate` runs
- **THEN** sync MUST NOT be called
- **AND** static overlay MUST still be called
