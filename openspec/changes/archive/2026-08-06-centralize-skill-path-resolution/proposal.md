## Why

Three on-disk skill trees — canonical (`skills/<category>/<name>/`), agents dev copy (`.agents/skills/<name>/`), and overlay files (`overlays/<name>/`) — each encode path rules independently across `lib/index.mjs`, `lib/overlay-audit.mjs`, `lib/overlay-extract.mjs`, and `lib/validate.mjs`. Git prefix strings (`skills/${category}/${name}`) are duplicated inline in audit and extract; agents-tree resolution lives only in extract's private `resolveLocalFiles`. This scatters path bugs and makes layout changes (e.g., new dev tree, category nesting) touch many modules. With overlay pipeline split and upstream adapter complete, centralizing path resolution is the natural next deepening step.

## What Changes

- Introduce `lib/skill-paths.mjs` as the single module for skill path resolution with public interface: `resolveSkillPaths(skill)` returning `{ canonicalDir, agentsDir, overlayDir, gitPrefix }`
- Move `getSkillDir` and `getOverlayDir` from `lib/index.mjs` into `skill-paths.mjs`; re-export from `index.mjs` for backward compatibility during migration
- Move `getGitSkillPrefix` from `lib/overlay-audit.mjs` into `skill-paths.mjs`
- Replace inline path construction in `lib/overlay-extract.mjs` (`resolveLocalFiles`, `--from-commit` git prefix) with `skill-paths` helpers
- Replace inline `resolve(skillsRoot, skill.category, skill.name)` in `lib/validate.mjs` with `canonicalDir` from `skill-paths`
- Update call sites in `lib/sync.mjs`, `lib/overlay-static.mjs`, `lib/overlay-manifest.mjs`, `lib/overlay-model.mjs`, `lib/overlay-yaml.mjs` to import from `skill-paths` (directly or via `index.mjs` re-exports)
- Add unit tests for path resolution — pure functions, no filesystem I/O required
- No npm script surface change — same sync, validate, extract-overlay workflows; paths resolve identically to today

## Capabilities

### New Capabilities

- `skill-paths`: Central path resolution for canonical, agents, overlay, and git-prefix locations given a skill record

### Modified Capabilities

- `skill-catalog`: Require canonical skill directory resolution via the skill-paths module
- `tooling`: Require validate and extract-overlay to resolve local skill trees through skill-paths (including `--from-agents` agents tree)
- `overlay-pipeline`: Require audit git prefix and extract local-tree selection to use skill-paths instead of inline string templates
- `ubiquitous-language`: Add **Canonical tree** and **Agents tree** glossary entries; align **Working copy** alias with agents tree

## Impact

- **Primary files**: new `lib/skill-paths.mjs`; refactored `lib/index.mjs`, `lib/overlay-audit.mjs`, `lib/overlay-extract.mjs`, `lib/validate.mjs`
- **Secondary files**: `lib/sync.mjs`, `lib/overlay-static.mjs`, `lib/overlay-manifest.mjs`, `lib/overlay-model.mjs`, `lib/overlay-yaml.mjs`, `lib/overlay-pipeline.mjs` (re-export `getGitSkillPrefix` from skill-paths)
- **Skill types affected**:
  - **All skills**: canonical and overlay paths resolved through one module — behavior unchanged
  - **Customized skills (overlays)**: git prefix for audit/blended_ref validation uses skill-paths — same strings, single source
  - **Foreign/source skills**: extract `--from-agents` and `--from-commit` local tree selection explicit via skill-paths
  - **Local-only skills**: unaffected except shared path helpers
- **Dependencies**: Builds on completed overlay-pipeline split and upstream adapter; no new npm packages
- **Deferred**: validation layering split (#6) — validate still calls full audit; only path construction moves
