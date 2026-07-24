---
name: Long Form Layout
category: pattern
principles: [chunking-progressive-disclosure]
tags: [form, settings, layout, navigation, scrollspy, tabs, wizard]
---

> **Universal kernel:** `→ skill patterns/long-form-layout` holds the portable pattern-choice
> and save-strategy decision matrices. This file keeps the project's decision (ADR-024,
> `console-section-tabs`), its rejected alternatives, and the Angular wiring. The generic
> matrices are repeated below only as the context the project decision was made against.

## The 5 Viable Patterns

| Pattern | When to use | Real-world examples |
|---|---|---|
| **Wizard** (multi-step) | Rare task, sequential, dependencies between steps | Onboarding, KYC, checkout, tax filing |
| **Progressive single page + sticky scrollspy nav** | Frequent edit, random access, related sections | Stripe, Linear, Vercel, GitHub |
| **Tabs** | Frequent edit, fully independent concerns | Notion, Slack, VS Code settings |
| **Accordion** | Many optional sections, mobile-heavy | Checkout accordion, advanced settings |
| **One Thing Per Page** | Very long form + novice users + need focus | GOV.UK, mortgage applications |

## Decision Matrix (2 axes)

```
                  Frequent edit
                       │
        Single-page    │   Tabs
        progressive    │   (parallel)
                       │
   Sequential ─────────┼──────── Random access
                       │
           Wizard      │   One Thing
                       │   Per Page
                       │
                  Rare/onboarding
```

## Save Strategy Selection

| Strategy | When | Examples |
|---|---|---|
| **Auto-save on blur** | Best UX; needs optimistic UI + conflict handling | Notion, Linear |
| **Save per section** | Each section = independent form, no cross-section blocking | Stripe settings |
| **Atomic save (sticky bar)** | Domain entity with cross-field invariants; all-or-nothing | GitHub repo settings, Stripe Connect |

See [`atomic-save.md`](atomic-save.md) for the full atomic-save UX pattern.

## When Atomic vs Per-Section?

| Module type | Save mechanic | Why |
|---|---|---|
| **Settings / Preferences** (loose collection) | Per-section save | Sections are independent; user edits one at a time; partial save reduces friction |
| **Domain entity** (transactional, cross-field invariants) | Atomic save | Validation depends on multiple fields; partial save would leave entity in invalid state |

## Anti-patterns

- Single Save button at the bottom of a 50-field page (lose-everything-on-error)
- Wizard for editable settings (cripples random access)
- Default-collapsed accordion with no completion hints
- Vague / overlapping tab labels ("General", "Other")
- Sticky nav without scrollspy (user loses orientation when scrolling)
- Accordion as primary structure when 1-line summary doesn't carry enough info

## Project Decision (Console)

**Universal chassis: `console-section-tabs` — vertical-tab section navigation.** A grouped rail
(desktop) / horizontal scrollable strip (mobile) swaps to show one section card at a time. This
superseded the earlier scrollspy long-form (all cards stacked in one scroll) once profile grew to
~10 screens and fields became hard to find. See ADR-024.

Layout:
```
┌─────────────────────────────────────────────────┐
│ Page Header — title           [Save bar (atomic)]│
├──────────────┬──────────────────────────────────┤
│  PROFILE     │  [Section card: Identity]        │
│ ✓ Identity   │  description-left / form-right    │
│ ● Work       │                                   │
│ ○ Skills     │  only the ACTIVE section shows;   │
│  META        │  others stay mounted + hidden     │
│ ○ SEO        │                                   │
│ (sticky rail)│         [ ← Prev  ·  Next → ]     │
└──────────────┴──────────────────────────────────┘
```

### Rules
- **Cross-page navigation = routes, not this.** Profile / Account / Notifications / Billing are separate routes.
- **In-page navigation = `console-section-tabs`.** The rail swaps sections (click-to-show, not scroll-to). Single source of in-page nav.
- **Sections stay mounted** via `[hidden]` (never `@if`), so unsaved edits + per-section status survive tab switches.
- **Grouped or flat**: pass `groups` for a labelled rail (e.g. profile: Profile / Landing copy / Meta) or the flat `sections` convenience for one ungrouped list.
- **Mobile**: the rail collapses to a horizontal scrollable strip below laptop.
- **Deep-link** via URL fragment (`/profile#section-contact`), reactive to browser back/forward.
- **Section cards**: each uses [Settings Section pattern](settings-section.md) (description-left / form-right).
- **Save mechanic chosen by module type** (see decision tree above); per-section card footers or the atomic sticky save bar still apply.
- **Section status on rail/strip**: untouched / editing / saved / error icons, regardless of save mechanic.
- **Splitting an atomic BE block**: split into multiple tabs for findability but keep one shared form + one save (see ADR-024, profile Landing Content).

### Rejected alternatives (with reason)
- Scrollspy long-form (all cards stacked, scroll-to) — retired: grew to ~10 screens on profile; fields hard to locate.
- Horizontal top tabs — 8+ sections with long labels exceed the NN/g 5–7 guideline; would overflow or force scrollable tabs (hidden tabs, worse scanning).
- Three-column layout (console sidebar + rail + content) — visually crowded.
- Accordion as primary structure — too click-heavy; 1-line summaries don't carry enough info.

## Angular Implementation Notes
- **Chassis**: `console-section-tabs` (`libs/console/shared/ui`) owns the rail/strip/stepper, active-tab state, and fragment deep-link; consumers project section cards gated by `[hidden]="activeId() !== '<id>'"`.
- **Routing**: cross-page nav uses Angular Router; in-page tab state syncs to the URL fragment (reactive).
- **Form state**: per-section uses child FormGroups with isolated dirty state; atomic uses a single FormGroup + sticky save bar + `CanDeactivate` guard.
- **Legacy**: `LongFormLayout` + `ScrollspyRail` remain in the lib but are superseded — do not use them for new forms.

## Sources

External provenance lives in the skill: `→ skill sources.md` (rows for `long-form-layout`).
