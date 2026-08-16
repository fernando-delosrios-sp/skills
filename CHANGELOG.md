# Changelog

All notable changes to this skills collection are documented here.

## 2026-08-16

### ✨ New Features

- **ferspec OpenSpec schema** — Lean workflow under `openspec-init/schemas/ferspec/`: discovery → proposal/design/specs → tasks → apply. Thin schema instructions with Matt Pocock skill pointers; drops plan, verify, and retrospective artifacts; manual archive; autonomous `tracking.md` contract.

### 🐛 Fixes

- **apply-code-changes apply protocols** — Document worktree + single-session checkout and handoff; persist `Change` from adapter `CHANGE_ROOT` on autonomous first run; clarify Direct vs OpenSpec adapter precedence when both match. Branch step is workspace-aware (main stays off `FEATURE_BRANCH` during worktree); autonomous push uses explicit `FEATURE_BRANCH` not `HEAD`.
- **apply-code-changes worktree consistency** — Branch resolution distinguishes `single` (worktree on `FEATURE_BRANCH`) vs `subagent-per-group` (group branches + merge target). Autonomous worktree preset downgrades to `local` when no worktree skill exists. Worktree sessions re-resolve `CHANGE_ROOT` inside the worktree. Ferspec autonomous flow persists OpenSpec `store` into Presets.
- **apply-code-changes artifact checkout** — Introduce `TRACKING` + `ACTIVE_CHANGE_ROOT`: branch resolution reads in-memory `TRACKING`; bind (including worktree create for `single`) completes before execute; worktree teardown waits until PR URL is pushed; adapters no longer create on-disk `tracking.md` at pre-flight.
- **apply-code-changes resume PR base** — Autonomous apply already on the feature branch now opens the PR against `base-branch` or the repo default (`main`), not against the feature branch itself.
- **ferspec `setup-matt-pocock-skills` install** — The skill now ships in this package, so `npx skills add fernando-delosrios-sp/skills --skill setup-matt-pocock-skills` from ferspec `INSTALL.md` succeeds.

### 🔧 Improvements

- **structured-choices multi-question gates** — A single gate may carry multiple questions when another skill composes it (e.g. grilling rounds). Payload examples document Cursor `AskQuestion` batch shape and session completion confirm dialog.

- **grilling structured rounds** — Frontier rounds use structured-choices gates instead of numbered prose Q&A. Overlay captures the customization intent for upstream sync.

### 📚 Documentation

- **domain-modeling ADR routing** — Suggest the `architecture-decision-records` skill for complex ADRs (MADR format, supersession chains).

---

## 2026-08-13

### ✨ New Features

- **deploy-mate runtime visibility** — Forge proposal now requires a per-component runtime visibility plan (tier-1 health/status, tier-2 logs/CI). New `arm visibility` subcommand maps Runtime visibility tooling after Forge sign-off. Verify runs tier-1 (with retry) then tier-2; tier-1 blocks Deploy but not Inject.

---

## 2026-08-08 · v0.4.0

### ✨ New Features

- **Language teacher prompt** — Added `prompts/language-teacher.md`, a bilingual teaching prompt that keeps lessons in the target language and follow-ups in the learner's native language, with mission-grounded workspace files.

- **NotebookLM slide-deck builder** — Added `Google Notebook/slide-deck-builder/` with schema, layouts, design themes, system prompts, examples, and templates for generating structured slide decks via NotebookLM.

---

## 2026-08-07

### 🔧 Improvements

- **superpowers-bridge apply workflow** — Apply now prompts for local branch vs isolated worktree before dispatching the executor. Worktree path squash-merges back to the original branch before verify; step 2b completion gate mirrors verify checks to prevent post-apply verify warnings.

- **Sync branch cleanup** — The sync GitHub Actions workflow now deletes merged remote `sync/*` branches when the job finishes. Maintainers can dry-run locally with `npm run sync -- --cleanup-branches --dry-run` when `GITHUB_TOKEN` and `GITHUB_REPOSITORY` are set.

- **git-commit changelog gate** — When a repository has `CHANGELOG.md` and it is not staged, the skill now requires a changelog update via **changelog-generator** before generating a commit message or committing.

---

## 2026-08-06

### ✨ New Features

- **skill-overlay** — Full lifecycle for skill overlays: audit routing (restore vs remerge), deterministic git restore when upstream and overlay are unchanged, and agent modes for apply, extract, and reconcile. Replaces **apply-skill-overlay**.

- **`npm run overlay -- audit` / `restore`** — Fingerprint upstream SHA and overlay hashes in `.locks/upstream.json`; auto-restore blended skills during `npm run update` when inputs are identical.

- **`.claude-plugin/marketplace.json`** — Category plugin manifest for the upstream `skills` CLI. `npx skills add fernando-delosrios-sp/skills` now groups skills under Engineering, Productivity, and Internal instead of a flat searchable list.

### 🔧 Improvements

- **Skill path resolution** — Centralized canonical, agents, overlay, and git-prefix path helpers in `lib/skill-paths.mjs`. Overlay audit, extract, validate, and index re-exports now share one path authority; layout changes touch a single module.

- **Upstream git adapter** — Consolidated shallow clone, skill tree walking, and HEAD SHA resolution into `lib/upstream-adapter.mjs`. Sync, import, and overlay extract now share one URL normalization path and `{ relPath, content }[]` tree shape; unit tests can inject a filesystem fixture without network access.

- **Unified overlay pending state** — Replaced timestamp-based `isOverlayPending` with route-based `isPendingApply(skillName)` on the overlay pipeline. Sync summary, manifest cleanup, and audit/prepare now share one pending authority; generator-only skills and invalid `blended_ref` edge cases align with audit routing.

- **Overlay YAML layer** — Introduced `lib/overlay-yaml.mjs` for generator merge resolution, generated-path classification, and deterministic `openai-manifest` derivation. Broke the generator ↔ overlay circular dependency; extract no longer uses runtime dynamic imports to reach generator-config.

- **Overlay lock schema** — Extended `.locks/upstream.json` with `applied_upstream_sha`, `overlay_hash`, `universal_overlay_hash`, and `blended_ref` for deterministic restore vs remerge routing.

- **`npm run update`** — Now runs sync → static → audit → auto-restore → prepare remerge manifests (agent apply only when upstream or overlay changed).

- **extract-overlay drafts** — `draftInstructions()` emits intent-only hints instead of embedding local file blobs that encouraged literal restore.

- **Interactive install (`npm run install`)** — Single category-tabbed picker: categories across the top, `←`/`→` to switch, `↑`/`↓` to navigate skills, non-looping lists, and selection counts per category.

- **Marketplace manifest tooling** — `lib/marketplace-manifest.mjs` generates `.claude-plugin/marketplace.json` from `skills/*/skills.json`; `npm run validate` checks it stays in sync.

### 🐛 Fixes

- **Overlay prepare routing** — Guard pending manifest preparation when a skill has neither a per-skill overlay nor configured generators; skip with a warning in batch mode and return a clear error for explicit `--skill` calls.

- **`npx skills add` install UI** — Grouped category selection replaces the upstream flat search picker that stacked duplicate prompts after navigation.

### 🗑️ Removed

- **apply-skill-overlay** — Renamed to **skill-overlay** with mode-based structure (audit, restore, apply, extract, reconcile).

---

## 2026-08-06 (earlier)

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

### 🐛 Fixes

- **deploy-mate scope guardrails** — Prevents Harvest from running deploy-for-config scenarios outside Deploy scope, reducing accidental mis-routing during secret collection.

### 🗑️ Removed

- **ponytail skill set** — Replaced by graphify, git-commit, and code-simplification for clearer, focused workflows.

- **openspec-git-discipline** — Replaced by git-commit for session-scoped conventional commits.

- **diagnose skill** — Removed; diagnosing-bugs covers structured bug diagnosis.









