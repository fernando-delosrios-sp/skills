## ADDED Requirements

### Requirement: Sync write characterization

The repository SHALL provide unit tests that apply a `pending_update` Sync result onto a temporary skill directory via `applySyncResult`. Those tests MUST write and delete real files on that tree and MUST update the in-memory lock entry SHA and `synced_at`. They MUST NOT clone GitHub or write the live canonical catalog or `.locks/upstream.json`.

#### Scenario: Pending update writes files and deletes orphans

- **GIVEN** a temporary `localSkillDir` containing `keep.md` and `orphan.md`
- **AND** a `pending_update` result whose `upstreamFiles` include `keep.md` with new content and a nested path
- **WHEN** `applySyncResult` runs against that result and an in-memory locks object
- **THEN** `keep.md` MUST contain the upstream content
- **AND** the nested file MUST exist
- **AND** `orphan.md` MUST be gone
- **AND** `locks[skill].sha` MUST equal `result.upstreamSha`

#### Scenario: Non-pending status is a no-op

- **GIVEN** a Sync result whose status is not `pending_update`
- **WHEN** `applySyncResult` runs
- **THEN** the skill directory MUST be unchanged
- **AND** the locks object MUST be unchanged

### Requirement: Import copy characterization

`copySkillDir` SHALL be a named export. Unit tests MUST copy skill files onto a temporary destination and MUST omit git metadata (`.git` and other `GIT_EXCLUDES` names). Tests MUST NOT clone GitHub.

When `doImport` is tested, it SHALL accept optional injectable `cwd` / `loadSkills` / `saveSkills` defaulting to current production behavior. If those cannot be injected without rewriting `lib/index.mjs`, tests MAY skip `doImport` and still MUST cover `copySkillDir`.

#### Scenario: Copy excludes git metadata

- **GIVEN** a source tree with `SKILL.md` and `.git/config`
- **WHEN** `copySkillDir` copies that tree to a temporary destination
- **THEN** the destination MUST contain `SKILL.md`
- **AND** the destination MUST NOT contain `.git`

#### Scenario: Duplicate import name errors without live catalog write

- **GIVEN** `doImport` is testable via injected loaders
- **AND** the existing names set already contains the upstream skill name
- **WHEN** `doImport` runs
- **THEN** it MUST return an error naming the duplicate
- **AND** it MUST NOT write this repository’s live `skills/` catalog

### Requirement: Update orchestrator test seam

`runUpdate` SHALL accept an optional `deps` bag for `syncAllSkills`, `applyStaticOverlays`, `hasOverlay`, `auditAllSkills`, `restoreAllSkills`, `prepareOverlays`, `printSyncSummary`, and `printOverlayApplyPrompt`. Omitted functions MUST default to the current production imports. Production callers that omit `deps` MUST still invoke the real overlay pipeline (sync → static → audit → restore → prepare with `runStatic: false`). Console `kleur` output MUST remain.

#### Scenario: Default happy path call order

- **GIVEN** injected `deps` that record invocation order
- **AND** `dryRun` is false, `skipSync` is false, and `skipPrepare` is false
- **WHEN** `runUpdate` runs
- **THEN** the recorded order MUST include sync, then static overlay, then audit, then restore, then prepare with `runStatic: false`

#### Scenario: Dry run skips audit restore and prepare

- **GIVEN** injected `deps`
- **AND** `dryRun` is true
- **WHEN** `runUpdate` runs
- **THEN** sync and static overlay MUST be called with `{ dryRun: true }`
- **AND** audit, restore, and prepare MUST NOT be called

#### Scenario: Skip sync still runs static overlay

- **GIVEN** injected `deps`
- **AND** `skipSync` is true
- **WHEN** `runUpdate` runs
- **THEN** sync MUST NOT be called
- **AND** static overlay MUST still be called
