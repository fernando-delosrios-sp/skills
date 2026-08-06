## MODIFIED Requirements

### Requirement: Extract overlay command

The repository SHALL provide `npm run extract-overlay` to draft overlay YAML from local customizations vs upstream. Extract MUST skip generator-managed paths using `overlay-yaml.mjs` helpers (`isGeneratedPathForSkill`, `expectedContentForPath`) so drafts do not treat generator outputs as manual customizations. Local tree selection for extraction MUST resolve through `lib/skill-paths.mjs` — canonical tree by default, agents tree when `--from-agents` is set.

#### Scenario: Draft overlay from agents working copy

- **GIVEN** a maintainer runs `npm run extract-overlay -- --skill git-commit --from-agents`
- **WHEN** extraction completes
- **THEN** a draft OVERLAY.yaml MUST be produced reflecting the diff minus generator-managed paths
- **AND** the local side of the diff MUST be read from `agentsDir` returned by skill-paths

#### Scenario: Generator output absent upstream skipped

- **GIVEN** a generator declares `file: agents/openai.yaml`
- **AND** upstream has no such file but local canonical tree does
- **WHEN** extract runs for that skill
- **THEN** the draft overlay MUST NOT add a static payload for that path solely because it is local-only

#### Scenario: Extract from commit uses gitPrefix

- **GIVEN** a maintainer runs `npm run extract-overlay -- --skill git-commit --from-commit HEAD`
- **WHEN** extraction reads local files from git history
- **THEN** it MUST use `gitPrefix` from skill-paths as the tree prefix in the local repository

## ADDED Requirements

### Requirement: Validate uses skill-paths for directory checks

The validate command SHALL resolve indexed skill directories and orphan detection paths via skill-paths rather than inline `resolve(skillsRoot, category, name)` construction.

#### Scenario: Missing SKILL.md error references canonicalDir

- **GIVEN** a skill is listed in skills.json but its canonical tree lacks SKILL.md
- **WHEN** `npm run validate` runs
- **THEN** the error message MUST reference the path from skill-paths `getCanonicalDir`
