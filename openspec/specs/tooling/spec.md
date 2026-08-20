# Tooling

## Purpose

Provide CLI infrastructure in `lib/` and `scripts/` for maintainers to sync, validate, and manage skills.

## Requirements

### Requirement: Validate command

The repository SHALL provide `npm run validate` to check skills.json manifests, SKILL.md files, and overlays. Validation MUST be layered into `validateStructure()` (well-formed repo, no git audit) and `validateBlendState()` (overlay audit routes, `blended_ref`, pending apply). `validateRepo()` MUST remain as a convenience wrapper that runs both layers.

The validate CLI MUST accept `--structure-only` to run structure validation without blend checks. Default behavior (no flag) MUST run both layers.

#### Scenario: Valid repository state

- **GIVEN** all manifests, skills, overlays, and blend state are well-formed
- **WHEN** `npm run validate` runs
- **THEN** it MUST exit with code 0

#### Scenario: Invalid manifest detected

- **GIVEN** a skills.json entry violates naming or structure rules
- **WHEN** `npm run validate` runs
- **THEN** it MUST exit non-zero and report the specific violation

#### Scenario: Structure-only skips blend audit

- **GIVEN** a source skill has pending remerge with no `blended_ref`
- **WHEN** `npm run validate -- --structure-only` runs
- **THEN** it MUST NOT invoke `auditSkill` or emit blend-state warnings
- **AND** it MUST exit with code 0 if structure checks pass

#### Scenario: Full validate includes blend warnings

- **GIVEN** a source skill has pending remerge with no `blended_ref`
- **WHEN** `npm run validate` runs without `--structure-only`
- **THEN** it MUST emit a blend-state warning for that skill
- **AND** it MUST exit with code 0 (warnings do not fail validate)

### Requirement: Structure validation layer

`validateStructure()` SHALL verify manifests, SKILL.md frontmatter (via `skill-md.mjs`), overlay YAML shape and static file references (via structure-only `validateOverlays`), generator output file presence, orphan/missing skill directories, and marketplace manifest sync. It MUST NOT call `auditSkill` or inspect git `blended_ref` state.

#### Scenario: Structure layer is git-free

- **GIVEN** a repository with well-formed structure but stale blend locks
- **WHEN** `validateStructure()` runs
- **THEN** it MUST complete without git checkout or audit operations
- **AND** it MUST return only structure errors and warnings

### Requirement: Blend validation layer

`validateBlendState()` SHALL verify overlay audit routes, `blended_ref` presence for pending apply skills, and pending remerge detection for source skills with lock entries. It MUST use `auditSkill` and `isOverlayRoutePending` from the overlay pipeline — not timestamp heuristics.

#### Scenario: Blend warning for missing blended_ref

- **GIVEN** a source skill with overlay route `fresh` or `remerge` and no `blended_ref`
- **WHEN** `validateBlendState()` runs
- **THEN** it MUST emit an `overlay-lock` warning naming the skill and route

#### Scenario: Local-only skills skipped

- **GIVEN** a skill with no `source` block in skills.json
- **WHEN** `validateBlendState()` runs
- **THEN** it MUST NOT audit that skill

### Requirement: Clean command

The repository SHALL provide `npm run clean` to prune stale clone caches and optional overlay apply manifests.

#### Scenario: Clean clone caches

- **GIVEN** stale `.tmp` clone caches exist from prior sync/import
- **WHEN** `npm run clean` runs
- **THEN** those caches MUST be removed

### Requirement: Extract overlay command

The repository SHALL provide `npm run extract-overlay` to draft overlay YAML from local customizations vs upstream. Extract MUST skip generator-managed paths using `overlay-yaml.mjs` helpers (`isGeneratedPathForSkill`, `expectedContentForPath`) so drafts do not treat generator outputs as manual customizations. Local tree selection for extraction MUST resolve through `lib/skill-paths.mjs` — canonical tree by default, agents tree when `--from-agents` is set.

#### Scenario: Draft overlay from agents working copy

- **GIVEN** a maintainer runs `npm run extract-overlay -- --skill git-commit --from-agents`
- **WHEN** extraction completes
- **THEN** a draft OVERLAY.yaml MUST be produced reflecting the diff minus generator-managed paths
- **AND** the local side of the diff MUST be read from `agentsDir` returned by skill-paths

#### Scenario: Generator output absent upstream skipped

- **GIVEN** a generator declares `file: agents/openai.yaml`
- **AND** upstream has no such file but local canonical tree does
- **WHEN** extract runs for that skill
- **THEN** the draft overlay MUST NOT add a static payload for that path solely because it is local-only

#### Scenario: Extract from commit uses gitPrefix

- **GIVEN** a maintainer runs `npm run extract-overlay -- --skill git-commit --from-commit HEAD`
- **WHEN** extraction reads local files from git history
- **THEN** it MUST use `gitPrefix` from skill-paths as the tree prefix in the local repository

### Requirement: Validate uses skill-paths for directory checks

The validate command SHALL resolve indexed skill directories and orphan detection paths via skill-paths rather than inline `resolve(skillsRoot, category, name)` construction.

#### Scenario: Missing SKILL.md error references canonicalDir

- **GIVEN** a skill is listed in skills.json but its canonical tree lacks SKILL.md
- **WHEN** `npm run validate` runs
- **THEN** the error message MUST reference the path from skill-paths `getCanonicalDir`

### Requirement: Script entry points

All maintainer commands SHALL be exposed as npm scripts delegating to `scripts/sync.mjs` or dedicated modules in `lib/`.

#### Scenario: Command discoverability

- **GIVEN** a maintainer reads package.json scripts
- **WHEN** they inspect available commands
- **THEN** sync, update, import, overlay, extract-overlay, clean, validate, and install MUST be listed

### Requirement: Node.js engine constraint

Tooling SHALL require Node.js >= 18 as declared in package.json engines.

#### Scenario: Unsupported Node version

- **GIVEN** Node.js version is below 18
- **WHEN** a maintainer runs any npm script
- **THEN** npm MUST warn or fail per engines policy

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

