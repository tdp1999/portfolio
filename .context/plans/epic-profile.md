# Epic: Profile Module

## Summary

Build a complete Profile module — the single-record entity containing all site owner personal information. Full vertical slice: Prisma schema with ~28 fields (including translatable JSON, certifications JSON, social links JSON), domain entity with invariant enforcement, public + admin API endpoints, console settings page with multi-section form (dynamic arrays, media uploads), and landing page integration replacing all hardcoded personal data with dynamic Profile data. Includes JSON-LD Person structured data for SEO.

## Why

- **Single source of truth** for all personal information displayed on the portfolio
- **Replace hardcoded data** — landing page currently shows hardcoded name/title/bio/avatar
- **Multi-language support** — JSON translatable fields enable en/vi content from one record
- **SEO** — JSON-LD Person structured data enables Google Knowledge Panels and rich search results
- **Professional signaling** — availability status + openTo preferences tell recruiters what you're open for
- **Resume management** — language-aware resume downloads
- **Admin control** — edit everything from console without touching code

## Target Users

- **Admin (site owner):** Manage personal info via console settings page
- **Visitors/Recruiters:** View profile data on landing page (hero, about, social links, resume)
- **Search engines:** Consume JSON-LD Person structured data for indexing

## Scope

### In Scope

**Backend (API):**

- Profile Prisma schema + migration (~28 fields)
- SocialPlatform enum update (remove FACEBOOK/INSTAGRAM/YOUTUBE, add BLUESKY/STACKOVERFLOW/DEV_TO/HASHNODE)
- Availability enum update (add NOT_AVAILABLE)
- Profile domain entity (single-record invariant, no soft delete, no slug)
- Profile repository (port/adapter) with upsert pattern
- CQRS commands: CreateOrUpdateProfile (upsert), UpdateAvatar, UpdateOgImage
- CQRS queries: GetProfile (admin, full), GetPublicProfile (no auth, filtered fields)
- Public endpoint: `GET /profile` — returns only public-safe fields (no address, no phone)
- Admin endpoints: `GET /admin/profile`, `PUT /admin/profile` (upsert)
- JSON-LD Person generator service
- Zod validation for all JSON fields (socialLinks, certifications, resumeUrls, openTo, translatable fields)

**Frontend (Console):**

- Profile settings page with multi-section form
- Sections: Identity, Contact, Location, Social Links, Resume, Certifications, SEO, Availability
- Dynamic array forms: social links (add/remove rows), certifications (add/remove rows)
- Avatar upload via existing Media module integration
- OG Image upload via existing Media module integration
- JSON-LD preview panel (shows what search engines will see)
- Form auto-save or explicit save with success feedback

**Frontend (Landing):**

- Fetch Profile from public API (`GET /profile`)
- Hero section: fullName, title, bioShort, avatar image
- About section: bioLong, yearsOfExperience, location (city + country)
- Social links as icon buttons (GitHub, LinkedIn, etc.)
- Resume download button (locale-aware — serves en/vi version based on current language)
- Availability + openTo badge display
- JSON-LD `<script type="application/ld+json">` in `<head>` via SSR
- Multi-language: display translatable fields in current locale

### Out of Scope

- Cover/banner image (decision: skip)
- Pronouns field (decision: skip for Vietnam market)
- Education as separate entity (certifications JSON on Profile is sufficient)
- Resume PDF generation from Profile data (future)
- Profile versioning/history
- Multiple profiles / multi-tenancy
- "Send mail as" from Profile email
- Full landing page redesign (only Profile data integration — layout stays)

## High-Level Requirements

### 1. Profile Data Model

```prisma
model Profile {
  id                       String          @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId                   String          @unique @db.Uuid

  // Translatable (JSON { en: "...", vi: "..." })
  fullName                 Json            @db.JsonB
  title                    Json            @db.JsonB
  bioShort                 Json            @db.JsonB
  bioLong                  Json?           @db.JsonB

  // Work
  yearsOfExperience        Int
  availability             Availability    @default(EMPLOYED)
  openTo                   Json            @default("[]") @db.JsonB  // string[]

  // Contact
  email                    String          @db.VarChar(320)
  phone                    String?         @db.VarChar(20)
  preferredContactPlatform SocialPlatform  @default(LINKEDIN)
  preferredContactValue    String          @db.VarChar(500)

  // Location (full stored, city+country exposed publicly)
  locationCountry          String          @db.VarChar(100)
  locationCity             String          @db.VarChar(100)
  locationPostalCode       String?         @db.VarChar(20)
  locationAddress1         String?         @db.VarChar(300)
  locationAddress2         String?         @db.VarChar(300)

  // Social & Resume
  socialLinks              Json            @default("[]") @db.JsonB  // SocialLink[]
  resumeUrls               Json            @default("{}") @db.JsonB  // { en: "url", vi: "url" }

  // Certifications
  certifications           Json            @default("[]") @db.JsonB  // Certification[]

  // SEO (homepage)
  metaTitle                String?         @db.VarChar(70)
  metaDescription          String?         @db.VarChar(160)
  ogImageId                String?         @db.Uuid

  // Misc
  timezone                 String?         @db.VarChar(50)  // IANA, e.g. "Asia/Ho_Chi_Minh"
  canonicalUrl             String?         @db.VarChar(500) // e.g. "https://thunderphong.com"

  // Media relations
  avatarId                 String?         @db.Uuid

  // Audit
  createdAt                DateTime        @default(now())
  updatedAt                DateTime        @updatedAt
  createdById              String          @db.Uuid
  updatedById              String          @db.Uuid

  // Relations
  user                     User            @relation(fields: [userId], references: [id])
  avatar                   Media?          @relation("ProfileAvatar", fields: [avatarId], references: [id])
  ogImage                  Media?          @relation("ProfileOgImage", fields: [ogImageId], references: [id])
  createdBy                User            @relation("ProfileCreatedBy", fields: [createdById], references: [id])
  updatedBy                User            @relation("ProfileUpdatedBy", fields: [updatedById], references: [id])

  @@index([userId])
}
```

**Enum updates:**

```prisma
// UPDATED — remove FACEBOOK, INSTAGRAM, YOUTUBE; add new platforms
enum SocialPlatform {
  GITHUB
  LINKEDIN
  TWITTER
  BLUESKY
  STACKOVERFLOW
  DEV_TO
  HASHNODE
  WEBSITE
  OTHER
}

// UPDATED — add NOT_AVAILABLE
enum Availability {
  OPEN_TO_WORK
  EMPLOYED
  FREELANCING
  NOT_AVAILABLE
}
```

### 2. JSON Field Schemas (Zod)

**Translatable field:**
```typescript
const TranslatableSchema = z.object({
  en: z.string().min(1),
  vi: z.string().min(1),
});

// Optional variant (e.g., bioLong)
const OptionalTranslatableSchema = z.object({
  en: z.string().optional(),
  vi: z.string().optional(),
}).nullable();
```

**Social link:**
```typescript
const SocialLinkSchema = z.object({
  platform: z.nativeEnum(SocialPlatform),
  url: z.string().url(),
  handle: z.string().optional(),
});
```

**Certification:**
```typescript
const CertificationSchema = z.object({
  name: z.string().min(1).max(200),
  issuer: z.string().min(1).max(200),
  year: z.number().int().min(1990).max(2100),
  url: z.string().url().optional(),
});
```

**Resume URLs:**
```typescript
const ResumeUrlsSchema = z.object({
  en: z.string().url().optional(),
  vi: z.string().url().optional(),
});
```

**Open To:**
```typescript
const OpenToSchema = z.array(
  z.enum(['FREELANCE', 'CONSULTING', 'SIDE_PROJECT', 'FULL_TIME', 'SPEAKING', 'OPEN_SOURCE'])
);
```

### 3. API Endpoints

```
GET    /profile                    # Public — returns public-safe fields only
GET    /admin/profile              # Admin — returns all fields
PUT    /admin/profile              # Admin — create or update (upsert)
PATCH  /admin/profile/avatar       # Admin — update avatar (Media ID)
PATCH  /admin/profile/og-image     # Admin — update OG image (Media ID)
GET    /profile/json-ld            # Public — returns JSON-LD Person object
```

**Public profile response (filtered):**
```typescript
{
  fullName: TranslatableJson,
  title: TranslatableJson,
  bioShort: TranslatableJson,
  bioLong: TranslatableJson | null,
  yearsOfExperience: number,
  availability: Availability,
  openTo: string[],
  email: string,                   // public contact email
  preferredContactPlatform: SocialPlatform,
  preferredContactValue: string,
  locationCountry: string,
  locationCity: string,            // city + country only
  socialLinks: SocialLink[],
  resumeUrls: ResumeUrls,
  certifications: Certification[],
  avatarUrl: string | null,        // resolved Media URL
  metaTitle: string | null,
  metaDescription: string | null,
  ogImageUrl: string | null,       // resolved Media URL
  timezone: string | null,
  canonicalUrl: string | null,
}
```

**Excluded from public:** phone, locationPostalCode, locationAddress1, locationAddress2, audit fields.

### 4. JSON-LD Person Generation

```typescript
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": profile.fullName[locale],
  "jobTitle": profile.title[locale],
  "description": profile.bioShort[locale],
  "image": avatarUrl,
  "email": `mailto:${profile.email}`,
  "url": profile.canonicalUrl,
  "address": {
    "@type": "PostalAddress",
    "addressLocality": profile.locationCity,
    "addressCountry": profile.locationCountry
  },
  "sameAs": profile.socialLinks.map(l => l.url),
  "knowsLanguage": ["English", "Vietnamese"]
}
```

Generated server-side. Landing page SSR injects into `<head>` as `<script type="application/ld+json">`.

### 5. Single-Record Invariant

- Profile has a **unique constraint on userId** — only one record per user
- Since there's only one admin user, there's only one Profile
- `PUT /admin/profile` uses **upsert** pattern: create if not exists, update if exists
- No `DELETE` endpoint — Profile is never deleted
- No soft delete — single record, always present once created
- First-time setup: Profile doesn't exist until admin fills the form and saves

### 6. Console Settings Page

**Sections (tab or accordion layout):**

1. **Identity:** fullName (en/vi inputs), title (en/vi), bioShort (en/vi), bioLong (en/vi, textarea), avatar upload
2. **Work:** yearsOfExperience (number), availability (dropdown), openTo (multi-select chips)
3. **Contact:** email, phone, preferredContactPlatform (dropdown), preferredContactValue
4. **Location:** country, city, postalCode, address1, address2
5. **Social Links:** dynamic array — each row: platform (dropdown) + URL + handle. Add/remove buttons
6. **Resume:** en URL input, vi URL input (future: Media upload integration)
7. **Certifications:** dynamic array — each row: name, issuer, year, URL. Add/remove buttons
8. **SEO:** metaTitle (with char counter, max 70), metaDescription (with char counter, max 160), ogImage upload, canonicalUrl, JSON-LD preview

### 7. Landing Page Integration

- Replace hardcoded hero data with Profile API data
- `ProfileService` in landing shared data-access library
- SSR: fetch Profile on server side for initial render + SEO
- JSON-LD injected in `<head>` during SSR
- Locale-aware: display `fullName[currentLocale]`, `title[currentLocale]`, etc.
- Resume download: `<a href="resumeUrls[currentLocale]">` with download attribute
- Social links: map platform enum to Lucide icon name, render as icon buttons
- Availability: conditional badge ("Open to freelance & side projects")
- Graceful fallback if Profile not yet created (show placeholder/coming soon)

## Technical Considerations

### Architecture

Follows established module pattern with key differences:

```
modules/profile/
├── application/
│   ├── commands/
│   │   ├── upsert-profile.handler.ts        # Create or update (single command)
│   │   ├── update-profile-avatar.handler.ts
│   │   └── update-profile-og-image.handler.ts
│   ├── queries/
│   │   ├── get-profile.handler.ts            # Admin (full)
│   │   ├── get-public-profile.handler.ts     # Public (filtered)
│   │   └── get-json-ld.handler.ts
│   ├── ports/
│   │   └── profile.repository.port.ts
│   ├── services/
│   │   └── json-ld-person.generator.ts       # Schema.org Person builder
│   ├── profile.dto.ts
│   ├── profile.presenter.ts
│   └── profile.token.ts
├── domain/
│   ├── entities/
│   │   └── profile.entity.ts
│   ├── profile.error.ts
│   └── profile.types.ts
├── infrastructure/
│   ├── mapper/
│   │   └── profile.mapper.ts
│   └── repositories/
│       └── profile.repository.ts
├── presentation/
│   └── profile.controller.ts
├── profile.module.ts
└── index.ts
```

**Key differences from other modules:**
- **Upsert** instead of separate create + update commands
- **No list query** — single record, no pagination
- **No delete command** — never deleted
- **Two GET variants** — public (filtered) and admin (full)
- **JSON-LD generator** — new pattern, service in application layer
- **No slug, no soft delete**

### Dependencies

- **Existing:** `UserModule` (1:1 relation), `MediaModule` (avatar, ogImage relations), `AuthModule` (admin guard)
- **Enum changes:** SocialPlatform and Availability enums need migration (removing values is destructive — needs careful handling)
- **Landing page:** First module to provide dynamic data to landing — establishes the data-fetching pattern

### Integration Points

- `MediaModule` — avatar and ogImage are FK references to Media
- `AuthModule` — admin endpoints require JWT + ADMIN role
- `Landing app` — public profile endpoint + SSR data fetching + JSON-LD injection
- `Console app` — profile settings page
- **Future:** Experience, Project modules will reference Profile indirectly (same owner)

### Translatable JSON Pattern (New)

This is the first module using JSON translatable fields. The pattern established here will be reused by Experience, Project, BlogPost.

**Validation approach:**
```typescript
// Strict: both languages required
const TranslatableSchema = z.object({ en: z.string().min(1), vi: z.string().min(1) });

// Lenient: at least one language
const PartialTranslatableSchema = z.object({ en: z.string().optional(), vi: z.string().optional() })
  .refine(d => d.en || d.vi, 'At least one language required');
```

**Reading approach:**
```typescript
// In presenter or landing page
function getLocalized(field: TranslatableJson, locale: 'en' | 'vi'): string {
  return field[locale] || field['en'] || Object.values(field)[0] || '';
}
```

Fallback chain: requested locale → en → first available → empty string.

## Risks & Warnings

**Enum migration (removing values) is destructive**

- Removing `FACEBOOK`, `INSTAGRAM`, `YOUTUBE` from SocialPlatform is a destructive migration
- Prisma will reject if any existing data uses those values
- Mitigation: Since no Profile records exist yet and socialLinks is a JSON field (not an enum column), the enum values are only used in application code, not as column values. But any existing Skill/Category records using these enums need checking. Safe approach: add new values first, deploy, then remove old values in a separate migration.

**JSON field validation complexity**

- 6 JSON fields (translatable x4, socialLinks, certifications, resumeUrls, openTo) need thorough Zod validation
- Invalid JSON could corrupt the Profile
- Mitigation: Strict Zod schemas with runtime validation in command handlers. Never trust raw JSON input.

**Landing page SSR data fetching**

- First time landing page fetches data from API — establishes a critical pattern
- If API is down, landing page must still render (SSR fallback)
- Mitigation: Graceful degradation — show placeholder content if Profile API fails. Cache Profile data with short TTL.

**Single record concurrency**

- Two admin tabs editing Profile simultaneously could cause overwrite
- Mitigation: Low risk (single admin user, rare scenario). `updatedAt` optimistic locking can be added later if needed.

**SEO meta length validation**

- metaTitle should be max ~60-70 chars, metaDescription max ~155-160 chars for optimal display
- Mitigation: Zod schema enforces max lengths. Console form shows character counters.

## Alternatives Considered

### Profile as JSON on User vs Separate Entity

- **JSON on User:** Simpler, no migration, one fewer table
- **Separate entity (chosen):** Clean separation (auth vs personal), proper relations (avatar, ogImage), follows DDD, reusable pattern
- **Why separate:** User is an auth entity; Profile is a content entity. Mixing them violates single responsibility. Separate entity also allows public access without exposing auth fields.

### Translatable fields: JSON vs Separate Records

- **Separate records per language** (like Project/BlogPost in schema design): More normalized, queryable per language
- **JSON per field (chosen):** Profile is a single record — creating 2 records (en/vi) for one profile is awkward. JSON `{ en, vi }` keeps it simple.
- **Why JSON:** Single record invariant (PRF-001) makes separate-records unnatural. JSON is the right pattern for a fixed small number of languages on a single entity.

### Certifications: Separate Entity vs JSON

- **Separate entity:** More structured, queryable, relations possible
- **JSON array (chosen):** Max ~10 items career-long, no need for filtering/search, no relations
- **Why JSON:** Avoids entity/migration overhead for a simple list that rarely changes. Can extract to entity later if needed.

## Success Criteria

### Backend

- [ ] Prisma schema applied with all ~28 fields, enum updates, relations
- [ ] Domain entity with single-record invariant, upsert pattern
- [ ] Upsert command with full JSON field validation (translatable, socialLinks, certifications)
- [ ] Public profile query returns filtered fields (no address, no phone)
- [ ] Admin profile query returns all fields
- [ ] JSON-LD Person generator produces valid Schema.org output
- [ ] Avatar and OG Image update via Media relations
- [ ] Unit tests for all commands, queries, and JSON-LD generator

### Frontend (Console)

- [ ] Profile settings page with tabbed/sectioned form
- [ ] Translatable inputs (en/vi fields) for name, title, bios
- [ ] Dynamic array forms for social links and certifications
- [ ] Avatar upload with preview (Media module integration)
- [ ] OG Image upload with preview
- [ ] Character counters on metaTitle (70) and metaDescription (160)
- [ ] JSON-LD preview panel
- [ ] Save with success/error feedback

### Frontend (Landing)

- [ ] Hero section displays dynamic Profile data (name, title, bioShort, avatar)
- [ ] About section displays bioLong, yearsOfExperience, location
- [ ] Social links render as icon buttons with correct platform icons
- [ ] Resume download button serves locale-aware URL
- [ ] Availability badge displays status + openTo preferences
- [ ] JSON-LD Person injected in `<head>` via SSR
- [ ] Graceful fallback when Profile not yet created
- [ ] Multi-language: all translatable fields respond to locale switch

### Integration

- [ ] E2E: create Profile via admin → verify on public endpoint → verify on landing page
- [ ] E2E: update Profile → landing page reflects changes
- [ ] E2E: public endpoint excludes private fields (phone, address)
- [ ] JSON-LD validates against Schema.org spec

## Estimated Complexity

**L (Large)**

**Reasoning:**

- ~28 fields with 6 JSON fields requiring complex Zod validation
- New pattern: translatable JSON fields (first module to establish this)
- Console form is complex: multiple sections, dynamic arrays, media uploads, JSON-LD preview
- Landing page integration: first dynamic data, SSR fetching pattern, JSON-LD injection
- Enum migration requires careful handling (destructive changes)
- Three frontend touchpoints: console settings, landing hero, landing about

## Specialized Skills

- **prisma-migrate** — Prisma migration + destructive enum change handling → task 205
- **be-test** — BE unit/integration test writer (analyze logic → plan → write → validate) → tasks 208, 210
- **aqa-expert** — E2E test patterns (POM, SSR testing, Playwright) → task 214
- **ng-lib** — Angular library generator for Nx monorepo → task 212

## Status

broken-down

> Broken down into tasks 205-214 on 2026-03-29

## Created

2026-03-29

## Follow-Up Notes

### Pattern Reuse

The translatable JSON pattern established here will be reused by:
- Experience module (company names, descriptions)
- Project module (title, description, content)
- BlogPost module (title, excerpt, content)

Extracting `TranslatableSchema`, `getLocalized()`, and translatable input components into shared libs during this epic ensures smooth reuse.

### Landing Page Data Fetching Pattern

This is the first module to provide dynamic data to the landing page. The pattern established here (service → SSR fetch → fallback) will be the template for all future landing page data (Projects, Blog Posts, Experience).
