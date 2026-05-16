# Task: Eliminate FOUC flash on prod landing (Cloudflare + Railway SSR)

## Status: done

## Goal
Remove the brief unstyled-content flash visible on first load of `thunderphong.com` SSR routes, so the page paints with final fonts, background, and layout from the very first frame.

## Context
After deploying landing to Railway behind Cloudflare, users see a momentary flash on first paint of SSR routes (`/`, `/projects`, etc.) — text appears in browser-default serif on a near-white background, then snaps to Inter on dark background once styles arrive. Local dev does NOT reproduce because localhost CSS arrives in <20ms; on prod via Cloudflare the gap is 100–300ms and visible.

**Already attempted (commits 0a01647, 5114648):**
- Self-hosted + preloaded above-the-fold fonts (Inter 400/500/600/700, Newsreader 400/500 + italic, JetBrains Mono 400) → fixed FOUT.
- Added inline baseline `<style>` block in `apps/landing/src/index.html` with `font-family: Inter`, `background-color: #0d0e11`, `color: #e3e2e6` (and `[data-theme='light']` overrides) so first paint has correct base colors and font.

**What still flashes (per user testing on prod):** Despite the inline baseline, a flash is still visible. Hypotheses to verify:
1. Inline baseline targets `html, body` but landing root layout (`<app-root>` and its first containers) sets its own background via component SCSS — may override only after main stylesheet loads.
2. The `[data-theme='light'] html` selector specificity may not beat Tailwind's `body` base, so theme switch isn't applied pre-stylesheet.
3. Beasties only inlines critical CSS into `index.csr.html` (prerendered routes), not `index.server.html` (SSR runtime). Need to confirm in `dist/landing/server/`.
4. Main stylesheet is render-blocking — even with HTTP/2, the request adds ~1 RTT after HTML, and large CSS bundle parse time adds more.
5. Cloudflare may not be caching the CSS file at edge yet (no Cache Rule configured in deploy steps).

## Acceptance Criteria
- [ ] First paint on `https://thunderphong.com/` shows Inter font + dark background with no visible flash on Slow 4G throttle (Chrome DevTools).
- [ ] Same verified on `/projects` and one project detail page.
- [ ] Light theme cookie path (`landing_theme=light`) also paints clean from first frame.
- [ ] No regression on local dev or prerendered routes (`/uses`, `/colophon`, `/ddl`).
- [ ] Root cause documented in `.context/landing-ssr.md` under a new subsection so future contributors don't rediscover it.
- [ ] Lighthouse "Eliminate render-blocking resources" audit no worse than baseline.

## Technical Notes

**Investigation path (in order):**

1. **Diff `index.csr.html` vs `index.server.html`** in `dist/landing/server/`. Beasties inlines `<style>` into prerendered HTML; SSR runtime uses the un-processed `index.server.html`. If CSR has a big inline `<style>` and server has none, that's the gap.
2. **Inspect the actual rendered HTML on prod** with `curl -s https://thunderphong.com/ | head -200` — does it contain the baseline `<style>` block we added? Are there inlined critical styles from Beasties or just our manual block?
3. **Check what CSS sets the root container background.** Likely candidates: `apps/landing/src/styles.scss`, `libs/landing/shared/ui/src/styles/*`, or shell components. The flash means the *first painted element* (e.g. `<app-root>` wrapper, `<header>`, hero section) has its own background that only kicks in post-stylesheet.

**Possible fixes (pick after investigation):**

- **Option A — Expand inline critical CSS in `index.html`** to cover `app-root`, header background, and hero hero text colors. Simplest, no build change.
- **Option B — Configure Beasties to also process `index.server.html`** via `angular.json` builder options (`inlineCritical: true` on SSR target) so SSR runtime gets the same auto-inlined critical CSS as prerender.
- **Option C — Preload main stylesheet** with `<link rel="preload" as="style" onload="this.rel='stylesheet'">` pattern, to start CSS download in parallel with HTML parse instead of after. (May not help much — modern browsers already preload-scan.)
- **Option D — Add Cloudflare Cache Rule** for `*.css` with 1y TTL so repeat visitors hit edge cache. Doesn't fix first-visit flash but reduces it on subsequent loads.

Recommended first try: **A + verify B is feasible**.

## Files to Touch (likely)
- `apps/landing/src/index.html` — expand inline `<style>` block
- `apps/landing/src/styles.scss` — possibly move base bg/color rules earlier
- `apps/landing/project.json` or `angular.json` — Beasties config for SSR target
- `.context/landing-ssr.md` — document root cause + rule

## Dependencies
None. Landing is already live on prod; this is a polish pass.

## Complexity: M

**Reasoning:** Investigation-heavy but localized to landing app. ~2–3 files touched, clear test path (DevTools throttle on prod URL). Risk: if Option B requires Angular builder changes, complexity creeps to L.

## Progress Log
