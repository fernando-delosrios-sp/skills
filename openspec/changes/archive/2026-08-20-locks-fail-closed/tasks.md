## 1. Fail-closed load

- [x] 1.1 Confirm production `loadLocks` is not already fail-closed; if it is, STOP and reject this plan
- [x] 1.2 Split `loadLocks` so `ENOENT` returns `{}` and other `readFile` errors rethrow; do not relocate `ROOT`; do not change `saveLocks`
- [x] 1.3 Export `parseLocksJson(raw)` used after a successful read; throw when JSON is invalid or not a non-null object; error message MUST include the lock path and `invalid JSON` and MUST NOT include file contents
- [x] 1.4 Export `loadLocksFromPath(path)` (or equivalent) so missing-file tests can use `mkdtemp` without monkey-patching `readFile`
- [x] 1.5 Run `node --test test/locks.test.mjs` (existing tests still pass)

## 2. Lock load tests

- [x] 2.1 In `test/locks.test.mjs`, after existing `describe('getOverlayRoute')`, add cases: `parseLocksJson('{"a":{}}')` returns `{ a: {} }`; invalid JSON (`'{'`) throws; `'[]'` throws; missing path under `mkdtemp` returns `{}`
- [x] 2.2 Do not `writeFile` or `saveLocks` against repo `.locks/upstream.json`; do not weaken the committed overlay lock integration test
- [x] 2.3 Run `node --test test/locks.test.mjs` (all pass)

## 3. Verification

- [x] 3.1 Confirm canonical test command: `npm test` (exit 0)
- [x] 3.2 Run `npm run validate` (exit 0)
- [x] 3.3 Confirm every `#### Scenario:` in this change’s delta specs has a named test (overlay “corrupt lock does not masquerade as never-applied” is covered by fail-closed load tests; glossary scenarios archive with the UL delta)
- [x] 3.4 Confirm `git diff -- .locks` is empty

## 4. Documentation

- [x] 4.1 No README/CLI user-facing changes (proposal: maintainer load semantics only)
- [x] 4.2 Set plan 003 status to DONE in `plans/README.md`
- [x] 4.3 Add brief JSDoc on `parseLocksJson` / `loadLocksFromPath` if exported; no API connector docs

## 5. Changelog

- [x] 5.1 Create or update changelog entry for this change via **changelog-generator**
- [x] 5.2 Confirm the entry states corrupt `.locks/upstream.json` now fails load instead of resetting blend metadata, and a missing file still loads as empty
