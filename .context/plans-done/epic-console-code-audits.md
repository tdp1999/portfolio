# Epic: Console Code Audits

## Summary

Three investigations that scan the codebase before any code is written. Each produces an investigation note (findings + recommendation). Remediation is **not** part of this epic — fixes are scheduled separately or folded into Epic: Form System Design Foundations where relevant.

## Why

Three of the user's manual-test notes are **questions about current state**, not bug reports. We cannot plan fixes without first knowing the truth on the ground:

1. **Input validation coverage** — User wants every number/date/free-text field validated (type guards, min/max, pattern). Current state unknown — could be 80% done or 20% done.
2. **Skill ↔ "main technology" semantics** — Experience form has a "skill" field. User believes it should be labeled "main technology" but is unsure if BE is wired such that selecting a skill in Experience reuses the global Skill entity. If yes, "create skill" while editing Experience = creating a domain-level Skill, which is unintuitive.
3. **`effect()` in constructor** — User has seen `effect()` calls inside component constructors and wants to know whether this is acceptable (vs. field-initializer placement). Question is general — needs codebase-wide audit + a written rule.

## Target Users

- Future contributors (codebase rules).
- User (deciding on fixes after data is in hand).

## Scope

### In Scope

- **Validation audit:** enumerate every form input across console; per input record type, validators present, validators expected. Output: a table identifying gaps.
- **Skill audit:** read Prisma schema, Experience entity, Experience form FE wiring. Determine: does Experience.skills FK to global Skill? What happens when user "creates" a skill in Experience form? Output: 1-page note + recommendation.
- **Effect-in-constructor audit:** grep every `effect(` call in `apps/console` + `libs/console`; classify by location (constructor vs field initializer). Document Angular best practice with sources. Output: rule added to `angular-style-guide.md` + list of offenders.

### Out of Scope

- Fixing any of the findings — this epic produces investigation artifacts only. Follow-up fixes will be planned separately.

## High-Level Requirements

1. `validation-audit.md` lists every console input with current vs expected validators; gaps marked.
2. `skill-experience-semantics.md` answers: are they the same entity? Is "create skill from Experience" intentional? Recommendation written.
3. `angular-style-guide.md` has a new section on `effect()` placement with a clear rule + reasoning. Offending files listed (path only, no fix yet).

## Technical Considerations

### Files / Areas Likely Touched (Read-only)

- All `*-form-page` and `*-form` components in `libs/console/feature-*`.
- `apps/api/prisma/schema.prisma`, Experience BE module, Experience FE module.
- All `effect(` call sites in `apps/console` + `libs/console`.

### Output Artifacts

- `.context/investigations/validation-audit.md` (or merged into one investigation file)
- `.context/investigations/skill-experience-semantics.md`
- New section in `.context/angular-style-guide.md`

## Risks & Warnings

⚠️ **Investigation scope creep**
- Easy to start fixing while auditing.
- Discipline: write findings, stop. Fixes go into a follow-up.

## Success Criteria

- [ ] All three artifacts written and reviewed by user.
- [ ] No code changes outside `.context/*` and `angular-style-guide.md`.

## Estimated Complexity

M

**Reasoning:** Reading-heavy, no implementation. Validation audit is the largest piece due to surface area.

## Outputs (delivered 2026-04-28)

- `.context/investigations/inv-console-validation-audit.md` — full per-form validator table + cross-cutting findings + recommendations.
- `.context/investigations/inv-skill-experience-semantics.md` — Experience.skills FK confirmed, no inline-create exists; label change is safe.
- `.context/angular-style-guide.md` § "Computed & Effects" — placement convention noted: constructor is the project convention; field initializer is valid but unused. No offenders flagged after research showed Angular docs do not mandate either placement.

## Status

done

## Created

2026-04-27
