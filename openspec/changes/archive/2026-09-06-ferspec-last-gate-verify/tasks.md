## 1. Schema bundle

- [x] 1.1 Rewrite `skills/engineering/openspec-init/schemas/ferspec/schema.yaml` apply.instruction — single verify last gate; drop verify-aligned/verify-fix/openspec-verify-change
- [x] 1.2 Update README, INSTALL, UPDATE, AGENTS fragment, tasks template; bump VERSION to 1.2.0
- [x] 1.3 Mirror bundle to `openspec/schemas/ferspec/`

## 2. Config guidance

- [x] 2.1 Add `operations.apply.guidance` to `skills/engineering/openspec-init/references/config.md` template
- [x] 2.2 Add `operations.apply.guidance` to this repo `openspec/config.yaml`

## 3. apply-code-changes skill

- [x] 3.1 Merge steps 5–6 into one verify step; update description and change-adapters.md
- [x] 3.2 Mirror to `.agents/skills/apply-code-changes/`

## 4. Canonical spec

- [x] 4.1 Update `openspec/specs/ferspec-workflow/spec.md` per delta (apply last gate + apply guidance)

## 5. Verification

- [x] 5.1 Confirm canonical test command: `npm test`
- [x] 5.2 Update overlay-yaml description assertion if needed
- [x] 5.3 Run `npm test` and `npm run validate`

## 6. Documentation

- [x] 6.1 Update AGENTS.md fragment section if installed copy differs from template

## 7. Changelog

- [x] 7.1 Create changelog entry via changelog-generator
