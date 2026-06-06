# Color Contrast — The Science (WCAG 2.x + APCA)

The complete model this skill validates against. Read this to understand *what the
numbers mean* before changing any token. Everything here is implemented exactly in
`scripts/contrast-audit.mjs`.

---

## 0. Two models, one decision

There are two contrast models in active use. They answer different questions and
**disagree, on purpose**, in dark mode and near the extremes.

| | **WCAG 2.x contrast ratio** | **APCA (APCA-W3)** |
|---|---|---|
| Output | Ratio `1:1 … 21:1` | `Lc` lightness contrast, `0 … ±106` |
| Basis | Luminance ratio (relative) | Perceptual, polarity-aware (spatial light) |
| Status | **W3C Recommendation** (legal baseline, ADA/EN 301 549 reference) | **WCAG 3 draft** — not yet normative |
| Dark mode | **Unreliable** — overstates contrast for dark colors | Designed for it (polarity-aware) |
| Thin/small text | Ignores weight & size for the ratio | Encodes size + weight in the threshold |

**Decision for this project (locked):** WCAG 2.x AA is the **gate** (the legal floor —
CI fails on it). APCA is the **quality bar** (a `WARN` — passes WCAG but reads weak,
especially in dark mode). The validator reports both for every pair; `status` is
`FAIL` if WCAG fails, else `WARN` if APCA fails, else `PASS`.

> Why both, concretely: in this repo's dark theme, `--landing-text-500 #94a3b8` on the
> page bg scores **WCAG 7.6:1** (looks excellent) but **APCA Lc 51** (fails the body
> target of 75). WCAG says "great," your eye says "muddy." APCA explains the gap.

---

## 1. WCAG 2.x contrast ratio

### 1.1 Formula

**Relative luminance** of an sRGB color. For each channel `C ∈ {R,G,B}` as `cs = C/255`:

```
c_lin = cs / 12.92                      if cs ≤ 0.04045
c_lin = ((cs + 0.055) / 1.055) ^ 2.4    otherwise
L = 0.2126·R_lin + 0.7152·G_lin + 0.0722·B_lin
```

> The normative WCAG 2.0/2.1 text uses the threshold `0.03928`; the corrected sRGB
> value is `0.04045`. The difference is ≈ 0.0001 in L and never flips a pass/fail.
> This skill uses `0.04045`.

**Contrast ratio** between two colors (order-independent):

```
ratio = (L_lighter + 0.05) / (L_darker + 0.05)      →  range 1:1 … 21:1
```

The `+0.05` models ambient flare. Pure black/white = `21:1`.

### 1.2 Thresholds

| Success Criterion | Level | Requirement |
|---|---|---|
| **1.4.3 Contrast (Minimum)** | AA | **4.5:1** normal text · **3:1** large text |
| **1.4.6 Contrast (Enhanced)** | AAA | **7:1** normal · **4.5:1** large |
| **1.4.11 Non-text Contrast** | AA | **3:1** for UI components & meaningful graphics vs adjacent colors |

**Large text** = ≥ **24px** (18pt) regular, **or** ≥ **18.66px** (14pt) **bold**. Below
that → normal-text rules (4.5:1).

### 1.3 Scope of 1.4.11 (the most misunderstood one)

3:1 is required only for:
- **UI component states/boundaries** that are *needed to identify* the control — e.g. an
  input's border when the border is the *only* thing marking the field, the checked
  state of a toggle, focus indicators.
- **Graphical objects** required to understand content — icons that carry meaning,
  chart segments, the meaningful parts of a pictogram.

It is **not** required for:
- Purely decorative borders/dividers, shadows, inactive (disabled) components, or any
  visual that conveys nothing on its own.

> Practical consequence for this repo: the validator flags *every* border at ~1.2–1.95:1,
> but most are decorative card/divider strokes (exempt). The ones that matter are
> **input/control outlines** where the border alone says "this is a field." Triage
> borders by asking "is this the only boundary of an operable control?"

### 1.4 Exemptions (1.4.3 / 1.4.6)

- **Disabled / inactive** components: no contrast requirement. (Still keep ≥ APCA Lc 30
  for usability — a control nobody can read is a support ticket.)
- **Logotypes**, and incidental text (decorative, not visible, part of a picture).
- **Placeholder text is NOT exempt.** It is real text → must meet 4.5:1. A common myth
  is that placeholders are "hint text" and exempt; they are not. (This is why this
  repo's `--color-placeholder` is judged at the body floor.)

### 1.5 Focus indicators

- **1.4.11** covers the focus ring's contrast against the *adjacent* background (≥3:1).
- **2.4.11 Focus Not Obscured (AA, 2.2)** — the focused element must not be fully hidden
  (e.g. under a sticky header).
- **2.4.13 Focus Appearance (AAA, 2.2)** — minimum *area* (≥ the perimeter of a 2px-thick
  outline) **and** ≥3:1 contrast between focused and unfocused states.

### 1.6 The known flaw

WCAG 2's ratio is a pure luminance ratio with no model of human lightness perception,
spatial frequency (stroke width), or polarity. Consequences:
- It **overstates** contrast for dark colors (the `+0.05` dominates near black) → dark
  mode passes that look weak.
- It **understates** some light-on-light / mid-tone pairs.
- A given ratio is **not** perceptually uniform: 4.5:1 at one end of the scale ≠ 4.5:1 at
  the other. Estimates put a large fraction of "WCAG failures" down to the math, not
  real unreadability — and vice-versa.

---

## 2. APCA-W3 (Accessible Perceptual Contrast Algorithm)

Constants below are the frozen W3 set (`apca-w3`, unchanged since **2021-02-15**),
verified against Myndex's reference. The skill's implementation matches exactly.

### 2.1 Formula

**Screen luminance Y** (note: a *simple* 2.4 power curve, no piecewise split, and
higher-precision coefficients than WCAG):

```
Y = 0.2126729·(R/255)^2.4 + 0.7151522·(G/255)^2.4 + 0.0721750·(B/255)^2.4
```

**Soft-clamp black levels** (each of text & bg):

```
if Y ≤ 0.022:  Y = Y + (0.022 − Y) ^ 1.414
```

**Contrast**, polarity-aware. Let `Ytxt`, `Ybg` be the clamped luminances.
If `|Ybg − Ytxt| < 0.0005` → `Lc = 0`.

```
Normal polarity (dark text on LIGHT bg, Ybg > Ytxt):
  S = (Ybg^0.56 − Ytxt^0.57) · 1.14
  out = 0            if S < 0.10
        S − 0.027    otherwise

Reverse polarity (light text on DARK bg, Ybg < Ytxt):
  S = (Ybg^0.65 − Ytxt^0.62) · 1.14
  out = 0            if S > −0.10
        S + 0.027    otherwise

Lc = out · 100
```

- Exponents: `normBG 0.56`, `normTXT 0.57`, `revTXT 0.62`, `revBG 0.65`.
- Clamps: `blkThrs 0.022`, `blkClmp 1.414`. Scale `1.14`. Offset `0.027`. Lo-clip `0.10`.
- **Sign = polarity**: `+Lc` = dark text on light bg; `−Lc` = light text on dark bg.
  Magnitude is what you compare to thresholds. (The validator stores the signed value
  so polarity is visible, and tests `abs(Lc)`.)

### 2.2 Lc thresholds (the lookup, condensed)

APCA ties the *minimum Lc* to font **size + weight** — thinner/smaller needs more Lc.

| Min Lc | Use case |
|---|---|
| **Lc 90** | Preferred for body text (≥14px/400 or 18px/300). The target for reading copy. |
| **Lc 75** | **Minimum** for body/column text (≥18px/400, 16px/500, 14px/700, 24px/300). |
| **Lc 60** | Min for non-body content text (≥24px/400 or ≥16px/700); large fluent text. |
| **Lc 45** | Min for large/heavy headlines (≥36px/400 or 24px/700) and fine-detail icons. |
| **Lc 30** | Absolute min for any other text incl. **placeholder & disabled**; large/solid non-text. |
| **Lc 15** | Absolute min for non-text that must be discernible (≥5px feature). Invisibility floor. |

"Enhanced" = add **Lc +15** over the minimum. Bronze (WCAG-3 simple) conformance uses
these levels directly; Silver uses the full size/weight lookup table.

> WCAG↔APCA rough equivalence used by this skill's roles: body `4.5 ↔ Lc 75`,
> large/secondary `3.0 ↔ Lc 60`, icon/non-text `3.0 ↔ Lc 45`, placeholder/border floor
> `↔ Lc 30`. These are *role targets*, not a conversion — the two models genuinely
> diverge, which is the point.

---

## 3. Role → threshold map

The validator assigns each token pair a **role** = its design intent, then judges it.
This is honest: a static token doesn't know its render size, so we encode intent.

| Role | Element | WCAG min | APCA min | Notes |
|---|---|---|---|---|
| `body` | Reading copy, labels, secondary text | 4.5 | 75 | The default for any real text |
| `large` | ≥24px / ≥18.66px-bold headings | 3.0 | 60 | Only if the token is *only* used large |
| `caption` | Small meta/captions | 4.5 | 60 | Small → held to the body ratio floor |
| `placeholder` | Placeholder / disabled text | 4.5 | 30 | WCAG-exempt **only** if truly disabled |
| `link` | Inline accent/link text | 4.5 | 75 | Links are text |
| `onAccent` | Label on a filled accent (button) | 4.5 | 75 | fg = label, bg = fill |
| `nonText` | Meaningful icon / UI graphic | 3.0 | 45 | WCAG 1.4.11 |
| `focus` | Focus ring vs adjacent bg | 3.0 | 45 | WCAG 1.4.11 / 2.4.11 |
| `border` | Delimiting control boundary | 3.0 | 30 | Required **only** if border alone marks the control |

Edit the `roles` map in `scripts/contrast.config.json` to retune; never hardcode in the engine.

---

## 4. The rabbit holes

### 4.1 Translucency / glass (alpha < 1)
A semi-transparent surface (e.g. `--landing-header-bg: rgb(10 13 18 / 0.72)`) has **no
fixed contrast** — it depends on what scrolls behind it. Rules:
- **Composite first**: `out = fg·α + backdrop·(1−α)` per channel, then measure. The
  validator does this for tokens listed in `translucent` (composited over the declared
  backdrop) and for any translucent foreground over its pair bg.
- **Test the worst case**: a glass element over arbitrary content must hold contrast over
  *both* the lightest and darkest plausible backdrop. If it can't, add a solid scrim or
  raise α. `backdrop-filter: blur()` does **not** add measurable contrast — it blurs,
  it doesn't darken; pair it with a translucent tint.

### 4.2 Gradients
Text over a gradient must pass at the **lowest-contrast point** along the text's run,
not the average. Sample the gradient under the glyph bounds; gate on the worst stop.

### 4.3 Shadows, glows, halation
- `text-shadow`/`box-shadow` are **not** counted by either metric — never rely on a glow
  to "fix" contrast.
- **Halation** (Legge & Rubin): pure `#fff` text on near-black blooms for readers with
  astigmatism (~30–50%). Mitigation already in this repo: primary dark-mode text is
  `#e2e8f0` (~87% white), not `#fff`. Keep it.

### 4.4 Interactive states
Every *visible, enabled* state must meet contrast independently: default, **hover**,
**active/pressed**, **focus**, **visited**, **selected**, **checked**. A hover color that
drops below 4.5:1 fails even if the default passes. Disabled is exempt (but keep ≥ Lc 30).

### 4.5 Color blindness (CVD) — a *separate* axis
Contrast ≠ color discrimination. Two colors can have great luminance contrast yet be
indistinguishable to a dichromat. Covered by **1.4.1 Use of Color (A)**: never encode
information by hue alone. Pair color with text/icon/shape (e.g. error = red **+** icon **+**
message). Check deuteranopia/protanopia/tritanopia. APCA/WCAG do not measure this.

### 4.6 System preferences
- **`prefers-color-scheme`** — supported here via the `color-scheme` mixin + `data-theme`.
- **`prefers-contrast: more`** — not yet implemented; the hook exists. When added, supply
  a higher-contrast token set (push body to Lc 90 / AAA 7:1).
- **`forced-colors` / Windows High Contrast** — the OS replaces your palette with system
  colors. Don't fight it: use `forced-colors` queries sparingly, keep `outline` on focus
  (forced-colors strips `box-shadow`), and set `forced-color-adjust` only with intent.

### 4.7 Size & weight (why APCA ≠ a single ratio)
Thin strokes scatter more light → need more contrast. WCAG only forks at one size
boundary (large vs normal); APCA encodes a continuous size×weight curve. A 300-weight
display face needs materially more Lc than a 700-weight at the same px.

### 4.8 Gamut / display caveats
The math assumes sRGB. P3/HDR displays, OLED black smear, and ambient light shift the
real perceived contrast. Treat token-matrix numbers as the *design contract*; runtime
axe-core on the rendered DOM (Layer 3) catches what static tokens can't.

### 4.9 Why a swatch matrix is an approximation
Human contrast perception is affected by surrounding area, local adaptation, and element
size. A FG/BG pair score is a necessary baseline, not the full truth — hence the layered
validation below.

---

## 4b. Beyond compliance — legibility, harmony, and taste

Passing the floor ≠ reading well ≠ looking good. Three bands, of decreasing computability:

**Legibility / harmony (computable — the `scales` + harmony gate).** Most of the felt quality of
a palette is *distribution*, not floors:
- **Hierarchy separation.** Adjacent text tiers must differ by a visible step (default ≥ Lc 3 here,
  ~Lc 12–15 to feel like distinct levels) and never invert. Two tiers at Lc 78/76 both "pass" yet
  look identical → hierarchy is dead.
- **Comfort band / halation.** Body around Lc 75–90 is the sweet spot; pure `#fff` text on dark
  (Lc ~106) glares and blooms (halation) — use ~87% white. So sometimes you *lower* contrast for
  legibility. Over-contrast is a defect too.
- **Cross-theme parity.** The same role should read at a similar |Lc| in every theme; a tier that
  is strong in light but weak in dark makes the product "feel" different per theme.
- **Surface distinctness.** Stacked surfaces (page < card < elevated) must differ enough to read as
  layers; near-identical surfaces (ratio ≈ 1.0) flatten the UI.

**Taste / brand (NOT computable by a script).** Whether indigo feels premium, whether the whole
composition is balanced. Two honest substitutes for human judgement: (1) render and let a vision
model *look* (screenshot review); (2) conform to a contrast-engineered reference scale — Radix
Colors and IBM Carbon publish steps with known accessible/solid roles, so "does my ramp have an
accessible-text step and a solid-fill step?" borrows expert taste as an objective target.

The validator owns band 1 (floors) and band 2 (harmony, gated). Band 3 is handed to the eye and to
reference systems — see `SKILL.md` → *Compliant vs legible vs beautiful*.

## 5. How to validate — three layers

| Layer | Tool | Catches | Misses |
|---|---|---|---|
| **1. Static tokens** | `scripts/contrast-audit.mjs` (this skill) | Every defined FG/BG token pair, both metrics, both modes, alpha compositing. CI-gateable, instant. | Real render sizes, gradients/images, runtime-computed colors |
| **2. Live matrix** | DDL `/ddl/contrast` page | Visual review of the whole palette in-browser, both themes, designer-facing | Automated regression |
| **3. Runtime DOM** | axe-core in Playwright e2e | Actual rendered pages incl. composited/gradient/inherited colors, real font sizes | Things not on a tested route; APCA (axe uses WCAG 2) |

Layer 1 is the gate. Layers 2–3 are confirmation. See `applying-to-project.md`.

---

## 6. Sources

- WCAG 2.2 — Contrast (Minimum) 1.4.3, Enhanced 1.4.6, Non-text 1.4.11, Focus Appearance
  2.4.13. <https://www.w3.org/WAI/WCAG22/Understanding/>
- Relative luminance & contrast ratio definitions. <https://www.w3.org/TR/WCAG22/#dfn-relative-luminance>
- APCA — *Easy Intro*, thresholds & Lc scale. <https://git.apcacontrast.com/documentation/APCAeasyIntro>
- APCA-W3 reference implementation & constants (Myndex). <https://github.com/Myndex/apca-w3>
- *Why APCA?* (perceptual uniformity, dark-mode rationale). <https://github.com/Myndex/SAPC-APCA/blob/master/documentation/WhyAPCA.md>
- Halation: Legge & Rubin (1986), psychophysics of text polarity.
