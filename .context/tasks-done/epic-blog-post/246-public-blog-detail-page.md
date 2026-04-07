# Task: Public /blog/:slug Detail Page

## Status: done

## Goal
Build the public blog post detail page with centered reading layout (~720px), markdown rendering, code syntax highlighting, Table of Contents, reading progress bar, anchor links, author card, and related posts.

## Context
This is the primary reading experience — inspired by Matt Pocock's TotalTypeScript articles. Clean, centered, distraction-free. Content is markdown rendered to HTML with enhanced features (syntax highlighting, TOC, anchors). SSR is critical for SEO.

## Acceptance Criteria

**Layout:**
- [x] Route: `/blog/:slug` in landing app
- [x] Centered content column: max-width ~720px, text-align left, comfortable line-height
- [x] "All Articles" back link at top
- [x] Title (h1, centered or left-aligned, prominent)
- [x] Author info card below title: avatar + name + short bio
- [x] Category/tag badges + read time + publishedAt date
- [x] Main content area: rendered markdown
- [x] Related posts section at bottom (max 3 cards)
- [x] Copy link button (copies current URL to clipboard)

**Markdown Rendering:**
- [x] Install and configure markdown rendering: `marked` or `remark` + `rehype`
- [x] Code syntax highlighting with Shiki (SSR-compatible)
  - Languages: TypeScript, JavaScript, Python, Go, SQL, CSS, HTML, Bash, JSON (minimum)
  - Theme: dark theme matching site design
- [x] Images render responsively (max-width: 100%)
- [x] Links open in new tab for external, same tab for internal
- [x] Blockquotes styled with left border accent
- [x] Tables styled if present
- [x] Inline code has background highlight

**Table of Contents:**
- [x] Auto-generated from h2/h3 headings in content
- [x] Desktop: sticky sidebar on the right (outside content column)
- [x] Mobile/narrow: collapsible section at top of article
- [x] Highlights current section on scroll (Intersection Observer)
- [x] Click jumps to heading with smooth scroll

**Reading Progress Bar:**
- [x] Thin bar (3-4px) fixed at top of viewport
- [x] Fills left to right based on scroll position relative to article content
- [x] Accent color from design system

**Anchor Links:**
- [x] Each h2/h3 heading gets an `id` attribute (slug from heading text)
- [x] Hover/focus on heading reveals `#` link icon
- [x] Click copies anchor URL to clipboard or navigates

**SEO / SSR:**
- [x] `<title>` = `metaTitle || title + " | Phuong Tran"`
- [x] `<meta name="description">` = `metaDescription || excerpt`
- [x] `<meta property="og:image">` = `featuredImageUrl`
- [x] `<meta property="og:type">` = `article`
- [x] `<meta property="article:published_time">` = `publishedAt`
- [x] Full content rendered server-side (not client-only)
- [x] 404 page for invalid slugs, DRAFT, or PRIVATE posts

**Responsive:**
- [x] Single column naturally responsive
- [x] TOC sidebar hides on mobile, shows as collapsible top section
- [x] Images scale to viewport width
- [x] Code blocks scroll horizontally on narrow screens

## Technical Notes
- **Shiki SSR:** Shiki can run at build/server time. For Angular SSR, run syntax highlighting in the server render pass. Client receives pre-highlighted HTML.
- **TOC generation:** Parse rendered HTML for h2/h3 elements, extract text + generate IDs. Build tree structure for nested display.
- **Scroll tracking (progress bar + TOC):** Use Intersection Observer for TOC section highlighting. Use scroll event listener (throttled) for progress bar calculation.
- **Author info:** Fetch from post detail API response (already includes author object with name, avatarUrl, shortBio)
- **Related posts:** Already included in post detail API response
- Uses `landing-*` design system (NOT Angular Material)
- Follow landing page patterns from `.context/design/landing.md`

## Files to Touch
- `apps/landing/src/app/` (blog detail route + page component)
- Landing routing (add /blog/:slug route)
- Blog detail page component + template + styles (new)
- Markdown rendering service/pipe (new)
- TOC component (new)
- Reading progress bar component (new)
- `package.json` (shiki, marked/remark dependencies)

## Dependencies
- 242-blog-post-controller-module (public API endpoints)
- 245-public-blog-list-page (shared blog service, routing setup)

## Complexity: XL
Most complex public page: markdown rendering pipeline (remark + shiki), TOC with scroll tracking, progress bar, anchor links, author card, related posts, full SSR. Multiple interactive features that need to work together.

## Progress Log
- 2026-04-07 Done — installed `marked` + `shiki`. Added `MarkdownService` (marked + shiki `github-dark`, h2/h3 anchor IDs, external link target=_blank, lazy images). Built `BlogDetailPage` with reading-progress bar, sticky TOC sidebar (Intersection Observer), author card, related posts, copy-link, full SSR meta tags (title/description/og:*/article:published_time), 404 fallback for missing/draft slugs. Wired `/blog/:slug` route.
