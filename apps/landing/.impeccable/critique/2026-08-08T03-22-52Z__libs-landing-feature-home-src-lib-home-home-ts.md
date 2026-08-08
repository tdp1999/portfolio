---
target: "https://thunderphong.com/ (home, content) + localhost (code)"
total_score: 20
max_score: 32
na_heuristics: 9,10
p0_count: 1
p1_count: 3
timestamp: 2026-08-08T03-22-52Z
slug: libs-landing-feature-home-src-lib-home-home-ts
---
Method: dual-agent (A: a97c31267edf9a19a · B: ae664e930e6ca7a6d) + production re-verification (a3407943159207d01)

**Scope note — two targets, deliberately.** An earlier run of this critique measured `http://localhost:4200/`, whose content comes from `apps/api/prisma/seeds/dev-content.seed.ts` (picsum placeholder images, `phuongtran.dev` links, a `zalo.me/0123456789` number). That run's content findings were seed artifacts and have been discarded. This run splits the target: **content, copy, composition and typography distribution are measured on `https://thunderphong.com/`** (real authored content), while **code-level findings — focus treatments, tab order, ARIA, sticky-chrome collisions — are measured on localhost**, because production is one deploy behind `master` (it 404s on `/version`, which exists in the route table). Each finding below states which target produced it.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | No `aria-current` on any header nav link; the `EN` button and the copy-email button have no focus indicator at all. |
| 2 | Match System / Real World | 2 | "Passion projects." with the deck "A few personal ideas I made real" sits above exactly one project, namespaced to the employer org and described as replacing CKEditor in banking workflows. |
| 3 | User Control and Freedom | 3 | Tabs and the lamp are reversible, but the lamp's spotlight dims story paragraphs with no visible way back. |
| 4 | Consistency and Standards | 2 | Five different focus treatments on one page; alignment flips left→center→left→center; Newsreader appears 11 times in `<main>`, including in repeating contexts. |
| 5 | Error Prevention | 3 | Nothing destructive on this surface, and the placeholder URLs found on the dev server do not exist in production. |
| 6 | Recognition Rather Than Recall | 2 | The resume is one link inside a hover mega-menu and has no `vi` entry; three prose paragraphs are `role="button"` with no affordance; the click hint sits 600px from its own targets. |
| 7 | Flexibility and Efficiency | 3 | Real strength: `⌘K` palette with page and action entries, pill minimap, scroll-to-top. No skip-to-content link. |
| 8 | Aesthetic and Minimalist Design | 3 | The gallery is real product evidence, not decoration. But Selected Work runs 69.7% JetBrains Mono, and the page ships 916 words on the surface designated for the fast skim. |
| 9 | Error Recovery | n/a | The home page has no forms, no destructive actions and no error states; error recovery lives on `/contact`. |
| 10 | Help and Documentation | n/a | A portfolio home has no documentation surface. The one affordance hint is scored under Recognition instead. |
| **Total** | | **20/32 (62.5%)** | **Acceptable — significant improvements needed** |

Two heuristics were scored `n/a` and the total is renormalized to 32.

## Design Specificity Verdict

**Authored world, and — corrected — a mostly authored argument. The remaining gap is framing, not evidence.**

**LLM assessment.** The hero lockup (Inter 96/600 for the name, Newsreader italic 64px for the role in accent) is a real authored device, reused as a motif across three section headings. The drafting-sheet labelling is equally specific: `STATUS / CORE STACK / LOCATION` as a mono `<dl>`, `§2.1 IDENTITY` inside cards, `FIG. 01 ·` under every image, the blueprint perspective floor in the hero. That vocabulary could not be lifted onto another product without looking stolen.

The earlier claim that the page fails to protect its positioning was **wrong**, and production disproves it decisively. Inside `<main>` there are five `document-engine` links (a case study, a live demo at `document-engine.thunderphong.com/editor/basic`, the GitHub repository, and both npm package listings) plus two direct npm package links. The gallery is four real product screenshots — the builder with an open insert-table panel, one support letter rendered under two themes beside the four CSS variables that differ, the editor on a phone with a wrapped toolbar, and an architecture diagram of demo → Angular wrapper → framework-agnostic core. That is inspectable evidence, exactly what the product principle asks for.

What remains genuinely weak is the framing around that evidence. The section is headed **"Passion projects."** with the deck **"A few personal ideas I made real"**, and it contains **exactly one project** — a single tab, both scroll arrows hidden because there is nothing to scroll. That project is namespaced to the employer organisation (`github.com/phuong-tran-redoc/document-engine`, `@phuong-tran-redoc/*`) and its own body copy says it "is used to author documents in banking and fintech workflows, and was created to replace CKEditor." A plural heading promising personal work, over one employer-namespaced library, is a promise the page cannot keep. The `/ddl` design sandbox is correctly placed as chrome (footer banner, mega-menu, command palette) rather than in `<main>`; that is a placement decision, not an oversight.

**Deterministic scan.** The static detector run against the home surface came back **completely clean** — `detect.mjs --json libs/landing/feature-home/src` exited 0 with an empty result across 31 source files, and `apps/landing/src/app/app.html` also exited 0. No token drift, no off-scale literal, no slop pattern in the source. The problems on this page are compositional and editorial, not craft-level sloppiness.

The runtime detector on the rendered page found 11 distinct rules. After triage against DESIGN.md: `all-caps-body` ×7 is genuine and corroborates the priority issue below; `cramped-padding` on `<landing-segmented>` is a genuine small finding. The rest are false positives against this documented world — `bounce-easing` ×19 is the lift-off arrow easing DESIGN.md names as a signature; `codex-grid-background`, `repeating-stripes-gradient` and `radial-spotlight-glow` are the blueprint, hatch and aurora backgrounds the North Star is built on; `wide-tracking` ×4 is the documented 0.06em mono tracking; `cramped-padding` on `landing-chip` is the documented 2/6/14px exemption; `marquee` is the router progress bar. Its `overused-font — inter (19%)` reading was a seed artifact: production measures Inter at **54.5%** document-wide and **56.2%** in `<main>`.

**Visual overlays.** Injection succeeded on the dev server and the in-page detector ran, but the live server has since been stopped (pid 96464 killed, port 8400 verified free). There is **no overlay currently visible in the browser**; the console output is captured evidence only.

## Overall Impression

This page has real evidence and a framing problem. The Document Engine section proves the thing the product record cares most about — a shipped, inspectable library with a live demo and two published packages — and then labels it "a few personal ideas I made real," which is neither accurate nor the strongest available claim. Meanwhile the hero, 820px of the best design on the site, asks the visitor for nothing at all, and the resume that should answer the recruiter's only question exists as one English-only link inside a hover menu.

Biggest opportunity: give the hero one primary action plus a visible resume link, and re-frame Selected Work around what the evidence actually shows.

## What's Working

**The gallery is real evidence, and it is well chosen.** Four Cloudinary-served screenshots that each demonstrate a different claim: a feature (insert-table panel), a theming property (one letter under two themes beside the four variables that differ), responsive behaviour (phone with wrapped toolbar), and architecture (demo → wrapper → core). Most portfolios show a hero shot four times. This shows four different arguments.

**The hero identity lockup, reused as a page-wide motif.** The sans states the fact, the serif inflects it, and the switch repeats across three section headings. One device, four appearances.

**The floating pill nav (`3 / 6 Selected Work`).** Correct pattern for a 6053px page: names position, counts what remains, hides inside the hero, stands down when the footer banner enters view. Those two hide rules are judgment most implementations skip.

**Voice discipline holds under measurement.** The stated no-em-dash rule survives contact with real content: exactly **one** em dash in the whole page, and it is a decorative 64px Newsreader glyph in the hero lockup, not prose. Body copy uses spaced hyphens throughout.

**Clean static craft, zero horizontal overflow** at 1440 (1429 vs 1440) and 390 (379 vs 390).

## Priority Issues

### [P0] The hero asks for nothing, and the resume is one hover-menu link with no Vietnamese version

*Measured on production and confirmed in source.* `section.home-hero` is 820px tall and contains **zero** interactive elements: 0 links, 0 buttons, 0 `[role=button]`, 0 focusable elements. Across the whole document there is exactly **one** resume link. It is not in `<main>`, not in the footer banner, not in the `<footer>` — it lives in the header **More** mega-menu under a DOCUMENTS heading, labelled "Resume / PDF". The command palette does not surface it either.

Worse than first reported: the transfer-state payload is `"resumeUrls":{"en":{…}}` with **no `vi` entry at all**. PRODUCT.md names a *locale-matched* resume download as one of four success actions, and names bilingual EN/VI as one of three positioning pillars. A Vietnamese reader cannot reach a resume in any language.

**Why it matters:** two of four audiences arrive with one question and leave without an answer. A visitor sold by the hero must scroll past the fold to find anything at all to click.

**Fix:** two actions in the hero directly under `.home-hero__sub-emphasis` — one solid accent button (Get in touch) and one ghost (Download resume, PDF), which is the documented Solid/Ghost pattern the system currently uses zero times on this page. Move `STATUS · AVAILABLE FOR HIRE` from the bottom-right corner to sit beside them. Separately, either publish a `vi` resume or make the EN-only fallback explicit in the link label rather than silent.

**Suggested command:** `/impeccable layout`

### [P1] The section that sells the work is 69.7% mono caps

*Measured on production.* `p.selected-work-tab__meta-role` renders verbatim:

> OWNED IT END TO END. I PLANNED IT, RESEARCHED THE SCOPE AND FEATURES, THEN BUILT THE FRAMEWORK-AGNOSTIC CORE (DOCUMENT MODEL, COMMANDS, SERIALIZATION, EXTENSIONS) AND THE ANGULAR WRAPPER. I ALSO PACKAGED AND PUBLISHED BOTH LIBRARIES ON NPM.

**36 words.** Computed: `font-family: "JetBrains Mono"`, `font-size: 11px`, `text-transform: uppercase`, `color: rgb(133, 126, 226)` — the accent token. It wraps to **4 lines at 1440px and 6 lines at 390px**. The four figure captions in the same section get the same treatment at 12px, 22 to 31 words each.

Character-weighted, `home-selected-work` measures **69.7% JetBrains Mono, 26.9% Inter, 3.4% Newsreader** — the only section on the page that inverts the Two Bases Rule. The runtime detector independently flagged `all-caps-body` ×7.

This breaks two Named Rules at once. The Pointing Voice Rule: "If a reader must scan it as a sentence, it is never mono; mono caps slows reading on purpose." The One Mark Rule: indigo "appears as a mark, not as a field" — a six-line paragraph is a field.

Related, same root cause: **Newsreader appears 11 times in `<main>`**, including an `<em>` treatment repeated across three section headings at 62.72px and a 32px `<p>` inside the bio card grid — the One Display Moment Rule broken in exactly the repeating context DESIGN.md names as a Don't.

**Why it matters:** that paragraph is the single most evaluative sentence on the page. It states ownership, scope and sequencing — and it is rendered in the least legible typography the system owns, in the colour reserved for marks. The hiring manager reading it to decide whether to keep going is the reader it punishes most.

**Fix:** drop the role line and the figure captions to Inter at `--landing-body-md`, `text-400`, keeping mono caps only for genuinely pointing text (the `2025 ·` date, the `FIG. 0n ·` prefix). Then cut Newsreader in `<main>` to one display moment, starting with the bio-card title inside the grid.

**Suggested command:** `/impeccable typeset`

### [P1] "Passion projects." is plural over one employer-namespaced project

*Measured on production.* The H2 reads **"Passion projects."** and the deck reads **"A few personal ideas I made real."** The tab strip contains **exactly one tab** — DOCUMENT ENGINE (2025) — and both scroll arrows are hidden because there is nothing to scroll. That project's repository is `github.com/phuong-tran-redoc/document-engine`, its packages are `@phuong-tran-redoc/*`, and its own body copy says it "is used to author documents in banking and fintech workflows, and was created to replace CKEditor."

**Why it matters:** the page makes a promise in the heading that the content cannot keep, twice over — plural where there is one, and personal where the evidence reads as employer work. A careful reader notices, and the thing they notice is the overclaim rather than the library. That is the opposite of what the strongest section on the page deserves. The honest framing is also the more impressive one: a production editor that replaced a commercial dependency and shipped to npm is a better claim than "a personal idea I made real."

**Fix:** re-title the section to match what it holds — one shipped library, with the npm packages and the live demo as the proof. If more projects are coming, keep the plural and ship them; if not, singular framing plus the "View the full archive at /projects" link already present is stronger. Decide separately whether the employer namespace is a fact to state plainly rather than to route around.

**Suggested command:** `/impeccable clarify`

### [P1] The focus system is broken: five treatments, two controls with none

*Measured on localhost, which carries the current code.* Tab-walked from a clean load:

- Header brand, Home, About, Projects, Contact, More, ⌘K → `outline: 2px rgb(78, 148, 218)`, the **UA default blue**. The entire primary navigation is unstyled.
- Gallery figures, credit links, the `home-intro` section → same UA blue.
- Work links and contact CTAs → `2px rgb(133, 126, 226)`, the accent. Correct.
- Social icons → `2px rgb(163, 176, 196)`, a third colour.
- Theme toggle → transparent outline plus box-shadow, a fourth mechanism.
- Story paragraphs → `outline: none` plus a box-shadow ring, a fifth.
- **`EN` language button → no outline, no box-shadow. No focus indicator.**
- **`.bio-card__email` (copy to clipboard) → no outline, no box-shadow.**

DESIGN.md, Buttons: "a 2px accent outline at 2px offset. Same treatment on every interactive element in the system." Don'ts: "Don't introduce a second accent hue." Three non-accent focus colours ship simultaneously.

**Why it matters:** WCAG 2.2 AA 2.4.7 Focus Visible — the bar PRODUCT.md commits to — is failed outright by two controls, one of which writes to the clipboard. Keyboard users navigating the header see a blue that belongs to no part of this design.

**Fix:** one `:focus-visible` rule in the landing base layer applying `outline: 2px solid var(--landing-accent); outline-offset: 2px` to `a, button, [tabindex]`, then delete the per-component overrides producing the other four treatments.

**Suggested command:** `/impeccable audit`

### [P2] A fifth gallery image ships a 3200×2400 asset into a zero-height slot

*Measured on production.* The gallery renders four images at 340×255, all served through Cloudinary with `f_auto,q_auto,w_320,c_limit`. A **fifth image exists in the DOM and lays out at 0 height** at 1440px — described as "the package strip showing both npm packages at v0.1.5 with weekly download counts, MIT licence and live status." It is natural 3200×2400 and is the **only** gallery source with no Cloudinary width transform.

**Why it matters:** either it is a lightbox preload, in which case it is downloading a 3200px asset eagerly on a page that already runs 6053px tall, or it is a broken slot and the single best piece of evidence on the page — live npm download counts — is invisible. Both readings are worth fixing, and the second one is a wasted opportunity.

**Fix:** determine which it is. If it is meant to display, give it the same `w_320,c_limit` transform and a real slot; the npm package strip arguably belongs in the section body, not the gallery. If it is a lightbox preload, gate it behind the lightbox opening.

**Suggested command:** `/impeccable optimize`

## Persona Red Flags

**Morgan (agency recruiter, 60-second screen — derived from PRODUCT.md audience 2).** 0-8s: reads "Phuong Tran / Frontend Engineer" and "Four years shipping fintech tools for the Singapore market." 8-15s: scans for the resume. Not in the hero, not in the nav, not in the footer. 15-25s: finds `AVAILABLE FOR HIRE` only because it has a green dot — 11px mono, bottom-right corner. 25-60s: scrolls, finds nothing labelled resume, because the only link is inside a hover menu labelled "More". Extra friction: the hero leads with "Four years" while three later sentences say "five years"; the reconciling sentence ("Five years in, four with Redoc") sits a full section below the fold, so the skim surface leads with the number that undersells.

**Jordan (confused first-timer).** Hero with nothing to click across 820px. Then `§2.1 IDENTITY` / `§2.2 BIO` / `§2.3 CONTACT`, a sectioning notation for a document he was never shown. In The Story, three paragraphs are secretly `role="button"`; a stray click dims two of them and the only hint (`↳ CLICK TO TURN ON`) sits 600px to the right, under the lamp drawing.

**Riley (stress tester).** Watches the focus ring change colour four times in nine keypresses. `EN` — ring vanishes. Copy-email — vanishes again, on the control that writes to the clipboard. Finds `<section class="home-intro">` itself in the tab order with a UA-blue ring around an 818px region. Screen reader: three prose paragraphs announce as buttons, no nav link carries `aria-current`, The Story has no heading in the document outline, and no skip-to-content link exists in `shell.ts`.

**Casey (distracted mobile).** At 390×844 the page runs 7188px. The fold gives name, role, tagline, meta, and nothing to do. The scroll-to-top FAB has no backdrop and no reserved gutter, covering body text mid-sentence. The Selected Work role line wraps to six lines of 11px accent mono caps.

## Minor Observations

- The hero's "Four years" is the only "four" against three "five"s. Not a contradiction — sentence 2 states the arithmetic explicitly — but the skim surface leads with the smaller number and the reconciliation is below the fold.
- `section.home-philosophy` renders **zero visible text characters** on production. It is a purely decorative divider marking the 05→06 boundary and no other seam, which reads as accident rather than rhythm.
- `aria-current` is `null` on every header nav link; active state is conveyed by colour and decoration only.
- No skip-to-content link exists in `shell.ts`.
- Alignment whiplash: hero left with meta right, bio-grid left, selected-work left, stack centered over an off-center column, story left but indented 72px past every other container edge, get-in-touch fully centered. The story eyebrow sits at x=128 while its own prose starts at x=200.
- Four navigation systems coexist: sticky header, floating pill with popover minimap, right-edge bar strip, footer sitemap. The edge strip and the pill do the same job.
- The sticky header pill is `rgba(10,13,18,0.72)` with `blur(12px)`; at 72% opacity, text passing beneath is smeared rather than cleanly occluded, which is worse than either extreme.
- Two of 21 chips carry no icon — the Selected Work meta chips `ANGULAR` and `TIPTAP / PROSEMIRROR` — while the other 19 do. A small inconsistency, not the systemic failure the seed run suggested.
- Runtime `cramped-padding` on `<landing-segmented>` tabs (children flush against `border-bottom` with no inset) is genuine; the same rule on `landing-chip` is the documented exemption and should be ignored.
- Reading load on production: 916 words, 6053px at desktop, 7188px at mobile, on the surface designated for the fast skim.
- The empty state could not be exercised: blocking `**/api/**` still produced a populated page because content is server-rendered and transfer-cached. PRODUCT.md requires defined empty behaviour, so this path needs a deliberate test.
- Out of scope but genuine, found in a wider scan: `contact.scss:141` uses a raw `#fecaca`, `contact.scss:186` an 8px radius off the documented scale, and `contact.scss:159` writes `var(--landing-ink-1, #0a0a0a)` — a stale fallback, since that token is `#11151c` dark and `#f7f8fa` light.

## Questions to Consider

1. The strongest evidence on the page — a shipped library, two npm packages, a live demo, an architecture diagram — sits under a heading that calls it a personal idea. **What is the heading protecting you from, and is that protection worth the overclaim?**
2. PRODUCT.md says home serves the fast skim and `/about` the deep read. Production ships 916 words and 6053px here. **What on this page is not better placed on `/about` or `/projects`?**
3. Bilingual EN/VI is one of three positioning pillars, and the resume exists only in English. **Is the pillar a property of the system, or of the interface chrome only?**
4. The hero holds 820px and asks for nothing. **Is that restraint, or deferral?** The system has a documented solid button used zero times on its most important page.
5. Selected Work is 69.7% mono caps. **If mono is the voice that points at content, what is it pointing at when it is most of the section?**
6. Three body paragraphs are `role="button"` so a lamp can spotlight them. **What does a reader gain that they lose by not discovering it?** If nothing, it costs three false controls in the accessibility tree.
