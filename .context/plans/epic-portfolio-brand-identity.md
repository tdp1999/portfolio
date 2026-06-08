# Epic: Brand Identity System & Portable Mark Skill

> Parent: [Initiative: Portfolio](./initiative-portfolio.md)
> Status: 🟢 done (blocking ACs) — Phase 1 ✅ (brand lib + `/ddl/identity`). Phase 2 ✅ (full two-stage `brand-identity` skill + favicon/OG/email assets, OG absolute). Site integration ✅ (3 ad-hoc mark systems replaced, verified live). Phase 3 ✅: (1) motif (`<brand-motif>` lines-only grid), (2) animated/variable mark (duration-adaptive loader + faux weight), (3) guideline `do/don't` section on `/ddl/identity`. Brand-lib tests ✅ (`master.util.spec.ts`, 19 specs). Non-blocking deferred: true variable-font weight (needs `wght`-axis woff2), video sting (Remotion). See Roadmap checklist.
> Depends on: E4 (UI/UX direction — locked the technical-cool + indigo + serif/mono/density system this mark must cohere with).
> Feeds: the landing site (replaces 3 divergent ad-hoc mark systems) **and** future products (portable skill).
> Scope note: broader than the portfolio — the output is a **portable, per-project brand skill** reusable across future products. The portfolio is its first consumer.

## Purpose

Replace the scattered, fallback-driven "brand" of the site with a **deliberate identity system** that:

- makes a viewer remember who this is within 3 seconds (the E1 friend-test, applied to identity);
- is **system-derived, not AI-generated** — reproducible from a personal rule, so it cannot be re-created generically in 5s;
- is **configurable** (recolor + variant per product) and **versatile** (web → favicon → email signature → social → animation → later video);
- ships as a **portable skill + per-project config**, so the same system serves products yet to be built.

## Problem — current state (audit 2026-06-07)

The site has **no brand asset**; the "brand" is incidental text with three divergent initials systems and inconsistent fallbacks:

| Where | What it is now | Problem |
|---|---|---|
| Header (×3) | `tdp.` — Newsreader serif, lowercase, trailing dot | text in HTML, not reusable, not an asset |
| Footer wordmark | `{{ fullName() }}` → fallback `'Portfolio'` | different system from header |
| Blog signature | circular `PT` monogram + `Phuong Tran` (hardcoded) | a **second** initials system (`PT` ≠ `tdp`) |
| Content monogram | 40px square, mono font, lowercase, per-entry | a **third** system |
| Favicon | bare `favicon.ico` | not branded |
| OG image | `null` fallback | absent |

Palette is already locked (E4): **monochrome ink/slate + single indigo accent `#6E66D9`**, with light/dark tokens (`--landing-*`). This is a strong base for "recolor per product."

## Two ownable anchors (the non-generic core)

These are things an AI image generator cannot know, and they make the mark *ours*:

1. **The dot `.` ↔ the Vietnamese "nặng" tone.** The trailing dot in `tdp.` coincides with the **dot-below diacritic** (◌̣) of the author's Vietnamese name. A software engineer who "builds long-lived systems" + a Vietnamese name → **both resolve to a single dot.** Rare convergence; not quickly copyable because it requires knowing the person.
2. **Engineer primitives** — caret `▌`, semicolon `;`, brackets, the monospace cell. The "alphabet" of the craft, already present in the site DNA (JetBrains Mono token).

## Anti-patterns (locked)

- **No AI-generated raster** as the source of truth. AI gives a one-off PNG that can't be re-themed, re-rendered, or version-controlled — the opposite of what "config + reuse" needs. The reference skill (`ckm:design`) is a Gemini image router; it is our **counter-model**, not our model.
- **No orbit / node / graph motif** — both a tech cliché and explicitly removed from this codebase (commit 284796d).
- ~~No reuse of Newsreader/JetBrains for the logo letterform.~~ **Reversed 2026-06-08** — the identity is now the name set in the existing site faces; see change log.

## Locked decisions (2026-06-07)

| Item | Decision |
|---|---|
| Destination | Full identity program (Tier 1→3) |
| Sequence | DDL exploration (9 directions) → **lock 1** → build skill → expand |
| Anchors | the Dot `.` (accent atom, theme-able, r=13) closes **both** marks — `tdp.` and `Phuong Tran.` (wordmark dot added 2026-06-08, reversing the earlier "no dot" call). ~~nặng-tone framing~~ dropped 2026-06-08. Engineer primitives; **avoid** orbit/node |
| Initials | `tdp.` monogram + `Phuong Tran.` wordmark — both close with the Dot |
| Letterform | **Newsreader, weight 500** (locked 2026-06-08) — existing site display serif (OFL 1.1); no custom-drawn glyph. `tdp.` monogram + `Phuong Tran` wordmark |
| Master format | One hand-authored **SVG** = source of truth; everything else generated from it |
| Config depth | **Theme map** — `{ accent, surface, mode, variant: mono\|knockout\|full }`; one mark, recolor + variant per product |
| Skill home | **Portable skill + per-project config** — skill lives once (e.g. `~/.claude/skills/`), reads each project's `brand.config.ts`, generates assets into that project |
| Skill v1 outputs | SVG master + favicon set · OG/social image · email signature · loading + Lottie animation. (Video sting / Remotion = later.) |
| Presentation | A `/ddl/identity` showcase page (DDL = source of truth for landing UI) |
| Naming | Ubiquitous language locked 2026-06-08 (see Glossary): **Monogram** (`tdp.`, primary) · **Wordmark** (`Phuong Tran`, secondary) · **Brand** = aggregate root |

## Ubiquitous language (DDD — locked 2026-06-08)

Use these terms verbatim across code, skill, `brand.config.ts`, and docs. "Logo" is the everyday word for the **Monogram**; do not use it as a type in code.

| Term | Meaning | Role |
|---|---|---|
| **Brand** | a named, configured identity instance (e.g. `tdp`, or a future product) — aggregate root, holds Theme + emits Assets | root |
| **Monogram** | `tdp.` — lettermark from initials + the Dot | **primary** |
| **Wordmark** | `Phuong Tran.` set in Newsreader 500, closed by the Dot | secondary |
| **Signature** | locked lockup of Monogram + Wordmark (horizontal / stacked) | composed |
| **Dot** (the Point) | the accent `.` — brand atom, theme-coloured | atom |
| **Theme** | config value object `{ accent, surface, mode }` | config |
| **Variant** | render mode `full · mono · knockout` | config |
| **Master** | the source SVG (Newsreader outlines) everything derives from | source |
| **Asset** | a generated output rendered from a Brand at a Theme+Variant | output |

Split into two config-driven deliverables: **(A) runtime component** (Angular `<brand-monogram>`/`<brand-wordmark>`/`<brand-signature>`/`<brand-loader>`, no new tooling) and **(B) generator skill** (portable, reads `brand.config.ts` + Master → emits Assets; needs tooling — gated on per-output approval).

## Candidate directions (Phase 1 — render all 9 in `/ddl/identity`)

Each direction = a **LUẬT** (construction rule) it is derived from. Render every direction in 3 forms (full mark · compact/favicon · wordmark) plus a live recolor demo.

| # | Direction | LUẬT (construction rule) | Ownable hook | Risk |
|---|---|---|---|---|
| 1 | `tdp.` evolved | everything resolves to the dot `.`; favicon = a lone dot | continuity + nặng tone | low |
| 2 | Terminator `;` / delimiter | monogram closed by `;` = "end of statement" | very "engineer", decisive | med |
| 3 | Caret / cursor `▌` | mark is a blinking cursor; `tdp▌` | terminal DNA, **self-animating** | med |
| 4 | Monospace-cell glyph | mark lives inside one mono cell, like a single character | binds to existing mono token | med |
| 5 | Bracket monogram `{tdp}` `<pt>` | initials wrapped in a code delimiter | reads as "code" instantly | generic if lazy |
| 6 | Lettermark on a grid-module | strokes = multiples of one unit, one fixed angle | provable rule = not AI | med-high |
| 7 | Hybrid fused glyph | t/d/p share strokes into one glyph (monogram **is** symbol) | one mark, both roles | high (clutter) |
| 8 | Signature stroke | one continuous stroke, weight varies with speed | a signature is unique by definition | high (twee) |
| 9 | Vietnamese diacritic (nặng/horn) | mark built from a Vietnamese tone mark | **heritage + rhymes with the dot** | med (needs finesse) |

**Treatments** (combine with any direction, also shown in DDL): mono-line · negative-space (accent fills a counter) · seal/enclosure · solid vs outline · indigo gradient.

## Selection rubric (how a direction wins)

**Gates (pass/fail — fail = eliminated):**
1. Legible at **16px** (favicon test).
2. Survives in **one color** (knockout test).

**Scored axes (1–5):**
3. **Reproducible from a rule** — provable construction = non-AI = ownable. **(heaviest)**
4. Distinct from generic dev logos.
5. Versatile — works for email-sig *and* (later) a video sting.
6. Coheres with serif+mono+indigo without being subservient.
7. **"Is it ME?"** — the identity/gut score, named explicitly not hidden. **(heaviest)**

Weighting: **axes 3 + 7 are the heaviest** (they are what defeats "generic"); 5 + 6 medium; 4 derives naturally from 3+7. *(Default agreed 2026-06-07; revisit if a direction surprises.)*

## Tooling architecture (code-driven, no AI raster)

One vector master → deterministic generators per output type:

| Need | Tool (code-driven) | Trust | Note |
|---|---|---|---|
| Web logo, any screen | **SVG master** used directly | web standard | infinite scale, ~KB |
| PNG/ICO/WebP, any size | **sharp** (libvips) / **resvg-js** (Rust) / Inkscape CLI | very high | render from master at 2–3× DPI |
| Favicon set (16→512) | sharp + png-to-ico | high | whole set from one master |
| OG / social / banner | **Satori** (HTML/CSS→SVG→PNG, Vercel) or **Playwright** screenshot | high | deterministic, versioned |
| Logo-in-photo / watermark | **sharp `composite`** (vector over raster) | very high | layer compose, no AI |
| Loading / web animation | animate SVG via **CSS/SMIL** (caret blink, stroke-draw, dot pulse) | web standard | lightest |
| Cross-platform animation | **Lottie** JSON (author via SVGator/LottieLab or SVG→Lottie) | very high (Airbnb) | web + iOS + Android |
| Video logo (mp4/webm/gif) — **later** | **Remotion** (React → headless Chrome + ffmpeg) | high ⚠️ | color = prop = config |

**Quality / "any background" is a design contract, not just tooling:** vector master for infinite scale; raster rendered at 2–3× for retina; ship **light / dark / mono / knockout** variants; `currentColor` inheritance; clearspace + min-size + contrast rules (can hook into the `contrast-audit` skill); WebM-with-alpha for transparent video overlays; sRGB.

> ⚠️ **License caveat — Remotion:** free for individuals / ≤3-person companies (incl. commercial), but **$100/mo company license for 4+ people.** Relevant once "future products" become a company. Deferred to a later phase so v1 carries no license burden; web animation (CSS/Lottie) is fully free.

## Config schema (per-project `brand.config.ts`) — **locked 2026-06-08 (as-built)**

The shipped shape (`libs/shared/features/brand/src/lib/brand.{types,config}.ts`). Chốt as-is — the skill reads exactly this. `variant` is **render-time** (a component input / asset arg, not stored on the Brand); `outputs` is a **skill argument**, not config.

```ts
export type BrandVariant = 'full' | 'mono' | 'knockout';
export type BrandMode = 'light' | 'dark';

export interface BrandTheme {
  accent: string;          // hex; the Dot / accent atom
  surface?: string;        // optional token name or hex
  mode?: BrandMode;
}

export interface BrandConfig {
  name: string;            // 'tdp'
  monogram: string;        // 'tdp.'  (Monogram text, Dot included)
  wordmark: string;        // 'Phuong Tran'
  theme: BrandTheme;
}

export const TDP_BRAND: BrandConfig = {
  name: 'tdp',
  monogram: 'tdp.',
  wordmark: 'Phuong Tran',
  theme: { accent: '#6E66D9', mode: 'dark' },
};
```

## Skill architecture (portable)

- Lives once, project-agnostic (e.g. `~/.claude/skills/brand-identity/`).
- Reads the consuming project's `brand.config.ts`.
- Generates the v1 output groups **into that project** from the locked SVG master.
- Fix the skill once → every product benefits; each product only declares its config.

## The SET (what "identity" includes, by tier)

- **Tier 0 — atoms:** the LUẬT + grid + color/stroke tokens.
- **Tier 1 — marks:** primary · compact/secondary · monogram · wordmark.
- **Tier 2 — applications:** favicon set · avatar (replaces hardcoded `PT`) · OG/social template · email signature · loading/splash.
- **Tier 3 — extensions:** motif/decoration · animated/variable mark · short guideline (do/don't).

## Roadmap

| Phase | Work | Output | Gate |
|---|---|---|---|
| **0** | This spec | epic file | **← approval here** |
| **1** | Draw 9 directions (one LUẬT each) → `/ddl/identity` | DDL showcase | user reviews & refines → **lock 1 direction** |
| **2** | Portable skill + `brand.config.ts` → generate the 4 v1 output groups from the locked master | skill + assets | replaces all 3 ad-hoc systems on the site |
| **3** | Full program: motif, video sting (Remotion), short guideline | complete identity | — |

> **Phase 1 technical note:** `/ddl/identity` is a **new route** → requires a **dev-server restart** to register (HMR is unreliable for new routes/lazy chunks). The server is started by the user, never by Claude — flagged at build time.

## Roadmap checklist

Worked **sequentially** top-to-bottom. Config schema chốt as-built (see above) — item 0 closed.

**Phase 1 — runtime component (A) — ✅ done**
- [x] `@portfolio/shared/features/brand` lib (Monogram / Wordmark / Signature / Loader, types, `TDP_BRAND`, Newsreader-500 outline data)
- [x] `/ddl/identity` showcase consuming the lib (variants · 16/32px gates · knockout · live recolour · theme toggle · loader replay)
- [x] Font locked = Newsreader 500; per-glyph draw-on; Dot sized as deliberate atom (`r=10`)
- [x] **Config schema chốt as-built** (`name/monogram/wordmark/theme`; `variant` render-time, `outputs` skill arg)

**Phase 2 — generator skill (B)**
- [x] **Master** — `master.util.ts` in the brand lib: pure, framework-agnostic SVG-string builders (`monogramSvg` / `wordmarkSvg` / `signatureSvg` / `masterSvg`), themeable (`ink`/`accent`), variant-aware, with `background` + `padding` (clearspace) for asset composition. Resolves `currentColor` to explicit ink so output is standalone. Verified faithful across full/mono/knockout + horizontal/stacked + 32px gate.
- [x] **Tooling** — `sharp` already present (does SVG→PNG); only added `png-to-ico` (devDep) for `.ico`. `@resvg/resvg-js` not needed.
- [x] **Skill (full pipeline)** — `.claude/skills/brand-identity/` (project-committed, config-driven → portable). **Two stages, both committed**: `gen-glyphs.mjs` (Stage 1: font → `glyph-outlines.data.ts`, via opentype.js **1.3.4** — 2.0.0 corrupts glyphs) + `gen-assets.mts` (Stage 2: master → assets). The instanced font lives in `fonts/`; `references/pipeline.md` documents end-to-end + decisions. Stage-2 run recipe: esbuild-bundle (externalize sharp/png-to-ico) → node from repo root; imports the lib's pure `master.util` + `brand.config` (never the Angular barrel). Replaces the former throwaway `/tmp/fontgen`.
- [x] **Favicon set** — 16/32/48/180(apple-touch)/192/512 + `favicon.ico` → `apps/landing/public/brand/`. 16px is tight but **decision 2026-06-08: keep `tdp.` at every size** (accept marginal 16px; modern browsers prefer 32/192). 32px+ clean.
- [x] **OG / social image** — 1200×630, Signature centred on dark surface, accent Dot. Verified crisp.
- [x] **Email signature** — `email-signature.png` (2× retina) + email-safe `<table>` HTML. Rendered in **light-mode ink** (fixed a bug where dark-mode ink was invisible on white email bodies).
- [ ] Lottie / cross-platform loader — **deferred** (web CSS loader already in lib)

**Site integration — replace the 3 ad-hoc systems**
- [x] Header `tdp.` text → `<brand-monogram class="header-logo">` (all 3 states: scrolled pill, top, mobile). Inherits text colour (hover→accent), indigo Dot. Verified live both states.
- [x] Footer wordmark (`'Portfolio'` fallback) → `<brand-wordmark>` in the footer-banner brand block. Verified live.
- [x] Blog signature circular `PT` → brand: `<brand-monogram>` chip (kills the 2nd initials system) + `<brand-wordmark>` name; bio/links kept. Verified live.
- [x] ~~Content 40px monogram → brand component~~ **SKIPPED — mis-audited.** `entry.monogram` on the colophon page is per-entry **tech initials** (Ag/Ns/Nx/Tw/Rl/Cd…), not the personal brand; replacing with `tdp.` would be wrong. Left as-is.
- [x] `favicon.ico` trơn → generated favicon set wired in `index.html` (`/brand/favicon.ico` + 16/32 png + apple-touch 180). Verified serving 200 live.
- [x] OG `null` → `og.png` + Open Graph / Twitter meta in `index.html`; `<title>`/description set. `og:image`/`og:url`/`twitter:image` **absolute** → `https://thunderphong.com/`.

**Phase 3 — full program** (blocking ACs worked in this order: motif → animated mark → guideline)
- [x] **(1) Motif / decoration pattern** — **locked = lines-only blueprint grid** (direction A, chosen over dot-field / halftone in a 2-round `/ddl` review). The Dot is deliberately **absent** from the motif so the mark's accent Dot stays the only circle wherever the motif sits behind it (solves the "field dots clash with the wordmark Dot" critique by removing competing dots entirely). Promoted into the lib: `MOTIF` token + `motifSvg(w,h,opts)` builder (assets) in `master.util.ts`, and `<brand-motif>` web primitive (CSS-gradient grid; `accent`/`cell`/`opacity` inputs; absolute, `pointer-events:none` bg layer). `/ddl/identity` shows the canonical component (recolour + light/dark verified). Ties into E4's "hero type + ambient blueprint".
- [x] **(2) Animated / variable mark** — **Loader is now duration-adaptive** + a **faux variable-weight** kept. The Loader gained `mode` (`draw` / `drop` / `wipe` entrances) and `[done]`: after the entrance it loops a "still working" Dot pulse until `done` flips true (then the Dot settles solid), so it fits any load time (3/5/10s…) instead of being a fixed one-shot sting. `<brand-monogram>` gained `[weightBreathe]` (animates a stroke on the outline → faux weight; **true** variable-font weight is deferred — needs a `wght`-axis woff2, a separate font-asset decision). **Cut after live review:** standalone Dot `pulse` (its real role is the loader's loop, folded in there) and hover `interactive` (not wanted). All motion is opt-in and reduce-motion → static. `/ddl/identity` "Motion" section demos it live.
- [x] **(3) Brand guideline** (do/don't, clearspace, min-size, knockout) — added as a **Guidelines · do/don't** section on `/ddl/identity` (kept in the one canonical brand reference rather than a new route). Clearspace panel (dashed cap-height margin), min-size gates (16px floor / 32px+), and an 8-cell do/don't grid: **do** = recolour accent per product · knockout on accent fill · mono inherits `currentColor`; **don't** = stretch/distort · rotate · shadow/glow · recolour the letters · full mark on low-contrast. Verified live in light + dark.
- [ ] Video sting — Remotion (⚠️ license $100/mo if ≥4 people) — **deferred, NOT a blocking AC**: kept for future reference, does not block epic "done".

**Housekeeping (non-blocking)**
- [x] Tests for the brand lib. `master.util.spec.ts` — 19 specs: viewBox padding, variant→Dot colour (full→accent, mono/knockout→ink), default ink/accent from `TDP_BRAND`, background null vs set, wordmark Dot coords, signature geometry (horizontal wider-than-tall, stacked taller, two nested marks, both Dots accent), `masterSvg` dispatch + fallback, and motif (tileable pattern, lines-only/no-circle, MOTIF-token defaults, accent recolour, background rect count). Closes the code-review WARNING.
- ~~Resolve open questions~~ — **dropped 2026-06-08** (future product names/rubric weighting): no longer gating; revisit ad-hoc when a real future product appears.

## Risks

- **Over-divergence in Phase 1** — 9 directions × 3 forms is a lot; some will obviously lose. Mitigated by the gates (16px / 1-color) eliminating non-starters fast.
- **Custom letterform scope creep** — drawing bespoke glyphs is real work; keep it to the chosen direction only, after lock.
- **Skill portability vs config drift** — the per-project config must fully describe theming, or assets diverge silently. The schema above is the contract.
- **Cohesion vs distinctiveness tension** — the mark must not be subservient to the existing serif/mono system, but also must not fight it (rubric axis 6).

## Open questions

- Rubric weighting: 3 + 7 as heaviest accepted by default — confirm if a Phase-1 direction surprises.
- Do any future product names/domains exist that should constrain the "variant per product" design now?
- Does the author have a pre-existing shape instinct or reference brands (loved/hated) to feed Phase 1?

## Change log

- 2026-06-08 — **Phase 3 (3) guideline shipped + brand-lib tests added → epic blocking ACs done.** Added a **Guidelines · do/don't** section to `/ddl/identity` (kept in the single canonical brand reference, not a separate route — avoids a new-route restart and keeps DDL the one source of truth): a clearspace panel (dashed cap-height margin), min-size gates (16px floor / 32px+ clean), and an 8-cell do/don't grid — **do**: recolour the accent per product, knockout on a solid accent fill, mono inherits `currentColor`; **don't**: stretch/distort, rotate, shadow/glow, recolour the letters, full mark on low-contrast. Verified live in light + dark. **Tests:** `master.util.spec.ts` (19 specs) covers padding, variant→Dot colour, defaults, background, wordmark Dot, signature geometry, `masterSvg` dispatch, and the motif builder — closes the code-review WARNING. **Open questions dropped** as non-gating (per author). Remaining items are all non-blocking deferred: true variable-font weight (needs a `wght`-axis woff2) and the video sting (Remotion, license-gated). The epic's blocking scope is complete.
- 2026-06-08 — **Phase 3 (2) Animated/variable mark shipped.** Built four motion candidates in `/ddl` for live review (Dot pulse, loader entrance variants, hover affordance, faux variable-weight). Key reframe from the author's question "does the loader handle a 3/5/10s load?": the loader was a one-shot ~1.5s entrance, NOT duration-adaptive. Resolved by making it **two-phase** — entrance (`mode` = draw/drop/wipe) → **"still working" Dot-pulse loop until `[done]`** → settle solid. This folds the standalone "Dot pulse" candidate into the loader (its real purpose). **Kept:** all three entrance modes + faux variable-weight (`[weightBreathe]` stroke on the outline). **Cut:** standalone monogram/wordmark `pulse` and monogram `interactive` (hover) — pruned from the lib. **Deferred:** true variable-font weight (needs a `wght`-axis woff2 — a font-asset decision, flagged not yet taken). `nx build landing` green; loop / done / replay verified live. Next: (3) brand guideline page.
- 2026-06-08 — **Motif applied to OG asset; scope decision locked.** `buildOg` (gen-assets) now composites the blueprint Motif as a subtle texture (`motifSvg`, cell 48) behind the Signature — verified, the two indigo Dots stay the only circles. **Scope decision:** the landing **site keeps its existing `landing-background`** system (6 patterns incl. a perspective-blueprint hero) — `<brand-motif>` is NOT forced onto landing pages (would duplicate/compete). brand-motif's home is **assets** (OG ✓; favicon/email left clean — too small / clean contexts) and as the **portable** motif for console + future products (which have no `landing-background`). Favicon/email intentionally not textured.
- 2026-06-08 — **Phase 3 (1) Motif shipped — lines-only blueprint grid.** After a 2-round `/ddl` review (round 1: dot-field / baseline-rule / blueprint-grid / stroke-trace → all read as decoration detached from the mark; the author's key critique: a field dot ≠ the wordmark's Dot in size + alignment, "nothing blends"; round 2: re-cut to A lines-only / B dot-field-as-same-atom / C halftone-dispersion), the author **locked A · lines-only**. Insight: the cleanest blend is to **remove competing dots** — the motif is pure blueprint lines, so the mark's accent Dot is always the only circle and always pops. Promoted into the lib: `MOTIF` token + `motifSvg()` builder in `master.util.ts` (assets) and the `<brand-motif>` web primitive (CSS-gradient grid, accent/cell/opacity inputs). `/ddl/identity` rebuilt to showcase the canonical component; `nx build landing` green; recolour + light/dark verified live. Next: (2) animated/variable mark.
- 2026-06-08 — **Phase 3 scoped + sequenced; brand work committed.** Brand system + skill + site integration pushed (4 commits). Phase 3 blocking ACs ordered: **(1) motif/decoration** → **(2) animated/variable mark** → **(3) guideline `/ddl` page**. **Video sting (Remotion)** demoted to **non-blocking** — kept in the epic for future reference, epic can reach "done" without it. Brand-lib tests stay as a (non-blocking) housekeeping item that closes the code-review WARNING.
- 2026-06-08 — **Pipeline made whole + committed; Dot enlarged; Wordmark gains its Dot; OG absolute.** (1) **Captured the origination half** that was throwaway in `/tmp`: the glyph-extraction generator + the instanced font now live in the committed skill, renamed `.claude/skills/brand-asset-gen` → **`brand-identity`** (two stages: `gen-glyphs.mjs` font→`glyph-outlines.data.ts`, `gen-assets.mts` master→assets) + `references/pipeline.md` documenting end-to-end + decisions, so a new product reuses it with minimal redo (font + config + run). Added `opentype.js` **pinned 1.3.4** as devDep (2.0.0 regresses `toPathData`, corrupts `g`/`a` — found via OG render). (2) **Dot enlarged** r=10→13 and **spacing fixed**: placed a fixed `dotGap` (14u, user-picked) past the last glyph's true ink edge — the earlier advance-based formula made the bigger Dot sit too close/overlap, reading cramped. (3) **Wordmark now closes with the Dot** — `Phuong Tran.` — the same accent atom as `tdp.`; `<brand-wordmark>` gained `variant`/`accent` inputs + `WORDMARK_DOT`, Signature passes them through, Loader pops the wordmark Dot after the last glyph (dynamic delay). This **reverses** the earlier "no dot on the wordmark" decision. (4) `og:image`/`og:url`/`twitter:image` set absolute to `https://thunderphong.com/`. Regenerated all assets; `nx build landing` green; header/footer/blog/og verified live.
- 2026-06-08 — **Site integration: 3 ad-hoc mark systems replaced by the brand lib (verified live).** Header `tdp.` text (×3 states) → `<brand-monogram>` (`.header-logo`, 1.35em); footer brand block → `<brand-wordmark>`; blog signature `PT` circle → `<brand-monogram>` chip + `<brand-wordmark>` (2nd initials system gone). `index.html` wired to the generated favicon set + Open Graph/Twitter meta + real title/description. All confirmed via Playwright against the running dev server (HMR picked up the lib imports — no restart needed). **Content monogram NOT touched** — re-audit showed `entry.monogram` is per-entry tech initials on the colophon (Ag/Ns/Nx…), not the personal brand; the original audit mis-grouped it. **Open:** og:image needs the production domain to be absolute.
- 2026-06-08 — **Phase 2 generator shipped (skill + Master + v1 assets).** Added `master.util.ts` to the brand lib — pure, framework-agnostic SVG-string builders (`monogramSvg`/`wordmarkSvg`/`signatureSvg`/`masterSvg`), themeable + variant-aware, `background`/`padding` for composition. Created project-committed skill `.claude/skills/brand-asset-gen/` (config-driven → portable): reads the lib's pure `master.util` + `brand.config`, rasterizes via **sharp** (already a dep) + **png-to-ico** (newly added devDep — `@resvg/resvg-js` proved unnecessary), composing assets with sharp `composite`. Generated the v1 set into `apps/landing/public/brand/`: favicon 16/32/48/180/192/512 + `favicon.ico`, `og.png` (1200×630), `email-signature.png` + `.html`. Verified each by rasterizing & reading the PNGs. Two issues found & fixed mid-build: (1) `REPO_ROOT` via `import.meta.dirname` wrote assets *above* the repo after bundling → switched to `process.cwd()` (run-from-root); (2) email-sig used dark-mode ink → invisible on white email bodies → forced light-mode ink. **Open:** 16px favicon legibility (wide `tdp.` too tight) — keep or add a compact mark. Next: site integration (wire favicon/OG into `index.html`; replace the 3 ad-hoc mark systems with the lib components).
- 2026-06-08 — **Roadmap → checklist; config chốt as-built; starting Phase 2 sequentially.** Added a top-to-bottom checklist (Phase 1 ✅ → Phase 2 skill → site integration → Phase 3 → housekeeping). Config schema locked to the shipped shape (`BrandConfig = name/monogram/wordmark/theme`; `variant` render-time, `outputs` skill arg) — superseded the earlier `glyph/clearspace/surface/outputs` draft. Next: Phase 2 item 1 = the Master SVG.
- 2026-06-08 — **Component A built: the `brand` lib.** Created `@portfolio/shared/features/brand` (`scope:shared`, `type:shared-feature` — cross-app, mirrors `breakpoint-observer`; first attempt mis-filed as a new `type:brand` under `shared/`, corrected). Config-driven standalone components: `<brand-monogram>` (variant full/mono/knockout, `[accent]`), `<brand-wordmark>`, `<brand-signature>` (horizontal/stacked lockup), `<brand-loader>` (per-glyph draw-on, `mark` monogram/wordmark, `replay()`). Plus `BrandConfig/BrandTheme/BrandVariant` types, `TDP_BRAND` default config, and generated Newsreader-500 outline data (`glyph-outlines.data.ts`, via fonttools instancer + opentype.js). Marks render `currentColor` ink + themeable `--brand-accent` Dot → SSR-safe, recolour per product, scale with font-size. `/ddl/identity` rebuilt to **consume** the lib (showcase: variants, 16/32px gates, knockout-on-accent, live recolour, theme toggle, loader replay). `nx build landing` green. Tooling for the generator skill (`@resvg/resvg-js` + `png-to-ico`) approved but NOT yet installed. Next: Phase 2 generator skill (reads `brand.config.ts` + Master → emits favicon/OG/email-sig).
- 2026-06-08 — **Font locked = Newsreader 500; draw-on animation reworked to per-glyph.** Legal cleared: Newsreader is SIL OFL 1.1 (Production Type) — free commercial use incl. logos/trademark; only the font *file* can't be sold/redistributed-under-name. Logo shipped as **outlines** sidesteps embedding entirely. Built the v1 loading sting from REAL Newsreader outlines (no hand-drawing): `fonttools varLib.instancer` bakes a static wght=500/opsz=40 instance → `opentype.js` extracts **per-glyph** outline paths into `draw-paths.ts`. First pass used one combined path + global `fill-opacity` → felt like two disconnected phases (pen races, then whole word fades in) because a global fill can't follow the pen. Fixed: each glyph is its own `<path>`, traces (stroke-dashoffset) then inks (fill-in/stroke-out) in its own ~0.62s slot, staggered 0.12s left-to-right → fill visibly chases each letter; `tdp.` dot pops after the final glyph. Reduce-motion → static filled state. Open: confirm rhythm; then derive the rest of the reusable set (favicon / OG / email sign-off) from the locked type.
- 2026-06-08 — **Major pivot: drop custom marks → name in existing site fonts.** After the all-monoline renders still failed on aesthetics / human-feel / legibility, root-caused the real bottleneck: **origination** (inventing a soulful mark from a brief) is what AI does badly, not production. Hand-authoring bezier letterforms = why the monoline read amateur. Reframed the input problem (sketch / type-seed / reference-board / object). Author chose **type-seed**, then simplified further: **use the existing site fonts, no new font, no drawn mark, no dot.** `/ddl/identity` rebuilt as a wordmark specimen — "Phuong Tran" + "tdp" monogram set in Newsreader / Inter / JetBrains Mono at two weights each, plus a hybrid lockup (serif name + mono monogram); theme toggle to check both modes. Recolour/gates/SVG-mark machinery removed. `nx build landing` green. **Anchors (dot↔nặng) and the custom-letterform decision are reversed** (struck through above). Open: pick face + weight (or hybrid) → tune spacing/optical size → lock lockup → derive the reusable set from the chosen type. New durable preference: present explorations in the real `/ddl` page, never `/tmp`.
- 2026-06-07 — **Direction locked: ALL-MONOLINE (handwritten).** After viewing round-2 detail renders the author cut A1–A4 + B1/B3, disliked A3 (d-rotation), but liked the monoline concept *drawn as the name* and the restored round-1 grid. Coherence fork resolved → one visual language: **monoline**. `/ddl/identity` rebuilt as the all-monoline system: the **mark** = monoline “P” (P1 plain / P2 foot-tail ★ / P3 + nặng-dot), the **wordmark** = monoline “Phuong” (plain + nặng-dot variant), plus a mark+wordmark **lockup**. Recolour + theme retained; knockout now also flips `--ddl-accent: currentColor` for stroke marks. `nx build landing` green; renders verified via screenshot. Open: pick the P foot; refine letterform terminals + true single-stroke joins + draw the “Tran” half; then lock glyph → Phase 2 (skill + assets).
- 2026-06-07 — **Phase 1 round 2.** Author feedback: cut directions 01 (period), 02 (semicolon), 03 (caret), 07 (fused glyph — "reads as a cross with a handle"). Expand the two survivors — **06 grid-module** + **08 signature** — into variants. `/ddl/identity` rebuilt as two families: A · grid-module (A1 diagonal cut, A2 stem+bowl, **A3 d↔p rotation ★**, A4 notched square) and B · signature (B1 monoline ligature, **B2 ruled stroke ★** — bridges both families, B3 variable-weight filled, B4 underline flourish). Each variant shows compact + 16px + 1-colour gates; each family ends with a wordmark/rule-reveal lockup. Cross-breed flagged (B2 ruled stroke + A3 rotation). `nx build landing` green. Next: pick variant(s) → lock.
- 2026-06-07 — **Phase 1 built.** `/ddl/identity` route + `ddl-identity` component (TS/HTML/SCSS) added under `apps/landing/src/app/pages/ddl/`, linked from the DDL index nav (compositions group). All 9 directions rendered as hand-authored SVG in three forms (full · compact/favicon · wordmark) + both rubric gates (16px + 1-colour knockout via `[data-accent]`→currentColor). Live recolour via `--ddl-accent` (5 presets + custom picker) proves theme-map config; caret (03) blinks and signature (08) draws on load, both reduce-motion-guarded. `nx build landing` green. Letterforms exploratory (text placeholders) — custom glyph deferred to Phase 2. Next: review → score against rubric → **lock one direction**.
- 2026-06-07 — Epic created. Phase 0 spec drafted. Locked: destination (full program), sequence (DDL→lock→skill→expand), anchors (dot↔nặng + engineer primitives; avoid orbit), `tdp` canonical / `Phuong Tran` fallback, custom letterform, SVG master, theme-map config depth, portable-skill home, v1 output scope (SVG+favicon/OG/email-sig/loading+Lottie), tooling stack (sharp/resvg/Satori/Playwright/Lottie; Remotion deferred), selection rubric (2 gates + 5 axes, 3+7 heaviest). Awaiting approval to start Phase 1.
