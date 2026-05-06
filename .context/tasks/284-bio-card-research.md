# Task 284 — Bio Card Grid · Research Scratch

> Temp notes while resolving content + visual direction for §3 Bio Card Grid.
> Delete after task 284 lands.

## Hard constraints

- Hero §2 already shows: STATUS, CORE_STACK, LOCATION (city). Do not repeat unless adding more specificity / value.
- Section §3 currently feels passive — needs widgets + decoration to earn its keep.
- Card B (philosophy) content LOCKED in E2 §6 → render only.
- Spec: 1px hairline · 4px radius · no shadow · `bg-landing-ink-1`. Legacy `landing-card` (shadow-md, rounded-xl) is **deprecated** — will override DDL preview, then remove from codebase.
- AC says 3 equal cards. Distribution can vary if section-level decision warrants.
- Dependencies: 274, 278, 279, 277 (Profile.timezone via API — actually `timezones: string[]`, take `[0]`).

## Picks so far

### A — Information types (PICKED)

| Code | Info | Notes |
|---|---|---|
| A9  | Timezone offset vs visitor | "GMT+7 · 6h ahead of you" — computed FE-side from visitor's `Intl.DateTimeFormat().resolvedOptions().timeZone` |
| A10 | Working-hours window | "09:00–18:00 ICT, weekdays" |
| A20 | Currently learning | 1 line, hand-curated copy |
| A21 | Currently reading | 1 line, hand-curated |
| A24 | Capacity hint | E2 dropped explicit hours; framing like "Open to talks anytime; engagements from June" |
| A25 | Preferred working mode | Remote-first / hybrid / onsite preference |
| A27 | Country + map dot | Vietnam SVG outline with marker on HCMC |
| A31 | Email + copy-to-clipboard | Clipboard API + "copied" feedback |
| A34 | CV PDF — **as link to asset**, not download | open in new tab → `landing-link` external `↗` |

### Implicit widget picks (also in A list)

| Code | Widget |
|---|---|
| W3  | Visitor↔you clock pair (split rectangle) |
| W7  | Vietnam outline + HCMC dot |
| W11 | Last-commit ticker — "Last commit · 3h ago · `<msg>`" |
| W19 | ASCII art name / title (terminal aesthetic) |
| W22 | Email + copy button |

## Decided

- One card will be **time/timezone-themed** (Card A candidate). Confirmed by author.

## Pending — to resolve (in order)

1. **C — Decoration / background**: pick section-level + card-level decoration. **In progress** — see prototypes below.
2. **B — Widget pass** (light): confirm widgets, decide "Now reading/learning" copy source, decide last-commit env fallback.
3. **D — Card prototype** (P1–P7): pick visual register for the card primitive that replaces `landing-card`.
4. **Card distribution**: assign info × widgets × decoration to 3 cards.
5. **Implementation plan**: components, signals, SSR strategy, DDL replacement, legacy card removal.

## Existing `landing-background` patterns (DDL)

| Pattern | Best for | Avoid for | Verdict for §3 |
|---|---|---|---|
| `blueprint` | Hero, case-study openers | Card grids (competes with borders) | ❌ already in hero §2 |
| `topo` | About, story, pull-quote | Dense data sections | ⚠️ fits Card B (philosophy) but Card A is data-dense |
| `hatch` | Colophon, /uses, footer band | Hero, card grids | ⚠️ "avoid card grids" in DDL notes |
| `dots` | Stats, timeline, skills matrix | Reading prose | ⚠️ inverse problem: Card B is prose |
| `crosshair` | Contact, CTA, 404 | Hero, long-form | ⚠️ fits Card C only |

→ No single existing pattern fits §3 cleanly. Need either: (a) new pattern variant, (b) section-level decoration without full bg pattern, (c) per-card pattern (different bg per card).

## C — Section/decoration prototypes — LIVE PREVIEW

> Live DDL gallery: **`/ddl/bio-card-grid`** — pick by clicking. **17 PROTO scenes**.
> Source: `apps/landing/src/app/pages/ddl/bio-card-grid/` (delete after task 284 lands).
> Patterns `asia-outline` and `graticule` are scoped here; promote to shared `landing-background` only if picked.

### PROTO catalog

| ID | Style | E4-C compliant? |
|---|---|---|
| P1–P10 | Hairline / mono / editorial / asymmetric / numbered / bracketed / vertical-tab / header-band / spine | ✅ |
| PF1 Spotlight Bento | Radial-glow cards, 20px radius, gradient hairline, asymmetric bento | ⚠ unlocked per ADR-017 |
| PF2 Aurora Mesh | Indigo blobs (palette-safe) + frosted glass (backdrop-blur) | ⚠ unlocked per ADR-017 |
| PF3 Editorial Magazine | No bento — 2-col asymmetric, large serif headline, mono dl rows | ✅ (still hairline) |
| PF4 Showcase Artifact | Card B embeds Document Engine UI mock (proof-of-work) | ✅ (real screenshot pattern) |
| PF5 Breaking Boundary | Large analog clock SVG floats across cards, breaking grid | ⚠ unlocked per ADR-017 |
| PF6 Brutalist Mono | 2px hard borders, no radius, all-mono, ASCII art name | ⚠ unlocked per ADR-017 |
| PF7 Dimensional Layers | Multi-layer drop-shadow + paper noise + hover perspective | ⚠ unlocked per ADR-017 |

**Decision**: ADR-017 unlocked E4-C constraint specifically for §3 Bio Card Grid. Palette discipline preserved (indigo + ink-0/1/2 only, no rainbow). Other landing sections still default to E4-C.

### Section-header treatments

- **C-H1** Plain — no header, cards stand alone
- **C-H2** Eyebrow rule + section mark `─── §3 / WHO ───`
- **C-H3** Editorial header — small heading "Who" / "About" + lede sentence above cards
- **C-H4** Margin notes — `[§3]` floats in left margin (desktop only)
- **C-H5** Marker tag — small mono `03 / OF 09` indicator referencing §3 of 9-section page

### Section-level background

- **C-B1** None (default `bg-landing-ink-0`)
- **C-B2** `landing-background[pattern=topo]` very faint (opacity ~0.4) — "about/depth" reading
- **C-B3** `landing-background[pattern=dots]` faint — "measurement paper" feel for data cards
- **C-B4** **NEW pattern: `graticule`** — sparse lat/long grid lines, geographic-coded. Add to `landing-background` enum.
- **C-B5** **NEW pattern: `asia-outline`** — faint SE-Asia coastline SVG with HCMC marker pulsing. Section-scoped.
- **C-B6** Per-card different bg (Card A=dots, Card B=topo, Card C=crosshair) — risky, busy
- **C-B7** Hairline rule above + below section only, no fill

### Card-grid layout

- **C-L1** 3 equal columns (AC default)
- **C-L2** Asymmetric `1fr 1.4fr 1fr` — Card B wider for read-zone
- **C-L3** Asymmetric `1.2fr 1fr 1fr` — Card A (identity) leads
- **C-L4** Vertical offset — Card B drops 16px (or rises) to break grid baseline
- **C-L5** Spine — hairline vertical between gaps connecting cards visually

### Card-level decoration

- **C-D1** Plain hairline only
- **C-D2** Numbered index `01 / 02 / 03` mono top-left, inside padding
- **C-D3** Section-mark `§3.1 / §3.2 / §3.3` mono eyebrow, inside padding
- **C-D4** Bracketed corners `┌ ┐ └ ┘` 8x8 ticks slightly outside border
- **C-D5** Vertical rotated label trục trái (8-10px column) — `IDENTITY` / `PHILOSOPHY` / `CONTACT`
- **C-D6** Internal hairline rules — divide card into rows (mini-table)
- **C-D7** Cut-corner chamfer 12-16px on one corner
- **C-D8** Header band — top 40px on `bg-landing-ink-0` with eyebrow, separated by hairline rule from body

## Open questions

- "Currently learning / reading" — hand-curated copy in code (per P6 no-CMS), or a small content module? **Default: code constant inside feature-home, swap when needed.**
- Last-commit ticker — source: build-time env var (`GIT_COMMIT`, `GIT_COMMIT_TS`, `GIT_COMMIT_MSG`), captured at deploy. SSR-safe. Fallback: hide widget if env missing.
- CV asset path — where does the PDF live? `/assets/cv/phuong-tran-cv.pdf` (en) + parking-lot for vn?
- Visitor↔you clock pair — visitor's tz from `Intl.DateTimeFormat().resolvedOptions().timeZone` (browser only) — needs SSR fallback ("local time" placeholder until hydration).

## Discarded / parking lot (from research dump)

- Now-playing / Wakatime / Spotify — maintenance commitment too high.
- Headshot / avatar — E0 §14 dropped.
- Weather widget — gimmicky, external dep.
- PGP fingerprint — overkill.
- Voice intro audio — out of scope.
- W18 Avatar circle — dropped per E0 §14.
- Lighthouse / coverage badges — overlap with /colophon page; defer.
