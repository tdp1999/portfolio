# Epic: Experience Module

## Summary

Build a complete Experience module — professional work history/employment entries with full vertical slice: Prisma schema (new EmploymentType + LocationType enums, Experience model, ExperienceSkill junction table), domain entity with translatable JSON fields, public + admin API endpoints, console CRUD page (list + dialog), landing page career timeline integration, and E2E tests. Includes company logo via Media relation, skills-per-role via junction table, and Project-Experience cross-reference preparation.

## Why

- **Career storytelling** — work history is the #1 section recruiters examine on a portfolio (LinkedIn data confirms)
- **Dynamic management** — edit experience from console without touching code
- **Skills-in-context** — showing technologies per role is more credible than a flat skill list
- **Multi-language** — JSON translatable fields enable en/vi position titles, descriptions, and achievements
- **SEO** — structured work history data improves E-E-A-T signals for Google
- **Project linking** — cross-referencing projects with roles adds depth (future Project epic consumes the FK)

## Target Users

- **Admin (site owner):** Manage work history via console CRUD page
- **Visitors/Recruiters:** View career timeline on landing page (dedicated Experience page + home overview)
- **Search engines:** Consume structured employment data for E-E-A-T signals

## Scope

### In Scope

**Backend (API):**

- EmploymentType enum: `FULL_TIME | PART_TIME | CONTRACT | FREELANCE | INTERNSHIP | SELF_EMPLOYED`
- LocationType enum: `REMOTE | HYBRID | ONSITE` (replaces `isRemote` boolean from original schema)
- Experience Prisma model + migration (~25 fields)
- ExperienceSkill junction table (experienceId + skillId)
- Experience domain entity with translatable JSON fields (position, description, achievements, teamRole)
- Experience repository (port/adapter) with soft delete filtering
- CQRS commands: CreateExperience, UpdateExperience, DeleteExperience (soft), RestoreExperience, ReorderExperiences
- CQRS queries: ListExperiences (admin, paginated), GetExperienceById, GetExperienceBySlug, ListPublicExperiences (landing, no auth)
- Public endpoints (no auth) for landing page consumption
- Admin endpoints (JWT + ADMIN) for CRUD
- Slug generation from company name + position (e.g., `fpt-software-senior-frontend-engineer`)
- ExperienceErrorCode in shared/errors
- Zod validation for all fields including translatable JSON schemas
- Presenter pattern for response shaping (public vs admin response)

**Frontend (Console):**

- Experience list page (Angular Material table, paginated, searchable)
- Create/Edit dialog (multi-section form)
- Translatable inputs (en/vi) for position, description, achievements, teamRole
- Employment type and location type dropdowns
- Skills multi-select (from existing Skill module data)
- Company logo upload via Media module integration
- Date pickers for start/end date (end date nullable = current position)
- Achievements dynamic array (add/remove bullet points, per language)
- Location fields (country, city, postal code, address lines)
- Client/project context fields (clientName, clientIndustry, domain, teamSize)
- Display order management (drag-and-drop or manual number input)
- Soft delete / restore actions

**Frontend (Landing):**

- Fetch experiences from public API (`GET /experiences`)
- Career timeline display (chronological, most recent first)
- Per-entry: company name, position, date range, location type badge, employment type badge
- Achievements as bullet points
- Skills tags per role
- Company logo display (with fallback placeholder)
- "Current" indicator for ongoing positions (no endDate)
- Multi-language: translatable fields respond to locale switch
- SSR: fetch on server side for initial render
- Dedicated Experience page + brief overview on home page

**E2E Tests:**

- Full CRUD lifecycle via console
- Public API returns correct data
- Landing page displays experience data correctly
- Soft delete / restore workflow
- Skills relation management

### Out of Scope

- Project-Experience FK on Project model (Project model doesn't exist yet — FK added in Project epic, Experience module exports what's needed)
- Testimonials/recommendations per experience entry (future)
- AI-generated experience summaries (authoring aid, not runtime)
- Skills proficiency per role (simple junction, no proficiency level)
- Interactive timeline animations (landing page uses clean static layout)
- Experience import from LinkedIn
- Schema.org JSON-LD for individual experience entries (Profile JSON-LD covers `worksFor` and `jobTitle` for current role)
- Drag-and-drop reordering UI (manual `displayOrder` number input is sufficient for MVP)

## High-Level Requirements

### 1. Experience Data Model

```prisma
enum EmploymentType {
  FULL_TIME
  PART_TIME
  CONTRACT
  FREELANCE
  INTERNSHIP
  SELF_EMPLOYED
}

enum LocationType {
  REMOTE
  HYBRID
  ONSITE
}

model Experience {
  id                  String          @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  slug                String          @unique @db.VarChar(200)

  // Company info (non-translatable)
  companyName         String          @db.VarChar(200)
  companyUrl          String?         @db.VarChar(500)
  companyLogoId       String?         @db.Uuid

  // Role (translatable JSON)
  position            Json            @db.JsonB           // TranslatableString { en: "...", vi: "..." }
  description         Json?           @db.JsonB           // TranslatableString (optional)
  achievements        Json            @default("{}") @db.JsonB  // TranslatableStringArray { en: [...], vi: [...] }
  teamRole            Json?           @db.JsonB           // TranslatableString (optional, e.g. "Tech Lead")

  // Employment details
  employmentType      EmploymentType  @default(FULL_TIME)
  locationType        LocationType    @default(ONSITE)

  // Location (full stored, city+country exposed publicly — same pattern as Profile)
  locationCountry     String?         @db.VarChar(100)
  locationCity        String?         @db.VarChar(100)
  locationPostalCode  String?         @db.VarChar(20)
  locationAddress1    String?         @db.VarChar(300)
  locationAddress2    String?         @db.VarChar(300)

  // Client/project context (admin metadata, not necessarily displayed publicly)
  clientName          String?         @db.VarChar(200)
  clientIndustry      String?         @db.VarChar(100)
  domain              String?         @db.VarChar(100)   // e.g. "Fintech", "Healthcare"
  teamSize            Int?

  // Dates
  startDate           DateTime
  endDate             DateTime?                           // null = current position

  // Display
  displayOrder        Int             @default(0)

  // Audit
  createdAt           DateTime        @default(now())
  updatedAt           DateTime        @updatedAt
  createdById         String          @db.Uuid
  updatedById         String          @db.Uuid
  deletedAt           DateTime?
  deletedById         String?         @db.Uuid

  // Relations
  companyLogo         Media?          @relation("ExperienceCompanyLogo", fields: [companyLogoId], references: [id])
  createdBy           User            @relation("ExperienceCreatedBy", fields: [createdById], references: [id])
  updatedBy           User            @relation("ExperienceUpdatedBy", fields: [updatedById], references: [id])
  deletedBy           User?           @relation("ExperienceDeletedBy", fields: [deletedById], references: [id])
  skills              ExperienceSkill[]

  @@index([startDate])
  @@index([deletedAt])
  @@index([displayOrder])
}

model ExperienceSkill {
  experienceId String @db.Uuid
  skillId      String @db.Uuid

  experience   Experience @relation(fields: [experienceId], references: [id], onDelete: Cascade)
  skill        Skill      @relation(fields: [skillId], references: [id], onDelete: Cascade)

  @@id([experienceId, skillId])
}
```

**Design notes:**

- `slug` auto-generated from `companyName + position[en]` (e.g., `fpt-software-senior-frontend-engineer`). Unique constraint, collision handling with numeric suffix.
- `achievements` default `{}` not `[]` because it's a TranslatableStringArray object, not a plain array.
- `teamRole` is translatable because it's user-facing ("Tech Lead" / "Truong nhom ky thuat").
- `clientName`, `clientIndustry`, `domain` are plain strings — they're admin metadata, not primary display content. If translation is needed later, can convert to TranslatableString.
- Location fields follow Profile's pattern: store everything, expose only city + country publicly.
- No `ContentStatus` — all non-deleted experiences are visible. Use soft delete to hide.
- `displayOrder` allows manual override but default sort is `startDate DESC`.

### 2. Translatable Fields (reuses Profile's shared types)

```typescript
// From @portfolio/shared/types (established in Profile epic)
type TranslatableString = { en: string; vi: string };
type TranslatableStringArray = { en: string[]; vi: string[] };

// Experience translatable fields:
// position:     TranslatableString (required)
// description:  TranslatableString (optional)
// achievements: TranslatableStringArray (default { en: [], vi: [] })
// teamRole:     TranslatableString (optional)
```

**Zod validation (in experience.dto.ts):**

```typescript
const TranslatableStringSchema = z.object({
  en: z.string().min(1),
  vi: z.string().min(1),
});

const OptionalTranslatableStringSchema = z.object({
  en: z.string().optional(),
  vi: z.string().optional(),
}).nullable();

const TranslatableStringArraySchema = z.object({
  en: z.array(z.string().min(1).max(500)).default([]),
  vi: z.array(z.string().min(1).max(500)).default([]),
});
```

**Reading approach (same fallback chain as Profile):**

```typescript
function getLocalized(field: TranslatableJson, locale: 'en' | 'vi'): string {
  return field[locale] || field['en'] || Object.values(field)[0] || '';
}
```

### 3. API Endpoints

```
GET    /experiences                    # Public — list for landing (sorted by startDate DESC, no auth)
GET    /experiences/:idOrSlug          # Public — single experience by ID or slug
POST   /experiences                    # Admin — create experience
PUT    /experiences/:id                # Admin — update experience
DELETE /experiences/:id                # Admin — soft delete
PATCH  /experiences/:id/restore        # Admin — restore from soft delete
PATCH  /experiences/reorder            # Admin — bulk update displayOrder
```

**Public list response (filtered — no audit fields, no private location fields):**

```typescript
{
  id: string,
  slug: string,
  companyName: string,
  companyUrl: string | null,
  companyLogoUrl: string | null,       // resolved Media URL
  position: TranslatableString,
  description: TranslatableString | null,
  achievements: TranslatableStringArray,
  teamRole: TranslatableString | null,
  employmentType: EmploymentType,
  locationType: LocationType,
  locationCountry: string | null,
  locationCity: string | null,         // city + country only (no postal/address)
  domain: string | null,
  teamSize: number | null,
  startDate: string,                   // ISO date
  endDate: string | null,             // null = current
  skills: { id: string, name: string, slug: string }[],
}
```

**Excluded from public:** `clientName`, `clientIndustry`, `locationPostalCode`, `locationAddress1`, `locationAddress2`, `displayOrder`, all audit fields.

**Admin response:** All fields including audit, private location, client metadata.

### 4. Slug Generation

- Auto-generated from `companyName + position.en` via `SlugValue.from()`
- Example: "FPT Software" + "Senior Frontend Engineer" → `fpt-software-senior-frontend-engineer`
- Collision handling: append numeric suffix (`-2`, `-3`) if slug exists
- Slug is immutable after creation (changing company/position doesn't change slug)
- Always English (uses `position.en` not `position.vi`)

### 5. Skills Relation Management

- `ExperienceSkill` is a simple junction table (no extra columns)
- On create/update, accept `skillIds: string[]` in the DTO
- Repository handles the junction: delete existing + insert new (replace strategy)
- Skills are validated against existing Skill records (reject unknown IDs)
- Public response includes basic skill info (id, name, slug) for display

### 6. Company Logo

- `companyLogoId` is optional FK to Media
- On create/update, accept `companyLogoId: string | null` in the DTO
- Validates that Media record exists (if provided)
- Public response resolves to `companyLogoUrl: string | null` via Media URL
- Landing page shows company logo with fallback (first letter of company name or generic building icon)

### 7. Display Order & Sorting

- **Default sort:** `startDate DESC` (chronological, most recent first)
- **Manual override:** `displayOrder` field (lower = higher priority)
- **Sort logic:** `ORDER BY displayOrder ASC, startDate DESC`
  - Entries with `displayOrder > 0` appear in manual order first
  - Entries with `displayOrder = 0` (default) fall back to chronological
- **Reorder endpoint:** `PATCH /experiences/reorder` accepts `[{ id, displayOrder }]` array for bulk update

### 8. Console Experience Page

**List view:**

- Angular Material table with columns: company name, position (en), employment type, location type, date range, status (active/deleted)
- Search across company name, position (en/vi)
- Pagination (standard page/limit)
- Row actions: edit, delete, restore
- "Add Experience" button opens create dialog

**Create/Edit dialog (multi-section):**

- **Company:** companyName, companyUrl, company logo upload
- **Role:** position (en/vi inputs), description (en/vi textarea), employmentType dropdown, teamRole (en/vi)
- **Dates:** startDate picker, endDate picker (toggle "Current position" checkbox to null)
- **Location:** locationType dropdown, country, city, postalCode, address1, address2
- **Skills:** multi-select from existing skills (chips/autocomplete)
- **Achievements:** dynamic array per language — en tab and vi tab, each with add/remove buttons
- **Context (optional):** clientName, clientIndustry, domain, teamSize
- **Display:** displayOrder (number input)

### 9. Landing Page Integration

**Dedicated Experience page:**

- Career timeline layout (vertical, most recent at top)
- Each entry: company logo + name, position title, date range with duration calculation
- Employment type badge (Full-time, Contract, Freelance, etc.)
- Location type badge (Remote, Hybrid, On-site) + city/country
- Description paragraph
- Achievements as bulleted list
- Skills as tag chips
- "Current" indicator for ongoing positions (green dot or "Present" label)
- Domain/industry tag (if provided)
- Team size indicator (if provided)

**Home page overview:**

- Brief timeline showing 2-3 most recent positions (company, title, date range)
- "View full career history" link to Experience page

**SSR:**

- Server-side fetch for initial render and SEO
- Graceful fallback if API unavailable (empty state with retry)

**Multi-language:**

- All translatable fields (`position`, `description`, `achievements`, `teamRole`) respond to locale switch
- Non-translatable fields (company name, dates, badges) stay the same

## Technical Considerations

### Architecture

Follows established module pattern (Skill, Tag, Category):

```
modules/experience/
├── application/
│   ├── commands/
│   │   ├── create-experience.handler.ts
│   │   ├── update-experience.handler.ts
│   │   ├── delete-experience.handler.ts
│   │   ├── restore-experience.handler.ts
│   │   ├── reorder-experiences.handler.ts
│   │   ├── index.ts
│   │   └── experience-commands.spec.ts
│   ├── queries/
│   │   ├── list-experiences.handler.ts
│   │   ├── get-experience-by-id.handler.ts
│   │   ├── get-experience-by-slug.handler.ts
│   │   ├── list-public-experiences.handler.ts
│   │   ├── index.ts
│   │   └── experience-queries.spec.ts
│   ├── ports/
│   │   └── experience.repository.port.ts
│   ├── experience.dto.ts
│   ├── experience.dto.spec.ts
│   ├── experience.presenter.ts
│   └── experience.token.ts
├── domain/
│   ├── entities/
│   │   ├── experience.entity.ts
│   │   └── experience.entity.spec.ts
│   └── experience.types.ts
├── infrastructure/
│   ├── mapper/
│   │   └── experience.mapper.ts
│   └── repositories/
│       └── experience.repository.ts
├── presentation/
│   └── experience.controller.ts
├── experience.module.ts
└── index.ts
```

**Key patterns:**

- `BaseCrudEntity<IExperienceProps>` base class (shared)
- Static factories: `Experience.create()` and `Experience.load()`
- Domain methods: `update()`, `softDelete()`, `restore()`
- Repository port with token-based DI (`EXPERIENCE_REPOSITORY`)
- Mapper: Prisma types <-> Domain entity (handles JSON field conversion)
- Presenter: domain entity -> API response (public vs admin variants)
- Commands validate via Zod `safeParse`, throw `ValidationError` on failure

### Dependencies

- **Existing:** `UserModule` (audit FKs), `MediaModule` (company logo), `SkillModule` (junction relation), `AuthModule` (admin guard)
- **Shared types:** `TranslatableString`, `TranslatableStringArray` from `@portfolio/shared/types` (established in Profile epic)
- **Shared errors:** `ExperienceErrorCode` added to `@portfolio/shared/errors`
- **Prisma enums:** `EmploymentType`, `LocationType` (new, additive migration)

### Integration Points

- `SkillModule` — ExperienceSkill junction, need to import or access Skill repository for validation
- `MediaModule` — company logo FK, resolve Media URL in presenter
- `AuthModule` — JWT guard on write endpoints
- `Landing app` — public experience list + detail for career timeline
- `Console app` — CRUD page with dialog
- **Future Project epic** — will add optional `experienceId` FK on Project model. Experience module exports `EXPERIENCE_REPOSITORY` token for Project module to validate FK.

### i18n Strategy: JSON Translatable (Hybrid Rule)

This module uses **JSON Translatable** (same as Profile), not separate records:

| Field | Type | Translatable? |
|-------|------|--------------|
| `position` | TranslatableString | Yes |
| `description` | TranslatableString | Yes |
| `achievements` | TranslatableStringArray | Yes |
| `teamRole` | TranslatableString | Yes |
| `companyName` | String | No (proper noun) |
| `companyUrl` | String | No |
| `clientName` | String | No (proper noun) |
| `clientIndustry` | String | No (admin metadata) |
| `domain` | String | No (universal terms) |
| All other fields | — | No |

**Hybrid rule context:** Profile and Experience use JSON Translatable (short text, 1 record = 1 entity). Project and BlogPost will use Separate Records (long-form rich text, SEO per language, content can differ completely per language). See epic discussion for full rationale.

### Future Extensibility

**Project-Experience linking (prepared):**

- Experience module is ready for the cross-reference
- When Project epic is built, it adds `experienceId` FK to Project model
- Project module imports `ExperienceModule` and uses `EXPERIENCE_REPOSITORY` to validate FK
- No code changes needed in Experience module

**Testimonials per role (future):**

- Could add `ExperienceTestimonial` model with FK to Experience
- Separate epic when testimonials feature is planned

## Risks & Warnings

**Translatable JSON field complexity**

- 4 translatable fields (position, description, achievements, teamRole) need Zod validation per operation
- Invalid JSON could corrupt experience data
- Mitigation: Strict Zod schemas with runtime validation in command handlers. Reuse `TranslatableStringSchema` and `TranslatableStringArraySchema` from shared types (established in Profile epic).

**Slug collision on similar roles**

- Two roles at the same company with similar titles could collide
- Example: "FPT Software" + "Frontend Engineer" and "FPT Software" + "Senior Frontend Engineer" are different slugs, but "FPT Software" + "Frontend Engineer" appearing twice (different time periods) would collide
- Mitigation: Append numeric suffix (`-2`, `-3`). The slug generation utility already handles this pattern.

**ExperienceSkill junction — cascade delete implications**

- `onDelete: Cascade` on both FKs means deleting a Skill removes all ExperienceSkill rows for that skill
- This is correct behavior (don't leave orphan junctions), but admin should be aware that deleting a skill affects experience displays
- Mitigation: Skill soft delete doesn't trigger cascade (only hard delete does). Document this in UI.

**Company logo dependency on Media module**

- If Media record is deleted, `companyLogoId` FK becomes stale
- Mitigation: Prisma `onDelete: SetNull` or `Restrict`. Recommend `SetNull` — logo disappears gracefully instead of blocking Media deletion.

**Landing page performance with skills eager loading**

- Public list query needs skills per experience (N+1 query risk)
- Mitigation: Use Prisma `include: { skills: { include: { skill: true } } }` for eager loading. For a portfolio with ~10 experiences, performance is not a concern.

## Alternatives Considered

### i18n: JSON Translatable vs Separate Records

- **Separate records** (original schema design): Each language = separate Experience record. More normalized.
- **JSON Translatable (chosen):** 1 record = 1 work experience. Translatable fields stored as `{ en, vi }` JSON.
- **Why JSON chosen:** Experience is like Profile — one logical entity per job, just translate the text. Separate records would duplicate company name, dates, URLs, and risk sync issues. JSON is simpler for a portfolio with 2 languages.

### Location: isRemote boolean vs LocationType enum

- **`isRemote: boolean`** (original schema): Simple but binary (remote or not)
- **`LocationType` enum (chosen):** `REMOTE | HYBRID | ONSITE` — industry standard post-COVID
- **Why enum chosen:** Hybrid work is the dominant model in 2025-2026. A boolean can't express it. Recruiters expect to see explicit remote/hybrid/onsite signals.

### Achievements: Structured STAR objects vs String array

- **Structured** (`{ text, metric, category }`): Enables filtering/highlighting by category
- **String array (chosen):** Simple `string[]` per language. STAR is a writing guide, not a data model.
- **Why string array chosen:** For a portfolio display, bullet points are sufficient. Structured objects add schema complexity with minimal display benefit. The STAR format is better enforced as content guidance in the admin UI, not as database constraints.

### Skills per role: Extra context vs Simple junction

- **Rich junction** (`isPrimary: boolean`, `proficiencyAtTime: string`): More data per skill-role pair
- **Simple junction (chosen):** Just `experienceId + skillId`, no extras
- **Why simple chosen:** For display purposes, listing skills per role is sufficient. Proficiency tracking per role is over-engineering for a portfolio. Can extend junction table later if needed.

## Success Criteria

### Backend

- [ ] Prisma schema applied with EmploymentType + LocationType enums, Experience model, ExperienceSkill junction
- [ ] Domain entity with translatable JSON fields, `create()` / `load()` / `update()` / `softDelete()` / `restore()`
- [ ] Slug generation from companyName + position.en with collision handling
- [ ] Repository with soft delete filtering, skills eager loading, pagination, search
- [ ] All 5 commands with unit tests (create, update, delete, restore, reorder)
- [ ] All 4 queries with unit tests (list-admin, list-public, get-by-id, get-by-slug)
- [ ] Zod validation for all translatable JSON fields
- [ ] ExperienceSkill junction managed on create/update (replace strategy)
- [ ] Public endpoint returns filtered response (no audit, no private location)
- [ ] Admin endpoints require JWT + ADMIN role

### Frontend (Console)

- [ ] Experience list page with table, pagination, search
- [ ] Create/Edit dialog with multi-section form
- [ ] Translatable inputs (en/vi) for position, description, achievements, teamRole
- [ ] Employment type and location type dropdowns
- [ ] Skills multi-select from existing Skill data
- [ ] Company logo upload with preview
- [ ] Date pickers with "Current position" toggle
- [ ] Achievements dynamic array (add/remove per language)
- [ ] Display order management
- [ ] Soft delete / restore actions

### Frontend (Landing)

- [ ] Career timeline on dedicated Experience page
- [ ] Per-entry: company logo, name, position, dates, badges, description, achievements, skills
- [ ] Brief overview on home page (2-3 most recent)
- [ ] "Current" indicator for ongoing positions
- [ ] Employment type + location type badges
- [ ] Multi-language: translatable fields respond to locale switch
- [ ] SSR: server-side fetch for initial render
- [ ] Graceful fallback when no experiences exist

### Integration

- [ ] E2E: create experience via console → verify on public API → verify on landing page
- [ ] E2E: update experience → landing page reflects changes
- [ ] E2E: soft delete → hidden from public → restore → visible again
- [ ] E2E: skills relation — add/remove skills, verify display
- [ ] E2E: company logo upload and display

## Estimated Complexity

**L (Large)**

**Reasoning:**

- ~25 fields with 4 translatable JSON fields requiring Zod validation (reuses Profile's shared types but still complex)
- Two new Prisma enums (EmploymentType, LocationType) + junction table (ExperienceSkill)
- Skills relation management (junction CRUD within experience commands)
- Company logo via Media relation (requires Media module integration)
- Console form is complex: multi-section, translatable inputs, dynamic arrays, date pickers, skills multi-select, logo upload
- Landing page: career timeline layout with multiple data points per entry, badges, skills tags
- Three frontend touchpoints: console CRUD page, landing Experience page, landing home overview
- Comparable to Profile in complexity (translatable JSON + console form + landing integration)

## Specialized Skills

- **prisma-migrate** — Prisma migration for new enums + Experience model + ExperienceSkill junction
- **be-test** — BE unit/integration test writer (analyze logic → plan → write → validate) → tasks 216, 218, 219, 220
- **aqa-expert** — E2E test patterns (POM, Playwright, flakiness prevention)
- **ng-lib** — Angular library generator for console feature-experience library

## Status

completed

## Created

2026-03-29
