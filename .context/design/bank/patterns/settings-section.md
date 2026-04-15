---
name: Settings Section
category: pattern
principles: [chunking-progressive-disclosure]
tags: [form, settings, layout, section-card]
---

## Pattern: Description-left / Form-right
- Left column (~30–35%): section title + helper description
- Right column (~65–70%): form fields
- Each section = independent card

```
┌────────────────────────┬─────────────────────────────┐
│ Identity               │ [Avatar]                    │
│ Your public profile    │ [Display name] [Username]   │
│ info shown across…     │ [Title]        [Status]     │
│                        │ [Bio]                       │
└────────────────────────┴─────────────────────────────┘
```

## Why
- Uses full content width (vs narrow centered column with empty right half)
- Helper text doesn't crowd field labels
- Sections are visually parseable when scanning the page
- Matches the dominant pattern in Stripe / GitHub / Vercel / Linear settings

## Field-level Rules
- Single column inside the right side (~640–720px max ≈ 45–75 char line length)
- Match input width to expected content (don't full-width an "Age" input)
- Labels above inputs, not inline (responsive-friendly)
- Section divider = 32px vertical spacing, no horizontal rule

## Section Structure (chunking)
- 4–8 sections per page, 3–8 fields per section
- Section title: short noun (Identity, Work, Social, Privacy)
- Each section answers one user question ("Who am I?", "What do I do?")
- Required / high-priority sections first

## Status Indicators (per section, shown in scrollspy rail)
- `✓` Saved
- `●` Editing (dirty)
- `⚠` Error after submit
- `○` Untouched

## Anti-patterns
- Form sitting left-aligned with `max-width`, container untreated → empty right half looks broken
- Right-aligned panes (GitHub Primer: scrollbar conflicts with page scrollbar)
- Helper text crammed under each field label instead of section-level
- Multi-column field layout when fields are not semantically paired

## Sources
- [Stripe — Design patterns for Stripe Apps](https://docs.stripe.com/stripe-apps/patterns)
- [GitHub Primer — Layout](https://primer.style/foundations/layout/)
- [Baymard — Avoid Extensive Multicolumn Layouts](https://baymard.com/blog/avoid-multi-column-forms)
- [UXPin — Optimal Line Length for Readability](https://www.uxpin.com/studio/blog/optimal-line-length-for-readability/)
- [Fresh Consulting — Text Box Width Should Help Users Read](https://www.freshconsulting.com/insights/blog/uiux-principle-46-text-box-width-should-help-users-read/)
- [Adham Dannaway — Match form field width to input length](https://www.linkedin.com/posts/adhamdannaway_ui-design-tip-match-form-field-width-activity-7389669953525772288-rDzO)
- [Eleken — Profile page design examples](https://www.eleken.co/blog-posts/profile-page-design)
