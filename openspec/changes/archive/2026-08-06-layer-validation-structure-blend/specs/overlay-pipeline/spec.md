## ADDED Requirements

### Requirement: Structure-only overlay validation

`validateOverlays(skills)` in the overlay pipeline SHALL perform structural overlay checks only: overlay-to-skill name matching, YAML load/validate, static source file existence, unknown action detection, empty overlay warnings, and orphan overlay directory detection. It MUST NOT call `auditSkill`, `getLockEntry`, or emit route/`blended_ref` warnings.

Blend-state overlay warnings MUST be produced exclusively by `validateBlendState()` in `lib/validate.mjs`.

#### Scenario: validateOverlays does not audit routes

- **GIVEN** a source skill with a lock entry and pending remerge route
- **WHEN** `validateOverlays(skills)` runs
- **THEN** it MUST NOT emit warnings about pending route or `blended_ref`
- **AND** it MUST NOT call `auditSkill`

#### Scenario: Structural overlay errors still reported

- **GIVEN** an overlay references a static source file that does not exist
- **WHEN** `validateOverlays(skills)` runs
- **THEN** it MUST emit a structure error for the missing static source

#### Scenario: Orphan overlay directory warning

- **GIVEN** a directory under `overlays/` has no matching skill and no `OVERLAY.yaml`
- **WHEN** `validateOverlays(skills)` runs
- **THEN** it MUST emit a structure warning for the orphan directory
