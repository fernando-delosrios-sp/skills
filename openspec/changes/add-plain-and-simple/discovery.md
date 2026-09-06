## Scope

In: add a local-only productivity skill `plain-and-simple` that shapes all user-facing agent messages for clarity-first brevity — shortest complete plain-English answer, minimal adaptive formatting, examples only when they clarify faster than more prose, exact technical terms with brief gloss when unfamiliar, expand only when asked. Model-invoked (description present; no `disable-model-invocation`). Out: rewriting `caveman`; fixed word/sentence caps; mandatory examples; auto-footer prompting expansion; changes to `lib/` or npm scripts.

## Language

**plain-and-simple** (`promote`):
A model-invoked communication mode and productivity skill name. The agent leads with the conclusion, uses plain English and short sentences, includes only what the user needs now, and stops when the answer is complete.
_Avoid_: caveman; terse; ultra-compressed; token-saving mode

**shortest complete answer** (`draft`):
The adaptive size bound for plain-and-simple responses — as short as possible without omitting necessary warnings, uncertainty, code, or exact error text.
_Avoid_: fixed word count; three-sentence limit; TL;DR footer

**minimal adaptive formatting** (`draft`):
Use the least structure the content needs — prose for one idea, bullets for genuine lists, headings only when separating distinct parts.
_Avoid_: always bullets; always headings; decorative markdown

## Decisions

**Context:** Agents often reply with long, hard-to-follow messages that clutter context and discourage reading. Existing `caveman` optimizes token compression via fragments and abbreviations — a different goal.

**Q1:** Separate skill or rewrite `caveman`?
→ **Chosen:** separate `plain-and-simple` skill; leave `caveman` unchanged.

**Q2:** Invocation model?
→ **Chosen:** model-invoked with description so the agent applies it broadly when installed (user can still name it explicitly). Not a one-shot toggle like caveman's session persistence.

**Q3:** Default answer budget?
→ **Chosen:** adaptive — shortest complete answer; no fixed sentence or word cap.

**Q4:** Coverage?
→ **Chosen:** all user-facing messages (explanations, questions, progress updates, handoffs). Code blocks, exact errors, and irreversible-action warnings stay exact and as long as needed.

**Q5:** When to include examples?
→ **Chosen:** only when an example clarifies faster than more prose — not on every answer.

**Q6:** Formatting rule?
→ **Chosen:** minimal adaptive formatting.

**Q7:** Technical terms?
→ **Chosen:** keep exact terms; add a brief plain-language gloss only when the user may not know the term.

**Q8:** Expansion?
→ **Chosen:** stop when complete; expand only when the user asks. No standing "ask me to expand" footer.

## Open questions

None — locked during `/opsx-explore` session.

## Scenarios discussed

- Simple factual question → one or two plain sentences; conclusion first; no preamble.
- Technical concept → precise term plus short gloss when needed; example only if it saves explanation.
- Work handoff → what changed, result, next step; no ceremonial intro.
- Irreversible or security-sensitive action → warning preserved in full even if longer.
- User asks "go deeper" / "expand" → agent adds detail without reverting to essay mode.
- Complex multi-part answer → headings or bullets only when they aid scanning; not by default.
- Contrast with `caveman` → caveman drops articles and uses fragments; plain-and-simple keeps readable sentences and optimizes comprehension over token count.
