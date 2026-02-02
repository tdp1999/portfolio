# Epic: Nx Monorepo Setup

## Summary

Initialize an Nx monorepo workspace with pnpm, containing two applications (Angular 20 landing page with SSR, NestJS REST API) and four shared libraries (ui, types, api-client, utils). This establishes the foundational project structure defined in patterns.md.

## Why

- Enables code sharing between landing page and future dashboard app
- Provides consistent tooling, linting, and build processes
- Supports incremental builds and affected commands for efficient development
- Establishes the architectural foundation before feature development begins

## Target Users

- Developer (you) working on the portfolio project

## Scope

### In Scope

- Nx workspace initialization with pnpm
- Angular 20 landing app with SSR/SSG configured
- NestJS REST API app
- Four shared libraries: ui, types, api-client, utils
- ESLint + Prettier configuration
- Basic workspace structure matching patterns.md

### Out of Scope

- Dashboard app (separate epic)
- Actual feature implementation
- CI/CD pipeline setup
- Database configuration
- Husky/lint-staged pre-commit hooks
- Testing configuration beyond Nx defaults

## High-Level Requirements

1. Initialize Nx workspace with pnpm as package manager
2. Generate Angular 20 application named `landing` with SSR enabled
3. Generate NestJS application named `api`
4. Generate shared library `types` (TypeScript, buildable)
5. Generate shared library `ui` (Angular components, buildable)
6. Generate shared library `api-client` (Angular HTTP services, buildable)
7. Generate shared library `utils` (TypeScript utilities, buildable)
8. Configure ESLint with consistent rules across workspace
9. Configure Prettier for code formatting
10. Verify all apps and libs build successfully
11. Verify Angular SSR works locally

## Technical Considerations

### Architecture

- Follows monorepo structure from patterns.md
- Apps in `apps/` folder (landing, api)
- Libraries in `libs/` folder (ui, types, api-client, utils)
- Nx manages dependencies and build order

### Dependencies

- Node.js 20+ (for Angular 20 compatibility)
- pnpm installed globally
- Nx CLI

### Nx Configuration

```
workspace/
├── apps/
│   ├── landing/          # Angular 20 with SSR
│   └── api/              # NestJS REST API
├── libs/
│   ├── ui/               # Shared Angular components
│   ├── types/            # Shared TypeScript types
│   ├── api-client/       # Angular HTTP client service
│   └── utils/            # Shared utilities
├── nx.json
├── tsconfig.base.json
├── .eslintrc.json
├── .prettierrc
└── pnpm-workspace.yaml
```

### Library Import Paths

- `@portfolio/types`
- `@portfolio/ui`
- `@portfolio/api-client`
- `@portfolio/utils`

## Risks & Warnings

⚠️ **Angular SSR Complexity**

- SSR configuration can be tricky with third-party libraries
- Some browser APIs (window, document) unavailable during SSR
- Mitigation: Use Angular's `isPlatformBrowser` check or `afterNextRender` when needed

⚠️ **Nx Version Compatibility**

- Nx, Angular, and NestJS versions must be compatible
- Mitigation: Use Nx's recommended versions via generators

⚠️ **Library Dependencies**

- UI library depends on Angular, can't be used in NestJS
- api-client depends on Angular HttpClient
- types and utils should remain framework-agnostic
- Mitigation: Keep types/utils as plain TypeScript libraries

## Alternatives Considered

### Turborepo

- **Pros:** Simpler configuration, faster adoption
- **Cons:** Less integrated tooling for Angular/NestJS, fewer generators
- **Why not chosen:** Nx has first-class support for Angular and NestJS

### Separate Repositories

- **Pros:** Simpler per-project setup
- **Cons:** Code duplication, harder to share types and components
- **Why not chosen:** Monorepo is explicitly chosen in patterns.md

## Success Criteria

- [ ] `pnpm install` completes without errors
- [ ] `nx serve landing` starts Angular app with SSR
- [ ] `nx serve api` starts NestJS server
- [ ] `nx build landing` produces SSR-ready build
- [ ] `nx build api` produces NestJS build
- [ ] All four libraries build successfully
- [ ] ESLint runs across entire workspace
- [ ] Prettier formats all files consistently
- [ ] Import paths like `@portfolio/types` resolve correctly

## Estimated Complexity

M (Medium)

**Reasoning:** Standard Nx workspace setup using official generators. SSR adds some complexity but Angular 20 has mature SSR support. No custom configurations beyond defaults.

## Status

completed

## Breakdown

Broken down into tasks 001-009 on 2025-01-31
All tasks completed on 2026-02-01

## Created

2025-01-31
