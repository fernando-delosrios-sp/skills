## ADDED Requirements

### Requirement: Audit git prefix via skill-paths

The overlay audit pipeline SHALL resolve `git_skill_path` and blended-ref validation paths via `getGitSkillPrefix` from `lib/skill-paths.mjs`. `lib/overlay-audit.mjs` MUST NOT define a private git prefix helper.

#### Scenario: Audit result includes skill-paths git prefix

- **GIVEN** a source skill with category and name
- **WHEN** `auditSkill(skillName)` runs
- **THEN** the result `git_skill_path` MUST equal `getGitSkillPrefix(skill)` from skill-paths

#### Scenario: Blended ref validation uses git prefix

- **GIVEN** a lock entry with `blended_ref` for a source skill
- **WHEN** `isBlendedRefValid(blendedRef, skill)` runs
- **THEN** it MUST validate `${gitPrefix}/SKILL.md` where `gitPrefix` comes from skill-paths

### Requirement: Extract local tree via skill-paths

The extract submodule SHALL select the local skill tree for diffing via skill-paths: `canonicalDir` by default, `agentsDir` when `fromAgents` is true, and `gitPrefix` when `fromCommit` is set.

#### Scenario: Default extract reads canonical tree

- **GIVEN** extract runs without `--from-agents` or `--from-commit`
- **WHEN** local files are collected for diffing
- **THEN** the root directory MUST be `getCanonicalDir(skill)` from skill-paths

#### Scenario: From-agents extract reads agents tree

- **GIVEN** extract runs with `fromAgents: true`
- **WHEN** local files are collected for diffing
- **THEN** the root directory MUST be `getAgentsDir(skill)` from skill-paths
