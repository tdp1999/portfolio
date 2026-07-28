# Task: Gom i18n landing về một nguồn JSON + audit bản dịch VI

## Status: done

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

| File                                                                       | ~số chỗ |
| -------------------------------------------------------------------------- | ------- |
| `apps/landing/src/app/pages/contact/contact.ts`                            | 19      |
| `libs/landing/feature-home/src/lib/home.get-in-touch/home.get-in-touch.ts` | 3       |
| `libs/landing/shared/data-access/src/lib/contact-form.error-messages.ts`   | 2       |
| `libs/landing/feature-about/src/lib/about.hero/about.hero.ts`              | 2       |
| `apps/landing/src/app/pages/legal/{use-legal-page,terms,privacy}.ts`       | 3       |
| `apps/landing/src/app/app.ts`                                              | 1       |

Slot `<ng-container en|vi>` (HTML, đếm cặp ≈ nửa số dòng):

| File                                                                          | ~số dòng   |
| ----------------------------------------------------------------------------- | ---------- |
| `apps/landing/src/app/pages/contact/contact.html`                             | 22         |
| `libs/landing/feature-about/src/lib/about.experience/about.experience.html`   | 10         |
| `libs/landing/feature-about/src/lib/about.failures/about.failures.html`       | 8          |
| `apps/landing/src/app/pages/legal/{terms,privacy}.html`                       | 4 mỗi file |
| `libs/landing/feature-about/src/lib/about.how-i-think/about.how-i-think.html` | 2          |
| `libs/landing/feature-about/src/lib/about.hero/about.hero.html`               | 2          |

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

- [x] Quét toàn bộ `libs/landing/**` + `apps/landing/src/**` **trừ** `apps/landing/src/app/pages/ddl/**`, liệt kê MỌI static UI copy đa ngôn ngữ ở cả 3 dạng: (a) slot `<landing-t>` (mọi biến thể `[en]`/`[vi]`), (b) ternary `locale() === 'vi'|'en'`, (c) chuỗi UI **chỉ 1 ngôn ngữ** (thường chỉ EN) đáng lẽ phải song ngữ.
- [x] Mỗi mục ghi: `file:line`, loại (a/b/c), **plain-string vs HTML-rich**, và text EN + VI hiện có.
- [x] Kết quả là 1 bảng inventory (lưu trong task này hoặc file phụ `.context/tasks/388-inventory.md`), là input cho các phase sau.

> Quét thực tế phát hiện **dạng thứ tư (d)**: cặp hằng EN/VI song song trong TS
> (`DICT_EN`/`DICT_VI`, `SECTIONS_EN`/`SECTIONS_VI`, `breadcrumbEn`/`breadcrumbVi`,
> `*_BY_LOCALE`). Đã đưa vào inventory như nhóm D — đây là hình dạng gần đích nhất,
> migration chỉ là dời chỗ + đặt key.

### Phase 2 — Audit bản dịch VI (user kiểm chứng)

- [x] Với mỗi cặp EN/VI: đánh giá VI đúng nghĩa, tự nhiên, và tuân quy ước dự án: giữ **từ ghép/từ láy đầy đủ** (không cắt cụt kiểu Anh), **giữ tech term tiếng Anh**, **"Frontend Engineer"** viết hoa + giữ tiếng Anh, **không em-dash (—)** trong copy (restructure câu, không chỉ đổi dấu).
- [x] Với chuỗi dạng (c) chỉ có EN: đề xuất bản VI.
- [x] Xuất danh sách "đề xuất sửa" (EN/VI, before → after) để **user duyệt trước khi áp** (HITL). User duyệt batch 1, 2 (7 tranche) và 4; miễn gate cho batch 3 (a11y) với ràng buộc "đừng cố dịch từ chuyên ngành".

### Phase 3 — Cơ chế + nguồn JSON

- [x] **Quyết định thiết kế** — ADR-028 trong `decisions.md`. Chia plain-string → dictionary + pipe/service, HTML-rich → giữ `<landing-t>`.
- [x] Chốt **cấu trúc**: **TS `as const`** thay vì JSON thuần (JSON không gắn được comment ghi nguồn `file:line`, và `as const` cho `LandingCopyKey` là union đóng → gõ sai key là lỗi compile). Vị trí `services/copy/` + `pipes/` theo bucket taxonomy (`patterns-lib-structure.md` Rule A/B cấm subsystem bucket `i18n/`). Key namespace theo trang: `contact.form.submit.idle`.
- [x] Xây **resolver**: `resolveCopy(key, locale)` thuần + `LandingCopyService.t(key, localeOverride?)` → `Signal<string>` + pipe `landingCopy`. Fallback `locale` → `en` → `vi` → chính key.
- [x] **SSR-safe**: resolver thuần, không đụng `document`/`window`; locale vẫn do `LandingLocaleService` cấp (cookie/`<html lang>`). Pipe nhận locale làm input nên không có trạng thái ẩn giữa server và client.
- [x] Có test cho resolver — 9 test xanh: fallback chain, đổi locale, locale override, + 2 invariant (không entry nào rỗng cả 2 ngôn ngữ, không giá trị nào chứa em-dash).

### Phase 4 — Migration

- [x] Chuyển các chỗ **plain-string** (ternary TS + slot text thuần) sang dictionary + pipe/service theo key. Còn đúng 4 chỗ `locale() === 'vi'`, tất cả là **logic** chứ không phải copy: chọn URL resume (`app.ts:31`), nội dung demo theo locale (`document-engine.util.ts:71`), gate kênh Zalo cho audience VN (`contact.ts:239`), chọn mảng tên tháng (`about.hero.ts:60`).
- [x] **Giữ** `<landing-t>` cho copy HTML-rich — còn 12 block: 1 hero `/contact`, 7 `/document-engine`, 4 legal (2 strip "Last updated" + 2 khối toàn văn).
- [x] Bổ sung bản VI cho các chuỗi (c) chỉ-EN — xong toàn bộ qua batch 2 (359 chuỗi hiển thị, 7 tranche) và batch 3 (a11y).
- [x] **Không** đụng `translatable`/`getLocalized` dùng cho data API (ngoài phạm vi).
- [x] Build landing xanh (`nx build landing`) + 6 project test xanh. Breadcrumb 11 trang giờ song ngữ (G2).

### Phase 5 — Guardrail & docs

- [x] Doc `.context/landing-i18n.md` — quyết định, vị trí file, cách đọc copy (pipe vs service), vì sao pipe bắt buộc truyền locale, locale override cho legal pages, ranh giới với data API, bảng anti-pattern. Đã thêm vào bảng Context Files trong `CLAUDE.md`.
- [x] Guardrail: hàng mới **"Landing copy = dictionary"** trong bảng Critical Guardrails (`CLAUDE.md`) + spec `apps/landing/src/app/landing-copy-contract.spec.ts` quét source, chặn (a) ternary `locale() === 'vi'` ngoài allowlist 4 chỗ logic, (b) cặp hằng EN/VI song song. Đã thử probe: guard đỏ đúng khi có vi phạm, xanh lại khi gỡ.
- [x] Cập nhật `progress.md` + ghi liên hệ với task 361.

## Progress Log

- [2026-07-27] Started. Quét lại code — inventory trong task file đã cũ: trang
  `/document-engine` (30 `<landing-t>` + 5 ternary) ra đời sau khi task được viết và là
  bề mặt lớn nhất; `contact-form.error-messages.ts` không dùng ternary mà dùng
  `DICT_EN`/`DICT_VI`; nhóm chuỗi chỉ-EN lớn hơn dự đoán (~120 chuỗi).
- [2026-07-27] Phase 1 xong → `.context/tasks/388-inventory.md`. Phạm vi chốt với user:
  đầy đủ a+b+c+d, gồm cả aria-label.
- [2026-07-27] Phase 2 batch 1 (các cặp EN/VI đã có ở nhóm A/B/D) — user duyệt xong,
  đã áp 60 sửa đổi trên 24 file. `nx build landing` xanh.
  Quy tắc ngôn ngữ user chốt thêm, áp cho mọi batch sau:
  (1) câu đủ chủ ngữ vị ngữ, không cắt cụt;
  (2) từ phổ thông **miền Nam** (`nhé` → `nha`, `hỏng` → `sai`/`không đúng`/`hư`);
  (3) ưu tiên từ 2 âm tiết khi hợp hơn (`chọn gì` → `lựa chọn`);
  (4) dịch EN→VI phải kiểm lại ẩn dụ — cái gì trôi trong tiếng Anh chưa chắc trôi
  trong tiếng Việt (`pick the door that fits` ✗ `chọn cánh cửa phù hợp`).
  Chốt thêm: nguồn copy tĩnh sẽ là **TS `as const`** (không phải JSON thuần) —
  `libs/landing/shared/ui/src/i18n/landing-copy.ts`, để gắn được comment ghi nguồn gốc
  `file:line` cạnh từng chuỗi. Đây là quyết định Phase 3, cần vào ADR.
  Còn lại: batch 2 (chuỗi chỉ-EN nhìn thấy được), batch 3 (a11y), batch 4 (legal prose).
- [2026-07-27] Phase 3 xong. `services/copy/` (data + util + service + spec) + `pipes/landing-copy.pipe.ts`,
  export qua barrel. 9 test xanh, `nx build landing` xanh. ADR-028 ghi vào `decisions.md`.
  Dictionary đã nạp sẵn 118 key = toàn bộ copy song ngữ đã duyệt ở batch 1 → Phase 4 chỉ còn đi nối dây.
- [2026-07-27] Phase 4 xong. 137 key, ~24 file nối dây, `nx build landing` xanh, 6 project test xanh
  (`ui` 213 + feature libs + landing). Đã xóa `.context/tasks/388-inventory.md` — bản markdown được
  thay bằng chính `landing-copy.data.ts` (mỗi entry mang comment `file:line` gốc), theo yêu cầu user
  muốn tra cứu ngay trong code.
  Bốn file dữ liệu bị thu gọn/xóa vì nội dung đã dời vào dictionary: `about.cta.data.ts` (xóa),
  `about.data.ts` (còn mỗi `ABOUT_URL`), `terms.data.ts` + `privacy.data.ts` (`SECTIONS_EN/VI` →
  hàm `termsSections(locale)` / `privacySections(locale)` map id → key).
  `AVAILABILITY_LABELS_VI` → `AVAILABILITY_COPY_KEYS` (map enum → key, chuỗi nằm trong dictionary).
  `mapContactSubmitError` giờ map `errorCode` → copy key thay vì giữ hai dict EN/VI.
  Ghi chú: dictionary cấm luôn **en-dash** (U+2013) chứ không chỉ em-dash — U+2013 dễ nhầm với
  hyphen ASCII và làm editor cảnh báo ambiguous-character. Range viết bằng chữ ("10 to 5000
  characters"). Đã đưa vào test invariant.
- [2026-07-27] Phase 2 **quét lại toàn bộ** chuỗi chỉ-EN (dạng c). Con số thật: **429**, không
  phải ~55 như Phase 1 ước lượng — Phase 1 chỉ grep quanh các file đã có cặp EN/VI nên bỏ sót
  mọi bề mặt chưa từng song ngữ. Phân bố: header/nav 19, footer 12, component dùng chung 66,
  `/uses` 26, `/colophon` 37, `/version` 16, `/404` 5, Home 50, Projects 58, Blog 37, About 12,
  `/contact`+`/document-engine` 21, văn bản mẫu demo 70. Chưa tính 97 chuỗi a11y (batch 3).
  Quyết định của user: (1) làm hết trong 388, chia 7 tranche theo bề mặt; (2) **70 chuỗi văn bản
  mẫu** trong demo `/document-engine` **giữ tiếng Anh** — đó là vật mẫu phô diễn engine, không
  phải giao diện, dịch một hợp đồng vay là việc văn phong pháp lý mà không thêm giá trị;
  (3) ngày tháng **dịch hết theo locale**, bỏ quyết định khoá tiếng Anh cũ ở `about.experience`.
- [2026-07-27] **Hai chỗ ghi sai ở Phase 4/5, đã sửa:**
  (a) allowlist guardrail ghi `document-engine.util.ts` là "chọn nội dung demo theo locale" —
  sai. Thực tế là `relativeTime()`, copy song ngữ thật. Nó vẫn được ở lại nhưng vì lý do khác:
  cần nội suy số **và** chia nhánh số ít/số nhiều, dictionary phẳng không diễn đạt được.
  Đã ghi đúng lý do.
  (b) `blog.detail.ts` khoá `toLocaleDateString('en-US')` không ghi lý do, lệch với
  `about.hero` (chỗ đó dịch tên tháng). Đã gom về một util chung.
- [2026-07-27] Tranche 1 xong (48 chuỗi): header/nav/mega-menu, footer, `/404`, About.
  - Đổi tên `common.breadcrumb.*` → **`common.page.*`** trên 24 call-site. Lý do: cùng những
    tên trang đó xuất hiện ở 4 bề mặt (breadcrumb, nav, footer, command palette); namespace
    `breadcrumb` khiến người thêm nav item sau này không tra tới và sẽ tạo entry trùng.
  - Mới `services/copy/date-format.util.ts`: `formatMonthYear` / `formatLongDate` /
    `formatMonthRange`. Dùng **getter UTC** thay `toLocaleDateString` — server và browser có thể
    khác múi giờ, ngày format theo local là mầm hydration mismatch. `EN_MONTHS`/`VI_MONTHS` rời
    `feature-about` về đây, nên guardrail giờ **không còn ngoại lệ nào** trong feature code.
  - Bỏ en-dash khỏi dải thời gian (`May 2024 – Present` → `- ` cho EN, `tới` cho VI): đúng loại
    ký tự U+2013 gây cảnh báo ambiguous-character.
  - `about.section.*` gộp 4 tên section dùng chung cho nav pill + eyebrow (+ H2 của Experience),
    xoá `about.experience.heading` trùng nghĩa. `navSections` thành `computed` + đăng ký
    scrollspy trong `effect` để đổi theo locale.
  - Component dùng chung (`mega-menu`, `footer-banner`) tự resolve **nhãn mặc định của chính
    nó** qua `LandingLocaleService`, `input()` override vẫn thắng. Khác tiền lệ `use-legal-page`
    (caller tự resolve rồi truyền vào) — tiền lệ đó không mở rộng được: caller mới sẽ âm thầm
    ra tiếng Anh.
  - Test mới: invariant `{placeholder}` phải trùng bộ giữa hai locale (bắt trường hợp bản dịch
    làm rơi slot nội suy). `nx build landing` sạch, 229 test xanh.
- [2026-07-27] Tranche 2 xong (74 chuỗi): `/version` + component dùng chung.
  - User chốt `/version` làm cả VI dù là trang cá nhân — guardrail không phân biệt được trang
    cá nhân với trang công khai, để lại một trang tiếng Anh là mở lại đúng khe hở task này đi bịt.
  - **`KeyboardShortcut.description` + `.category` giờ là `LandingCopyKey`, không phải chuỗi.**
    `register()` chạy một lần trong constructor, nên chuỗi literal sẽ đóng băng ở ngôn ngữ lúc
    khởi động. Command palette resolve key khi render dòng Action. 5 chỗ đăng ký, đều trong landing.
  - **`PAGE_MANIFEST`/`SECTION_MANIFEST` → `pageManifest(locale)`/`sectionManifest(locale)`**,
    `KIND_LABEL` → `KIND_LABEL_KEYS`. Tên trang dùng lại `common.page.*`, tên section Home dùng
    `home.section.*` (chia sẻ với nav pill của Home ở tranche 4).
  - **`results-count` bỏ hình thái số nhiều tiếng Anh.** Code cũ làm `${unit}s`; tiếng Việt không
    biến đổi danh từ theo số. Giờ nhận `unit` + `unitPlural` (chuỗi đã dịch từ caller), caller VI
    truyền cùng một từ hai lần. **Đã sửa luôn hai caller** (`/projects`, `/blog`) trong cùng lượt —
    nếu để sau thì tiếng Anh hồi quy thành "12 project".
  - Bảy component tự resolve nhãn mặc định của mình: `pagination`, `load-more`, `results-count`,
    `select`, `show-more`, `heading`, `toc-inline`/`toc-sidebar`. `input()` override vẫn thắng.
  - Gợi ý zoom của lightbox và dòng "no matches" của palette vào `<landing-t>` chứ không vào
    dictionary — cả hai mang markup (`<kbd>`, `<strong>`).
  - Ba mô tả trong `PAGE_MANIFEST` đã lạc hậu, viết lại luôn: `/about` và `/blog` còn ghi
    "Coming soon" dù đã xong từ lâu; mục Get in Touch trỏ `§07` trong khi Home chỉ có tới `§06`.
  - Giữ tiếng Anh: `Commit`, `Branch`, `Deployment ID`, `UTC`, `FIG.`, `esc`, `DDL`, `Hero`,
    `Stack` (thuật ngữ — bỏ mạo từ `The` vì tiếng Việt không dùng).
  - `nx build landing` sạch, 229 test xanh.
- [2026-07-28] Tranche 3 xong (57 chuỗi): `/uses` + `/colophon`.
  - `USES_SECTIONS`/`COLOPHON_SECTIONS` (mảng phẳng `ContentSectionData[]`) → `usesSections(locale)`
    /`colophonSections(locale)`, đúng khuôn `termsSections(locale)` ở Phase 4. Chỉ hai field là copy
    (`title`, `reason`); `monogram`, tên sản phẩm, `href` giữ inline vì đọc giống nhau ở hai ngôn ngữ.
  - **`about.hero.lastUpdated` → `common.lastUpdated`.** Ba trang đọc cùng chuỗi này (`/about` hero,
    `/uses`, `/colophon`); để nó nằm dưới namespace `about.hero` là mời trang thứ tư đúc bản sao.
  - **Chuỗi ngày `2026-05` giờ đi qua `formatMonthYear`.** Trước đó nó hiện thô là `2026-05` trong khi
    `/about` hero đã localize tháng — cùng một loại nhãn, hai cách hiện. Thuộc tính `datetime` vẫn
    giữ ISO thô cho screen reader và crawler; chỉ phần hiện ra đổi thành `May 2026` / `Tháng 5 2026`.
  - Hai đoạn prose ở chân `/colophon` (`This site`, `Updates`) vào dictionary chứ không vào
    `<landing-t>` — chúng là đoạn văn thuần, không có markup inline.
  - `uses.reason.newsreader` được cả hai trang đọc: cùng một typeface, cùng một câu mô tả.
  - Giữ tiếng Anh trong tên mục: `Editor`, `Terminal`, `CLI`, `Stack` — từ vựng chuỗi công cụ.
    Dịch: `Hardware` → `Thiết bị`, `Browser` → `Trình duyệt`, `Fonts` → `Font chữ`,
    `Other` → `Còn lại`, `Tools` → `Công cụ`, `Type` → `Kiểu chữ`,
    `Sources & credits` → `Nguồn tham khảo và ghi công`.
  - Hai heading `sr-only` (`Uses inventory`, `Stack, tools, sources, type`) để lại batch 3 cùng
    toàn bộ chuỗi a11y; meta title/description để lại tranche 7 cùng khối SEO.
  - **Nội dung `/uses` + `/colophon` sẽ thành module CRUD trong console.** Hardcode ở đây là tạm.
    Hai file `*.data.ts` được đánh dấu là nguồn seed: khi module ra, sinh seed bằng cách gọi
    `usesSections('en')` + `usesSections('vi')` rồi zip thành `{ en, vi }` từng field — **không**
    copy nội dung sang một file seed riêng, vì hai bản sẽ lệch ngay lần đầu đổi một công cụ.
    Chưa mở task riêng cho module này.
  - User sửa: lede `/uses` gọn lại còn `What I use daily.` / `Những công cụ mình sử dụng hàng ngày.`;
    `Other` → `Khác`; `Sources & credits` giữ tiếng Anh cả hai locale (thuật ngữ riêng của colophon);
    lede `/colophon` gọn lại còn `What this site is built on, and who I learned from.` /
    `Trang này được dựng trên những gì, và mình học từ ai.`
  - `nx build landing` sạch, 229 test xanh.
- [2026-07-28] Tranche 4 xong (25 key mới + 13 chỗ trỏ về key có sẵn): feature Home.
  - **`navSections` của Home → computed, dùng lại `home.section.*`.** Trước đó pill nav ghi `Who`
    còn eyebrow + sr-only + command palette ghi `Who I Am` — cùng một mục, hai nhãn khác nhau ở
    bốn bề mặt. Giờ cả bốn đọc một key (`Who I Am` thắng vì đang chiếm ba trong bốn chỗ).
    Scrollspy đăng ký lại trong `effect` vì nó giữ chính cái tiêu đề nó render.
  - **Hai bản nhãn link dự án đã lệch nhau, gộp lại thành `project.link.*`.** Home ghi
    `Source code`/`Live project`/`Docs`, trang project detail ghi `Repository`/`Live demo`/
    `Documentation` — cùng năm loại link, hai cách gọi tuỳ trang. Chốt bộ gọn hơn:
    `Source code`/`Live demo`/`Case study`/`Docs`/`Write-up`. Tiếng Anh của Home chỉ đổi một chỗ
    (`Live project` → `Live demo`); trang project detail nối dây ở tranche 5.
  - **Bắt được en-dash trong hai chỗ hiện giờ làm việc**: `home.bio-card-grid.util.ts` và
    `home.bio-card-grid.ts` ghép khoảng giờ bằng `–`. Đổi sang hyphen ASCII, cùng lý do đã ghi
    trong `date-format.util.ts` (dễ lẫn với `-`, kích cảnh báo ký tự nhập nhằng của editor).
    Khoảng giờ giữ hyphen ở cả hai locale vì nó là giá trị số trong rail mono, không phải văn xuôi.
  - **Giữ tiếng Anh: các key mono-caps trong rail dữ liệu.** `STATUS`, `CORE STACK`, `LOCATION`
    (hero) và `LOCAL`, `HOURS`, `BASE`, `§2.x IDENTITY / BIO / CONTACT` (bio card) là nhãn 4-8 ký
    tự trong cột hẹp; không có bản tiếng Việt nào vừa chiều ngang đó mà không phá nhịp cột. Cùng
    hạng ngoại lệ với `Commit`/`Branch`/`Deployment ID` ở /version. **Nhưng** `CHALLENGE`/
    `APPROACH`/`OUTCOME` thì dịch — chúng là nhãn nội dung người đọc phải hiểu, không phải
    metadata máy, dù cũng render mono caps. **User sửa lại: giữ tiếng Anh luôn** — cùng nhóm với
    các key mono-caps còn lại. Cũng giữ tiếng Anh: `Source code`, `Live demo` (thuật ngữ dev).
    Còn `Docs` → `Tài liệu` và `Write-up` → `Bài viết` thì vẫn dịch, nên bộ `project.link.*` chia
    3 tiếng Anh / 2 tiếng Việt: ba cái đầu là thuật ngữ dev, hai cái sau là loại nội dung.
  - Bốn component tự inject `LandingLocaleService` thay vì thêm input `locale`: `home.hero`,
    `home.bio-card-grid`, `home.stack`, `home.intro`. `selected-work` đã có input `locale` sẵn nên
    dùng luôn cái đó.
  - Vào `<landing-t>` (mang markup `<em>`): tiêu đề §5 `The toolkit.` → `Bộ công cụ.` và tiêu đề
    §6b `Let's talk.` → `Liên hệ.` (user chốt).
  - Cặp trạng thái tuyển dụng đóng khung theo lịch chứ không theo nhu cầu việc:
    `CÒN TRỐNG LỊCH` / `ĐANG KÍN LỊCH`. Bản đầu (`SẴN SÀNG NHẬN VIỆC`) user thấy quá thẳng.
    Hai nửa song song nhau nên rail không nhảy chiều ngang khi trạng thái đổi.
  - Còn lại của Home: ~6 chuỗi a11y (`aria-label` hero, hire status, selected projects, project
    screenshots) để batch 3.
  - `nx build landing --skip-nx-cache` sạch, 229 test xanh.
- [2026-07-28] Tranche 5 xong (39 key mới + 6 chỗ trỏ về key có sẵn): feature Projects.
  - **Chip lọc trạng thái đang hiện thẳng giá trị enum.** `projects.html` bind
    `[label]="status"` nên bộ lọc đọc `LIVE` `SHIPPED` `ARCHIVED` `BETA` `ONGOING`, trong khi rail
    metadata ở trang detail đọc `Live` `Shipped` qua `LIFECYCLE_STATUS_LABEL` của riêng nó. Gộp
    thành `projectStatusLabel(status, locale)` ở file phẳng mới `lib/project.status.ts` — cả hai
    bề mặt đọc một nguồn. Enum vẫn là token cho query param, chỉ nhãn là copy.
  - **`LINK_TYPE_LABEL` của trang detail bỏ đi, trỏ về `project.link.*`** (bộ đã chốt ở tranche 4).
    Tiếng Anh đổi hai chỗ ở trang detail: `Repository` → `Source code`, `Documentation` → `Docs`.
  - **`project.field.*` là một bộ dùng chung cho hai bề mặt**: nhãn `Year`/`Status` ở thanh lọc và
    `Role`/`Stack`/`Year`/`Status` ở rail metadata. Một bộ nên hai chỗ không lệch nhau được.
  - `FALLBACK_TOC` → `fallbackToc(locale)`, dùng chung `project.detail.section.*` với chính bốn
    heading nó trỏ tới — sidebar và heading không thể lệch tên.
  - `VIEW_OPTIONS` → `viewOptions(locale)`. Cả `label` (aria-label) và `description` (tooltip hiện
    ra) đều là copy nên cùng vào dictionary.
  - Bỏ `label="On this page"` cứng ở `landing-toc-sidebar`; component đã tự resolve
    `common.onThisPage` từ tranche 2.
  - `Challenge`/`Approach`/`Outcome` ở rail highlight giữ tiếng Anh, cùng quyết định user đã chốt
    cho bộ mono-caps ở Home.
  - Giữ tiếng Anh (mono machine chrome): `// PROJECTS · 03 OF 12 · NEXT`, eyebrow `metadata`,
    eyebrow `links`, `FIG.`.
  - Vào `<landing-t>`: hero `The archive.` → `Kho lưu trữ.`
  - e2e `projects.spec.ts` assert `Overview` + `Project not found` — vẫn xanh vì giá trị EN không đổi.
  - `nx build landing --skip-nx-cache` sạch, 229 test xanh.
- [2026-07-28] Tranche 6 xong (26 key mới + 4 chỗ trỏ về key có sẵn): feature Blog.
  - **`blog.detail.ts` bỏ `toLocaleDateString('en-US')`, dùng `formatLongDate`** — đây là món nợ
    đã ghi từ đầu Phase 2. Hai lý do: `toLocaleDateString` đọc giờ local nên server và browser lệch
    múi giờ là hydration mismatch, và `'en-US'` cứng khoá tên tháng vào tiếng Anh.
  - **Trang blog detail lấy locale từ `language` của bài, không từ toggle site-wide.** Đây là thiết
    kế có sẵn (breadcrumb đã làm vậy từ Phase 3) và tranche này giữ nguyên: một bài viết chỉ có một
    ngôn ngữ, nên toàn bộ chrome quanh nó (read-time, `Related posts`, bio tác giả, empty state)
    đọc theo ngôn ngữ bài. `blog.share-row` nhận thêm input `locale` để không lệch khỏi phần còn lại.
  - **Hai trang có hai bộ tooltip khác nhau cho cùng một view-toggle.** `/projects` ghi
    `List View.`, `/blog` ghi `List view: title + meta dominant.` — cùng component, cùng hai chế độ.
    Gộp thành `common.view.*` (+ `common.sort.*`), lấy bản mô tả rõ hơn của blog. `VIEW_OPTIONS`
    và `SORT_OPTIONS` của blog thành `viewOptions(locale)` / `sortOptions(locale)`.
  - Hero heading `/blog` giờ đọc `common.page.writing` + dấu chấm, thay vì chuỗi `Writing.` cứng.
  - `Filters` giữ tiếng Anh trong cả hai chuỗi của blog, theo đúng quyết định ở tranche 5.
  - e2e assert `Writing`, `Newest`, `Oldest`, `Clear filters`, `Post not found` — vẫn xanh vì giá
    trị EN không đổi. `blog-detail.spec.ts` cố tình không assert nhánh "min read" (seed để null).
  - `nx build landing --skip-nx-cache` sạch, 232 test xanh.
- [2026-07-28] Tranche 7 xong — batch 2 của Phase 2 **hoàn tất**. Dictionary: 401 key.
  - **Bắt được lỗ hổng trong chính guardrail mình viết.** Spec pin hai cơ chế (locale ternary,
    cặp hằng EN/VI) nhưng bỏ sót cơ chế thứ ba: object literal `{ en: '…', vi: '…' }` resolve qua
    `getLocalized`. Đúng shape cho content tác giả nhập từ API (`TranslatableJson`), sai shape cho
    copy tĩnh — nên `/document-engine` mang một nguồn copy song song suốt nhiều tháng mà spec không
    kêu. Thêm test thứ ba; regex chỉ khớp khi cả hai nửa là string literal cùng dòng, nên annotation
    kiểu (`label: TranslatableJson`) hay đọc API (`{ en: row.en }`) không bị bắt oan.
  - `document-engine.data.ts` migrate hết sang dictionary (38 key). Chính docblock của file đã ghi
    phần VI là "interim wiring pending task 388" — nên đây là việc của task này, không phải scope creep.
    Tách `PACKAGE_NAMES` ra riêng cho hai fetcher npm/GitHub: registry id không liên quan gì tới locale.
  - Hai chuỗi sót trong template document-engine: `<dt>Packages</dt>` và caption `framework binding`
    (cái sau đứng cạnh `documentEngine.architecture.coreCaption` đã có key từ trước — sót rõ ràng).
  - **Khối SEO meta (7 trang + default site-wide + 2 trang legal).** Hai quy ước:
    tên tác giả theo locale (`Phuong Tran` / `Phương Trần`, theo commit 9514dce7), và description
    **giữ nguyên dạng dài** — nó không phải lede trên trang, một kết quả tìm kiếm chỉ có một mệnh đề
    thì không nói được gì. Tất cả chuyển vào `effect` để theo được locale, giống `/about` và `/404`.
  - Sửa lỗi mình tạo ở tranche 1: `notFound.meta.title` bản VI ghi `Phuong Tran`, phải là `Phương Trần`.
  - **Cảnh báo cần biết về SEO:** `LandingLocaleService.readInitial()` trả `'en'` trên server (chưa
    có phần đọc cookie locale — comment trong service ghi là "for future first-paint language
    matching"). Nên crawler chỉ thấy nửa tiếng Anh. Các key `*.meta.*` là để có một nguồn duy nhất
    cho mỗi chuỗi, **không** làm site trở thành bilingual với Google.
    - `/terms` và `/privacy` là hai trang duy nhất làm đúng: `?lang=vi` cho VI một URL riêng, kèm
      canonical + hreflang + x-default (`useLegalPage.setHreflangLinks`). Đó là khuôn mà phần còn
      lại của site cần trước khi `*.meta.*` có ý nghĩa với crawler.
    - `apps/landing/src/index.html` vẫn cứng `<html lang="en">` + `<title>` + og/twitter. Đây là
      shell SSR mà crawler thấy đầu tiên, và **không** dịch được bằng dictionary vì nó là file HTML
      tĩnh. Cần server đọc locale rồi rewrite head theo từng request, cộng URL theo locale. Việc
      routing/SSR, không phải việc copy — **chưa mở task**.
  - Còn lại trong 388: batch 3 (a11y, ~97 chuỗi) và batch 4 (legal prose, ~460 dòng).
  - Chuỗi tiếng Anh còn sót lại đều là ngoại lệ đã chốt: `Email`, honeypot `Website` (bait cho bot,
    nằm trong `aria-hidden`), `Colophon.`/`Version.` (danh từ riêng), `Deployment ID`, `CORE STACK`,
    `LOCATION`.
  - `nx build landing --skip-nx-cache` sạch, 233 test xanh (+1 test guardrail mới).
- [2026-07-28] **Phase 2 batch 3 xong — a11y.** Dictionary 401 → **476 key** (+48 `a11y.*` dùng chung,
  +22 `*.a11y.*` theo từng surface, +5 key khác). User bỏ gate duyệt cho batch này ("a11y thì chắc
  mình không cần duyệt đâu"), chỉ giữ một ràng buộc: **đừng cố dịch từ chuyên ngành**.
  - **Hai quy tắc chốt cho khối `a11y.*`**, ghi ngay trong docblock của dictionary:
    1. Từ UI mà người Việt vốn đã nói bằng tiếng Anh thì **giữ tiếng Anh**: `slide`, `carousel`,
       `panel`, `editor`, `menu`, `tab`, `Stack`, `build`. Dịch thành "bản chiếu" hay "băng chuyền
       ảnh" làm screen reader **khó hiểu hơn**, không phải dễ hơn.
    2. **Nhãn landmark không phải heading**: nó trả lời "tôi đang ở vùng nào", nên luôn là cụm danh
       từ, không phải câu, không có dấu câu.
  - `aria-roledescription="carousel"` / `"slide"` **cố tình giữ literal tiếng Anh** trong template:
    chúng ghi đè _role_ mà screen reader đọc, và cả hai từ đúng là từ người Việt dùng cho widget này.
  - Pattern áp cho 20 component `shared/ui`: component tự inject `LandingLocaleService` rồi resolve
    nhãn của chính nó (giống Phase 3). Ba component có default là literal (`carousel.ariaLabel` =
    `'Image carousel'`, `view-toggle.ariaLabel` = `'View layout'`, `section-dots.label` =
    `'Sections'`) đổi default thành `''` + computed `x || resolveCopy(...)`, nên caller truyền vào
    vẫn thắng mà caller không truyền thì được cả hai ngôn ngữ.
  - Nhãn có index (`Go to slide 3`, `Show image 5`) resolve qua **computed array** theo
    `(locale, count)`, không phải method gọi trong `@for` — method sẽ dựng lại chuỗi mỗi vòng CD.
  - **Phân biệt nhãn nhìn thấy vs nhãn được đọc** — ba chỗ cố ý khác chữ, đã ghi lý do tại chỗ: - `pagination`: nhìn thấy `Prev`/`Next` (viết tắt vì chật chỗ), đọc `Previous page`/`Next page` —
    viết tắt là đúng thứ không nên đưa cho screen reader. - `blog.share-row`: nhìn thấy `Copy link`/`Copied`, đọc `Copy link`/`Link copied` — bản đọc phải
    nói rõ đã copy _cái gì_ vì không có icon link đi kèm. - `legal.*.a11y.content`: `Terms of Use` không dấu chấm, khác `legal.terms.title` = `Terms of
Use.` — dấu chấm là lựa chọn typographic cho `<h1>`, screen reader đọc nó thành ngắt câu.
  - **Ba lỗi tìm ra khi quét, không phải khi dịch:**
    1. `command-palette.html:19` — placeholder `Search pages, projects, actions…` là chuỗi **nhìn
       thấy được** bị sót ở batch 2. Nó nằm trên attribute nên không một guardrail nào trong ba
       pattern thấy được. → `palette.placeholder`.
    2. `carousel.ts:161` — live region `aria-live="polite"` đọc `Slide 2 of 7` cứng tiếng Anh. →
       `a11y.slide.live`, tách khỏi `a11y.slide.position` vì live region không có ngữ cảnh xung quanh
       để dựa vào nên phải nói cả chữ `Slide`.
    3. `copy-to-clipboard.directive.ts:13` — docblock **đang dạy sai pattern**
       (`[attr.aria-label]="'Copy ' + email()"`). Sửa để trỏ về `a11y.button.copyValue`.
  - Ba landmark trên Home (`Hero`, `The Stack`, `The Story`) **tái dùng `home.section.*`** thay vì có
    key riêng: pill nav đã đặt tên cho đúng những vùng đó, và hai tên cho một vùng chính là cách
    `Who` / `Who I Am` lệch nhau ở batch 2.
  - `notFound` cần **hai** key cho cùng một khối link (`recovery` cho sr-only heading,
    `recoveryLinks` cho landmark): heading đặt tên cho một phần của document, landmark đặt tên cho
    một vùng để nhảy tới, và screen reader đọc chúng ở hai ngữ cảnh khác nhau.
  - `blog.a11y.floatingToc` cố ý khác `common.onThisPage`: rail nổi và TOC inline giữ cùng bộ link,
    nếu trùng tên thì screen reader gặp hai landmark cùng tên và người dùng không biết mình đang ở đâu.
  - Không đụng `/ddl` (design sandbox, ngoài scope) và `apps/landing/src/index.html` (shell tĩnh).
  - Quét cuối: **không còn** `aria-label` literal, `sr-only` literal, hay nhãn ghép bằng tiếng Anh
    trong `apps/landing/src` + `libs/landing` (trừ `/ddl`). `alt=` không có literal nào.
  - `nx build landing --skip-nx-cache` sạch, 233 test xanh (214 `ui` + 16 `landing` + 3 `feature-blog`).
  - Còn lại trong 388: **chỉ batch 4** (legal prose, ~460 dòng `/terms` + `/privacy`).
- [2026-07-28] **Phase 2 batch 4 xong — legal prose. Task 388 đóng.** Batch này **không phải dịch
  mới**: cả `/terms` và `/privacy` đã song ngữ đầy đủ trong `<landing-t>` từ trước, và bản tiếng Việt
  vốn đã tốt. Đây là một lượt **audit** 35 section (18 terms + 17 privacy), so từng cặp EN/VI. Áp 25
  sửa đổi (9 terms + 16 privacy).
  - **Sửa quan trọng nhất — một lỗi dịch có ảnh hưởng pháp lý thật.** `terms.html` §7 (Giới hạn trách
    nhiệm) dịch `gross negligence` thành `cố ý nghiêm trọng`. `cố ý` là **hành vi có ý định**, còn
    `negligence` là **lỗi vô ý** — hai thứ đối lập nhau. Trong một điều khoản miễn trừ trách nhiệm,
    câu tiếng Việt vô tình thu hẹp phạm vi trách nhiệm không thể miễn trừ, so với câu tiếng Anh. Đã
    sửa thành `lỗi cẩu thả nghiêm trọng`. **Đây là thay đổi nghĩa pháp lý — cần user xác nhận.**
  - **11 em-dash trong prose pháp lý** (6 terms + 5 privacy), ở **cả hai** ngôn ngữ. Không đổi dấu
    suông mà tái cấu trúc câu theo đúng quy tắc: cặp em-dash chèn giữa câu → dấu ngoặc đơn (§2.1, giữ
    `bao gồm`/`including` để danh sách vẫn là không giới hạn) hoặc dấu phẩy (§6); em-dash nối hai mệnh
    đề độc lập → tách thành hai câu (privacy §2, §3.3).
  - **Lỗ hổng guardrail thứ tư.** `landing-copy.spec.ts` chặn em-dash/en-dash trong **giá trị của
    `LANDING_COPY`** — tức mọi chuỗi plain, và **không** chạm tới copy HTML-rich trong `<landing-t>`,
    nơi chứa lượng prose dài nhất của site. Vì vậy 11 em-dash sống trong hai trang legal nhiều tháng.
    Đã thêm test thứ tư vào `landing-copy-contract.spec.ts`: quét prose render được trong mọi file
    `.html`, bỏ qua HTML comment `<!-- -->` **và** CSS comment `/* */` (`index.html` có inline
    `<style>`), miễn trừ glyph trang trí nằm trong `aria-hidden="true"` (dấu gạch trước role ở Home
    hero, placeholder thumbnail rỗng ở `/projects` — là typography, screen reader không đọc). Comment
    được **làm trắng tại chỗ** thay vì xoá để số dòng báo lỗi vẫn khớp file. Đã probe: đỏ đúng dòng
    khi chèn em-dash, xanh lại khi gỡ.
  - **Các lỗi dịch nhỏ hơn, sửa theo quy tắc ngôn ngữ đã chốt:**
    - Câu thiếu chủ ngữ: `Không phải tư vấn chuyên môn.` → `Đây không phải là tư vấn chuyên môn.`;
      `Truy cập là rủi ro của bạn.` → `Bạn tự chịu rủi ro khi truy cập các website đó.`
    - Cụm động từ bị cắt: `tham gia bảo vệ` → `tham gia vào việc bảo vệ khiếu nại đó` (bảo vệ _cái gì_).
    - Calque: `việc truyền được tài liệu hoá` → `việc truyền dữ liệu được lập hồ sơ`.
    - Sai trật tự từ tới mức vô nghĩa: `Các biện pháp bảo đảm hoặc đầy đủ (adequacy)` →
      `Cơ chế adequacy hoặc các biện pháp bảo đảm khi truyền dữ liệu`.
    - Sai nghĩa nhẹ: `giữ được ý nghĩa ban đầu` → `giữ được mục đích ban đầu` (`intent` là mục đích,
      không phải nghĩa); `cơ quan có thẩm quyền` → `cơ quan giám sát dữ liệu` (`supervisory`).
    - Thiếu vế so với EN: thêm `, phù hợp với luật áp dụng` (privacy §6); `hiểu nội dung nào hữu ích
để cải thiện` → `và cải thiện` (EN là hai mục đích song song, VI biến thành một mục đích phụ
      thuộc); `hãy liên hệ tôi để xoá` → `hãy liên hệ tôi và tôi sẽ xoá dữ liệu đó` (ai xoá).
    - Ngữ pháp: `đều ràng buộc bởi` → `đều bị ràng buộc bởi`; `quốc gia bạn cư trú` → `quốc gia nơi
bạn cư trú`; `chính sách của họ riêng` → `chính sách riêng của từng bên`.
  - **Hai chỗ bản tiếng Anh mới là bản sai**, không phải tiếng Việt: `Location: Vietnam` → `Country:`
    (giá trị là một quốc gia, và bản VI đã ghi `Quốc gia`); dòng cơ quan A05 bị **đảo thứ tự** giữa
    hai ngôn ngữ (EN dẫn bằng Bộ, VI dẫn bằng Cục) — đã thống nhất Bộ trước, Cục sau, ở cả hai.
  - **Cố ý KHÔNG sửa:** tên trong văn bản pháp lý là `Trần Đức Phương` (VI) / `Phuong Tran` (EN),
    khác quy ước hiển thị `Phương Trần` ở commit 9514dce7. Văn bản pháp lý dùng tên đầy đủ là **đúng
    hơn**, không phải lệch chuẩn. Xưng `tôi` (không phải `mình`) cũng đúng văn phong pháp lý.
  - Kiểm chứng sau khi sửa: id của 35 section vẫn khớp 1-1 giữa EN và VI, không section nào lệch số
    câu quá 1, tổng em-dash + en-dash trong hai file = 0.
  - `nx build landing --skip-nx-cache` sạch, **234 test xanh** (214 `ui` + 17 `landing` + 3
    `feature-blog`), trong đó có test guardrail thứ tư mới.
- [2026-07-27] Phase 5 xong. `.context/landing-i18n.md` + 2 mục trong `CLAUDE.md` (Context Files +
  Critical Guardrails) + spec guardrail `landing-copy-contract.spec.ts` (đã probe: đỏ khi vi phạm).
  Task còn mở vì Phase 2 chưa xong: batch 2 (~55 chuỗi chỉ-EN nhìn thấy được), batch 3 (65 chuỗi
  a11y), batch 4 (legal prose) — cả ba cần user duyệt bản dịch VI trước khi áp.

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
