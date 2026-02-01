# Portfolio

A professional portfolio website built as a startup-style landing page to showcase professional work, projects, and achievements.

## Tech Stack

- **Frontend:** Angular 21 (SSR/SSG, Signals, standalone components)
- **Backend:** NestJS 11
- **Build System:** Nx 22.4 monorepo
- **Package Manager:** pnpm
- **Testing:** Jest + Playwright

## Project Structure

```
apps/
├── landing/         # Public portfolio site (Angular SSR)
├── api/             # Backend API (NestJS)
└── api-e2e/         # API end-to-end tests

libs/
├── shared/          # Shared utilities and helpers
├── types/           # TypeScript interfaces and types
├── ui/              # Reusable UI components
├── utils/           # Common utility functions
└── api-client/      # API client for frontend apps
```

## Prerequisites

- Node.js 20+ LTS
- pnpm

## Getting Started

```bash
# Install dependencies
pnpm install

# Run development servers
pnpm dev              # Both frontend and backend
pnpm dev:landing      # Landing app only (port 4200)
pnpm dev:api          # API only (port 3000)
```

## Scripts

### Development

```bash
pnpm dev              # Run landing + API in parallel
pnpm dev:landing      # Run Angular landing app (port 4200)
pnpm dev:api          # Run NestJS API (port 3000)
```

### Build

```bash
pnpm build            # Build all projects
pnpm build:landing    # Build landing app
pnpm build:api        # Build API
```

### Testing

```bash
pnpm test             # Run all tests
pnpm test:landing     # Test landing app
pnpm test:api         # Test API
pnpm test:watch       # Run tests in watch mode
pnpm test:coverage    # Run tests with coverage
pnpm test:e2e         # Run Playwright E2E tests
pnpm test:e2e:headed  # Run E2E tests with browser UI
```

### Linting & Formatting

```bash
pnpm lint             # Lint all projects
pnpm lint:fix         # Auto-fix linting issues
pnpm format           # Format code with Prettier
pnpm format:check     # Check formatting
```

### Nx Utilities

```bash
pnpm graph            # View project dependency graph
pnpm affected:test    # Test only affected projects
pnpm affected:build   # Build only affected projects
```

## Development Approach

This project follows **Pragmatic Test-Driven Development (TDD)**:

1. Write failing test for new feature/fix
2. Implement minimal code to pass the test
3. Refactor while keeping tests green
4. Commit with tests included

### Coverage Targets

- Business logic: 80-90%
- API endpoints: 90%+
- Complex components: 70-80%

## License

MIT
