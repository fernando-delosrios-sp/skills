## 1. Ubiquitous language

- [x] 1.1 Archive change delta into `openspec/specs/ubiquitous-language/spec.md` with runtime visibility term entries (or apply during archive step)

## 2. Artifact templates (ARTIFACTS.md)

- [x] 2.1 Add **Visibility** column to `architecture.md` Components template with T1/T2/chain example
- [x] 2.2 Replace Optional scope Observability deferral with required **Runtime visibility** section in `deployment.md` template (strategy + per-component deferral table)
- [x] 2.3 Add **Runtime visibility tooling** table template to `configuration.md` section
- [x] 2.4 Add `progress.md` checklist rows: Runtime visibility — planned (Forge sign-off); Runtime visibility tooling — ready

## 3. Skill entry point (SKILL.md)

- [x] 3.1 Add `arm visibility` to argument-hint and Invocation table
- [x] 3.2 Document pipeline insertion: after Forge proposal sign-off, before forge artifacts
- [x] 3.3 Add gates: Forge sign-off includes visibility plan; arm visibility complete + forge artifacts → Deploy; Inject not blocked
- [x] 3.4 Add lexicon note for Runtime visibility tooling (third Arm table) without new top-level phase word

## 4. Command protocols (COMMANDS.md)

- [x] 4.1 Add full **`arm visibility`** protocol (inputs, steps, done-when, forbidden)
- [x] 4.2 Extend **`forge proposal`** to require Runtime visibility section and progress row on sign-off
- [x] 4.3 Extend **`forge artifacts`** prerequisite note (follows arm visibility)
- [x] 4.4 Extend **`deploy`** gate checks for tier-1 Steps + visibility tooling ready
- [x] 4.5 Extend **`verify`** protocol: tier-1 retry (3×10s), tier-2 deferrals, read chain order, per-component summary
- [x] 4.6 Update **`run`**, **`continue`**, **`help`** phase order and recipes to include `arm visibility`
- [x] 4.7 Update **`status`** to report visibility plan and tooling readiness
- [x] 4.8 Update **`reconcile`** to diff visibility-related sections and recommend `arm visibility` when plan changes

## 5. Tooling and delegation

- [x] 5.1 Add Runtime visibility tooling verify patterns to `TOOLING.md` (platform-access-only, per-platform examples)
- [x] 5.2 Add `arm visibility` and extended Verify rows to `DELEGATION.md`
- [x] 5.3 Cross-reference tier-1/tier-2 scope in `CONFIG-GUIDE.md` if gates are mentioned there

## 6. Agent manifest

- [x] 6.1 Update `agents/openai.yaml` if argument-hint or short description needs runtime visibility mention

## 7. Validation and documentation

- [x] 7.1 Run `npm run validate` and fix any skill manifest or frontmatter issues
- [x] 7.2 Update `CHANGELOG.md` with deploy-mate runtime visibility feature entry
- [x] 7.3 Update README.md deploy-mate section if skill is documented there — N/A (listed in category table only)

## 8. OpenSpec archive

- [x] 8.1 Archive `deploy-mate-runtime-visibility` change to publish `openspec/specs/engineering-deploy-mate/spec.md`
