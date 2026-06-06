# Applying contrast validation — a worked example

> **This is an EXAMPLE overlay, not part of the generic skill.** It shows how *one* Nx repo
> (landing + console) is wired, as a template to learn from. For a new project, don't copy
> these specifics — run **Init** (`scripts/scaffold-config.mjs`) to generate a draft config,
> then use this doc to understand what the draft means. The generic model lives in
> `contrast-science.md`; the generic workflow in `SKILL.md`.

How the science maps onto this repo's two token systems, how the validator reads them,
and how to extend/reuse.

---

## 1. Two independent color systems

This repo enforces a hard domain split (see root `CLAUDE.md`). Contrast must be validated
**per system, per mode** — four theme contexts total.

| System | Token prefix | Theme switch | Modes | Token sources |
|---|---|---|---|---|
| **Landing** | `--landing-*` | `:root[data-theme='dark'\|'light']` (+ no-attr default = dark) | dark, light | `libs/landing/shared/ui/src/tokens/colors.scss` |
| **Console / shared** | `--color-*` | `.dark` class (else `:root` = light) | light, dark | `libs/shared/ui/styles/src/tokens/colors.scss` (light) + `libs/shared/ui/styles/src/themes/dark.scss` (`.dark` overrides) |

Key subtlety the validator handles: **console-dark is a merge** — `.dark` only overrides a
subset, the rest inherits from `:root`. The config models this with layered `layers`
(later layer overrides earlier). `--color-primary` etc. are `hsl(var(--accent-hue) …)`;
the loader resolves `var()` and `hsl()` across layers.

---

## 2. Token → role mapping (design intent)

What each token *means*, hence which threshold it's judged at. This is the contract the
audit encodes; if intent changes, update `pairs` in the config.

**Landing** (`--landing-*`): `text-300` primary / `text-400` secondary / `text-500`
muted (= `--landing-text-muted`) → all `body`. `text-600` captions → `caption`. `text-700`
placeholder/dimmed → `placeholder`. `accent` as link → `link`, as icon/ring → `nonText`/
`focus`. `border`/`border-strong` → `border`. Backgrounds: `bg`/`ink-0`, `surface`/`ink-1`,
`surface-elevated`/`ink-2`, plus the composited `header-bg` glass.

**Console** (`--color-*`): `text` / `text-secondary` → `body`. `text-muted` →
`body`/`caption` (cookbook says "captions only" — the audit shows even that fails light).
`placeholder` → `placeholder`. `text-on-primary` on `primary` → `onAccent` (button label).
`primary` → `link`/`nonText`/`focus`. `success`/`warning`/`error` → `nonText` (icons) and
as text on their `*-container` → `body`. `border`/`border-strong` → `border`.

---

## 3. Layer 1 — the static validator (the gate)

```bash
# From repo root:
node .claude/skills/contrast-audit/scripts/contrast-audit.mjs
node .claude/skills/contrast-audit/scripts/contrast-audit.mjs --fail-only        # only FAIL/WARN rows
node .claude/skills/contrast-audit/scripts/contrast-audit.mjs --md report.md --json report.json
```

- Zero dependencies (plain Node ESM). Reads the SCSS token files directly → can never
  drift from source. Self-tests the math on load (black/white must be 21:1 / Lc 106).
- **Exit code 1** when any pair FAILs its WCAG floor → drop into CI (`nx run … contrast`
  target or a `package.json` script) to block regressions. WARN (APCA-only) does not fail
  CI but should be reviewed.
- Config schema (`scripts/contrast.config.json`): `roles` (label + wcag + apca + note),
  `translucent` (token → backdrop for compositing), `themes` (id, system, mode, layers),
  `pairs` (per system: `{fg, bg, role, note?}`; `fg`/`bg` are token names or literal
  `#hex`/`rgb()`/`hsl()`).

**Adding a pair:** append to `pairs.<system>`. **Retuning a threshold:** edit `roles`.
Never edit `contrast-audit.mjs` for project specifics — it's the portable engine.

---

## 4. Layer 2 — DDL live contrast matrix (recommended next build)

Per the repo's "DDL = source of truth for landing UI" guardrail, add a `/ddl/contrast`
showcase that renders every FG/BG pair as swatches with live WCAG ratio + APCA Lc + a
pass/fail badge, with a theme toggle so reviewers see both modes. This makes contrast a
visible part of the design language, not a hidden script. Build it as a landing feature
page; compute ratios client-side reusing the same math (extract the color fns from the
engine into a tiny shared util if you want a single source). **New route → requires a dev
server restart (HMR won't register it); flag that to the user.**

---

## 5. Layer 3 — axe-core runtime check (catches what tokens can't)

Extend `apps/landing-e2e/src/responsive-a11y.spec.ts` (and a console equivalent) with an
`@axe-core/playwright` scan asserting zero `color-contrast` violations on key routes, in
both themes. This catches composited/gradient/inherited colors and real font sizes that
the static matrix can't see. Note: axe uses **WCAG 2** only — APCA stays with Layer 1.
Use `playwright-skill` to drive the browser; do not start the dev server yourself.

---

## 6. Reuse on another project

The engine is project-agnostic. Fastest path: copy `.claude/skills/contrast-audit/`, then run
**Init** — `node scripts/scaffold-config.mjs <style-dirs> --out draft.config.json` — to
auto-detect themes/tokens and emit a draft. Then refine **only `scripts/contrast.config.json`**:
1. Point `themes[].layers[].file` at that project's token files; set the right `selector`
   per theme/mode (CSS class, attribute, or `:root`). Stack `layers` for inherited themes.
2. List the meaningful `pairs` per system with their `role`.
3. Add any `translucent` tokens + their backdrops.
4. Retune `roles` if the design system targets AAA or a different APCA bar.

No engine edits. If a project stores tokens in JS/TS/JSON/Tailwind theme instead of SCSS,
add a loader branch in the engine's token-loader section (the only place that knows file
format) — that's the one sanctioned extension point.

---

## 7. Fix strategy (gated)

Token changes are **never** applied without explicit approval. The workflow:
1. Run the audit → triage the FAIL/WARN list into tiers (see `SKILL.md` → Triage).
2. Propose specific token deltas (new hex/lightness) with the predicted new scores.
3. On approval: edit the token SCSS, re-run the audit to prove the fix, and — per the DDL
   guardrail — update the DDL contrast page / pairing rules in the **same commit**.
4. Re-run; confirm no new FAILs introduced elsewhere (e.g. darkening primary may affect
   `onAccent` white-label contrast — the matrix shows both at once).
