# Changelog

All notable changes to this skills collection are documented here.

## 2026-08-19

### 🐛 Fixes

- **structured-choices reaches its fallbacks by evidence, not self-classification** — `Emit the gate` is one unconditional instruction: call the question tool (`AskQuestion` in Cursor) as your first move. Everything host-generic sits in [`references/other-hosts.md`](skills/productivity/structured-choices/references/other-hosts.md) behind a pointer that fires on a failed call and nothing else — a reading of the tool list and a conclusion about the host both leave it unreached. A host-branched body made the agent decide which host it was on before acting, and it answered that question wrong ("AskQuestion isn't available as a tool here") rather than making the call.
- **structured-choices keeps the Cursor payload as its only gate artifact** — The body holds one `AskQuestion` argument object, so the copyable thing at the moment a gate fires is the thing Cursor accepts. The previous adapter ladder gave the correct path no example while printing a full template for the encoding Cursor cannot use, and agents emitted the template.
- **structured-choices keeps host plumbing out of the gate** — A gate opens with the question; a line reporting which tools the agent has costs the user a read and gives them nothing to act on.
- **`Skip the gate` tests for a user, not for tooling** — The skip condition read "the host is non-interactive (CI)", which is the same self-classification that was dropping gates: an agent seeing no question tool concluded the host was non-interactive. It now reads "no user is available to answer", matching the phrasing already used in `improve`, and states that an unrenderable gate is a failed call rather than a skip. `apply-code-changes` carries the same clarification on its non-interactive branch, which had been skipping the venue gate on that reading.
- **structured-choices gate instructions state the target behaviour** — Gate rules and the `AGENTS.md` blocks name the action to take instead of banning the ones to avoid; a prohibition keeps the unwanted form in context and raises how often it is reached for. The always-loaded `AGENTS.md` line no longer enumerates the alternative encodings at all.
- **structured-choices question tool is invoked directly** — Gates were being routed through a nonexistent MCP server. The Cursor path states that `AskQuestion` is built in and invoked like `Read` or `Grep`, and that the call is the check — its result being the only evidence about the tool, rather than the agent's own reading of its tool list.
- **structured-choices Cursor payloads match the schema** — Examples passed `options[].detail`, which Cursor rejects, so a copied payload could fail and cost the gate; detail folds into `label`. `payload-examples.md` now holds Cursor shapes only.
- **openspec-init delegates its gate mechanics** — The skill restated the adapter ladder, duplicating structured-choices and naming an encoding Cursor cannot use; it now points at the skill for the how and keeps only what is specific to its own gates.
- **structured-choices carries no worked prose gate** — The rung-3 example was itself the issue-tracker question, making it a drop-in for the most common real gate in this collection; agents on Cursor rendered it instead of calling the tool. Rung 3 now describes the shape and states why no example accompanies it, leaving the `AskQuestion` payload as the only gate artifact in the skill.
- **structured-choices reads an existing option list as option data** — Most skills predate gates and spell their choices out as bulleted lists, blockquoted questions, or "then ask the user", which agents rendered literally into chat. A new `Options already written as a list` section takes those entries as arguments for the call, deriving an `id` per entry and folding its explanation into the `label`. Consumer skills need no changes and nothing opts in, so an unprepared skill gates correctly as-is.

---

## 2026-08-18

### ✨ New Features

- **git-commit private-data gate** — Mandatory staged-diff scan for secrets, PII, and sensitive local paths before commit; halts with structured-choices gate listing flagged files and signal types (never values).
- **ferspec 1.1.0 archive commit** — Archive phase now requires commit and post-commit gate after sync/move; `operations.archive.guidance` in config surfaces steps via `openspec instructions archive`.

---

## 2026-08-17

### ✨ New Features

- **ferspec project adoption** — Active OpenSpec schema switched to ferspec; `openspec/schemas/ferspec/` installed with discovery/design/specs artifact templates and updated `openspec/config.yaml` rules.
- **openspec-init schema picker** — Update flow lists bundled schemas with diff status, supports switching active schema, and refreshes config from the chosen bundle.
- **triage skill** — Synced from mattpocock/skills for issue triage workflows.
- **Agent routing docs** — `docs/agents/issue-tracker.md` and `docs/agents/domain.md` plus ferspec workflow routing in `AGENTS.md`.

### 🐛 Fixes

- **code-review setup hint** — When `docs/agents/issue-tracker.md` is missing, tell the user to run `/setup-matt-pocock-skills` instead of invoking it implicitly.
- **tdd domain vocabulary** — Dual-mode glossary guidance (OpenSpec ubiquitous-language spec vs legacy `CONTEXT.md`) with overlay to survive upstream sync.
- **openspec-init schema migration** — Graph-version hard-stops and `UPDATE.md` acknowledgment now run in U2 for the chosen schema before overwrite, not only for the previously active schema in U1.

### 🔧 Improvements

- **skills-lock github sources** — Engineering skills now lock to `fernando-delosrios-sp/skills` github paths for consistent installs across machines.

---

## 2026-08-16

### ✨ New Features

- **ferspec OpenSpec schema** — Lean workflow under `openspec-init/schemas/ferspec/`: discovery → proposal/design/specs → tasks → apply. Thin schema instructions with Matt Pocock skill pointers; drops plan, verify, and retrospective artifacts; manual archive; autonomous `tracking.md` contract.

### 🐛 Fixes

- **apply-code-changes apply protocols** — Document worktree + single-session checkout and handoff; persist `Change` from adapter `CHANGE_ROOT` on autonomous first run; clarify Direct vs OpenSpec adapter precedence when both match. Branch step is workspace-aware (main stays off `FEATURE_BRANCH` during worktree); autonomous push uses explicit `FEATURE_BRANCH` not `HEAD`.
- **apply-code-changes worktree consistency** — Branch resolution distinguishes `single` (worktree on `FEATURE_BRANCH`) vs `subagent-per-group` (group branches + merge target). Autonomous worktree preset downgrades to `local` when no worktree skill exists. Worktree sessions re-resolve `CHANGE_ROOT` inside the worktree. Ferspec autonomous flow persists OpenSpec `store` into Presets.
- **apply-code-changes artifact checkout** — Workspace matrix is the single source of truth for main-branch vs worktree checkout; `TRACKING_HINT` vs bind-time `TRACKING` merge prevents resume overwrites; `ACTIVE_CHANGE_ROOT` replaces pre-bind `changeRoot` for all post-bind I/O; ferspec apply schema aligned.
- **apply-code-changes setup and resume** — Interactive records workspace/parallelism in `TRACKING` Presets; feature-branch `tracking.md` merges pre-bind before branch resolution; OpenSpec `--store` reads `TRACKING_HINT`; autonomous PR uses explicit `--base ORIGINAL_BRANCH`.
- **apply-code-changes bind gate** — Bind waits for interactive setup steps 2–3 (workspace and parallelism), not step 1 tracking init alone.
- **apply-code-changes resume PR base** — Autonomous apply already on the feature branch now opens the PR against `base-branch` or the repo default (`main`), not against the feature branch itself.
- **apply-code-changes hint trust boundary** — Mode detection now requires a **trusted hint** (Change matches `CHANGE_ROOT`) before a hint Issue selects autonomous mode, aligning with setup overlay rules so a stale hint no longer skips interactive workspace/parallelism dialogs or runs autonomous PR handoff without a trusted issue link.
- **apply-code-changes untrusted hint PR** — The setup hint guard now covers PR alongside Branch, Issue, and Presets: a stale adapter-path `TRACKING_HINT` PR is no longer copied into `TRACKING` and persisted to a new change's `tracking.md`, where a later resume would have treated it as trusted. PR stays empty until handoff opens the real PR.
- **apply-code-changes stale tracking hints** — Setup only trusts a `TRACKING_HINT` Branch when its own Change matches the current `CHANGE_ROOT`, so a stale hint can no longer select an unrelated branch or misname a new one; pre-bind merge now also STOPs instead of merging Issue/PR/Presets when a candidate branch's on-disk Change points at a different change. Autonomous setup locks `workspace`/`parallelism` into `PRESET_OVERRIDES` so pre-bind merge can no longer reintroduce `worktree` without the setup-time PRECHECK.
- **apply-code-changes remote-only feature branch** — Branch resolution now tracks an existing `origin/FEATURE_BRANCH` instead of recreating it from `ORIGINAL_BRANCH`, so CI resume and fresh clones no longer discard remote commits. Re-synced the installed `.agents` skill copies with the canonical `skills/engineering` sources, which had drifted and were missing prior tracking-hint and preset-override fixes.
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









