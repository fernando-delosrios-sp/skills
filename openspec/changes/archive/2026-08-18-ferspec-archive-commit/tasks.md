## 1. ferspec bundle — archive commit documentation

- [x] 1.1 Expand ferspec README § Archive with sub-steps A (sync/move), B (commit), C (post-commit gate)
- [x] 1.2 Bump ferspec bundle VERSION to 1.1.0; update README current bundle line
- [x] 1.3 Update INSTALL.md git-commit row to include archive phase
- [x] 1.4 Update UPDATE.md to refresh `operations.archive` on config update

## 2. Config and openspec-init template

- [x] 2.1 Add `operations.archive.guidance` to `openspec/config.yaml` (five strings)
- [x] 2.2 Add `operations.archive` block to `openspec-init/references/config.md` with ferspec note

## 3. Agent routing

- [x] 3.1 Add archive commit anti-pattern to ferspec AGENTS.md.fragment.md
- [x] 3.2 Sync fragment anti-pattern to root `AGENTS.md`
- [x] 3.3 Sync canonical bundle paths: `skills/engineering/openspec-init/schemas/ferspec/` and `.agents/skills/openspec-init/`

## 4. Verification

- [x] 4.1 Confirm canonical test command: `npm run validate`
- [x] 4.2 Run `openspec schema validate ferspec` — exit 0
- [x] 4.3 Delta spec scenarios documented (no new automated tests — schema/docs change only)

## 5. Documentation

- [x] 5.1 ferspec README archive section is user-facing documentation for this behavior
- [x] 5.2 openspec-init config.md documents operations.archive for new projects
- [x] 5.3 No API/CLI code changes — inline docs N/A

## 6. Changelog

- [ ] 6.1 Create or update CHANGELOG.md entry for ferspec 1.1.0 archive commit guidance
- [ ] 6.2 Confirm entry covers archive commit requirement and config `operations.archive`
