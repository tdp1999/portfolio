---
component: landing-about-experience
status: stable
related: [chips, landing-link]
---

# about-experience

> Sticky-tab career history block for the About page. Desktop: vertical tablist on the left rail + persistent detail panel on the right. Mobile (< 768px): accordion, default-open = latest role. One detail template renders both modes.

## Why this exists

The previous landing page exposed work history as a separate `/experience` route rendering a vertical timeline. The About page rework absorbs that surface — visitors land once and read everything in context. The pattern is **structurally different** from a timeline (selecting one role at a time, persistent right panel), so the old `feature-experience` lib is deleted, not refactored. This component owns the new layout end-to-end.

## Use when

- Embedded in `feature-about` only — anchor `#experience`.
- Data source is `ExperienceService.getPublicExperiences()` — list of public roles, reverse-chronological.

## Don't use when

- A console / admin surface — Material `mat-tab-group` is the right tool there.
- A surface needs all roles visible at once (case-study export, print view) — render an un-tabbed list.

## Behavior contract

- **Order:** reverse-chronological. Current roles (`endDate === null`) outrank all dated roles; within current and within past, latest `startDate` first.
- **Selected state:** single signal `selectedIndex`. Default `0` (latest). Accordion-collapsed = `-1`.
- **Tab click (desktop):** sets `selectedIndex`; clicking the active tab is a no-op. Fragment updates via `replaceUrl: true` so the browser back stack isn't polluted.
- **Accordion toggle (mobile):** clicking the open row collapses it (`selectedIndex = -1`); clicking another opens it. Fragment is only pushed when *opening* — collapse keeps the fragment as-is.
- **Deep link:** route fragment `#experience-<slug>` sets initial tab and tracks future fragment changes. Unknown fragments are ignored; default `0` stands.
- **Keyboard (tablist):** roving tabindex. `ArrowDown`/`ArrowRight` next, `ArrowUp`/`ArrowLeft` prev (wraps), `Home` first, `End` last. Activation is immediate (no separate Enter step) — matches `automatic` activation per WAI-ARIA APG.
- **Keyboard (accordion):** native `<button>` semantics — Enter and Space toggle.
- **SSR:** `BreakpointObserver` returns no active match server-side, so the component renders the **desktop branch** in SSR. After hydration, the mobile branch swaps in for narrow viewports. A brief visual swap is acceptable — both branches share the detail template and route from the same data.

## Field rendering rules

All fields come from `PublicExperience`; missing/empty fields collapse cleanly (no stray separators or empty wrappers).

| Field | Renders as | Notes |
|---|---|---|
| `position` | Detail header — bolded role title | Localized via `getLocalized(field, locale)`. |
| `companyName` | Detail header (after position + `·`), also tab label | Linkified when `companyUrl` present. |
| `companyUrl` | `<a target="_blank" rel="noopener noreferrer">` around company name | When null, plain `<span>`. |
| `companyLogoUrl` | 40 × 40 rounded square in detail; 32 × 32 in mobile accordion header | Falls back to `companyInitial` (first letter, uppercase). `(error)` handler hides broken `<img>`. |
| `startDate` / `endDate` | "May 2024 – Present" / "Jan 2021 – Apr 2024" | Locale-locked English month abbrevs (consistent across EN/VI shells). `endDate === null` → "Present". |
| `domain` | Inline label row: "Domain: Fintech" | Hidden when null. Inline rather than chip — keeps meta block compact. |
| `employmentType`, `locationType`, `locationCity`, `locationCountry`, `teamRole`, `teamSizeMin/Max` | Meta strip — `<ul>` with `·` separators | Built by `buildMetaItems()`; falsy fields are skipped so the strip never produces "·  ·". |
| `highlights[]` | Bulleted list — primary content, body-md, `▹` bullet in accent color | Localized array. |
| `responsibilities[]` | Collapsible `<details>` with "Day-to-day" / "Công việc hàng ngày" summary | Closed by default. Disc bullets, body-sm. |
| `skills[]` | `<landing-chip size="sm">` row | Localized name; chip family handles wrapping. Wrapped in `role="list"` for SR. |
| `links[]` | `<ul>` of `<landing-link [arrow]="true">` | Renders below the skills row. Kind auto-detected from URL. |

## Implementation rules

- One `<ng-template #detail>` powers both modes. Tab panel and accordion panel both consume it via `[ngTemplateOutlet]` — keeps field rendering DRY.
- Tablist ARIA: `role="tablist"` (with `aria-orientation="vertical"`), `role="tab"` per button, `role="tabpanel"` per panel, `aria-controls` / `aria-labelledby` pair. Each tab has `tabindex="0"` only when selected; others `-1` (roving focus).
- Accordion ARIA: button `aria-expanded` + `aria-controls`; panel has `role="region"` + `aria-labelledby`. Hidden panels use `[hidden]` (not `display: none`) so screen readers and `:target` deep-link work correctly.
- Sticky rail: `position: sticky; top: 96px;` — the same anchor offset used by the in-page TOC sidebar.
- Active tab visual: accent border-left + accent text + subtle surface fill. Hover-only state has muted surface and lighter text. Active state owns the rail's border via `margin-left: -1px`.
- Mobile chevron: rotates 180° via `[aria-expanded='true']` selector — no JS class toggle.
- Date range formatting is locale-locked to `en-US` month abbrevs — same convention as the prior career-history component. If the project later switches to bilingual month names, change `formatMonth()` and update this rule in the bank.

## Quality checklist

- [ ] Selecting a tab on desktop updates the URL fragment to `#experience-<slug>` without polluting history.
- [ ] Reloading the page on `/about#experience-<slug>` lands on that tab pre-selected.
- [ ] Mobile: opening then re-clicking the same row collapses it; clicking another opens it.
- [ ] Mobile default open is the **first (latest)** role.
- [ ] Tab focus: Tab key enters the tablist, arrow keys move between tabs, Home/End jump to ends, focus visibly moves.
- [ ] All `<button>` controls have visible `:focus-visible` rings.
- [ ] Company logo broken-URL fallback: initial circle shows.
- [ ] Empty `endDate` renders "Present" + a "· Current" accent tag in the detail title.
- [ ] Empty meta-item fields collapse cleanly — no "·  ·" runs in the meta strip.
- [ ] Long company names wrap on the tab without overflowing the rail.
- [ ] SSR: page renders desktop view server-side; hydration swap to mobile branch only triggers JS, no console errors.

## Edge cases

- **No experiences:** renders a single-line "Career history coming soon." inside the section. No layout shell.
- **Single experience:** desktop tablist renders one tab — still valid (anchors keyboard focus to a single target). Mobile accordion shows one open row.
- **Unknown fragment** (e.g. `#experience-someone-removed`): selection falls back to `0` (latest); fragment is left alone so the browser URL still matches what the user pasted.
- **Skills list empty:** the skills row is dropped entirely, not rendered as an empty `<div>`.

## See also

- `chips/_overview.md` — chip family rules used for skill list
- `segmented-control.md` — when to reach for a segmented control instead of tabs (mutually exclusive view-mode toggles, not navigation between content panels)
