# Task: Public /blog/:slug Detail Page

## Status: pending

## Goal
Build the public blog post detail page with centered reading layout (~720px), markdown rendering, code syntax highlighting, Table of Contents, reading progress bar, anchor links, author card, and related posts.

## Context
This is the primary reading experience — inspired by Matt Pocock's TotalTypeScript articles. Clean, centered, distraction-free. Content is markdown rendered to HTML with enhanced features (syntax highlighting, TOC, anchors). SSR is critical for SEO.

## Acceptance Criteria

**Layout:**
- [ ] Route: `/blog/:slug` in landing app
- [ ] Centered content column: max-width ~720px, text-align left, comfortable line-height
- [ ] "All Articles" back link at top
- [ ] Title (h1, centered or left-aligned, prominent)
- [ ] Author info card below title: avatar + name + short bio
- [ ] Category/tag badges + read time + publishedAt date
- [ ] Main content area: rendered markdown
- [ ] Related posts section at bottom (max 3 cards)
- [ ] Copy link button (copies current URL to clipboard)

**Markdown Rendering:**
- [ ] Install and configure markdown rendering: `marked` or `remark` + `rehype`
- [ ] Code syntax highlighting with Shiki (SSR-compatible)
  - Languages: TypeScript, JavaScript, Python, Go, SQL, CSS, HTML, Bash, JSON (minimum)
  - Theme: dark theme matching site design
- [ ] Images render responsively (max-width: 100%)
- [ ] Links open in new tab for external, same tab for internal
- [ ] Blockquotes styled with left border accent
- [ ] Tables styled if present
- [ ] Inline code has background highlight

**Table of Contents:**
- [ ] Auto-generated from h2/h3 headings in content
- [ ] Desktop: sticky sidebar on the right (outside content column)
- [ ] Mobile/narrow: collapsible section at top of article
- [ ] Highlights current section on scroll (Intersection Observer)
- [ ] Click jumps to heading with smooth scroll

**Reading Progress Bar:**
- [ ] Thin bar (3-4px) fixed at top of viewport
- [ ] Fills left to right based on scroll position relative to article content
- [ ] Accent color from design system

**Anchor Links:**
- [ ] Each h2/h3 heading gets an `id` attribute (slug from heading text)
- [ ] Hover/focus on heading reveals `#` link icon
- [ ] Click copies anchor URL to clipboard or navigates

**SEO / SSR:**
- [ ] `<title>` = `metaTitle || title + " | Phuong Tran"`
- [ ] `<meta name="description">` = `metaDescription || excerpt`
- [ ] `<meta property="og:image">` = `featuredImageUrl`
- [ ] `<meta property="og:type">` = `article`
- [ ] `<meta property="article:published_time">` = `publishedAt`
- [ ] Full content rendered server-side (not client-only)
- [ ] 404 page for invalid slugs, DRAFT, or PRIVATE posts

**Responsive:**
- [ ] Single column naturally responsive
- [ ] TOC sidebar hides on mobile, shows as collapsible top section
- [ ] Images scale to viewport width
- [ ] Code blocks scroll horizontally on narrow screens

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
