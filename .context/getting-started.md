# Getting Started

## Prerequisites

- **Node.js:** 20+ LTS
- **pnpm:** 10+ (`npm install -g pnpm`)
- **Git**

## Setup

```bash
# Clone and install
git clone <repo-url>
cd portfolio
pnpm install        # Also sets up Husky pre-commit hooks via `prepare` script
```

## Running the Project

```bash
# Landing app (Angular SSR) — http://localhost:4200
pnpm dev:landing

# API server (NestJS) — http://localhost:3000/api
pnpm dev:api

# Both in parallel
pnpm dev
```

## Testing

```bash
pnpm test              # All tests
pnpm test:coverage     # With coverage reports
pnpm test:e2e          # Playwright E2E tests
```

## Key Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page (home) |
| `/ddl` | Design system showcase (all UI components) |
| `/api` | API root (NestJS) |

## Project Structure

See `.context/patterns-architecture.md` for full monorepo structure and module boundaries.

## Automation

- **Pre-commit hook:** Auto-formats staged `.ts/.html/.scss` files with Prettier (Husky + lint-staged)
- **CI pipeline:** GitHub Actions runs format check, lint, type check, test, and build on every push/PR to `master`

## Common Tasks

| Task | Command |
|------|---------|
| Type-check after edits | `npx tsc --noEmit` |
| Format a file | `npx prettier --write <file>` |
| Test affected projects | `npx nx affected -t test` |
| Find an Nx project name | `npx nx show projects \| grep -i "<term>"` |
| View dependency graph | `pnpm graph` |
