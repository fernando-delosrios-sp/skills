# Diagnose Report: <slug>

**Date:** YYYY-MM-DD
**Bug:** <one-line description>
**Status:** In Progress

---

## Phase 1 — Feedback Loop

**Loop type:** <failing test / curl / CLI / ...>
**Speed:** <seconds per run>
**Determinism:** <pass/fail rate>
**Command:**
```
<how to run it>
```

---

## Phase 2 — Reproduction

- [ ] Matches user-described failure
- [ ] Reproducible across runs
- [ ] Exact symptom captured

**Symptom:**
```
<error / output>
```

---

## Phase 3 — Hypotheses

| # | Hypothesis | Prediction | Result |
|---|-----------|------------|--------|
| 1 | ... | ... | ✅/❌ |

**User input:** <re-ranking or context>

---

## Phase 4 — Instrumentation

| Probe | Targets Hypothesis | Finding |
|-------|-------------------|---------|
| <debugger/log> | #1 | <result> |

**Debug tags:** `[DEBUG-xxxx]`

---

## Phase 5 — Fix

**Root cause:** <correct hypothesis>
**Fix:** <description>
**Regression test:**
```
<test location + command>
```
**Seam quality:** correct seam / no correct seam

---

## Phase 6 — Post-mortem

- [ ] Original repro no longer reproduces
- [ ] Regression test passes
- [ ] [DEBUG-...] instrumentation removed
- [ ] Throwaway prototypes deleted
- [ ] Hypothesis in commit/PR message

**Prevention:** <what would have prevented this bug?>
