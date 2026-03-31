# Epic: Project Module

## Summary

Build a complete Project module — the portfolio's primary showcase for personal and open-source work. Full vertical slice: Prisma schema with translatable JSON fields, technical highlights as a child table (CAO: Challenge → Approach → Outcome), gallery images, skill associations, domain entity with soft delete, public + admin API endpoints, console CRUD page, public `/projects` list page (stacked rows), and `/projects/:slug` detail page (single-column + breakout images). Landing page integration deferred to a separate epic — only the `GET /projects/featured` API endpoint is built here.

## Why

- **Core portfolio feature** — projects are the primary proof of skill for recruiters and hiring managers
- **Showcase beyond websites** — open source tools, libraries, and CLI plugins need dedicated space (ProseMirror editor, Claude Code plugins)
- **Storytelling over listing** — CAO technical highlights demonstrate decision-making and problem-solving, not just tech stack
- **SEO** — each project gets its own indexable URL at `/projects/:slug`
- **Admin control** — edit everything from console without touching code
- **Recruiter-focused** — project pages answer "Can this person solve problems like ours?" through motivation, role, and challenges

## Target Users

- **Admin (site owner):** Manage projects via console CRUD page
- **Visitors/Recruiters:** Browse projects on `/projects` list page, read detail at `/projects/:slug`
- **Search engines:** Index individual project pages with auto-generated meta tags

## Scope

### In Scope

**Backend (API):**

- Project Prisma schema (~18 fields, translatable JSON for text fields)
- TechnicalHighlight child model (CAO structure, translatable, 2-4 per project)
- ProjectImage junction table (projectId + mediaId + displayOrder)
- ProjectSkill junction table (projectId + skillId)
- Project domain entity with soft delete, slug generation from title
- Project repository (port/adapter) with filtering (published, featured, soft-delete)
- CQRS commands: CreateProject, UpdateProject, DeleteProject (soft), RestoreProject, ReorderProjects
- CQRS queries: ListProjects (admin, paginated), GetProjectById, GetProjectBySlug, ListPublicProjects (no auth), ListFeaturedProjects (no auth, for landing teaser)
- Public endpoints (no auth): `GET /projects`, `GET /projects/featured`, `GET /projects/:slug`
- Admin endpoints (JWT + ADMIN): full CRUD + reorder + restore
- Zod validation for all translatable JSON fields and nested highlights
- Presenter pattern: public response (resolved media URLs, skill names) vs admin response (full)

**Frontend (Console):**

- Project list page (Angular Material table, paginated, searchable, status filter)
- Create/Edit dialog (multi-section form)
- Translatable inputs (en/vi) for oneLiner, description, motivation, role
- Technical highlights sub-form (dynamic array of CAO items, max 4)
- Image upload via Media module (thumbnail + gallery images with reorder)
- Skills multi-select (from existing Skill module data)
- URL fields: sourceUrl, projectUrl
- Status toggle (draft/published), featured toggle

**Frontend (Public — `/projects` and `/projects/:slug`):**

- `/projects` list page — stacked full-width rows (thumbnail left, info right)
- `/projects/:slug` detail page — single column (~800px) + breakout images (~1200px)
- Detail layout: hero image → title/metadata → motivation → overview+role → [image] → technical highlights → [image] → back/CTA
- SSR for SEO (meta tags auto-generated from title + oneLiner)
- Locale-aware: all translatable fields respond to locale switch
- Mobile responsive (single column naturally)

**E2E Tests:**

- API E2E: admin CRUD lifecycle, public read endpoints, slug uniqueness, featured filtering
- Console E2E: create/edit/delete project, form validation, image upload
- Public page E2E: list page renders, detail page renders with all sections

### Out of Scope

- Landing page integration (deferred to Landing Integration epic)
- GitHub sync / GitHubRepo relation
- Tag relation (many-to-many with Tag entity)
- Rich text / markdown in description fields (plain text for now)
- SEO manual override fields (auto-generate from title + oneLiner)
- Project filtering/search on public list page (only 3-4 projects)
- Blog Post cross-reference
- Analytics / view tracking
- Image per technical highlight
- Before/After screenshots

## High-Level Requirements

### 1. Project Data Model

```prisma
model Project {
  id               String          @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  slug             String          @unique @db.VarChar(200)

  // Not translatable — project names are universal
  title            String          @db.VarChar(200)

  // Translatable (JSON { en: "...", vi: "..." })
  oneLiner         Json            @db.JsonB
  description      Json            @db.JsonB
  motivation       Json            @db.JsonB
  role             Json            @db.JsonB

  // Dates
  startDate        DateTime        @db.Date
  endDate          DateTime?       @db.Date

  // Status & Display
  status           ContentStatus   @default(DRAFT)
  featured         Boolean         @default(false)
  displayOrder     Int             @default(0)

  // Links
  sourceUrl        String?         @db.VarChar(500)
  projectUrl       String?         @db.VarChar(500)

  // Media
  thumbnailId      String?         @db.Uuid

  // Audit
  createdAt        DateTime        @default(now())
  updatedAt        DateTime        @updatedAt
  createdById      String          @db.Uuid
  updatedById      String          @db.Uuid
  deletedAt        DateTime?
  deletedById      String?         @db.Uuid

  // Relations
  thumbnail        Media?          @relation("ProjectThumbnail", fields: [thumbnailId], references: [id])
  createdBy        User            @relation("ProjectCreatedBy", fields: [createdById], references: [id])
  updatedBy        User            @relation("ProjectUpdatedBy", fields: [updatedById], references: [id])
  deletedBy        User?           @relation("ProjectDeletedBy", fields: [deletedById], references: [id])
  highlights       TechnicalHighlight[]
  images           ProjectImage[]
  skills           ProjectSkill[]

  @@index([status, deletedAt])
  @@index([featured, status, deletedAt])
  @@index([displayOrder])
  @@map("projects")
}

model TechnicalHighlight {
  id           String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  projectId    String  @db.Uuid

  // CAO structure — all translatable
  challenge    Json    @db.JsonB
  approach     Json    @db.JsonB
  outcome      Json    @db.JsonB

  codeUrl      String? @db.VarChar(500)
  displayOrder Int     @default(0)

  project      Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId, displayOrder])
  @@map("technical_highlights")
}

model ProjectImage {
  id           String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  projectId    String  @db.Uuid
  mediaId      String  @db.Uuid
  displayOrder Int     @default(0)

  project      Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  media        Media   @relation(fields: [mediaId], references: [id])

  @@unique([projectId, mediaId])
  @@index([projectId, displayOrder])
  @@map("project_images")
}

model ProjectSkill {
  projectId String  @db.Uuid
  skillId   String  @db.Uuid

  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  skill     Skill   @relation(fields: [skillId], references: [id])

  @@id([projectId, skillId])
  @@map("project_skills")
}
```

**Note:** `ProjectCategory`, `ProjectType`, `ProjectSize` enums already exist in schema but are intentionally NOT used in this model. Decision: no categories/types — just a curated flat list. Enums are left in schema to avoid destructive migration; they may be used by future modules or removed in a cleanup epic.

### 2. JSON Field Schemas (Zod)

Reuses `TranslatableSchema` established by Profile module:

```typescript
// Already in shared lib from Profile epic
const TranslatableSchema = z.object({
  en: z.string().min(1),
  vi: z.string().min(1),
});

const TechnicalHighlightSchema = z.object({
  challenge: TranslatableSchema,
  approach: TranslatableSchema,
  outcome: TranslatableSchema,
  codeUrl: z.string().url().nullable().optional(),
});

const CreateProjectDto = z.object({
  title: z.string().min(1).max(200),
  oneLiner: TranslatableSchema,
  description: TranslatableSchema,
  motivation: TranslatableSchema,
  role: TranslatableSchema,
  startDate: z.coerce.date(),
  endDate: z.coerce.date().nullable().optional(),
  sourceUrl: z.string().url().nullable().optional(),
  projectUrl: z.string().url().nullable().optional(),
  thumbnailId: z.string().uuid().nullable().optional(),
  featured: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
  skillIds: z.array(z.string().uuid()).optional(),
  imageIds: z.array(z.string().uuid()).optional(),
  highlights: z.array(TechnicalHighlightSchema).max(4).optional(),
});
```

### 3. API Endpoints

```
// Public (no auth)
GET    /projects                    # List published projects (sorted by displayOrder)
GET    /projects/featured           # List featured+published projects (for landing teaser)
GET    /projects/:slug              # Single project by slug (includes highlights, images, skills)

// Admin (JWT + ADMIN)
GET    /admin/projects              # List all (paginated, includes drafts + deleted)
GET    /admin/projects/:id          # Single by ID
POST   /admin/projects              # Create (with nested highlights, images, skills)
PUT    /admin/projects/:id          # Update (replace highlights + images + skills)
DELETE /admin/projects/:id          # Soft delete
POST   /admin/projects/:id/restore  # Restore soft-deleted
PATCH  /admin/projects/reorder      # Batch update displayOrder
```

**Public project list response:**
```typescript
{
  data: {
    slug: string,
    title: string,
    oneLiner: TranslatableJson,
    startDate: string,
    thumbnailUrl: string | null,
    skills: { name: string, slug: string }[],
    featured: boolean,
  }[]
}
```

**Public project detail response:**
```typescript
{
  slug: string,
  title: string,
  oneLiner: TranslatableJson,
  description: TranslatableJson,
  motivation: TranslatableJson,
  role: TranslatableJson,
  startDate: string,
  endDate: string | null,
  sourceUrl: string | null,
  projectUrl: string | null,
  thumbnailUrl: string | null,
  featured: boolean,
  highlights: {
    challenge: TranslatableJson,
    approach: TranslatableJson,
    outcome: TranslatableJson,
    codeUrl: string | null,
  }[],
  images: {
    url: string,
    alt: string | null,
  }[],
  skills: {
    name: string,
    slug: string,
  }[],
}
```

### 4. Console CRUD Page

**List page:**
- Angular Material table: thumbnail (small), title, status badge, featured star, startDate, actions (edit/delete)
- Search by title
- Status filter tabs: All | Published | Draft
- Soft-deleted items: "Trash" tab (restore / permanent delete)

**Create/Edit dialog — sections:**

1. **Basic Info:** title, oneLiner (en/vi), startDate, endDate
2. **Story:** motivation (en/vi textarea), description (en/vi textarea), role (en/vi textarea)
3. **Technical Highlights:** dynamic array (max 4), each: challenge (en/vi), approach (en/vi), outcome (en/vi), codeUrl
4. **Media:** thumbnail upload, gallery images (upload + reorder via up/down arrows)
5. **Details:** sourceUrl, projectUrl, skills multi-select
6. **Publishing:** status toggle, featured toggle, displayOrder

### 5. Public Pages

**`/projects` — List page (stacked rows):**

```
┌──────────────────────────────────────────────┐
│  [Thumbnail]  Title                          │
│               One-liner description here      │
│               Angular · NestJS · PostgreSQL   │
│               Jan 2026 — Present             │
├──────────────────────────────────────────────┤
│  [Thumbnail]  Title                          │
│               One-liner description here      │
│               TypeScript · ProseMirror        │
│               Sep 2025 — Dec 2025            │
└──────────────────────────────────────────────┘
```

Each row: click → navigates to `/projects/:slug`. No pagination, no filtering. Sorted by displayOrder.

**`/projects/:slug` — Detail page:**

```
┌──────────────────────────────────────────┐
│          HERO IMAGE (~1200px)            │
│     thumbnail as hero banner             │
├──────────────────────────────────────────┤
│   Title                          ~800px  │
│   One-liner · Date range                 │
│   [Tech tags]  [Source] [Project URL]    │
├──────────────────────────────────────────┤
│   MOTIVATION                     ~800px  │
│   Why I built this / pain point          │
├──────────────────────────────────────────┤
│   OVERVIEW + MY ROLE             ~800px  │
│   description + role text                │
├──────────────────────────────────────────┤
│        [image from gallery]     ~1200px  │
├──────────────────────────────────────────┤
│   TECHNICAL HIGHLIGHTS           ~800px  │
│   ▸ Challenge → Approach → Outcome       │
│   ▸ Challenge → Approach → Outcome       │
│     [link to PR/file if provided]        │
├──────────────────────────────────────────┤
│        [image from gallery]     ~1200px  │
├──────────────────────────────────────────┤
│   ← Back to Projects    Contact me →     │
└──────────────────────────────────────────┘
```

Images placed by order from flat list — layout decides placement (image[0] after overview, image[1] after highlights, etc.).

SSR meta tags auto-generated:
- `<title>` = `${title} | Phuong Tran`
- `<meta name="description">` = `oneLiner[currentLocale]`
- `<meta property="og:image">` = `thumbnailUrl`

## Technical Considerations

### Architecture

Follows established module pattern (same as Category, Skill, Media, ContactMessage):

```
modules/project/
├── application/
│   ├── commands/
│   │   ├── create-project.handler.ts
│   │   ├── update-project.handler.ts
│   │   ├── delete-project.handler.ts
│   │   ├── restore-project.handler.ts
│   │   └── reorder-projects.handler.ts
│   ├── queries/
│   │   ├── list-projects.handler.ts           # Admin (paginated, all statuses)
│   │   ├── get-project-by-id.handler.ts       # Admin
│   │   ├── get-project-by-slug.handler.ts     # Public
│   │   ├── list-public-projects.handler.ts    # Public (published only)
│   │   └── list-featured-projects.handler.ts  # Public (featured + published)
│   ├── ports/
│   │   └── project.repository.port.ts
│   ├── project.dto.ts
│   ├── project.presenter.ts
│   └── project.token.ts
├── domain/
│   ├── entities/
│   │   └── project.entity.ts
│   ├── project.error.ts
│   └── project.types.ts
├── infrastructure/
│   ├── mapper/
│   │   └── project.mapper.ts
│   └── repositories/
│       └── project.repository.ts
├── presentation/
│   └── project.controller.ts
├── project.module.ts
└── index.ts
```

### Dependencies

- **Existing:** `MediaModule` (thumbnail + gallery), `SkillModule` (project-skill junction), `AuthModule` (admin guard)
- **From Profile epic:** `TranslatableSchema`, `getLocalized()` utility (shared lib)
- **Enums:** `ContentStatus` already exists. `ProjectCategory`/`ProjectType`/`ProjectSize` exist but are NOT used by this model.

### Key Patterns

**Slug generation:** From `title` (always English). Auto-generated on create, regenerated on title change. Unique constraint at DB level. Collision handling: append `-2`, `-3`.

**Nested create/update:** Create command inserts project + highlights + images + skills in a Prisma transaction. Update uses "replace all" strategy for highlights and images (delete existing + insert new) within transaction. Skills also replaced.

**Image ordering:** `ProjectImage.displayOrder` determines order. Frontend assigns order on upload/reorder. Layout decides placement (image[0] after overview, image[1] after highlights).

**Featured projects:** `featured: true` + `status: PUBLISHED` + `deletedAt: null`. Composite index supports this query. Landing teaser endpoint: `GET /projects/featured`.

### Integration Points

- `MediaModule` — thumbnail FK + gallery via ProjectImage junction
- `SkillModule` — tech stack via ProjectSkill junction
- `AuthModule` — admin endpoints require JWT + ADMIN role
- `Landing app` (future) — `GET /projects/featured` for teaser section
- `Console app` — CRUD page

## Risks & Warnings

**Nested create/update complexity**

Creating a project involves inserting into 4 tables (project + highlights + images + skills) atomically. Mitigation: Prisma `$transaction` with nested writes. On update, "replace all" strategy for child records within same transaction.

**Slug uniqueness on title change**

Changing title regenerates slug, may conflict with existing. Mitigation: Slug utility with collision detection — query for existing, append numeric suffix if needed.

**Image reorder UX in console**

Drag-and-drop adds significant FE complexity. Mitigation: Start with simple up/down arrow buttons. Drag-and-drop is a nice-to-have enhancement.

**TranslatableJSON validation volume**

A project with 4 highlights has 16 translatable JSON fields to validate (4 on project + 3 per highlight x 4). Mitigation: Reuse shared `TranslatableSchema` — Zod handles this cleanly at DTO level.

**Public page SSR — first non-Profile public page**

This is the first module with multiple public pages (list + detail) requiring SSR. Mitigation: Follow the SSR data-fetching pattern established by Profile module. Add resolver/guard for 404 handling on invalid slugs.

## Alternatives Considered

### Language-per-record vs TranslatableJSON

- **Language-per-record** (original schema design): Separate records for en/vi versions
- **TranslatableJSON (chosen):** Single record per project, `{ en, vi }` JSON for text fields
- **Why:** Consistent with Profile module pattern. Only 2 languages. Avoids duplicating non-translatable fields (dates, URLs, skills, images) across language records.

### Technical Highlights: JSON array vs Separate Table

- **JSON array on Project:** Simpler schema, no joins
- **Separate table (chosen):** Cleaner validation per item, individual ordering, easier to query
- **Why:** Each highlight has 3 translatable fields + optional URL — complex nested JSON is harder to validate and migrate than a proper table.

### Categories / project types

- **Enum-based filtering** (original schema with ProjectCategory, ProjectType, ProjectSize)
- **No categories (chosen):** Only 3-4 projects, categories add noise
- **Why:** With a curated list this small, just sort by impact/recency. Existing enums left in schema to avoid destructive migration.

### Card dialog vs Dedicated pages

- **Dialog on card click** (current portfolio site): Simple, everything on landing
- **Dedicated `/projects/:slug` pages (chosen):** Better SEO, more room for storytelling
- **Why:** Projects need depth (motivation, highlights, screenshots). Dialogs can't hold this content well. Each page is indexable.

### Grid vs Stacked list for `/projects`

- **Grid of cards:** Visual, works for 5+ items
- **Stacked rows (chosen):** Each project gets more visual space
- **Why:** Only 3 projects. Grid looks sparse. Can switch to grid later if count grows past 5.

## Success Criteria

### Backend

- [ ] Prisma schema with Project, TechnicalHighlight, ProjectImage, ProjectSkill models
- [ ] Domain entity with soft delete, slug generation, validation
- [ ] Repository with nested includes (highlights, images with media URL, skills)
- [ ] Create command: atomic insert into 4 tables via transaction
- [ ] Update command: replace-all strategy for child records in transaction
- [ ] Delete/Restore commands with soft delete
- [ ] Reorder command for batch displayOrder update
- [ ] Public queries filter by published + not deleted
- [ ] Featured query for landing teaser
- [ ] Slug collision handling (append -2, -3)
- [ ] Zod validation for all translatable JSON fields and nested highlights
- [ ] Unit tests for all commands, queries, entity, and slug generation

### Frontend (Console)

- [ ] Project list page with table, search, status filter, trash tab
- [ ] Create/Edit dialog: basic info, story, highlights, media, details, publishing sections
- [ ] Dynamic array form for technical highlights (max 4, CAO structure)
- [ ] Image gallery with upload and reorder (up/down arrows)
- [ ] Skills multi-select from existing Skill data
- [ ] Status and featured toggles
- [ ] Save with success/error feedback

### Frontend (Public Pages)

- [ ] `/projects` list page — stacked rows, sorted by displayOrder
- [ ] `/projects/:slug` detail page — full layout with all sections
- [ ] Images placed contextually between text sections
- [ ] Locale-aware: all translatable fields respond to language switch
- [ ] SSR with auto-generated meta tags (title, description, og:image)
- [ ] 404 page for invalid slugs
- [ ] Mobile responsive

### E2E

- [ ] API: admin create with highlights + images + skills → public endpoint returns project
- [ ] API: update project → changes reflected on public endpoint
- [ ] API: soft delete → public endpoint returns 404 for that slug
- [ ] API: featured filtering returns only featured + published
- [ ] Console: full CRUD lifecycle
- [ ] Public: list page renders all published projects
- [ ] Public: detail page renders all sections with correct data

## Estimated Complexity

**XL (Extra Large)**

**Reasoning:**
- 4 database tables (project + 3 child tables) with nested operations
- 4+ translatable JSON fields on project, 3 per highlight (up to 16 total)
- Console form is the most complex so far (6 sections, dynamic arrays, media gallery)
- Two new public pages (list + detail) with SSR — first module with public detail page
- First module with a rich public layout pattern (single-column + breakout images)

## Status

broken-down

> Broken down into tasks 225-235 on 2026-03-31

## Created

2026-03-31
