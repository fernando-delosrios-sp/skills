## MODIFIED Requirements

### Requirement: Extract overlay command

The repository SHALL provide `npm run extract-overlay` to draft overlay YAML from local customizations vs upstream. Extract MUST skip generator-managed paths using `overlay-yaml.mjs` helpers (`isGeneratedPathForSkill`, `expectedContentForPath`) so drafts do not treat generator outputs as manual customizations.

#### Scenario: Draft overlay from agents working copy

- **GIVEN** a maintainer runs `npm run extract-overlay -- --skill git-commit --from-agents`
- **WHEN** extraction completes
- **THEN** a draft OVERLAY.yaml MUST be produced reflecting the diff minus generator-managed paths

#### Scenario: Generator output absent upstream skipped

- **GIVEN** a generator declares `file: agents/openai.yaml`
- **AND** upstream has no such file but local canonical tree does
- **WHEN** extract runs for that skill
- **THEN** the draft overlay MUST NOT add a static payload for that path solely because it is local-only
