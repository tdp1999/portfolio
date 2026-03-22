# Epic: Console UI Redesign

## Summary

Redesign the console/dashboard application from its current plain Material Design appearance to a polished, dark-themed admin dashboard. Applies approved design direction from Stitch prototyping: status-oriented layout (B), grain+glow background, gradient pill sidebar indicator, consistent CRUD screens with expanded filters, fixed-bottom pagination, and footer with ToS/version.

## Why

The current console is functional but visually raw — default Material styling, white/light theme as base, no visual hierarchy beyond basic layout. A redesign improves the professional feel of the admin tool, establishes visual consistency across all CRUD screens, and creates a polished experience that matches the quality of the landing page.

## Target Users

- Site owner (Phuong Tran) — primary admin user
- Future invited collaborators/editors

## Scope

### In Scope

- Layout shell: sidebar, topbar, content area, footer redesign
- Background pattern (grain noise + radial glow)
- Sidebar active indicator (gradient pill + glow)
- Dashboard page: welcome greeting, stat cards (mock data), recent activity, quick actions
- CRUD template: consistent header/filters/table/pagination across Tags, Categories, Skills, Users
- Filter bar expansion: search + dropdown + date range picker patterns
- Fixed-bottom pagination bar
- Footer: copyright + ToS + Privacy + version
- Subtle visual effects: box-shadow, hover glow, smooth transitions
- Dark mode polish (already exists, needs visual refinement)

### Out of Scope

- New backend APIs (stats, activity feed — use mock data for now)
- New functional features (search backend, notifications)

### Planned Follow-ups (separate epics)

- **Mobile/responsive redesign** — requires separate exploration + Stitch mobile screens
- **Search + Notifications backend** — API work, different scope

## High-Level Requirements

### Layout Shell (Tasks 010-030)

1. **Background pattern**: Add grain noise texture (SVG feTurbulence, ~3% opacity, soft-light blend) + single radial glow (indigo, ~6% opacity) behind main content area
2. **Sidebar active indicator**: Replace current highlight with gradient pill + glow effect (linear-gradient 135deg indigo→violet, faint border, subtle box-shadow)
3. **Topbar**: Add global search input (UI only, no backend), keep theme toggle, add notification bell icon (UI only)
4. **Footer**: Fixed bottom bar — "© 2026 Console Portfolio Management" left, "Terms of Service · Privacy Policy" center, "v1.0.0" right
5. **Sidebar visual polish**: Consistent spacing, section labels (ADMIN/SYSTEM), user footer with avatar+name+badge+email

### Dashboard Page (Task 040)

6. **Welcome section**: "Welcome back, [userName]" heading + subtitle
7. **Stat cards**: 4 cards in a row — Total Posts, Media Files, Published, Drafts (mock data, prepared for future API)
8. **Recent activity**: List of 3-5 recent actions with timestamps (mock data)
9. **Quick actions**: "New Content" + "Media Library" shortcut buttons

### CRUD Template (Tasks 050-070)

10. **Page header**: Title (left) + primary action button (right), same baseline. Subtitle below.
11. **Filter bar**: Expandable row with search input + dropdown selects + date range (all dark-filled style, rounded-lg)
12. **Data table**: Surface container with rounded-xl, subtle border. Header row uppercase muted. Row hover state. 3-dot action menu per row.
13. **Fixed-bottom pagination**: Sticky bar above footer — "Items per page: 20" left, "1-5 of N" + nav arrows right

### Apply to CRUD Screens (Tasks 080-090)

14. **Tags page**: Search + (future: status filter)
15. **Categories page**: Search only
16. **Skills page**: Search + Category dropdown
17. **Users page**: Search + Status dropdown

### Media Page Redesign (Task 100)

18. **Storage stats row**: Total files, total size, breakdown by type
19. **Upload dropzone**: Dashed border, cloud icon, drag-and-drop + browse link
20. **Grid view**: 4-column card grid with thumbnails, filename, type/size badges, checkbox selection
21. **List view**: Table with thumbnail column, same filters
22. **Batch operations**: Selection bar with count + bulk delete
23. **Trash link**: Badge with deleted count near title
24. **Stitch reference**: screen `0a404f030ad1` (Media Library)

### Auth Pages Redesign (Tasks 110-120)

25. **Login page**: Full-page centered card, grain+glow background, logo, email/password fields, "Forgot password?", Google OAuth button
26. **Forgot/Reset password**: Same card layout, simplified form
27. **Set password (invite)**: Same card layout
28. **Stitch reference**: screen `bbe44133aede` (Login Page)

### Light Mode (Task 130)

29. **Token swap**: Ensure all new components use semantic tokens (not hardcoded dark colors)
30. **Light mode override**: Create light-mode-compatible versions of grain texture, glow, sidebar indicator
31. **Verify all screens**: Both themes must work on every page

### Visual Effects (cross-cutting, Task 140)

32. **Box-shadow**: Subtle shadow on stat cards, table container (`0 1px 3px rgba(0,0,0,0.3)`)
33. **Hover glow**: Interactive elements get `box-shadow: 0 0 20px -5px rgba(99,102,241,0.15)` on hover
34. **Transitions**: All interactive elements `transition: all 0.15s ease`
35. **No animations**: No parallax, bouncing, scaling, or attention-grabbing effects

## Technical Considerations

### Architecture

- All changes are **FE-only** — no backend modifications
- Changes concentrated in:
  - `libs/console/shared/ui/` — shared layout, filter bar, new components
  - `apps/console/src/styles.scss` — global background pattern, grain overlay
  - `libs/console/feature-*/` — per-page template updates
- Follows existing Angular Material + Tailwind + SCSS hybrid approach
- Uses existing semantic token system from `design/foundations.md`

### Key Files to Modify

| File | Change |
|------|--------|
| `libs/shared/ui/sidebar/` | Gradient pill active indicator (direct modification) |
| `libs/console/shared/ui/src/lib/main-layout/` | Topbar search, footer, layout polish |
| `libs/console/shared/ui/src/styles/material/_overrides.scss` | Table/button hover effects |
| `apps/console/src/styles.scss` | Grain overlay, radial glow background |
| `libs/console/shared/ui/src/lib/filter-bar/` | Expand filter bar patterns |
| `apps/console/src/app/pages/home/` | Dashboard content redesign |
| `libs/console/feature-tag/` | Apply CRUD template |
| `libs/console/feature-category/` | Apply CRUD template |
| `libs/console/feature-skill/` | Apply CRUD template |
| `libs/console/feature-admin/` | Apply CRUD template (users) |
| `libs/console/feature-media/` | Media page redesign (grid, upload, stats) |
| `libs/console/feature-auth/` | Login + reset/forgot/set password pages |

### Dependencies

- No new packages needed — grain texture is pure CSS/SVG
- Mock data for dashboard stats (no API required)
- Existing `ui-sidebar-*` components from `libs/shared/ui/sidebar/`

### Design References

- **Stitch project**: `17973930401225587522` (model: GEMINI_3_1_PRO)
  - Screen `783d02d6` — Dashboard B (approved layout reference)
  - Screen `bbe44133aede` — Login Page (approved)
  - Screen `0a404f030ad1` — Media Library (needs UI refinement on Stitch)
- **DESIGN-console.md**: `.context/DESIGN-console.md`
- **Playwright dark screenshots**: `C:/Users/Carbon gen 10/console-screenshots/dark-*.png`
- **Background CSS**: Grain (SVG feTurbulence 3% opacity soft-light) + Radial glow (indigo 6% opacity)
- **Sidebar CSS**: Gradient pill (indigo→violet 15%→8%, border 10%, glow 15%)

## Risks & Warnings

⚠️ **Sidebar component changes**
- `ui-sidebar-*` in `libs/shared/ui/sidebar/` will be modified directly (approved by user)
- These changes affect all apps using the sidebar (currently only console)
- Mitigation: Ensure changes are backwards-compatible; test sidebar in all consuming apps

⚠️ **Grain texture performance**
- SVG feTurbulence as pseudo-element is lightweight but needs `pointer-events: none`
- On low-DPI displays, grain can look like compression artifacts if opacity too high
- Mitigation: Start at 2.5% opacity, test on multiple displays

⚠️ **Filter bar complexity varies per page**
- Each CRUD page has different filters (some have 1, some have 3)
- Filter bar component needs to be flexible, not one-size-fits-all
- Mitigation: Use existing FilterBarComponent composition pattern (FilterSearch + FilterSelect)

⚠️ **Mock data for dashboard**
- Stats and activity feed use hardcoded data initially
- Must be structured so backend integration is straightforward later
- Mitigation: Create interfaces/types for stat cards and activity items now

## Task Breakdown

### Phase 1: Layout Shell
| # | Task | Description | Complexity |
|---|------|-------------|------------|
| 180 | Background pattern | Add grain noise + radial glow to console global styles | S |
| 181 | Sidebar polish | Gradient pill active indicator in ui-sidebar-*, spacing, labels | M |
| 182 | Topbar + Footer | Search input (UI), notification bell, footer bar | M |

### Phase 2: Content Pages
| # | Task | Description | Complexity |
|---|------|-------------|------------|
| 183 | Dashboard page | Welcome, stat cards, recent activity, quick actions (mock data) | M |
| 184 | CRUD template | Page header + filter bar + table container + fixed pagination | M |
| 185 | Apply to Tags + Categories | Apply CRUD template to these two pages | S |
| 186 | Apply to Skills + Users | Apply CRUD template (with their specific filters) | S |

### Phase 3: Specialized Pages
| # | Task | Description | Complexity |
|---|------|-------------|------------|
| 187 | Media page redesign | Grid/list views, upload dropzone, stats, batch ops, trash link | L |
| 188 | Auth pages redesign | Login, forgot/reset/set password — centered card layouts | M |

### Phase 4: Light Mode + Polish
| # | Task | Description | Complexity |
|---|------|-------------|------------|
| 189 | Light mode | Token-based theme swap for all new components + verify all screens | M |
| 190 | Visual effects | Box-shadow, hover glow, transitions across all components | S |

### Phase 5: Validation + Docs
| # | Task | Description | Complexity |
|---|------|-------------|------------|
| 191 | Playwright validation | Screenshot all screens (dark+light), compare with Stitch reference | S |
| 192 | Update design docs | Update console.md + DESIGN-console.md with final implementation | S |

## Success Criteria

- [ ] All console screens use dark theme with grain+glow background
- [ ] Sidebar shows gradient pill+glow on active item (in ui-sidebar-* directly)
- [ ] Dashboard shows welcome + stats + activity + quick actions
- [ ] All CRUD pages share consistent header/filter/table/pagination layout
- [ ] Media page: grid/list views, upload dropzone, storage stats, batch selection
- [ ] Auth pages: polished login with grain+glow bg, centered card, Google OAuth button
- [ ] Light mode works on all screens (token-based swap)
- [ ] Pagination is fixed at bottom, above footer
- [ ] Footer shows copyright + ToS + Privacy + version on all pages
- [ ] Visual effects are subtle (box-shadow, hover glow, transitions only)
- [ ] No regressions in existing functionality
- [ ] Playwright screenshots match approved Stitch direction (both themes)

## Estimated Complexity
XL

**Reasoning:** Pure FE work, no backend changes. But 13 tasks across 5 phases, touching shared sidebar components, multiple feature libs, global styles, auth pages, media page, and light mode support. Each phase can be delivered independently.

## Status
broken-down

Broken down into tasks 180-192 on 2026-03-22.

## Created
2026-03-22
