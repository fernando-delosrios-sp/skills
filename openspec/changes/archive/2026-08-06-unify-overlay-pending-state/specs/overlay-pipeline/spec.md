## ADDED Requirements

### Requirement: Unified pending apply entry point

The overlay pipeline SHALL expose `isPendingApply(skillName)` as the single authority for whether a skill needs semantic overlay apply or first-time blend. The function MUST derive pending state from overlay route via `auditSkill` and `isOverlayRoutePending` — not from lock timestamps.

Call sites that need pending detection (`lib/sync.mjs`, `lib/tmp.mjs`, and future orchestrators) MUST use `isPendingApply` instead of timestamp heuristics or direct lock inspection.

#### Scenario: Pending when route is fresh

- **GIVEN** a source skill with a per-skill overlay and lock entry where `overlay_applied_at` is null
- **WHEN** `isPendingApply(skillName)` is called
- **THEN** it MUST return `true`
- **AND** the underlying audit route MUST be `fresh`

#### Scenario: Pending when route is remerge

- **GIVEN** a source skill with overlay or generators where upstream or overlay inputs changed since last blend
- **WHEN** `isPendingApply(skillName)` is called
- **THEN** it MUST return `true`
- **AND** the underlying audit route MUST be `remerge`

#### Scenario: Not pending when route is restore or none

- **GIVEN** a source skill where audit route is `restore` or `none`
- **WHEN** `isPendingApply(skillName)` is called
- **THEN** it MUST return `false`

#### Scenario: Sync uses pipeline pending check

- **GIVEN** sync finds unchanged upstream SHA for a source skill
- **WHEN** it sets the `overlayPending` flag on the result
- **THEN** it MUST call `isPendingApply` from the overlay pipeline
- **AND** it MUST NOT call `isOverlayPending` or compare lock timestamps directly

#### Scenario: Tmp cleanup uses pipeline pending check

- **GIVEN** `cleanOverlayApplyManifests` runs with `appliedManifestsOnly: true`
- **WHEN** deciding whether to remove a manifest for a skill
- **THEN** it MUST skip removal when `isPendingApply(skillName)` returns `true`
- **AND** it MUST NOT use timestamp-based pending heuristics

#### Scenario: Testable without git checkout

- **GIVEN** a unit test injects mocked lock entries and hash values via `deps`
- **WHEN** `isPendingApply(skillName, deps)` is called
- **THEN** it MUST return the correct boolean without executing git operations
