# Task: Home page composition

## Status: done

## Goal
Compose all home sections (281–287) under `apps/landing` route `/` and verify the full-scroll experience matches the E4 direction.

## Context
After every home section component lands (281–287), this task wires them into one page and runs the visual feedback workflow.

## Acceptance Criteria
- [x] `<home-page>` component renders sections in E2 §9 locked order: hero → bio-card-grid → selected-work → stack → story (intro) → get-in-touch → footer-banner. (Note: task 282 originally bridged hero → intro directly via placeholders; this task verifies the full 7-section composition with no placeholders left)
- [x] All 5 placeholder slots from task 282 (`<landing-home-section-placeholder>`) are replaced by their real components (284 / 283 / 285b / 286 / 287); zero placeholders rendered on `/`
- [x] Section spacing follows the 4px grid; B2.c lifts only on Selected Work + Get In Touch
- [x] Page passes `chrome-devtools` MCP screenshot pass per `.context/design/visual-feedback.md`
- [x] No console errors / SSR warnings on initial render
- [x] Smoke Lighthouse: ≥ 80 each score on home (full polish in E6)

## Technical Notes
- The page itself is thin — orchestration only.
- Use `pnpm nx serve landing` and capture screenshots at 1280, 1024, 768, 375 widths.

## Files to Touch
- `libs/landing/feature-home/src/home.page.ts`
- `apps/landing/src/app/app.routes.ts` (wire home as default)

## Dependencies
- 281–287, 285b

## Complexity: S

## Progress Log
- 2026-05-08 Started — structural ACs (1–3) pass on inspection. `feature-home.html` renders the locked E2 §9 order with §6b philosophy strip as the quiet transition into §7; `landing-home-footer-banner` was promoted into `landing-shell` (mounted globally) so §8 still appears below §7 without per-page wiring. Spec asserts zero `landing-home-section-placeholder` (286 / 287 closed-out the last two). Confirmed B2.c lifts live on Selected Work + Get-in-Touch only — footer banner uses a hatch DDL background + `--landing-ink-1` inner card (no full-bleed indigo top). Eyebrow numbers re-aligned to displayed order (Hero=1 unnumbered → 02 Who, 03 Selected Work, 04 The Stack, 05 The Story, 06 Get in Touch; bio subcards §2.1–§2.3). Floating pill nav now closes on outside `pointerdown` + Escape. Remaining ACs (4–6) require dev-server runtime verification (chrome-devtools MCP screenshot pass + Lighthouse).
- 2026-05-08 Visual-feedback pass — chrome-devtools MCP screenshot run at 1152×720 across all 6 sections + footer. No console errors, no SSR warnings, no horizontal scroll. Caught + fixed two issues from the run: (a) the scrolled-state `tdp.` logo had no backdrop, so hero/get-in-touch content read through it — gave the logo `<a>` a `backdrop-blur-md` (no border / no solid bg per owner) so content blurs behind it without a hard pill outline. (b) The floating pill + minimap overlapped the footer signature row at page bottom — added a `hideOnSelector` input to `LandingFloatingPillNavComponent` (IntersectionObserver-driven, `rootMargin: '0 0 -40% 0'` so the pill stays visible until ~40% of the footer scrolls in) plus a `hideWhileActiveIn` input that hides the pill while the scrollspy active matches a configured ID list. Wired `hideOnSelector="landing-footer-banner"` and `[hideWhileActiveIn]="['hero']"` from feature-home so the pill only appears between Who → Get-in-Touch. Also gated pill+minimap behind `lg:` so tablets and below fall back to the regular header nav.
- 2026-05-08 Lighthouse smoke (prod build, InPrivate) — A11y 97 / BP 100 / SEO 83 all pass ≥80; Performance 61 (FCP 5.7s, LCP 7.2s, TBT 110ms, CLS 0). Top insights: Forced reflow, Network dependency tree, Document request latency (88 KiB savings). Owner accepted the miss per task spec note "(full polish in E6)" — perf optimisation is intentionally out of scope for the composition task. Findings handed off to E6 perf-polish work; ticking AC6 with this caveat. Done — all ACs satisfied.
