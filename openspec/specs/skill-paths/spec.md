# Skill Paths

## Purpose

Centralize on-disk and git-relative path resolution for skill records across canonical, agents, overlay, and git-prefix locations.

## Requirements

### Requirement: Central skill path resolution module

The repository SHALL provide `lib/skill-paths.mjs` as the single authority for resolving on-disk and git-relative paths for a skill record. Given a skill object with `name` and `category`, the module MUST expose `resolveSkillPaths(skill)` returning `{ canonicalDir, agentsDir, overlayDir, gitPrefix }`.

#### Scenario: Canonical directory resolution

- **GIVEN** a skill record `{ name: "git-commit", category: "engineering" }`
- **WHEN** `resolveSkillPaths(skill)` is called
- **THEN** `canonicalDir` MUST equal `<repo-root>/skills/engineering/git-commit`

#### Scenario: Agents dev tree resolution

- **GIVEN** a skill record `{ name: "git-commit", category: "engineering" }`
- **WHEN** `resolveSkillPaths(skill)` is called
- **THEN** `agentsDir` MUST equal `<repo-root>/.agents/skills/git-commit`
- **AND** MUST NOT include the category segment in the path

#### Scenario: Overlay directory resolution

- **GIVEN** a skill record `{ name: "git-commit", category: "engineering" }`
- **WHEN** `resolveSkillPaths(skill)` is called
- **THEN** `overlayDir` MUST equal `<repo-root>/overlays/git-commit`

#### Scenario: Git prefix resolution

- **GIVEN** a skill record `{ name: "git-commit", category: "engineering" }`
- **WHEN** `resolveSkillPaths(skill)` is called
- **THEN** `gitPrefix` MUST equal `skills/engineering/git-commit`
- **AND** MUST use forward slashes regardless of host OS

### Requirement: Named convenience exports

The skill-paths module SHALL export individual helpers that delegate to `resolveSkillPaths`: `getCanonicalDir(skill)`, `getAgentsDir(skill)`, `getOverlayDir(skillName)`, and `getGitSkillPrefix(skill)`.

#### Scenario: Backward-compatible getSkillDir equivalent

- **GIVEN** `lib/index.mjs` re-exports `getSkillDir` for existing call sites
- **WHEN** `getSkillDir(skill)` is called
- **THEN** it MUST return the same path as `getCanonicalDir(skill)` from skill-paths

#### Scenario: Overlay dir by skill name only

- **GIVEN** overlay directories are keyed by skill name, not category
- **WHEN** `getOverlayDir("git-commit")` is called
- **THEN** it MUST return `<repo-root>/overlays/git-commit` without requiring a category

### Requirement: Pure path resolution

The skill-paths module MUST NOT perform filesystem I/O, git operations, or manifest loading. It SHALL accept skill records and repository root constants only.

#### Scenario: Unit testable without filesystem

- **GIVEN** a unit test passes a skill record object
- **WHEN** any skill-paths export is called
- **THEN** the result MUST be deterministic string paths with no side effects

#### Scenario: No duplicate path templates elsewhere

- **WHEN** a maintainer greps `lib/` for inline templates `skills/${` or `.agents/skills/`
- **THEN** matches MUST appear only in `lib/skill-paths.mjs` (excluding test fixtures)
