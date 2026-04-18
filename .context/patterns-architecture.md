# Architecture Patterns

> Architectural decisions, module boundaries, and backend/frontend structure.
> For design system and component patterns, see `design/foundations.md`.

## Architecture

### Overview

Monorepo structure with two applications sharing common packages:

1. **Landing Page** - Public-facing portfolio website (SSG/SSR)
2. **Dashboard** - Internal admin panel for content management

### Backend

- **Style:** Layered architecture with CQRS
- **Layers:**
  - Controllers (thin transport adapters — no validation, no business logic, no error throwing)
  - Application (Commands/Queries — own validation via Zod `safeParse`, orchestrate domain)
  - Domain (entities, value objects, domain services)
  - Infrastructure (repositories, persistence, external services)
- **Pattern:** Dependency injection, repository pattern, CQRS
- **Domain Approach:** CRUD with structured data models

#### Validation Rule

**Validation belongs in Command/Query Handlers (Application Layer), never in Controllers.**

- Controllers accept raw `unknown` DTOs and pass them to commands/queries
- Command/query handlers validate input via Zod `safeParse` before processing
- This ensures commands are self-validating regardless of transport (HTTP, events, CLI)
- Do NOT use NestJS `ValidationPipe` or `ZodValidationPipe` in controllers

```ts
// Controller — thin, passes raw input
@Post()
async create(@Body() body: unknown): Promise<{ id: string }> {
  return await this.commandBus.execute(new CreateCommand(body));
}

// Command handler — owns validation
async execute(command: CreateCommand): Promise<string> {
  const { success, data, error } = CreateSchema.safeParse(command.dto);
  if (!success) throw BadRequestError(error, { layer: ErrorLayer.APPLICATION, remarks: 'Creation failed' });
  // ... proceed with validated data
}
```

#### Controller Rule — No Error Throwing

**Controllers must NEVER throw errors.** Controllers are thin transport adapters that only:

1. Extract input from the request (`@Body()`, `@Param()`, `@Query()`)
2. Dispatch to command/query bus
3. Return the result

All error throwing (validation, not-found, authorization) belongs in **command/query handlers** (Application Layer). This follows the hexagonal architecture principle: controllers are an outer adapter and must not contain business logic or error decisions.

```ts
// ❌ BAD — controller throws error
@Get(':id')
async getById(@Param('id') id: string) {
  const user = await this.queryBus.execute(new GetUserByIdQuery(id));
  if (!user) throw NotFoundError('User not found');  // ← logic in controller
  return user;
}

// ✅ GOOD — handler owns the error
@Get(':id')
async getById(@Param('id') id: string) {
  return await this.queryBus.execute(new GetUserByIdQuery(id));  // handler throws if not found
}
```

#### Error Handling

**All errors use a centralized error system from `@portfolio/shared/errors`.** Never throw raw NestJS exceptions or plain `Error`.

**Structure:**
- `DomainError` — Application/domain-level errors (validation, not-found, unauthorized). Private constructor, factory functions, serializable.
- `InfrastructureError` — Infra-level errors (DB failures, external services). Includes `cause` chain.
- `ErrorLayer` enum — Tags error origin: `APPLICATION`, `DOMAIN`, `INFRASTRUCTURE`, `CORE`.
- Error code enums per module — Typed enums (e.g., `UserErrorCode.NOT_FOUND`), not free-form strings.
- Zod error formatter — Flattens Zod v4 errors into `{ fieldName: string[] }` shape, integrated into `BadRequestError`.
- `DomainExceptionFilter` — Global filter in `apps/api` that catches `DomainError`/`InfrastructureError` and serializes the response.

**Factory functions:** `BadRequestError()`, `NotFoundError()`, `UnauthorizedError()`, `ForbiddenError()`, `InternalServerError()`.

**Usage in handlers:**
```ts
import { BadRequestError, ErrorLayer } from '@portfolio/shared/errors';

if (!success) throw BadRequestError(error, { layer: ErrorLayer.APPLICATION, remarks: 'User creation failed' });
```

**Usage in value objects (throw directly, no handler try/catch):**
```ts
import { BadRequestError, ErrorLayer } from '@portfolio/shared/errors';

static from(id: string): string {
  if (!validate(id)) {
    throw BadRequestError(`Invalid UUID: ${id}`, { layer: ErrorLayer.DOMAIN });
  }
  return id;
}
```

#### Response Shaping — Presenter Pattern

**Domain entities must NOT contain `toResponse()` or `toDTO()` methods.** Response shaping uses a dedicated **Presenter** class in the Application layer.

**Why:** Domain entities model business rules. Making them aware of DTOs (a presentation concept) violates separation of concerns and the Dependency Rule (inner layer knowing about outer layer). Different consumers (REST, GraphQL, events) need different shapes — the entity shouldn't know about any of them.

**Pattern:** Each module has a `{Module}Presenter` class with static `toResponse()` method(s):

```ts
// application/category.presenter.ts
export class CategoryPresenter {
  static toResponse(category: Category): CategoryResponseDto {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      // ... only fields needed by the API consumer
    };
  }
}

// In query handlers:
return {
  data: categories.map(CategoryPresenter.toResponse),
  total, page, limit,
};
```

**Rules:**
- One Presenter per module, co-located in `application/` alongside DTOs
- Query handlers use `Presenter.toResponse()` instead of inline object mapping
- Presenter only reads from entity's public getters — never accesses `.props` directly
- If a module needs multiple response shapes, add methods: `toResponse()`, `toSummary()`, `toDetail()`

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
│   ├── landing/          # Public portfolio site (Angular SSR)
│   ├── landing-e2e/      # Playwright E2E tests
│   ├── api/              # NestJS backend API
│   └── api-e2e/          # API integration tests
│
├── libs/
│   ├── shared/           # Global shared (FE + BE)
│   │   ├── types/        # @portfolio/shared/types
│   │   ├── utils/        # @portfolio/shared/utils
│   │   └── testing/      # @portfolio/shared/testing
│   │
│   └── landing/          # Landing app scope
│       ├── shared/
│       │   ├── data-access/  # @portfolio/landing/shared/data-access
│       │   ├── ui/           # @portfolio/landing/shared/ui
│       │   └── util/         # @portfolio/landing/shared/util
│       │
│       ├── feature-projects/     # Future feature libs
│       ├── feature-skills/
│       └── feature-experience/
│
└── data/
    └── mock/             # Stage 1: Mock JSON data
```

### Library Scoping & Module Boundaries

Libraries are organized by scope with ESLint `@nx/enforce-module-boundaries` enforcement.

#### Tag System

| Scope           | Tags                                  | Import Path                         |
| --------------- | ------------------------------------- | ----------------------------------- |
| Global shared   | `scope:shared`, `type:{name}`         | `@portfolio/shared/{name}`          |
| Landing shared  | `scope:landing`, `type:shared-{type}` | `@portfolio/landing/shared/{type}`  |
| Landing feature | `scope:landing`, `type:feature`       | `@portfolio/landing/feature-{name}` |

#### Dependency Rules

```
Features → Landing Shared → Global Shared
```

- Features cannot import other features directly
- `scope:shared` cannot import `scope:landing`
- `type:shared-data-access` cannot import `type:shared-ui` or `type:feature`
- `type:shared-ui` cannot import `type:feature` (may import data-access for shell state)
- `type:shared-util` cannot import `type:shared-ui`, `type:shared-data-access`, or `type:feature` (lowest layer)

Use `/ng-lib` skill to generate new libraries with correct tags.

#### Console Shared-Lib Taxonomy

`libs/console/shared/` has three libs with distinct roles:

- **`util`** — pure TS/Angular utilities: constants (`DEFAULT_PAGE_SIZE`, `STORAGE_KEYS`, `FILTER_DEBOUNCE_MS`), shared types/DTOs (`MediaItem`, `UserProfile`, `LoginResponse`), validators (`passwordsMatchValidator`, `maxDecimalsValidator`), error infrastructure (`ApiError`, `FormErrorPipe`, `ServerErrorDirective`, `ValidationErrorService`, `ErrorDataService`, `RewardEarlyErrorStateMatcher`), Material provider config, unsaved-changes guard. No HTTP calls, no feature logic. **Anything sharable across features that isn't a service-over-HTTP or a component.**
- **`data-access`** — HTTP clients and app state: `ApiService`/`API_CONFIG`/`provideApi`, HTTP interceptors, route guards, `AuthStore`, `ThemeService`, `UnreadBadgeService`, `MediaService`. Consumes util types; never imports UI or features.
- **`ui`** — presentational components used across features (layouts, dialogs, filter bars, toast, asset grid, markdown editor, etc.). May consume data-access services for shell chrome (e.g., `main-layout` uses `AuthStore`), but must not import features.

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

#### Shared Libraries

| Library                    | Import Path                             | Responsibility                            |
| -------------------------- | --------------------------------------- | ----------------------------------------- |
| shared/types               | `@portfolio/shared/types`               | TypeScript interfaces shared across FE+BE |
| shared/utils               | `@portfolio/shared/utils`               | Utilities shared across FE+BE             |
| shared/errors              | `@portfolio/shared/errors`              | Centralized error classes and factories   |
| shared/testing             | `@portfolio/shared/testing`             | Test factories and mocks                  |
| landing/shared/data-access | `@portfolio/landing/shared/data-access` | API services, state management            |
| landing/shared/ui          | `@portfolio/landing/shared/ui`          | Landing-specific UI components            |
| landing/shared/util        | `@portfolio/landing/shared/util`        | Landing-specific utilities                |

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

### Angular Material Integration

#### When to Use Material vs Custom Components

- **Use Material** for: form controls (inputs, selects, checkboxes), data tables, dialogs/overlays, date pickers, progress indicators, snackbars
- **Use custom components** for: hero sections, project cards, navigation, marketing layouts — anything highly design-specific

#### Theme Token Override Pattern

Material M3 tokens are overridden in `libs/landing/shared/ui/src/styles/material/overrides.scss` via `mat.theme-overrides()`:

```scss
@use '@angular/material' as mat;

html {
  color-scheme: light dark;

  @include mat.theme(
    (
      color: mat.$azure-palette,
      typography: 'Inter',
      density: 0,
    )
  );

  @include mat.theme-overrides(
    (
      primary: var(--color-primary),
      on-primary: var(--color-text-on-primary),
      surface: var(--color-surface),
      on-surface: var(--color-text),
    )
  );
}
```

#### Dark Mode Behavior

- Buttons respond correctly to `.dark` class on `<html>` — primary color shifts to lighter shade
- `mat-card` uses its own M3 surface elevation token (not fully overridden) — card stays light in dark mode
- To fully dark-theme cards, add explicit dark override: `.dark { @include mat.theme-overrides((surface: var(--color-surface))) }`

#### Avoiding Tailwind/Material Conflicts

- Material components use `::ng-deep` encapsulation — Tailwind utilities applied **inside** Material components may be overridden
- Prefer `mat.theme-overrides()` for styling Material internals rather than utility classes
- No z-index conflicts observed — CDK overlay container sits above content correctly
- Tailwind `rounded-*`, `shadow-*` etc. should NOT be applied directly to `mat-button` or `mat-card` — use wrapping divs instead

## Code Patterns

### Styling Patterns

#### SCSS Organization

- **Style Language:** SCSS (Sass) for all components and global styles
- **File Extensions:** `.scss` exclusively (no `.css` files in source)
- **Naming:** Component styles follow component name (e.g., `button.component.scss`)

#### SCSS Structure

```scss
// Component styles use SCSS features
.component-name {
  // Variables
  $component-spacing: 1rem;

  // Nesting
  &__element {
    padding: $component-spacing;

    &--modifier {
      color: blue;
    }
  }

  // Media queries
  @media (min-width: 768px) {
    padding: 2rem;
  }
}
```

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

- Components: `PascalCase.ts` (e.g., `ProjectCard.component.ts`)
- Component Styles: `PascalCase.scss` matching component (e.g., `ProjectCard.component.scss`)
- Global Styles: `kebab-case.scss` (e.g., `styles.scss`, `theme-variables.scss`)
- Hooks: `camelCase.ts` with `use` prefix (e.g., `useProjects.ts`)
- Utilities: `camelCase.ts` (e.g., `formatDate.ts`)
- Types: `PascalCase.ts` or `types.ts`
- API routes: `kebab-case` (e.g., `/api/blog-posts`)

### Code

- Interfaces: `PascalCase` with `I` prefix optional (prefer without)
- Types: `PascalCase`
- Functions: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE`
- CSS classes: `kebab-case` with BEM for components (`.component-name__element--modifier`)
- SCSS variables: `$kebab-case` (e.g., `$primary-color`, `$base-spacing`)

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

> For TDD workflow, coverage targets, and subagent usage, see `testing-guide.md`

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
