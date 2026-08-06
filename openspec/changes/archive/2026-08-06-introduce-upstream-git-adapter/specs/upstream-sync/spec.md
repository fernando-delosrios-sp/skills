## ADDED Requirements

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
