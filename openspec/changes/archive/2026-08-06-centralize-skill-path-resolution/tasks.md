## 1. Create skill-paths module

- [x] 1.1 Create `lib/skill-paths.mjs` with independent `ROOT` / `SKILLS_ROOT` constants (same `fileURLToPath` pattern as `index.mjs`)
- [x] 1.2 Implement `resolveSkillPaths(skill)` returning `{ canonicalDir, agentsDir, overlayDir, gitPrefix }`
- [x] 1.3 Export convenience helpers: `getCanonicalDir`, `getAgentsDir`, `getOverlayDir`, `getGitSkillPrefix`
- [x] 1.4 Add module header comment documenting pure path resolution (no fs/git I/O)

## 2. Unit tests

- [x] 2.1 Create `test/skill-paths.test.mjs` following existing test layout
- [x] 2.2 Test `resolveSkillPaths` for a fixture skill — verify all four path values
- [x] 2.3 Test agents tree is flat (name only, no category segment)
- [x] 2.4 Test `gitPrefix` uses forward slashes on all platforms
- [x] 2.5 Test `getOverlayDir` accepts skill name without full record

## 3. Migrate index.mjs re-exports

- [x] 3.1 Replace inline `getSkillDir` / `getOverlayDir` in `lib/index.mjs` with re-exports from skill-paths
- [x] 3.2 Confirm existing imports from `./index.mjs` continue to work unchanged

## 4. Migrate overlay and validate call sites

- [x] 4.1 Update `lib/overlay-audit.mjs` — import `getGitSkillPrefix` from skill-paths; remove local function
- [x] 4.2 Update `lib/overlay-extract.mjs` — replace `resolveLocalFiles` inline paths with skill-paths (`canonicalDir`, `agentsDir`, `gitPrefix`)
- [x] 4.3 Update `lib/validate.mjs` — replace inline `resolve(skillsRoot, category, name)` with `getCanonicalDir`
- [x] 4.4 Update `lib/overlay-yaml.mjs`, `lib/overlay-model.mjs` — import `getOverlayDir` from skill-paths
- [x] 4.5 Update `lib/overlay-static.mjs`, `lib/overlay-manifest.mjs`, `lib/sync.mjs` — use skill-paths directly or via index re-export
- [x] 4.6 Update `lib/overlay-pipeline.mjs` — re-export `getGitSkillPrefix` from skill-paths instead of overlay-audit

## 5. Verification and cleanup

- [x] 5.1 Grep `lib/` for duplicate path templates (`.agents/skills/`, `` `skills/${``, private `getGitSkillPrefix`) — zero matches outside `skill-paths.mjs`
- [x] 5.2 Run unit tests (`npm test` or equivalent) and confirm all pass
- [x] 5.3 Run `npm run validate` and confirm exit code 0
- [x] 5.4 Smoke-test `npm run extract-overlay -- --help` — no regression

## 6. Documentation

- [x] 6.1 Update `AGENTS.md` Layout section to list `lib/skill-paths.mjs` and note path resolution dependency for overlay/validate modules
- [x] 6.2 No README.md update required — no user-facing CLI or workflow change
- [x] 6.3 Add CHANGELOG.md entry noting internal skill-paths centralization (use `changelog-generator` skill)
