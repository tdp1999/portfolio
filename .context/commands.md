# Commands Reference

## Development

```bash
pnpm dev:landing          # Run Angular landing app with SSR (port 4200)
pnpm dev:api              # Run NestJS API server (port 3000)
pnpm dev                  # Run both FE & BE in parallel
```

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

# Nx specific
npx nx test <project>     # Run tests for specific project
npx nx affected -t test   # Test only affected projects
```

## Linting & Formatting

```bash
pnpm lint                 # Lint all projects
pnpm lint:fix             # Auto-fix linting issues
pnpm format               # Format code with Prettier
pnpm format:check         # Check formatting without fixing
```

## Nx Utilities

```bash
pnpm graph                # View project dependency graph
npx nx show project <name> --json  # Show project configuration
npx nx affected:graph     # Show affected projects graph
```
