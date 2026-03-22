# Design System: Portfolio — Console

> Stitch-compatible AI-readable spec for the console/dashboard application.
> Source of truth is `.context/design/foundations.md` + `.context/design/console.md`.

## Visual Theme & Atmosphere

Functional, dense dashboard for content management. Clean and utilitarian — prioritizes usability and information density over visual flair. Angular Material v21 as the primary component system with custom semantic token overrides.

## Color Palette & Roles

Shares the same semantic token layer as landing (see DESIGN-landing.md), but applied through Material Design token system:

- **Deep Midnight** (#0f1117) — Page background
- **Slate Surface** (#1a1d27) — Card and panel backgrounds
- **Azure Accent** (hsl 210, 65%, 50%) — Primary actions, active states
- **Soft Silver** (#e2e8f0) — Primary text
- **Muted Slate** (#94a3b8) — Secondary text, labels
- **Subtle Border** (#2d3148) — Dividers, table borders

**Feedback:** Same as landing — Success (#34d399), Warning (#fcd34d), Error (#f87171)

## Typography Rules

- **Primary Font:** Inter — same as landing for consistency
- **Body/Labels:** 0.875rem (14px) as base — slightly smaller than landing for density
- **Headings:** Reserved for page titles and section headers, not oversized
- **Material density:** -2 (compact) — tighter form fields and buttons

## Component Stylings

- **Form fields:** Material form-field with compact density. Surface background, subtle border, primary focus ring.
- **Buttons:** Material unelevated buttons. Primary variant uses bg-primary.
- **Tables/Lists:** Standard Material tables. Hover rows for interactivity.
- **Dialogs:** Material dialog with confirm/cancel pattern for destructive actions.
- **Toasts:** Custom toast system (success/error/warning/info).
- **Loading:** Top loading bar + skeleton placeholders for content.

## Layout Principles

- **Sidebar + content:** SidebarProvider (collapsible, Ctrl+B) + SidebarInset for main content
- **Content max width:** Determined by sidebar state (expanded vs collapsed)
- **Spacing:** Tighter than landing — gap-4 for form groups, p-4 for cards
- **Data density:** Prefer compact tables and lists over spacious card grids
- **Mobile:** Sidebar collapses to rail, content fills width
