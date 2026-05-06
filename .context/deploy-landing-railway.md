# Deploy Landing — Railway + Cloudflare DNS

Hướng dẫn deploy `apps/landing` (Angular 21 SSR + Express) lên Railway, dùng Cloudflare làm DNS/CDN proxy cho domain `thunderphong.com`.

> **Kiến trúc:** Railway host Node SSR runtime → Cloudflare proxy (DNS + CDN + SSL + DDoS protection) → User.

---

## Checklist tổng quan

- [ ] **Bước 1** — Verify build & start commands local
- [ ] **Bước 2** — Thêm `railway.json` ở root repo
- [ ] **Bước 3** — Thêm `.dockerignore` ở root repo
- [ ] **Bước 4** — (Optional) Thêm endpoint `/healthz`
- [ ] **Bước 5** — Tạo Railway project, connect GitHub
- [ ] **Bước 6** — Cấu hình service settings (root, dockerfile, watch paths)
- [ ] **Bước 7** — Set environment variables
- [ ] **Bước 8** — First deploy & test trên `*.up.railway.app`
- [ ] **Bước 9** — Tháo deploy cũ trên Cloudflare
- [ ] **Bước 10** — Add custom domain trên Railway
- [ ] **Bước 11** — Cấu hình DNS records trên Cloudflare
- [ ] **Bước 12** — Set Cloudflare SSL mode = Full
- [ ] **Bước 13** — Tạo redirect rule www → apex
- [ ] **Bước 14** — Cache rules cho assets
- [ ] **Bước 15** — Post-deploy verification

---

## Bước 1 — Verify build & start commands local

```powershell
pnpm nx build landing --configuration=production
node dist/apps/landing/server/server.mjs
```

Mở `http://localhost:4000` — phải render landing OK. `server.ts` đã đọc `process.env['PORT']` (default 4000).

**Pass criteria:** HTML view-source có content (SSR works), không phải app shell trống.

---

## Bước 2 — Thêm `railway.json` ở `apps/landing/`

> ⚠️ Đặt trong `apps/landing/` (không phải root repo), vì project Railway đã có service `dashboard-api` — root config sẽ ảnh hưởng cả 2 services. Bước 6 sẽ chỉ Railway dùng file này cho landing service qua "Config Path".

Tạo file `apps/landing/railway.json`:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "apps/landing/Dockerfile"
  },
  "deploy": {
    "startCommand": "node server/server.mjs",
    "healthcheckPath": "/",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

> Nếu sau này deploy thêm `apps/api` cùng repo, mỗi service sẽ override path riêng — sẽ chuyển sang multi-service config.

---

## Bước 3 — Thêm `.dockerignore` ở root repo

Tạo file `.dockerignore` ở **root** (`C:\study\portfolio\.dockerignore`):

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

**Tại sao:** Build context truyền lên Docker daemon nhỏ hơn → build nhanh hơn nhiều (đặc biệt với monorepo lớn).

---

## Bước 4 — (Optional) Thêm endpoint `/healthz`

Mở `apps/landing/src/server.ts`, thêm trước `app.use(express.static(...))`:

```ts
app.get('/healthz', (_req, res) => {
  res.status(200).send('ok');
});
```

Sau đó update `railway.json`: `"healthcheckPath": "/healthz"`.

**Tại sao:** Health check mặc định gọi `/` mỗi lần → SSR render full page tốn CPU. `/healthz` siêu nhẹ.

> Có thể skip bước này, làm sau.

---

## Bước 5 — Tạo Railway project, connect GitHub

1. Vào https://railway.app → đăng nhập (GitHub OAuth)
2. **New Project** → **Deploy from GitHub repo**
3. Authorize Railway GitHub App → chọn repo portfolio
4. Branch deploy: `master`
5. Railway detect `railway.json` + Dockerfile → build tự động bắt đầu

**Note:** Free trial $5 credit. Sau đó Hobby plan $5/tháng cho project landing này (đủ thoải mái).

---

## Bước 6 — Cấu hình service settings

Service → **Settings**:

| Field | Value | Ghi chú |
|---|---|---|
| **Root Directory** | `/` (để trống) | Dockerfile cần full monorepo context |
| **Builder** | Dockerfile | Auto từ `railway.json` |
| **Dockerfile Path** | `apps/landing/Dockerfile` | Auto từ `railway.json` |
| **Watch Paths** | `apps/landing/**`, `libs/**`, `package.json`, `pnpm-lock.yaml` | Chỉ rebuild khi files liên quan thay đổi |
| **Start Command** | (để trống — Dockerfile CMD đã set) | |

**Networking:**
- **Generate Domain** → tạo URL `landing-xxx.up.railway.app` để test trước khi attach domain thật
- Public Port: Railway auto-detect từ `EXPOSE 4000` + `PORT` env

---

## Bước 7 — Set environment variables

Service → **Variables**:

| Key | Value | Bắt buộc |
|---|---|---|
| `NODE_ENV` | `production` | ✅ |
| `PORT` | (Railway auto-inject — **đừng** hardcode) | ✅ |
| `API_URL` | `http://dashboard-api.railway.internal:<API_PORT>` (private) hoặc `https://dashboard-api.thunderphong.com` (public) | ✅ — đọc bởi `main.server.ts`, prepend cho relative `/api/*` calls khi SSR |
| `NODE_OPTIONS` | `--dns-result-order=ipv4first` | Khi dùng private network — tránh undici Happy Eyeballs timeout |
| Analytics/Sentry tokens | ... | Tùy |

> ⚠️ Default `API_URL` là `http://localhost:3000` (xem `apps/landing/src/main.server.ts:12`). Trên Railway phải set thật, nếu không SSR sẽ fail vì không có API ở localhost.

### Về Private Networking

Railway có private networking giữa các service trong **cùng project**:
- Hostname: `<service-name>.railway.internal:<PORT>` (PORT = internal port của API service, không phải 443)
- Ưu điểm: thấp latency hơn public URL, không tốn egress, không qua Cloudflare
- Yêu cầu: landing và API phải cùng **1 Railway project** (verify ở dashboard)
- Gotcha: Node.js native fetch (undici) có vấn đề Happy Eyeballs với IPv6 → set `NODE_OPTIONS=--dns-result-order=ipv4first`. Nếu env Railway cũ (IPv6-only, pre-Oct-2025), đảo thành `ipv6first`.

**Nếu private network fail** → fallback dùng public URL `https://dashboard-api.thunderphong.com`, mọi thứ chạy ngay.

> ⚠️ Đừng commit `.env`. Railway encrypt vars at-rest, an toàn để paste secrets vào dashboard.

---

## Bước 8 — First deploy & test

1. Push commit có `railway.json` + `.dockerignore` lên `master`
2. Railway auto build — xem **Deployments** tab → click vào deployment → tab **Build Logs** + **Deploy Logs**
3. Build thường mất 3–6 phút (do `pnpm install` toàn monorepo)
4. Deploy xong → mở URL `https://landing-xxx.up.railway.app`

**Test checklist:**
- [ ] Homepage 200, render OK
- [ ] View-source: HTML có content (SSR works)
- [ ] DevTools Network: first request HTML không phải shell trống
- [ ] Routes phụ (về tôi, projects, …) đều render OK
- [ ] Console không có lỗi hydration

**Nếu fail:**
- OOM khi build → service Settings → thêm env `NODE_OPTIONS = --max-old-space-size=4096`
- pnpm install timeout → check `.dockerignore` đã exclude `node_modules`/`dist` chưa
- Server start fail → xem Deploy Logs, thường do PORT binding hoặc missing env

---

## Bước 9 — Tháo deploy cũ trên Cloudflare

Trước khi attach domain mới, **gỡ deploy cũ** để tránh xung đột DNS:

1. Cloudflare Dashboard → **Workers & Pages**
2. Tìm project đang phục vụ `thunderphong.com`
3. Project đó → **Custom domains** → **Remove** `thunderphong.com` và `www.thunderphong.com`
4. (Optional) **Delete project** luôn nếu không dùng nữa

Domain tạm thời sẽ down — bước 10–11 fix.

---

## Bước 10 — Add custom domain trên Railway

Service → **Settings → Networking → Custom Domain**:

1. Click **+ Custom Domain** → nhập `thunderphong.com`
2. Railway hiện CNAME target dạng `xxx.up.railway.app` (copy lại)
3. Click **+ Custom Domain** lần nữa → nhập `www.thunderphong.com`
4. Lại copy CNAME target (có thể giống hoặc khác)

> Railway không hỗ trợ ALIAS/ANAME cho apex, nhưng Cloudflare dùng **CNAME flattening** → apex trỏ CNAME OK.

---

## Bước 11 — Cấu hình DNS records trên Cloudflare

Cloudflare Dashboard → **DNS → Records**:

**Xóa trước:** mọi record A/CNAME cũ trỏ về deploy trước đó (cho `thunderphong.com` apex và `www`).

**Add records mới:**

| Type | Name | Content | Proxy status |
|---|---|---|---|
| CNAME | `thunderphong.com` (apex, hoặc `@`) | `xxx.up.railway.app` | 🟧 **Proxied** |
| CNAME | `www` | `xxx.up.railway.app` | 🟧 **Proxied** |

**Verify:**
```powershell
nslookup thunderphong.com
nslookup www.thunderphong.com
```

DNS propagation thường < 5 phút (Cloudflare fast).

---

## Bước 12 — Set Cloudflare SSL mode = Full

⚠️ **Cực kỳ quan trọng** — sai mode sẽ bị redirect loop hoặc cert error.

Cloudflare Dashboard → **SSL/TLS → Overview**:
- Chọn **Full** (không phải "Flexible", không cần "Full strict")

**Tại sao:** Railway đã có SSL cert (Let's Encrypt). "Full" tells Cloudflare verify Railway's cert. "Flexible" sẽ là HTTP giữa CF ↔ Railway → loop redirect khi Express enforce HTTPS.

---

## Bước 13 — Tạo redirect rule www → apex

Cloudflare Dashboard → **Rules → Redirect Rules → Create rule**:

- Rule name: `www to apex`
- If incoming requests match: **Custom filter expression**
  - Field: `Hostname`, Operator: `equals`, Value: `www.thunderphong.com`
- Then: **Static redirect**
  - Type: `Static`
  - URL: `https://thunderphong.com${uri.path}`
  - Status: `301`
  - Preserve query string: ✅

> Hoặc reverse (apex → www) tùy bạn chọn canonical. Apex ngắn hơn.

---

## Bước 14 — Cache rules cho assets

Cloudflare Dashboard → **Caching → Cache Rules → Create rule**:

- Rule name: `Cache Angular hashed assets`
- If incoming requests match:
  - `URI Path` `wildcard` `*.js` OR
  - `URI Path` `wildcard` `*.css` OR
  - `URI Path` `starts with` `/assets/`
- Then:
  - **Cache eligibility:** Eligible for cache
  - **Edge TTL:** 1 year
  - **Browser TTL:** 1 year

> Angular đã hash filename (`outputHashing: "all"`) → safe to cache aggressively.

---

## Bước 15 — Post-deploy verification

```powershell
curl -I https://thunderphong.com
curl -I https://www.thunderphong.com
```

**Pass criteria:**
- [ ] `https://thunderphong.com` → 200, view-source thấy SSR HTML có content
- [ ] `https://www.thunderphong.com` → 301 → `https://thunderphong.com`
- [ ] Header có `cf-ray` (qua Cloudflare proxy)
- [ ] SSL padlock xanh, no mixed content
- [ ] DevTools Network: HTML first request có content
- [ ] Lighthouse Performance + SEO ≥ 90
- [ ] Railway Metrics: memory < 512MB, CPU < 50% normal load
- [ ] Console không có lỗi hydration (xem `landing-ssr.md`)

---

## Sau khi deploy

### Auto-deploy on push

Railway auto-deploy mỗi push lên `master` qua GitHub App — **không cần GitHub Actions, không cần secrets trong repo**.

### (Optional) Gate bằng test trước deploy

Nếu muốn chạy test trước khi deploy, thêm `.github/workflows/deploy-landing.yml`:

```yaml
name: Deploy Landing
on:
  push:
    branches: [master]
    paths:
      - 'apps/landing/**'
      - 'libs/**'
      - 'package.json'
      - 'pnpm-lock.yaml'
      - 'railway.json'
      - 'Dockerfile'
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
      - run: railway up --service=<service-name> --detach
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

GitHub repo → **Settings → Secrets and variables → Actions** → New secret:
- `RAILWAY_TOKEN` — tạo ở Railway Dashboard → Account Settings → Tokens

> Khuyến nghị: bắt đầu với Railway auto-deploy (không Actions). Chỉ thêm Actions khi thực sự cần.

---

## Troubleshooting

| Issue | Likely cause | Fix |
|---|---|---|
| Redirect loop | Cloudflare SSL = Flexible | Đổi sang **Full** |
| Cert error trên domain | DNS chưa propagate / SSL chưa issue | Đợi 5–10 phút, hard refresh |
| Build OOM | Monorepo lớn | Set `NODE_OPTIONS=--max-old-space-size=4096` |
| Build chậm > 10 phút | `.dockerignore` thiếu | Đảm bảo exclude `node_modules`, `dist`, `.nx` |
| `Cannot find module` runtime | Production deps thiếu | Check Dockerfile stage 2 đã copy đủ chưa |
| Health check fail | App start chậm > 100s | Tăng `healthcheckTimeout` trong `railway.json` |
| `502 Bad Gateway` qua Cloudflare | Origin (Railway) down | Check Railway Deployments → Restart |

---

## Tham khảo

- Railway docs: https://docs.railway.app
- Cloudflare SSL modes: https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/
- Project SSR notes: `.context/landing-ssr.md`
