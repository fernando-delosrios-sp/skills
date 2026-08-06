## ADDED Requirements

### Requirement: Generator resolution authority

Generator merge resolution for overlay apply, manifest preparation, validation, and extract SHALL use `lib/overlay-yaml.mjs` as the single authority. No overlay lifecycle module SHALL import generator resolution from a module that imports back from the same lifecycle branch.

#### Scenario: Universal defaults merged with per-skill overrides

- **GIVEN** universal generators are declared in `overlays/OVERLAY.yaml`
- **AND** a per-skill overlay declares `generators.add` or `generators.disable`
- **WHEN** any overlay workflow needs the effective generator list
- **THEN** it MUST obtain the list via `resolveGeneratorsForSkill` from `overlay-yaml.mjs`

#### Scenario: No generator-config ↔ extract cycle

- **WHEN** Node.js loads `overlay-extract.mjs` and `overlay-yaml.mjs` at startup
- **THEN** the module graph MUST NOT contain a static import cycle between extract and generator-config

### Requirement: Extract excludes generator-managed paths

Overlay extract SHALL omit generator output paths from draft semantic or static overlay changes when those paths are fully explained by generator configuration and deterministic derivation rules.

#### Scenario: Generated openai manifest not extracted as semantic change

- **GIVEN** the only local difference for `agents/openai.yaml` matches frontmatter-derived content per universal generator rules
- **WHEN** `npm run extract-overlay` runs for that skill
- **THEN** the draft overlay MUST NOT include a semantic change for `agents/openai.yaml`
