## ADDED Requirements

### Requirement: Canonical tree for plain-and-simple

The repository SHALL provide a **Local-only skill** named `plain-and-simple` whose Canonical tree is `skills/productivity/plain-and-simple/` containing `SKILL.md` as the primary definition.

#### Scenario: Skill directory contains SKILL.md

- **GIVEN** the productivity Canonical tree for `plain-and-simple`
- **WHEN** a maintainer inspects the skill directory
- **THEN** `SKILL.md` MUST exist at `skills/productivity/plain-and-simple/SKILL.md`

### Requirement: Model-invoked frontmatter

The skill's SKILL.md frontmatter SHALL include `name: plain-and-simple` and a `description`. It MUST NOT set `disable-model-invocation`.

#### Scenario: Description present without disable-model-invocation

- **GIVEN** `skills/productivity/plain-and-simple/SKILL.md`
- **WHEN** frontmatter is parsed
- **THEN** `name` MUST be `plain-and-simple`
- **AND** `description` MUST be a non-empty string
- **AND** `disable-model-invocation` MUST be absent or false

### Requirement: Shortest complete answer

The skill SHALL instruct the agent to lead with the conclusion, use plain English and short sentences, and bound length to the **shortest complete answer** — with no fixed word or sentence cap.

#### Scenario: Adaptive budget encoded in SKILL.md

- **GIVEN** the plain-and-simple SKILL.md body
- **WHEN** a maintainer reads the communication rules
- **THEN** the body MUST require leading with the conclusion
- **AND** MUST require the shortest complete answer
- **AND** MUST NOT impose a fixed word or sentence count

### Requirement: Coverage and exactness exceptions

The skill SHALL apply to all user-facing messages (explanations, questions, progress updates, handoffs). Code blocks, exact error text, and irreversible-action warnings MUST remain exact and as long as needed.

#### Scenario: Warnings and code stay complete

- **GIVEN** the plain-and-simple SKILL.md body
- **WHEN** a maintainer reads coverage rules
- **THEN** the body MUST list user-facing messages as in scope
- **AND** MUST require unchanged code blocks, exact errors, and full irreversible-action warnings

### Requirement: Examples only when faster than prose

The skill SHALL allow examples only when an example clarifies faster than more prose. It MUST NOT require an example on every answer.

#### Scenario: Optional examples

- **GIVEN** the plain-and-simple SKILL.md body
- **WHEN** a maintainer reads the examples rule
- **THEN** the body MUST restrict examples to cases that clarify faster than more prose
- **AND** MUST NOT require an example on every answer

### Requirement: Minimal adaptive formatting

The skill SHALL require **minimal adaptive formatting**: prose for one idea, bullets for genuine lists, headings only when separating distinct parts.

#### Scenario: Formatting is adaptive not mandatory structure

- **GIVEN** the plain-and-simple SKILL.md body
- **WHEN** a maintainer reads the formatting rule
- **THEN** the body MUST describe minimal adaptive formatting
- **AND** MUST NOT require always using bullets or always using headings

### Requirement: Exact terms with optional gloss

The skill SHALL keep exact technical terms and add a brief plain-language gloss only when the user may not know the term.

#### Scenario: Gloss is conditional

- **GIVEN** the plain-and-simple SKILL.md body
- **WHEN** a maintainer reads the terminology rule
- **THEN** the body MUST require keeping exact technical terms
- **AND** MUST allow a brief gloss only when the term may be unfamiliar

### Requirement: Expand only when asked

The skill SHALL instruct the agent to stop when the answer is complete and expand only when the user asks. It MUST NOT add a standing expansion-prompt footer.

#### Scenario: No expansion footer

- **GIVEN** the plain-and-simple SKILL.md body
- **WHEN** a maintainer reads the expansion rule
- **THEN** the body MUST require stopping when complete
- **AND** MUST require expanding only when the user asks
- **AND** MUST forbid a standing expansion footer

### Requirement: Distinct from caveman

The skill SHALL remain a separate package from `caveman`. Implementation MUST NOT modify the caveman Canonical tree.

#### Scenario: Caveman tree unchanged

- **GIVEN** the caveman Canonical tree at apply time
- **WHEN** this change is implemented
- **THEN** `skills/productivity/caveman/` MUST be unmodified by this change

### Requirement: Generated openai-manifest output

The skill SHALL include `agents/openai.yaml` produced by the openai-manifest Generator: Title Case `interface.display_name` from the skill name, `interface.short_description` equal to the first sentence of the SKILL.md description, and no `policy` key because implicit invocation is allowed.

#### Scenario: openai.yaml matches generator rules

- **GIVEN** SKILL.md frontmatter for plain-and-simple with a description and without `disable-model-invocation`
- **WHEN** `agents/openai.yaml` is generated
- **THEN** `interface.display_name` MUST be `Plain And Simple`
- **AND** `interface.short_description` MUST equal the first sentence of the description
- **AND** `policy` MUST be absent
