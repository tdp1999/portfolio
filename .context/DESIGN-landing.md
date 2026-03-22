# Design System: Portfolio — Landing

> Stitch-compatible AI-readable spec. Feed this into Stitch prompts for consistent generation.
> Source of truth is `.context/design/foundations.md` + `.context/design/landing.md`.

## Visual Theme & Atmosphere

Dark, minimalist developer portfolio. "Digital Architect" aesthetic — technical mastery conveyed through whitespace control and tonal depth. Modern, clean, not flashy. Generous section spacing creates an editorial, magazine-like reading experience.

## Color Palette & Roles

- **Deep Midnight** (#0f1117) — Page background, base layer
- **Slate Surface** (#1a1d27) — Cards, panels, elevated content
- **Elevated Slate** (#22263a) — Headers, modals, floating UI
- **Azure Accent** (hsl 210, 65%, 50%) — Primary CTA, links, brand color
- **Azure Hover** (hsl 210, 65%, 68%) — Hover/active state for primary
- **Azure Container** (hsl 210, 40%, 22%) — Light primary backgrounds
- **Soft Silver** (#e2e8f0) — Primary text on dark surfaces
- **Muted Slate** (#94a3b8) — Secondary text, descriptions
- **Dim Slate** (#64748b) — Placeholder, hints, disabled text
- **Subtle Border** (#2d3148) — Default borders between surfaces
- **Strong Border** (#3d4266) — Emphasized borders, hover states

**Feedback:** Success (#34d399), Warning (#fcd34d), Error (#f87171), Info (matches primary)

## Typography Rules

- **Primary Font:** Inter — Clean, geometric, technical readability
- **Mono Font:** JetBrains Mono — Code blocks, technical snippets
- **Display (H1):** 3rem-3.5rem (text-4xl/5xl), font-semibold, tracking-tight
- **Section (H2):** 1.875rem (text-3xl), font-semibold
- **Card Title (H3):** 1.25rem (text-xl), font-medium
- **Body:** 1rem (text-base), regular weight, relaxed line-height
- **Small/Helper:** 0.875rem (text-sm), text-muted color

## Component Stylings

- **Buttons:** rounded-lg, 3 variants (primary filled / secondary outlined / ghost transparent), 3 sizes (sm/md/lg). Primary uses bg-primary with on-primary text.
- **Cards:** rounded-xl, surface background, subtle border, hover transitions to shadow-xl + border-strong. Padding p-6.
- **Inputs:** Surface background, border, focus ring with primary color. Label above input.
- **Badges:** Small, rounded, secondary-container background. Used for tech tags.
- **Icons:** 24px default, Lucide icon set, colored via Tailwind utility classes.

## Layout Principles

- **Max content width:** 4xl (standard), 6xl (wide grids)
- **Grid:** 1-col mobile → 2-col tablet (md:) → 3-col desktop (lg:)
- **Section spacing:** py-16 mobile, py-24 desktop (generous editorial spacing)
- **Component spacing:** 8px grid system (gap-4, gap-8)
- **Hero pattern:** Flex col→row at md breakpoint, text + illustration side-by-side
- **Mobile-first:** All styles start mobile, scale up with sm:/md:/lg: breakpoints
