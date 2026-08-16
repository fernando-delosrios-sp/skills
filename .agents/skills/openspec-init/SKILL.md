---
name: openspec-init
description: Use when the user asks to initialize an OpenSpec project.
---

# openspec-init

## Decision gates (before skill install)

Steps that say "stop and wait" are **_gates_**. At each gate:

1. Build options from discovered candidates (schemas/, inferred domains, yes/no).
2. Present with the first available adapter: native decision tool → `<decision_prompt>` block → minimal prose fallback.
3. One gate per message; halt until the user responds.
4. Mark the recommended option; use `multi_select` for domain lists.
5. Do not print numbered option lists in chat when using a native tool or block.

Record the chosen option by `id` (schema dir name, domain slug, yes/no/skip).

## 1. Setup & Initialization

- **Check Requirements**: Install the `openspec` CLI if it is not available (`npm install -D openspec` or `-g`).
- **Initialize**: Run `openspec init`. **_Gate_** — present inferred or default AI tool options; stop and wait for their response before proceeding.
- **Completion Criterion**: `openspec` CLI is available and `openspec init` has completed.

## 2. Schema Selection & Installation

- **List Schemas**: Read subdirectories under this skill's `schemas/` (skip non-schema entries like `README.md`).
- **Select Schema**: **_Gate_** — one option per schema (`id` = directory name; `detail` from schema README when available). Stop and wait for their choice.
- **Copy Schema**: Copy the chosen schema directory from this skill's `schemas/` folder to the target repository's `openspec/schemas/` directory.
- **Validate**: Run `openspec schema validate <schema-name>`. Attempt to fix errors or ask the user for guidance.
- **Completion Criterion**: The chosen schema directory exists in `openspec/schemas/` and validation passes.

## 3. Schema Instructions

- **Check Instructions**: Look for `INSTALL.md` in the copied schema directory.
- **Execute**: If it exists, follow the **Post-copy setup** section only. Skip **Standalone manual install**, **Skills**, and **Verify** — those belong to README (standalone use), step 6, or step 6 after step 5 respectively.
- **Completion Criterion**: Post-copy setup in `INSTALL.md` is complete, or no `INSTALL.md` exists.

## 4. Configuration

- **Build Config**: Build `openspec/config.yaml` by following `references/config.md`.
- **Completion Criterion**: `openspec/config.yaml` exists and contains `schema`, `context`, and `rules` sections.

## 5. Initial Spec Generation

- **Mandatory ubiquitous language**: Always create `openspec/specs/ubiquitous-language/spec.md` using `references/ubiquitous-language-spec.md` as the starting template. This spec is required for every project — do not skip it or fold it into another domain.
- **Discover Domains**: Analyze the project structure to infer logical domains. **_Gate_** — multi-select over inferred domains; stop and wait for their response.
- **Pre-populate**: Create the confirmed domain subdirectories in `openspec/specs/` and generate an initial `spec.md` for each. Stick to the domain categories found; do not create specs for more particular sub-groupings (e.g., do not create a spec for each individual service within a structural grouping).
- **Completion Criterion**: `openspec/specs/ubiquitous-language/spec.md` exists and `openspec/specs/` contains at least one additional domain subdirectory with an initial `spec.md` file (or only ubiquitous-language if the project is too early to infer domains — ask the user).

## 6. Recommended Skills Installation

- **Install Skills**: **_Gate_** — confirm before installing.
- **Skill list**: If the chosen schema's `INSTALL.md` has a **Skills** section, follow that list (authoritative). Otherwise install the default bundle below.

  **Default bundle — schemas without an INSTALL.md Skills section** (from `fernando-delosrios-sp/skills`):
  ```bash
  npx skills add fernando-delosrios-sp/skills --skill structured-choices
  npx skills add fernando-delosrios-sp/skills --skill changelog-generator
  npx skills add fernando-delosrios-sp/skills --skill git-commit
  npx skills add fernando-delosrios-sp/skills --skill gherkin-authoring
  npx skills add fernando-delosrios-sp/skills --skill c4-diagram
  ```

- **Verify**: If `INSTALL.md` has a **Verify** section, run it now (after step 5). Otherwise confirm `openspec schema validate <schema-name>` still passes and required skills are available.

- **Completion Criterion**: Required skills for the chosen schema are installed (or the user explicitly skipped with acknowledgment of which skills are missing), and verify checks pass.
