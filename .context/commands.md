# Commands Reference

## Development

```bash
pnpm dev:landing          # Run Angular landing app with SSR (port 4200)
pnpm dev:api              # Run NestJS API server (port 3000)
pnpm dev                  # Run both FE & BE in parallel
```

### DDL (Design System Showcase)

The `/ddl` route on the landing app displays all UI components for visual testing.
Start the landing app and navigate to `http://localhost:4200/ddl`.

## Build

```bash
pnpm build:landing        # Build landing app for production
pnpm build:api            # Build API for production
pnpm build                # Build all projects
```

## Testing

```bash
pnpm test                 # Run all tests
pnpm test:landing         # Test landing app only
pnpm test:api             # Test API only
pnpm test:watch           # Run tests in watch mode
pnpm test:coverage        # Run tests with coverage reports

# E2E (Playwright)
pnpm test:e2e             # Run E2E tests headless
pnpm test:e2e:headed      # Run E2E with visible browser
pnpm test:e2e:ui          # Interactive Playwright UI mode

# Nx specific
npx nx test <project>     # Run tests for specific project
npx nx affected -t test   # Test only affected projects
```

## Linting & Formatting

```bash
pnpm lint                 # Lint all projects
pnpm lint:fix             # Auto-fix linting issues
npx prettier --write <file>  # Format a specific file manually
pnpm format:check         # Check formatting without fixing
```

> **Note:** Pre-commit hook auto-formats staged `.ts/.html/.scss` files. No global format script exists.

## Type Checking

```bash
npx tsc --noEmit          # Type-check entire project (run after edits)
```

## Nx Utilities

```bash
pnpm graph                # View project dependency graph
npx nx show project <name> --json  # Show project configuration
npx nx show projects | grep -i "<term>"  # Find project names
npx nx affected:graph     # Show affected projects graph
```

## Automation

### Pre-commit Hook (Husky + lint-staged)

Runs automatically on `git commit`:

- Formats staged `.ts`, `.html`, `.scss` files with Prettier

### CI Pipeline (GitHub Actions)

Runs on push/PR to `master` (`.github/workflows/ci.yml`):

1. Format check (`prettier --check`)
2. Lint affected projects
3. Type check (`tsc --noEmit`)
4. Test affected projects (with coverage)
5. Build affected projects
