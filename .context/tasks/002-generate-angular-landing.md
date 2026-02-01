# Task: Generate Angular 20 Landing App with SSR

## Status: completed

## Goal
Generate the Angular 20 landing page application with Server-Side Rendering enabled.

## Context
The landing app is the public-facing portfolio website. SSR is required for SEO and performance. Angular 20 uses the `@angular/ssr` package for SSR support.

## Acceptance Criteria
- [ ] Angular 20 app generated in `apps/landing/`
- [ ] SSR enabled and configured
- [ ] `nx serve landing` starts dev server with SSR
- [ ] `nx build landing` produces SSR-ready production build
- [ ] App runs without errors in browser

## Technical Notes
```bash
nx add @nx/angular
nx g @nx/angular:app landing --style=scss --routing=true --ssr=true
```

Ensure Angular version is 20.x by checking package.json after generation.

Angular 20 SSR uses:
- `@angular/ssr` package
- `server.ts` for Express server
- Hydration enabled by default

## Files to Touch
- apps/landing/*
- nx.json (updated with landing project)
- package.json (Angular dependencies added)

## Dependencies
- 001-init-nx-workspace

## Complexity: M
