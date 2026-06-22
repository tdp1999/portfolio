# Task: Optimize Landing Page Dev Server Performance

## Status: done (resolved-by-environment + structural wins)

## Resolution (2026-06-22)

The original 113s symptom was **Windows-environment-specific** (antivirus scanning
`node_modules`/`.nx`, slow file-watcher, lockfile timestamp churn). After moving to
macOS (Node v24.16, pnpm 10.16) it **does not reproduce** — so chasing the original
bug is chasing a ghost. Reframed to: measure the current dev-loop baseline on the new
machine, apply OS-independent structural wins, and record numbers so any future
regression is verifiable.

### Measured baseline (macOS, n=3, median; harness = scratchpad `perf-bench.cjs`)

| Task | Cold compute | Cache hit |
|---|---|---|
| build:api (webpack+tsc) | 2.7s | 0.3s |
| build:landing (esbuild SSR) | 9.9–11s | 0.3s |
| build:console (esbuild) | 4.0–4.9s | 0.3s |

Nx cache is healthy (0.3s hits across the board). No perf crisis. `.nx/cache` was 1.4G
(periodic `nx reset` is the only housekeeping note). `.angular` build cache 105M (fine).

### Applied
- **Lint cache restored:** removed hardcoded `--skip-nx-cache` from the `lint` script
  (it defeated the cacheable `@nx/eslint:lint` target). Verified: repeat lint on
  unchanged code 14.3s → ~6s (`existing outputs match the cache`).

### Assessed and rejected
- **api webpack `compiler: 'tsc' → 'swc'`:** rejected. api build is already 2.7s (not a
  bottleneck); the swap is not a 1-line change (needs the `swc-loader` dep + a `.swcrc`),
  and NestJS DI correctness can only be confirmed at runtime — unverifiable here without
  starting the server. Not worth the unverifiable risk for a marginal cold-build saving.

### Not measured (accepted, by policy)
- Live dev-server cold-start (Vite `optimizeDeps`/HMR) was not measured — repo policy is to
  never auto-start `nx serve`. The build portion that dominates cold-start was measured
  (landing ~10s) and is healthy, so this is accepted as-is. If a future `pnpm dev:landing`
  cold start feels slow, open a fresh task with the serve log rather than reopening this one.

### Discovered (tracked separately)
- Pre-existing **test failures** surfaced by the benchmark: 8 stale api tests + the whole
  landing `ddl.spec.ts` (stale after the /ddl 3-column rebuild). Being fixed outside this
  task's perf scope.

## Original investigation (historical — Windows-era)


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
