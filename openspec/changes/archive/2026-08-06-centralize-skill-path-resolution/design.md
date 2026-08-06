## Context

Skill path rules are scattered across the codebase:

| Module | Path logic | Pattern |
|---|---|---|
| `lib/index.mjs` | `getSkillDir`, `getOverlayDir` | `skills/${category}/${name}`, `overlays/${name}` |
| `lib/overlay-audit.mjs` | `getGitSkillPrefix` (private) | `` `skills/${category}/${name}` `` |
| `lib/overlay-extract.mjs` | `resolveLocalFiles` (private) | agents: `.agents/skills/${name}`; commit: inline git prefix; default: `getSkillDir` |
| `lib/validate.mjs` | inline `resolve(skillsRoot, category, name)` | duplicates canonical path |

Three on-disk trees matter:

1. **Canonical** — `skills/<category>/<name>/` (sync/install source of truth)
2. **Agents** — `.agents/skills/<name>/` (flat dev copy for `--from-agents` extract)
3. **Overlay** — `overlays/<name>/` (customization intent + static file payloads)

Git operations (blended_ref validation, `--from-commit` extract) need a fourth derived value: **git prefix** — `skills/<category>/<name>` as a repo-relative path string.

Prior changes (#1 overlay split, #2 upstream adapter, #3 pending unification) consolidated lifecycle and git clone seams but left path resolution inline. Architecture review #5 recommends a deep `skill-paths` module.

## Goals / Non-Goals

**Goals:**

- Single `lib/skill-paths.mjs` owning all four path values for a skill record
- Pure functions — no fs, no git, no manifest loading
- Named exports matching existing call-site names where possible (`getSkillDir` → `getCanonicalDir` with re-export alias)
- Migrate all `lib/` call sites; grep confirms no duplicate path templates
- Unit tests for path resolution with fixture skill records
- Backward-compatible re-exports from `lib/index.mjs` during migration

**Non-Goals:**

- Changing directory layout on disk (paths stay identical)
- Moving `SKILLS_ROOT`, `ROOT`, or category manifest path helpers — those stay in `index.mjs`
- Centralizing upstream `source.path` (foreign repo relative path) — upstream adapter concern
- Moving `getOverlayManifestDir` (`.tmp/overlay-apply/`) — tmp concern, not skill tree
- Validation layering split (#6) — validate still runs full audit; only path construction moves
- Changing `npm run install` destination logic (distribution concern)

## Decisions

### 1. Primary API: `resolveSkillPaths(skill)` returning a struct

**Decision:** Export `resolveSkillPaths(skill)` returning `{ canonicalDir, agentsDir, overlayDir, gitPrefix }`. Also export individual getters that delegate to it.

**Rationale:** Architecture review recommendation. One call site needing multiple paths (extract) gets all values; single-path call sites use convenience exports.

**Alternative considered:** Only individual getters, no struct. Rejected — extract's `resolveLocalFiles` switches between three trees; struct avoids triple calls and keeps values consistent.

### 2. `getOverlayDir` takes skill name, not full record

**Decision:** Keep `getOverlayDir(skillName)` signature — overlays are keyed by skill name only.

**Rationale:** Matches existing API and on-disk layout. Category is irrelevant for overlay directories.

### 3. `getSkillDir` becomes re-export alias for `getCanonicalDir`

**Decision:** Implement `getCanonicalDir` in skill-paths; re-export `getSkillDir` from `index.mjs` as alias to preserve existing imports.

**Rationale:** Minimizes churn — 8+ call sites import `getSkillDir` from `index.mjs`. Can deprecate alias later.

**Alternative considered:** Rename all call sites to `getCanonicalDir` in one PR. Rejected — larger diff for no behavioral gain.

### 4. ROOT constant imported from index or defined once in skill-paths

**Decision:** `skill-paths.mjs` imports `ROOT` and `SKILLS_ROOT` from `./index.mjs` (or defines `ROOT` locally via `fileURLToPath` to avoid circular import).

**Rationale:** `index.mjs` already exports `ROOT` and `SKILLS_ROOT`. Circular risk: if `index.mjs` re-exports from skill-paths and skill-paths imports from index — break cycle by having skill-paths compute ROOT independently (same pattern as today in index.mjs).

**Implementation note:** Define `ROOT` in skill-paths using the same `fileURLToPath` pattern; export `SKILLS_ROOT = resolve(ROOT, 'skills')` locally. `index.mjs` can import and re-export if desired, or keep its own constants (they must match).

### 5. Git prefix uses forward slashes, no trailing slash

**Decision:** `gitPrefix` = `` `skills/${skill.category}/${skill.name}` `` — POSIX-style, no leading `./`, no trailing `/`.

**Rationale:** Matches existing `getGitSkillPrefix` and git path conventions used in `git cat-file` / `git ls-tree`.

### 6. Agents tree is flat (name only, no category)

**Decision:** `agentsDir` = `resolve(ROOT, '.agents', 'skills', skill.name)`.

**Rationale:** Matches current extract behavior and README. Skill names are globally unique, so category segment is unnecessary in the dev tree.

### 7. Private helpers removed from overlay modules

**Decision:** Delete `getGitSkillPrefix` from `overlay-audit.mjs` and inline git prefix from `overlay-extract.mjs`. Pipeline re-exports `getGitSkillPrefix` from skill-paths if external callers depend on it.

**Rationale:** Single source of truth; pipeline barrel already re-exports audit helpers.

## Module dependency graph

```text
lib/skill-paths.mjs
  └── node:path only (pure resolution)

lib/index.mjs ──────────> skill-paths.mjs (re-export getSkillDir, getOverlayDir)
lib/overlay-audit.mjs > skill-paths.mjs (getGitSkillPrefix)
lib/overlay-extract.mjs > skill-paths.mjs (canonicalDir, agentsDir, gitPrefix)
lib/validate.mjs ───────> skill-paths.mjs (getCanonicalDir)
lib/sync.mjs ───────────> index.mjs or skill-paths.mjs
lib/overlay-static.mjs > index.mjs or skill-paths.mjs
lib/overlay-manifest.mjs
lib/overlay-model.mjs
lib/overlay-yaml.mjs ───> skill-paths.mjs (getOverlayDir)
lib/overlay-pipeline.mjs > skill-paths.mjs (re-export getGitSkillPrefix)
```

## Risks / Trade-offs

- **[Circular import index ↔ skill-paths]** → skill-paths computes ROOT independently; index re-exports path helpers without skill-paths importing loadSkills
- **[Missed inline path during migration]** → Grep for `.agents/skills`, `` `skills/${``, `getSkillDir` duplicates, and `getGitSkillPrefix` outside skill-paths before merge
- **[Re-export drift]** → Prefer direct skill-paths import in overlay submodules; index re-export only for backward compat
- **[Test-only path assumptions]** → Audit existing tests for hardcoded path strings; update to use skill-paths helpers

## Migration Plan

1. Create `lib/skill-paths.mjs` with `resolveSkillPaths`, `getCanonicalDir`, `getAgentsDir`, `getOverlayDir`, `getGitSkillPrefix`
2. Add unit tests in `test/skill-paths.test.mjs`
3. Update `lib/index.mjs` — delegate `getSkillDir`/`getOverlayDir` to skill-paths (or re-export)
4. Update `lib/overlay-audit.mjs` — import `getGitSkillPrefix` from skill-paths; remove local function
5. Update `lib/overlay-extract.mjs` — replace `resolveLocalFiles` inline paths with skill-paths
6. Update `lib/validate.mjs` — replace inline `resolve(skillsRoot, ...)` with `getCanonicalDir`
7. Update remaining call sites (`sync`, `overlay-static`, `overlay-manifest`, `overlay-model`, `overlay-yaml`, `overlay-pipeline` re-export)
8. Grep verify no duplicate path templates remain in `lib/`
9. Run `npm run validate`; smoke-test `npm run extract-overlay -- --help`
10. Update `AGENTS.md` module list; CHANGELOG entry (internal refactor)

**Rollback:** Revert skill-paths module and restore inline helpers — no data migration.

## Open Questions

- Should `index.mjs` eventually stop re-exporting path helpers and force direct skill-paths imports?
- Add `getOverlayFilesDir(skillName)` for `overlays/<name>/files/` now, or wait until a call site needs it?
- Co-locate tests under `test/skill-paths.test.mjs` or follow another existing test layout?
