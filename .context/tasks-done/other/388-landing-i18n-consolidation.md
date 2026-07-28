# Task: Gom i18n landing về một nguồn JSON + audit bản dịch VI

## Status: pending

## Goal

Thống nhất cơ chế đa ngôn ngữ (EN/VI) cho **static UI copy** của landing về **một
nguồn JSON duy nhất** resolve qua pipe/service, thay cho các chuỗi hardcode rải rác
(ternary `locale() === 'vi'` trong TS + slot `<landing-t>` trong HTML). Đồng thời
**audit toàn bộ bản dịch VI** cho đúng nghĩa và đúng quy ước ngôn ngữ của dự án —
**user là người kiểm chứng cuối** (HITL gate).

Phạm vi CHỈ là **static UI copy** (labels, hero/lede, nút, trạng thái, hint, error,
aria-label, breadcrumb). **KHÔNG** đụng data đa ngôn ngữ từ API (`Profile.*`,
`project.oneLiner`, ...) — phần đó đã dùng đúng `translatable` pipe / `getLocalized`
rồi và là source-of-truth ở prod, không phải hardcode.

## Context

### Cơ chế i18n hiện tại — có 3 lối song song

1. **`<landing-t>` (content projection)** — `libs/landing/shared/ui/src/components/t/t.ts`.
   Slot `[en]` / `[vi]` (thường `<ng-container en>` / `<ng-container vi>`). Dùng cho
   copy **HTML-rich** (accent `<em>`, inline `<landing-link>`, list). Ưu điểm: grep-able,
   hai ngôn ngữ nằm cạnh nhau, slot không active bị **gỡ khỏi DOM** (screen reader chỉ
   đọc locale đang chọn). Nhược: nhân đôi copy inline, phân tán khắp template.
2. **Ternary TS** — `locale() === 'vi' ? 'vi...' : 'en...'` trong `computed()`. Dùng cho
   chuỗi gắn **attribute** (label, aria-label) vì content-projection không nhét được vào
   attribute. Đây là "if/else" mà user thấy — phân tán, khó quản lý, dễ lệch giữa 2 ngôn ngữ.
3. **`translatable` pipe + `getLocalized`** — cho **data** `{en,vi}` từ API. Đây là "pipe"
   đã làm. **Ngoài phạm vi task này** (chỉ để đối chiếu, không migrate).
   - `libs/shared/ui/src/pipes/translatable.pipe.ts` (pipe cho object `{en,vi}`)
   - `libs/shared/utils/core/src/lib/localize.util.ts` (`getLocalized`)

Locale state: `LandingLocaleService.locale()` (signal, root-provided, persist qua
localStorage + cookie, SSR đọc từ cookie/`<html lang>`) —
`libs/landing/shared/ui/src/services/locale/landing-locale.service.ts`.

### Inventory sơ bộ (từ grep, CHƯA đầy đủ — Phase 1 phải quét chính xác)

Ternary `locale() === 'vi'|'en'` (TS, landing, bỏ DDL + bỏ file cơ chế):

| File | ~số chỗ |
|---|---|
| `apps/landing/src/app/pages/contact/contact.ts` | 19 |
| `libs/landing/feature-home/src/lib/home.get-in-touch/home.get-in-touch.ts` | 3 |
| `libs/landing/shared/data-access/src/lib/contact-form.error-messages.ts` | 2 |
| `libs/landing/feature-about/src/lib/about.hero/about.hero.ts` | 2 |
| `apps/landing/src/app/pages/legal/{use-legal-page,terms,privacy}.ts` | 3 |
| `apps/landing/src/app/app.ts` | 1 |

Slot `<ng-container en|vi>` (HTML, đếm cặp ≈ nửa số dòng):

| File | ~số dòng |
|---|---|
| `apps/landing/src/app/pages/contact/contact.html` | 22 |
| `libs/landing/feature-about/src/lib/about.experience/about.experience.html` | 10 |
| `libs/landing/feature-about/src/lib/about.failures/about.failures.html` | 8 |
| `apps/landing/src/app/pages/legal/{terms,privacy}.html` | 4 mỗi file |
| `libs/landing/feature-about/src/lib/about.how-i-think/about.how-i-think.html` | 2 |
| `libs/landing/feature-about/src/lib/about.hero/about.hero.html` | 2 |

Lưu ý grep có thể bỏ sót: slot dùng `<span vi>` / `<p vi>` thay `<ng-container>`;
header/nav/footer/shell có thể có chuỗi **chỉ EN** (chưa dịch — cũng là lỗ hổng cần bắt).

### Căng thẳng thiết kế cần quyết (đọc kỹ trước khi làm)

Gom **tất cả** về JSON phẳng sẽ **mất** ưu điểm của `<landing-t>` cho copy **HTML-rich**
(accent `<em>`, inline link, list) và mất grep-able co-location. Vì vậy đề xuất **chia đôi**,
KHÔNG ép mọi thứ vào JSON:

- **Plain-string copy** (label, hero/lede thuần text, nút, trạng thái, hint, error,
  aria-label, breadcrumb) → **JSON + pipe** (thay ternary TS + slot text thuần).
- **HTML-rich copy** → **giữ `<landing-t>`** (hoặc quyết một cơ chế keyed-rich riêng nếu
  thực sự cần) — không nhồi HTML vào JSON string.

Quyết định cuối là 1 AC riêng (xem Phase 3). Ưu tiên phương án **đơn giản nhất chạy được**.

## Acceptance Criteria

### Phase 1 — Inventory (quét chính xác)
- [ ] Quét toàn bộ `libs/landing/**` + `apps/landing/src/**` **trừ** `apps/landing/src/app/pages/ddl/**`, liệt kê MỌI static UI copy đa ngôn ngữ ở cả 3 dạng: (a) slot `<landing-t>` (mọi biến thể `[en]`/`[vi]`), (b) ternary `locale() === 'vi'|'en'`, (c) chuỗi UI **chỉ 1 ngôn ngữ** (thường chỉ EN) đáng lẽ phải song ngữ.
- [ ] Mỗi mục ghi: `file:line`, loại (a/b/c), **plain-string vs HTML-rich**, và text EN + VI hiện có.
- [ ] Kết quả là 1 bảng inventory (lưu trong task này hoặc file phụ `.context/tasks/388-inventory.md`), là input cho các phase sau.

### Phase 2 — Audit bản dịch VI (user kiểm chứng)
- [ ] Với mỗi cặp EN/VI: đánh giá VI đúng nghĩa, tự nhiên, và tuân quy ước dự án: giữ **từ ghép/từ láy đầy đủ** (không cắt cụt kiểu Anh), **giữ tech term tiếng Anh**, **"Frontend Engineer"** viết hoa + giữ tiếng Anh, **không em-dash (—)** trong copy (restructure câu, không chỉ đổi dấu).
- [ ] Với chuỗi dạng (c) chỉ có EN: đề xuất bản VI.
- [ ] Xuất danh sách "đề xuất sửa" (EN/VI, before → after) để **user duyệt trước khi áp** (HITL — không tự ý sửa nghĩa/câu chữ đã có).

### Phase 3 — Cơ chế + nguồn JSON
- [ ] **Quyết định thiết kế** (ghi vào ADR `decisions.md`): chia plain-string → JSON+pipe, HTML-rich → giữ `<landing-t>`; hay phương án khác. Nêu lý do, ưu tiên đơn giản.
- [ ] Chốt **cấu trúc JSON**: một nguồn duy nhất cho static copy — dạng `{ "<key>": { "en": "...", "vi": "..." } }` (khuyến nghị, dễ đối chiếu 2 ngôn ngữ) hoặc `en.json` + `vi.json` tách. Chốt **vị trí** (đề xuất `libs/landing/shared/ui/src/i18n/` hoặc lib i18n riêng) và **quy ước key** (namespace theo trang/section, ví dụ `contact.hero.lede`).
- [ ] Xây **resolver**: pipe (đặt tên tránh trùng `translatable` — ví dụ `landingT` / `t`) và/hoặc method service, nhận key → trả chuỗi theo `LandingLocaleService.locale()`, **reactive** (signal-driven), có fallback `en` → `vi` → key.
- [ ] **SSR-safe**: server render đúng locale (đọc cookie/`<html lang>` — cơ chế locale hiện đã hỗ trợ; xác minh không FOUC/không lệch hydration).
- [ ] Có test cho resolver (fallback chain, đổi locale) — theo TDD guide.

### Phase 4 — Migration
- [ ] Chuyển các chỗ **plain-string** (ternary TS + slot text thuần) sang JSON + pipe theo key.
- [ ] **Giữ** `<landing-t>` cho copy HTML-rich (theo quyết định Phase 3).
- [ ] Bổ sung bản VI cho các chuỗi (c) chỉ-EN (sau khi user duyệt ở Phase 2).
- [ ] **Không** đụng `translatable`/`getLocalized` dùng cho data API (ngoài phạm vi).
- [ ] Build landing xanh (`nx build landing`) + không lỗi type/template; a11y giữ nguyên (aria-label/alt sau migrate vẫn có nhãn đúng locale).

### Phase 5 — Guardrail & docs
- [ ] Thêm doc `.context` mô tả cơ chế i18n landing (nguồn JSON, pipe, khi nào dùng `<landing-t>` vs JSON) — cập nhật `landing-ssr.md` hoặc tạo `.context/landing-i18n.md`, và thêm vào bảng Context Files trong `CLAUDE.md`.
- [ ] Quy ước/guard: copy tĩnh mới phải vào JSON, không viết ternary `locale() === 'vi'` mới (cân nhắc lint rule cảnh báo, nếu rẻ).
- [ ] Cập nhật `progress.md` + đánh dấu liên hệ với task 361 (content authoring master).

## Technical Notes

- Đổi locale hiện qua `LandingLocaleService.toggle()/setLocale()`; pipe mới phải re-render khi `locale()` đổi (pipe impure hoặc đọc signal trong `computed` ở component — chọn cách rẻ, tránh pipe impure nếu được).
- Legal pages (`/privacy`, `/terms`) drive locale từ `?lang=` **riêng**, không theo toggle site-wide (`use-legal-page.ts`) — resolver phải nhận **locale override** (giống input `[locale]` của `<landing-t>`).
- Console có `translatable-*` components + `translatable.validator.ts` — đó là UI **soạn** data song ngữ trong console, **không liên quan** task này.
- Ưu tiên tái dùng: đã có `getLocalized` (core) cho object `{en,vi}` — resolver JSON có thể tái dùng chính hàm này sau khi tra key.
- Cảnh giác regex khi quét: `locale() === 'vi'` cũng xuất hiện trong logic không phải copy (ví dụ chọn breadcrumb, chọn section list) — phân loại đúng "copy" vs "logic".

## Files to Touch

- (mới) nguồn JSON + pipe/service i18n: đề xuất `libs/landing/shared/ui/src/i18n/**` + barrel `index.ts`.
- `apps/landing/src/app/pages/contact/{contact.ts,contact.html}` (nhiều nhất)
- `libs/landing/feature-about/src/lib/{about.hero,about.experience,about.failures,about.how-i-think}/*`
- `libs/landing/feature-home/src/lib/home.get-in-touch/home.get-in-touch.ts`
- `libs/landing/shared/data-access/src/lib/contact-form.error-messages.ts`
- `apps/landing/src/app/pages/legal/{use-legal-page,terms,privacy}.{ts,html}`
- `apps/landing/src/app/app.ts`
- (giữ nguyên, chỉ đối chiếu) `libs/landing/shared/ui/src/components/t/t.ts`
- (docs) `.context/landing-i18n.md` (mới) hoặc `landing-ssr.md`, `CLAUDE.md`, `decisions.md`, `progress.md`

## Dependencies

- Liên quan task 361 (content authoring master) — copy tĩnh migrate ở đây, content data vẫn tác giả nhập ở prod.
- Không chặn/không bị chặn bởi task khác đang mở.
