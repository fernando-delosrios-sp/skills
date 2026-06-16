---
name: improve-codebase-architecture
description: Find deepening opportunities in a codebase, informed by repomix output and any openspec/specs/ or openspec/adr/ artifacts present. Use when the user wants to improve architecture, find refactoring opportunities, consolidate tightly-coupled modules, or make a codebase more testable and AI-navigable.
---

# Improve Codebase Architecture

Surface architectural friction and propose **deepening opportunities** — refactors that turn shallow modules into deep ones. The aim is testability and AI-navigability.

## Glossary

Use these terms exactly in every suggestion. Consistent language is the point — don't drift into "component," "service," "API," or "boundary." Full definitions in [LANGUAGE.md](LANGUAGE.md).

- **Module** — anything with an interface and an implementation (function, class, package, slice).
- **Interface** — everything a caller must know to use the module: types, invariants, error modes, ordering, config. Not just the type signature.
- **Implementation** — the code inside.
- **Depth** — leverage at the interface: a lot of behaviour behind a small interface. **Deep** = high leverage. **Shallow** = interface nearly as complex as the implementation.
- **Seam** — where an interface lives; a place behaviour can be altered without editing in place. (Use this, not "boundary.")
- **Adapter** — a concrete thing satisfying an interface at a seam.
- **Leverage** — what callers get from depth.
- **Locality** — what maintainers get from depth: change, bugs, knowledge concentrated in one place.

Key principles (see [LANGUAGE.md](LANGUAGE.md) for the full list):

- **Deletion test**: imagine deleting the module. If complexity vanishes, it was a pass-through. If complexity reappears across N callers, it was earning its keep.
- **The interface is the test surface.**
- **One adapter = hypothetical seam. Two adapters = real seam.**

## Process

### 1. Explore

If no `repomix*` file exists, run `npx repomix --style markdown` first. If it fails, fall back to cold code exploration.

Read any `openspec/specs/` and `openspec/adr/` artifacts present.

Then use the Agent tool with `subagent_type=Explore` to walk the codebase. Don't follow rigid heuristics — explore organically and note where you experience friction:

- Where does understanding one concept require bouncing between many small modules?
- Where are modules **shallow** — interface nearly as complex as the implementation?
- Where have pure functions been extracted just for testability, but the real bugs hide in how they're called (no **locality**)?
- Where do tightly-coupled modules leak across their seams?
- Which parts of the codebase are untested, or hard to test through their current interface?

Apply the **deletion test** to anything you suspect is shallow: would deleting it concentrate complexity, or just move it? A "yes, concentrates" is the signal you want.

### 2. Present candidates as a markdown report

Write the architectural review as markdown and output it directly in the chat. Do not save a file unless the user asks for it. After presenting it, ask: _"Want me to save this as ARCHITECTURE-REVIEW.md in the project root?"_

The report uses **Mermaid code blocks** for graph-shaped diagrams (call graphs, dependencies, sequences) where they reliably communicate the structure. Each candidate gets a **before/after visualisation**. Be visual.

For each candidate, use the same card structure:

- **Files** — which files/modules are involved
- **Problem** — why the current architecture is causing friction
- **Solution** — plain English description of what would change
- **Benefits** — explained in terms of locality and leverage, and how tests would improve
- **Before / After diagram** — side-by-side, custom-drawn, illustrating the shallowness and the deepening
- **Recommendation strength** — one of `Strong`, `Worth exploring`, `Speculative`, rendered as bold text or an inline badge
- **Suggested context** — domain terms discovered during analysis that the project might want to formalise

End the report with a **Top recommendation** section: which candidate you'd tackle first and why.

**Infer domain vocabulary from `openspec/specs/` if present, otherwise from repomix output, otherwise from the codebase itself. Use [LANGUAGE.md](LANGUAGE.md) vocabulary for the architecture.** If the project calls it "Order intake," talk about "the Order intake module" — not the "FooBarHandler," and not the "Order service."

**ADR conflicts**: if a candidate contradicts an existing ADR in `openspec/adr/`, flag it clearly in the card (e.g. a warning: _"contradicts ADR-0007 — but worth reopening because…"_). Don't list every theoretical refactor an ADR forbids.

See [MARKDOWN-REPORT.md](MARKDOWN-REPORT.md) for the full markdown scaffold, diagram patterns, and styling guidance.

Do NOT propose interfaces yet. After the report is output, ask the user: "Which of these would you like to explore?"

### 3. Grilling loop

Once the user picks a candidate, drop into a grilling conversation. Use the `/grill-me` skill to interview them, probing the architecture-specific topics below. Walk the design tree with them — constraints, dependencies, the shape of the deepened module, what sits behind the seam, what tests survive.

Probe these topics in the grilling loop:

- **Seam placement** — where the new interface should live, and whether it is a hypothetical seam (one adapter) or a real seam (two adapters).
- **Depth and leverage** — how much behaviour the deepened module hides behind how small an interface, and what callers gain.
- **Locality** — where change, bugs, and knowledge will concentrate after the refactor.
- **Dependency category** — classify dependencies using [DEEPENING.md](DEEPENING.md) so the test strategy is clear.
- **Test surface** — which tests survive at the new interface, and which shallow tests are deleted.
- **Deletion test** — if the candidate module were deleted, would complexity vanish or reappear across callers?

Side effects happen inline as decisions crystallize:

- **Discovering a new domain term worth naming?** Record it in the **Suggested context** section of the report. Do not edit project files.
- **Want to explore alternative interfaces for the deepened module?** See [INTERFACE-DESIGN.md](INTERFACE-DESIGN.md).
