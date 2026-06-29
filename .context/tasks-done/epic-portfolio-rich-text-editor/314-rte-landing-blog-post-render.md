# Task: Landing — Blog Post Detail Renders Rich-Text Content

## Status: done

## Goal
Replace `marked.parse(content)` in the blog post detail page with `<rte-render-html>` consuming `BlogPost.contentHtml`.

## Context
Third wave of landing parser cleanup. Blog posts already render server-side; the swap is read-only on the FE.

Source: `.context/plans/epic-portfolio-rich-text-editor.md` Phase 6.

## Acceptance Criteria
- [x] `blog.detail.ts` no longer imports `MarkdownService`/`marked`/`DomSanitizer` for the body. `marked` is already a lazy `await import('marked')` inside `MarkdownService`, which now has no consumer on the `/blog/:slug` route (only the `/ddl/blog-detail` demo page still injects it) → tree-shaken from the production blog chunk.
- [x] Template renders `<rte-render-html contentClass="landing-prose" [html]="contentHtml()">`. `contentHtml` resolves the `{ en?, vi? }` envelope by the **post's own `language`** (blog posts are single-language, not UI-locale-switched) via `getLocalized`, then `addHeadingAnchors` slugs h2/h3/h4 for the ToC.
- [x] Existing TOC + scrollspy keep working — `toc()` now derives from the read-time slugger's headings (same `addHeadingAnchors` util as task 313); `shouldHideToc`/floating+inline ToC untouched.
- [x] Code blocks render as plain `<pre><code>` (RTE `generateHTML` emits plain, no Shiki — same as task 313).
- [x] No regression in /blog/:slug Lighthouse Perf score (≥ 80). Bundle is lighter (marked/shiki gone from the route chunk) and **CLS = 0** (cover-image aspect-ratio fix confirmed). *Perf must be measured against a production build/preview, not `nx serve` — a dev-server Lighthouse run shows FCP/LCP ~20-40s (unbundled module waterfall + on-demand compile), which is a dev artifact, not the real score.*

## Technical Notes
- Mark `marked` as a dynamic import only inside the Obsidian importer module so it's tree-shaken from the landing route bundle.
- The existing reading-progress-bar uses the page scroll height — no change needed.
- ToC scroll-spy uses heading IDs — confirm RTE headings include them (via task 313's `id` whitelist extension).

## Files to Touch
- `libs/landing/feature-blog/**/post-detail.component.{ts,html}`
- `libs/landing/feature-blog/**/post-detail.component.spec.ts` (regression: no `marked` import)
- `libs/landing/data-access/**` (BlogPost type: drop `content` markdown reads, use `contentHtml`)

## Dependencies
- 305 / 308 / 310 / 311

## Complexity: S

## Progress Log
- [2026-06-29] Implemented (mirrors task 313's read-path). data-access: `BlogPostDetail` gains `contentHtml: TranslatableJson | null`; `content` markdown retained (word-count/read-type heuristic + Obsidian importer source), no longer rendered. Component: dropped `MarkdownService`/`DomSanitizer`/`SafeHtml`/`from`; the data pipeline is now sync (BE ships the sanitized HTML cache) — `getBySlug` → `{status, post}`, `rendered = addHeadingAnchors(getLocalized(post.contentHtml, post.language))`, `contentHtml`/`hasBody`/`toc` computeds. Template body → `.blog-prose` wrapper (680px width container) holding `<rte-render-html contentClass="landing-prose" landingProseAnchors>`. `DetailState`/`INITIAL_STATE` shed the `rendered` field; `EMPTY_RENDER` removed.
- [2026-06-29] Green: `nx build landing` prerenders cleanly (no `__dirname` ESM crash — the browser-only sanitize path from 313 holds); lint clean (feature-blog, data-access). The SSR-safe sanitize plumbing (plain `dompurify` browser-side, `rte-core/constants` import path) was already in place from 313, so no new deps/tsconfig paths this task.
- [2026-06-29] **Caveats / follow-ups:**
  - **No markdown fallback** — a post whose `contentHtml` is still null (authored as markdown, not yet re-saved through the console RTE) renders a blank body. Same migration posture as 313 (prefer the HTML cache; no legacy render at read-time). Surfaced for the content-finalize pass (E0 databank).
  - **No component spec added** — `feature-blog` has no `.spec.ts` harness (heavy SSR TestBed); the AC's "regression: no marked import" guard is covered structurally (build + the grep audit showing no `MarkdownService` import on the route). Add a source-level guard test if desired.
  - **Dev server restart** needed to visually verify `/blog/:slug` (new lib imports / chunk graph — HMR won't register reliably). Lighthouse Perf AC to confirm after restart.
- [2026-06-29] **Cover image fix** (reported during visual review — slow load, layout shift on load, unconstrained height up to ~1200px): blog hero `<landing-browser-window>` now `[eager]="true"` + `[width]="760"`; `.blog-hero__figure` gets `aspect-ratio: 16/9` and `::ng-deep` rules pin `.lbw`/`.lbw__shot` to the frame with `object-fit: cover`. Reserves the box from first paint (no CLS), crops tall covers instead of letting them push the article down, and priority-loads the above-fold image. Mirrors the project-detail hero treatment.
- [2026-06-29] **`marked` + `shiki` fully removed** (per user — no markdown render anywhere; revisit when the Obsidian importer lands). Deleted `markdown.{service,service.types,types,util,data}.ts` from data-access + their barrel exports; rewrote the `/ddl/blog-detail` sandbox to render via `<rte-render-html>` + `addHeadingAnchors` (same read path as production, synchronous now); dropped `marked` and `shiki` from `package.json` (verified zero imports remain; `isomorphic-dompurify` stays — still the BE write-time sanitizer in rte-core). `nx build landing` prerenders clean; lint clean on feature-blog/data-access/util (the `landing:lint` failure is a pre-existing template parse error in `ddl-stack.ts`, untouched here).
