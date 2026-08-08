# Epic — Code Review Process (human review of AI-authored change)

**Status:** Draft. Captured from a Testing learning session (buổi 10, V9 Static testing & reviews). Not yet broken down into tasks. Everything below is a **candidate**, nothing is locked.
**Owner:** Phuong
**Goal:** Turn "reviewing a diff" from an ad-hoc habit into a written, repeatable procedure sized for a solo engineer working with an AI author — a reading procedure, a human-only checklist, and a small set of gates that each carry an *independent* oracle.

---

## 1. Why this epic exists

Classic code-review practice assumes a human author and a human reviewer. When the author is an AI and the reviewer is the same human who wrote the prompt, three of the mechanisms review depends on are broken at once:

| Mechanism | Human ↔ human | Human ↔ AI |
|---|---|---|
| **Oracle independence** | Two people, two knowledge bases, uncorrelated errors | **Zero.** The AI derived everything from the prompt; the reviewer reviews against the same belief that produced the code |
| **Author self-annotation** | Explaining your own change to a reviewer makes you find your own defects (Cisco/SmartBear finding) | Absent. A machine gains nothing from explaining |
| **Change size as a natural brake** | Bounded by how much a human can write | Unbounded. Producing 400 lines costs the same as 20, so the strongest quality lever is pushed the wrong way by default |

This epic exists to rebuild those three mechanisms deliberately, because they no longer come for free.

## 2. Evidence base

Labelled by how much weight it can carry.

| Source | Finding | Reliability |
|---|---|---|
| **GitClear**, 211M changed lines, 2020–2024 (Google/Microsoft/Meta + enterprise repos) | Refactoring share of changed lines fell 25% (2021) → under 10% (2024). Copy/pasted lines rose 8.3% → 12.3%. 2024 was the first year on record where within-commit copy/paste exceeded moved (refactored) code | Good. Large sample, specific methodology, single vendor |
| **Sadowski et al., ICSE-SEIP 2018**, Google, 9M changes | Median change = 24 lines; >35% touch one file; median 1 reviewer; median end-to-end latency under 4h; 44/44 surveyed call review valuable while only **2** said the comments found a bug | Strong |
| **Bacchelli & Bird, ICSE 2013**, Microsoft | Motivation for review is defect finding; the actual outcomes are knowledge transfer, team awareness and alternative solutions. Code/change *understanding* is the key activity | Strong |
| **Basili et al.**, controlled experiment | Perspective-based reading beat ad-hoc and checklist-based reading by ~35%; **checklist-based reading was no more effective than ad-hoc**. Later replications are mixed (one found PBR ≈ CBR on effectiveness but PBR cheaper in time) | Moderate; direction is not settled |
| **SmartBear/Cisco**, ~2500 reviews, 50 devs, 3.2M LOC | Under 200 LOC per sitting (never above 400); under 300 LOC/hour; under 60 min per sitting (90 max). Authors who annotate their own change find their own defects | Moderate. One vendor study, ~2006, but the direction is widely corroborated |
| Vendor blog statistics ("AI PRs have 1.7× more issues", "45% of AI code has vulnerabilities") | — | **Do not cite.** Marketing material from review-tool vendors |

## 3. Candidate deliverables

### 3a. A reading procedure (the main artifact)

Not a guardrail checklist — a **procedure for how to move through a change**, plus the perspectives to read it under.

Reading order (Google eng-practices):
1. Broad view first. The first question is *should this change exist at all*, not *is the code correct*. If the direction is wrong, reply immediately with reasoning and an alternative; stop reading.
2. Find the file with the main logical change and read it first. If there is a major design problem, send it immediately without finishing the review — the author is already building on top of this change.
3. Everything else in a logical order. Consider reading tests before implementation.
4. If the change is too large to find the main part: ask what to read first, or ask for a split.

Reading perspectives (one pass per hat, in place of a single generic pass):

| Hat | Questions while reading | Defect class it catches |
|---|---|---|
| **User** | Slow network? Empty list? Double click? What does the user see when the server errors? | Unhappy paths, empty state, loading state |
| **Maintainer, six months out** | Do I understand this? Are there now two ways to do the same thing in the repo? What breaks if I delete it? | Duplication, misplaced abstraction, misleading names |
| **Breaker** | Null, empty string, negative, boundary, timezone, concurrency, very large data | Edge cases |

Also to be written up: when the diff view is insufficient and the branch must be checked out locally (the diff cannot show *what should have changed but did not*, nor *locally correct but wrong in context*), and the verification ladder before posting a comment — re-read in context → search for counter-evidence → cite the written decision → **write a failing test**. A wrong review comment is a false positive and it spends the reviewer's credibility.

### 3b. The human-only checklist (residue after automation)

Design rule: **anything a machine can check must be removed from the human checklist.** The human list holds only what needs judgement about intent. Target size ~3–5 blocking items plus ~7–10 minor. Every item must be answerable yes/no from the diff and must cite a written decision. Adding an item requires naming one to drop or automating it within a month.

Already automated, therefore **not** on the human list: 4px grid and typography tokens (`scripts/scale-audit.js`), landing copy dictionary + em-dash (`landing-copy.spec.ts`), RTE 4-column contract (`rte-canonical-contract.spec.ts`), responsive mixins (stylelint), types (`tsc`), formatting (husky + lint-staged), FE file naming/location (lint + generators).

Candidate human residue, drawn from the `CLAUDE.md` guardrail table:
1. Is there hand-written markup duplicating something that already exists in `libs/*/shared/ui`? (**highest value** — this is the measured AI failure mode; see GitClear above)
2. Any user-visible string hardcoded in landing instead of `LANDING_COPY`?
3. Did a landing UI change ship without the matching `/ddl` update in the same commit?
4. Do console detail pages use the `console-record-*` family rather than `.detail-field`?
5. Any new hotkey without an `isEditableTarget` guard or missing from the inventory?
6. Is the edited component documented in `.context/design/components/`, and is that doc still true?
7. Did status-in-time wording leak into a timeless guidance doc?

### 3c. Gates, each with a *different* oracle

Adding a gate that reads from the same belief as an existing one adds nothing.

| Gate | Its oracle | What only it catches | Current state |
|---|---|---|---|
| 0. Acceptance criteria written **before** implementation, in a separate session | Intent, frozen before any code is seen | Code that is correct but solves the wrong problem | Half present — `.context/tasks/*.md` is the vehicle; the discipline of writing it first is not enforced |
| 1. Machine shape checks | Written rules compiled into code | Token/spacing/location/copy violations | Strong already |
| 2. `tsc` + existing test suite | Existing type and behaviour contracts | Regressions, broken call sites | Present |
| 3. **Mutation probe on every AI-written test** | The code itself, deliberately broken | **Complicit tests** — code and test derived from the same misunderstanding, so green proves only that they agree | **Missing. Largest gap** |
| 4. Human reading under the three hats | The reviewer's domain knowledge | Duplication, wrong business behaviour, unhappy paths | Unstructured today |
| 5. A fresh Claude session that has not seen the implementation conversation | A different context | Assumptions locked in by the original conversation | `/code-review` and `/simplify` exist, not used as a gate |

Note on gate 5: a fresh session buys **context independence, not oracle independence**. Same model, same priors, same blind spots. Worth doing, but it is not a second reviewer.

### 3d. Rules to add to `CLAUDE.md` (candidates, in priority order)

1. **Every AI-written test must fail once before it is trusted.** Break the exact line the test claims to guard, re-run, confirm red, restore. (~2 min per test.) Proven necessary twice in this repo: `contact-message.dto.spec.ts` (the `turnstileToken` test passed identically with `.min(1)` removed) and `date-format.util.spec.ts` (the first version passed with the UTC getters removed).
2. **Freeze acceptance criteria in the task file before implementation starts**, in a separate session from the implementation.
3. **Declare reuse.** On any substantial change, state what was reused, what was newly created, and why reuse was not possible.
4. **Split mechanical from meaningful by commit**, not just by PR. A mechanical commit may not contain a single behaviour change; a refactor commit may not modify tests.
5. Add a reading guide to substantial changes: which files carry the decisions, which are noise, and how the author verified.

### 3e. Sizing

Measure a change by **review surface** — the number of decisions a human must make — not by file count. A 60-file tool-driven rename has a review surface of 1. A 3-file change to pricing logic can have a surface of 10. This reframing is what makes the Cisco thresholds usable in an Nx monorepo where scaffolding and renames routinely touch dozens of files.

## 4. Open questions

- Where does the reading procedure live? A new `.context/guides/code-review.md`, or folded into `testing-guide.md`?
- Should the mutation-probe rule be a `CLAUDE.md` guardrail row, a skill, or a hook? A hook cannot verify it; a skill could drive it.
- Is a per-review "what I did NOT look at" note worth the friction for a solo developer, or is it only meaningful with a second person?
- Does gate 0 survive contact with reality, or does the AC always end up being written in the same session as the code?

## 5. Proposed phases

| Phase | Content |
|---|---|
| 0 | Refine this epic with the learner; lock which candidates become real |
| 1 | Write the reading procedure doc (3a) and the human checklist (3b) |
| 2 | Add the accepted `CLAUDE.md` rules (3d), starting with the mutation-probe rule |
| 3 | Trial on real changes for a few weeks; record what the procedure caught and what it missed |
| 4 | Prune. Remove every checklist item that never fired and every gate that never caught anything |

---

*Source of this epic: Testing learning loop, V9 Static testing & reviews. Session record in `~/Code/personal/learning/domains/testing/log.md`.*
