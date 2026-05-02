# Epic E4: UI/UX Direction & Moodboard

> Parent: [Initiative: Portfolio](./initiative-portfolio.md)
> Status: ✅ closed (2026-05-02). Direction lock complete; handoff to E5.
> Depends on: E1 (audience/narrative), E2 (locked content). Parallel-able with E3.
> Feeds: E5 (implementation).

## Purpose

Define the **visual signature** of the site — typography, palette, density, layout grammar, motion rules, hero visual concept, card visual concept — well enough that E5 can build without re-deciding aesthetic questions on the fly.

The friend-test priority is **visual >> projects >> content** (from E1). This epic carries the heaviest aesthetic load. Get it wrong and the site reads as "another AI portfolio" no matter how good the copy is.

## Constraints already locked (from E1)

**Anti-patterns — do not produce these:**

- Scroll-triggered content reveal that delays readability (fade-in-on-scroll, "AOS"-style libraries that hide content until viewport-entry). Animated backgrounds are NOT in this ban — they are fine when they earn their place visually.
- "Claude landing clone" aesthetic (gradient mesh, oversized rounded cards, Vercel-default look).
- Skill bars, badge grids, generic About → Skills → Projects → Contact template.
- Mandatory animations to read content.
- Box-shadow on cards/tables (project rule — borders only, hover glow OK).

**Must-haves:**

- Hero is a visual moment, not just words.
- Project cards visually rich; Document Engine first-among-equals.
- Aesthetic discoverable in 3 seconds (friend-test).
- Lighthouse ≥ 95 across all four scores — visual choices must not torch performance.
- 4px grid for all spacing.

**Reference signals (inspiration, not copying):**

- railway.com — rail/scroll concept idea, density, technical-but-warm tone.
- Franco Ruiz — specialist density, information-rich without clutter.
- Sharon — voice friendliness translated to visual warmth.
- Parth — typographic boldness, card grids, pill clusters.

## Discovery questions

Answers feed the moodboard and direction lock. Group A first; B and C unlock once A is mostly settled.

### Group A — Identity & mood

A1. **One-word visual identity.** Pick 1–3 from: *technical, warm, sharp, quiet, dense, editorial, playful, brutalist, restrained, confident, crafted, instrument-grade.* Or write your own. Goal: a north star adjective set we can audit every later decision against.

A2. **Light or dark?** Light-first, dark-first, dual with toggle, or context-driven (e.g. dark hero, light body)? Dual costs E5 time — only choose if a genuine reason.

A3. **Color temperament.** Three rough buckets:
   - **Quiet/neutral** — near-monochrome with one restrained accent (Linear, Vercel docs).
   - **Editorial-warm** — off-whites, paper tones, ink blacks, one warm accent (Stripe Press, Pitch).
   - **Technical-cool** — slate/blue/cyan with code-friendly contrast (Railway, Supabase).
   Or "none of the above — here is what I want."

A4. **Typography temperament.** Same shape:
   - **Editorial-serif primary** — display serif + clean sans for UI (Stripe Press style).
   - **Mono-flavored** — sans for body, mono accents for labels/metadata (Railway, Linear-ish).
   - **Big sans confident** — one strong sans across the site, weight contrast does the work (Parth, Vercel).
   Or your own.

A5. **Density preference.** Generous whitespace (Sharon), medium (Franco), or dense/info-rich (Railway homepage)? This locks rhythm decisions early.

### Group B — Layout grammar

B1. **Hero visual concept.** Pick a direction or mix:
   - **Type-only hero** — large name + role, typographic moment, no imagery. Cheapest, hardest to make memorable.
   - **Type + ambient artifact** — name + role beside a small live thing (clock, status, terminal, mini-canvas). Adds aesthetic without imagery.
   - **Type + diagram** — name + role with a hand-drawn or generated systems sketch (rails before train made literal).
   - **Asymmetric editorial** — magazine-style layout, name in one corner, position in another, dateline.
   - Other.

B2. **Section transition style.** Hard rules between sections (full-width borders, color shifts), soft (just spacing), or mixed by section?

B3. **Card grid rules.** Project cards: equal-height grid, asymmetric (Document Engine bigger), or stacked editorial layout (each card a row)?

B4. **Multi-page navigation surface.** Header link row, hamburger, or "There's more, if you're still here" footer banner only (the locked E2 footer)?

### Group C — Detail vocabulary

C1. **Border vocabulary.** Hairline 1px, 2px confident, dashed for code/quote, or none (just spacing as separation)?

C2. **Corner radius.** Sharp (0–2px), modest (4–6px), pill (8–12px), or context-driven?

C3. **Motion rules.** Three levels possible:
   - Static — no motion outside browser defaults.
   - Micro — hover-only, link nudges, card lift (no entry animations).
   - Considered — select moments animate intentionally (hero artifact, one card, footer).

C4. **Imagery policy.** Real screenshots only, illustrated/stylized, mixed, or no images at all (type + diagrams)?

C5. **Code/terminal as visual element.** Terminal blocks as decoration somewhere (colophon, hero, monorepo card)? Yes / no / "only if it earns its place."

### Group D — Per-page treatment (lighter, feeds E5)

D1. **Home vs sub-pages.** Same visual rules, or sub-pages quieter (more reading-focused)?

D2. **`/uses` and `/colophon` tone.** Same as home, or these get to be more playful/casual?

D3. **Project detail page.** Long-form editorial (Stripe-Press-ish), case-study density (Franco-ish), or screenshot-led gallery?

## Process

1. Author answers Group A in this file (free-form, doesn't have to pick from given options).
2. Curate moodboard — 5–7 pinned references in `assets/moodboard/` with one-line note per pin saying what to *steal* and what to *avoid*.
3. Lock direction (palette tokens, type pair, density tier, hero concept) in this file's "Direction lock" section below.
4. Group B and C answered with direction in mind.
5. Group D answered last; small enough to defer to E5 if needed.

## Group A — answered (2026-05-01)

- **A1 — Identity adjectives:** **technical + quiet**. Dark-mandatory (the "quiet" here means restraint, not low-contrast). Tool-like feel, but with breathing room — not Bloomberg-dense.
- **A2 — Mode:** **dark-first**, with toggle (parity with console app).
- **A3 — Color temperament:** **technical-cool**. Slate / blue / cyan family, code-friendly contrast.
- **A4 — Type temperament:** **editorial-serif primary for display + sans for body**. Mono allowed for metadata/labels (fits technical-cool well). Multi-family by design.
- **A5 — Density:** **medium** (Franco-tier). Information-rich without Railway-homepage clutter.

**Combined direction shorthand:** *dark, technical-cool, restrained, multi-family typographic, medium density.* Like Linear with editorial display type and serious weight in the headlines.

## Tooling & Process

How direction is discovered and locked, before any E5 code is written.

### Discovery phase (this epic)

- **Stitch MCP** (available in session) — generate 3–5 hero/section variants from a single text prompt locking direction adjectives. Compare side-by-side. Cheapest way to see "what does dark + technical-cool + editorial-serif actually look like in three different hands."
  - **Stitch contract (locked 2026-05-01):** Stitch outputs are **composition references for layout/structure decisions only**. They are NEVER the source of truth for content, copy, stack, or palette. Stitch hallucinates content (e.g. "React Next.js Tailwind" when the actual stack is Angular; "Senior Product Designer" when the actual title is Senior Frontend Engineer). Implementation in E5 is hand-written Angular/SCSS using locked E2 content; Stitch screenshots are reference images to mimic *layout intent*, not pixel-match.
- **Moodboard** — `assets/moodboard/` directory. 5–7 pinned screenshots/URLs, each with a one-line note: *steal X, avoid Y.* Manual curation; this is where taste gets sharpened.
- **Figma (optional)** — only if a single hero frame needs hand-tuning before code. Not required by default.

### Lock phase (end of this epic)

- Direction-lock section below filled with concrete tokens (palette hex/oklch, type families, spacing tier, motion tier).
- Moodboard frozen — no new pins added during E5.

### Build phase (E5, not now)

- Tailwind tokens in `libs/landing/shared/ui/` — palette, type scale, spacing scale, motion tokens.
- `/component-bank` skill — per-component design docs as components are built.
- `/design-check` skill — review a built component against bank patterns before merging.

### Recommended next concrete step

1. Run Stitch MCP with the locked direction → 3 hero variants → pick the one that feels closest.
2. Pin 5–7 references to `assets/moodboard/` (Linear, Stripe Press, Railway, Franco, Vercel docs, Robin Rendle, plus one wildcard).
3. Then answer Group B (layout grammar) with those visual anchors in hand.

## Moodboard — pinned 2026-05-01

Captured to `assets/moodboard/`. Each pin: what to **steal**, what to **avoid**.

| # | Pin | URL | Steal | Avoid |
|---|-----|-----|-------|-------|
| 01 | Linear | linear.app | Quiet confidence on dark; hairline borders; mono-flavored UI labels; product mock embedded under hero | Saturated brand-blue accent; over-reliance on product mocks |
| 02 | Stripe Press | press.stripe.com | Editorial serif logo + italic tagline ("Ideas for progress"); ink-dark background (not pure black); restraint in chrome | Cold-start blank canvas; Press structure isn't a portfolio — borrow tone, not layout |
| 03 | Railway | railway.com | Technical density via embedded terminal/canvas; "Ship software peacefully" voice (calm + technical); cool-dark with one purple accent; animated star-field hero is fine if it earns its place | Gradient overload; over-busy below the fold; cookie-banner clutter |
| 04 | Vercel Docs | vercel.com/docs | Mature dark UI; reading-rhythm typography in long-form; right-rail "Quick references" pattern (good for `/uses`, `/colophon`) | Generic SaaS docs feel; corporate flatness — needs personality injected |
| 05 | Design Systems Surf | designsystems.surf | Editorial-magazine-of-products framing; dense horizontal logo strip; tag chips per card | Light-only; cookie banner clutter; layout would need re-skinning hard for dark |
| 06 | Kiro | kiro.dev | Big bold sans hero on dark; product screenshot embedded directly under hero; restrained accent (purple) | Tight purple accent — pick a different hue; CTA button styling too generic |
| 07 | Parth Sharma | parthh.in | See **Parth deep-read** below — closest to direction, full pattern set documented separately | Gradient violet→pink "punch word" treatment risks looking trendy/AI-generic; use the pattern but pick a more restrained accent (no gradient text) |

### Parth deep-read (5 captures: 07a–07e)

**Role of this reference:** Parth is a *direction validator*, not a template. The captures confirm that our direction (dark + technical-cool + editorial-serif emphasis + medium density + bio-card-grid layout) is coherent and ships well in someone else's hands. Do not copy structure; use as evidence that decisions made in E1/E2 are workable.

Patterns observed (not directives):

1. **Sans display + serif italic emphasis rhythm** — every section pairs a sans clause with a serif italic "punch" clause. Validates our A4 (editorial-serif display) decision. We will use the rhythm; voice and accent must be ours.
2. **Eyebrow caps-gray labels** anchor sections without large headings. Lightweight pattern, can be considered for our IA.
3. **Live data widgets** (clock with timezone, latest commit, "Available for work" dot) make the page feel alive without animation — directly relevant to E2 Card A's `Profile.timezone` gap.
4. **Bio Card Grid layout** confirms our locked E2 structure (Card A identity / Card B philosophy / Card C contact) is a known-working portfolio pattern.
5. **Programmer-native typography** (`&&` inside a heading) — interesting voice-as-typography move. Worth considering for one section if it reads aloud well in our voice.
6. **Pill segmented control inside a card** for multi-facet content — lightweight interactivity, no entrance animations.
7. **Status dot (green) for availability** — small device that works hard.
8. **Folded/angled photo cards** add craft texture without imagery dominating.

**Anti-pattern observed in Parth:** gradient italic punch words (violet→pink) on 4/5 captures. Reads as "AI portfolio template" and is the single biggest risk if direction drifts. Our serif italic emphasis must stay restrained — single off-white, or one quiet accent.

**Synthesis:** Parth proves the family of decisions we already locked is shippable. The site we build will not look like Parth's — different palette, different copy, different layout DNA — but the rhythm of "sans authoritative + serif italic intimate + small live signals" is a real pattern with evidence.

**Cross-cutting steal:**

- All 7 sit in a "dark + cool + restrained" zone — confirms direction adjectives.
- Editorial serif appears in Stripe Press + Parth (italic for personality moments).
- Mono labels / metadata / status indicators appear in Linear + Railway + Vercel Docs.
- Product mock under hero appears in Linear + Kiro.

**Cross-cutting avoid:**

- Saturated single-hue accents (Linear blue, Railway purple, Kiro purple) all look samey.
- Animated backgrounds (Railway).
- Cookie-banner UI noise messing with first impression.
- Generic SaaS-docs/corporate flatness (Vercel Docs).

## Direction lock — partial (filled as Group answers land)

This section is the handoff to E5. Each line must be concrete enough that E5 doesn't re-decide.

- **Identity adjectives:** technical + quiet (Group A1, locked 2026-05-01)
- **Mode (light/dark/dual):** dark-first, with toggle (Group A2)
- **Palette family:** technical-cool — deep ink background (#0a0d12 range), cool slate neutrals, ONE restrained accent. **Accent locked to indigo-violet, between #7B67D1 and #6366F1** (around #6E66D9 — user's preference, 2026-05-01). NO gradient text. Specific token TBD in E5.
  - **Risk acknowledged:** indigo in this range is widely used (Linear, Vercel, Kiro, Stripe Press). Samey-ness risk if rest of design drifts toward generic. Mitigation: keep accent strictly *restrained* — single hue, no gradient, applied only to active state / one underline / one status dot. Editorial-serif rhythm + dark-first + hairline borders are what differentiate; the accent does not carry the identity.
  - Earlier lock said "NO violet/purple"; revised here. Cyan/teal moved to anti-pattern (would compete with indigo). (Group A3, revised 2026-05-01)
- **Type pair:** editorial-serif display (Newsreader or EB Garamond, used italic for emphasis only) + sans body (Inter or Geist) + mono labels (JetBrains Mono or Space Grotesk) for eyebrows / metadata / status. (Group A4)
- **Density tier:** medium (Franco-tier — information-rich without Railway-homepage clutter). (Group A5)
- **Hero concept:** **B1.e — Type + ambient blueprint background** (locked 2026-05-01).
  - Background: faint hairline grid receding to vanishing point (5–8% opacity, blueprint feel), or low-density starfield as alternative if grid reads too rigid in build.
  - Foreground composition: eyebrow → H1 (sans + serif italic cyan emphasis on "Engineer.") → sub (sans + serif italic phrase) → small status block bottom-right.
  - **Deltas from Stitch B1.e mock (handoff notes for E5):**
    1. **No system clock in hero.** If a live-time widget appears, it lives in a later section (Bio Card Grid Card A), not in hero status block.
    2. **No "↓ READ" indicator in hero.** If a scroll-prompt is needed, it goes to the very bottom of the page (footer banner area), not the hero.
    3. **Core stack chip set is NOT "React / Next.js / Tailwind."** Pull from E2 Tier 2 pills — Angular-led. Specific 3-item pick deferred to E5; candidates: `ANGULAR · TYPESCRIPT · NESTJS` or `ANGULAR · TIPTAP · NESTJS`.
    4. **Eyebrow rules:** drop "FRONTEND ENGINEER" from eyebrow (duplicates H1). Move "HCMC" out of eyebrow and into the bottom-right status block (below `AVAILABLE_FOR_HIRE`). Eyebrow may be empty, or replaced with a different micro-label (e.g. archive/issue dateline) if it earns its place.
  - Stitch reference image: `assets/moodboard/stitch-b1/B1e-grid-bg.png`. Use as composition guide ONLY — do not pixel-match copy or stack chips.
- **Section transition style:** **B2.c Mixed** (locked 2026-05-01) — most sections quiet (whitespace separation only, no rule); important sections (Selected Work, Get In Touch) get a "lift" via 1px indigo-accent top border + subtle tonal surface shift (#0a0d12 → #11151c). Reference: `assets/moodboard/stitch-b1/B2-transitions.png` bottom section.
- **Card grid rule:** **B3.d Tabbed + Mini Gallery** (locked 2026-05-01) for home Selected Work. Reference: `assets/moodboard/stitch-b1/B3d-tabbed-gallery.png`.
  - Layout: 3 horizontal tabs (mono caps, active = indigo color + 2px indigo bottom underline ONLY — no pill, no fill, no box) → 1px hairline rule → 40/60 split content area for active tab.
  - LEFT (40%): year/employer eyebrow mono · project name sans bold ~48px · 3-line description with one Newsreader serif italic emphasis phrase · vertical link list with indigo arrows · tech chip cluster (mono pills, hairline border, no fill).
  - RIGHT (60%): mini gallery — 2×2 grid of 4 image placeholders with 1px hairline borders + small mono `FIG. 0X · CAPTION` labels. Real screenshots replace placeholders in E5 once available.
  - Document Engine "first-among-equals" achieved purely through TAB ORDER (leftmost). No size/weight differentiation needed.
  - Section footer caption: `// HOME · SELECTED 03 · /projects FOR FULL ARCHIVE →` mono caps slate with indigo arrow link to multi-page route.
  - **Fallback rule:** if a project has no production-ready imagery for the gallery, swap that tab's right column to **B3.b asymmetric content layout** (text-only with framing). Document Engine is the only project with ready imagery in v1; the other 2 tabs may use the fallback at launch and upgrade as imagery becomes available.
  - **`/projects` index route** (multi-page, separate from home) reserves **B3.c stacked editorial** layout — long-form list of all projects, not just the home-curated 3.
- **Header navigation:** **H2 Plain Text** (locked 2026-05-01) — fully transparent sticky header, **NO bottom border under the header bar**. Left wordmark + 5 nav items as plain text (active = indigo accent COLOR ONLY — no underline, no pill, no box, no border indicator; others = slate) + right group (theme toggle · language switcher · CTA text-link · ⌘K mono hint). Overflow → "More ▾". Reference: `assets/moodboard/stitch-b1/H2-plain-text.png`.
- **Border vocabulary:** **1px hairline only** (locked 2026-05-02). 2px reserved for active-state indicators (e.g. tab underline in B3.d). No dashed, no double, no thicker rules. Hover/focus states change color, not border weight. (Group C1)
- **Corner radius scale:** **4px modest** (locked 2026-05-02) for cards, chips, inputs, buttons. Pill (full-round) reserved for status-dot badges only. Beautified screenshots (see C4) may use 8–12px to match the source mockup-tool default. User flagged interest in "softer" radii post-V1 — parking-lot for V2 revisit. (Group C2)
- **Motion tier:** **Considered** (locked 2026-05-02). Allowed: hover state color/opacity changes, focus rings, tab-switch transitions (~150–200ms ease), theme toggle crossfade, one intentional hero artifact moment if it earns its place. Forbidden: scroll-triggered content reveal (E1 anti-pattern), loading animations as decoration, AOS-style libraries, parallax. (Group C3)
- **Imagery policy:** **Real screenshots only** (locked 2026-05-02). Beautified via screenshot-mockup tool with strict palette constraint: solid color background from locked palette (indigo accent OR neutral dark surface) — NOT the tool's preset gradients (sunset/fire/peach/ocean would break tone). Browser window chrome (3 dots + URL bar) OK; device frames (phone/laptop/iPad) NOT used — projects are web, no mobile-specific framing. Fallback when a project has no production imagery: B3.b text card layout (already noted in card-grid rule). Tool selection deferred to E5; candidate list captured in `assets/moodboard/screenshot-tools.md`. (Group C4)
- **Code/terminal as visual element:** **No** (locked 2026-05-02). No fake terminal blocks, no `$ whoami` props, no blinking cursor decoration, no pseudo-code snippets used as ornament. Concept is over-used in dev portfolios and user actively dislikes it. **Allowed:** typographic marks already in copy — `//`, `→`, `↗`, `⌘K` mono hint, mono caps eyebrow labels — these are typography, not terminal mimicry. If a real code artifact appears in a case study (e.g. a snippet from the Console MVP), that is content, not decoration; it earns its place by being real. (Group C5)
- **Sub-page tone delta** (Group D, locked 2026-05-02):
  - **D1 — Home vs sub-pages:** sub-pages are **quieter**. Same palette / type / border vocab as home, but: indigo accent used more sparingly (only active link, no "section lift" treatment), no blueprint background on sub-page heroes, more whitespace between sections, fewer visual moments — sub-pages prioritize reading.
  - **D2 — `/uses` and `/colophon`:** **same tone as home.** No casual/playful delta. Technical + quiet rules apply uniformly.
  - **D3 — Project detail page (`/projects/<slug>`): D3.c Sticky Sidebar** locked. Reference: `assets/moodboard/stitch-b1/D3c-sticky-sidebar.png`.
    - Layout: full-width hero screenshot → 2-col body. LEFT sticky sidebar ~220px: "ON THIS PAGE" mono caps label + 5-item ToC (active item indigo) → hairline rule → "METADATA" label + ROLE / STACK / YEAR / STATUS stacked rows → hairline rule → "LINKS" label + 3 vertical text links with indigo arrows. RIGHT reading column ~680px: eyebrow → H1 → Newsreader serif italic deck → hairline rule → section headings mono caps small (OVERVIEW / THE PROBLEM / APPROACH / OUTCOME / WHAT I'D CHANGE) → body 17px sans line-height 1.7 → in-column figures (1px hairline border + FIG. 0X mono caps caption) → pull-quote (Newsreader serif italic + 2px indigo left border) → next-project footer.
    - **All 3 V1 projects use D3.c uniformly** — Console MVP justifies depth, the other 2 stretch to the same depth (good forcing function for content quality).
    - **Backend gap noted (defer to E5):** Project entity needs `tableOfContents`, `metadata.role`, `metadata.year`, `metadata.status`, `links[]`, `sections[]` (with section heading + body markdown). Existing `Project.links` migration (already queued from E2) covers links. New migration needed for `Project.sections` + `Project.tocAnchors`. Logged here, picked up by E5 prisma-migrate.
    - D3.a (Pure Editorial) and D3.b (Break-out Figures) parked for V2 `/blog` route if it ships.

## Annotation pattern — for case-study figures

Some figures benefit from inline annotations (curved arrows + pill callouts pointing to UI features), à la Pika's marketing screenshot pattern. Locked tool stack:

- **Excalidraw** (<https://excalidraw.com/>) — primary. Free, open-source, browser. "Hand-drawn" aesthetic matches the human/specific/concrete voice (Rule 4). Squiggly arrows feel personal, not corporate. Constraint: pill callout backgrounds use indigo accent (~#6E66D9) NOT default violet/pink.
- **tldraw** (<https://tldraw.com/>) — alternative if Excalidraw style feels too sketchy.
- **BrandBird** (<https://www.brandbird.app/>) — fallback one-shot tool (beautify + annotate in same flow); free tier.

**Workflow:** beautify screenshot (any tool from `screenshot-tools.md`) → import to Excalidraw → draw curved arrows + pill callouts in indigo → export PNG → place in `assets/projects/<slug>/fig-0X.png`.

## Open questions deferred

- Specific font files / licensing — once type pair locks, E5 handles the loading strategy.
- Dark mode tokens (if dual) — derive from light tokens at E5 time, not here.
- Per-component visual rules — E5 with `/component-bank` skill.

## Change log

- 2026-05-01 — Epic created. Discovery questions framed in 4 groups (identity/mood, layout grammar, detail vocabulary, per-page). Constraints from E1 carried forward.
- 2026-05-01 — Group A answered: dark-first + toggle, technical-cool palette, editorial-serif display + sans body + mono labels, medium density. Identity adjectives = **technical + quiet**.
- 2026-05-01 — Moodboard pinned (7 pins): Linear, Stripe Press, Railway, Vercel Docs, Design Systems Surf, Kiro, Parth Sharma. Captures saved to `assets/moodboard/`. Parth devtools-block screen captured as a craft sample; real homepage requires manual capture (site blocks devtools).
- 2026-05-01 — User supplied 5 manual Parth captures (07a–07e). Added "Parth deep-read" section: 8 patterns surfaced (sans+serif emphasis rhythm, eyebrow labels, live-data widgets, bio card grid validation, programmer-native typography, pill chips, status dots, folded photos). Anti-steal locked: gradient italic punch words. Constraint clarified: scroll-triggered fade-in is banned; animated backgrounds are NOT.
- 2026-05-01 — Stitch generated 5 hero variants (B1.a–B1.e) in project `11488078708947813219`, captures saved to `assets/moodboard/stitch-b1/`. **B1.e (Type + blueprint grid background) chosen** as Hero direction. Deltas from Stitch mock recorded in Direction lock. Stitch is a composition reference — content/copy/stack chips are NOT canonical, those come from E2.
- 2026-05-01 — 2 header variants generated (H1 segmented pill, H2 plain text) + B2 transition demo (3 styles stacked). **H2 Plain Text** locked as header. **B2.c Mixed** locked as section transition style (quiet by default; Selected Work & Get In Touch get indigo top border + tonal lift).
- 2026-05-01 — **Accent color revised: cyan/teal → indigo-violet** (~#6E66D9, between #7B67D1 and #6366F1) per user preference. Earlier "NO violet/purple" anti-pattern dropped. Risk noted in Direction lock: indigo widely used (Linear/Vercel/Kiro range); mitigation = strict restraint, single hue, no gradient.
- 2026-05-01 — Stitch contract clarified: composition reference only. Implementation = hand-written Angular/SCSS using E2-locked content. Stitch hallucinates content; do not pixel-match copy/stack/palette from outputs.
- 2026-05-01 — Selected Work card grid: 3 variants generated (B3.a equal grid, B3.b asymmetric, B3.c stacked editorial) — none had image showcase, user flagged. **New variant B3.d Tabbed + Mini Gallery** introduced and locked: 3 tabs + 40/60 split (left text/links/chips, right 2×2 mini gallery). Document Engine first via tab order. Fallback to B3.b text-only when imagery not ready. B3.c reserved for `/projects` index route.
- 2026-05-01 — Header active state revised: bottom border under header bar removed; active item indicator = indigo color ONLY (no underline, no pill, no border, no fill).
- 2026-05-02 — **Group C locked.** C1 = 1px hairline only (2px for active state). C2 = 4px modest (pill for status badges only; softer radii parked for V2). C3 = Considered motion (hover/focus/tab-switch/theme toggle; no scroll-trigger). C4 = Real screenshots only, beautified with palette-constrained backgrounds via mockup tool, browser chrome OK no device frames. C5 = No code/terminal decoration (typographic marks `//` `→` `⌘K` are typography, not terminal mimicry). Screenshot-tool candidate list saved to `assets/moodboard/screenshot-tools.md` (Pika no longer free; alternatives = BrandBird, Screely, Screenzy, Screenshot.rocks, CodeShack, ScreenshotStyle, Screenhance, Screenshots4all).
- 2026-05-02 — **Group D locked.** D1 = sub-pages quieter (same vocab, accent restrained, more whitespace, no section lift). D2 = `/uses` and `/colophon` same tone as home (no playful delta). D3 = **D3.c Sticky Sidebar** locked for project detail (3 Stitch variants generated: D3.a Pure Editorial, D3.b Break-out Figures, D3.c Sticky Sidebar; user confirmed D3.c suits case-study density). All 3 V1 projects use D3.c uniformly. D3.a/D3.b parked for V2 `/blog` route. Backend gap logged: `Project.sections`, `Project.tocAnchors` migrations needed for E5. Annotation pattern locked: Excalidraw (primary) + tldraw + BrandBird (fallback) — for inline curved-arrow + pill-callout figures, indigo accent palette only.
- 2026-05-02 — **E4 fully closed.** All 4 groups (A identity, B layout, C detail, D per-page) locked. Direction-lock section complete. Handoff package ready for E5.
