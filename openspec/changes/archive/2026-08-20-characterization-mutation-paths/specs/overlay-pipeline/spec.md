## ADDED Requirements

### Requirement: Static apply test seam

The static overlay apply path SHALL be unit-testable without reading the live overlay catalog or writing live canonical trees, by accepting injected overlay load and skill-directory resolvers (same pattern as audit/restore `deps`). Defaults MUST remain `loadOverlay`, catalog `findSkillByName`, and `getSkillDir`.

CLI scripts and `runUpdate` production defaults MUST still invoke static apply through the overlay pipeline public interface, not a second overlay loader.

#### Scenario: Injected overlay and skill dir

- **GIVEN** a unit test supplies `loadOverlayFn`, `findSkillFn`, and `getSkillDirFn` pointing at temporary directories
- **WHEN** `applyStaticOverlay` runs
- **THEN** it MUST apply static ops against those directories
- **AND** it MUST NOT read this repository’s live `overlays/<name>/OVERLAY.yaml` or live `skills/` tree

#### Scenario: Production defaults unchanged

- **GIVEN** `applyStaticOverlay` is called with only `{ dryRun }` (no loader overrides)
- **WHEN** static apply runs
- **THEN** it MUST use the current `loadOverlay` / `loadSkills` / `getSkillDir` production functions
