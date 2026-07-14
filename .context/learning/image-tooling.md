# Image tooling — screenshot → cover → gallery (research 2026-07-13)

Research into the best 2025–2026 tools for turning app/product screenshots into polished
project **cover** images + a home-page **gallery**, plus AI **annotation** and image-**edit**
APIs. Prices verified by fetching source pages (deep-research fan-out, Sonnet + adversarial
verify). Spot-check live pricing before committing — SaaS prices drift.

## The insight that shrinks the job

This repo already has two things that remove most of the "beautify" work:

1. **Project covers render inside `landing-browser-window`** (the browser chrome is drawn by
   the component — see `project.detail.html`). So do **NOT bake a browser frame into the
   thumbnail** or it double-frames. The stored image should be **clean content, cropped to
   16:9**. (Raw thumbnails are also used un-chromed in the archive list cards + home §04 gallery.)
2. **Images already flow through Cloudinary** (`cloudinarySrcset` pipe). Cloudinary's
   transformation URL API can add **backdrop / padding / shadow server-side** — no new
   dependency needed for framing.

⟹ Real work = **capture clean → (annotate/redact if needed) → normalise to 16:9 → backdrop
via Cloudinary → optimise.** Plus **one** pay-per-use AI API for taste-critical hero polish.

## Capture

| Tool | Price (verified) | Kind | Notes |
|---|---|---|---|
| **CleanShot X** ⭐ | **$29 one-time** (+opt $19/yr updates); Cloud Pro $8/mo annual | macOS native | Only tool that captures **scrolling/full-page at the OS level** + **AI smart-blur** (emails/tokens/cards) + fast annotation. `cleanshot.com/pricing` |
| **Playwright** | Free (Apache-2.0) | CLI/Node | Already available via `playwright-skill`. Automatable capture of web apps (this portfolio, console, /ddl are web → Claude can capture them). |
| **GoFullPage** | Free (Premium $1/mo) | Chrome ext | Full-page in one click — material for the **detail page**, not the grid thumbnail. |

## Frame / beautify — GUI (manual, highest polish)

| Tool | Price (verified) | Notes |
|---|---|---|
| **BrowserFrame** ⭐ | **Free**, no signup | Real Chrome/Firefox/Safari chrome — matches `landing-browser-window`; use where NO component chrome exists (e.g. OG card). `browserframe.com` |
| **Screely** | **Free**, client-side | Frame + gradient + annotate + blur; images never leave the browser. Cleanest free framer. |
| **Shots.so** | Free **3 exports/mo**, Pro $12/mo, $6 Launch Pass | Device frames + gradients + video/GIF export. |
| **Pika (pika.style)** | Free (no watermark), Pro $13/mo → **API + macOS app** | Broadest single tool: captures **live URL full-page** + frames + API. |
| ray.so | Free (OSS) | Code snippets only — not general screenshots. |

## Programmatic / batch (Claude-automatable)

| Tool | Price | Role |
|---|---|---|
| **Cloudinary transform URL** ⭐ | Free 25 credits/mo (**already in stack**) | `b_gradient` backdrop · `e_shadow` · `c_pad`/`c_lpad` padding-as-frame · `l_` overlay. Framing server-side, zero new deps. |
| **sharp** ⭐ | Free | Batch resize/crop/convert (WebP/AVIF) + `.composite()`; ~4–5× faster than ImageMagick. Normalise a whole gallery to 16:9. |
| **Satori (`@vercel/og`)** | Free (OSS) | JSX+CSS → SVG → raster (via sharp). Programmatic chrome/gradient frames + OG 1200×630 cards. Flexbox-only, no CSS grid. |
| ImageMagick | Free | CLI fallback if avoiding Node. |
| ~~@squoosh/cli~~ | — | **Dead** (Google unmaintained). Use `Squoosh-with-CLI` fork only for its codecs on huge batches. |

## AI annotation — the honest finding

**No mainstream tool does true "AI auto-callout on an already-captured screenshot."** Three tiers:

- **Manual annotators + AI bolt-ons** — CleanShot X / Snagit ($39/yr, subscription-only since 2025)
  most precise; Annotely (free) / Markup Hero ($4/mo) cheap fallbacks. The "AI" is usually just
  blur/redact, OCR, or background removal.
- **Workflow-recording auto-annotators** — Guidde / Scribe / Tango / Arcade / Supademo genuinely
  auto-place callouts, but only by **watching you click during a live recording**; they can't
  retro-annotate a static screenshot. Wrong fit for a single cover image.
- **GenAI** (Nano Banana, GPT-image) — can add arrows/labels from a prompt with legible text, but
  they **regenerate** the image (not a pixel-exact overlay). Good for a stylised hero, risky for
  documentation-accurate markup.
- **Research/agent**: Set-of-Mark + OmniParser auto-detect+box UI elements, but ship as code, output
  is functional not styled. SketchVLM (Apr 2026) = LLM draws editable SVG overlays — not productised.

⟹ For a real cover: **annotate manually in CleanShot X** (accuracy + smart-blur for company data);
reserve genAI for a stylised hero variant.

## AI gen/edit APIs — pick ONE (prices verified at source)

| Model | Price/image | Edit/inpaint | In-image text | Access |
|---|---|---|---|---|
| **Gemini 2.5 Flash "Nano Banana"** ⭐ | **$0.039** (batch **$0.0195**) | Edit **by prompt, no mask**; multi-image fusion; identity-consistent | Good | AI Studio / Vertex / Replicate |
| Nano Banana **Pro** (Gemini 3 Image) | $0.134 (1–2K) / $0.24 (4K) | as above, sharper | **Excellent** | as above |
| Ideogram 3.0 | $0.03–0.09 (instr. edit $0.20) | Remix / Edit / Reframe / Replace-bg | **Best (~90–95%)** | API / fal / Replicate |
| FLUX.1 Kontext | dev $0.025 / pro $0.04 / max $0.08 | **Purpose-built editor**, open-weight | Fair | BFL / fal / Replicate |
| Recraft V3 | raster $0.04 / **vector $0.08** | inpaint/outpaint/bg + **true SVG output** | Fair | API / fal / Replicate |
| OpenAI gpt-image-1 | $0.011–0.167 (**EOL 2026-10-23** → gpt-image-2) | mask inpaint (soft-mask drift) | Weakest | OpenAI / Azure |

**Recommended single API = Nano Banana ($0.039/image)** — cheapest capable editor, prompt-based
edits (clean up / extend canvas / reimagine hero), loopable API. 8 projects × a few tries = cents.
(If a cover is text-heavy, Ideogram wins on typography.)

## Cover + gallery best practice (primary sources verified)

- **Aspect ratio**: lock the gallery to **16:9** (matches browser-window). **OG card is a separate
  1200×630 asset** (headline/logo inside ~60–80px safe zone). Awwwards reference = 1600×1200.
- A **framed** screenshot reads "finished"; raw reads "unfinished". Pick **one style** — go
  **minimal** (thin chrome + subtle shadow + neutral backdrop) to match the landing's SaaS voice.
- **Export 2×** (hero 3×). 1× is the #1 mistake (pixelates on Retina/4K).
- **Cover represents, doesn't document** — above-the-fold hero in one frame; optional small mobile
  frame behind to signal "responsive". **Don't cram a full scroll into a thumbnail** (that's the
  detail page's job).
- **Gallery consistency**: one aspect ratio + `object-fit:cover`; one frame/backdrop preset;
  cross-project colour harmony; identical corner radius / shadow / text position across cards.

## Recommended stack (budget: free + 1 API)

```
Capture   → Playwright (free, Claude-driven for web apps)  +  CleanShot X ($29 one-time, taste/redact)
Annotate  → CleanShot X manual (precise + smart-blur)
AI polish → Nano Banana API ($0.039/img) — only when reimagining/cleaning a hero
Frame/bg  → Cloudinary transform (already in stack, free) — b_gradient + c_pad + e_shadow
Batch/16:9→ sharp (free) or Cloudinary
```

New cost: **$29 CleanShot (optional) + ~cents of Nano Banana.** No heavy deps.

## Pipeline: screenshot → cover → gallery

1. **Capture** — Playwright for web (portfolio/console/ddl/design-bank auto); CleanShot for non-web.
2. **Clean/redact** — CleanShot smart-blur any company/client data (work projects).
3. **(optional) AI polish** — Nano Banana: clean background / extend canvas / hero variant.
4. **Normalise** — 16:9, 2×, via sharp or Cloudinary.
5. **Backdrop/shadow** — Cloudinary transform. **Do not bake chrome** (component draws it).
6. **Upload** — Cloudinary; `cloudinarySrcset` handles the rest.

**Claude-automatable**: batch-capture web apps, normalise 16:9 / resize / convert, build consistent
gradient backdrops, loop the Nano Banana API, write the capture script.
**Manual (taste)**: art direction, choosing the hero frame, callout placement, accepting AI output.

## Possible skill

Package the pipeline as a Claude Code skill (e.g. `project-cover`): input URL/screenshot → capture
(Playwright) → normalise 16:9 → Cloudinary backdrop → (optional) Nano Banana → upload. One command
per project, guaranteed consistency.

## Key sources

- Nano Banana pricing: `ai.google.dev/gemini-api/docs/pricing`
- FLUX Kontext: `docs.bfl.ml/quick_start/pricing`, `fal.ai/models/fal-ai/flux-pro/kontext`
- Ideogram: `ideogram.ai/api-pricing`; Recraft: `recraft.ai/docs/api-reference/pricing`
- OpenAI images: `developers.openai.com/api/docs/pricing`
- CleanShot X: `cleanshot.com/pricing`; Cloudinary: `cloudinary.com/documentation/transformation_reference`
- sharp: `sharp.pixelplumbing.com`; Satori: `github.com/vercel/satori`
- Dimensions: Awwwards `awwwards.com/faqs`, Vercel OG `vercel.com/docs/og-image-generation`
