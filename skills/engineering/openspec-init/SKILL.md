---
name: openspec-init
description: Initialize an OpenSpec project with schemas and configuration
---

# openspec-init

You are an expert AI agent setting up OpenSpec for a user's repository. Follow these phases sequentially to ensure a successful initialization.

## Phase 1: Setup & Initialization
1. **Check Requirements**: Verify if the `openspec` CLI is available (e.g. via `npx openspec` or globally). If it is not installed, install it using `npm install -D openspec` (for Node.js projects) or `npm install -g openspec`, depending on the project setup.
2. **Initialize OpenSpec**: Run `openspec init` (or `npx openspec init`). During this process, ask the user to select their preferred AI tools (e.g., Cursor, Windsurf, Claude, etc.) if they aren't automatically inferred.

## Phase 2: Schema Selection & Installation
1. **List Schemas**: List the available default schemas from this skill's `schemas/` directory (e.g., `behaviour-driven`, `event-driven`, `intent-driven`, `minimalist`, `rapid`, `spec-driven`, `spec-driven-with-adr`, `superpowers-bridge`).
2. **Select Schema**: Ask the user to choose one of the available schemas.
3. **Copy Schema**: Once selected, copy the chosen schema's directory from the skill's `schemas/` folder to the target repository's `openspec/schemas/` directory.
4. **Validate**: Run `openspec schema validate <schema-name>` (or `npx openspec schema validate <schema-name>`) to ensure the schema is correctly installed and valid. If validation fails, attempt to fix the error or ask the user for guidance.

## Phase 3: Schema Instructions
1. Check if an `INSTALL.md` file exists in the copied schema directory (e.g., `openspec/schemas/<schema-name>/INSTALL.md`).
2. If it exists, carefully read and follow all instructions provided within it.

## Phase 4: Configuration
1. Build the OpenSpec configuration file at `openspec/config.yaml`.
2. Follow the detailed instructions in this skill's `references/config.md` to properly structure the configuration, paying special attention to the `schema`, `context`, and `rules` sections, and organizing the specs by domain.

## Phase 5: Recommended Skills Installation
1. To ensure the user has the required behavioral skills for OpenSpec, ask the user to install the recommended skills from the central repository.
2. Run or suggest running the following commands (or use `npm run import` if in a skills repository):
   - `npx skills add fernando-delosrios-sp/skills --skill c4-diagram`
   - `npx skills add fernando-delosrios-sp/skills --skill gherkin-authoring`
   - `npx skills add fernando-delosrios-sp/skills --skill changelog-generator`
   - `npx skills add fernando-delosrios-sp/skills --skill openspec-git-discipline`