---
name: Long Form Layout
category: pattern
principles: [chunking-progressive-disclosure]
tags: [form, settings, layout, navigation, scrollspy, tabs, wizard]
---

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

## Project Decision (Console — adopted 2026-04-13)

**Universal chassis: sectioned cards + sticky scrollspy left rail. No tabs inside a page.**

Layout:
```
┌─────────────────────────────────────────────────┐
│ Page Header — title           [Save bar (atomic)]│
├──────────────┬──────────────────────────────────┤
│ ● Identity   │  [Section card: Identity]       │
│ ○ Work       │  description-left/form-right    │
│ ○ Skills     │                                  │
│ ○ …          │  ──── 32px gap, no rule ────    │
│              │  [Section card: Work]           │
│ (sticky)     │                                  │
└──────────────┴──────────────────────────────────┘
```

### Rules
- **Cross-page navigation = routes, not tabs.** Profile / Account / Notifications / Billing are separate routes.
- **In-page navigation = sticky scrollspy left rail.** Single source of in-page nav.
- **No 3-column layouts.** Console sidebar may collapse on long-form detail pages to keep visual density low.
- **Section cards**: each uses [Settings Section pattern](settings-section.md) (description-left / form-right).
- **Save mechanic chosen by module type** (see decision tree above).
- **Section status on rail**: dirty / error / saved indicators visible regardless of save mechanic.

### Rejected alternatives (with reason)
- Three-column layout (console sidebar + scrollspy rail + content) — visually crowded
- Top tabs + scrollspy hybrid — duplicates navigation; tabs better expressed as routes
- Accordion as primary structure — too click-heavy; 1-line summaries don't carry enough info

## Angular Implementation Notes
- **Scrollspy**: Angular CDK `ScrollDispatcher` + `IntersectionObserver` (no third-party library)
- **Routing**: cross-page nav uses Angular Router; in-page nav uses fragment links + smooth scroll
- **Form state**: see save mechanic — per-section uses child FormGroups with isolated dirty state; atomic uses single FormGroup + `CanDeactivate` guard

## Sources
- [NN/G — Wizards: Definition and Design Recommendations](https://www.nngroup.com/articles/wizards/)
- [Smashing — Better Form Design: One Thing Per Page](https://www.smashingmagazine.com/2017/05/better-form-design-one-thing-per-page/)
- [PatternFly — Progressive form vs. wizard](https://medium.com/patternfly/comparing-web-forms-a-progressive-form-vs-a-wizard-110eefc584e7)
- [PatternFly — Wizard guidelines](https://www.patternfly.org/components/wizard/design-guidelines/)
- [Eleken — Wizard UI Pattern](https://www.eleken.co/blog-posts/wizard-ui-pattern-explained)
- [Bram.us — Sticky ScrollSpy Navigation](https://www.bram.us/2020/01/10/smooth-scrolling-sticky-scrollspy-navigation/)
- [GitHub Primer — Layout patterns](https://primer.style/foundations/layout/)
- [Stripe — Design patterns for Stripe Apps](https://docs.stripe.com/stripe-apps/patterns)
