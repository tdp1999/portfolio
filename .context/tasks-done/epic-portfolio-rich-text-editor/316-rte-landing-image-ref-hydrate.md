# Task: Landing — Hydrate `image-ref` Blocks via `landing-figure`

## Status: done

## Goal
Teach the renderer to recognize `<figure data-block="image-ref" data-image-id="...">` and render through the existing `landing-figure` component (responsive `<picture>` + caption).

## Context
The HTML cache stores the semantic figure with `data-image-id`. At render time, landing must resolve the Media metadata and render via the project's `landing-figure` primitive — not the raw `<img>` from the editor. This keeps responsive image and caption styling consistent with the moodboard.

Source: `.context/plans/epic-portfolio-rich-text-editor.md` Phase 7.

## Acceptance Criteria
- [x] Renderer replaces every `<figure data-block="image-ref">` with `landing-figure`-shaped markup. *Strategy 1 (string transform `hydrateImageRefs`) — chosen over DOM/createComponent because AC#4 (SSR first-paint) rules out the browser-only `afterNextRender` walk.*
- [x] Media metadata resolved via landing data-access — **single API call per page**: the BE embeds a `mediaRefs` map in the Project/Blog detail DTO (no separate media fetch from landing).
- [x] `Media` deleted → broken `<img>` (no `src`) carrying the caption as `alt`. *Note: the `image-ref` node stores no alt (only `imageId`/`caption`/`captionPosition`), so "original alt" = the caption, which IS stored and survives a deleted asset.*
- [x] SSR-safe: pure string/regex transform in the `contentHtml` computed → identical on server + client, image present at first paint.
- [x] Scope: only `Project.body` + `BlogPost.content` render via `[allowMedia]="true"`; other fields stay on the strict whitelist with no `<img>`.
- [x] Caption uses mono caps `FIG. 0X · CAPTION` (component-matching `__number`/`__sep`/`__text` spans), numbered per-page across captioned figures. — **manual visual verify pending**

## Technical Notes
- Two implementation strategies:
  1. **String transform pre-bind**: parse HTML on the server before binding, replace `<figure data-block="image-ref">` with rendered `<landing-figure>` HTML. Loses Angular bindings inside but is SSR-trivial.
  2. **DOM walk after render**: bind raw HTML, then in `afterNextRender` walk `[data-block="image-ref"]` and render `<landing-figure>` via `ViewContainerRef.createComponent`. Preserves Angular lifecycle but has hydration mismatch risk.
  - Recommend strategy 1 for SSR simplicity. Justify if picking 2.
- Caption numbering: scoped to the rendered HTML root, not page-global. Use `IntersectionObserver`-free counter at render time.

## Files to Touch
- `libs/shared/features/rte-renderer/**` (new transform pass)
- `libs/landing/shared/ui/figure/**` (no change expected; verify selector + signal inputs match)
- `libs/landing/data-access/**` (batch media metadata fetch)

## Dependencies
- 308-rte-renderer-lib
- 315-rte-image-ref-mediapicker

## Complexity: M

## Progress Log
- [2026-06-29] **Implemented (interim string-transform path).** Builds on the read-time hydration plumbing landed alongside 315 (BE `mediaRefs` resolver + DTO, `RICH_TEXT_MEDIA_WHITELIST`, `<rte-render-html [allowMedia]>`).
  - **Output upgraded to `landing-figure`:** `hydrateImageRefs` now emits `<figure class="landing-figure"><div class="landing-figure__frame"><img src srcset alt w h loading></div><figcaption …FIG. 0X · CAPTION></figcaption></figure>` — responsive 1×/2× Cloudinary srcset (`buildCloudinarySrcset`, 800px), per-page contiguous numbering of captioned figures, deleted-media fallback (broken img + caption-as-alt).
  - **Whitelist:** `RICH_TEXT_MEDIA_WHITELIST` widened with `div` + `class` + `srcset` (read-time only; base/BE write-time stays URL- and presentation-free).
  - **CSS:** the orphaned `figure.landing-figure` block in `_prose.scss` (left over from the now-deleted markdown renderer, with an `opacity:0`/`.is-loaded` fade that needed JS that no longer exists) was **repurposed** into a JS-free, SSR-safe version matching the `landing-figure` component (frame border, natural ratio, mono-caps caption spans). No component touched.
  - **Blog BE** was already wired (done with 315): `get-public-post-by-slug` + presenter ship `mediaRefs`.
  - Tests: `hydrate-image-refs.spec` rewritten for the new markup (numbering, srcset, fallback, escaping); sanitize + `rte-render-html` specs assert `div`/`class`/`srcset` survive under the media whitelist only. FE 50 specs + 304 BE specs green; lint + stylelint clean.
  - **Relationship to epic:** per `epic-portfolio-prose-block-renderer.md` (D1/Phase 4/6), this `[innerHTML]` + string-transform approach is the sanctioned **interim** for the single `image-ref` block; that epic later replaces it with an AST renderer mounting the real `<landing-figure>` component (+ in-content lightbox) once a 2nd block type is needed. **No in-content lightbox here** (deferred to the epic).
- [2026-06-29] **Verified live + shipped.** Landing SSR (`/blog/test-new-editor`) first-paint HTML contains the hydrated `<figure class="landing-figure"><div class="landing-figure__frame"><img src srcset w=1600 h=900 loading=lazy></div><figcaption>FIG. 01 · …</figcaption></figure>` — no URL-free figure left, image loads (Cloudinary 1×/2× srcset), caption mono-caps, 0 console errors. Committed `feat(landing): render image-ref blocks as landing-figure` and pushed to origin/master.
