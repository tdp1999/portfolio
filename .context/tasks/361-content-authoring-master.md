# Task: Content authoring — master checklist (all surfaces, EN + VI, small → large)

## Status: in-progress

## Goal

Single source of truth for every piece of human-authored content. Author writes one item at a time; this file tracks WORDS, not code. Sub-tasks (340/341/328/323) stay the detailed briefs — this sits above them as the index.

## Where content lives (IMPORTANT)

- **PROD is the source of truth.** All real content is authored on prod (via Console / prod files). The **local DB seed is demo/throwaway** — do NOT treat local seed content as "done". A `[draft]` tag below only means "a starting draft exists in seed to crib from", not that the surface is finished.
- **Canonical home:** once a piece is finalized (in the author's own voice), record it into `plans/epic-portfolio-e0-author-databank.md` as the canonical "databank chính chủ", then ship to prod.

## Authoring workflow

Two modes per item:

1. **Solo** — author writes directly on prod.
2. **Assisted** — author hands a draft + relevant E0 context to Claude → Claude edits wording/grammar, advises on structure/voice (**author keeps final decision**) → finalized text goes into E0 databank → author publishes on prod.

Claude maintains this checklist: when the author reports an item done, Claude ticks the box (EN and/or VI) and logs it.

## Claude's role (collaboration contract)

When working content sessions on this task, Claude acts as:

1. **Editor / proofreader** — refine, dedupe, fix spelling & grammar, proofread, and improve the wording the author writes. Preserve the author's voice (E0 §8); do not over-polish into AI-generic.
2. **Task operator / progress tracker** — help operate the checklist: tick boxes, mark items done, keep the Progress Log current, surface what's next.
3. **Critical second opinion** — stand outside the author's head as a recruiter / landing-page visitor / skeptical reader and push back on claims. Provide critical thinking and a second opinion so the author avoids one-sided thinking, over-claiming ("tự cao"), or under-selling ("tự ti"). Author keeps final decision.
4. **Locator / general guide** — find where each piece of content lives (component, template, DB field, file path) and give general how-to guidance for editing it.

### Per-item analysis frame

Author treats every field as deliberate, not filler. For each item, before/while drafting, work through:

1. **Purpose** — what job does this field do for the reader (which audience, what moment in their read, what action it should provoke)?
2. **How to write it** — register, length, structure that fits that purpose and the E0/E1 voice.
3. **What to include** — the specific information/ideas that belong in it (and what to leave out).

## Voice source

Write from E0 (`plans/epic-portfolio-e0-author-databank.md`) — identity, timeline, artifacts, **§8 voice samples**. Positioning/audience locked in E1.

## Status legend

`[blank]` no words anywhere · `[draft]` starting draft exists in seed · `[in-code]` string locked in a component/template, needs final wording (decide: keep-in-code vs move to DB).
Each prose item carries two checkboxes: **EN** and **VI**. Language-neutral items (tokens, alt text) marked `(neutral)` — one box.

---

## Tier 0 — Micro (token → one line)

- EN [x] · VI [x] — About CTA (/about §04 Next steps heading+lede) · **DONE 2026-06-13**, canonical in E0 §16 (`Profile.ctaHeading`/`ctaLede`) (T340)
- [x] (neutral) — **Skill taxonomy**: 21 leaves under 6 umbrellas + tier/category/isLibrary. **DONE 2026-06-27** — all 21 leaves entered on prod via Console (`/skills`); built drag-drop reorder tool to make displayOrder manageable. Canonical in E0 §16. Downstream content lives in *separate* items below: React→/now; capabilities + Angular-native features (Signals, SSR)→`stackIntro` prose; AI=one "Claude Code" chip.
- EN [] · VI [] — `Skill.proficiencyNote` × N ("why default-reach", 1 line). **DEFERRED**: only surface was the depth-map, which is now hidden; home stack chips don't render it. Revisit when a surface consumes it. · `[draft]` (T340)
- EN [] · VI [] — Footer link labels (5 pages) — E2 §7 · `[draft]`
- [x] (neutral) — `Profile.coreStack`: 3 hero chips · **LOCKED 2026-06-27 `ANGULAR / TYPESCRIPT / NESTJS`, canonical in E0 §16, on prod (2026-06-28).** Differentiation deferred to `stackIntro`/tagline/case studies; SSR/Tiptap/SCSS dropped from hero.
- EN [x] · VI [x] — `Profile.footerTagline`: one-line footer sign-off (brand block, not a CTA). **DONE 2026-06-28, canonical in E0 §16, on prod.** Deadpan thanks; "say hi" invitation earmarked for Get-in-touch instead.
- EN [] · VI [] — `Skill.description` × 16 (optional; skip unless wanted) · `[blank]`
- EN [] · VI [] — PWA manifest `name` / `short_name` / `description` (T324) · `[blank]`
- EN [] · VI [] — 404 / not-found page copy (`pages/not-found/`) · `[in-code]`

## Tier 1 — Short prose (1–3 sentences)

- EN [x] · VI [x] — `Profile.selectedWorkIntro`: §03 heading + deck (sentence 1 = generic noun heading, rest = deck). **DONE 2026-06-28, canonical in E0 §16, on prod.** Personal-projects lens in deck; heading soft-noun ("Passion projects" / "Những điều ấp ủ").
- EN [] · VI [] — `Profile.contactIntro`: intro for /contact hero · `[blank]`
- EN [] · VI [] — About hero H1: one sentence ≤18 words (who–does what–for whom) · `[draft: aboutHeading]` (T340)
- EN [] · VI [] — About hero sub-paragraph: 2–3 sentences (~30–50 words) · `[draft: aboutLede]` (T340)
- EN [x] · VI [x] — Home Get-in-touch copy + 3 CTA labels (Hire/Freelance/Hi) · **DONE 2026-07-04, in-code** (`home.get-in-touch.{ts,html,scss}`, uncommitted). Heading→`landing-section-header` (emphasis "talk"); copy gánh vai (a)+(b) mở-cửa+kỳ-vọng-phản-hồi (location + danh sách việc **đẩy sang `contactIntro`**); freelance CTA thêm "or contract". **Decisions (author, 2026-07-04):** (1) giữ in-code tạm thời, chưa move DB; (2) "say hi" earmark — author quyết sau; (3) dedup với `contactIntro` — author quyết sau. · **Earmark (treo):** *"You scrolled this far? Might as well say hi."* / *"Dù gì cũng đã scroll tới đây rồi..."* — section đã có CTA quiet "Or just say hi", chờ author hòa lại.
- EN [] · VI [] — Home Bio-card bridge: 2–3 sentences hero ↔ gallery (E2 §6) · `[draft]`
- EN [x] · VI [x] — `Profile.tagline`: hero sub-line (sentence 1 = positioning claim, sentence 2 italic = proof). **DONE 2026-06-28, canonical in E0 §16, on prod.** Plain-prose now; re-mark when RTE Phase 8 / task 317 lands (`taglineSplit` → `MarkdownPipe`).
- EN [x] · VI [x] — `Profile.stackIntro`: §5 prose (3 ¶: Angular depth → architecture/NestJS → AI differentiator). **DONE 2026-06-27, canonical in E0 §16, on prod.** Voice-led, not a tool list (grid carries tools).
- EN [] · VI [] — Contact page microcopy (~40 strings: hero "Let's talk", form labels, success, globe caption) · `[in-code]` `apps/landing/src/app/pages/contact/contact.{ts,html}`

## Tier 2 — Medium (paragraph / multi-item)

- EN [] · VI [] — Home 90s story arc: ~450 words; **flagged "too literary", rewrite** (E2 line 104) · `[draft, rewrite]`
- EN [] · VI [] — About manifesto: 5–7 principles (bold claim + 2–3 sentence expansion) · `[draft ×5]` (T340)
- EN [] · VI [] — About failures: 3 essays ~150 words (context→decision→consequence→lesson) · `[draft ×3]` (T340)
- EN [] · VI [] — Experience highlights audit: rewrite verb-scope-metric, 3 roles · `[draft]` (T340)
- EN [] · VI [] — `/now`: ~300–500 words, Derek-Sivers snapshot, monthly refresh · `[blank]` (T328, needs re-spec markdown→console)
- EN [] · VI [] — `/uses`: gear/tools (hardware, editor, AI tools) · `[blank]`
- EN [] · VI [] — `/colophon`: "how this site was made" · `[blank]` (deferred, E2 line 324)
- EN [] · VI [] — Privacy Policy (`pages/legal/privacy.html`) · `[in-code]`
- EN [] · VI [] — Terms (`pages/legal/terms.html`) · `[in-code]`
- EN [] · VI [] — Contact email templates: auto-reply to sender + notification (`ddl/email-templates/`) · `[draft]`
- EN [] — `llms.txt`: summary + bio + per-project pitch + section links (English-only by spec) · `[blank]` (T323)

## Tier 3 — Long-form

- EN [] · VI [] — Project case studies, 5 missing `.md`: `permissions-console`, `block-editor`, `loan-ops-dashboard`, `design-bank`, `contract-compare` · `[blank]`
- EN [] · VI [] — Project case studies, 3 existing (`document-engine`, `console-mvp`, `tdp-plugins`), review voice · `[draft]`
- EN [] · VI [] — Blog posts: 13 in seed are scaffold/AI — replace with author's own (or treat as drafts to rewrite) · `[draft]`
- EN [] · VI [] — Blog posts: new, ongoing via Console RTE · `[blank]`
- EN [] · VI [] — CV / resume content (if downloadable CV is in scope per E1 channel map) · `[blank]`

## Cross-cutting (per-surface, easy to forget)

- EN [] · VI [] — Per-page SEO meta (metaTitle / metaDescription / OG) for projects, about, contact, blog, /now, /uses — beyond Profile home meta · `[blank]`
- [] (neutral) — Image alt text for media (avatar, OG, project gallery) — a11y + content · `[blank]`

## Dependencies (technical gates)

- Long-form with multi-block content (images + lightbox) in case studies / blog: gated on RTE epic (`rte-*` libs, 305–319) + Prose Block Renderer (`redoc-blocks`).

## Related

- `tasks/340-about-content-authoring.md` · `tasks/341-about-bilingual-vi-translation.md` · `tasks/328-landing-now-page.md` · `tasks/323-landing-llms-txt.md` · `tasks/324-landing-pwa-manifest-and-icons.md`
- `plans/epic-portfolio-e2-content-scaffolding.md` · `plans/epic-portfolio-about.md` · `plans/epic-portfolio-e0-author-databank.md`

## Progress Log

- 2026-07-04: **Home Get-in-touch (§06) DONE → in-code** (EN+VI, chưa commit, chưa publish — strings sống trong component, không phải Profile DB). Gồm: (1) **heading** swap `landing-eyebrow`+`landing-heading` → một `landing-section-header` với emphasis `Let's <em>talk</em>.` (đồng bộ emphasis với §03–§07; heading to lên `lg`/display-xl, mất hairline trailingRule). (2) **3 CTA labels** — hire "Bàn bạc về một vị trí fulltime"; freelance "Nói về một dự án freelance" / EN thêm "or contract" (part-time→contract: từ chuẩn ngành cho việc không-full-time, EN/VI để lệch có chủ ý); hi "Hoặc chỉ muốn chào mình một tiếng". VI rút gọn bỏ "với mình/cho mình". (3) **copy** — bỏ câu cũ (trùng CTA + trùng contactIntro sắp viết); vai mới = (a) kỳ-vọng-phản-hồi + (b) hạ-áp-lực/mở-cửa. EN "Whatever the reason, the door's open." + xuống dòng + "I read every message and usually reply within a few days." (`white-space: pre-line` trên `__copy`; VI 1 dòng nên không ảnh hưởng) / VI "Nhắn tin cho mình nha, mình đọc hết và thường phản hồi trong vài ngày." **Insight:** VI dịch 1-1 lời mời chủ động ("cứ nhắn mình") nghe *desperate* (ngóng); EN "door's open" là trạng thái/chủ-nhà nên không. Author chốt bản VI đơn giản có particle "nha" (giọng riêng). (4) **fallback** VI chuyển câu hỏi→câu trần "Dùng email client của bạn:" (EN giữ câu hỏi). **Phân vai chốt:** location + danh sách việc dồn hết sang `contactIntro` → §06 hết trùng. type-check sạch. Next: `Profile.contactIntro` (gánh availability + location).
- 2026-06-28: **`footerTagline` DONE → on prod** (EN+VI canonical in E0 §16). Site-wide footer brand-block sign-off. Key insight (author, page-level thinking): footer brand block has **no adjacent contact action**, so an invitation-CTA ("say hi") dead-ends → footer line must be a **passive thank-you**, not a CTA. Rejected location signature ("in Saigon") + maker's-mark ("built by hand"); landed on deadpan opener + sincere thanks ("Genuinely / Thật lòng" saves it from generic "thanks for visiting"). **New standing rule captured:** never use em-dash (—) in suggested content — it's an AI tell, and restructure the sentence rather than swap punctuation (saved as feedback memory). "say hi" invitation earmarked → Get-in-touch. Watch overlap with /about §04 when authoring /about. Next: Home Get-in-touch (uses the earmark) or `Profile.contactIntro`.
- 2026-06-28: **`selectedWorkIntro` DONE → on prod** (EN+VI canonical in E0 §16). §03 Selected Work, splits sentence1→heading / rest→deck (same engine as tagline). Gate: section shows **personal projects only** (author-confirmed) → "personal" lens honest. House rule surfaced: section heading = **generic noun summarizing the section** (cf. §04 "The toolkit."), NOT a claim/count — "Three projects" rejected. Heading kept *soft* ("Passion projects" / "Những điều ấp ủ") over harder "tác phẩm/sản phẩm"; rejected playful set (vọc vạch/sân chơi/pet projects) as underselling real shipped products. Personal lens carried by the **deck**, not the heading. Next: `Profile.footerTagline` or Home Get-in-touch copy (author's pick).
- 2026-06-28: **`tagline` DONE → on prod** (EN+VI canonical in E0 §16). Hero sub-line: sentence 1 = positioning claim (4 yrs fintech / SG market), sentence 2 (Newsreader italic) = proof as capability *areas* (permissions / loan flows / document processing — "the core modules"), not a padded artifact list. Key calls: "four years" = fintech career (≠ §5's "five years writing code", total) — honest, no contradiction; VI "tools"→"sản phẩm fintech" not "công cụ tài chính" (= financial instruments, mistranslation); capability framing kills the plural over-claim. Shipped plain-prose under current `taglineSplit`; **re-mark needed when RTE Phase 8 / task 317 lands** (split moves to author-controlled blank-line + `*italic*`). **Hero-stack cluster (coreStack → stackIntro → tagline) COMPLETE.** Next: `Profile.selectedWorkIntro`.
- 2026-06-27: **`stackIntro` DONE → on prod** (EN+VI canonical in E0 §16). 3 ¶ voice-led narrative (Angular journey small→large → architectural judgment bridging to NestJS, frontend-first → AI differentiator: built own workflow/harness, "this site shipped with it"). Key frame: prose = narrative+judgment, NOT a tool list (the §5 chip-grid carries tools). VI authored first → EN built spirit-not-literal. "harness" kept (author-confirmed; E0 §6.3 noted). Next in hero-stack cluster: `tagline`.
- 2026-06-27: **`coreStack` LOCKED → `ANGULAR / TYPESCRIPT / NESTJS`** (E0 §16). Frame: hero chip = 3-sec positioning keyword, not a dependency graph (explicit>implied). Chips place category honestly; differentiation lives in tagline/stackIntro/case studies. Dropped SSR (honesty — author not strong), Tiptap (needs context→§5), SCSS (supporting), Git/JS (generic). Angular-first keeps frontend-first read; Nx held as reserve 4th. Next: `stackIntro`. Pending prod entry.
- 2026-06-27: **Tier 0 #2 (skill taxonomy) CLOSED.** All 21 leaves entered on prod via Console; reorder tool made the displayOrder entry manageable. Tier 0 #2 ticked done.
- 2026-06-27: Reorder tool — author **feedback + bug-fix round** completed after the initial build (`52688ce`, Jun 14). Bugs surfaced during real prod data entry were fixed and verified working on prod. _(Specifics to be filled in by author if needed.)_
- 2026-06-13: Built console **skill reorder** tool (drag-drop, grouped by tier) to fix displayOrder pain. New `PATCH /skills/reorder` (mirrors Experience reorder) + `/skills/reorder` route + `skill.reorder` component (CDK drag-drop, within-tier only, optimistic). displayOrder now per-tier (0-based index within tier). Both API + console builds clean. Follow-ups (optional): handler unit test; sort skills LIST by (tier, displayOrder); cross-tier drag = change tier (v2).
- 2026-06-13: Item #2 (skill taxonomy) locked → E0 §16. 23 leaves/6 umbrellas, chips=tools-only, dropped capabilities+PM tools+Adobe XD, React→/now, AI=one Claude Code chip. proficiencyNote deferred (no live surface). Pending prod Console entry.
- 2026-06-13: Item #1 (Tier 0 — About §04 CTA heading+lede) locked EN+VI → E0 §16. Added per-item analysis frame to collaboration contract.
- 2026-06-13: Recorded Claude's collaboration contract (editor/proofreader · task operator · critical second opinion · locator/guide). Confirmed CV content already synthesized into E0 §3/§4/§13 (raw PDF not in repo).
- 2026-06-07: Created as master index (task 361). Prod = source of truth; local seed throwaway. Workflow: solo or assisted→finalize into E0. Full EN+VI tracking. Added missed surfaces: legal (privacy/terms), 404, email templates, PWA strings, per-page SEO meta, alt text, CV.
