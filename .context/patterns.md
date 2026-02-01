# Project Patterns

> This file contains both architectural decisions and code patterns.

## Architecture

### Overview
Monorepo structure with two applications sharing common packages:
1. **Landing Page** - Public-facing portfolio website (SSG/SSR)
2. **Dashboard** - Internal admin panel for content management

### Backend
- **Style:** Layered architecture
- **Layers:**
  - Controllers (API routes, request handling)
  - Services (business logic)
  - Repositories (data access)
- **Pattern:** Dependency injection, repository pattern
- **Domain Approach:** CRUD with structured data models

### Frontend (Both Apps)
- **Style:** Feature-modules
- **Pattern:**
  - Features own their components, hooks, and utilities
  - Shared components in packages/ui
  - Shared types in packages/types
- **State Management:** React Context + hooks (or Zustand if complexity grows)

### Boundaries
- **API Style:** REST API
- **Data Flow:**
  - Dashboard → API → Database (write)
  - Landing Page → API → Database (read, with caching)
- **Stage 1:** Mock JSON data with simulated API layer

### Monorepo Structure
```
/
├── apps/
│   ├── landing/          # Public portfolio site
│   │   ├── features/
│   │   │   ├── home/
│   │   │   ├── experience/
│   │   │   ├── projects/
│   │   │   ├── blog/
│   │   │   └── contact/
│   │   ├── components/   # App-specific components
│   │   └── lib/          # App-specific utilities
│   │
│   └── dashboard/        # Internal admin panel
│       ├── features/
│       │   ├── auth/
│       │   ├── content/
│       │   ├── projects/
│       │   ├── blog/
│       │   └── settings/
│       ├── components/
│       └── lib/
│
├── packages/
│   ├── ui/               # Shared UI components
│   ├── types/            # Shared TypeScript types
│   ├── api-client/       # API client for both apps
│   └── utils/            # Shared utilities
│
├── services/
│   └── api/              # Backend API service
│       ├── controllers/
│       ├── services/
│       ├── repositories/
│       ├── models/
│       └── middleware/
│
└── data/
    └── mock/             # Stage 1: Mock JSON data
```

### Modules

#### Landing Page Features
| Feature | Responsibility |
|---------|---------------|
| home | Hero, about summary, work overview, CTA |
| experience | Professional career history display |
| projects | Side projects showcase + detail pages |
| blog | Articles listing + individual posts |
| contact | Contact form |

#### Dashboard Features
| Feature | Responsibility |
|---------|---------------|
| auth | Login, session management |
| content | Manage about, experience, skills |
| projects | CRUD for projects |
| blog | Blog post editor and management |
| settings | Site settings, resume uploads, theme config |

#### Shared Packages
| Package | Responsibility |
|---------|---------------|
| ui | Reusable UI components (buttons, cards, forms, etc.) |
| types | TypeScript interfaces and types |
| api-client | HTTP client, API endpoints, response types |
| utils | Date formatting, i18n helpers, validation |

### Domains

#### Content Domain
- **Entities:** Profile, Experience, Skill, Testimonial
- **Boundaries:** Personal information and career data
- **Managed by:** Dashboard content feature

#### Projects Domain
- **Entities:** Project, ProjectDetail, Technology
- **Boundaries:** Side projects and their metadata
- **Managed by:** Dashboard projects feature

#### Blog Domain
- **Entities:** Post, Category, Tag
- **Boundaries:** Articles and blog content
- **Managed by:** Dashboard blog feature

#### Settings Domain
- **Entities:** SiteConfig, Resume, Language
- **Boundaries:** Site-wide configuration
- **Managed by:** Dashboard settings feature

## Code Patterns

### API Layer Pattern (Stage 1)
```typescript
// Abstracted API client that works with mock data initially
interface ApiClient {
  get<T>(endpoint: string): Promise<T>;
  post<T>(endpoint: string, data: unknown): Promise<T>;
  // ...
}

// Mock implementation for Stage 1
class MockApiClient implements ApiClient {
  async get<T>(endpoint: string): Promise<T> {
    // Load from /data/mock/*.json
  }
}

// Real implementation for Stage 2+
class HttpApiClient implements ApiClient {
  // Actual HTTP calls
}
```

### Feature Module Pattern
```
feature/
├── components/       # Feature-specific components
├── hooks/           # Feature-specific hooks
├── api/             # Feature API calls
├── types.ts         # Feature types
└── index.ts         # Public exports
```

### i18n Pattern
- Translations stored in `/locales/{lang}/*.json`
- Language detection: URL param > cookie > browser preference > default
- Resume download matches current language selection

## Naming Conventions

### Files
- Components: `PascalCase.tsx` (e.g., `ProjectCard.tsx`)
- Hooks: `camelCase.ts` with `use` prefix (e.g., `useProjects.ts`)
- Utilities: `camelCase.ts` (e.g., `formatDate.ts`)
- Types: `PascalCase.ts` or `types.ts`
- API routes: `kebab-case` (e.g., `/api/blog-posts`)

### Code
- Interfaces: `PascalCase` with `I` prefix optional (prefer without)
- Types: `PascalCase`
- Functions: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE`
- CSS classes: `kebab-case` or framework convention

## File Organization

### Imports Order
1. External packages
2. Internal packages (@packages/*)
3. App-level imports (@/*)
4. Relative imports (./)

### Export Pattern
- Named exports preferred over default exports
- Re-export from feature index.ts for clean imports
