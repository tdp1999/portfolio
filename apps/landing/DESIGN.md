---
name: Portfolio Landing
description: A technical-drawing world in ink and indigo, where the apparatus of the drafting sheet is the decoration.
colors:
  ink-0: "#0a0d12"
  ink-1: "#11151c"
  ink-2: "#1a2030"
  text-300: "#e2e8f0"
  text-400: "#cbd5e1"
  text-500: "#a3b0c4"
  text-600: "#96a1b4"
  text-700: "#475569"
  accent: "#857ee2"
  accent-hover: "#8a83e3"
  accent-active: "#5b53c2"
  accent-strong: "#6e66d9"
  border: "#232a3a"
  border-strong: "#2f3854"
  error: "#f87171"
typography:
  display:
    fontFamily: "Newsreader, ui-serif, Georgia, serif"
    fontSize: "clamp(36px, calc(28.9577px + 1.8779vw), 56px)"
    fontWeight: 600
    lineHeight: 1.143
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Newsreader, ui-serif, Georgia, serif"
    fontSize: "clamp(32px, calc(26.3662px + 1.5023vw), 48px)"
    fontWeight: 600
    lineHeight: 1.167
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Newsreader, ui-serif, Georgia, serif"
    fontSize: "clamp(24px, calc(21.1831px + 0.7512vw), 32px)"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(14px, calc(13.2958px + 0.1878vw), 16px)"
    fontWeight: 400
    lineHeight: 1.75
    letterSpacing: "0"
  label:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, monospace"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "16px"
    letterSpacing: "0.06em"
rounded:
  none: "0"
  xs: "2px"
  sm: "4px"
  md: "6px"
  lg: "16px"
  pill: "999px"
spacing:
  hair: "4px"
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  card: "28px"
  xl: "32px"
  gutter-wide: "48px"
  section-sm: "64px"
  section-md: "96px"
  section-lg: "128px"
components:
  button-solid:
    backgroundColor: "{colors.accent-strong}"
    textColor: "#ffffff"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "40px"
  button-solid-hover:
    backgroundColor: "{colors.accent-hover}"
    textColor: "#ffffff"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text-300}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "40px"
  button-ghost-hover:
    textColor: "{colors.accent-hover}"
  chip-default:
    backgroundColor: "transparent"
    textColor: "{colors.text-500}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "4px 8px"
  chip-default-hover:
    backgroundColor: "{colors.ink-2}"
    textColor: "{colors.text-300}"
  chip-strong:
    backgroundColor: "{colors.ink-2}"
    textColor: "{colors.text-300}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "4px 8px"
  input:
    backgroundColor: "{colors.ink-1}"
    textColor: "{colors.text-300}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
    height: "44px"
  input-focus:
    backgroundColor: "{colors.ink-1}"
    textColor: "{colors.text-300}"
  card:
    backgroundColor: "{colors.ink-2}"
    textColor: "{colors.text-300}"
    rounded: "{rounded.lg}"
    padding: "28px"
  eyebrow:
    backgroundColor: "transparent"
    textColor: "{colors.text-500}"
    typography: "{typography.label}"
    padding: "0"
---

# Design System: Portfolio Landing

## Overview

**Creative North Star: "The Drafting Table"**

This is a technical drawing sheet that someone made beautiful. The page is the paper: a cool blue-black field with the faint apparatus of engineering drawing printed into it. Perspective grid floors, concentric contour rings, diagonal pencil hatching, a radar crosshair, a dot matrix. None of it is content, all of it is context, and it sits underneath everything at low opacity like a drafting sheet showing through. On top of that surface, information is laid out the way a good technical document lays it out: hairline rules instead of boxes, numbered figures with mono captions, uppercase mono labels pointing at things, and a single indigo mark used the way a pencil marks a sheet.

The mood is **calm, restrained, and unhurried**. Sections are separated by large empty bands rather than by containers. Motion is capped at 250ms. There is one accent color and it appears rarely. Nothing on the page is competing for attention, because the system assumes the reader arrived on purpose and will stay if left alone. The precision is real but it is never announced: the 4px grid, the fluid type scale, and the tokenized everything are load-bearing craft that the visitor should feel as calm rather than notice as engineering.

Three typefaces carry three separate jobs and never trade places. Newsreader is the warm serif reserved for the moments that matter. Inter is the dominant voice and does all the reading and all the interface. JetBrains Mono, almost always uppercase, is the labelling voice for anything that points at content rather than being content.

This world is defined against four things it refuses to be: the **terminal-hacker developer portfolio** (neon green on black, scanlines, monospace everything), the **gradient-mesh SaaS startup** (purple-to-pink hero washes, floating blobs, marketing-deck energy), the **corporate agency template** (stock hero photography, centered everything, safe blue), and the **maximalist brutalist portfolio** (clashing type, aggressive scroll effects). It also explicitly refuses the current wave of **AI-generated portfolio sameness**, **big scrolly pages**, and **effect-intense homepages**. Scroll position is not a narrative device here.

**Key Characteristics:**

- Technical-drawing backgrounds as the signature decoration, never as content.
- Hairline 1px borders in place of boxes, shadows, and containers.
- One indigo accent, used rarely, against a cool blue-black ink scale.
- Three typefaces with three non-overlapping jobs; Inter dominant.
- Fluid type that shrinks on phones instead of eating the viewport.
- Depth by tonal layering, never by drop shadow.
- Motion restrained to 150 to 250ms, always reduce-motion aware.

## Colors

A cool, technical, blue-shifted neutral field with exactly one chromatic voice. The greys are not neutral greys; every one of them is pulled toward blue, so the palette reads as ink rather than as charcoal.

The frontmatter carries the **dark theme**, which is the default and the theme the system was designed in. The light theme is a full re-mapping of the same token names, given in the theme table below.

### Primary

- **Drafting Indigo** (`accent`): the only chromatic color in the system. Links, icons, focus rings, the active navigation underline, the pull-quote rule, and the accent stripe on a lifted section rule. It is deliberately lifted from the brand indigo so it clears AA on the elevated ink surface.
- **Drafting Indigo Solid** (`accent-strong`): reserved for the one case where indigo becomes a fill instead of a mark, behind white button labels.
- **Drafting Indigo Pressed** (`accent-active`): the pressed state, deeper and more saturated.

### Neutral

- **Ink Black** (`ink-0`): the page itself. The drafting sheet.
- **Ink Surface** (`ink-1`): the first tonal step up. Figure frames, input wells, the surface a lifted section sits on.
- **Ink Elevated** (`ink-2`): the second tonal step. Cards, chip backplates, hover fills.
- **Bright Slate** (`text-300`): primary reading text and headings.
- **Slate** (`text-400`): secondary text.
- **Muted Slate** (`text-500`): the labelling tier. Eyebrows, chips, captions, cite lines.
- **Dim Slate** (`text-600`): the quietest text tier that is still text. Placeholders, separators, dense meta.
- **Graphite** (`text-700`): decorative dimming only. SVG fills, inactive markers.
- **Hairline** (`border`): the default 1px rule. This token does more structural work than any other in the system.
- **Hairline Strong** (`border-strong`): the hover and emphasis rule.

### Theme mapping

| Token | Dark (default) | Light |
|---|---|---|
| `ink-0` | `#0a0d12` | `#ffffff` |
| `ink-1` | `#11151c` | `#f7f8fa` |
| `ink-2` | `#1a2030` | `#eef0f4` |
| `text-300` | `#e2e8f0` | `#0f172a` |
| `text-400` | `#cbd5e1` | `#1e293b` |
| `text-500` | `#a3b0c4` | `#475569` |
| `text-600` | `#96a1b4` | `#646e82` |
| `text-700` | `#475569` | `#94a3b8` |
| `accent` | `#857ee2` | `#5b53c2` |
| `accent-hover` | `#8a83e3` | `#4c45a8` |
| `accent-active` | `#5b53c2` | `#6e66d9` |
| `accent-strong` | `#6e66d9` | `#5b53c2` |
| `border` | `#232a3a` | `#e2e8f0` |
| `border-strong` | `#2f3854` | `#cbd5e1` |

Header translucency is theme-bound: `rgb(10 13 18 / 0.72)` dark, `rgb(255 255 255 / 0.72)` light.

### Named Rules

**The One Mark Rule.** Indigo is the only chromatic color the system owns. It appears as a mark, not as a field: a 1px underline, a 2px quote rule, an icon, a focus ring, one button. If more than a small fraction of a viewport is indigo, the page is wrong. There is no secondary or tertiary accent, and inventing one breaks the world.

**The Blue-Black Rule.** Every neutral is blue-shifted. Never introduce a warm grey, a true `#000`, or a true `#fff` as a surface. The field is ink, and ink has a hue.

**The Graphite Floor Rule.** `text-700` is not a text color. It exists for decorative dimming only (SVG fills, inactive markers). Body copy stops at `text-600`, and every tier from `text-600` up is contrast-checked in both themes.

## Typography

**Display Font:** Newsreader (with `ui-serif, Georgia, serif`)
**Body Font:** Inter (with `ui-sans-serif, system-ui, sans-serif`)
**Label/Mono Font:** JetBrains Mono (with `ui-monospace, SFMono-Regular, monospace`)

**Character:** A warm literary serif used sparingly against a quiet, near-invisible sans, with a technical mono doing all the labelling. Three voices, three jobs, no overlap. The serif supplies the only warmth in an otherwise cool system, which is why it has to stay rare to keep working.

### Hierarchy

- **Display** (Newsreader, 600, `clamp` 36px to 56px, lh 1.143, tracking -0.02em): the hero headline. One per site view.
- **Headline** (Newsreader, 600, `clamp` 32px to 48px, lh 1.167): page `h1` and section openers. This is what a bare `<h1>` renders as.
- **Title** (Newsreader, 500 to 600, `clamp` 24px to 40px, lh 1.2 to 1.25): sub-hero and section `h2`.
- **Body** (Inter, 400, `clamp` 14px to 16px, lh 1.75): the base size. All major content sits here. The loose 1.75 leading is deliberate reading rhythm.
- **Reading body** (Inter, 400, `clamp` 15px to 17px, lh 1.6): long-form reading columns and lead paragraphs.
- **Lead** (Inter, 400, `clamp` 16px to 20px, lh 1.4): intros and `h4`-level bridges into display.
- **Label** (JetBrains Mono, 12px / 11px, lh 16px, tracking 0.06em, uppercase): eyebrows, chips, figure captions, cite lines, status labels, dates, version strings.

**The one documented exception:** the home hero title and role run on a bespoke larger scale in Inter (96px title, 64px role at desktop, stepped down per breakpoint in `home.hero.scss`), deliberately outside the display tokens. It is the single loudest moment on the site and it is meant to sit above the ceiling. Treat any *other* type above the 56px display clamp as drift, not as precedent.

### Named Rules

**The Two Bases Rule.** The whole surface is anchored by one dominant family (currently Inter) and one *perceived* base size (currently `body-md`, fluid 14px to 16px). Any view should read as an Inter page at a glance. Both are single-token swaps by design.

**The Optical Parity Rule.** The base size is a perceived size, not a nominal pixel value. Families render at different x-heights, so Newsreader at 17px looks visibly smaller than Inter at 17px. When a secondary family is meant to read at the base size, nudge its pixel value until it *looks* like the base. A font swap re-tunes this correction; it is a property of the pairing, not a constant.

**The One Display Moment Rule.** A page gets one Newsreader headline. Sub-headings drop to Inter unless they are inside an editorial reading column. Using the serif repeatedly, especially in a grid of cards, dissolves the only warmth the system has.

**The Inflected Heading motif (sanctioned exception to the rule above).** One authored device may repeat: a section heading set in Inter with its final word in Newsreader italic accent, as in "Passion *projects*.", "The *toolkit*.", "Let's *talk*." The sans states the subject and the serif inflects it, which is the same two-voice move the hero makes with the name and the role. This is identity, not drift, and it is the one repeated serif appearance the system allows. Everything else holds: the serif never carries a whole heading outside the hero, and it never appears inside a repeating component such as a card grid or a list.

**The Pointing Voice Rule.** If text labels, tags, dates, or points at other content rather than being content, it is mono uppercase at 0.06em tracking. If a reader must scan it as a sentence, it is never mono; mono caps slows reading on purpose.

**The Shrink-Not-Overflow Rule.** Display and the entire body scale are fluid, clamped between a 375px and a 1440px viewport. Line heights for fluid sizes are unitless ratios, never fixed pixels, because a fixed line height over-spaces a shrunken heading. Only mono stays stepped.

## Layout

**Breakpoints are device-bound, four of them, and the names are part of the system:** `mobile` (base, no media query), `tablet` (48rem / 768px), `laptop` (64rem / 1024px), `wide` (90rem / 1440px). Generic `sm`/`md`/`lg`/`xl` names are banned in new work. Layout is mobile-first, and JavaScript-driven layout swaps read a breakpoint observer rather than duplicating the thresholds.

**Containers** are centered with three widths: content (`max-width: 72rem`), wide (`80rem`) for grids, and full (unconstrained, no padding). Horizontal gutters step 24px on mobile, 32px at tablet, 48px at laptop.

**Section rhythm is the primary structural device.** Sections carry 64px bottom padding on mobile, 96px vertical at tablet, and 96px top with 128px bottom at laptop and up. That empty band, not a border or a card, is what separates one idea from the next. Headings carry 96px of scroll margin so fragment navigation clears the sticky header.

**All fixed pixel values are multiples of 4.** The exceptions are deliberate and documented at the point of use: chip padding runs 2/6/14px for tight mono-caps density, and the chip icon is 14px with a 6px gap to balance optical weight against uppercase mono.

### Named Rules

**The Empty Band Rule.** Separation comes from vertical space first, a hairline second, and a surface change third. A container is the last resort, not the first.

**The Device Names Rule.** Never write a raw media query, a raw `100vh`, or a raw `prefers-*` query. Use the four device-bound mixins and the viewport-height token. The names carry the intent; the numbers do not.

## Elevation & Depth

**This system is flat by default and gets its depth from tonal ink layering plus hairline borders, not from shadows.** There is no ambient shadow vocabulary, no resting elevation, and no shadow scale. A card is distinguished from the page by being one step up the ink ladder and by having a 1px border, which is the entire mechanism.

Glass is the one exception, and it is a **capability upgrade, not a style**. Cards use a flat near-opaque fill on mobile and tablet, and only at laptop and above do they switch to a translucent fill with `backdrop-filter: blur(24px) saturate(120%)`. The reason is performance, not taste: a backdrop filter re-samples and re-blurs the decorative background behind every card on every scroll frame, which is the dominant cause of scroll jank on phone GPUs, made worse by high-DPR and 120Hz panels. The header keeps a lighter `blur(12px)` at all sizes over a 72% translucent fill.

### Shadow Vocabulary

There is exactly one shadow in the system, and it is a hover response, not a resting state:

- **Tilt glow** (`box-shadow: 0 0 0 1px color-mix(in srgb, var(--landing-accent) 30%, transparent), 0 12px 40px color-mix(in srgb, var(--landing-accent) 22%, transparent)`): the hover state of an interactive tilt card. It is built from the accent rather than from black, so it adapts across themes instead of crushing light surfaces.

### Named Rules

**The Flat-At-Rest Rule.** Surfaces are flat when nothing is happening. Depth appears only as a response to state. Never add a resting drop shadow to give something presence; move it up the ink ladder instead.

**The Glass-Is-Earned Rule.** A backdrop filter is a laptop-and-up enhancement gated behind a breakpoint, never a base style. If a component needs glass on a phone, it needs a different design.

**The Accent Shadow Rule.** When a shadow is unavoidable, build it from the accent with `color-mix`, not from black. Black shadows are invisible on ink and overpowering on light.

## Shapes

The form language is **hairline rectangles with small, restrained radii**. Nothing in the system is a pill except a clear-field button, and nothing is fully square except the things that should read as printed plates.

- **Figure frames: 0 radius.** Images sit in a sharp 1px hairline frame on the `ink-1` surface. Square corners are what make them read as plates on a drafting sheet rather than as UI cards.
- **Chips: 4px.** Just enough to soften a mono-caps rectangle without making it a tag bubble.
- **Buttons and inputs: 6px.** The interface radius.
- **Cards: 16px.** The only genuinely rounded surface in the system, which is what marks it as a container rather than a mark.
- **Round: 999px.** Reserved for the input clear button and status dots.

Borders are the dominant structural device: `1px solid` at the hairline token nearly everywhere, `2px` only for the pull-quote rule and the lifted section rule. Rules are horizontal 1px hairlines, full width or flexed to fill the space beside a label.

### Named Rules

**The Hairline-Not-Box Rule.** Reach for a 1px rule before reaching for a bordered container. The system separates with lines and space; boxes are for things that are genuinely objects.

**The Square Plate Rule.** Images and figures never get a radius. If an image looks like a card, the frame is wrong.

## Components

### Buttons

- **Shape:** gently softened rectangle (6px radius), inline-flex with an 8px gap, 1px transparent border so variants can borrow the same box.
- **Sizes:** small (4px by 12px padding, 32px min-height, small body type) and medium (8px by 16px, 40px min-height, base body type). There is no large.
- **Solid:** the only place indigo becomes a fill. Solid accent background with white label. Hover brightens toward the hover accent with a `brightness(1.1)` filter; active drops to the pressed accent and clears the filter.
- **Ghost:** transparent with a hairline border and primary text. Hover strengthens the border and turns the label indigo. This is the default for anything that is not the single primary action.
- **Link:** no border, no background, no horizontal padding, no min-height. An inline text action that happens to be a button.
- **Focus:** a 2px accent outline at 2px offset. Same treatment on every interactive element in the system.
- **Signature behavior:** the **lift-off arrow**. A button with a directional arrow renders two stacked copies. On hover the lead arrow shoots 6px in its direction and scales slightly on a springy `cubic-bezier(0.34, 1.3, 0.64, 1)` over 280ms, while a ghost copy fades in behind it at 45% opacity in indigo, leaving a vapor trail at the origin. Under reduced motion both the transform and the ghost are suppressed entirely.

### Chips

- **Style:** mono uppercase at 0.06em tracking, muted slate on transparent, inside a 1px hairline border at 4px radius. Cursor stays `default`: a chip is metadata, not a control, and it has no active or click state.
- **Sizes:** small (2px by 6px, 11px mono) and medium (4px by 8px, 12px mono), with a large step at 6px by 12px. The sub-4px padding is deliberate and must not be normalized to the grid.
- **Hover:** tonal fill to the elevated ink with text lifting to the bright tier.
- **Prominence ladder:** `default` is the bare hairline. `strong` adds a 60% elevated-ink backplate and a muted-slate border. `strongest` fills with elevated ink and takes a bright border. Hover on the loud tiers washes the fill toward indigo with `color-mix`. Prominence encodes tier, not state; for live/draft/archived status use the status dot instead.
- **Icon slot:** a 14px inline image with a 6px gap and a 2px radius backplate, keeping the source brand colors.

### Cards / Containers

- **Corner Style:** 16px, the most rounded thing in the system.
- **Background:** 90% elevated ink on mobile and tablet, switching to a 3% bright-slate tint with backdrop blur at laptop and up.
- **Border:** 1px at 8% bright slate, which reads as a hairline rather than an outline.
- **Shadow Strategy:** none at rest. See Elevation and Depth.
- **Internal Padding:** 28px, with a 12px gap between stacked children and a 300px minimum height so a row of cards aligns.
- **Tilt variant:** on hover, a 1200px-perspective rotate of 2 degrees on X and -2 on Y with a 2px lift, an indigo-mixed border, and the single accent glow shadow. The transform is dropped under reduced motion while the color response is kept.

### Inputs / Fields

- **Style:** a sunken well. 50% translucent `ink-1` background, 1px hairline border, 6px radius, 12px by 16px padding, 44px minimum height. Body type in Inter.
- **Focus:** the border turns accent and the background *deepens* to 70% rather than lighting up. No glow, no ring shift, no layout movement.
- **Error:** border switches to the error red, and stays red on focus.
- **Disabled:** 50% opacity with the background thinned to 30%.
- **Clear affordance:** a 24px round ghost button inset 8px from the right, appearing only on clearable fields, which reserve 40px of right padding so text never slides underneath.

### Navigation

- **Header:** a floating frosted pill on marketing routes, mirrored by a solid frosted bar where a document scrolls beneath it. 72% translucent theme-bound fill, `blur(12px)`, 1px hairline bottom border, and a 200ms ease-out fade on appearance.
- **Active state:** the label turns indigo and a 1px indigo underline is drawn 4px below it, edge to edge across the label. This is the canonical active marker.
- **Mobile:** a sheet of arrow rows. The active row is marked by indigo text plus an indigo arrow, and the underline is explicitly suppressed, because two markers for one state is one too many.
- **Brand:** a monogram mark rather than a wordmark, optically sized at 1.35em to match the surrounding type.

### Backgrounds (signature component)

The defining component of the system. A decorative layer that sits absolutely positioned behind a section at `z-index: -1`, pointer-events disabled, with six patterns:

- **Blueprint:** a perspective grid floor. A 56px grid rotated 68 degrees on X against a 1200px perspective, radially masked so it fades into the horizon, at 18% opacity.
- **Topo:** two offset repeating radial gradients forming concentric contour rings at 38px and 52px intervals, elliptically masked.
- **Hatch:** 135-degree diagonal pencil hatching on a 14px interval, masked to fade at the top and bottom edges.
- **Dots:** a dot matrix grid.
- **Crosshair:** a radar sweep and compass dial.
- **Aurora:** a blurred accent blob mesh, the only pattern that carries chroma.

All patterns use the same cool blue tint (`rgba(155, 195, 235, ...)`) at opacities between 0.16 and 0.22. A `bleedDown` mode opens the bottom clip 160px so a pattern runs past its section, while horizontal overflow stays clipped so blurred aurora blobs can never push the page wider than the viewport.

### Editorial marks (signature components)

- **Figure:** an image in a square 1px hairline frame on `ink-1`, with a 12px gap to a mono-caps caption. Inline figures drop the outer frame, move the border onto the image itself, and cap at both the image's real pixel size and 72vh so a tall portrait cannot force endless scrolling.
- **Pull-quote:** Newsreader italic at reading size behind a 2px indigo left rule with 24px of left padding, and a mono-caps cite line beneath. The indigo rule is the "this is a moment" cue.
- **Eyebrow:** mono caps in muted slate above a heading, optionally with a leading 40px hairline or a trailing hairline that flexes to fill the row. The canonical section opener is eyebrow plus serif headline.
- **Section rule:** a 1px hairline divider. Its `lift` variant becomes 2px with an indigo top stripe, and pulls the following sibling section up to the `ink-1` surface.

## Do's and Don'ts

### Do:

- **Do** separate with vertical space first (64 / 96 / 128px section rhythm), a 1px hairline second, and a surface change third.
- **Do** keep indigo as a mark: a 1px underline, a 2px rule, an icon, a focus ring, one solid button per view.
- **Do** give every text node exactly one typeface owner. Serif for the one display moment, Inter for everything read or operated, mono caps for anything that labels or points.
- **Do** use unitless line-height ratios for any fluid size, and keep clamp endpoints on the 4px grid.
- **Do** use the four device-bound breakpoint names (`mobile`, `tablet`, `laptop`, `wide`) and their mixins.
- **Do** build any unavoidable shadow from the accent with `color-mix`, so it survives both themes.
- **Do** pair a reduced-motion fallback with every transform, and keep transitions inside 150 to 250ms.
- **Do** frame images square. Zero radius, 1px hairline, `ink-1` behind.

### Don't:

- **Don't** introduce a second accent hue. There is no secondary or tertiary color in this system, and adding one destroys the One Mark Rule.
- **Don't** use a warm grey, a pure `#000`, or a pure `#fff` as a surface. Every neutral is blue-shifted ink.
- **Don't** use `text-700` for body copy. It is decorative dimming only.
- **Don't** add a resting drop shadow. Move the surface up the ink ladder instead.
- **Don't** apply `backdrop-filter` below the laptop breakpoint. It is the dominant cause of mobile scroll jank against these decorative backgrounds.
- **Don't** set a Newsreader headline in a repeating context such as a card grid or a list. One display moment per page.
- **Don't** set anything readers must scan as a sentence in mono caps.
- **Don't** write a raw `@media` query, a raw `100vh`, or a generic `sm`/`md`/`lg` breakpoint prefix.
- **Don't** normalize the chip's 2/6/14px spacing to the 4px grid. It is a deliberate optical correction for uppercase mono.
- **Don't** let scroll position become a narrative device. No scroll-driven storytelling, no pinned sections, no effect-heavy homepage.
