# Deploy Guide — Angular SSR app on Railway + Cloudflare

Reusable runbook for deploying any Angular SSR app from this Nx monorepo to Railway, fronted by Cloudflare DNS/CDN.

> **Architecture:** Railway hosts the Node SSR runtime → Cloudflare proxies DNS + CDN + SSL + DDoS protection → User. API service can live in the same Railway project and be reached over private networking.

This guide is **timeless** — it describes the system, not a specific deploy. For per-app values (service names, domains, env), see the "Worked examples" section at the bottom or the originating epic/task.

---

## Prerequisites

- Nx monorepo on GitHub, branch tracking enabled
- App is Angular SSR (Express server in `apps/<APP>/src/server.ts`)
- Dockerfile at `apps/<APP>/Dockerfile` (multi-stage: install → build → runtime)
- Cloudflare account with the target domain on it
- Railway account with billing enabled (Hobby plan ~$5/mo)

---

## Repo-side setup (once per app)

### 1. `apps/<APP>/railway.json`

Per-service config. Place inside the app folder so multiple services in one Railway project don't collide on a root config.

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "apps/<APP>/Dockerfile"
  },
  "deploy": {
    "startCommand": "node server/server.mjs",
    "healthcheckPath": "/healthz",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

> `dockerfilePath` is **relative to repo root**, regardless of where `railway.json` lives.

### 2. Root `.dockerignore`

```
node_modules
dist
.nx
.git
.github
.context
**/*.spec.ts
**/coverage
**/.cache
*.md
.env*
```

Smaller build context = much faster Docker uploads, especially for monorepos.

### 3. `/healthz` endpoint

In `apps/<APP>/src/server.ts`, add **before** `express.static` middleware:

```ts
app.get('/healthz', (_req, res) => {
  res.status(200).send('ok');
});
```

Default `/` health check would SSR-render the full page on every probe — wasteful CPU.

### 4. SSR fetch URL rewrite (only if app calls API)

In `apps/<APP>/src/main.server.ts`, patch `globalThis.fetch` so HttpClient can use relative `/api/*` paths consistently on server and client. Critical for **HTTP transfer cache** to work — keys must be identical SSR↔client, otherwise client refetches and the page flashes.

```ts
const apiBase = (process.env['API_URL'] || 'http://localhost:3000').replace(/\/$/, '');
const originalFetch = globalThis.fetch;

function rewriteUrl(url: string): string {
  if (url.startsWith(apiBase)) return url;
  if (url.startsWith('/api/')) return `${apiBase}${url}`;
  try {
    const parsed = new URL(url);
    if (parsed.pathname.startsWith('/api/')) {
      return `${apiBase}${parsed.pathname}${parsed.search}`;
    }
  } catch {
    /* not a parseable URL, leave alone */
  }
  return url;
}

globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
  if (typeof input === 'string') return originalFetch(rewriteUrl(input), init);
  if (input instanceof URL) return originalFetch(rewriteUrl(input.toString()), init);
  if (input instanceof Request) {
    const next = rewriteUrl(input.url);
    if (next !== input.url) return originalFetch(new Request(next, input), init);
  }
  return originalFetch(input, init);
}) as typeof fetch;
```

> Why both relative AND absolute self-URL rewrites: Angular SSR resolves relative URLs against the incoming request's host *before* calling fetch. So services using `this.http.get('/api/foo')` actually fetch `https://<own-host>/api/foo` on server. Both shapes need rewriting.

### 5. Server render mode for routes that need API

If a route's resolver/component fetches from API at render time, do **not** prerender it — the API isn't reachable at build time. In `apps/<APP>/src/app/app.routes.server.ts`:

```ts
{ path: '', renderMode: RenderMode.Server }   // SSR at runtime — needs API
{ path: 'about', renderMode: RenderMode.Prerender }  // Static, build-time OK
```

---

## Railway-side setup (once per app)

### 6. Create / pick the project

- **New service in existing project** if there's an API service to share private networking with → cheaper, lower latency.
- **New project** if isolated.

Service → **Source** → connect GitHub repo, branch `master`, path `/` (NOT `apps/<APP>`).

### 7. Service settings

| Field | Value |
|---|---|
| **Root Directory** | `/` (empty) — Dockerfile needs full monorepo context |
| **Builder** | Dockerfile *(may need to set manually if Railway defaults to Railpack)* |
| **Dockerfile Path** | `apps/<APP>/Dockerfile` |
| **Config-as-code Path** | `apps/<APP>/railway.json` *(must point Railway at the per-app config)* |
| **Watch Paths** | `apps/<APP>/**`, `libs/**`, `package.json`, `pnpm-lock.yaml` |
| **Start Command** | (leave empty — `railway.json` provides it) |

> **Gotcha:** Railway will silently default to its Railpack builder even with `railway.json` present unless you set Builder = Dockerfile in Settings, or until the file is committed AND the Config Path is set explicitly.

**Networking:** click **Generate Domain** → temporary `<app>.up.railway.app` for testing before custom domain.

### 8. Environment variables

Service → **Variables**:

| Key | Value | Notes |
|---|---|---|
| `NODE_ENV` | `production` | |
| `PORT` | *(do not set)* | Railway auto-injects — `server.ts` reads `process.env.PORT` |
| `API_URL` | `http://<API_SERVICE>.railway.internal:<PORT>` (private) **OR** `https://api.<DOMAIN>` (public) | Read by `main.server.ts`. Default is `http://localhost:3000` — must override. |
| `NODE_OPTIONS` | `--dns-result-order=ipv4first` | Required when using private network — works around undici Happy Eyeballs IPv6 timeout. (Reverse to `ipv6first` only on legacy IPv6-only Railway envs.) |

#### Private networking gotchas

- Hostname is `<service-name>.railway.internal:<INTERNAL_PORT>`. Internal port = the API service's `PORT` (whatever it was deployed listening on), **not** 443/80.
- Both services must be in the **same Railway project**.
- Always include the protocol (`http://`) and port. `dashboard-api.railway.internal` alone will fail.
- If private networking won't connect, fall back to the public API URL — it always works (just slower + counts toward egress).

> Never commit `.env`. Railway encrypts variables at rest; safe to paste secrets in dashboard.

### 9. First deploy

1. Push `railway.json` + `.dockerignore` + Dockerfile to `master`.
2. Railway auto-builds. Open **Deployments → Build Logs** + **Deploy Logs**. First build is 3–6 minutes (full `pnpm install`).
3. Open the temporary `*.up.railway.app` URL.

**Smoke test:**
- Homepage 200, view-source has rendered HTML (not empty shell)
- Sub-routes render
- DevTools Console: no hydration mismatch errors

**Common build/start failures:**
- OOM during build → add env `NODE_OPTIONS=--max-old-space-size=4096`
- pnpm timeout → verify `.dockerignore` excludes `node_modules`/`dist`
- `Cannot find module` at runtime → Dockerfile runtime stage missing prod deps
- Health check fails → app boot >100s → raise `healthcheckTimeout`

---

## Cloudflare DNS + CDN (once per domain)

### 10. Remove the previous deploy

If the domain was on Cloudflare Pages (or another origin), unbind first to avoid DNS conflicts.

- Pages: project → **Custom domains** → remove apex + www.
- Other origins: delete A/AAAA/CNAME records pointing to old origin.

The domain will be down briefly until step 12 finishes.

### 11. Add custom domain in Railway

Service → **Settings → Networking → Custom Domain**:

1. Add `<DOMAIN>` (apex). Railway shows a CNAME target like `xxx.up.railway.app` — copy it.
2. Add `www.<DOMAIN>`. Same CNAME target (or a different one — copy it).

> Railway doesn't issue ALIAS/ANAME for apex, but Cloudflare's **CNAME flattening** lets the apex be a CNAME in DNS without RFC violations.

### 12. Cloudflare DNS records

Dashboard → **DNS → Records**:

**Delete** all old records on the apex and `www` (often there are 2× A + 2× AAAA from previous Pages deploy).

**Add:**

| Type | Name | Content | Proxy |
|---|---|---|---|
| CNAME | `@` (or apex) | `xxx.up.railway.app` | 🟧 Proxied |
| CNAME | `www` | `xxx.up.railway.app` | 🟧 Proxied |

DNS propagates < 5 min on Cloudflare.

### 13. SSL mode = Full

Dashboard → **SSL/TLS → Overview** → **Full**.

- ❌ **Flexible** = HTTP between CF and Railway → redirect loop when Express enforces HTTPS.
- ❌ **Full (strict)** = requires CF to validate Railway's cert chain — Railway uses Let's Encrypt which is fine, but "Full" is enough and avoids strict-mode pitfalls.

This is the most common single-cause production failure. Set it before anything else after DNS.

### 14. Redirect rule www → apex

Dashboard → **Rules → Redirect Rules → Create rule**:

- Match: `Hostname` `equals` `www.<DOMAIN>`
- Action: **Static redirect**
- URL: `https://<DOMAIN>${uri.path}`
- Status: `301`
- Preserve query string: ✅

(Or reverse direction — apex → www. Pick canonical. Apex is shorter.)

### 15. Cache rules for static assets

Dashboard → **Caching → Cache Rules → Create rule** (NOT "Cache Response Rules" — that's for header transforms):

- Match expression:
  ```
  (http.host eq "<DOMAIN>" and starts_with(http.request.uri.path, "/media/")) or
  (http.host eq "<DOMAIN>" and starts_with(http.request.uri.path, "/fonts/")) or
  (http.host eq "<DOMAIN>" and ends_with(http.request.uri.path, ".js")) or
  (http.host eq "<DOMAIN>" and ends_with(http.request.uri.path, ".css")) or
  (http.host eq "<DOMAIN>" and ends_with(http.request.uri.path, ".woff2"))
  ```
  Add image extensions (`.svg`, `.webp`, `.png`, `.jpg`) **only if you control filenames or they're already content-hashed**. Otherwise overwriting an upload at the same path serves stale up to 1 year.
- **Edge TTL:** Ignore cache-control header and use this TTL → **1 year**
- **Browser TTL:** Override origin and use this TTL → **1 year**

Angular's `outputHashing: 'all'` means JS/CSS filenames change every deploy → safe to cache aggressively. Self-hosted fonts in `/fonts/` rarely change; if they do, purge the URL manually.

### Cache invalidation cheat sheet

| Change | What happens | Action |
|---|---|---|
| Code change in `.ts/.html/.scss` | Build produces new hashed filenames; old URLs orphaned | Nothing — auto |
| `index.html` change | SSR renders fresh; references new hashed filenames | Nothing — auto |
| File in `public/` (favicon, og-image) | Same URL, stale at edge for 1 year | Cloudflare Dashboard → Caching → Configuration → Purge Cache → Custom Purge → paste URL |
| Self-hosted font swap | Same URL, stale | Same as above |
| Uploaded media at fixed name | Same URL, stale | Either purge URL, or design upload pipeline to use hash/UUID filenames |

---

## Post-deploy verification

```bash
curl -I https://<DOMAIN>/
curl -I https://www.<DOMAIN>/
curl -I https://<DOMAIN>/healthz
curl -I https://<DOMAIN>/<some-hashed-asset>.css
```

Pass criteria:

- [ ] Apex returns 200, view-source has SSR HTML with content (not empty shell)
- [ ] www returns 301 to apex
- [ ] `/healthz` returns 200 "ok"
- [ ] Hashed assets return `cf-cache-status: HIT` (after primer request) and `Cache-Control: max-age=31536000`
- [ ] DevTools Console: no hydration errors, no mixed content warnings
- [ ] Lighthouse: Performance + SEO ≥ 90
- [ ] Railway Metrics: memory < 512 MB, CPU < 50% under normal load

---

## After deploy — auto-deploy on push

Railway's GitHub App auto-builds and deploys on every push to `master` (filtered by Watch Paths in step 7). **No GitHub Actions, no `RAILWAY_TOKEN` secret needed.**

Add Actions only if you need to gate deploy behind tests/lint:

```yaml
name: Deploy <APP>
on:
  push:
    branches: [master]
    paths: ['apps/<APP>/**', 'libs/**', 'package.json', 'pnpm-lock.yaml']
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: pnpm/action-setup@v3
        with: { version: 10 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm nx affected -t lint test build --base=origin/master~1
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm i -g @railway/cli
      - run: railway up --service=<SERVICE_NAME> --detach
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

Token: Railway → Account Settings → Tokens → create → paste into GitHub repo Secrets as `RAILWAY_TOKEN`.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Redirect loop | CF SSL = Flexible | Set to **Full** |
| Cert error | DNS not propagated, or CF still issuing edge cert | Wait 5–10 min, hard refresh |
| Build OOM | Monorepo size | Env `NODE_OPTIONS=--max-old-space-size=4096` |
| Build > 10 min | `.dockerignore` missing entries | Confirm `node_modules`, `dist`, `.nx` excluded |
| `Cannot find module` at runtime | Production deps not copied | Audit Dockerfile runtime stage `COPY` |
| Health check fail | Slow boot | Raise `healthcheckTimeout` in `railway.json` |
| `502 Bad Gateway` via Cloudflare | Origin (Railway) down | Railway → Deployments → Restart |
| SSR fetches own host instead of API | `main.server.ts` patch missing or only handles `startsWith('/')` | Use full patch from step 4 |
| Page flashes data after load | Transfer cache key mismatch | Ensure HttpClient uses **relative** URLs only; rewrite happens in `globalThis.fetch`, not in interceptors |
| FOUT on first paint | Critical fonts not preloaded | Self-host woff2, add `<link rel="preload" as="font" crossorigin>` in `index.html`, replace `@fontsource` import with explicit `@font-face` |
| `cf-cache-status: DYNAMIC` on hashed assets | Cache rule expression doesn't match | Re-check Hostname literal + path conditions |
| `cf-cache-status: BYPASS` | Query string or cookie defeating cache | Strip query, check Page Rules |

---

## Cross-references

- `landing-ssr.md` — three classes of "flash on F5" and the rules that prevent each
- Railway docs: https://docs.railway.app
- Cloudflare SSL modes: https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/

---

## Worked examples

Concrete deployments using this guide. Update when adding a new app — keep one row per service so anyone can find what `<APP>`, `<DOMAIN>`, `<API_SERVICE>` actually were.

| App | Service name (Railway) | Domain | API_URL value | Notes |
|---|---|---|---|---|
| `apps/landing` | `landing` | `thunderphong.com` | `http://dashboard-api.railway.internal:3000` | Co-hosted with `dashboard-api` in same project |
| `apps/api` | `dashboard-api` | `dashboard-api.thunderphong.com` | n/a (it IS the API) | |
