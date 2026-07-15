---
name: openspec-init
description: Use when the user asks to initialize, bootstrap, or set up an OpenSpec project. Sets up CLI, schemas, and config.
---

# openspec-init

## 1. Setup & Initialization

- **Check Requirements**: Verify if the `openspec` CLI is available. If not, install it using `npm install -D openspec` (for Node.js projects) or `npm install -g openspec`.
- **Initialize OpenSpec**: Run `openspec init` (or `npx openspec init`). Ask the user to select their preferred AI tools if they aren't automatically inferred. Stop and wait for their response before proceeding.
- **Completion Criterion**: The `openspec` CLI is available and `openspec init` has run.

## 2. Schema Selection & Installation

- **List Schemas**: List the available default schemas from this skill's `schemas/` directory (e.g., `behaviour-driven`, `event-driven`, `intent-driven`, `minimalist`, `rapid`, `spec-driven`, `spec-driven-with-adr`, `superpowers-bridge`).
- **Select Schema**: Ask the user to choose one of the available schemas. Stop and wait for their choice.
- **Copy Schema**: Copy the chosen schema's directory from `schemas/` to the target repository's `openspec/schemas/` directory.
- **Validate**: Run `openspec schema validate <schema-name>` (or `npx openspec schema validate <schema-name>`). If validation fails, attempt to fix the error or ask the user for guidance.
- **Completion Criterion**: The chosen schema directory exists in `openspec/schemas/` and validation passes.

## 3. Schema Instructions

- **Check Instructions**: Check for `INSTALL.md` in the copied schema directory (`openspec/schemas/<schema-name>/INSTALL.md`).
- **Execute Instructions**: If it exists, read and follow all instructions within it.
- **Completion Criterion**: All instructions in `INSTALL.md` are executed, or no `INSTALL.md` exists.

## 4. Configuration

- **Build Config**: Build the OpenSpec configuration file at `openspec/config.yaml`.
- **Apply Rules**: Load and follow the detailed instructions in `references/config.md` to properly structure the configuration. Ensure `schema`, `context`, and `rules` sections are populated and specs are organized by domain.
- **Completion Criterion**: `openspec/config.yaml` is fully structured according to `references/config.md`.

## 5. Initial Spec Generation

- **Discover Domains**: Analyze the project structure to infer logical domains (e.g., `api/`, `frontend/`, `auth/`). Ask the user to confirm or adjust these domains. Stop and wait for their response.
- **Pre-populate**: Create the confirmed domain subdirectories in `openspec/specs/` and generate an initial `spec.md` for each to kickstart the workflow.
- **Completion Criterion**: `openspec/specs/` contains at least one domain subdirectory with an initial `spec.md` file.

## 6. Recommended Skills Installation

- **Install Skills**: Ask the user for permission to install the required behavioral skills. Run (or suggest running) the following commands to get the skills from `fernando-delosrios-sp/skills`:
   - `npx skills add fernando-delosrios-sp/skills --skill c4-diagram`
   - `npx skills add fernando-delosrios-sp/skills --skill gherkin-authoring`
   - `npx skills add fernando-delosrios-sp/skills --skill changelog-generator`
   - `npx skills add fernando-delosrios-sp/skills --skill openspec-git-discipline`
- **Completion Criterion**: The recommended skills have been installed or the user has explicitly skipped this step.