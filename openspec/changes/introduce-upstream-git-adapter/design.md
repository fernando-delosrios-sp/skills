## Context

Upstream git and filesystem access is duplicated across three orchestrators:

| Module | Duplicated logic | Return shape |
|---|---|---|
| `lib/sync.mjs` | `shallowClone`, `collectFiles`, `getUpstreamSha` | `{ path (absolute), content }[]` |
| `lib/import.mjs` | `shallowClone` (30s timeout vs 60s elsewhere) | N/A — uses `discoverSkillPaths` for SKILL.md discovery |
| `lib/overlay-extract.mjs` | `shallowClone`, `collectFiles`, `gitShow`, `gitLsTree`, `collectFilesFromGitRef` | `{ relPath, content }[]` |

URL normalization (`owner/repo` → `https://github.com/owner/repo.git`) is identical in all three `shallowClone` copies. Clone timeout differs: import uses 30s; sync and extract use 60s.

The overlay lifecycle split (#1) moved clone/diff helpers into `overlay-extract.mjs` as private functions but did not consolidate with sync/import. `overlay-model.mjs` retains a private `collectFiles` for overlay hash computation on local overlay `files/` directories — this is local overlay I/O, not upstream git, and stays in model.

`.tmp/` clone cache naming (`repoCloneDirName`, `extractCloneDirName` in `tmp.mjs`) is orthogonal to git operations and remains in `tmp.mjs`.

## Goals / Non-Goals

**Goals:**

- Single `lib/upstream-adapter.mjs` owning clone, tree read, and HEAD SHA resolution
- Unified tree read return shape: `{ relPath, content }[]` relative to skill root
- Consistent URL normalization and clone timeout (standardize on 60s)
- Injectable filesystem adapter for unit tests without network
- Refactor `sync.mjs`, `import.mjs`, and `overlay-extract.mjs` to call adapter — delete three `shallowClone` copies
- Preserve identical npm script behavior and lock SHA semantics

**Non-Goals:**

- Centralized `skill-paths` module (#5) — callers still pass skill directory paths
- Moving local-repo git operations (`git show`, `git ls-tree` against `ROOT` for blended_ref diffs) into the adapter — extract's `collectFilesFromGitRef` reads the **local** repo history, not upstream clones; stays in extract or moves to a future local-git helper
- Changing `.tmp/` cache naming or cleanup semantics
- Changing overlay workflow order (sync → static → audit → restore → prepare → apply)
- Adding new npm scripts or CLI flags

## Decisions

### 1. Adapter interface: three public functions

**Decision:** Export `cloneRepo(repoRef, destDir, options?)`, `readSkillTree(rootDir, { skillPath, fs }?)`, and `getHeadSha(cloneDir)`.

**Rationale:** Matches architecture review recommendation. Three functions cover all upstream clone call sites; tree read is separate from clone so tests can inject fixtures without cloning.

**Alternative considered:** Single `fetchUpstreamSkill(repoRef, skillPath)` combining clone + read. Rejected — import clones once and discovers many skills; sync clones per repo batch; combined function forces wrong granularity.

### 2. Unified return shape with relPath

**Decision:** `readSkillTree` always returns `{ relPath, content }[]` where `relPath` is relative to the skill root (or `rootDir` when `skillPath` omitted).

**Rationale:** Extract and overlay-model already use `relPath`. Sync currently uses absolute `path` and computes `relative()` at write time — migrate sync to consume `relPath` directly.

**Alternative considered:** Return absolute paths and let callers relativize. Rejected — perpetuates shape divergence.

### 3. Filesystem injection via options object

**Decision:** `readSkillTree` accepts optional `fs` adapter with `{ readdir, readFile }` matching the subset of `node:fs/promises` used by tree walking. Default: real fs.

**Rationale:** Minimal DI surface; no new abstraction layer. Tests pass in-memory maps.

**Alternative considered:** Full ports-and-adapters with separate `cloneRepo` mock. Rejected — clone mocking is harder and less valuable than tree-read mocking; clone integration can use temp dirs in e2e tests.

### 4. Clone timeout: standardize on 60s

**Decision:** All `cloneRepo` calls use 60s timeout (matching sync/extract today).

**Rationale:** Import's 30s was likely accidental drift. No reported timeout issues at 60s.

### 5. Local git ops stay in extract

**Decision:** `gitShow`, `gitLsTree`, and `collectFilesFromGitRef` (reading local repo at `ROOT`) remain in `overlay-extract.mjs`.

**Rationale:** These operate on the maintainer's working copy for `--from-commit` extraction, not upstream clones. Mixing them into upstream-adapter blurs the seam.

**Alternative considered:** Move to a `local-git.mjs` helper. Deferred — out of scope unless extract grows further.

### 6. overlay-model collectFiles stays local

**Decision:** Private `collectFiles` in `overlay-model.mjs` for hashing overlay `files/` directories is NOT moved to upstream-adapter.

**Rationale:** Reads local overlay payloads, not upstream repos. Different concern.

### 7. Default export vs named exports

**Decision:** Named exports only (`cloneRepo`, `readSkillTree`, `getHeadSha`, plus `normalizeRepoUrl` if needed internally).

**Rationale:** Matches existing `lib/` module style.

## Module dependency graph

```text
lib/sync.mjs ──────────> upstream-adapter.mjs
lib/import.mjs ────────> upstream-adapter.mjs
lib/overlay-extract.mjs > upstream-adapter.mjs (clone + upstream tree read)
                        > (local git helpers remain private)

upstream-adapter.mjs
  ├── node:child_process (git exec — production only)
  └── node:fs/promises (default fs adapter)

lib/tmp.mjs — unchanged (cache dir naming, cleanup)
lib/overlay-model.mjs — unchanged (local overlay file hashing)
```

## Risks / Trade-offs

- **[Sync write path migration]** → Map sync's `writeUpstreamToLocal` to consume `relPath` instead of absolute `path`; run validate + manual sync smoke test
- **[Import discoverSkillPaths unchanged]** → Import still walks clone for SKILL.md discovery; only `shallowClone` moves to adapter — no behavior change
- **[Timeout change for import]** → 30s → 60s is safer; document in CHANGELOG as internal consistency fix
- **[Test coverage gap on clone]** → Focus unit tests on `readSkillTree` + URL normalization; clone tested via integration or temp-dir e2e
- **[Partial migration leaves fourth clone copy]** → Grep for `shallowClone` and `git clone` across `lib/` before merge; zero matches outside adapter

## Migration Plan

1. Create `lib/upstream-adapter.mjs` with `normalizeRepoUrl`, `cloneRepo`, `readSkillTree`, `getHeadSha`
2. Add unit tests for URL normalization and `readSkillTree` with injected fs fixture
3. Refactor `lib/sync.mjs` — replace local helpers; adapt `writeUpstreamToLocal` to `relPath` shape
4. Refactor `lib/import.mjs` — replace `shallowClone` with `cloneRepo`
5. Refactor `lib/overlay-extract.mjs` — replace upstream `shallowClone` and upstream `collectFiles` with adapter calls; keep local git helpers
6. Grep verify no duplicate `shallowClone` remains in `lib/`
7. Run `npm run validate`; smoke-test `npm run sync` and `npm run import -- --help`
8. Update `AGENTS.md` module list; CHANGELOG entry (internal refactor, no user-facing change)

**Rollback:** Revert adapter module and restore inline helpers — no lock file or data migration.

## Open Questions

- Should `normalizeRepoUrl` be exported for use in error messages / logging, or kept private?
- Add `--clone-timeout` option to adapter for future configurability, or hardcode 60s?
- Co-locate adapter tests under `test/upstream-adapter.test.mjs` or follow existing test layout if one exists?
