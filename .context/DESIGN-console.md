# Design System: Portfolio — Console

> Stitch-compatible AI-readable spec for the console/dashboard application.
> Source of truth is `.context/design/foundations.md` + `.context/design/console.md`.

## Visual Theme & Atmosphere

Functional, dense dashboard for content management. Clean and utilitarian — prioritizes usability and information density over visual flair. Angular Material v21 as the primary component system with custom semantic token overrides. Subtle grain texture and indigo radial glow add depth without distraction.

## Color Palette & Roles

Shares the same semantic token layer as landing (see DESIGN-landing.md). All colors via CSS custom properties — supports dark and light mode:

| Role | Dark Mode | Light Mode | Token |
|------|-----------|------------|-------|
| Page background | #0f1117 | #f9fafb | `--color-background` |
| Card/panel surface | #1a1d27 | #ffffff | `--color-surface` |
| Elevated surface | #22263a | #f1f5f9 | `--color-surface-elevated` |
| Primary accent | hsl(210 65% 58%) | hsl(210 65% 50%) | `--color-primary` |
| Primary text | #e2e8f0 | #111827 | `--color-text` |
| Secondary text | #94a3b8 | #4b5563 | `--color-text-secondary` |
| Muted text | #64748b | #9ca3af | `--color-text-muted` |
| Border | #2d3148 | #e5e7eb | `--color-border` |

**Feedback:** Success (#34d399/#22c55e), Warning (#fcd34d/#f59e0b), Error (#f87171/#ef4444)

## Typography Rules

- **Primary Font:** Inter — same as landing for consistency
- **Body/Labels:** 0.875rem (14px) as base — slightly smaller than landing for density
- **Headings:** Reserved for page titles and section headers, not oversized
- **Material density:** -2 (compact) — tighter form fields and buttons
- **Subtitle text:** Use `text-text-secondary` for descriptions under headings (not `text-text-muted` — too faint)

## Component Stylings

- **Form fields:** Material form-field with compact density (-2). Surface background, subtle border, primary focus ring. Outlined appearance for auth pages.
- **Buttons:** Material unelevated with `brightness(1.08)` on hover. Outlined buttons get indigo hover glow. Shape: 8px border-radius.
- **Tables/Lists:** CRUD template classes. No box-shadow — borders only. Hover rows with `var(--color-surface-hover)`.
- **Dialogs:** Material dialog with confirm/cancel pattern for destructive actions.
- **Toasts:** Custom toast system (success/error/warning/info).
- **Loading:** Top loading bar + skeleton placeholders for content.
- **Auth card:** Centered on grain+glow background. Rounded-2xl, max-w-420px. Light mode: subtle shadow. Dark mode: no shadow.
- **Stat cards:** Surface-elevated bg, border, no box-shadow. Hover: `rgba(99,102,241,0.05)` bg tint.
- **Media grid cards:** Surface bg, border. Hover: indigo glow `0 0 20px -5px rgba(99,102,241,0.15)`.

## Visual Effects

- **Grain texture:** SVG `feTurbulence` noise overlay. Dark: 0.025-0.04 opacity, `mix-blend-mode: soft-light`. Light: 0.02-0.03 opacity.
- **Radial glow:** Indigo gradient. Dark: 0.06-0.2 opacity. Light: 0.03-0.08 opacity.
- **Hover glow:** `box-shadow: 0 0 20px -5px rgba(99,102,241,0.15)` on interactive cards and outlined buttons.
- **Transitions:** `transition: all 0.15s ease` on all interactive elements.
- **No box-shadow** on resting cards, stat cards, or table containers.
- **No parallax, bouncing, scaling animations, or flashy effects.**

## Layout Principles

- **Sidebar + content:** SidebarProvider (collapsible, Ctrl+B) + SidebarInset for main content
- **Auth pages:** BlankLayout — no sidebar, centered card, grain+glow bg, logo "C" circle, footer
- **Content max width:** Determined by sidebar state (expanded vs collapsed)
- **Spacing:** Tighter than landing — gap-4 for form groups, p-4 for cards
- **Data density:** Prefer compact tables and lists over spacious card grids
- **Mobile:** Sidebar collapses to rail, content fills width

## Stitch References

- **Login Page:** screen `bbe44133aede44be` in project `17973930401225587522`
