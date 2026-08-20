## ADDED Requirements

### Requirement: Install prompt packages are direct dependencies

The repository SHALL declare `@inquirer/core`, `@inquirer/ansi`, and `@inquirer/figures` as Direct dependencies in `package.json` so the Install category checkbox prompt (`lib/category-checkbox-prompt.mjs`) resolves after a fresh `npm install`. The `skills` npm package MUST remain a Direct dependency. `@clack/prompts`, `@inquirer/prompts`, `prompts`, and `simple-git` MUST NOT be Direct dependencies.

#### Scenario: Prompt modules listed as direct dependencies

- **GIVEN** a maintainer inspects `package.json` `dependencies`
- **WHEN** they look up packages imported by the Install category checkbox prompt
- **THEN** `@inquirer/core`, `@inquirer/ansi`, and `@inquirer/figures` MUST each be listed
- **AND** `skills` MUST be listed

#### Scenario: Unused prompt and git packages omitted

- **GIVEN** a maintainer inspects `package.json` `dependencies`
- **WHEN** they look for unused prompt and git libraries
- **THEN** `@clack/prompts`, `@inquirer/prompts`, `prompts`, and `simple-git` MUST NOT be listed

#### Scenario: Category checkbox prompt module loads

- **GIVEN** production dependencies have been installed
- **WHEN** the Install category checkbox prompt module is imported
- **THEN** the import MUST succeed
- **AND** interactive `npm run install` MUST NOT be required as a non-TTY verification gate
