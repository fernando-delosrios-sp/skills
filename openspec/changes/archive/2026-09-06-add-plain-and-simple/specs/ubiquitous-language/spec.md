## ADDED Requirements

### Requirement: plain-and-simple glossary entry

The glossary SHALL define **plain-and-simple** as a model-invoked communication mode and productivity skill name. The agent leads with the conclusion, uses plain English and short sentences, includes only what the user needs now, and stops when the answer is complete. Notes MUST list avoided aliases: caveman; terse; ultra-compressed; token-saving mode. Bounded context is global / productivity skills.

#### Scenario: plain-and-simple definition

- **GIVEN** a maintainer reads the ubiquitous-language spec
- **WHEN** they look up plain-and-simple
- **THEN** a `### Term: plain-and-simple` entry MUST exist
- **AND** the definition MUST state it is a model-invoked communication mode and productivity skill name
- **AND** notes MUST reject caveman, terse, ultra-compressed, and token-saving mode as aliases for this term

### Requirement: shortest complete answer glossary entry

The glossary SHALL define **shortest complete answer** as the adaptive size bound for plain-and-simple responses — as short as possible without omitting necessary warnings, uncertainty, code, or exact error text. Notes MUST reject fixed word counts, three-sentence limits, and a TL;DR footer.

#### Scenario: shortest complete answer definition

- **GIVEN** a maintainer reads the ubiquitous-language spec
- **WHEN** they look up shortest complete answer
- **THEN** a `### Term: shortest complete answer` entry MUST exist
- **AND** the definition MUST describe an adaptive size bound, not a numeric cap

### Requirement: minimal adaptive formatting glossary entry

The glossary SHALL define **minimal adaptive formatting** as using the least structure the content needs — prose for one idea, bullets for genuine lists, headings only when separating distinct parts. Notes MUST reject always bullets, always headings, and decorative markdown.

#### Scenario: minimal adaptive formatting definition

- **GIVEN** a maintainer reads the ubiquitous-language spec
- **WHEN** they look up minimal adaptive formatting
- **THEN** a `### Term: minimal adaptive formatting` entry MUST exist
- **AND** the definition MUST describe choosing the least structure the content needs
