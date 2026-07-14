# Task: Debug & tối ưu chi phí Memory trên Railway

## Status: pending

## Goal

Xác định và giảm chi phí Memory trên Railway (Portfolio project), tập trung vào Umami stack và memory spike của Dashboard API, trước khi bill kỳ tới vượt $5 included của Hobby plan.

## Context

Bill Railway Jun4–Jul4 2026 (Receipt #2747-3448) cho thấy Memory chiếm gần như toàn bộ chi phí biến đổi: $2.12 (9,150,313 MB-min), trong khi vCPU ($0.02), Network ($0.05), Disk ($0.01) gần như không đáng kể. Lý do: Memory tính **liên tục 24/7** bất kể traffic, còn vCPU/Network chỉ tính khi có compute/traffic.

**Quy tắc tính nhẩm rút ra từ chính bill:** `1 MB RAM giữ 24/7 ≈ $0.01/tháng` (212 MB → đúng $2.12).

**Số liệu thật per-service (7 ngày, tính đến ~08/07/2026, lấy qua Railway MCP):**

5 service đang chạy always-on, không cái nào sleep:

| Service | RAM avg | Đỉnh | ≈ $/tháng | Ghi chú |
|---|---|---|---|---|
| **Umami** | ~266 MB | 425 MB | ~$2.66 | Self-hosted analytics (image `umami:3.2.0`), 24/7 |
| **Dashboard API** | ~150 MB | **569 MB** | ~$1.50 | NestJS, spike lúc burst |
| **Landing** | ~67 MB | 170 MB | ~$0.67 | Angular SSR |
| **Postgres Umami** | ~42 MB | 85 MB | ~$0.42 | DB riêng cho Umami (postgres-ssl:18) |
| **Postgres** (chính) | ~28 MB | 31 MB | ~$0.28 | Rất gọn |

**Phát hiện quan trọng — bill này CHƯA phản ánh đúng:**
- **Umami + Postgres Umami mới được tạo ~02/07** (gần cuối kỳ) → gần như chưa tính vào bill Jun4–Jul4.
- Bill $2.12 đó chủ yếu là Dashboard API (150) + Landing (67) + Postgres (28) ≈ 245 MB.
- Từ kỳ tới trở đi Umami stack chạy full tháng → tổng memory nhảy ~245 MB → **~553 MB (gần gấp đôi)**, riêng RAM ~$5.5/tháng, **vượt $5 included** → bắt đầu bị tính tiền thật. Thủ phạm chính là **Umami**, không phải service portfolio.

**Làm rõ hiểu lầm:** memory limit đang set 8GB/4GB nhưng **limit KHÔNG tính tiền** — Railway chỉ tính RAM thực dùng. Hạ limit không tiết kiệm.

## Acceptance Criteria

- [ ] Quyết định số phận Umami stack: giữ self-host / chuyển **Umami Cloud** free tier (10k events) / **Cloudflare Web Analytics** (free, privacy-first) / gỡ hẳn — kèm lý do.
- [ ] Điều tra spike Dashboard API lên 569 MB (memory leak? xử lý ảnh Cloudinary? request burst?) — xác định nguyên nhân hoặc kết luận vô hại.
- [ ] Đánh giá bật **App Sleeping** cho Landing + Dashboard API (đổi lấy cold start) — quyết định bật/không, cân nhắc ảnh hưởng SEO/UX của SSR Landing khi cold start.
- [ ] Ước tính lại bill kỳ tới sau khi áp dụng thay đổi, xác nhận nằm trong hoặc giảm so với $5.
- [ ] Nếu gỡ/xóa service: **xác nhận với user trước** (destructive action).

## Technical Notes

- Dùng Railway MCP để lấy lại metrics khi vào việc:
  - Project ID: `5478a674-18f2-481a-a857-17117b0ec932`
  - Environment (production): `7ffa8948-21d1-416e-81f2-4c8582e5cef0`
  - Service IDs: Umami `4e10d99d-...`, Dashboard API `1ccde3fc-...`, Landing `33d27b9d-...`, Postgres Umami `6144c467-...`, Postgres `d764f920-...`
  - Tools: `railway-agent` (thread cũ: `ee601482-cb38-4240-b2e4-f58673308ead`), `serviceMetricsTool` cho `MEMORY_USAGE_GB`.
- Umami self-host = 2 container 24/7 chỉ để đếm view cho portfolio traffic thấp → không kinh tế; là đòn giảm chi phí lớn nhất (~$3/tháng).
- App Sleeping: RAM về ~0 khi idle, đổi lại request đầu chậm (cold start). SSR Landing cold start có thể ảnh hưởng SEO/first-load.
- Dashboard API spike: kiểm tra Cloudinary upload/xử lý ảnh, hoặc pattern giữ buffer lớn trong RAM.

## Files to Touch

- Railway config (ngoài repo — qua dashboard/MCP): App Sleeping, service lifecycle.
- `apps/api/Dockerfile` (nếu tinh chỉnh runtime memory / `NODE_OPTIONS`)
- `apps/landing/railway.json` (nếu tinh chỉnh runtime)

## Dependencies

None (standalone)

## Complexity: M

**Reasoning:** Điều tra nhiều service + quyết định kiến trúc (Umami hosting, App Sleeping), nhưng thay đổi chủ yếu ở config Railway chứ không phải code lớn. Có rủi ro destructive (xóa service) cần xác nhận. 1–3 giờ.

## Progress Log

### 2026-07-13 — Umami stack tắt tạm thời (⚠️ CẦN BẬT LẠI)

Đã **disable tạm** cả Umami stack để giảm chi phí, chờ quyết định cuối ở Acceptance Criteria #1. Thao tác qua `railway down` (remove deployment đang chạy, **giữ nguyên config + data volume**, reversible).

- **Umami** (`4e10d99d-...`): deployment đang chạy đã remove → app down. `analytics.thunderphong.com/api/heartbeat` = 404.
- **Postgres Umami** (`6144c467-...`): `latestDeployment: null` → down. Data volume được Railway retain (chỉ còn phí storage nhỏ).
- **Landing giữ nguyên** — script umami trong `apps/landing/src/index.html:95-101` KHÔNG sửa/redeploy. Xác nhận Landing vẫn 200, không vỡ (script off critical path, `UmamiEventDirective` no-op khi `globalThis.umami` undefined). `script.js` vẫn 200 do Cloudflare edge cache; beacon `/api/send` fail âm thầm, không ảnh hưởng user.

**Hệ quả:** không thu analytics trong thời gian tắt. Privacy policy vẫn khai báo Umami (để nguyên vì chỉ tắt tạm).

**Bật lại** (đúng thứ tự — app cần DB sẵn sàng):
```bash
railway redeploy --service "Postgres Umami" -e production -y
railway redeploy --service "Umami" -e production -y
```
