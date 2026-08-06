## 1. Create upstream adapter module

- [x] 1.1 Create `lib/upstream-adapter.mjs` with private `normalizeRepoUrl(repoRef)` handling `owner/repo`, HTTPS, and `git@` forms
- [x] 1.2 Implement `cloneRepo(repoRef, destDir, options?)` — shallow clone with 60s timeout, mkdir dest, `git clone --depth 1`
- [x] 1.3 Implement `readSkillTree(rootDir, { skillPath, fs }?)` — recursive walk skipping `.git`, return `{ relPath, content }[]` relative to skill root
- [x] 1.4 Implement `getHeadSha(cloneDir)` — `git rev-parse HEAD` wrapper
- [x] 1.5 Add module header comment documenting the three-function public interface and filesystem injection for tests

## 2. Unit tests

- [x] 2.1 Create `test/upstream-adapter.test.mjs` following existing test layout (`test/overlay-pipeline.test.mjs`)
- [x] 2.2 Test URL normalization: `owner/repo`, HTTPS with/without `.git`, `git@` form
- [x] 2.3 Test `readSkillTree` with injected in-memory fs fixture — verify `{ relPath, content }[]` and `.git` skip
- [x] 2.4 Wire test script in `package.json` if not already covered by existing test runner

## 3. Refactor sync.mjs

- [x] 3.1 Replace local `shallowClone`, `collectFiles`, and `getUpstreamSha` with imports from `upstream-adapter.mjs`
- [x] 3.2 Update `writeUpstreamToLocal` to consume `{ relPath, content }[]` instead of absolute paths
- [x] 3.3 Confirm lock SHA recording still uses `getHeadSha` result unchanged

## 4. Refactor import.mjs

- [x] 4.1 Replace local `shallowClone` with `cloneRepo` from upstream adapter
- [x] 4.2 Remove duplicate URL normalization logic from import module
- [x] 4.3 Confirm `discoverSkillPaths` clone walk behavior unchanged

## 5. Refactor overlay-extract.mjs

- [x] 5.1 Replace upstream `shallowClone` with `cloneRepo` from upstream adapter
- [x] 5.2 Replace upstream-facing `collectFiles` usage with `readSkillTree` from adapter
- [x] 5.3 Keep local git helpers (`gitShow`, `gitLsTree`, `collectFilesFromGitRef`) in extract — out of scope per design
- [x] 5.4 Confirm extract diff output unchanged for upstream clone path

## 6. Verification and cleanup

- [x] 6.1 Grep `lib/` for remaining `shallowClone` and inline `git clone` — zero matches outside `upstream-adapter.mjs`
- [x] 6.2 Confirm `overlay-model.mjs` private `collectFiles` retained for local overlay file hashing
- [x] 6.3 Run `npm run validate` and confirm exit code 0
- [x] 6.4 Run unit tests (`npm test` or equivalent) and confirm all pass

## 7. Documentation

- [x] 7.1 Update `AGENTS.md` Layout section to list `lib/upstream-adapter.mjs` and note sync/import/extract dependency
- [x] 7.2 No README.md update required — no user-facing CLI or workflow change
- [x] 7.3 Add CHANGELOG.md entry noting internal upstream adapter consolidation (use `changelog-generator` skill)
