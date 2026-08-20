## ADDED Requirements

### Requirement: Static overlay apply characterization

Static add, replace, and remove operations SHALL be unit-testable through `applyStaticOverlay` without mutating the live canonical catalog or live `overlays/` directory. `applyStaticOverlay` SHALL accept optional `loadOverlayFn`, `findSkillFn`, and `getSkillDirFn` that default to current production loaders. Tests MUST use a temporary skill directory and a temporary overlay directory with payloads under `files/`.

`dryRun: true` MUST NOT create or delete target files. A missing static `from` file MUST throw. If adding this seam requires a large overlay-discovery refactor, static characterization MAY be omitted and MUST be reported as blocked rather than inventing a second overlay loader.

#### Scenario: Static add writes payload

- **GIVEN** a temporary overlay with an add operation from `files/extra.md` whose payload is `hello`
- **AND** a temporary skill directory
- **WHEN** `applyStaticOverlay` runs with `dryRun: false` and injected path/overlay loaders
- **THEN** `extra.md` MUST exist in the skill directory with that payload

#### Scenario: Dry run does not write

- **GIVEN** the same add operation fixture
- **WHEN** `applyStaticOverlay` runs with `dryRun: true`
- **THEN** `extra.md` MUST NOT be created in the skill directory

#### Scenario: Static remove deletes a file

- **GIVEN** a temporary skill directory containing a file named in a remove operation
- **WHEN** `applyStaticOverlay` runs with `dryRun: false`
- **THEN** that file MUST be gone

#### Scenario: Missing static source throws

- **GIVEN** an add or replace operation whose `from` path does not exist under the overlay directory
- **WHEN** `applyStaticOverlay` runs
- **THEN** it MUST throw
