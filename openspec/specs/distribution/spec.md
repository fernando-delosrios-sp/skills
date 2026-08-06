# Distribution

## Purpose

Install and publish skills to agent environments via npx skills and local install commands.

## Requirements

### Requirement: npx skills compatibility

This repository SHALL remain installable via `npx skills add fernando-delosrios-sp/skills`.

#### Scenario: Public install from GitHub

- **GIVEN** a user runs `npx skills add fernando-delosrios-sp/skills`
- **WHEN** the command completes
- **THEN** the user MUST be able to select and install skills from this repository

### Requirement: Local install command

The repository SHALL provide `npm run install` to interactively install selected skills into the local agent environment.

#### Scenario: Maintainer local install

- **GIVEN** a maintainer clones the repo and runs `npm install && npm run install`
- **WHEN** they select skills by category
- **THEN** the chosen skills MUST be installed via `skills add . --skill <names>`

### Requirement: skills/ as install source of truth

Installation SHALL read from `skills/`, not from `.agents/skills/` working copies.

#### Scenario: Working copy differs from canonical

- **GIVEN** `.agents/skills/<name>/` differs from `skills/<category>/<name>/`
- **WHEN** a user installs from this repo
- **THEN** the installed content MUST come from `skills/`

### Requirement: Category-based selection

The install command SHALL prompt skills grouped by category manifest.

#### Scenario: Interactive install prompt

- **GIVEN** a maintainer runs `npm run install`
- **WHEN** the category checkbox prompt appears
- **THEN** skills MUST be grouped by their category directory

### Requirement: Changelog visibility

User-facing skill changes SHALL be reflected in CHANGELOG.md before distribution-relevant releases.

#### Scenario: New skill added

- **GIVEN** a new skill is added to the catalog
- **WHEN** the change is ready for users
- **THEN** CHANGELOG.md MUST document the addition
