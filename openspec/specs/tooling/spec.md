# Tooling

## Purpose

Provide CLI infrastructure in `lib/` and `scripts/` for maintainers to sync, validate, and manage skills.

## Requirements

### Requirement: Validate command

The repository SHALL provide `npm run validate` to check skills.json manifests, SKILL.md files, and overlays.

#### Scenario: Valid repository state

- **GIVEN** all manifests, skills, and overlays are well-formed
- **WHEN** `npm run validate` runs
- **THEN** it MUST exit with code 0

#### Scenario: Invalid manifest detected

- **GIVEN** a skills.json entry violates naming or structure rules
- **WHEN** `npm run validate` runs
- **THEN** it MUST exit non-zero and report the specific violation

### Requirement: Clean command

The repository SHALL provide `npm run clean` to prune stale clone caches and optional overlay apply manifests.

#### Scenario: Clean clone caches

- **GIVEN** stale `.tmp` clone caches exist from prior sync/import
- **WHEN** `npm run clean` runs
- **THEN** those caches MUST be removed

### Requirement: Extract overlay command

The repository SHALL provide `npm run extract-overlay` to draft overlay YAML from local customizations vs upstream.

#### Scenario: Draft overlay from agents working copy

- **GIVEN** a maintainer runs `npm run extract-overlay -- --skill git-commit --from-agents`
- **WHEN** extraction completes
- **THEN** a draft OVERLAY.yaml MUST be produced reflecting the diff

### Requirement: Script entry points

All maintainer commands SHALL be exposed as npm scripts delegating to `scripts/sync.mjs` or dedicated modules in `lib/`.

#### Scenario: Command discoverability

- **GIVEN** a maintainer reads package.json scripts
- **WHEN** they inspect available commands
- **THEN** sync, update, import, overlay, extract-overlay, clean, validate, and install MUST be listed

### Requirement: Node.js engine constraint

Tooling SHALL require Node.js >= 18 as declared in package.json engines.

#### Scenario: Unsupported Node version

- **GIVEN** Node.js version is below 18
- **WHEN** a maintainer runs any npm script
- **THEN** npm MUST warn or fail per engines policy
