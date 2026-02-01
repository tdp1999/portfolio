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

| Feature    | Responsibility                          |
| ---------- | --------------------------------------- |
| home       | Hero, about summary, work overview, CTA |
| experience | Professional career history display     |
| projects   | Side projects showcase + detail pages   |
| blog       | Articles listing + individual posts     |
| contact    | Contact form                            |

#### Dashboard Features

| Feature  | Responsibility                              |
| -------- | ------------------------------------------- |
| auth     | Login, session management                   |
| content  | Manage about, experience, skills            |
| projects | CRUD for projects                           |
| blog     | Blog post editor and management             |
| settings | Site settings, resume uploads, theme config |

#### Shared Packages

| Package    | Responsibility                                       |
| ---------- | ---------------------------------------------------- |
| ui         | Reusable UI components (buttons, cards, forms, etc.) |
| types      | TypeScript interfaces and types                      |
| api-client | HTTP client, API endpoints, response types           |
| utils      | Date formatting, i18n helpers, validation            |

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
2. Internal packages (@packages/\*)
3. App-level imports (@/\*)
4. Relative imports (./)

### Export Pattern

- Named exports preferred over default exports
- Re-export from feature index.ts for clean imports

## Testing Patterns

### Test-Driven Development (TDD) Workflow

```
Red → Green → Refactor
1. Write failing test
2. Write minimal code to pass
3. Refactor while keeping tests green
```

### Test Structure (AAA Pattern)

```typescript
describe('ProjectService', () => {
  describe('getProject', () => {
    it('should return project when found', async () => {
      // Arrange
      const mockProject = { id: '1', title: 'Test Project' };
      mockRepository.findById.mockResolvedValue(mockProject);

      // Act
      const result = await service.getProject('1');

      // Assert
      expect(result).toEqual(mockProject);
      expect(mockRepository.findById).toHaveBeenCalledWith('1');
    });
  });
});
```

### API Endpoint Testing Pattern

```typescript
// NestJS Controller Test
describe('ProjectsController', () => {
  let controller: ProjectsController;
  let service: ProjectsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [
        {
          provide: ProjectsService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ProjectsController>(ProjectsController);
    service = module.get<ProjectsService>(ProjectsService);
  });

  describe('GET /api/projects', () => {
    it('should return array of projects', async () => {
      const projects = [{ id: '1', title: 'Project 1' }];
      jest.spyOn(service, 'findAll').mockResolvedValue(projects);

      expect(await controller.findAll()).toBe(projects);
    });
  });
});
```

### Component Testing Pattern

```typescript
// Angular Component Test
describe('ProjectCardComponent', () => {
  let component: ProjectCardComponent;
  let fixture: ComponentFixture<ProjectCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectCardComponent);
    component = fixture.componentInstance;
  });

  it('should display project title', () => {
    component.project = { id: '1', title: 'Test Project', description: 'Desc' };
    fixture.detectChanges();

    const title = fixture.nativeElement.querySelector('h3');
    expect(title.textContent).toContain('Test Project');
  });

  it('should emit click event when clicked', () => {
    const project = { id: '1', title: 'Test', description: 'Desc' };
    component.project = project;

    jest.spyOn(component.projectClick, 'emit');

    const card = fixture.nativeElement.querySelector('.project-card');
    card.click();

    expect(component.projectClick.emit).toHaveBeenCalledWith(project);
  });
});
```

### E2E Testing Pattern (Playwright)

```typescript
// tests/landing/projects.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Projects Page', () => {
  test('should display list of projects', async ({ page }) => {
    await page.goto('/projects');

    // Wait for projects to load
    await page.waitForSelector('[data-testid="project-card"]');

    // Verify projects are displayed
    const projectCards = page.locator('[data-testid="project-card"]');
    await expect(projectCards).toHaveCount(3);
  });

  test('should navigate to project detail', async ({ page }) => {
    await page.goto('/projects');

    // Click first project
    await page.click('[data-testid="project-card"]:first-child');

    // Verify navigation to detail page
    await expect(page).toHaveURL(/\/projects\/.+/);
    await expect(page.locator('h1')).toBeVisible();
  });
});
```

### Test Data Factories

```typescript
// tests/factories/project.factory.ts
export const createMockProject = (overrides = {}) => ({
  id: '1',
  title: 'Mock Project',
  description: 'A test project',
  technologies: ['TypeScript', 'React'],
  startDate: '2024-01-01',
  endDate: '2024-06-01',
  url: 'https://example.com',
  ...overrides,
});

// Usage in tests
const project = createMockProject({ title: 'Custom Title' });
```

### Mock Service Pattern

```typescript
// tests/mocks/api-client.mock.ts
export const createMockApiClient = () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
});

// Usage
const mockApiClient = createMockApiClient();
mockApiClient.get.mockResolvedValue({ data: [...] });
```

### Test Coverage Requirements

- **Business Logic (Services):** 80-90% line coverage
- **API Controllers:** 90%+ line coverage
- **Complex Components:** 70-80% line coverage
- **Utilities/Helpers:** 90%+ line coverage
- **Simple UI Components:** Optional (focus on integration/E2E instead)

### Testing Best Practices

1. **Co-locate tests:** Place `.spec.ts` files next to source files
2. **Test behavior, not implementation:** Focus on what the code does, not how
3. **One assertion per test:** Keep tests focused and clear
4. **Use descriptive test names:** `it('should return 404 when project not found')`
5. **Avoid test interdependence:** Each test should be independent
6. **Mock external dependencies:** API calls, databases, third-party services
7. **Use data-testid attributes:** For reliable E2E selectors
8. **Test error cases:** Don't just test happy paths
