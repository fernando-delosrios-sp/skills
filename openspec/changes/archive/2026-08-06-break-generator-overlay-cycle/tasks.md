## 1. Overlay YAML module

- [x] 1.1 Create `lib/overlay-yaml.mjs` with `loadGlobalOverlay`, `loadOverlay`, `hasOverlay`, `partitionChanges`, and generator validation helpers moved from `generator-config.mjs` / `overlay-model.mjs`
- [x] 1.2 Implement `resolveGeneratorsForSkill`, `getGeneratedPathsForSkill`, and `isGeneratedPathForSkill` in `overlay-yaml.mjs`
- [x] 1.3 Implement `expectedContentForPath` for `openai-manifest` → `agents/openai.yaml` using SKILL.md frontmatter rules from `overlays/OVERLAY.yaml`
- [x] 1.4 Refactor `lib/overlay-model.mjs` to delegate YAML load/partition/hasOverlay to `overlay-yaml.mjs` (keep discovery and hashing in model)

## 2. Decouple consumers

- [x] 2.1 Slim `lib/generator-config.mjs` to validation + thin re-exports delegating resolution to `overlay-yaml.mjs`
- [x] 2.2 Update `lib/overlay-manifest.mjs` to import `resolveGeneratorsForSkill` from `overlay-yaml.mjs` instead of `generator-config.mjs`
- [x] 2.3 Replace dynamic `import('./generator-config.mjs')` in `lib/overlay-extract.mjs` with static imports from `overlay-yaml.mjs`
- [x] 2.4 Update `lib/validate.mjs` and any other call sites still importing generator resolution from `generator-config.mjs`

## 3. Tests

- [x] 3.1 Add `test/overlay-yaml.test.mjs` covering generator merge (global, disable, add), path classification, and openai-manifest derivation
- [x] 3.2 Add or extend extract tests verifying generator paths are skipped and modify diffs matching derived content are omitted
- [x] 3.3 Verify no static import cycle: overlay-yaml must not import extract, manifest, audit, or generator-config

## 4. Documentation and validation

- [x] 4.1 Update `AGENTS.md` module layout to document `overlay-yaml.mjs` and revised generator-config role
- [x] 4.2 Add **Generator** term to `openspec/specs/ubiquitous-language/spec.md` (via archive) and note extract skip behavior in README overlay section if user-visible
- [x] 4.3 Run `npm run validate` and full test suite; confirm extract/manifest/prepare behavior unchanged for non-generator paths
