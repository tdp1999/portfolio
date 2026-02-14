# Task: Optimize Landing Page Dev Server Performance

## Status: pending

## Goal

Reduce landing page development server startup time from 113+ seconds to under 15 seconds with stable, consistent performance.

## Context

The local development server exhibits highly unstable behavior—alternating between fast and extremely slow startup/serve times. The application builds successfully but takes 113.317 seconds, which is excessive for a ~95KB initial bundle. Additionally, Vite shows "Re-optimizing dependencies because lockfile has changed" on every start, suggesting cache invalidation or lockfile churn issues.

**Evidence from logs:**

- Build time: 113.317 seconds for small app (94.75 KB initial + ~95 KB lazy)
- SSR enabled (both browser and server bundles generated)
- Vite re-optimization triggered on every serve
- Intermittent hanging requiring Ctrl+C restart

**Current Configuration:**

- Executor: `@angular/build:dev-server` (Angular's esbuild-based, not Vite)
- SSR enabled with Express server
- Development mode: optimization=false, sourceMap=true
- Nx cache enabled globally
- 7 TypeScript path mappings for library aliases
- Node v24.8.0, pnpm 10.16.0

## Acceptance Criteria

- [ ] Dev server starts consistently in < 15 seconds
- [ ] No "lockfile has changed" messages on subsequent serves
- [ ] No intermittent hanging behavior
- [ ] Nx build cache properly utilized (cache hits on unchanged code)
- [ ] SSR build performance verified (both browser + server bundles)
- [ ] Root cause documented in task completion notes
- [ ] Applied fixes documented for future reference

## Technical Notes

**Potential Root Causes to Investigate:**

1. **Lockfile Churn:**
   - Vite message indicates `pnpm-lock.yaml` modification timestamp changing
   - May be caused by antivirus, file watcher, or pnpm phantom lock issues
   - Check if lockfile is actually changing or if it's a timestamp issue

2. **Nx Cache Issues:**
   - Verify `.nx/cache` directory health
   - Check if cache is being invalidated unnecessarily
   - Review `nx.json` targetDefaults inputs configuration

3. **SSR Double Build:**
   - Both browser and server bundles generated on every start
   - 113 seconds may indicate sequential builds instead of parallel
   - Check if SSR can be optimized or conditionally disabled in dev

4. **TypeScript Path Mappings:**
   - 7 library aliases require resolution on every build
   - May cause slower module resolution
   - Verify `isolatedModules: true` is helping

5. **Windows-Specific Issues:**
   - File watcher performance on Windows can be slow
   - Antivirus may be scanning node_modules or .nx/cache
   - Consider adding exclusions for: `node_modules/`, `.nx/`, `dist/`

6. **Angular Build Configuration:**
   - Using `@angular/build:application` executor (new esbuild-based)
   - Check if dev server options like `hmr` or `liveReload` need tuning
   - Review if `outputMode: "server"` affects dev performance

**Files to Review:**

- `apps/landing/project.json` - Serve and build configuration
- `nx.json` - Global cache and task runner settings
- `tsconfig.base.json` - Path mappings optimization
- `pnpm-lock.yaml` - Check modification timestamp behavior
- `.nx/cache/` - Verify cache directory health
- `apps/landing/src/server.ts` - SSR Express server config

**Potential Approaches:**

1. **Cache Optimization:**
   - Clear and rebuild Nx cache: `nx reset`
   - Verify cache inputs in `nx.json` are correct
   - Check if `.gitignore` excludes `.nx/cache` (should be excluded)

2. **Lockfile Stability:**
   - Add `.pnpm-store/` to antivirus exclusions
   - Check if `pnpm-lock.yaml` is in `.gitignore` (should NOT be)
   - Verify pnpm store location and health

3. **SSR Development Mode:**
   - Consider disabling SSR in development (use CSR for faster dev loop)
   - Or optimize SSR build to be incremental
   - Check if `prerender: false` helps

4. **Build Performance:**
   - Review if `sourceMap: true` is necessary (try `false` in dev)
   - Check if there are unnecessary Angular compiler options
   - Verify no circular dependencies in library structure

**Reference Project Standards:**

- Follow `.context/patterns-architecture.md` for module boundaries
- SSR is part of the architecture (Landing Page uses SSR/SSG per tech stack)
- Maintain Nx monorepo best practices

## Files to Touch

- `apps/landing/project.json` (serve/build configuration)
- `nx.json` (cache configuration)
- `tsconfig.base.json` (path mappings, if needed)
- `.gitignore` (verify cache exclusions)
- Possibly: `apps/landing/src/server.ts` (SSR optimization)

## Dependencies

None

## Complexity: M

**Reasoning:**

- Multiple potential root causes requiring investigation
- Involves Nx cache, Angular build system, and SSR configuration
- Windows-specific considerations (antivirus, file watchers)
- Not a simple config change—requires systematic debugging
- Estimated 2-3 hours: 1 hour investigation, 1-2 hours fixes and verification

## Progress Log
