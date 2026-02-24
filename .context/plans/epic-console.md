# Epic: Console Application

## Summary

Create a new Angular application named **console** — the internal management hub for the portfolio. This epic covers infrastructure only: app scaffolding, two layout shells (blank + main), routing skeleton, and library scoping. No internal feature modules or auth logic.

## Why

The portfolio needs a separate internal application for managing content, projects, and settings behind the scenes. Separating it from the landing app keeps concerns clean: landing is public-facing SSR, console is private CSR.

## Target Users

Portfolio owner (admin) — single user managing portfolio content.

## Scope

### In Scope

- Nx app generation (`apps/console/`) — CSR only, no SSR
- Nx E2E app (`apps/console-e2e/`) with Playwright
- Library scoping: `libs/console/` with shared sub-libs (ui, data-access, util)
- ESLint module boundary tags (`scope:console`)
- Selector prefix: `console-*`
- **Blank Layout** — styled auth shell (centered card, branded, consistent with landing design tokens). Dashboard-scoped in `libs/console/shared/ui/`
- **Main Layout** — sidebar + inset content area consuming `SidebarModule` from `@portfolio/shared/ui/sidebar` with console-specific menu items
- Route skeleton with layout-based route grouping (blank routes vs main routes)
- Tailwind + same semantic design tokens as landing (shared theme)
- Dev server script (`pnpm dev:console`)
- Auth-ready routing guards (placeholder, no implementation)

### Out of Scope

- Authentication / login logic (future epic)
- Internal feature modules (projects, blog editor, settings, etc.)
- API endpoints for console
- Cookie/token sharing implementation
- Deployment / CI pipeline for console

## High-Level Requirements

1. **App scaffold** — Generate `apps/console/` Angular 21 app (CSR, standalone, no SSR). **Run `nx g @nx/angular:application --dry-run` first and present the output for user approval before executing the actual generation.** Configure `project.json` with proper tags and build targets.
2. **E2E scaffold** — Generate `apps/console-e2e/` with Playwright config.
3. **Library structure** — Create scoped libs following existing convention:
   - `libs/console/shared/ui/` (layouts live here)
   - `libs/console/shared/data-access/`
   - `libs/console/shared/util/`
4. **ESLint boundaries** — Add `scope:console` + `type:*` tags. Enforce: console features → console shared → global shared. Console must NOT import landing-scoped libs.
5. **Blank Layout component** — `console-blank-layout` in `libs/console/shared/ui/`. Styled centered card with branding, consistent with landing design tokens. Renders `<router-outlet>` for auth views.
6. **Main Layout component** — `console-main-layout` in `libs/console/shared/ui/`. Wraps `SidebarModule` (provider → sidebar → inset pattern). Console-specific menu items (placeholder links). Renders `<router-outlet>` inside inset area.
7. **Routing skeleton** — Two route groups:
   - `/auth/*` → Blank Layout (login, signup, logout placeholders)
   - `/` → Main Layout (empty dashboard home placeholder)
   - Wildcard redirect to `/`
8. **Theming** — Reuse exact same Tailwind config + semantic tokens. Import shared styles. Dark mode support via `.dark` class.
9. **Dev script** — `pnpm dev:console` pointing to a different port (e.g., 4300).
10. **tsconfig paths** — Add `@portfolio/console/*` path mappings in `tsconfig.base.json`.

## Technical Considerations

### Architecture

- **Separate Nx app** — independent build, independent deployment
- **CSR only** — no SSR needed for auth-gated internal app
- **Sidebar reuse** — `SidebarModule` already in `libs/shared/ui/sidebar/` with `scope:shared` tags, directly importable
- **Layout pattern** — route-level layouts via Angular route `component` wrapping child `<router-outlet>`

### Dependencies

- `@portfolio/shared/ui/sidebar` — SidebarModule (already built)
- `@portfolio/shared/breakpoint-observer` — responsive behavior (already built)
- Angular CDK — overlay, layout (already installed)
- Angular Material — for future console features (already installed)

### Domain & Deployment

- Console will be deployed to `console.{domain}` (separate subdomain)
- Landing links to console via `<a href>` opening new tab (`target="_blank"`)
- Shared parent domain cookie (`.{domain}`) for future auth token sharing
- No cross-app SPA navigation — hard navigation between domains

### Data Model

No new data models in this epic. Console will consume existing API endpoints.

## Risks & Warnings

⚠️ **Tailwind Config Sharing**
- Both apps need the same `tailwind.config.js`. Verify the Nx build for console picks up the shared config, or create a shared Tailwind preset.
- Mitigation: Test token rendering on console's blank layout before building more.

⚠️ **Port Conflicts in Dev**
- Landing runs on 4200, API on 3000. Console needs its own port.
- Mitigation: Configure in `project.json` serve target.

⚠️ **ESLint Boundary Enforcement**
- New `scope:console` tag must be added to ESLint config. Without it, console libs could accidentally import landing libs.
- Mitigation: Add boundary rules before creating any console libs.

## Alternatives Considered

### Single app with sub-routes (landing + console merged)
- **Pros:** Simpler infra, shared bundle, SPA navigation
- **Cons:** SSR complexity for auth pages, muddy domain boundaries, larger landing bundle
- **Why not chosen:** Clean separation aligns with domain-driven design and independent deployment

### "Dashboard" / "Studio" / "Hub" naming
- **Pros:** Each has valid connotations
- **Cons:** "Dashboard" is overused; "studio" implies content creation; "hub" is generic
- **Why not chosen:** "Console" chosen for developer/admin feel, modern and distinctive

## Success Criteria

- [ ] `pnpm dev:console` starts CSR app on dedicated port
- [ ] Blank layout renders centered styled card at `/auth/login`
- [ ] Main layout renders sidebar + inset with placeholder content at `/`
- [ ] Sidebar toggle, rail, mobile overlay all work in console context
- [ ] ESLint prevents console libs from importing landing-scoped libs
- [ ] Dark mode toggle works with same tokens as landing
- [ ] `nx build console` produces production CSR bundle

## Estimated Complexity
L

**Reasoning:** Multiple moving parts — app generation, library scaffolding, two layout components, routing setup, ESLint config, Tailwind integration — but no novel technical challenges. All patterns are established.

## Status
completed

## Created
2026-02-24
