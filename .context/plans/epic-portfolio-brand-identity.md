# Epic: Brand Identity System & Portable Mark Skill

> Parent: [Initiative: Portfolio](./initiative-portfolio.md)
> Status: 🟢 open — Phase 1 in progress. `/ddl/identity` built 2026-06-07 (9 directions live); awaiting review + direction lock.
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
- No reuse of Newsreader/JetBrains for the logo letterform (see decisions).

## Locked decisions (2026-06-07)

| Item | Decision |
|---|---|
| Destination | Full identity program (Tier 1→3) |
| Sequence | DDL exploration (9 directions) → **lock 1** → build skill → expand |
| Anchors | dot `.` ↔ nặng + engineer primitives; **avoid** orbit/node |
| Initials | `tdp` **canonical** (full-name initials); `Phuong Tran` = fallback / version 2 |
| Letterform | **Custom-drawn** — do NOT reuse Newsreader / JetBrains for the mark |
| Master format | One hand-authored **SVG** = source of truth; everything else generated from it |
| Config depth | **Theme map** — `{ accent, surface, mode, variant: mono\|knockout\|full }`; one mark, recolor + variant per product |
| Skill home | **Portable skill + per-project config** — skill lives once (e.g. `~/.claude/skills/`), reads each project's `brand.config.ts`, generates assets into that project |
| Skill v1 outputs | SVG master + favicon set · OG/social image · email signature · loading + Lottie animation. (Video sting / Remotion = later.) |
| Presentation | A `/ddl/identity` showcase page (DDL = source of truth for landing UI) |

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

## Config schema (per-project `brand.config.ts`)

Shape the portable skill reads (theme-map depth):

```ts
export const brand = {
  glyph: 'tdp',              // canonical mark token
  wordmark: 'Phuong Tran',   // fallback / v2
  theme: {
    accent: '#6E66D9',
    surface: 'ink',          // token name or hex
    mode: 'dark' | 'light' | 'auto',
  },
  variant: 'full' | 'mono' | 'knockout',
  clearspace: 1,             // multiple of cap-height
  outputs: ['favicon', 'og', 'emailSig', 'lottie'],
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

- 2026-06-07 — **Direction locked: ALL-MONOLINE (handwritten).** After viewing round-2 detail renders the author cut A1–A4 + B1/B3, disliked A3 (d-rotation), but liked the monoline concept *drawn as the name* and the restored round-1 grid. Coherence fork resolved → one visual language: **monoline**. `/ddl/identity` rebuilt as the all-monoline system: the **mark** = monoline “P” (P1 plain / P2 foot-tail ★ / P3 + nặng-dot), the **wordmark** = monoline “Phuong” (plain + nặng-dot variant), plus a mark+wordmark **lockup**. Recolour + theme retained; knockout now also flips `--ddl-accent: currentColor` for stroke marks. `nx build landing` green; renders verified via screenshot. Open: pick the P foot; refine letterform terminals + true single-stroke joins + draw the “Tran” half; then lock glyph → Phase 2 (skill + assets).
- 2026-06-07 — **Phase 1 round 2.** Author feedback: cut directions 01 (period), 02 (semicolon), 03 (caret), 07 (fused glyph — "reads as a cross with a handle"). Expand the two survivors — **06 grid-module** + **08 signature** — into variants. `/ddl/identity` rebuilt as two families: A · grid-module (A1 diagonal cut, A2 stem+bowl, **A3 d↔p rotation ★**, A4 notched square) and B · signature (B1 monoline ligature, **B2 ruled stroke ★** — bridges both families, B3 variable-weight filled, B4 underline flourish). Each variant shows compact + 16px + 1-colour gates; each family ends with a wordmark/rule-reveal lockup. Cross-breed flagged (B2 ruled stroke + A3 rotation). `nx build landing` green. Next: pick variant(s) → lock.
- 2026-06-07 — **Phase 1 built.** `/ddl/identity` route + `ddl-identity` component (TS/HTML/SCSS) added under `apps/landing/src/app/pages/ddl/`, linked from the DDL index nav (compositions group). All 9 directions rendered as hand-authored SVG in three forms (full · compact/favicon · wordmark) + both rubric gates (16px + 1-colour knockout via `[data-accent]`→currentColor). Live recolour via `--ddl-accent` (5 presets + custom picker) proves theme-map config; caret (03) blinks and signature (08) draws on load, both reduce-motion-guarded. `nx build landing` green. Letterforms exploratory (text placeholders) — custom glyph deferred to Phase 2. Next: review → score against rubric → **lock one direction**.
- 2026-06-07 — Epic created. Phase 0 spec drafted. Locked: destination (full program), sequence (DDL→lock→skill→expand), anchors (dot↔nặng + engineer primitives; avoid orbit), `tdp` canonical / `Phuong Tran` fallback, custom letterform, SVG master, theme-map config depth, portable-skill home, v1 output scope (SVG+favicon/OG/email-sig/loading+Lottie), tooling stack (sharp/resvg/Satori/Playwright/Lottie; Remotion deferred), selection rubric (2 gates + 5 axes, 3+7 heaviest). Awaiting approval to start Phase 1.
