# Task: Job-change content sweep (Redoc → WorkBuddy)

## Status: in-progress

## Goal

Update every piece of prod content that a job change invalidates, and add the three
Experience records that fill `/about` §01. Author picked **positioning hướng C** on
2026-09-26: identity stays **Frontend Engineer**, and end-to-end product ownership is
added to `bioShort` / `aboutLede` rather than changing the title.

This task exists because the job change hit content that was already locked, and because
the work splits cleanly around a future date. It is a **content** task: no code changes.

## Timing (the reason this is two waves)

| Mốc | Ngày | Hệ quả cho content |
| --- | --- | --- |
| Hôm nay | 2026-09-26 | Vẫn đang ở Redoc. Mọi câu nói về Redoc ở thì hiện tại **vẫn đúng** |
| Kết thúc ở Redoc | 2026-10-16 | Từ đây các câu "Right now … LOS" thành sai |
| Onboard WorkBuddy | 2026-11-02 | Wave 2 phải publish xong trong ngày này |

**Wave 1 làm ngay** (đang sai hôm nay, hoặc là hygiene không phụ thuộc ngày).
**Wave 2 nháp trước, publish 2026-11-02.**

## Three rules adopted with this task

Nguyên nhân gốc khiến một lần đổi việc làm sai 11 field: fact có hạn sử dụng bị trộn vào
copy evergreen. Ba luật chốt kèm task này:

1. **Không viết số năm kinh nghiệm thành chữ trong copy.** Hoặc dẫn xuất từ
   `Profile.yearsOfExperience`, hoặc bỏ cách nói đó. Ngoại lệ hợp lệ: **thời lượng của một
   công việc đã kết thúc** ("For four years I owned …") — con số đó không bao giờ hết hạn.
2. **"Hiện tại mình đang làm X" chỉ sống ở đúng hai chỗ:** record Experience mới nhất, và
   trang `/now`. Không nhúng vào `bioLong`, `bioShort`, `tagline`.
3. **Tên công ty chỉ xuất hiện trong record Experience.**

## Acceptance Criteria

### Wave 1 — ngay

- [ ] `Profile.availability`: `OPEN_TO_WORK` → `EMPLOYED`
- [ ] `Profile.openTo`: gỡ `FULL_TIME`, giữ `FREELANCE` + `CONSULTING` + `SIDE_PROJECT` + `SPEAKING` + `OPEN_SOURCE`
- [ ] `Profile.contactIntro` EN + VI theo bản nháp dưới
- [ ] `Profile.stackIntro` EN + VI: gỡ số năm ở mệnh đề đầu
- [ ] `Profile.bioLong` đoạn 1 EN + VI: gỡ số năm
- [ ] `Profile.yearsOfExperience`: author quyết giữ `5` hay đổi (xem ghi chú)
- [ ] Record Experience **Redoc** + **AppCore** nhập xong → `/about` §01 hết "Career history coming soon."

### Wave 2 — publish 2026-11-02

- [ ] `Profile.aboutHeading` EN + VI
- [ ] `Profile.aboutLede` EN + VI
- [ ] `Profile.tagline` EN + VI
- [ ] `Profile.bioShort` EN + VI
- [ ] `Profile.bioLong` đoạn 3 EN + VI
- [ ] Record Experience **WorkBuddy** + điền `endDate` cho Redoc
- [ ] Verify live cả hai locale trên prod

### Ngoài phạm vi chữ

- [ ] Kiểm tra quyền với org `phuong-tran-redoc` (GitHub + npm) sau khi rời Redoc — 4 link công khai của Document Engine nằm ở đó, và chúng là lý do một sản phẩm công ty được lên featured

---

## Wave 1 — bản nháp dán được

### `Profile.contactIntro`

```
EN: Frontend Engineer, based in HCMC. In a full-time role, and open to freelance or
    consulting on the side.

VI: Frontend Engineer, mình ở TP.HCM. Hiện đang làm full-time, và vẫn sẵn sàng cho các
    dự án freelance hoặc consulting.
```

### `Profile.stackIntro` — chỉ mệnh đề đầu tiên

```
EN cũ:  Most of my five years writing code have been with Angular.
EN mới: Most of my time writing code has been with Angular.

VI cũ:  Phần lớn hành trình viết code của mình, 5 năm, là làm việc với Angular.
VI mới: Phần lớn hành trình viết code của mình là làm việc với Angular.
```

### `Profile.bioLong` đoạn 1 — chỉ mệnh đề giữa

```
EN cũ:  but after five years in software, I think an engineer has to grasp it just as deeply.
EN mới: but having spent my career in software, I think an engineer has to grasp it just as deeply.

VI cũ:  nhưng sau 5 năm trong ngành phần mềm, mình nghĩ là một engineer cũng phải thấu hiểu điều này.
VI mới: nhưng sau những năm làm trong ngành phần mềm, mình nghĩ là một engineer cũng phải thấu hiểu điều này.
```

### `Profile.yearsOfExperience` — cần author quyết

Đang là `5`. Tính chặt từ mốc bắt đầu sự nghiệp 01/2022 (AppCore) thì tới 09/2026 là **4 năm
8 tháng**, đủ 5 năm vào 01/2027. E0 §2 làm tròn lên thành "~5 years as of 2026-05". Hai lựa
chọn: giữ `5` và coi là làm tròn, hay để `4` cho tới tháng 01/2027. Không có bề mặt nào in
con số này thành chữ nữa sau khi sửa `stackIntro` và `bioLong`, nên tác động nhỏ.

---

## Wave 2 — bản nháp dán được (hướng C)

### `Profile.aboutHeading` — H1 trang /about

```
EN: Hi, I'm Phuong, a Frontend Engineer specializing in complex operations software.
VI: Chào, mình là Phương, một Frontend Engineer chuyên về các hệ thống vận hành phức tạp.
```

Giữ nguyên khung "lời chào + chuyên môn" mà author chốt 2026-08-09. Chỉ đuôi đổi từ
"banking and fintech" sang loại hệ thống, theo hướng C: danh tính không neo vào ngành.

### `Profile.aboutLede` — cũng là meta + og description

```
EN: Loan origination in banking, now job management for field service teams, taken end to
    end from scoping to shipping. I like to understand the domain before I start a feature,
    and I keep looking for the version that costs the user the fewest steps.

VI: Khởi tạo khoản vay trong ngân hàng, và giờ là job management cho các đội field service,
    làm theo hướng đầu cuối từ lúc scope tới lúc ship. Mình thích tìm hiểu về domain trước
    khi bắt tay vào feature, và luôn tìm cách để thứ mình làm ra tốn ít bước nhất cho người
    dùng.
```

**Câu 2 giữ nguyên chữ author đã duyệt 2026-08-09** (luật ngôi thứ nhất, nói hành vi của
mình). Chỉ câu 1 là mới, và nó gánh luôn phần "end to end" của hướng C. Độ dài EN 245 ký
tự, bản cũ 211; cả hai đều vượt mốc 160 mà Google cắt. Muốn gọn thì bỏ cụm
"taken end to end from scoping to shipping" và để `bioShort` gánh ý đó.

### `Profile.tagline` — hero trang chủ

```
EN: I build the operational systems a business actually runs on. Permissions, loan flows,
    document processing, the core modules.

VI: Mình xây những hệ thống vận hành mà doanh nghiệp thực sự chạy trên đó. Phân quyền người
    dùng, nghiệp vụ cho vay, xử lý văn bản, những module cốt lõi.
```

Câu 1 thay mới, gỡ cả "Four years" lẫn "Singapore market". Danh sách proof ở câu 2 giữ
nguyên vì đó là việc đã thật sự ship.

### `Profile.bioShort` — bio-card Card B trang chủ

```
EN: Most of my career has gone into banking and fintech platforms, and now job management
    for field service. A frontend engineer who builds complex web platforms end to end,
    comfortable with architecture and design systems, and able to hold the backend when a
    project needs it.

VI: Phần lớn sự nghiệp của mình dành cho các nền tảng ngân hàng và fintech, và giờ là job
    management cho field service. Frontend engineer, đã xây dựng nhiều hệ thống web đa chức
    năng, đã hands-on với kiến trúc và design system, và có thể đảm nhận phần backend khi dự
    án cần.
```

Câu 2 giữ nguyên hoàn toàn. Nó vốn đã có "end to end" và "hold the backend", nên hướng C
không cần thêm gì ở field này. Câu 1 gỡ tên Redoc và gỡ đếm năm theo luật 1 + luật 3.

> **Quyết định nhỏ còn treo:** bản chốt cũ **cố ý nêu tên Redoc** ở đây vì coi đó là
> credential. Bản nháp trên gỡ tên ra. Nếu author muốn giữ tên công ty thì được, chỉ cần
> biết là mỗi lần đổi việc field này lại phải sửa.

### `Profile.bioLong` đoạn 3 — viết lại (RTE, sửa qua Console editor)

```
EN: For four years I owned the frontend of a loan origination system in the Singapore
    banking market, end to end: planning the system, making the technical calls, writing
    the features, fixing the bugs, and acting as one of the team's technical points of
    contact for the client. I'm now a Product Engineer, working on job management software
    for trade and field service businesses.

VI: Trong bốn năm, mình phụ trách mảng frontend của một hệ thống khởi tạo khoản vay cho thị
    trường ngân hàng Singapore, theo hướng đầu cuối: lên kế hoạch cho hệ thống, ra quyết
    định kỹ thuật, viết tính năng, sửa lỗi, và là một đầu mối kỹ thuật của team với khách
    hàng. Hiện mình là Product Engineer, làm phần mềm job management cho các doanh nghiệp
    trade và field service.
```

Không nêu tên WorkBuddy ở đây, theo luật 3 và theo ý author là "chưa onboard nên để ít
thông tin thôi". Tên công ty sống trong record Experience. "For four years" là thời lượng
của một công việc đã đóng nên không vi phạm luật 1.

Render contract §05 vẫn giữ: mỗi paragraph là một beat click-rọi-đèn, chỉ `italic` render
như nhấn.

---

## Experience records — 3 record cho `/about` §01

Field theo `model Experience` (`apps/api/prisma/schema.prisma:499`). `description`,
`responsibilities`, `highlights` là RTE 4 cột, nhập qua Console editor.

Ngày lưu ở mức ngày nhưng landing render ở mức tháng, nên không lộ ngày cụ thể.

### Record 1 — WorkBuddy (`displayOrder: 0`)

```
slug:            workbuddy
companyName:     WorkBuddy
companyUrl:      (author điền)
position:        EN "Product Engineer (Web)"  ·  VI "Product Engineer (Web)"
employmentType:  FULL_TIME
locationType:    (author chọn — JD ghi Ho Chi Minh)
locationCountry: Vietnam
locationCity:    Ho Chi Minh City
domain:          Field Service Management
startDate:       2026-11-02
endDate:         (trống)

description:
EN: An Australian company building job management software for businesses in trade,
    construction, maintenance, cleaning, plumbing, and facilities. The product covers the
    whole life-cycle of a job done in the field: scheduling, mobile field apps,
    subcontractor coordination, assets, compliance, and reporting.
VI: Một công ty Úc làm phần mềm job management cho các doanh nghiệp trade, construction,
    maintenance, cleaning, plumbing và facilities. Sản phẩm bao trọn vòng đời của một công
    việc làm ngoài hiện trường: scheduling, app mobile cho hiện trường, điều phối nhà thầu
    phụ, asset, compliance và báo cáo.

responsibilities:
EN: Owning web product features end to end, from scoping through shipping to iterating with
    real users. Angular and TypeScript on the front, NestJS APIs behind.
VI: Phụ trách các feature sản phẩm web theo hướng đầu cuối, từ scope cho tới ship và
    iterate cùng người dùng thật. Angular với TypeScript ở phía trước, NestJS ở phía sau.

highlights:      (để trống — chưa onboard, chưa có gì để kể)
skills:          Angular, TypeScript, NestJS  (chọn từ 21 Skill record có sẵn)
```

> Cố ý ít thông tin. Author chưa onboard nên record chỉ nói **vai trò là gì**, không khẳng
> định thành tích nào. `highlights` mở ra sau khi có việc thật đã ship.

### Record 2 — Redoc (`displayOrder: 1`)

```
slug:            redoc
companyName:     Redoc
position:        EN "Senior Frontend Engineer"  ·  VI "Senior Frontend Engineer"
employmentType:  FULL_TIME
locationCountry: Vietnam
locationCity:    Ho Chi Minh City
clientName:      (để trống — guardrail E0 §6.1: không nêu tên khách hàng / ngân hàng)
domain:          Banking · Finance · Real Estate
teamSizeMin/Max: 5 / 8
startDate:       2022-08-01
endDate:         2026-10-16
```

Title giữ "Senior Frontend Engineer" đúng theo quyết định 2026-07-04 trong E0 §2: bỏ nhãn
Senior ở copy định vị, **giữ nguyên ở record employment vì đó là title thật**.

Nguyên liệu cho `highlights`, lấy từ E0 §3 (đã là fact có kiểm chứng, chỉ cần viết lại
thành câu động từ - phạm vi - số liệu, EN + VI):

- Document Engine thay thế editor thương mại (CKEditor) trên các sản phẩm loan và finance.
  Bỏ được phí licence hằng năm, đạt tự chủ công nghệ. Artifact ở E0 §6.1
- Permission framework trải trên hơn 100 sub-module
- Hạ tầng xử lý PDF cho ký số và sinh văn bản tự động
- Đặt nền kiến trúc cho nhiều project cốt lõi, là pattern team xây tiếp trên đó
- Phối hợp với BA, PO, QA chuyển workflow từ Excel và giấy sang luồng số. Kết quả nêu:
  giảm khoảng 60% thời gian làm việc của khách hàng

**Đây là chỗ nhận lại bộ số liệu đã gỡ khỏi hero ngày 2026-08-09** (`100+ module`, `60%`).
Progress log của task 361 hôm đó ghi rõ hệ quả cần theo dõi là §01 Experience chuyển từ
"nên làm" thành "phải làm sớm". Record này đóng món đó.

### Record 3 — AppCore (`displayOrder: 2`)

```
slug:            appcore
companyName:     AppCore
position:        EN "Junior Frontend Engineer"  ·  VI "Junior Frontend Engineer"
employmentType:  FULL_TIME
locationCountry: Vietnam
locationCity:    Can Tho
domain:          B2B eCommerce
teamSizeMin/Max: 10 / 10
startDate:       2022-01-01
endDate:         2022-05-31

description:
EN: B2B eCommerce, landing pages, and inventory management for Australian-market clients.
VI: B2B eCommerce, landing page và quản lý kho cho khách hàng thị trường Úc.
```

Ngắn thôi, 4 tháng. Nhưng mục này tên là "Career history" nên để trống một chặng thật thì
lộ khoảng hở. Dữ kiện từ E0 §2.

---

## JD source — WorkBuddy Product Engineer (Web)

Chụp từ trang tuyển dụng ngày 2026-09-26, job ID 2218, trạng thái tin đã đóng. Lưu lại vì
trang tuyển dụng thường bị xóa sau vài tháng. **Đã bỏ tên, email và số điện thoại của bạn
tuyển dụng.**

**Về công ty.** WorkBuddy, công ty Úc. Làm giải pháp job management cho doanh nghiệp, đặc
biệt trong trade, construction, maintenance, cleaning, plumbing, facilities. Quản lý trọn
vòng đời của công việc làm ngoài hiện trường. Là hệ thống để điều phối nhân sự, job, asset,
nhà thầu phụ, compliance và báo cáo, thay cho bảng tính và các công cụ rời rạc.

Bốn nhóm năng lực: **Job & Workforce Management** (theo dõi job đầu cuối, scheduling, app
mobile cho hiện trường, điều phối nhà thầu phụ) · **Operations & Compliance** (an toàn,
compliance, asset tracking, quản lý dự án) · **Business Insights** (báo cáo và dashboard cho
theo dõi hiệu suất, ra quyết định dựa trên dữ liệu) · **Integrations** (kết nối hệ thống kế
toán, công cụ BI, nền tảng thứ ba).

**Phạm vi vai trò** (6 mảng, nguyên văn rút gọn):

1. Sở hữu sản phẩm và feature từ đầu tới cuối: khởi xướng ý tưởng, hiểu chiến lược và mục
   tiêu đằng sau, ship lên production với người dùng thật, iterate theo phản hồi, và chịu
   trách nhiệm cho thành công lâu dài của nó
2. Scope feature và project, gồm viết handover / technical design doc dạng as-built. Lý do
   nêu trong JD: người xây feature là người phù hợp nhất để viết tài liệu cho nó
3. Cải thiện hiệu năng ứng dụng: ship cải tiến kỹ thuật cho sản phẩm nhanh hơn, ổn định
   hơn, sẵn sàng scale
4. Cải thiện cách làm việc, không chỉ thứ được xây: tinh chỉnh quy trình phát triển, nâng
   chất lượng code và engineering best practice, giữ chuẩn zero-bug (bug sửa ngay, không
   tích trong backlog)
5. Làm việc sát với designer: tự ship và sở hữu phần trải nghiệm cơ bản bằng design system,
   tự quyết khi nào cần designer vào tinh chỉnh. Phối hợp với Customer Success để biết sản
   phẩm thật sự được dùng ra sao
6. Tư duy của một tester: testing là phần của việc xây, không phải việc của người khác. Tự
   chịu chất lượng của thứ mình ship

**Yêu cầu chung.** 3 đến 5 năm xây web app full-stack hướng khách hàng, đầu cuối, ở vị trí
full-time; lý tưởng là product hoặc SaaS startup, môi trường tăng trưởng nhanh, hoặc
consultancy có chuẩn engineering cao. Mạnh ở frontend, làm bằng Angular. Tiếng Anh mức
chuyên môn (C1, IELTS 6.0 hoặc tương đương), không cần chứng chỉ nhưng phải trình bày và
giải thích được giải pháp. Giải quyết vấn đề tự nhiên. Product sensibility: quan tâm UX, tốc
độ, độ tinh, muốn hiểu vì sao, và phản biện khi thấy không ổn. **AI-native**: dùng công cụ
AI trong việc hằng ngày để đi nhanh hơn, học nhanh hơn, nâng chất lượng. Chủ động cao, làm
được mà không cần PM kèm nhiều, thoải mái với sự chưa rõ ràng. Low-ego, linh hoạt, tử tế.

**Yêu cầu kỹ thuật.** Thành thạo Angular + TypeScript, RxJS là mặc định. Hiểu state
management (NgRx, Signals hoặc tương đương) và biết khi nào dùng cái nào. Thoải mái với
hiệu năng frontend: change detection, bundle size, render view dày dữ liệu (grid, scheduler,
dashboard), cập nhật real-time qua WebSocket. Kinh nghiệm thiết kế và xây REST API bằng
NestJS: DTO và validation, controller/service, giữ API contract sạch cho client có type. Data
modeling: thiết kế schema quanh access pattern, cache có chủ đích; MongoDB là điểm cộng
nhưng cách nghĩ quan trọng hơn. Làm được trong codebase lớn có sẵn, đọc và mở rộng service
người khác viết. Nice to have: messaging event-driven (NATS, RabbitMQ), Socket.IO, tích hợp
Stripe / Xero, hoặc xây agentic AI feature (họ build trên Mastra với Anthropic và OpenAI SDK).

**Job summary.** Company type: Product · Technical skills: Angular, TypeScript, NodeJS ·
Location: Ho Chi Minh, Viet Nam · Job ID: 2218.

### Mức khớp với portfolio hiện có

Ghi lại vì nó là lý do task này nhỏ hơn dự kiến: JD **nâng giá trị** đúng mấy đoạn content
đã viết, thay vì làm chúng lỗi thời.

| Portfolio đang có | JD yêu cầu |
| --- | --- |
| `coreStack` = Angular, Typescript | Chính xác hai thứ đó |
| `stackIntro` đoạn 2: tìm hiểu NestJS để hiểu backend cho tử tế | Yêu cầu cứng: thiết kế và xây REST API bằng NestJS |
| `bioShort`: "able to hold the backend when a project needs it" | Vai trò full-stack, mạnh ở frontend |
| `stackIntro` đoạn 3: dựng workflow và harness riêng trên Claude Code, site này ship bằng nó | AI-native, và họ build agentic AI trên Anthropic SDK |
| Design system có `/ddl` làm spec | Tự ship trải nghiệm cơ bản bằng design system |
| 523 file tài liệu trong `.context/` | Viết handover / technical design doc as-built |
| Learning Loop domain Testing, task 389 là kata testing | Tư duy tester, tự chịu chất lượng mình ship |
| Module form phức tạp ở ERP, console CRUD | View dày dữ liệu: grid, scheduler, dashboard |
| LOS cho ngân hàng Singapore | Codebase lớn có sẵn, đọc và mở rộng service người khác viết |

Sợi chỉ chung giữa hai domain được chính JD xác nhận bằng chữ của nó: WorkBuddy quản lý
"the whole life-cycle of jobs done in the field" với "staff, jobs, assets, subcontractors,
compliance, and reporting"; LOS quản lý trọn vòng đời một đơn vay với vai trò, hồ sơ, phê
duyệt, compliance. Cùng hình dạng hệ thống, khác tên nghiệp vụ. Đây là nền cho hướng C:
định vị theo **loại hệ thống**, không theo ngành.

## Dependencies

Không chặn bởi task nào. Liên quan: task **361** (content authoring master) — task này đóng
món "§01 Experience" và "Experience highlights audit" ở Tier 2 của 361.

## Complexity: M

**Reasoning:** Thuần content, không đụng code. Khối lượng nằm ở 3 record Experience (mỗi
record có 3 field RTE × 2 locale) cộng 8 field Profile. Không có migration, không có
quyết định kiến trúc. Chia hai wave theo ngày nên không dồn.

## Progress Log

- 2026-09-26 — Tạo task. Author chốt **hướng C** cho định vị: giữ danh tính Frontend
  Engineer, thêm ý sở hữu đầu cuối vào `bioShort` / `aboutLede`, và bỏ neo ngành ra khỏi
  `aboutHeading`. Đọc JD từ trang tuyển dụng (SPA, phải render bằng Playwright mới lấy
  được text) và lưu phần nội dung vai trò vào task này sau khi bỏ thông tin liên lạc của
  bạn tuyển dụng. Chụp lại prod và xác định đúng 8 field Profile bị ảnh hưởng. **Chỉnh một
  nhận định sai trước đó:** hai mốc 16/10 và 02/11 đều còn ở tương lai, nên các câu nói về
  Redoc ở thì hiện tại **vẫn đúng hôm nay**; món duy nhất đang sai là nhóm availability. Vì
  vậy task chia hai wave thay vì một đợt gấp. Ba luật chống hết hạn được chốt kèm.
