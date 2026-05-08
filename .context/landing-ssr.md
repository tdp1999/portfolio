# Landing SSR Notes

The landing app uses Angular SSR with hydration. Three classes of "flash on F5" can appear if the rules below are not followed. Each section explains the cause, the fix already in place, and the rule for new code.

## 1. HTTP Transfer Cache — keep URLs identical on server and client

**Cause:** Angular's HTTP transfer cache (enabled via `withHttpTransferCacheOptions` in `app.config.ts`) keys cached responses by full request URL. If the SSR request URL differs from the client request URL — e.g. server fetches `http://localhost:3000/api/profile` and client fetches `/api/profile` — the cache misses and every API call is refetched on the client. While the refetch is in flight, signals sit at their `initialValue` and computed fallbacks render → visible flash.

**Fix in place — two halves:**

- **SSR side:** `apps/landing/src/main.server.ts` patches `globalThis.fetch` to prefix `process.env['API_URL']` for any URL starting with `/api/` (or absolute self-URL with `/api/` path). HttpClient stays unaware of the rewrite so the cache key remains the relative path.
- **Browser side:** `apps/landing/src/server.ts` mounts a reverse-proxy on `/api/*` that forwards to `${API_URL}` using native `fetch`. Without this, the browser's same-origin `/api/...` call hits the landing SSR Express server, falls through to the Angular catch-all, and returns 302 → /404.

Both halves are required when landing and API live on different Railway services. Together they keep the URL `/api/...` identical from Angular's perspective on both sides → the transfer cache hits on hydration.

**Rules for new landing data services:**

- Call relative URLs only: `this.http.get('/api/foo')`. **Never** prepend a base URL in the service.
- Don't add HTTP interceptors that rewrite `req.url` for cross-environment use — user interceptors run BEFORE the transfer cache root interceptor, so any rewrite at that layer breaks the cache key. Do URL rewriting at the `globalThis.fetch` layer instead (it sits below the transfer cache).
- A new SSR app must reproduce the `globalThis.fetch` patch in its own `main.server.ts`.

## 1b. Cold observables — share replay singleton service results

**Cause:** A landing data service that returns `this.http.get(...)` directly hands out a **cold** Observable. Each new subscriber (e.g. `toSignal(service.getX())` in a freshly-mounted component) fires a fresh HTTP request. Initial SSR + transfer-cache works, but on client-side back-nav (e.g. `/ddl/...` → `/`) the home component re-mounts, `toSignal` re-subscribes, and a new HTTP request fires:

- Until the response arrives, the signal sits at its `initialValue` (`null` / `[]`) — visible flash from "Portfolio in progress" / empty placeholders to real data.
- If the relative `/api/...` URL doesn't resolve in the browser (different origin, missing reverse-proxy rewrite), `catchError` returns the empty fallback and the page **stays** on the placeholder. Data appears lost.

**Fix in place:** `ProfileService`, `SkillService`, `ExperienceService`, `ProjectDataService` cache the inner observable on the singleton instance with `shareReplay({ bufferSize: 1, refCount: false })`. Lifetime = service lifetime = app lifetime. Re-subscribers replay the cached value synchronously.

**Rules for new landing data services:**

- Wrap any `http.get(...)` chain consumed by a long-lived component (anything mounted from the home / projects / about pages) in a `shareReplay({ bufferSize: 1, refCount: false })`. Store the resulting observable on a private field, return that field on every call:
  ```ts
  private foo$?: Observable<Foo>;
  getFoo(): Observable<Foo> {
    this.foo$ ??= this.http.get<Foo>('/api/foo').pipe(
      catchError(() => of(EMPTY_FOO)),
      shareReplay({ bufferSize: 1, refCount: false })
    );
    return this.foo$;
  }
  ```
- For parameterized lookups (e.g. `getBySlug(slug)`), use a `Map<key, Observable<...>>` to cache per-key.
- `refCount: false` is critical — `refCount: true` would tear down the cache when subscribers drop to 0 (back-nav scenario), defeating the whole point.
- Mutation endpoints (POST/PUT/DELETE) are exempt — they should not be cached.

## 2. FOUT — preload above-the-fold web fonts

**Cause:** `@fontsource/*` CSS imports declare `@font-face` rules with `font-display: swap`. The browser only fetches a `.woff2` after style/layout calc identifies an element using that face. In the meantime, the system fallback (`Georgia` for serif, `system-ui` for sans, etc.) is rendered. When the woff2 arrives → swap → visible flash.

**Fix in place:** Above-the-fold weights are self-hosted in `apps/landing/public/fonts/` and preloaded via `<link rel="preload">` tags in `apps/landing/src/index.html`. The matching `@font-face` overrides live in `libs/landing/shared/ui/src/styles/index.scss` (replacing the corresponding `@import '@fontsource/<family>/<weight>.css'` so the font isn't loaded twice).

Currently preloaded:

- Newsreader 400 normal + italic (hero serif — Georgia fallback looks very different)
- Inter 400, 500, 600 (body + nav)
- JetBrains Mono 400 (eyebrow/labels)

**Recipe to add a new critical font weight:**

1. Copy the woff2 from `node_modules/@fontsource/<family>/files/<family>-latin-<weight>-<style>.woff2` into `apps/landing/public/fonts/`.
2. Add `@font-face` (with `font-display: swap`) in `libs/landing/shared/ui/src/styles/index.scss` pointing to `/fonts/<file>.woff2`. Remove the corresponding `@import '@fontsource/<family>/<weight>.css'` so the font isn't loaded twice.
3. Add `<link rel="preload" as="font" type="font/woff2" crossorigin>` in `apps/landing/src/index.html`.

Inter and JetBrains Mono fallbacks are metric-close to system fonts → only preload weights when the FOUT swap is visually obvious (typically Newsreader serif vs. Georgia, or any heavy/display weight).

## 3. Active route flash — use `HydrationSafeActiveDirective`

**Cause:** Angular's `routerLinkActive` subscribes to `Router.events` in `ngOnInit` with `isActive=false`, then waits for the next `NavigationEnd` to re-apply its class. After SSR hydration that creates a flash: the SSR HTML has the active class → directive `ngOnInit` strips it → router replays `NavigationEnd` → class re-added.

**Fix in place:** `HydrationSafeActiveDirective` (in `libs/landing/shared/ui/src/shell/`) seeds a URL signal with `router.url` (set immediately at construction), so the active state is correct on the very first change-detection tick after hydration.

**Rules:**

- Use `[hydrationSafeActive]` from `@portfolio/landing/shared/ui` for any landing nav link rendered during SSR.
- Console can keep `routerLinkActive` (CSR-only behind auth, no hydration → no flash).

```html
<a [routerLink]="'/projects'" [hydrationSafeActive]="'/projects'">Projects</a>
<a [routerLink]="'/'" [hydrationSafeActive]="'/'" [hydrationSafeActiveExact]="true">Home</a>
<a
  [routerLink]="'/foo'"
  [hydrationSafeActive]="'/foo'"
  [hydrationSafeActiveClass]="'font-semibold'"
>
  Foo
</a>
```

Inputs:

- `[hydrationSafeActive]` — path to compare (required).
- `[hydrationSafeActiveExact]` — exact match (default `false`, prefix match).
- `[hydrationSafeActiveClass]` — class to apply when active (default `nav-link--active`).
