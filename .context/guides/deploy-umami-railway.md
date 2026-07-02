# Deploy Guide — Self-hosted Umami analytics on Railway + Cloudflare

Reusable runbook for deploying **Umami** (open-source, cookieless analytics) as a standalone service on Railway, fronted by Cloudflare, and embedding its tracking script on a site in this monorepo.

> **Architecture:** Railway runs the official Umami Docker image + a Railway Postgres plugin → Cloudflare proxies DNS + SSL + CDN for the dashboard subdomain → the tracked site loads `script.js` from that subdomain and POSTs pageviews to `/api/send`. No cookies, no consent banner; visitor identifiers are hashed (salted by `APP_SECRET` in v3) and IPs are discarded.

This guide is **timeless** — it describes the system, not a specific deploy. Concrete values (subdomain, website-id, service name) live in the "This deploy" section at the bottom.

> **Order matters.** Umami must be verified live over HTTPS *before* the tracking `<script>` is added to any site — a script that 404s hurts page performance and Lighthouse. Do repo-side step 9 LAST.

---

## Prerequisites

- Railway account with billing enabled (Hobby ~$5/mo service + ~$5/mo Postgres)
- Cloudflare account with the target apex domain already on it
- A password manager (1Password etc.) to store the new admin password + secrets — **nothing goes in the repo**
- The site to be tracked is already deployed (see `deploy-railway-ssr.md`)

---

## Railway-side setup

### 1. Create the Umami service from the official image

Railway dashboard → your project → **New → Empty Service** (or **Deploy from Docker Image**).

- Service name: `umami`
- **Source → Docker Image**: pin a specific tag, do **not** use `latest`:
  ```
  ghcr.io/umami-software/umami:3.2.0
  ```
  > Umami v3 dropped MySQL (PostgreSQL only), so the image no longer carries a `postgresql-` prefix **and drops the `v`** — it's bare semver, `umami:<version>` (e.g. `3.2.0`, not `v3.2.0`). Pinning prevents an upstream breaking change from silently taking the dashboard down. To upgrade later, see "Upgrading Umami" below.

### 2. Add Postgres and wire `DATABASE_URL`

1. Project → **New → Database → Add PostgreSQL**. Railway provisions a `Postgres` service.
2. Umami service → **Variables** → add a **reference variable**:
   - `DATABASE_URL` = reference → `Postgres.DATABASE_URL` (Railway's variable picker; keeps it a live reference, not a copied string).
   > Reference variables update automatically if the DB credentials rotate. Use the private-network `DATABASE_URL` Railway exposes for the Postgres plugin.

### 3. Environment variables

Umami service → **Variables**:

| Key | Value | Notes |
|---|---|---|
| `DATABASE_URL` | reference → `Postgres.DATABASE_URL` | from step 2 |
| `APP_SECRET` | random 32+ char string | **generate once, store in password manager.** The single secret in v3 — signs auth sessions and salts hashing. Changing it invalidates sessions. |
| `HOSTNAME` | `0.0.0.0` | Railway-specific — ensures Umami binds on all interfaces so the platform can reach it |
| `PORT` | *(do not set)* | Railway injects it; Umami listens on 3000 by default |

> **v3 note:** `HASH_SALT` and `DATABASE_TYPE` from v2 are **gone**. v3 is PostgreSQL-only and uses `APP_SECRET` as the sole secret — do not set `HASH_SALT`.

Generate the secret locally (do NOT commit it anywhere):

```bash
openssl rand -hex 32   # one value → APP_SECRET
```

> Railway encrypts variables at rest — safe to paste secrets in the dashboard. Never put them in `.env` in the repo.

### 4. First deploy + temporary domain

1. Deploy. First boot runs Prisma migrations against the empty DB (watch **Deploy Logs** for `Migration complete`). Takes ~1–2 min.
2. Service → **Settings → Networking → Generate Domain** → temporary `umami-xxxx.up.railway.app`.
3. Open it → you should see the **Umami login page**.

**Common first-deploy failures:**

| Symptom | Cause | Fix |
|---|---|---|
| Boot loop, logs show DB connection refused | `DATABASE_URL` wrong / not a reference | Re-add as reference var; confirm Postgres is in the **same project** |
| `Migration failed` | DB not empty / partial migration | Reset the Postgres volume (only safe while there's no real data) and redeploy |
| Login page 502 | Still booting / migrations running | Wait for `Migration complete` in logs |

### 5. Harden the admin account (do this immediately)

Default credentials are **`admin` / `umami`**.

1. Log in with the default on the temporary URL.
2. **Settings → Profile → Change password** → set a strong password → **store it in the password manager** (not in repo, not in this file).
3. Do this before the dashboard is reachable on the public subdomain.

---

## Cloudflare DNS + SSL

### 6. Add the custom domain in Railway

Umami service → **Settings → Networking → Custom Domain** → add `<SUBDOMAIN>` (e.g. `analytics.<DOMAIN>`). Railway shows a CNAME target `umami-xxxx.up.railway.app` — copy it.

### 7. Cloudflare DNS record

Cloudflare → **DNS → Records → Add:**

| Type | Name | Content | Proxy |
|---|---|---|---|
| CNAME | `<SUBDOMAIN>` (e.g. `analytics`) | `umami-xxxx.up.railway.app` | 🟧 Proxied |

Propagates < 5 min.

### 8. SSL mode + cache rule

1. **SSL/TLS → Overview → Full (strict)**. Railway serves a valid Let's Encrypt cert, so strict mode validates cleanly. (Flexible → redirect loop; plain Full is acceptable but the task calls for Full strict.)
2. **Caching → Cache Rules → Create rule** — the tracking endpoint must **never** be cached, or events get deduped/dropped:
   - Match expression:
     ```
     (http.host eq "<SUBDOMAIN>.<DOMAIN>" and starts_with(http.request.uri.path, "/api/"))
     ```
   - Action: **Bypass cache**
   > Leave `script.js` cacheable (it's tiny and versioned); only `/api/*` (which includes `/api/send`) must bypass.

### 9. Verify HTTPS end-to-end

```bash
curl -I https://<SUBDOMAIN>.<DOMAIN>/           # 200, valid cert
curl -I https://<SUBDOMAIN>.<DOMAIN>/script.js  # 200, Content-Type: text/javascript
```

- [ ] `https://<SUBDOMAIN>.<DOMAIN>` shows the Umami login with a valid cert (no warning)
- [ ] `/script.js` returns 200

---

## Register the tracked site + get the website-id

### 10. Create the website entry

In the Umami dashboard (now on the real subdomain):

1. **Settings → Websites → Add website**.
2. Name: your site; Domain: `<DOMAIN>` (the tracked apex, e.g. `thunderphong.com` — **not** the analytics subdomain).
3. Save → open the website → **Edit / Tracking code** → copy the `data-website-id` (a UUID) and the script snippet.

---

## Repo-side — embed the tracking script (LAST STEP)

> Only after steps 9 + 10 pass. If Umami isn't live, the script 404s and drags down performance/Lighthouse.

### 11. Add the snippet to the tracked app's `index.html`

In `apps/<APP>/src/index.html`, immediately before `</head>`:

```html
<!-- Umami — cookieless analytics, self-hosted. See .context/guides/deploy-umami-railway.md -->
<script
  async
  defer
  src="https://<SUBDOMAIN>.<DOMAIN>/script.js"
  data-website-id="<WEBSITE_ID>"
></script>
```

`async defer` keeps it off the critical path (~2 KB gzipped).

### 12. Verify collection

1. Build + deploy the site (or test against the live site once deployed).
2. Visit `https://<DOMAIN>/` in a normal browser.
3. Umami dashboard → the website → confirm a pageview appears **within ~30 s** (Realtime view is fastest).
4. Re-run Lighthouse on the tracked site → **Performance / Best-Practices must not regress** vs. before the embed.

- [ ] Pageview shows in dashboard within 30 s
- [ ] No CORS error in DevTools console (tracked origin ↔ analytics origin)
- [ ] Lighthouse Performance/Best-Practices unchanged

**CORS note:** Umami's default config accepts cross-origin sends from the tracked domain. If the console shows a CORS block on `/api/send`, set `TRACKER_SCRIPT_NAME` / verify the site domain in the website entry matches the real host.

---

## Upgrading Umami

1. Check the [Umami releases](https://github.com/umami-software/umami/releases) for breaking notes.
2. Railway → `umami` service → **Settings → Source → Docker Image** → bump the tag (e.g. `v3.2.0` → `v3.3.0`).
3. Redeploy. Prisma migrations run automatically on boot; watch Deploy Logs for `Migration complete`.
4. Smoke-test the dashboard + a live pageview afterward.

> Because the tag is pinned, upgrades are deliberate. Never switch to `latest`.

---

## Backup (defer until there's data worth keeping)

Railway Postgres has automated backups on paid tiers. On Hobby, optionally script a weekly `pg_dump` to Cloudflare R2 — but this is not needed for an empty/new instance. Revisit once meaningful traffic history exists.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Login page redirect loop | CF SSL = Flexible | Set **Full (strict)** |
| Cert warning | DNS not propagated / CF still issuing edge cert | Wait 5–10 min, hard refresh |
| Dashboard 502 via Cloudflare | Railway service down or still migrating | Railway → Deployments → check logs / restart |
| Events not recorded but page loads | `/api/*` being cached at edge | Confirm the Bypass-cache rule matches the subdomain host exactly |
| `data-website-id` events rejected | website domain in Umami ≠ actual host | Edit website entry, match real apex |
| Can't log in after redeploy | `APP_SECRET` changed → sessions invalidated | Log in again; keep `APP_SECRET` stable and stored safely |
| Service unreachable / healthcheck fails | Umami not binding on all interfaces | Set `HOSTNAME=0.0.0.0`; healthcheck path is `/api/heartbeat` |

---

## Cross-references

- `deploy-railway-ssr.md` — the SSR app deploy this analytics layers onto (shared Railway + Cloudflare patterns)
- `privacy-policy.{en,vi}.md` §3.2, §4 — already describe this exact setup; no policy edits needed when this ships
- Umami docs: https://umami.is/docs
- Umami on Railway: https://umami.is/docs/running-on-railway

---

## This deploy

Concrete values for the portfolio's Umami instance. Fill the blanks as you go.

| Field | Value |
|---|---|
| Railway service | `umami` |
| Docker image | `ghcr.io/umami-software/umami:3.2.0` *(v3 = no `postgresql-` prefix; confirm latest stable tag at deploy time)* |
| Postgres | Railway Postgres plugin, same project, private `DATABASE_URL` |
| Dashboard subdomain | `analytics.thunderphong.com` |
| Tracked site | `thunderphong.com` (`apps/landing/src/index.html`) |
| Cloudflare SSL | Full (strict) |
| Cache rule | Bypass cache for `analytics.thunderphong.com` + path `/api/*` |
| `APP_SECRET` | stored in password manager — **not here** |
| Admin password | stored in password manager — **not here** |
| `data-website-id` | `d26e36be-b1c7-4be2-9bf7-0a9d5e394921` |
| Tracker `src` | `https://analytics.thunderphong.com/script.js` (custom domain, not the raw `*.up.railway.app` Umami suggests) |
| Umami listen port | `8080` (Railway target port) |

---

## Custom event catalog (landing)

Events fire via Umami's native **`data-umami-event`** attribute — the tracker auto-listens for clicks and walks up the DOM (`closest('[data-umami-event]')`), so the attribute can sit on a `<landing-link>` host and still catch clicks on its inner `<a>`. Zero JS, SSR-safe, no coupling into component logic. Optional properties use `data-umami-event-<key>` (dynamic values via `[attr.data-umami-event-<key>]`). Events surface under **Traffic → Events** and are reusable as steps in **Behavior → Goals / Funnels / Journeys**.

**Naming convention:** `area-action` (kebab). Keep the event name stable (renaming splits historical data); put the variable part in a property.

| Event | Property | Where it fires |
|---|---|---|
| `contact-cta` | `purpose` | Home §Get-in-touch purpose CTAs |
| `contact-email` | — | `mailto:` links |
| `about-cta` | `target` (contact/linkedin/github/cv) | About §Next-steps list (**captures CV download**) |
| `social-link` | `platform` | Social row (leaf primitive — all usages) |
| `work-read-more` | `title` | Selected-work "Read more" |
| `work-link` | `label` | Project external links in selected-work |
| `work-view-archive` | — | "View the full archive" |
| `project-open` | `slug` | /projects list — row, grid, timeline views |
| `projects-filters-toggle` | — | /projects filter-panel toggle |
| `nav-primary` | `to` | Header primary nav (both scroll states) |
| `nav-footer` | `to` | Footer nav links |
| `palette-open` | — | ⌘K search trigger |
| `palette-select` | `item` | Command-palette result activation |
| `menu-open` | — | Mobile menu open |
| `theme-toggle` | `to` (light/dark) | Theme switch |
| `blog-open` | `slug` | Blog list (hero/side/archive/row/card) |
| `blog-related` | `slug` | Related post on blog detail |
| `blog-share` | `channel` (x/linkedin/copy) | Blog share row |

**Deliberately not instrumented** (low signal / noisy): per filter-chip toggles, language switcher, gallery/lightbox open, view-toggle mode, scroll-to-top. Add later if a specific question needs them.
