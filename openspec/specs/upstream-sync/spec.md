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

The repository SHALL record last-synced upstream SHAs in `.locks/upstream.json`.

#### Scenario: Post-sync lock update

- **GIVEN** sync completes for a source skill
- **WHEN** locks are written
- **THEN** upstream.json MUST record the SHA used for that skill's source repo/path

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

