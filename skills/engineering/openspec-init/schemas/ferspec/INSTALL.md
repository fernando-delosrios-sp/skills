# ferspec Installation

Setup for the **ferspec** OpenSpec schema in a target project.

## 1. Copy the schema

```bash
mkdir -p ~/your-project/openspec/schemas
npx --yes degit fernando-delosrios-sp/skills/skills/engineering/openspec-init/schemas/ferspec ~/your-project/openspec/schemas/ferspec
cd ~/your-project
openspec schema validate ferspec
openspec schemas   # confirm ferspec is listed
```

If the project has no `openspec/` directory, run `openspec init` first.

## 2. Insert workflow routing

Check the project root for agent config:

- **Cursor / Codex / OpenCode**: `AGENTS.md`
- **Claude**: `CLAUDE.md`

When a file exists:

1. Ask the user for permission to append the routing fragment.
2. Read `openspec/schemas/ferspec/templates/adopters/AGENTS.md.fragment.md`.
3. Append as a new section at the end.

## 3. Install skills

Install from [fernando-delosrios-sp/skills](https://github.com/fernando-delosrios-sp/skills).

**Ask the user before running any install commands.** Recommend the full bundle below — skills reference each other, and skipping dependencies degrades behavior even when the schema still runs.

```bash
npx skills add fernando-delosrios-sp/skills --skill grill-with-docs
npx skills add fernando-delosrios-sp/skills --skill grilling
npx skills add fernando-delosrios-sp/skills --skill domain-modeling
npx skills add fernando-delosrios-sp/skills --skill architecture-decision-records
npx skills add fernando-delosrios-sp/skills --skill gherkin-authoring
npx skills add fernando-delosrios-sp/skills --skill c4-diagram
npx skills add fernando-delosrios-sp/skills --skill git-commit
npx skills add fernando-delosrios-sp/skills --skill changelog-generator
npx skills add fernando-delosrios-sp/skills --skill tdd
npx skills add fernando-delosrios-sp/skills --skill codebase-design
npx skills add fernando-delosrios-sp/skills --skill code-review
npx skills add fernando-delosrios-sp/skills --skill apply-code-changes
```

| Skill | Phase | Invoked by |
|---|---|---|
| grill-with-docs | discovery | schema.yaml |
| grilling | discovery | grill-with-docs |
| domain-modeling | discovery | grill-with-docs; Language format |
| architecture-decision-records | discovery | domain-modeling; grill-with-docs ADR side effects |
| gherkin-authoring | specs | schema.yaml |
| c4-diagram | design | schema.yaml |
| git-commit | apply | schema.yaml |
| changelog-generator | tasks, apply | schema.yaml; git-commit |
| tdd | apply | schema.yaml |
| codebase-design | apply | tdd (seam / interface vocabulary) |
| code-review | apply | tdd (post-implementation review) |
| apply-code-changes | apply | schema.yaml |

If the user skips skills from this list, note which phases lose skill-backed behavior and which fallbacks apply.

**Optional — pre-change planning** (not part of the ferspec change lifecycle; install when multi-session planning happens before `/opsx:new`):

```bash
npx skills add fernando-delosrios-sp/skills --skill wayfinder
npx skills add fernando-delosrios-sp/skills --skill search
```

| Skill | Phase | Invoked by |
|---|---|---|
| wayfinder | pre-change | user; uses grilling + domain-modeling |
| search | pre-change | wayfinder research tickets (`/research` → investigate) |

## 4. Ubiquitous language spec

Confirm `openspec/specs/ubiquitous-language/spec.md` exists (created during `openspec init` or first specs phase). Discovery Language terms marked `promote` merge here at archive.

## 5. Verify

1. `openspec schema validate ferspec`
2. Installed skills appear in the agent's available skills list
3. New change: `/opsx:new test-ferspec --schema ferspec`
