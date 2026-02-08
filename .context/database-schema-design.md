# Database Schema Design

> Complete schema design for the portfolio database. Generated from schema design session.

## Overview

- **Database:** PostgreSQL (Supabase)
- **ORM:** Prisma (Hybrid with Domain Entities)
- **Architecture:** Hexagonal + DDD
- **ID Strategy:** UUID v7 (time-ordered)

---

## Enums

```prisma
enum Language {
  EN
  VI
}

enum ContentStatus {
  DRAFT
  PUBLISHED
}

enum SocialPlatform {
  GITHUB
  LINKEDIN
  TWITTER
  FACEBOOK
  INSTAGRAM
  YOUTUBE
  WEBSITE
  OTHER
}

enum Availability {
  OPEN_TO_WORK
  EMPLOYED
  FREELANCING
}

enum SkillCategory {
  FRONTEND
  BACKEND
  DATABASE
  DEVOPS
  MOBILE
  TOOLS
  LANGUAGES
  OTHER
}

enum ProjectCategory {
  LANDING_PAGE
  CMS
  ERP
  E_COMMERCE
  DASHBOARD
  API
  MOBILE_APP
  LIBRARY
  CLI_TOOL
  OTHER
}

enum ProjectType {
  PERSONAL
  TEAM
  COMPANY
  OPEN_SOURCE
  FREELANCE
}

enum ProjectSize {
  SMALL       // < 1 month
  MEDIUM      // 1-3 months
  LARGE       // 3-6 months
  ENTERPRISE  // > 6 months
}

enum SyncStatus {
  SYNCED
  PENDING
  FAILED
}
```

---

## Entity 1: User (Auth)

Single admin user for authentication.

| Field                    | Type               | Constraints           | Notes                      |
| ------------------------ | ------------------ | --------------------- | -------------------------- |
| `id`                     | `String` (UUID v7) | PK                    |                            |
| `email`                  | `String`           | Unique, Not Null      | Login identifier           |
| `passwordHash`           | `String`           | Not Null              | Bcrypt hashed              |
| `name`                   | `String`           | Not Null              | Display name               |
| `lastLoginAt`            | `DateTime`         | Nullable              | Updated on login           |
| `refreshToken`           | `String`           | Nullable              | JWT refresh token (hashed) |
| `refreshTokenExpiresAt`  | `DateTime`         | Nullable              | Token expiry               |
| `passwordResetToken`     | `String`           | Nullable              | Reset token (hashed)       |
| `passwordResetExpiresAt` | `DateTime`         | Nullable              | Token expiry               |
| `createdAt`              | `DateTime`         | Not Null, Default now |                            |
| `updatedAt`              | `DateTime`         | Not Null, Auto-update |                            |

**Notes:**

- Single admin user, no roles needed
- Tokens stored hashed (not plain text)
- No soft delete

---

## Entity 2: Profile (Personal Info)

Site owner's personal information. Single record.

| Field                      | Type                   | Constraints            | Notes                          |
| -------------------------- | ---------------------- | ---------------------- | ------------------------------ |
| `id`                       | `String` (UUID v7)     | PK                     |                                |
| `userId`                   | `String`               | FK → User, Unique      | One-to-one                     |
| **Translatable Fields**    |
| `fullName`                 | `Json`                 | Not Null               | `{ "en": "...", "vi": "..." }` |
| `title`                    | `Json`                 | Not Null               | Professional title             |
| `bioShort`                 | `Json`                 | Not Null               | Short summary                  |
| `bioLong`                  | `Json`                 | Nullable               | Full bio                       |
| **Basic Info**             |
| `yearsOfExperience`        | `Int`                  | Not Null               |                                |
| `email`                    | `String`               | Not Null               | Public contact                 |
| `phone`                    | `String`               | Nullable               |                                |
| **Location**               |
| `locationCountry`          | `String`               | Nullable               | e.g., "Vietnam"                |
| `locationCity`             | `String`               | Nullable               | e.g., "Ho Chi Minh City"       |
| `locationPostalCode`       | `String`               | Nullable               |                                |
| `locationAddress1`         | `String`               | Nullable               | Street address                 |
| `locationAddress2`         | `String`               | Nullable               | Apt, suite, etc.               |
| **Social & Contact**       |
| `socialLinks`              | `Json`                 | Not Null, Default `[]` | See structure below            |
| `preferredContactPlatform` | `Enum(SocialPlatform)` | Nullable               |                                |
| `preferredContactValue`    | `String`               | Nullable               | The actual handle/URL          |
| **Media & Resume**         |
| `avatarId`                 | `String`               | FK → Media, Nullable   |                                |
| `resumeUrls`               | `Json`                 | Not Null, Default `{}` | `{ "en": "url", "vi": "url" }` |
| **Status**                 |
| `availability`             | `Enum(Availability)`   | Not Null               |                                |
| **Audit**                  |
| `createdAt`                | `DateTime`             | Not Null               |                                |
| `updatedAt`                | `DateTime`             | Not Null               |                                |
| `createdById`              | `String`               | FK → User              |                                |
| `updatedById`              | `String`               | FK → User              |                                |

**Social Links JSON Structure:**

```typescript
type SocialLink = {
  platform: SocialPlatform; // Enum value
  url: string; // Full URL
  handle?: string; // @username (optional)
};

// Example:
[
  { platform: 'GITHUB', url: 'https://github.com/yourname', handle: 'yourname' },
  { platform: 'LINKEDIN', url: 'https://linkedin.com/in/yourname' },
];
```

---

## Entity 3: Project

Portfolio projects showcase.

| Field                                                     | Type                    | Constraints               | Notes                    |
| --------------------------------------------------------- | ----------------------- | ------------------------- | ------------------------ |
| `id`                                                      | `String` (UUID v7)      | PK                        |                          |
| `slug`                                                    | `String`                | Unique, Not Null          | Always English, URL-safe |
| `language`                                                | `Enum(Language)`        | Not Null                  |                          |
| **Content**                                               |
| `title`                                                   | `String`                | Not Null                  |                          |
| `description`                                             | `String`                | Not Null                  | Short description        |
| `content`                                                 | `Text`                  | Nullable                  | Rich text / markdown     |
| `mainFunctionality`                                       | `String`                | Nullable                  | Core feature summary     |
| **Classification**                                        |
| `category`                                                | `Enum(ProjectCategory)` | Not Null                  |                          |
| `type`                                                    | `Enum(ProjectType)`     | Not Null                  |                          |
| `size`                                                    | `Enum(ProjectSize)`     | Not Null                  |                          |
| `domain`                                                  | `String`                | Nullable                  | e.g., "E-commerce"       |
| **Client**                                                |
| `clientName`                                              | `String`                | Nullable                  | Can be anonymous         |
| `clientCountry`                                           | `String`                | Nullable                  |                          |
| `clientIndustry`                                          | `String`                | Nullable                  |                          |
| **Dates**                                                 |
| `startDate`                                               | `DateTime`              | Not Null                  |                          |
| `endDate`                                                 | `DateTime`              | Nullable                  | Null = ongoing           |
| **Status & Display**                                      |
| `status`                                                  | `Enum(ContentStatus)`   | Not Null                  |                          |
| `featured`                                                | `Boolean`               | Not Null, Default `false` |                          |
| `displayOrder`                                            | `Int`                   | Not Null, Default `0`     |                          |
| **Links** (mutually exclusive: sourceUrl OR githubRepoId) |
| `liveUrl`                                                 | `String`                | Nullable                  | Deployed site            |
| `sourceUrl`                                               | `String`                | Nullable                  | Non-GitHub source        |
| `githubRepoId`                                            | `String`                | FK → GitHubRepo, Nullable |                          |
| **SEO**                                                   |
| `metaTitle`                                               | `String`                | Nullable                  |                          |
| `metaDescription`                                         | `String`                | Nullable                  |                          |
| **Media**                                                 |
| `thumbnailId`                                             | `String`                | FK → Media, Nullable      |                          |
| **Audit**                                                 |
| `createdAt`                                               | `DateTime`              | Not Null                  |                          |
| `updatedAt`                                               | `DateTime`              | Not Null                  |                          |
| `createdById`                                             | `String`                | FK → User                 |                          |
| `updatedById`                                             | `String`                | FK → User                 |                          |
| `deletedAt`                                               | `DateTime`              | Nullable                  | Soft delete              |
| `deletedById`                                             | `String`                | FK → User, Nullable       |                          |

**Relations:**

- `ProjectSkill` - Many-to-many with Skill
- `ProjectMedia` - Many-to-many with Media (gallery)
- `ProjectTag` - Many-to-many with Tag

**Note:** Same project in multiple languages = separate records with different slugs.

---

## Entity 4: BlogPost

Blog articles and technical writing.

| Field                | Type                  | Constraints               | Notes                   |
| -------------------- | --------------------- | ------------------------- | ----------------------- |
| `id`                 | `String` (UUID v7)    | PK                        |                         |
| `slug`               | `String`              | Unique, Not Null          | Always English          |
| `language`           | `Enum(Language)`      | Not Null                  |                         |
| **Content**          |
| `title`              | `String`              | Not Null                  |                         |
| `excerpt`            | `String`              | Nullable                  | Short preview           |
| `content`            | `Text`                | Not Null                  | Rich text / markdown    |
| `readTimeMinutes`    | `Int`                 | Nullable                  | Calculated or manual    |
| **Status & Display** |
| `status`             | `Enum(ContentStatus)` | Not Null                  |                         |
| `featured`           | `Boolean`             | Not Null, Default `false` |                         |
| `publishedAt`        | `DateTime`            | Nullable                  | When published          |
| **SEO**              |
| `metaTitle`          | `String`              | Nullable                  |                         |
| `metaDescription`    | `String`              | Nullable                  |                         |
| **Relations**        |
| `authorId`           | `String`              | FK → User, Not Null       | Can differ from creator |
| `featuredImageId`    | `String`              | FK → Media, Nullable      |                         |
| **Audit**            |
| `createdAt`          | `DateTime`            | Not Null                  |                         |
| `updatedAt`          | `DateTime`            | Not Null                  |                         |
| `createdById`        | `String`              | FK → User                 |                         |
| `updatedById`        | `String`              | FK → User                 |                         |
| `deletedAt`          | `DateTime`            | Nullable                  |                         |
| `deletedById`        | `String`              | FK → User, Nullable       |                         |

**Relations:**

- `PostCategory` - Many-to-many with Category
- `PostTag` - Many-to-many with Tag

---

## Entity 5: Skill

Technical skills and technologies.

| Field               | Type                  | Constraints               | Notes                      |
| ------------------- | --------------------- | ------------------------- | -------------------------- |
| `id`                | `String` (UUID v7)    | PK                        |                            |
| `name`              | `String`              | Unique, Not Null          | e.g., "TypeScript"         |
| `slug`              | `String`              | Unique, Not Null          | URL-safe                   |
| `description`       | `String`              | Nullable                  | Brief description          |
| `category`          | `Enum(SkillCategory)` | Not Null                  |                            |
| `isLibrary`         | `Boolean`             | Not Null, Default `false` | Is it a library/framework? |
| `parentSkillId`     | `String`              | FK → Skill, Nullable      | Max 1 level, no circular   |
| `yearsOfExperience` | `Int`                 | Nullable                  |                            |
| `iconUrl`           | `String`              | Nullable                  | Skill logo                 |
| `displayOrder`      | `Int`                 | Not Null, Default `0`     |                            |
| **Audit**           |
| `createdAt`         | `DateTime`            | Not Null                  |                            |
| `updatedAt`         | `DateTime`            | Not Null                  |                            |
| `createdById`       | `String`              | FK → User                 |                            |
| `updatedById`       | `String`              | FK → User                 |                            |

**Notes:**

- No soft delete - simple reference data
- `parentSkillId` allows 1 level hierarchy (e.g., Angular → TypeScript)
- Validation required: no circular references, max 1 level depth

---

## Entity 6: Experience

Professional work history.

| Field                      | Type               | Constraints               | Notes              |
| -------------------------- | ------------------ | ------------------------- | ------------------ |
| `id`                       | `String` (UUID v7) | PK                        |                    |
| `slug`                     | `String`           | Unique, Not Null          | URL-safe           |
| `language`                 | `Enum(Language)`   | Not Null                  |                    |
| **Company**                |
| `companyName`              | `String`           | Not Null                  |                    |
| `companyLogoId`            | `String`           | FK → Media, Nullable      |                    |
| `companyUrl`               | `String`           | Nullable                  |                    |
| **Position**               |
| `position`                 | `String`           | Not Null                  | Job title          |
| `description`              | `Text`             | Nullable                  | Narrative content  |
| **Location**               |
| `locationCountry`          | `String`           | Nullable                  |                    |
| `locationCity`             | `String`           | Nullable                  |                    |
| `locationPostalCode`       | `String`           | Nullable                  |                    |
| `locationAddress1`         | `String`           | Nullable                  |                    |
| `locationAddress2`         | `String`           | Nullable                  |                    |
| `isRemote`                 | `Boolean`          | Not Null, Default `false` |                    |
| **Client/Project Context** |
| `clientName`               | `String`           | Nullable                  |                    |
| `clientIndustry`           | `String`           | Nullable                  |                    |
| `domain`                   | `String`           | Nullable                  | e.g., "Fintech"    |
| **Team**                   |
| `teamSize`                 | `Int`              | Nullable                  |                    |
| `teamRole`                 | `String`           | Nullable                  | e.g., "Tech Lead"  |
| **Achievements**           |
| `achievements`             | `Json`             | Not Null, Default `[]`    | Array of strings   |
| **Dates**                  |
| `startDate`                | `DateTime`         | Not Null                  |                    |
| `endDate`                  | `DateTime`         | Nullable                  | Null = current job |
| **Display**                |
| `displayOrder`             | `Int`              | Not Null, Default `0`     |                    |
| **Audit**                  |
| `createdAt`                | `DateTime`         | Not Null                  |                    |
| `updatedAt`                | `DateTime`         | Not Null                  |                    |
| `createdById`              | `String`           | FK → User                 |                    |
| `updatedById`              | `String`           | FK → User                 |                    |
| `deletedAt`                | `DateTime`         | Nullable                  |                    |
| `deletedById`              | `String`           | FK → User, Nullable       |                    |

**Achievements JSON Structure:**

```typescript
// Simple array of achievement strings
[
  'Led migration from Angular 8 to Angular 15',
  'Reduced build time by 40%',
  'Mentored 3 junior developers',
];
```

**Relations:**

- `ExperienceSkill` - Many-to-many with Skill

---

## Entity 7: ContactMessage

Contact form submissions.

| Field          | Type               | Constraints               | Notes                     |
| -------------- | ------------------ | ------------------------- | ------------------------- |
| `id`           | `String` (UUID v7) | PK                        |                           |
| `name`         | `String`           | Not Null                  | Sender name               |
| `email`        | `String`           | Not Null                  | Sender email              |
| `subject`      | `String`           | Nullable                  | Optional subject          |
| `message`      | `Text`             | Not Null                  | Message body              |
| **Status**     |
| `isRead`       | `Boolean`          | Not Null, Default `false` |                           |
| `isArchived`   | `Boolean`          | Not Null, Default `false` |                           |
| `isSpam`       | `Boolean`          | Not Null, Default `false` |                           |
| **Metadata**   |
| `ipAddress`    | `String`           | Nullable                  | For spam detection        |
| `userAgent`    | `String`           | Nullable                  | Browser info              |
| **Timestamps** |
| `createdAt`    | `DateTime`         | Not Null                  | When sent                 |
| `expiresAt`    | `DateTime`         | Not Null                  | Auto-delete date (1 year) |

**Notes:**

- No soft delete - use `isArchived` or hard delete after expiry
- `expiresAt` = `createdAt + 1 year` for retention policy

---

## Entity 8: Category (Blog)

Blog post categories.

| Field          | Type               | Constraints           | Notes            |
| -------------- | ------------------ | --------------------- | ---------------- |
| `id`           | `String` (UUID v7) | PK                    |                  |
| `name`         | `String`           | Unique, Not Null      | e.g., "Tutorial" |
| `slug`         | `String`           | Unique, Not Null      | URL-safe         |
| `description`  | `String`           | Nullable              |                  |
| `displayOrder` | `Int`              | Not Null, Default `0` |                  |
| **Audit**      |
| `createdAt`    | `DateTime`         | Not Null              |                  |
| `updatedAt`    | `DateTime`         | Not Null              |                  |
| `createdById`  | `String`           | FK → User             |                  |
| `updatedById`  | `String`           | FK → User             |                  |

---

## Entity 9: Tag

Shared tags for Blog Posts and Projects.

| Field         | Type               | Constraints      | Notes              |
| ------------- | ------------------ | ---------------- | ------------------ |
| `id`          | `String` (UUID v7) | PK               |                    |
| `name`        | `String`           | Unique, Not Null | e.g., "typescript" |
| `slug`        | `String`           | Unique, Not Null | URL-safe           |
| **Audit**     |
| `createdAt`   | `DateTime`         | Not Null         |                    |
| `updatedAt`   | `DateTime`         | Not Null         |                    |
| `createdById` | `String`           | FK → User        |                    |
| `updatedById` | `String`           | FK → User        |                    |

---

## Entity 10: Media

Centralized media/file storage metadata.

| Field              | Type               | Constraints         | Notes                 |
| ------------------ | ------------------ | ------------------- | --------------------- |
| `id`               | `String` (UUID v7) | PK                  |                       |
| `originalFilename` | `String`           | Not Null            | What user uploaded    |
| `mimeType`         | `String`           | Not Null            | e.g., "image/png"     |
| `publicId`         | `String`           | Unique, Not Null    | Cloudinary's ID       |
| `url`              | `String`           | Not Null            | Cloudinary secure URL |
| `format`           | `String`           | Not Null            | e.g., "png", "pdf"    |
| `bytes`            | `Int`              | Not Null            | File size in bytes    |
| `width`            | `Int`              | Nullable            | Pixels (images only)  |
| `height`           | `Int`              | Nullable            | Pixels (images only)  |
| `altText`          | `String`           | Nullable            | Accessibility         |
| `caption`          | `String`           | Nullable            | Display caption       |
| **Audit**          |
| `createdAt`        | `DateTime`         | Not Null            |                       |
| `uploadedById`     | `String`           | FK → User, Not Null |                       |
| `deletedAt`        | `DateTime`         | Nullable            | Soft delete           |
| `deletedById`      | `String`           | FK → User, Nullable |                       |

**Media Configuration:**

```typescript
export const MEDIA_CONFIG = {
  maxFileSize: 5 * 1024 * 1024, // 5MB

  allowedTypes: {
    images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    documents: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
  },

  folders: {
    avatars: 'portfolio/avatars',
    projects: 'portfolio/projects',
    posts: 'portfolio/posts',
    logos: 'portfolio/logos',
    resumes: 'portfolio/resumes',
  },
};
```

---

## Entity 11: GitHubRepo (Cached Sync Data)

Cached GitHub repository data for sync.

| Field                  | Type               | Constraints            | Notes                     |
| ---------------------- | ------------------ | ---------------------- | ------------------------- |
| `id`                   | `String` (UUID v7) | PK                     | Our internal ID           |
| `githubId`             | `Int`              | Unique, Not Null       | GitHub's repo ID          |
| **Basic Info**         |
| `name`                 | `String`           | Not Null               | Repo name                 |
| `fullName`             | `String`           | Not Null               | owner/repo                |
| `description`          | `String`           | Nullable               |                           |
| `url`                  | `String`           | Not Null               | GitHub URL                |
| `homepageUrl`          | `String`           | Nullable               | Live site URL             |
| **Stats**              |
| `starsCount`           | `Int`              | Not Null, Default `0`  |                           |
| `forksCount`           | `Int`              | Not Null, Default `0`  |                           |
| `watchersCount`        | `Int`              | Not Null, Default `0`  |                           |
| `openIssuesCount`      | `Int`              | Not Null, Default `0`  |                           |
| **Languages & Topics** |
| `primaryLanguage`      | `String`           | Nullable               | Main language             |
| `languages`            | `Json`             | Not Null, Default `{}` | `{ "TypeScript": 45000 }` |
| `topics`               | `Json`             | Not Null, Default `[]` | `["nestjs", "prisma"]`    |
| **Content**            |
| `readmeContent`        | `Text`             | Nullable               | README markdown           |
| **GitHub Dates**       |
| `githubCreatedAt`      | `DateTime`         | Not Null               |                           |
| `githubUpdatedAt`      | `DateTime`         | Not Null               |                           |
| `githubPushedAt`       | `DateTime`         | Nullable               |                           |
| **Sync**               |
| `lastSyncedAt`         | `DateTime`         | Not Null               |                           |
| `syncStatus`           | `Enum(SyncStatus)` | Not Null               |                           |
| `syncError`            | `String`           | Nullable               | Error message if failed   |
| **Audit**              |
| `createdAt`            | `DateTime`         | Not Null               |                           |
| `updatedAt`            | `DateTime`         | Not Null               |                           |

---

## Entity 12: PageView (Analytics)

General page view tracking.

| Field        | Type               | Constraints | Notes                         |
| ------------ | ------------------ | ----------- | ----------------------------- |
| `id`         | `String` (UUID v7) | PK          |                               |
| `path`       | `String`           | Not Null    | e.g., "/projects/my-app"      |
| `referrer`   | `String`           | Nullable    | Where they came from          |
| `userAgent`  | `String`           | Nullable    | Browser info                  |
| `ipHash`     | `String`           | Nullable    | Hashed IP (privacy)           |
| `country`    | `String`           | Nullable    | From IP geolocation           |
| `city`       | `String`           | Nullable    | From IP geolocation           |
| `deviceType` | `String`           | Nullable    | "desktop", "mobile", "tablet" |
| `browser`    | `String`           | Nullable    | Parsed from UA                |
| `os`         | `String`           | Nullable    | Parsed from UA                |
| `sessionId`  | `String`           | Nullable    | Anonymous session grouping    |
| `createdAt`  | `DateTime`         | Not Null    | When viewed                   |

---

## Entity 13: ProjectView (Specific Analytics)

Project-specific view tracking.

| Field       | Type               | Constraints            | Notes |
| ----------- | ------------------ | ---------------------- | ----- |
| `id`        | `String` (UUID v7) | PK                     |       |
| `projectId` | `String`           | FK → Project, Not Null |       |
| `referrer`  | `String`           | Nullable               |       |
| `sessionId` | `String`           | Nullable               |       |
| `createdAt` | `DateTime`         | Not Null               |       |

---

## Entity 14: PostView (Specific Analytics)

Blog post-specific view tracking.

| Field       | Type               | Constraints             | Notes |
| ----------- | ------------------ | ----------------------- | ----- |
| `id`        | `String` (UUID v7) | PK                      |       |
| `postId`    | `String`           | FK → BlogPost, Not Null |       |
| `referrer`  | `String`           | Nullable                |       |
| `sessionId` | `String`           | Nullable                |       |
| `createdAt` | `DateTime`         | Not Null                |       |

---

## Junction Tables (Many-to-Many)

### ProjectSkill

| Field       | Type     | Constraints      |
| ----------- | -------- | ---------------- |
| `projectId` | `String` | FK → Project, PK |
| `skillId`   | `String` | FK → Skill, PK   |

### ProjectTag

| Field       | Type     | Constraints      |
| ----------- | -------- | ---------------- |
| `projectId` | `String` | FK → Project, PK |
| `tagId`     | `String` | FK → Tag, PK     |

### ProjectMedia

| Field          | Type     | Constraints           | Notes            |
| -------------- | -------- | --------------------- | ---------------- |
| `projectId`    | `String` | FK → Project, PK      |                  |
| `mediaId`      | `String` | FK → Media, PK        |                  |
| `displayOrder` | `Int`    | Not Null, Default `0` | Gallery ordering |

### PostCategory

| Field        | Type     | Constraints       |
| ------------ | -------- | ----------------- |
| `postId`     | `String` | FK → BlogPost, PK |
| `categoryId` | `String` | FK → Category, PK |

### PostTag

| Field    | Type     | Constraints       |
| -------- | -------- | ----------------- |
| `postId` | `String` | FK → BlogPost, PK |
| `tagId`  | `String` | FK → Tag, PK      |

### ExperienceSkill

| Field          | Type     | Constraints         |
| -------------- | -------- | ------------------- |
| `experienceId` | `String` | FK → Experience, PK |
| `skillId`      | `String` | FK → Skill, PK      |

---

## Entity Relationships Diagram

```
User (1) ──────── Profile (1)
User (1) ──────<  BlogPost (many)
User (1) ──────<  Media (many)

Profile (1) ────── Media (0..1) [avatar]

Project (many) >────< Skill (many)     [via ProjectSkill]
Project (many) >────< Tag (many)       [via ProjectTag]
Project (1)    ──────< Media (many)    [via ProjectMedia]
Project (1)    ────── GitHubRepo (0..1)
Project (1)    ────── Media (0..1)     [thumbnail]

BlogPost (many) >────< Category (many) [via PostCategory]
BlogPost (many) >────< Tag (many)      [via PostTag]
BlogPost (1)    ────── Media (0..1)    [featuredImage]
BlogPost (1)    ────── User (1)        [author]

Experience (many) >────< Skill (many)  [via ExperienceSkill]
Experience (1)    ────── Media (0..1)  [companyLogo]

Skill (many) ────── Skill (0..1)       [parentSkill, max 1 level]

ProjectView (many) ────── Project (1)
PostView (many)    ────── BlogPost (1)
```

---

## Summary

| #   | Entity         | Fields | Soft Delete | Audit Fields |
| --- | -------------- | ------ | ----------- | ------------ |
| 1   | User           | 10     | No          | Partial      |
| 2   | Profile        | 22     | No          | Yes          |
| 3   | Project        | 24     | Yes         | Yes          |
| 4   | BlogPost       | 18     | Yes         | Yes          |
| 5   | Skill          | 12     | No          | Yes          |
| 6   | Experience     | 22     | Yes         | Yes          |
| 7   | ContactMessage | 10     | No          | Partial      |
| 8   | Category       | 7      | No          | Yes          |
| 9   | Tag            | 6      | No          | Yes          |
| 10  | Media          | 14     | Yes         | Partial      |
| 11  | GitHubRepo     | 21     | No          | Partial      |
| 12  | PageView       | 12     | No          | No           |
| 13  | ProjectView    | 5      | No          | No           |
| 14  | PostView       | 5      | No          | No           |

**Junction Tables:** 6
**Enums:** 9
**Total Entities:** 14

---

## Audit Fields Pattern

All auditable entities include:

```typescript
{
  id: string;           // UUID v7 (time-ordered)
  createdAt: DateTime;  // When created
  updatedAt: DateTime;  // When last updated
  createdById: string;  // FK → User who created
  updatedById: string;  // FK → User who last updated
  deletedAt?: DateTime; // Soft delete timestamp (if applicable)
  deletedById?: string; // FK → User who deleted (if applicable)
}
```

---

## Indexes (Recommended)

| Table      | Index                            | Type      | Reason                          |
| ---------- | -------------------------------- | --------- | ------------------------------- |
| Project    | `slug`                           | Unique    | URL lookup                      |
| Project    | `status, deletedAt`              | Composite | Published, non-deleted filter   |
| Project    | `language, status`               | Composite | Language + status filter        |
| BlogPost   | `slug`                           | Unique    | URL lookup                      |
| BlogPost   | `status, deletedAt, publishedAt` | Composite | Published posts ordered by date |
| Skill      | `slug`                           | Unique    | URL lookup                      |
| Skill      | `category`                       | Index     | Category filter                 |
| Experience | `slug`                           | Unique    | URL lookup                      |
| Tag        | `slug`                           | Unique    | URL lookup                      |
| Category   | `slug`                           | Unique    | URL lookup                      |
| Media      | `publicId`                       | Unique    | Cloudinary lookup               |
| GitHubRepo | `githubId`                       | Unique    | GitHub sync                     |
| PageView   | `createdAt`                      | Index     | Time-based queries              |
| PageView   | `path`                           | Index     | Path analytics                  |

---

## Created

2025-02-03

## Related Documents

- [Epic: Database Architecture](./plans/epic-database-architecture.md)
- [Architecture Blueprint](./ARCHITECTURE_BLUEPRINT.md)
