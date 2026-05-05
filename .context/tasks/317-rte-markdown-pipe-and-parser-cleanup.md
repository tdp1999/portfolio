# Task: Landing — `MarkdownPipe` for Short Fields + Delete Custom Parsers

## Status: pending

## Goal
Replace 5 custom regex parsers with a single CommonMark-via-`marked` pipe for short Markdown fields, and delete the parsers from the runtime.

## Context
Long-form fields render via RTE (tasks 312-314). Short fields (taglines, intros, footers under ~300 chars) are CommonMark Markdown — no custom parsing. Per the locked Q8-Option-C strategy.

Source: `.context/plans/epic-portfolio-rich-text-editor.md` Phase 8.

## Acceptance Criteria
- [ ] New `MarkdownPipe` in `libs/landing/shared/util/`. Signature: `value | markdown` returns sanitized HTML string.
- [ ] Pipe pipeline: `marked.parse(value, { gfm: false })` → `DOMPurify.sanitize` with a **short-field whitelist** (subset of the rich-text whitelist: only `p, em, strong, a, br` allowed). Whitelist is a separate constant, not the rich-text one.
- [ ] Pipe is `pure: true` so the same input string is parsed once.
- [ ] Migrate every short Markdown field on landing to the pipe:
  - `Profile.tagline` (hero) — drops `taglineSplit()`
  - `Profile.stackIntro` (home-stack §5) — drops `coreStack()`
  - `Profile.contactIntro` (get-in-touch)
  - `Profile.footerTagline` (footer banner)
  - `Project.oneLiner`, `Project.description`
- [ ] Delete from runtime:
  - `taglineSplit`
  - `coreStack`
  - `parseBioLong` (already replaced in task 312 — confirm it's gone)
  - `convertObsidianMarkdown` runtime usage (kept only in the Obsidian importer — task 318)
  - `extractTitleFromMarkdown`, `extractH1Title`, `renderMarkdownPreview` (audit each — many are likely already dead post-task-318; this task is the final sweep)
- [ ] No `[innerHTML]` binding in landing without `| safeHtml` or `| markdown` (lint rule passes).
- [ ] No `bypassSecurityTrustHtml` call without preceding sanitize.

## Technical Notes
- `marked` is already in `package.json` from blog work — reuse, no new dep.
- Bold convention `**phrase**` was reserved for E5 Phase 4 task 285b (home-stack). This task formalizes it — `marked` handles it natively.
- Italic emphasis convention `*phrase*` (locked 2026-05-04 in E5 epic) is also `marked`-native.

## Files to Touch
- `libs/landing/shared/util/markdown.pipe.ts` (new)
- `libs/landing/feature-home/**/home-hero.component.{ts,html}` (drop `taglineSplit`)
- `libs/landing/feature-home/**/home-stack.component.{ts,html}` (drop `coreStack`)
- `libs/landing/feature-home/**/home-get-in-touch.component.{ts,html}`
- `libs/landing/feature-home/**/home-footer-banner.component.{ts,html}` (or wherever footerTagline renders)
- `libs/landing/feature-projects/**/project-card.component.{ts,html}` (oneLiner)
- Search-and-delete the named utility functions from `libs/landing/shared/**`

## Dependencies
- 312-rte-landing-home-intro-render
- 313-rte-landing-project-detail-render
- 314-rte-landing-blog-post-render
- 285b-home-stack (must already be using `Profile.stackIntro` so we have something to migrate)

## Complexity: M

## Progress Log
