# Epic: Blog Post Module

## Summary

Build a complete Blog Post module — a personal publishing platform for articles on any topic (tech, economics, society, finance, personal writing). Full vertical slice: Prisma schema with PostStatus (4 states: Draft, Published, Private, Unlisted), PostCategory and PostTag junction tables, markdown content storage, domain entity with soft delete, public + admin API endpoints, console editor page with ProseMirror-based rich text editing and markdown import, public `/blog` list page and `/blog/:slug` detail page (centered ~720px single-column reading layout, inspired by Matt Pocock's TotalTypeScript articles). Landing page integration deferred to a separate epic.

## Why

- **Personal publishing platform** — not just tech writing; economics, society, finance, anything worth sharing
- **SEO** — each post gets its own indexable URL at `/blog/:slug`, driving organic traffic
- **Professional brand** — demonstrates thought leadership and communication skills to recruiters
- **Markdown-first workflow** — write in Obsidian, import to system, publish from console
- **Admin control** — manage content lifecycle (draft → published/unlisted/private) without touching code
- **Reading experience** — clean, centered layout that makes articles a pleasure to read

## Target Users

- **Admin (site owner):** Write, edit, and manage blog posts via console editor
- **Visitors/Recruiters:** Read articles on `/blog` and `/blog/:slug`
- **Search engines:** Index individual post pages with auto-generated meta tags

## Scope

### In Scope

**Backend (API):**

- BlogPost Prisma schema (~20 fields, language-per-record approach)
- New `PostStatus` enum: DRAFT, PUBLISHED, PRIVATE, UNLISTED (separate from ContentStatus)
- PostCategory junction table (M2M with Category)
- PostTag junction table (M2M with Tag)
- Featured image (FK → Media)
- BlogPost domain entity with soft delete, slug generation from title
- BlogPost repository (port/adapter) with filtering (status, category, tag, featured, soft-delete)
- CQRS commands: CreatePost, UpdatePost, DeletePost (soft), RestorePost
- CQRS queries: ListPosts (admin, paginated), GetPostById, GetPostBySlug, ListPublicPosts (paginated, filterable), ListFeaturedPosts
- Markdown import endpoint: accept .md file + images, parse, upload images to Media, return structured content
- Public endpoints (no auth): `GET /blog`, `GET /blog/featured`, `GET /blog/:slug`
- Admin endpoints (JWT + ADMIN): full CRUD + restore + import
- `readTimeMinutes` auto-calculated on save (word count / 200)
- `publishedAt` auto-set on first transition to PUBLISHED
- Slug auto-gen + collision handling (-2, -3)
- SEO metadata (metaTitle, metaDescription) — manual override, auto-generate fallback from title + excerpt
- Zod validation for all fields

**Frontend (Console) — Editor Page:**

- ProseMirror-based rich text editor (owner has existing ProseMirror experience)
  - Basic formatting: headings (h2-h4), bold, italic, strikethrough, blockquote, horizontal rule
  - Lists: ordered, unordered
  - Code: inline code, fenced code blocks with language selector
  - Links: internal (to other posts/projects) + external, with URL input dialog
  - Images: inline via Media module (upload new + pick from gallery)
- Live preview (side-by-side or toggle mode)
- "Import from Markdown" button: upload .md file → parse → upload embedded images → load into editor
- Metadata panel: title, slug (auto/manual), language selector, excerpt (auto-generate or manual)
- Category multi-select (from existing Category data)
- Tag multi-select (from existing Tag data)
- Featured image picker (from Media module)
- Status management: Draft / Published / Private / Unlisted
- Featured toggle
- Full-page layout (not dialog — editor needs breathing room)

**Frontend (Console) — Post List Page:**

- Angular Material table: title, status badge, language, category, publishedAt, readTime, actions
- Search by title
- Status filter tabs: All | Published | Draft | Unlisted | Private
- Trash tab (restore / permanent delete)

**Frontend (Public — `/blog` and `/blog/:slug`):**

- `/blog` list page:
  - Post cards: title, excerpt, featured image, category, read time, publishedAt
  - Pagination (cursor or offset)
  - Filter by category and/or tag (query params)
- `/blog/:slug` detail page (Matt Pocock-inspired layout):
  - Centered content column (~720px max-width, text-left)
  - Author info card (avatar + name + short bio from Profile)
  - Markdown → HTML rendering with:
    - Code syntax highlighting (Shiki for SSR)
    - Auto-generated Table of Contents from headings (sticky sidebar on desktop, collapsible on mobile)
    - Anchor links on headings (hover → show # link for sharing)
    - Reading progress bar (thin bar at viewport top)
  - Related posts section (same category/tag, max 3)
  - Copy link button
  - Estimated read time display
  - SSR with meta tags (title, description, og:image)
  - 404 for invalid slugs
  - Mobile responsive (single column naturally)

**E2E Tests:**

- API: admin CRUD lifecycle, public read endpoints, slug uniqueness, status filtering, markdown import
- Console: create/edit/delete post, editor formatting, markdown import, category/tag assignment
- Public: list page renders, detail page renders with all sections, filtering works

### Out of Scope

- Comments system (Disqus/Giscus — future)
- Newsletter/subscribe
- Like/bookmark/reactions
- RSS feed (post-launch nice-to-have)
- Obsidian folder sync / CLI tool (separate Phase 2 epic)
- Notion/Word/Google Docs integration
- Full-text search (future)
- Series/collection grouping (use Category for now)
- Landing page integration (separate epic)
- Rich embeds (YouTube, Twitter, CodePen — future enhancement)
- Drag-and-drop image reordering in editor
- Multi-author support (single admin)
- Scheduled publishing (future — save with future publishedAt)

## High-Level Requirements

### 1. Blog Post Data Model

```prisma
enum PostStatus {
  DRAFT
  PUBLISHED
  PRIVATE
  UNLISTED
}

model BlogPost {
  id               String      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  slug             String      @unique @db.VarChar(200)
  language         Language    @default(EN)

  // Content
  title            String      @db.VarChar(300)
  excerpt          String?     @db.VarChar(500)
  content          String      @db.Text            // Markdown
  readTimeMinutes  Int?

  // Status & Display
  status           PostStatus  @default(DRAFT)
  featured         Boolean     @default(false)
  publishedAt      DateTime?

  // SEO
  metaTitle        String?     @db.VarChar(200)
  metaDescription  String?     @db.VarChar(500)

  // Relations
  authorId         String      @db.Uuid
  featuredImageId  String?     @db.Uuid

  // Audit
  createdAt        DateTime    @default(now())
  updatedAt        DateTime    @updatedAt
  createdById      String      @db.Uuid
  updatedById      String      @db.Uuid
  deletedAt        DateTime?
  deletedById      String?     @db.Uuid

  // Relation definitions
  author           User        @relation("PostAuthor", fields: [authorId], references: [id])
  featuredImage    Media?      @relation("PostFeaturedImage", fields: [featuredImageId], references: [id])
  createdBy        User        @relation("PostCreatedBy", fields: [createdById], references: [id])
  updatedBy        User        @relation("PostUpdatedBy", fields: [updatedById], references: [id])
  deletedBy        User?       @relation("PostDeletedBy", fields: [deletedById], references: [id])
  categories       PostCategory[]
  tags             PostTag[]

  @@index([status, deletedAt])
  @@index([featured, status, deletedAt])
  @@index([language, status, deletedAt])
  @@index([publishedAt])
  @@map("blog_posts")
}

model PostCategory {
  postId     String   @db.Uuid
  categoryId String   @db.Uuid

  post       BlogPost @relation(fields: [postId], references: [id], onDelete: Cascade)
  category   Category @relation(fields: [categoryId], references: [id])

  @@id([postId, categoryId])
  @@map("post_categories")
}

model PostTag {
  postId String   @db.Uuid
  tagId  String   @db.Uuid

  post   BlogPost @relation(fields: [postId], references: [id], onDelete: Cascade)
  tag    Tag      @relation(fields: [tagId], references: [id])

  @@id([postId, tagId])
  @@map("post_tags")
}
```

**Key decisions:**

- **PostStatus vs ContentStatus:** New `PostStatus` enum with 4 states. `ContentStatus` (DRAFT/PUBLISHED) stays for Project. Different domain concepts — posts need Private and Unlisted visibility.
- **Language-per-record (not TranslatableJSON):** A Vietnamese economics article is NOT a "translation" of an English article — it's entirely different content. Each post exists in one language with its own slug. If the same article is written in both languages, they are separate records.
- **Markdown storage:** Content stored as markdown text. Reasons: native Obsidian import, ProseMirror can edit via prosemirror-markdown, portable, searchable, not locked to editor JSON format. Public pages render markdown → HTML.
- **authorId vs createdById:** `authorId` is the displayed author (always the site owner for now, but semantically distinct). `createdById` is the audit trail — who performed the action.

### 2. API Endpoints

```
// Public (no auth)
GET    /blog                         # List published posts (paginated, filterable by category/tag)
GET    /blog/featured                # List featured+published posts
GET    /blog/:slug                   # Single post by slug (published/unlisted only)

// Admin (JWT + ADMIN)
GET    /admin/blog                   # List all (paginated, includes drafts/private/deleted)
GET    /admin/blog/:id               # Single by ID
POST   /admin/blog                   # Create post
PUT    /admin/blog/:id               # Update post
DELETE /admin/blog/:id               # Soft delete
POST   /admin/blog/:id/restore       # Restore soft-deleted
POST   /admin/blog/import-markdown   # Import .md file → create draft
```

**Public post list response:**
```typescript
{
  data: {
    slug: string;
    title: string;
    excerpt: string | null;
    language: Language;
    featuredImageUrl: string | null;
    categories: { name: string; slug: string }[];
    tags: { name: string; slug: string }[];
    readTimeMinutes: number | null;
    publishedAt: string;
  }[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}
```

**Public post detail response:**
```typescript
{
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;                    // Markdown (rendered to HTML on client/SSR)
  language: Language;
  readTimeMinutes: number | null;
  publishedAt: string;
  metaTitle: string | null;
  metaDescription: string | null;
  featuredImageUrl: string | null;
  author: {
    name: string;
    avatarUrl: string | null;
    shortBio: string | null;          // From Profile, if available
  };
  categories: { name: string; slug: string }[];
  tags: { name: string; slug: string }[];
  relatedPosts: {
    slug: string;
    title: string;
    excerpt: string | null;
    featuredImageUrl: string | null;
    readTimeMinutes: number | null;
    publishedAt: string;
  }[];
}
```

### 3. Console Editor Page

Full-page editor layout (not dialog):

```
┌────────────────────────────────────────────────────────────────┐
│  ← Back to Posts    [Import Markdown]    [Preview] [Save] [▾] │  ← Top bar
├──────────────────────────────┬─────────────────────────────────┤
│                              │  Title: ___________________     │
│                              │  Slug:  ___________________ 🔗  │
│                              │  Language: [EN ▾]               │
│      ProseMirror Editor      │  Status: [Draft ▾]             │
│                              │  Featured: [ ]                  │
│      (main content area)     │  ─────────────                  │
│                              │  Featured Image: [Pick]         │
│      - headings              │  Categories: [Select...]        │
│      - bold, italic          │  Tags: [Select...]              │
│      - code blocks           │  ─────────────                  │
│      - images                │  Excerpt:                       │
│      - links                 │  [Auto-generate | Manual]       │
│      - blockquotes           │  ___________________________    │
│      - lists                 │  ─────────────                  │
│                              │  SEO:                           │
│                              │  Meta title: _______________    │
│                              │  Meta desc:  _______________    │
│                              │  ─────────────                  │
│                              │  Read time: ~5 min (auto)       │
│                              │  Published: —                   │
└──────────────────────────────┴─────────────────────────────────┘
```

**Preview mode:** Toggle replaces editor with rendered HTML preview (same ~720px centered layout as public page). Or side-by-side on wide screens.

### 4. Post List Page

```
┌────────────────────────────────────────────────────────────────┐
│  Blog Posts                                    [+ New Post]    │
├────────────────────────────────────────────────────────────────┤
│  [All] [Published] [Draft] [Unlisted] [Private] [Trash]       │
│  Search: [________________]                                    │
├────────────────────────────────────────────────────────────────┤
│  Title            │ Status    │ Lang │ Category │ Date  │ Acts │
│  My TS Article    │ Published │ EN   │ Tech     │ Mar 31│ ✏️🗑 │
│  Kinh tế 2026     │ Draft     │ VI   │ Finance  │ Mar 30│ ✏️🗑 │
│  Hidden thoughts  │ Private   │ EN   │ Personal │ Mar 28│ ✏️🗑 │
└────────────────────────────────────────────────────────────────┘
```

### 5. Public Pages

**`/blog` — List page:**

```
┌──────────────────────────────────────────────────┐
│                    Blog                           │
│            Thoughts on tech and beyond            │
│                                                   │
│  [All] [Tech] [Economics] [Finance] [Personal]   │  ← Category filter
├──────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────┐    │
│  │  [Featured Image]                         │    │
│  │  Tech · 5 min read                        │    │
│  │  My Advice for Security-Critical TS Apps  │    │
│  │  A brief excerpt of the article...        │    │
│  │  Mar 31, 2026                             │    │
│  └──────────────────────────────────────────┘    │
│                                                   │
│  ┌──────────────────────────────────────────┐    │
│  │  Economics · 3 min read                   │    │
│  │  Suy nghĩ về kinh tế 2026                 │    │
│  │  Một đoạn trích ngắn...                   │    │
│  │  Mar 30, 2026                             │    │
│  └──────────────────────────────────────────┘    │
│                                                   │
│              [Load More / Pagination]             │
└──────────────────────────────────────────────────┘
```

**`/blog/:slug` — Detail page (Matt Pocock style):**

```
┌──────────────────────────────────────────────────────────┐
│                         ← All Articles                    │
│                                                           │
│        My Advice for Security-Critical TS Apps            │  ← h1, centered
│                                                           │
│              [Avatar] Phuong Tran                          │  ← Author card
│              Full-stack developer                          │
│                                                           │
│  ┌─────────────────── ~720px ──────────────────────┐     │
│  │                                                   │     │
│  │  Article content rendered from markdown...         │     │
│  │                                                   │     │
│  │  ## Heading 2                              [#]    │     │  ← Anchor link
│  │                                                   │     │
│  │  Paragraph text here. **Bold** and *italic*.      │     │
│  │                                                   │     │
│  │  ```typescript                                    │     │  ← Syntax highlighted
│  │  const x: string = 'hello';                       │     │
│  │  ```                                              │     │
│  │                                                   │     │
│  │  [Inline image from Media]                        │     │
│  │                                                   │     │
│  │  > Blockquote with important note                 │     │
│  │                                                   │     │
│  └───────────────────────────────────────────────────┘     │
│                                                           │
│  ─── Related Articles ───                                 │
│  [Card 1]  [Card 2]  [Card 3]                            │
│                                                           │
│  [Copy Link]                    Tech · 5 min · Mar 2026  │
└──────────────────────────────────────────────────────────┘
│████████████████░░░░░░░░░░░░░░░│  ← Reading progress bar (top, fixed)
```

**Table of Contents (desktop):**
- Sticky sidebar on the right (outside the ~720px content column)
- Auto-generated from h2/h3 headings
- Highlights current section on scroll
- Collapses to top-of-article on mobile/narrow screens

### 6. Markdown Import Flow

```
User clicks "Import Markdown" →
  1. File picker dialog (accept .md + optional image folder / .zip)
  2. Client reads .md file content
  3. Client extracts image references:
     - Standard: ![alt](./images/photo.png)
     - Obsidian: ![[photo.png]]
  4. Client uploads each referenced image to Media module (Cloudinary)
  5. Client replaces local paths with Cloudinary URLs in markdown
  6. Client converts Obsidian-specific syntax:
     - ![[image]] → ![](cloudinary-url)
     - [[Internal Link]] → stripped or converted to plain text
     - ==highlight== → <mark>highlight</mark>
     - > [!note] callouts → standard blockquote
  7. Parsed markdown loaded into ProseMirror editor
  8. Metadata pre-filled: title from first h1 (if present), slug auto-generated
  9. Status: DRAFT (always)
  10. User reviews, adds category/tags/featured image, then saves
```

**Alternative approach:** If image folder is not provided, images with relative paths are flagged as broken — user can manually upload and fix in editor.

### 7. ProseMirror Editor Features

| Feature | Implementation |
|---|---|
| Headings (h2-h4) | prosemirror-schema-basic + input rules (## → h2) |
| Bold / Italic / Strikethrough | prosemirror-schema-basic + keyboard shortcuts |
| Links | Custom menu button → URL input dialog, internal link autocomplete |
| Blockquote | prosemirror-schema-basic + input rule (> ) |
| Code (inline) | prosemirror-schema-basic + backtick input rule |
| Code block (fenced) | Custom node with language selector dropdown |
| Ordered / Unordered lists | prosemirror-schema-list |
| Horizontal rule | Input rule (---) |
| Images | Custom node → Media picker dialog (upload or select from gallery) |
| Markdown input rules | prosemirror-markdown for seamless markdown-style typing |

**Toolbar:** Floating or fixed top — formatting buttons, link, image, code block. Minimal, not cluttered.

**Serialization:** Editor ↔ Markdown via prosemirror-markdown. Content stored as markdown string in DB.

## Technical Considerations

### Architecture

Follows established module pattern (same as Category, Skill, Media, Project):

```
modules/blog-post/
├── application/
│   ├── commands/
│   │   ├── create-post.handler.ts
│   │   ├── update-post.handler.ts
│   │   ├── delete-post.handler.ts
│   │   ├── restore-post.handler.ts
│   │   └── import-markdown.handler.ts
│   ├── queries/
│   │   ├── list-posts.handler.ts              # Admin (paginated, all statuses)
│   │   ├── get-post-by-id.handler.ts          # Admin
│   │   ├── get-post-by-slug.handler.ts        # Public (published + unlisted)
│   │   ├── list-public-posts.handler.ts       # Public (published only, paginated)
│   │   └── list-featured-posts.handler.ts     # Public
│   ├── ports/
│   │   └── blog-post.repository.port.ts
│   ├── blog-post.dto.ts
│   ├── blog-post.presenter.ts
│   └── blog-post.token.ts
├── domain/
│   ├── entities/
│   │   └── blog-post.entity.ts
│   ├── blog-post.error.ts
│   └── blog-post.types.ts
├── infrastructure/
│   ├── mapper/
│   │   └── blog-post.mapper.ts
│   └── repositories/
│       └── blog-post.repository.ts
├── presentation/
│   └── blog-post.controller.ts
├── blog-post.module.ts
└── index.ts
```

### Dependencies

- **Existing modules:** `CategoryModule` (M2M), `TagModule` (M2M), `MediaModule` (featured image + inline images), `UserModule` (author), `AuthModule` (admin guard)
- **From Profile epic (if done):** Author info for public detail page (name, avatar, shortBio). If Profile not done yet, use User name as fallback.
- **New packages:**
  - `prosemirror-*` suite (view, state, model, schema-basic, schema-list, commands, keymap, history, markdown, inputrules) — for console editor
  - `shiki` — SSR-compatible code syntax highlighting for public pages
  - `marked` or `remark` + `rehype` — markdown → HTML rendering for public pages
- **Enums:** New `PostStatus` enum. `Language` already exists.

### Key Patterns

**Slug generation:** From `title`. Auto-generated on create, regenerated on title change. Unique constraint at DB level. Collision handling: append `-2`, `-3`.

**Read time calculation:** On save, count words in markdown content, divide by 200 (average reading speed). Round up. Store as `readTimeMinutes`.

**publishedAt auto-set:** When `status` transitions to `PUBLISHED` for the first time, set `publishedAt = now()`. Subsequent status changes don't modify `publishedAt`. Manual override allowed via admin endpoint.

**Status visibility rules (from domain.md):**
- DRAFT → only visible to admin in console
- PUBLISHED → visible in public blog listing and by direct link
- PRIVATE → only accessible by admin (even with direct link)
- UNLISTED → accessible via direct link, NOT shown in public listing
- Public list endpoint: `WHERE status = 'PUBLISHED' AND deletedAt IS NULL`
- Public slug endpoint: `WHERE slug = :slug AND status IN ('PUBLISHED', 'UNLISTED') AND deletedAt IS NULL`

**Markdown rendering pipeline (public pages):**
1. Fetch markdown content from API
2. Parse with remark/unified
3. Apply plugins: syntax highlighting (shiki), heading IDs (for TOC + anchors), image optimization
4. Render to HTML
5. Extract heading tree for Table of Contents
6. SSR: full HTML rendered server-side for SEO

**Junction tables (PostCategory, PostTag):** Replace-all strategy on update — delete existing associations, insert new set, within transaction. Same pattern as ProjectSkill.

### Integration Points

- `MediaModule` — featured image FK + inline images in markdown content
- `CategoryModule` — M2M via PostCategory junction
- `TagModule` — M2M via PostTag junction
- `UserModule` — author FK + audit fields
- `AuthModule` — admin endpoints require JWT + ADMIN role
- `ProfileModule` (optional) — author info card on public detail page
- `Landing app` (future) — `GET /blog/featured` for teaser section
- `Console app` — editor page + list page

## Risks & Warnings

**ProseMirror integration complexity**

ProseMirror is powerful but low-level. Building a full editor with toolbar, image upload, link dialogs, and markdown serialization is significant FE work. Mitigation: Owner has existing ProseMirror experience and can port/adapt existing editor code. Start with basic formatting, add features incrementally.

**Markdown ↔ ProseMirror fidelity**

Not all markdown features map perfectly to ProseMirror nodes and vice versa. Some edge cases (nested lists, complex tables) may lose formatting. Mitigation: Stick to common markdown subset. Test round-trip (markdown → editor → markdown) thoroughly. Accept minor formatting normalization.

**Obsidian syntax conversion**

Obsidian extensions (`![[]]`, `==highlight==`, callouts) need custom parsing. Mitigation: Build a simple preprocessor that converts Obsidian → standard markdown before loading into editor. Unsupported syntax is stripped with a warning to the user.

**Code syntax highlighting SSR**

Shiki requires loading language grammars. Large bundle if all languages are included. Mitigation: Only load commonly used languages (TypeScript, JavaScript, Python, Go, SQL, CSS, HTML, shell). Lazy-load others on demand.

**Related posts query performance**

Finding posts with overlapping categories/tags could be slow with many posts. Mitigation: Simple query with LIMIT 3, indexed on category/tag junctions. Portfolio blog won't have thousands of posts — premature optimization not needed.

**4 status states vs 2**

More status states = more visibility logic to test. Every query must correctly handle all 4 states. Mitigation: Centralize status filtering in repository methods. Comprehensive unit tests for each status.

**Profile dependency for author card**

Public detail page shows author info (name, avatar, bio). If Profile module isn't done yet, fallback to User.name with no avatar. Mitigation: Author presenter handles both cases gracefully.

## Alternatives Considered

### Content Storage: Markdown vs ProseMirror JSON vs HTML

- **ProseMirror JSON:** Exact editor state preservation, no conversion loss
- **HTML:** Universal rendering, but editing requires HTML→ProseMirror parsing
- **Markdown (chosen):** Native Obsidian format, human-readable, portable, searchable in DB, ProseMirror can edit via prosemirror-markdown
- **Why:** User writes in Obsidian (markdown). Import flow is trivial. Content is not locked to any editor format. If ProseMirror is ever replaced, markdown content remains valid.

### Language: Per-record vs TranslatableJSON

- **TranslatableJSON** (like Project): Single record, `{ en, vi }` for text fields
- **Language-per-record (chosen):** Each post is one language. Separate records if same article exists in both languages.
- **Why:** Blog content is fundamentally different per language — a Vietnamese economics article is not a "translation" of an English one. Most posts will exist in only one language. TranslatableJSON would force empty en/vi fields for single-language posts.

### PostStatus: Extend ContentStatus vs New Enum

- **Extend ContentStatus** with PRIVATE + UNLISTED: Shared by Project and BlogPost
- **New PostStatus enum (chosen):** BlogPost-specific, 4 states
- **Why:** Project only needs DRAFT/PUBLISHED. Adding PRIVATE/UNLISTED to ContentStatus would expose unused states to Project. Different domain concepts deserve separate enums.

### Editor: Full-page vs Dialog

- **Dialog** (like Project create/edit): Consistent with other modules
- **Full-page editor (chosen):** Blog writing needs space, focus, and a comfortable editing experience
- **Why:** Writing a 2000-word article in a dialog is painful. Full-page layout with sidebar metadata panel provides proper writing environment. List page for management, full page for editing.

### Syntax Highlighting: Prism vs Shiki

- **Prism:** Client-side, lightweight, widely used
- **Shiki (chosen):** SSR-compatible, uses VS Code's TextMate grammars, more accurate highlighting
- **Why:** SSR support is critical for SEO — code blocks should be highlighted in server-rendered HTML. Shiki integrates with remark/rehype pipeline.

## Success Criteria

### Backend

- [ ] Prisma schema with BlogPost, PostCategory, PostTag models + PostStatus enum
- [ ] Domain entity with soft delete, slug generation, read time calculation
- [ ] Repository with status-aware filtering (published, unlisted, private, draft)
- [ ] Create command: atomic insert with category/tag associations
- [ ] Update command: replace-all strategy for junctions in transaction
- [ ] Delete/Restore commands with soft delete
- [ ] Import markdown command: parse .md, extract/upload images, return structured content
- [ ] Public queries respect PostStatus rules (PST-001 through PST-005)
- [ ] publishedAt auto-set on first publish
- [ ] Slug collision handling
- [ ] Related posts query (by overlapping category/tag)
- [ ] Unit tests for all commands, queries, entity, slug generation, and read time

### Frontend (Console)

- [ ] Post list page with table, search, status filter tabs, trash tab
- [ ] Full-page editor with ProseMirror (headings, bold, italic, code, lists, links, images, blockquote)
- [ ] Markdown serialization (editor ↔ markdown round-trip)
- [ ] Import Markdown: upload .md → parse → upload images → load into editor
- [ ] Live preview (toggle or side-by-side)
- [ ] Metadata sidebar: title, slug, language, status, featured, categories, tags, featured image, excerpt, SEO
- [ ] Save with success/error feedback

### Frontend (Public Pages)

- [ ] `/blog` list page with pagination and category/tag filtering
- [ ] `/blog/:slug` detail page — centered ~720px layout
- [ ] Markdown → HTML rendering with syntax highlighting (Shiki)
- [ ] Table of Contents auto-generated from headings
- [ ] Reading progress bar
- [ ] Anchor links on headings
- [ ] Author info card
- [ ] Related posts section
- [ ] Copy link button
- [ ] SSR with auto-generated meta tags (title, description, og:image)
- [ ] 404 for invalid or non-visible slugs
- [ ] Mobile responsive

### E2E

- [ ] API: admin create with categories + tags → public endpoint returns post
- [ ] API: update post → changes reflected on public endpoint
- [ ] API: soft delete → public endpoint returns 404
- [ ] API: status filtering (draft not visible, unlisted via direct link only, private not accessible)
- [ ] API: markdown import creates draft with uploaded images
- [ ] Console: full CRUD lifecycle + editor formatting
- [ ] Public: list page renders published posts with filtering
- [ ] Public: detail page renders all sections with correct data

## Estimated Complexity

**XL (Extra Large)**

**Reasoning:**
- 3 database tables (BlogPost + 2 junctions) with status-aware queries
- ProseMirror editor integration is a major FE effort (custom nodes, toolbar, markdown serialization)
- Markdown import with image extraction and upload
- Two new public pages (list + detail) with SSR
- Markdown rendering pipeline (remark + shiki + TOC extraction)
- Public detail page has multiple interactive features (progress bar, TOC, anchor links)
- 4 status states multiply testing surface

## Specialized Skills

- **prisma-migrate** — Prisma migration for BlogPost + junction tables
- **be-test** — BE unit/integration test writer (analyze logic → plan → write → validate) → tasks 237, 238
- **aqa-expert** — E2E test patterns (POM, Playwright)
- **ng-lib** — Angular library generator for console feature-blog library

## Status

done

> Broken down into tasks 236-247 on 2026-03-31. Marked done 2026-04-20.

## Created

2026-03-31
