## 1. Skill tree

- [x] 1.1 Add Canonical tree `skills/productivity/plain-and-simple/SKILL.md` with `name: plain-and-simple` and a model-invoked `description`; do not set `disable-model-invocation` (D1, D2, D3; covers: Skill directory contains SKILL.md; Description present without disable-model-invocation)
- [x] 1.2 Encode communication rules in that SKILL.md body: conclusion first; plain English; shortest complete answer with no word/sentence cap; all user-facing messages in scope; unchanged code blocks, exact errors, and full irreversible-action warnings; examples only when they clarify faster than more prose; minimal adaptive formatting; exact terms with a brief gloss only when unfamiliar; stop when complete; expand only when asked; no standing expansion footer (D3, D4; covers: Adaptive budget encoded in SKILL.md; Warnings and code stay complete; Optional examples; Formatting is adaptive not mandatory structure; Gloss is conditional; No expansion footer)
- [x] 1.3 Do not modify `skills/productivity/caveman/` (D1; covers: Caveman tree unchanged)

## 2. Catalog and generator

- [x] 2.1 Add `{ "name": "plain-and-simple" }` to `skills/productivity/skills.json` with no `source` block (D5; covers: Productivity manifest lists plain-and-simple without source)
- [x] 2.2 Write `skills/productivity/plain-and-simple/agents/openai.yaml` matching openai-manifest / `expectedContentForPath`: `interface.display_name` `Plain And Simple`; `interface.short_description` first sentence of the SKILL.md description; omit `policy` (D2, D5; covers: openai.yaml matches generator rules)
- [x] 2.3 Regenerate `.claude-plugin/marketplace.json` via `node lib/marketplace-manifest.mjs` so marketplace sync includes `./plain-and-simple`
- [x] 2.4 Add Term entries to `openspec/specs/ubiquitous-language/spec.md` for **plain-and-simple**, **shortest complete answer**, and **minimal adaptive formatting** matching the delta spec

## 3. Tests

- [x] 3.1 Add `test/plain-and-simple.test.mjs` named after spec scenarios: SKILL.md exists; frontmatter name/description and no `disable-model-invocation`; body phrases for conclusion-first, shortest complete answer, coverage/exceptions, optional examples, minimal adaptive formatting, gloss, no expansion footer, no fixed caps / always-bullets / always-headings; Manifest entry without `source`; `expectedContentForPath` matches committed openai.yaml; caveman files unchanged vs git HEAD for this change (D6; covers all `productivity-plain-and-simple` and `skill-catalog` scenarios except validate uniqueness)
- [x] 3.2 Assert glossary term headers exist in `openspec/specs/ubiquitous-language/spec.md`: `### Term: plain-and-simple`, `### Term: shortest complete answer`, `### Term: minimal adaptive formatting` (covers: plain-and-simple definition; shortest complete answer definition; minimal adaptive formatting definition)

## 4. Verification

- [x] 4.1 Confirm canonical test command: `npm test`
- [x] 4.2 Run `npm test` (exit 0)
- [x] 4.3 Run `npm run validate` (exit 0) — covers unique name and README catalog set equality (covers: Name remains unique)

## 5. Documentation

- [x] 5.1 Update README Categories productivity row to include `plain-and-simple` in alphabetical order with other Manifest names
- [x] 5.2 Confirm ubiquitous-language Term entries from 2.4 stay aligned with `specs/ubiquitous-language/spec.md` in this change
- [x] 5.3 No API / JSDoc / CLI `--help` changes (`lib/` and npm scripts are unchanged)

## 6. Changelog

- [x] 6.1 Create or update changelog entry for this change via **changelog-generator**
- [x] 6.2 Confirm the entry covers the new local-only `plain-and-simple` skill and catalog listing
