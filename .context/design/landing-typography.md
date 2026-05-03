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

All sizes are 4-grid aligned. Line-heights are also multiples of 4.

### Display — Newsreader

| Token                  | Size  | Line-height | Use                                |
| ---------------------- | ----- | ----------- | ---------------------------------- |
| `--landing-display-xl` | 56 px | 64 px       | Hero h1 (desktop)                  |
| `--landing-display-lg` | 48 px | 56 px       | Page h1 / section opener           |
| `--landing-display-md` | 40 px | 48 px       | Sub-hero, quote display            |
| `--landing-display-sm` | 32 px | 40 px       | Section h2 in editorial flow       |

### Body — Inter

| Token              | Size  | Line-height | Use                                       |
| ------------------ | ----- | ----------- | ----------------------------------------- |
| `--landing-body-lg`| 17 px | 28 px       | Reading column body, lead paragraphs      |
| `--landing-body-md`| 15 px | 24 px       | Default UI text, card body                |
| `--landing-body-sm`| 13 px | 20 px       | Small labels, caption-adjacent body       |

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
