---
name: contrast-audit
description: |
  Validate and fix color contrast across a project's design tokens, in every theme,
  against WCAG 2.x (the legal gate) and APCA (the perceptual quality bar — catches the
  weak dark-mode text WCAG rubber-stamps). Framework-agnostic (Angular-first); reads
  SCSS/CSS custom-property tokens declared in a per-project config. Can scaffold that
  config for a new app, run a zero-dep token-matrix audit, triage findings into fix
  tiers, and propose gated token fixes. Triggers: "contrast", "color contrast",
  "contrast audit", "WCAG contrast", "APCA", "check contrast", "độ tương phản",
  "kiểm tra tương phản", "/contrast-audit".
---

# Contrast Audit

Token-driven contrast validation for **any project, every theme**. The gate is **WCAG 2.x**
(legal floor — fails CI); the quality bar is **APCA Lc** (perceptual; catches the muddy
dark-mode text WCAG passes). Nothing here is hardcoded to one repo — all project specifics
live in `scripts/contrast.config.json`, which the skill can scaffold for you.

## Files

| File | Generic? | Purpose |
|---|---|---|
| `references/contrast-science.md` | ✅ | The model: WCAG + APCA formulas, exact constants, threshold tables, role map, every rabbit hole (translucency, gradients, halation, states, CVD, forced-colors). |
| `references/applying-to-project.md` | 📌 example | A **worked example** — how one Nx repo (landing + console) is wired. Read it as a template, not as the skill's lore. New projects use Init instead. |
| `scripts/contrast-audit.mjs` | ✅ | Zero-dep engine: parses tokens → WCAG ratio + APCA Lc per pair → matrix + FAIL list. Self-tests vs published reference values on every run. |
| `scripts/scaffold-config.mjs` | ✅ | Init: scans style dirs, classifies color tokens, emits a draft config. |
| `scripts/contrast.config.json` | 🔒 per-project | **The only project-specific file.** Token paths, theme selectors, role thresholds, pair list. Reuse = regenerate/edit this, never the engine. |

## Three verification layers

1. **Static tokens** — `contrast-audit.mjs` (this skill). The gate. Instant, CI-able.
2. **Live matrix** — an optional `/ddl/contrast`-style page rendering the palette in-browser.
3. **Runtime DOM** — axe-core on rendered pages → **delegate to `playwright-skill`**. Catches
   composited/gradient/inherited colors and real font sizes the static pass can't see.

### Compliant vs legible vs beautiful
- **Compliant** (objective): WCAG/APCA per-pair floors — Layer 1 gate.
- **Legible / well-distributed** (computable proxies): the **harmony gate** — hierarchy separation,
  cross-theme parity, no halation, distinct surfaces. Also Layer 1.
- **Beautiful / on-brand** (NOT script-judgeable): two honest aids — (a) **the eye**: render the
  page and have the model *look* at the screenshot via `playwright-skill` for a qualitative read;
  (b) **borrowed taste**: compare the scale to a contrast-engineered reference system (Radix Colors,
  IBM Carbon — they publish accessible text/solid steps) and to the design bank via `/design review`.
  The script never claims to judge beauty; it judges the measurable, then hands the eye a clean canvas.

## Modes

### Init — new project, or no config yet
1. `node .claude/skills/contrast-audit/scripts/scaffold-config.mjs <style-dir> ... --out draft.config.json`
2. Review the draft **with the user**: resolve every `$todo` — label `???` theme modes, prune
   pairs that never occur in the UI, and **merge inherited layers** (a dark theme that only
   *overrides* a light `:root` needs the base `:root` as an earlier `layers[]` entry so
   un-overridden tokens resolve). Set each translucent token's `over` backdrop.
3. Save as `scripts/contrast.config.json`. Confirm math: `contrast-audit.mjs --verify`.

### Audit
```bash
node .claude/skills/contrast-audit/scripts/contrast-audit.mjs            # full matrix
node .claude/skills/contrast-audit/scripts/contrast-audit.mjs --fail-only   # only FAIL/WARN
node .claude/skills/contrast-audit/scripts/contrast-audit.mjs --md o.md --json o.json
node .claude/skills/contrast-audit/scripts/contrast-audit.mjs --verify      # prove the math
```
Exit code ≠ 0 when any pair fails its WCAG floor → wire into CI. Status: **FAIL** = below
WCAG min · **WARN** = passes WCAG but below APCA target · **PASS** = both.

After the per-pair matrix, the audit runs the **harmony gate** — computable proxies for
"legible & easy on the eye" that compliance misses: hierarchy steps must stay *distinct &
monotonic*, a role must read *consistently across themes* (no light-vs-dark blowups), text
must not be pure-white-on-dark (halation), and surfaces must read as *distinct layers*.
Harmony failures also exit non-zero. Thresholds are conservative (fire only on unambiguous
problems, not taste calls) and tunable in `harmony`. Every harmony failure carries a fix direction.

### Triage
Do **not** read the raw FAIL count as the violation count — borders/feedback inflate it. Tier:
1. **Must-fix (text & interactive):** body/link/onAccent/placeholder below 4.5:1. Real WCAG
   failures on visible enabled elements. Highest impact.
2. **Non-text / feedback:** meaningful icons & control boundaries below 3:1 (1.4.11) — real
   **only if** the graphic/border *alone* conveys meaning or marks the control.
3. **APCA-quality (mostly dark mode):** passes WCAG, fails the Lc target — reads weak. Not a
   legal fail; fix for quality.
4. **Conditional / exempt:** decorative borders, dividers, disabled text. Leave unless load-bearing.
For each border/icon, ask: *is this the only thing marking an operable control or meaning?*

### Fix (GATED — never edit tokens without approval)
**Fix discipline — always at the token layer, never at usage sites.** The point of semantic
tokens: change the token once, the whole app follows. Never edit component files to patch a color.
1. Propose specific token deltas with **predicted new scores** (recompute before suggesting).
2. **Stay in the existing idiom.** Edit the same file/selector, match its comment & naming style,
   and change **light AND dark in lockstep** so the two modes keep parity (a harmony rule).
3. **One token can't serve two roles? Add a token, don't hack usage.** When a fill color must also
   be readable accent text (the classic primary-fill vs accent-text conflict), introduce an additive
   semantic token (`--x-strong`, `--on-x`) rather than compromising one role — additive, non-breaking,
   matches "reuse → extend → create". Token-system consumers (e.g. Material overrides reading `--color-*`)
   then flow through automatically — no per-component edits.
4. Watch coupled pairs: darkening an accent fill raises link contrast but can drop the white on-fill
   label — the matrix shows both at once; confirm both move the right way.
5. On approval: edit token files, **re-run the audit to prove it** (pairs + harmony), and if the
   project keeps a design-language page, update it in the **same commit**.
6. Re-run full audit; confirm no new FAIL/harmony regression appeared elsewhere, then leave the CI
   gate to prevent recurrence.

### Extend
- Add a pair → append to `pairs.<system>`; retune a threshold or target AAA → edit `roles`.
- Build Layer 2 (live matrix page) or Layer 3 (axe via `playwright-skill`). New routes need a
  dev-server restart — flag it; do not start servers yourself.

### Reuse (another app)
Copy the skill folder, run **Init**. Loader supports **SCSS and CSS custom properties**,
including themes nested in a wrapper (`@media (prefers-color-scheme: dark)`) via a layer's
optional `within`. Token formats that aren't CSS custom properties (Tailwind config, JS/TS/JSON
theme objects, CSS-in-JS) are **not yet parsed** — add a branch in the engine's token-loader
(the one sanctioned engine edit) when a real non-CSS project needs it.

## Config schema (in `contrast.config.json`)
- `roles` — `{label, wcag, apca, note}` per role (`body|large|caption|placeholder|link|onAccent|nonText|focus|border`).
- `themes[]` — `{id, system, mode, layers[]}`; each layer `{file, selector, within?}`. **N themes
  supported** — add one per theme (dark/light/sepia/high-contrast/brand-x…). Stack `layers` for
  inherited themes (base first, overrides last).
- `pairs.<system>[]` — `{fg, bg, role, note?}`; `fg`/`bg` are token names or literal `#hex`/`rgb()`/`hsl()`.
- `translucent` — `{ "--token": {over: "--backdrop"} }` to composite alpha before scoring.
- `scales[]` — ordered ramps for the **harmony gate**: `{id, system, type: "text"|"surface", on?, tokens[]}`.
  `text` ramps are checked for hierarchy separation + cross-theme parity (judged on `on`); `surface`
  ramps for layer distinctness. `harmony` — `{minTierGapLc, maxThemeSpreadLc, minSurfaceRatio}` thresholds.

## Multi-theme & per-section backgrounds
- **More than 2 themes / only 1 theme:** just list them all in `themes[]` — the engine is count-agnostic.
- **One theme, different backgrounds per section** (e.g. a black hero above white content): declare
  each section background as a `bg` token and add `text → section-bg` pairs (static coverage). Which
  element actually renders over which section is a *runtime composition* fact the static matrix can't
  know → that's what Layer 3 (axe on the rendered DOM) is for.

## Correctness
The engine refuses to run if its math drifts: on load it cross-checks 8 published reference
values (WebAIM for WCAG, apcacontrast.com/Myndex for APCA) and throws on mismatch. `--verify`
prints them. APCA constants are the frozen `apca-w3` set. Re-confirm any pair yourself at
webaim.org/resources/contrastchecker and apcacontrast.com.

## Related skills
- **`playwright-skill`** — runs Layer 3 (axe-core on the live DOM). Delegate browser work here.
- **`/design review`** — after a color fix, review the component against the design bank.
- **`find-tool`** — locate an axe/contrast library or MCP if you need one.
- **`skill-creator`** — tune this skill's frontmatter / triggers / evals.

## Rules
- **WCAG is the gate, APCA is the bar.** Never silence a FAIL by relaxing a role — fix the color.
- **Every theme, every system.** A fix that helps light can hurt dark; the matrix shows all at once.
- **Placeholders are real text** (4.5:1). Only *disabled* controls are WCAG-exempt — keep them ≥ Lc 30.
- Triage borders/icons by the 1.4.11 "is it load-bearing?" test before calling them violations.
- **Don't start dev servers.** The validator needs none; Layer 2/3 work is gated and uses a running server.
