# Epic: Database Architecture

## Summary

Design and implement a PostgreSQL database architecture using a **Hybrid Prisma + Hexagonal Architecture** approach, hosted on Railway (PostgreSQL). Prisma handles schema definition, migrations, and type-safe database access, while Domain Entities with DDD patterns encapsulate business logic. The database will support the portfolio's core entities (Users, Profile, Projects, Blog Posts, Skills, Experience, Contact Messages) with features including GitHub API sync, custom analytics tracking, soft deletes, and slug-based URLs. Built to serve both the public landing page and admin dashboard.

## Why

- **Single source of truth** for all portfolio content
- **Enable dynamic content management** via admin dashboard instead of hardcoded data
- **Support analytics** to understand visitor behavior
- **GitHub integration** to auto-sync project data and reduce manual entry
- **Professional data architecture** that demonstrates backend skills to recruiters

## Target Users

- **Admin (you):** Managing content through dashboard
- **Visitors/Recruiters:** Consuming content on landing page
- **GitHub API:** Syncing project data automatically

## Scope

### In Scope

- Database schema design for all core entities
- Prisma setup and configuration with NestJS
- PostgreSQL connection (Docker local, Railway production)
- Soft delete pattern for all entities
- Slug generation for SEO-friendly URLs
- Media table for centralized asset management
- GitHub sync data model (repos, stars, languages, README, topics)
- Custom analytics tables (page views, referrers)
- Contact form message storage with 1-year retention
- Database seeding for development
- Migration strategy

### Out of Scope

- API endpoints (separate epic)
- Admin dashboard UI (separate epic)
- Full-text search implementation (nice-to-have, future)
- Testimonials entity (future)
- Multi-tenancy / multiple users
- Real-time features (websockets)
- Advanced analytics (heatmaps, session tracking)

## High-Level Requirements

### 1. Database Setup

1. ✅ PostgreSQL via Docker (local) + Railway (production)
2. ✅ Prisma v7 with PrismaPg adapter integrated in NestJS
3. ✅ Environment variables configured
4. ✅ Migration workflow established (10 migrations applied)
5. Create seed script for development data (pending)

### 2. Core Entities

#### User (Admin)

- Single admin user for authentication
- Email, hashed password, name
- Created/updated timestamps
- No roles system needed (single user)

#### Profile (Personal Info)

- Full name (translatable JSON: `{ "en": "...", "vi": "..." }`)
- Professional title/position (translatable JSON)
- Bio/summary short (translatable JSON)
- Bio/summary long (translatable JSON)
- Years of experience (total, number)
- Email (public contact), phone (optional)
- Location - city, country (translatable JSON for display)
- Social links (GitHub, LinkedIn, Twitter, etc. - JSON array)
- Avatar/profile photo (relation to Media)
- Resume file URLs (JSON: `{ "en": "url", "vi": "url" }`)
- Availability status (open to work, employed, freelancing)
- Preferred contact method
- Single record (site owner profile)

#### Project

- Title, slug (unique, always English), description, content (rich text)
- Language field (`en` | `vi` - one language per record)
- Technologies used (relation to Skills)
- Start date, end date (nullable for ongoing)
- Featured flag (for homepage highlight)
- Status: draft / published
- GitHub repo URL (optional, for sync)
- Live URL, source URL
- Media relations (images, screenshots)
- Soft delete support
- SEO metadata (meta title, meta description)
- Note: Same project in multiple languages = separate records with different slugs

#### Blog Post

- Title, slug (unique, always English), excerpt, content (rich text)
- Language field (`en` | `vi` - one language per record)
- Author (relation to User)
- Categories (many-to-many)
- Tags (many-to-many)
- Status: draft / published
- Published date
- Featured image (relation to Media)
- Soft delete support
- SEO metadata
- Read time (calculated or stored)
- Note: Same post in multiple languages = separate records with different slugs

#### Skill

- Name, slug
- Category (Frontend, Backend, DevOps, Tools, etc.)
- Years of experience
- Icon/logo URL (optional)
- Display order (for manual sorting)
- Projects relation (derived: "Used in X projects")

#### Experience

- Company name, position/title
- Start date, end date (nullable for current)
- Description (rich text)
- Location (city, remote indicator)
- Company logo (relation to Media)
- Technologies/skills used (relation to Skills)
- Display order

#### Contact Message

- Name, email, subject, message
- Created timestamp
- Read flag (for admin)
- Archived flag
- Auto-delete after 1 year (retention policy)

#### Category (Blog)

- Name, slug
- Description (optional)
- Post count (derived)

#### Tag (Blog & Projects)

- Name, slug
- Usage count (derived)

#### Media

- Filename, original filename
- URL (Cloudinary/external storage)
- Alt text
- MIME type
- File size
- Uploaded by (relation to User)
- Created timestamp
- Used by (polymorphic: projects, posts, experience)

### 3. GitHub Sync Data

#### GitHubRepo (cached/synced data)

- GitHub repo ID (external)
- Name, full name, description
- Stars count, forks count, watchers
- Primary language, all languages (JSON)
- Topics/tags (array)
- README content (markdown)
- Last commit date
- Created at, updated at (GitHub dates)
- Last synced timestamp
- Linked Project (optional relation)

### 4. Analytics Tables

#### PageView

- Path/URL
- Referrer (nullable)
- User agent (for device/browser parsing)
- Country/region (from IP, nullable)
- Timestamp
- Session ID (anonymous, for grouping)

#### ProjectView (specific tracking)

- Project ID (relation)
- Timestamp
- Referrer

#### PostView (specific tracking)

- Post ID (relation)
- Timestamp
- Referrer

### 5. Common Patterns

#### Audit Fields (Every Entity)

Following the Architecture Blueprint, all entities include:

```typescript
{
    id: string;          // UUID v7 (time-ordered)
    createdAt: string;   // ISO timestamp
    createdById: string; // User who created
    updatedAt: string;   // ISO timestamp
    updatedById: string; // User who last updated
    deletedAt?: string;  // Soft delete timestamp
    deletedById?: string;// User who deleted
}
```

#### Other Patterns

- Soft delete: `deletedAt` + `deletedById` (nullable)
- Slugs: auto-generated from title, unique, URL-safe, always English
- Timestamps: UTC
- IDs: UUID v7 (time-ordered for better indexing)

## Technical Considerations

### Architecture (Hybrid Prisma + Hexagonal/DDD)

Following the `ARCHITECTURE_BLUEPRINT.md`, we use a hybrid approach:

**Prisma handles:**

- Schema definition (`schema.prisma`)
- Migrations
- Type-safe database queries
- Generated types (replaces manual `*.persistence.ts` files)

**Domain layer handles:**

- Domain entities with business logic (`*.entity.ts`)
- Static factories: `Entity.create()` and `Entity.load()`
- Domain methods: `entity.update()`, `entity.delete()`
- Business invariants and calculated properties

**Infrastructure layer handles:**

- Repositories implementing ports (interfaces)
- Mappers: Prisma types ↔ Domain entities
- PrismaService for database access

#### Layer Structure per Module

```
modules/[module]/
├── domain/
│   ├── entities/
│   │   └── [entity].entity.ts      # Domain entity with business logic
│   ├── enums/
│   └── [module].error.ts           # Domain-specific errors
├── application/
│   ├── commands/                    # Write operations (CQRS)
│   ├── queries/                     # Read operations (CQRS)
│   ├── ports/
│   │   └── [name].repository.port.ts  # Repository interface
│   ├── [module].token.ts            # DI tokens
│   └── [module].dto.ts              # Zod schemas & DTOs
└── infrastructure/
    ├── repositories/
    │   └── [name].repository.ts     # Implements port, uses Prisma
    └── mapper/
        └── [entity].mapper.ts       # Prisma ↔ Domain mapping
```

#### Example: Domain Entity Pattern

```typescript
// domain/entities/project.entity.ts
export class Project {
  readonly props: IProjectProps;

  private constructor(props: IProjectProps) {
    this.props = props;
  }

  // Factory for NEW entities
  static create(data: ICreateProjectPayload, createdById: Id): Project {
    return new Project({
      ...data,
      id: IdentifierValue.v7(),
      slug: SlugValue.from(data.title),
      createdById,
      updatedById: createdById,
      createdAt: TemporalValue.now,
      updatedAt: TemporalValue.now,
    });
  }

  // Factory for LOADING from Prisma
  static load(raw: IProjectProps): Project {
    return new Project(raw);
  }

  // Domain method
  update(data: IUpdateProjectPayload, updatedById: Id): Project {
    return new Project({
      ...this.props,
      ...data,
      updatedById,
      updatedAt: TemporalValue.now,
    });
  }

  // Soft delete
  delete(deletedById: Id): Project {
    return new Project({
      ...this.props,
      deletedById,
      deletedAt: TemporalValue.now,
    });
  }
}
```

#### Example: Mapper Pattern

```typescript
// infrastructure/mapper/project.mapper.ts
import { Project as PrismaProject } from '@prisma/client';

export class ProjectMapper {
  static toDomain(prisma: PrismaProject): Project {
    return Project.load({ ...prisma });
  }

  static toPrisma(domain: Project): Omit<PrismaProject, 'id'> & { id?: string } {
    return { ...domain.props };
  }

  static toDomainArray(entities: PrismaProject[]): Project[] {
    return entities.map((e) => this.toDomain(e));
  }
}
```

#### Example: Repository with Port

```typescript
// application/ports/project.repository.port.ts
export type IProjectRepository = {
  add(entity: Project): Promise<Id>;
  update(id: Id, entity: Project): Promise<boolean>;
  remove(id: Id): Promise<boolean>;
  findById(id: Id): Promise<Project | null>;
  findBySlug(slug: string): Promise<Project | null>;
  list(query: ProjectQueryDto): Promise<Project[]>;
};

// infrastructure/repositories/project.repository.ts
@Injectable()
export class ProjectRepository implements IProjectRepository {
  constructor(private readonly prisma: PrismaService) {}

  async add(project: Project): Promise<Id> {
    const data = ProjectMapper.toPrisma(project);
    const created = await this.prisma.project.create({ data });
    return created.id;
  }

  async findById(id: Id): Promise<Project | null> {
    const record = await this.prisma.project.findFirst({
      where: { id, deletedAt: null },
    });
    return record ? ProjectMapper.toDomain(record) : null;
  }
}
```

### Dependencies

- PostgreSQL 16 (Docker local, Railway production)
- Prisma v7 with PrismaPg adapter
- `@prisma/client` for runtime
- `prisma` for development/migrations
- `@nestjs/cqrs` for Command/Query bus
- `zod` v4 for DTO validation
- Custom UUID v7 generator (`IdentifierValue.v7()`)
- Environment variables for `DATABASE_URL`

### Prisma Configuration

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  // URL provided via PrismaPg adapter, not env()
}
```

### NestJS Integration

- ✅ `PrismaService` uses PrismaPg adapter (not extending PrismaClient)
- ✅ Implements `onModuleInit` / `onModuleDestroy`
- ✅ Global module for DI across all features
- Token-based DI for repositories (following blueprint pattern)
- CQRS setup with CommandBus and QueryBus

### Data Model Relationships

```
User (1) ──────── Profile (1) [site owner info]
User (1) ──────< Blog Post (many)
User (1) ──────< Media (many)

Profile (1) ────── Media (0..1) [avatar]

Project (many) >────< Skill (many)
Project (1) ──────< Media (many)
Project (1) ────── GitHubRepo (0..1)

Blog Post (many) >────< Category (many)
Blog Post (many) >────< Tag (many)
Blog Post (1) ────── Media (0..1) [featured image]

Experience (many) >────< Skill (many)
Experience (1) ────── Media (0..1) [company logo]

Tag (many) >────< Project (many) [shared tags]
```

### Indexes

- Slug fields: unique index
- Status + deletedAt: composite for filtering published, non-deleted
- createdAt: for ordering
- Foreign keys: automatic indexes

### Soft Delete Implementation

Two approaches (choose one):

**Option A: Prisma Middleware (global)**

```typescript
// Automatically filters deleted records
prisma.$use(async (params, next) => {
  if (params.action === 'findMany' || params.action === 'findFirst') {
    params.args.where = { ...params.args.where, deletedAt: null };
  }
  return next(params);
});
```

**Option B: Repository Level (explicit, recommended)**

```typescript
// In each repository method - more explicit control
async findById(id: Id): Promise<Project | null> {
    const record = await this.prisma.project.findFirst({
        where: { id, deletedAt: null },  // Explicit filter
    });
    return record ? ProjectMapper.toDomain(record) : null;
}

// Domain entity handles the soft delete logic
async remove(id: Id, deletedById: Id): Promise<boolean> {
    const entity = await this.findById(id);
    if (!entity) return false;

    const deleted = entity.delete(deletedById);  // Domain method
    await this.prisma.project.update({
        where: { id },
        data: { deletedAt: deleted.props.deletedAt, deletedById },
    });
    return true;
}
```

**Recommendation:** Option B - explicit repository-level filtering gives more control and follows the blueprint pattern where domain entities handle business logic.

## Risks & Warnings

⚠️ **Railway hosting**

- Free trial has limited credits; Hobby plan $5/month
- **Mitigation:** Monitor usage via Railway dashboard

⚠️ **GitHub API rate limits**

- 60 requests/hour unauthenticated
- 5,000 requests/hour with personal access token
- **Mitigation:** Cache GitHub data in `GitHubRepo` table, sync on schedule (daily), not on every request

⚠️ **Prisma cold starts**

- First query after idle can be slow
- **Mitigation:** Connection pooling, consider PgBouncer if issues arise

⚠️ **Migration in production**

- `prisma migrate deploy` should be run carefully
- **Mitigation:** Test migrations locally, backup before deploying, use CI/CD

⚠️ **Slug collisions**

- Two posts with same title = same slug
- **Mitigation:** Append number suffix if slug exists (e.g., `my-post-2`)

## Alternatives Considered

### ORM: TypeORM vs Prisma vs Hybrid

- **TypeORM (Blueprint default):** Full control, decorator-based persistence entities, native NestJS support
- **Prisma only:** Better DX, generated types, simpler migrations, but less separation
- **Hybrid Prisma + DDD (Chosen):** Prisma for schema/migrations/queries, Domain entities for business logic, Mappers for conversion. Best of both worlds - Prisma simplicity with DDD patterns.

### Database: MongoDB vs PostgreSQL

- **MongoDB:** Flexible schema, good for rapid prototyping
- **PostgreSQL:** Relational integrity, better for structured data, industry standard
- **Chosen:** PostgreSQL for relational data model and Supabase free tier

### Hosting: Railway vs Supabase

- **Railway:** All-in-one, simple deployment, API + DB in one platform
- **Supabase:** Dedicated PostgreSQL, free tier but pauses after inactivity
- **Chosen:** Railway for unified deployment (API + PostgreSQL on same platform)

## Success Criteria

### Prisma Layer

- [ ] Prisma schema compiles without errors
- [ ] All entities have proper relations defined
- [ ] Migrations run successfully on Railway PostgreSQL
- [ ] Seed script populates development data
- [ ] PrismaService integrated with NestJS
- [ ] Environment variables documented

### Domain Layer

- [ ] All domain entities have `create()` and `load()` static factories
- [ ] All domain entities have `update()` and `delete()` methods
- [ ] Audit fields (createdById, updatedById, deletedById) implemented
- [ ] UUID v7 generation working

### Infrastructure Layer

- [ ] All mappers convert Prisma ↔ Domain correctly
- [ ] All repositories implement their port interfaces
- [ ] Soft delete filtering in repository queries
- [ ] Slug generation utility working

### Integration

- [ ] Token-based DI working for all repositories
- [ ] CQRS bus configured (for future command/query handlers)

## Follow-up Tasks (to be broken down)

### Phase 1: Foundation

1. **Schema Design Session** - Detailed property discussion for each entity (as requested)
2. **Prisma Setup** - Initialize Prisma in NestJS, configure Supabase connection
3. **Core Infrastructure** - PrismaService, base interfaces, shared value objects (IdentifierValue, TemporalValue, SlugValue)

### Phase 2: Core Entities (Prisma + Domain)

4. **User Module** - Prisma schema + Domain entity + Repository + Mapper
5. **Profile Module** - Prisma schema + Domain entity + Repository + Mapper
6. **Project Module** - Prisma schema + Domain entity + Repository + Mapper
7. **Blog Post Module** - Prisma schema + Domain entity + Repository + Mapper
8. **Skill Module** - Prisma schema + Domain entity + Repository + Mapper
9. **Experience Module** - Prisma schema + Domain entity + Repository + Mapper

### Phase 3: Supporting Entities

10. **Contact Message Module** - Schema + Domain + Repository
11. **Category & Tag Modules** - Schema + Domain + Repository
12. **Media Module** - Schema + Domain + Repository

### Phase 4: External Integration

13. **GitHub Sync Schema** - GitHubRepo cached data + sync service interface
14. **Analytics Schema** - PageView, ProjectView, PostView

### Phase 5: Cross-Cutting

15. **Seed Script** - Development data for all entities
16. **Zod Schemas** - DTOs for all modules (create, update, query)
17. **CQRS Setup** - CommandBus, QueryBus, base handlers

## Estimated Complexity

**L (Large)**

**Reasoning:**

- Multiple related entities (10+ tables)
- External service integration (Supabase, GitHub)
- Cross-cutting concerns (soft delete, slugs, timestamps)
- Needs thorough schema design session before implementation
- Foundation for entire backend - must be done right

## Status

broken-down

> Broken down into tasks 043-064 on 2026-02-03

---

## Sprint Backlog (Sequential)

Complete one sprint fully before starting the next.

**Sprint 1-2:** Foundation + User (done).
**Sprint 3 (Tag):** Last module in this epic. Full vertical slice (BE + FE + E2E) + extract base classes. See task files 057-067.
**Sprint 4+:** Each module will be a separate epic with full vertical slice (BE + FE + E2E).

### Future Modules (separate epics)

| Module         | Complexity | Notes                                            |
| -------------- | ---------- | ------------------------------------------------ |
| Category       | S          | Separate epic, first to validate base classes     |
| Skill          | M          | Self-referential parentSkillId                   |
| Media          | M          | File metadata, soft delete                       |
| ContactMessage | S          | Standalone, no audit FKs, expiry                 |
| GitHubRepo     | M          | Sync status, JSON fields                         |
| Profile        | L          | JSON translations, 1-to-1 User                   |
| Experience     | L          | JSON achievements, soft delete                   |
| Project        | XL         | Many relations, most complex                     |
| BlogPost       | L          | Similar to Project                               |
| Analytics      | M          | PageView, ProjectView, PostView                  |
| Junction Tables| M          | 6 many-to-many tables                            |
| Seed Script    | L          | Sample data for all entities                     |

---

## Schema Design

Completed. See [database-schema-design.md](../database-schema-design.md) for full entity definitions.

## Created

2025-02-03

## Changelog

### [2026-03-16] Tag Sprint expanded to full vertical slice

- Added FE + E2E tasks (065-067) to Tag sprint
- Extract base classes (BaseCrudEntity, BasePrismaRepository, BaseCrudController, BaseCrudService) during Tag implementation
- Base classes go in shared libs for cross-project reuse
- Decision: From Category onwards, each module = separate epic (BE + FE + E2E)
- Updated hosting references: Supabase → Railway throughout

### [2026-02-03] Restructured to Sequential Sprints

- Changed from 22 parallel tasks to sequential module development
- Created Sprint Backlog with 16 sprints
- Sprint 1-3 broken down (Foundation, User, Tag)
- Future sprints to be broken down on demand
- Each module follows 8-task pattern: Schema → Entity → Repo → DTO → Commands → Queries → Controller → Wire

### [2025-02-03] Schema Design Session Complete

- Completed detailed schema design for all 14 entities
- Exported to `.context/database-schema-design.md`
- Status changed to `ready`

### [2025-02-03] Added Hexagonal Architecture Integration

- Integrated with `ARCHITECTURE_BLUEPRINT.md` patterns
- Chose Hybrid approach: Prisma + Domain Entities + Mappers
- Added domain entity patterns with static factories
- Added mapper pattern examples
- Added repository port/adapter pattern
- Updated audit fields to include `createdById`, `updatedById`, `deletedById`
- Changed to UUID v7 for time-ordered IDs
- Restructured follow-up tasks into phases
- Expanded success criteria for all layers

### [2025-02-03] Initial draft

- Created from database requirements questionnaire
- All decisions documented from user discussion
