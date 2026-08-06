# Changelog

All notable changes to this skills collection are documented here.

## 2026-08-06

### ✨ New Features

- **Skills collection** — Curated agent skills for engineering (architecture decision records, C4 diagrams, code review, codebase design, find-docs, gherkin authoring, improve, openspec-init, zoom-out, and more) and productivity (caveman, grilling, handoff, teach, writing-great-skills, and more), installable via `npx skills add`.

- **deploy-mate** — End-to-end deployment readiness for one environment at a time: architecture discovery, env-var cataloging, secret harvesting, CI/runtime injection, and deploy verification through a phased command workflow.

- **wayfinder** — Plan work too large for one agent session as a shared map of decision tickets on your issue tracker, resolving them one at a time until the route to the destination is clear.

- **risen-prompt** — Create structured RISEN prompts from messy notes or audit existing prompts for completeness and quality.

- **changelog-generator** — Turn git history and OpenSpec capabilities into polished, user-facing release notes with category classification and checkpoint-driven drafting.

- **git-commit** — Session-scoped conventional commits that stage only this session's work, with message analysis and scope clarification when ambiguous.

- **graphify** — Extract, query, and maintain code relationship graphs from your codebase for navigation and analysis.

- **code-simplification** — Systematic simplification of complex code with structured review and refactoring guidance.

- **diagnosing-bugs** — Structured bug diagnosis workflow with human-in-the-loop reporting templates.

- **writing-great-skills** — Glossary and authoring guidance for creating high-quality agent skills.

### 🔧 Improvements

- **deploy-mate command router** — Added `run`, `inject`, and `verify` commands plus a process lexicon (Recon → Verify), Scaffold phase, and iterative Harvest rounds for clearer end-to-end flows.

- **deploy-mate workflow gates** — Harvest now persists between rounds; Forge requires strategy sign-off; Arm-ready requires a tooling audit; Phase 1 requires an architecture diagram.

- **changelog-generator checkpoints** — Replaced file-based checkpoint artifacts with in-chat review gates for faster iteration.

- **git-commit session scoping** — Commits now include only paths touched in the current session, with prompts when scope is empty or ambiguous.

- **openspec-init & superpowers-bridge** — Streamlined six-step apply flow, autonomous verify-fix loop, mandatory archive commit gate, Gherkin scenario format enforcement, and simplified initialization docs with domain-level spec generation.

- **improve skill** — Pivoted to plan-based execution with an audit playbook for structured codebase improvement.

- **Interactive install** — Category-based skill selection now uses `@inquirer/prompts` for a smoother `npm run install` experience.

### 🐛 Fixes

- **deploy-mate scope guardrails** — Prevents Harvest from running deploy-for-config scenarios outside Deploy scope, reducing accidental mis-routing during secret collection.

### 🗑️ Removed

- **ponytail skill set** — Replaced by graphify, git-commit, and code-simplification for clearer, focused workflows.

- **openspec-git-discipline** — Replaced by git-commit for session-scoped conventional commits.

- **diagnose skill** — Removed; diagnosing-bugs covers structured bug diagnosis.
