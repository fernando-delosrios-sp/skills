## 1. Sync write characterization

- [x] 1.1 Add `test/sync-write.test.mjs` using `mkdtemp` under `os.tmpdir()` and `applySyncResult` with a `pending_update` result (tmp `localSkillDir` with `keep.md` + `orphan.md`; nested `upstreamFiles`)
- [x] 1.2 Assert overwrite, nested write, orphan delete, and lock `sha` / `synced_at`; assert non-`pending_update` is a no-op
- [x] 1.3 Export `writeUpstreamToLocal` only if 1.1 cannot drive writes through `applySyncResult`
- [x] 1.4 Run `node --test test/sync-write.test.mjs` (exit 0)

## 2. Import copy characterization

- [x] 2.1 Export `copySkillDir` from `lib/import.mjs`; add `test/import-copy.test.mjs` that copies `SKILL.md` and asserts dest has no `.git`
- [x] 2.2 If injectable without rewriting `lib/index.mjs`, add optional `doImport` deps (`cwd` / `loadSkills` / `saveSkills`) and a duplicate-name error case; otherwise skip `doImport` tests only
- [x] 2.3 Run `node --test test/import-copy.test.mjs` (exit 0)

## 3. Static overlay characterization

- [x] 3.1 Add optional `loadOverlayFn` / `findSkillFn` / `getSkillDirFn` to `applyStaticOverlay` defaulting to current loaders (STOP and skip 3.2–3.3 if this exceeds effort M)
- [x] 3.2 Add `test/overlay-static.test.mjs`: add writes payload; `dryRun: true` does not create; remove deletes; missing `from` throws
- [x] 3.3 Run `node --test test/overlay-static.test.mjs` (exit 0)

## 4. Update orchestrator characterization

- [x] 4.1 Add optional `deps` on `runUpdate` for pipeline functions listed in design D4; defaults remain current imports; keep `kleur` logs
- [x] 4.2 Add `test/run-update.test.mjs` with `mock.fn`: default order sync → static → audit → restore → prepare `{ runStatic: false }`; `dryRun` skips audit/restore/prepare; `skipSync` skips sync only
- [x] 4.3 Run `node --test test/run-update.test.mjs` (exit 0)

## 5. Verification

- [x] 5.1 Confirm canonical test command: `npm test` (exit 0, including the new files except any BLOCKED static file)
- [x] 5.2 Run `npm run validate -- --structure-only` (exit 0)
- [x] 5.3 Confirm `git diff -- skills .locks` is empty; revert if not
- [x] 5.4 Confirm every `#### Scenario:` in this change’s delta specs has a named test (or documented SKIP for `doImport` / static STOP)

## 6. Documentation

- [x] 6.1 No README/CLI user-facing changes (proposal: maintainer tests only)
- [x] 6.2 Set plan 002 status to DONE in `plans/README.md` (or BLOCKED with one-line reason if static STOP fired)
- [x] 6.3 No extra files outside the listed tests and lib exports/deps

## 7. Changelog

- [x] 7.1 Create or update changelog entry for this change via **changelog-generator**
- [x] 7.2 Confirm the entry states characterization tests cover Sync write, Import copy, static overlay (or BLOCKED), and Update order
