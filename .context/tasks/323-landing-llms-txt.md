# Task: Landing llms.txt (AI-readable site index)

## Status: pending

## Goal
Publish `/llms.txt` at the landing root — a curated, AI-optimized markdown index of the portfolio (bio, capabilities, projects, contact) so LLM-based assistants (ChatGPT, Claude, Perplexity, Gemini) can answer questions about Phương's work from a clean structured source instead of scraping HTML.

## Context
The `llms.txt` proposal (Jeremy Howard / Answer.AI, Sept 2024) is the emerging de-facto standard for "give LLMs a sitemap they can actually read." It is a single markdown file at site root with a tight schema: H1 title, blockquote summary, sections of links with descriptions. Adopted by Anthropic, Cloudflare, Vercel, Stripe, FastHTML.

For a portfolio dev in 2026, this is the highest-leverage AI-era SEO asset that does not yet exist on the site. When a recruiter asks Claude "show me Phương's work on document authoring," `llms.txt` is what surfaces the right project entry with the right pitch in the first answer.

Spec: https://llmstxt.org/

## Acceptance Criteria
- [ ] `apps/landing/public/llms.txt` exists, follows the llms.txt schema (H1 + blockquote summary + sectioned link lists)
- [ ] Content sections include: identity / bio (one paragraph), core capabilities (3–5 bullets), projects (one entry per `content/projects/*.md` with one-line pitch + URL), other pages (/experience, /uses, /colophon, /blog), contact
- [ ] Pitch lines are curated, not copy-pasted from existing prose — must read well as a standalone summary
- [ ] (Optional) `apps/landing/public/llms-full.txt` — concatenated full markdown of project case studies, so LLMs with larger context windows have the full text in one fetch
- [ ] Served at `/llms.txt` (and `/llms-full.txt` if shipped) — verify via curl against built dist
- [ ] Sitemap.xml does NOT need to reference llms.txt (it's a separate AI convention, not part of sitemap protocol)

## Technical Notes
- Static file copied via `apps/landing/public/**/*` asset glob (already wired by task 302).
- Content authoring is the main cost — 1–2 hours of careful curation, not engineering.
- Re-use existing project case study `## Overview` openings as inspiration, but rewrite for the standalone summary context.
- Reference implementations to study: anthropic.com/llms.txt, vercel.com/llms.txt, llmstxt.org/llms.txt.

## Files to Touch
- `apps/landing/public/llms.txt`
- `apps/landing/public/llms-full.txt` (optional)

## Dependencies
- 302 (static-file serving pipeline)

## Complexity: M

## Progress Log
