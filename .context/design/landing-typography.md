# Landing Typography System

> The three-typeface system used across the landing surface, with rules for when each one shows up.
> Token source: `libs/landing/shared/ui/src/tokens/typography.scss`.
> For colour and spacing tokens, see `foundations.md`.

## The three typefaces

| Family            | Token                       | Role                | Mood                           |
| ----------------- | --------------------------- | ------------------- | ------------------------------ |
| **Newsreader**    | `--landing-font-display`    | Display / editorial | Warm serif. "This is content." |
| **Inter**         | `--landing-font-body`       | Body / UI           | Quiet sans. "This is reading." |
| **JetBrains Mono**| `--landing-font-mono`       | Meta / code         | Technical. "This is data."     |

Three voices, three jobs. A single surface should never use all three for the same thing — every text node has an obvious owner.

## Two bases (the governing rule)

The whole landing surface is anchored by **two configurable bases**. Everything else is a deviation that must justify itself against them.

### Base family — `Y` (dominant voice)

- **Current `Y` = Inter** (`--landing-font-body`). Reconfigurable: changing the base family is a single-token change that the rest of the system follows.
- **`Y` must be dominant.** Any landing view should read as "a `Y` page" at a glance. The other families exist **only to decorate or for special purposes** — Newsreader for the rare editorial/display beat, Mono for labels/data. If a view reads as a Newsreader page or a Mono page, the balance is wrong.

### Base size — `X` (major-content size)

- **Current `X` = `--landing-body-md`, fluid 14 px (mobile) → 16 px (wide)**, reconfigurable. **All major content sits at `X`** unless it is a deliberate display/label step. `X` is responsive: 16 px reads too large on phones, so it scales down to 14 px while the rest of the body scale cascades with it.
- **`X` is a perceived size, not a nominal px.** This is the key rule:

  > **Optical parity across families.** Different families render at different x-heights, so the *same px is not the same perceived size* — e.g. Newsreader at 17 px looks visibly **smaller** than Inter at 17 px. Whenever a secondary family is meant to read at the same size as `Y`, it must be **optically corrected** (its px nudged up/down) so that to the naked eye it matches `X`. A family swap re-tunes this correction; it is a property of the *pairing*, not a fixed number.

**Why:** without this, mixing families at "the same" token size produces a page that looks like a grab-bag of mismatched sizes (the exact complaint that motivated this rule). Anchoring to one perceived `X` + one dominant `Y` keeps the surface calm even with three typefaces.

> **Note on font support:** the current `Y`/display families (Inter, Newsreader) do **not** fully cover Vietnamese — a replacement is expected. Because `X`/`Y` are configurable and optical parity is defined by the *pairing*, swapping fonts is a re-tune, not a rewrite.

## When to use each

### Newsreader (display, serif)

Used at the **moments that matter**: page-defining titles, hero copy, pull-quotes, and the rare editorial flourish. Newsreader is italic-capable and pairs well with restrained UI; using it too often dilutes its weight.

**Use for:**
- Page titles (hero h1, project detail h1).
- Section intros that read like editorial leads.
- `landing-pull-quote` body — italic by default.
- The single hero phrase a section is built around.

**Don't use for:**
- Buttons, form labels, navigation, body paragraphs.
- Anything mono-spaced or technical (chips, eyebrows, code).
- Repetitive elements (cards in a grid, list items).

### Inter (body, sans)

The workhorse. Anything that needs to be **read calmly at length** is Inter. UI chrome (buttons, links, inputs) is also Inter — the system "speaks" in Inter and only switches to the other voices when the content demands it.

**Use for:**
- Body paragraphs, descriptions, lead-ins.
- Buttons, navigation, links, form inputs.
- Card titles + descriptions.
- Default for anything not explicitly mono or display.

**Don't use for:**
- Page titles where a single warm beat is wanted (use Newsreader).
- Tags, captions, eyebrows, or anything labeling something else (use Mono).

### JetBrains Mono (meta, mono caps)

The **labelling voice**. Mono is for things that point at content rather than being content: tag chips, caption prefixes, eyebrow labels above a heading, status indicators, code, and anything technical. Almost always rendered uppercase with `letter-spacing: 0.06em` (`--landing-tracking-mono`).

**Use for:**
- `landing-eyebrow` (section labels).
- `landing-chip` (tech tags, categories).
- `landing-status-dot` label.
- `landing-figure` caption (e.g. `FIG. 03 · …`).
- Inline code, file paths, command snippets.
- Date stamps, version numbers, IDs.

**Don't use for:**
- Anything readers must scan as a sentence — mono caps slows reading on purpose.
- Long captions (one short clause is fine; keep paragraphs in Inter).

## The scale

**Display + the whole body scale are fluid** — they `clamp()` between a mobile end (375 px viewport) and a wide end (1440 px), so type shrinks on phones instead of eating the screen. Only mono stays stepped. The base `X` (`body-md`) runs **14 px on mobile → 16 px on wide** (16 px read too large on phones); the body siblings cascade by the same ~0.875 ratio so the hierarchy holds at every width. All clamp endpoints are 4-grid aligned (18 px used sparingly). **Line-heights for fluid sizes are unitless ratios** (a fixed-px line-height would over-space a shrunken size); mono keeps px line-heights.

### Display — Newsreader (fluid: mobile → wide)

| Token                  | Mobile → Wide | Line-height (unitless) | Use                            |
| ---------------------- | ------------- | ---------------------- | ------------------------------ |
| `--landing-display-xl` | 36 → 56 px    | 1.143                  | Hero h1 (desktop)              |
| `--landing-display-lg` | 32 → 48 px    | 1.167                  | Page h1 / section opener       |
| `--landing-display-md` | 28 → 40 px    | 1.2                    | Sub-hero, quote display        |
| `--landing-display-sm` | 24 → 32 px    | 1.25                   | Section h2 in editorial flow   |

> The home **hero title/role use a bespoke larger scale** (Inter, not the display tokens) tuned per BP in `home-hero.component.scss` — an intentional exception, the one "loudest" moment on the site.

### Body — Inter

| Token              | Mobile → Wide (fluid) | Line-height (unitless) | Use                                       |
| ------------------ | --------------------- | ---------------------- | ----------------------------------------- |
| `--landing-body-xl`| 16 → 20 px            | 1.4                    | Lead-in / h4-level, bridges into display  |
| `--landing-body-lg`| 15 → 17 px            | 1.6                    | Reading column body, lead paragraphs      |
| `--landing-body-md`| 14 → 16 px (**base `X`**) | 1.5                | Default UI text, card body                |
| `--landing-body-sm`| 12 → 13 px            | 1.5                    | Small labels, caption-adjacent body       |

### Mono — JetBrains Mono

| Token              | Size  | Line-height | Use                                   |
| ------------------ | ----- | ----------- | ------------------------------------- |
| `--landing-mono-md`| 12 px | 16 px       | Eyebrow, chip md, figure caption      |
| `--landing-mono-sm`| 11 px | 16 px       | Chip sm, dense meta strips            |

### Tracking

| Token                       | Value    | Use                                   |
| --------------------------- | -------- | ------------------------------------- |
| `--landing-tracking-tight`  | -0.02em  | Display sizes (Newsreader)            |
| `--landing-tracking-normal` | 0        | Body                                  |
| `--landing-tracking-wide`   | 0.04em   | Sparing display variants              |
| `--landing-tracking-mono`   | 0.06em   | All mono caps usage                   |

## Pairing rules

1. **One display moment per view.** A page gets one Newsreader headline. Sub-headings drop to Inter unless they're inside an editorial reading column.
2. **Eyebrow above display.** Mono caps eyebrow + Newsreader headline is the canonical pattern (hero, section openers, project detail header).
3. **Chips never under headings of the same type.** A chip cluster (mono caps) belongs in card meta or under a project title — not directly under another mono label.
4. **Pull-quote interrupts body.** When using `landing-pull-quote` inside reading copy, leave 24px padding above/below; the indigo border carries the "this is a moment" cue.
5. **Captions are always mono.** Any text labeling a media element (image, code block, diagram) is Mono caps — not Inter italic, not Newsreader.

## Quick decision table

| Question                                                | Use            |
| ------------------------------------------------------- | -------------- |
| Is this a page-defining headline or hero phrase?        | **Newsreader** |
| Is this a paragraph the reader is meant to read fully?  | **Inter**      |
| Is this a button, input, link, or card title?           | **Inter**      |
| Is this labeling, tagging, or pointing at something?    | **Mono**       |
| Is this a short ALL-CAPS metadata string?               | **Mono**       |
| Is this code or a file path?                            | **Mono**       |
| Is this a quote inside reading copy?                    | **Newsreader** italic (use `landing-pull-quote`) |
