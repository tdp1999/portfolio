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

### Checklist refresh

The checklist lanes and the lookup table live in the public plugin repo `tdp1999/claude-code-ctx`, folder `plugins/ctx/checklist/`. The API reads `manifest.json` there over the raw URL, then each file it lists. No token is needed.

- If the last refresh is older than 10 minutes, the docs list starts a refresh in the background and answers from the stored copy. After a failed refresh, the next one may start after 1 minute.
- The "Update checklist" button on `/checklist/templates` calls `POST /api/checklist/refresh` and waits for the result. It shows the error if a file cannot be read or parsed. The current docs stay in that case.
- GitHub caches raw files for about 5 minutes. If you press the button right after a push, it can still read the old file and say nothing changed. Press it again a few minutes later.
- To edit lanes locally and see them without a push, set `CHECKLIST_SOURCE_DIR` to the local checklist folder. It wins over `CHECKLIST_SOURCE_URL`.

Runs already made are never changed. A lane that left the manifest is archived.

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
npx tsc --noEmit -p <project>/tsconfig.app.json         # Quick .ts-only check for one project (also tsconfig.lib/spec.json)
memory_pressure | tail -1                               # Check free RAM first; below 25% free, do not build
npx nx build <app>                                      # Full type check incl. Angular templates (AOT); app only (landing/console/api), libs have no build target
```

Per-edit diagnostics come from two Claude Code plugins: `typescript-lsp` for `.ts` (needs `typescript-language-server` on `PATH`) and `angular-lsp` for `.html` templates (needs `ngserver` from `@angular/language-server`, whose minor version must match the repo's `@angular/language-service`; reinstall it after an Angular upgrade). Do not run `npx tsc --noEmit` at the repo root: there is no root `tsconfig.json`, so it only prints help.

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
3. Test affected projects (with coverage)
4. Build affected projects (this is the type check, including Angular templates)
