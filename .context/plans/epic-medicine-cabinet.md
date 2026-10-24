# Epic: Tủ thuốc cá nhân

Size: L · chạm dữ liệu sức khỏe của nhiều người (Owner, mẹ, có thể thêm người khác); ghi sai liều có thể gây hại khi dùng lại

## Status: draft

Phase 1 (Problem Discovery) đã xong ngày 2026-10-23: Owner (cũng là người đưa vấn đề) đã trả lời vòng confirm. Phase 2 (Solution Design) đang chạy. Checklist size L, run 1 (xem `learning/workflow/run-log.md`). Các bản phát hành gọi là **slice 1, slice 2** để không lẫn với phase của checklist.

## E1 · Problem *(logic)*

**Problem:** Khi đi xa, đang vội, hoặc ở nhà mà cần thuốc hay y tế phẩm, Owner không nhớ trước đây mình (hoặc mẹ) đã dùng gì, nên không dùng lại được và không chuẩn bị được cho chuyến đi. [Owner]

**Lõi của vấn đề:** lưu trữ tri thức và kinh nghiệm của Owner và người thân về thuốc, y tế phẩm, để tra cứu lại một cách đơn giản. Hai hành động chính: **lưu trữ** và **tra cứu**. [Owner]

**Evidence:** ví dụ thật: tra lại "Simethicone"; chuẩn bị thuốc dạ dày cho chuyến Hà Nội 3 ngày. Không có sự cố cụ thể nào; hậu quả là mất thời gian research lại nhiều lần. [Owner]

**Why now:** không có deadline; feature này là ticket thật đầu tiên để chạy thử checklist size L. [Owner]

**Users and context:** chỉ Owner dùng app. Người **được ghi dữ liệu** là một chuyện khác: Owner, mẹ, và có thể thêm người khác sau này; mẹ không dùng app. Owner dùng cả landing lẫn console, cả điện thoại lẫn desktop. Tình huống cần tra xảy ra không cố định (đi khám, đi xa, có vấn đề sức khỏe), cách nhau vài ngày đến vài tháng. [Owner]

**How they do it today:** hỏi thẳng AI (Claude), không lưu lại gì, rồi quên. Các cách khác Owner không tin bằng: dược sĩ ở nhà thuốc (họ là người bán hàng), bác sĩ (tốn thời gian), web/AI (không chắc chắn, không biết lịch sử của Owner). Owner tin nhất là thuốc mình đã từng dùng. [Owner]

## E2 · Done and measure *(logic)*

| Measure | Baseline (today) | Target | How it is read |
|---|---|---|---|
| Thời gian từ lúc cần tới lúc biết thuốc nào + liều bao nhiêu | hỏi lại AI: 10–20 phút với thuốc mới, 2–3 phút với thuốc đã dùng (Owner ước, 2026-10-23) [Q-6] | dưới 1 phút trên điện thoại [Claude-proposed] | Owner tự bấm giờ ở 2–3 lần tra đầu tiên |
| Số lần tra được trả lời bằng ghi chép, không phải hỏi lại AI | 0 (hôm nay không có ghi chép) | đa số lần tra [Claude-proposed] | Owner tự đếm trong 3 tháng đầu |

Khi xong: Owner mở landing, tra ra thuốc đã dùng, đối chiếu với thuốc thật đang cầm trên tay, nhanh hơn và đáng tin hơn hỏi AI. [Owner]

## E3 · Scope *(logic)*

### In
- Lưu một thuốc hoặc y tế phẩm đã dùng, cho Owner hoặc cho mẹ [Owner]
- Mỗi người có một profile thuốc riêng, hoặc cách nào đó nhìn vào là biết rõ thuốc nào của ai; số người không giới hạn ở hai [Owner]
- Ghi cả thuốc đã dùng mà không hợp hoặc chưa rõ kết quả, vì đây là ghi nhận "thuốc đã sử dụng" [Q-3]
- Thuốc dùng lâu dài (ví dụ thuốc mỡ máu) lẫn thuốc dùng theo đợt [Q-5]
- Tên để tra và đưa ở nhà thuốc: tên hoạt chất nếu thuốc chỉ có một hoạt chất; tên thuốc chính xác nếu thuốc có nhiều hoạt chất, kể cả khi công thức phối hợp là loại phổ biến [Q-2]
- Tra lại theo tên thuốc [Owner]
- Một view thấy mọi món của tất cả mọi người, lọc được theo người [Owner]
- Ghi cả vật tư y tế (nhiệt kế, băng gạc), không chỉ thuốc [Owner]
- Tra theo mục đích hoặc triệu chứng, khi Owner không biết tên thuốc cần tìm ("bệnh A thì dùng gì") [Owner]
- Lát 1 nhập tay. Thông tin tối thiểu: tên thuốc, mục đích, liều/hàm lượng, thời điểm và cách uống (trước hay sau ăn) [Owner]
- Một danh sách, không có bản nháp [Owner]

### Out
- Người dùng app khác (bạn bè, nhiều tài khoản, thương mại hóa). Khác với người được ghi dữ liệu ở mục In [Owner]
- Gợi ý thuốc hay chẩn đoán: đây là trí nhớ cá nhân, không thay bác sĩ [Q-1]
- Nhắc xem lại ghi chép cũ: tạm thời chưa quan tâm [Q-4]
- Lịch sử sửa: chưa cần trong slice này, nhưng sẽ đến từ một chuẩn chung cho mọi feature (→ History ở E5) [Owner]
- Nhập tự động (AI qua MCP, hoặc OCR): để slice 2 [Owner]

### Situational edge cases

Phép thử tờ giấy: nếu Owner ghi bằng một cuốn sổ giấy thì edge case này vẫn xảy ra không? Có → edge case của tình huống, ghi ở đây. Không → edge case do phương án sinh ra, để phase 2.

| Edge case | Decision | Note |
|---|---|---|
| Owner không biết cần tra gì, chỉ biết triệu chứng | in | tra theo mục đích [Owner] |
| Thông tin cũ không được cập nhật, thành kiến thức cũ hoặc sai | out (slice 1) | chưa quan tâm [Q-4] |
| Nhu cầu mới hoặc thuốc mới, chưa có kinh nghiệm | in | ghi là đã dùng, chưa rõ kết quả [Q-3] |
| Ở nhà thuốc nơi khác, cùng hoạt chất nhưng tên biệt dược khác (Simethicone bán dưới nhiều tên) | in | tra theo hoạt chất khi chỉ có một hoạt chất [Q-2] |
| Cùng một thuốc, liều của Owner khác liều của mẹ; lấy nhầm liều của người kia | in | mỗi người một profile thuốc [Owner] |
| Thuốc từng dùng nhưng không hợp hoặc bị dị ứng | in | [Q-3] |
| Thuốc dùng theo đợt (vài ngày) khác thuốc dùng lâu dài | in | có thuốc dùng lâu dài: thuốc mỡ máu [Q-5] |
| Đang gấp, một tay, ở nhà thuốc hoặc trên đường | in | tra trên điện thoại phải nhanh [Claude-proposed] |
| Mạng yếu hoặc mất mạng | out | mặc định mạng nhanh, không làm offline [Owner] |
| Ghi chép sai liều, Owner tin ghi chép hơn dược sĩ nên dùng sai | in | ghi chép phải dễ sửa và cho thấy nguồn (bác sĩ kê, tự mua) [Claude-proposed] |

**Affected indirectly:** mẹ và những người khác được ghi dữ liệu (dữ liệu sức khỏe của họ nằm trong hệ thống dù họ không dùng app). [Owner]

## E4 · Questions

| # | Question | Who answers | Answer | Date | Blocking |
|---|---|---|---|---|---|
| Q-1 | Giả định: app chỉ ghi lại và tra lại, không bao giờ gợi ý thuốc. Đúng không? | Owner | Đúng | 2026-10-23 | yes |
| Q-2 | Ở nhà thuốc, bạn cần đưa ra cái gì: tên biệt dược, tên hoạt chất, hay hình hộp thuốc? | Owner | Tên hoạt chất nếu chỉ có một hoạt chất; tên thuốc chính xác nếu có nhiều hoạt chất | 2026-10-23 | yes |
| Q-3 | Bạn có muốn ghi cả thuốc "đã thử, chưa biết kết quả" và thuốc "không hợp"? | Owner | Cần, vì đây là ghi nhận thuốc đã sử dụng | 2026-10-23 | no |
| Q-4 | Một ghi chép cũ thì bạn cần biết nó cũ cỡ nào (ngày dùng gần nhất), hay cần app nhắc xem lại? | Owner | Tạm thời chưa quan tâm | 2026-10-23 | no |
| Q-5 | Có thuốc nào bạn hoặc mẹ dùng lâu dài không, hay toàn dùng theo đợt? | Owner | Có dùng lâu dài: thuốc mỡ máu | 2026-10-23 | no |
| Q-6 | Một lần research lại hôm nay tốn bao lâu, ước chừng? | Owner | 10–20 phút nếu là thuốc mới, 2–3 phút nếu là thuốc đã dùng | 2026-10-23 | no |
| Q-7 | Bỏ ô "ngày dùng gần nhất", chỉ giữ ngày ghi và ngày sửa do hệ thống tự ghi. Đúng không? | Owner | Đồng ý | 2026-10-23 | no |
| Q-8 | Để kịp 1–2 buổi: người (`HealthProfile`) chỉ cần thêm và đổi tên trong một danh sách nhỏ ở console, không cần trang chi tiết. Đúng không? | Owner | Đồng ý | 2026-10-23 | yes |
| Q-9 | Xóa một món: xóa hẳn, hay vào thùng rác khôi phục được (soft delete, dữ liệu còn mãi)? Xóa một người khi còn món: chặn lại, hay xóa luôn các món? | Owner | Database luôn soft delete theo khuôn chung; UI xóa hẳn, có xác nhận. Phần xóa người còn món chưa trả lời (→ Q-11) | 2026-10-23 | yes |
| Q-10 | Lịch sử sửa sau này lưu nguyên văn những trường nào (ví dụ liều, kết quả), hay chỉ lưu tên trường đã đổi? Có thể để tới lúc làm audit trail | Owner | Lưu nguyên văn, chuẩn banking: trường nào sửa, ai sửa, lúc nào, lọc theo action. Làm ở slice sau | 2026-10-23 | no |
| Q-11 | Xóa một người khi người đó còn món: chặn lại và báo còn bao nhiêu món, hay xóa luôn các món của họ? (mặc định: chặn lại) | Owner | Báo số món để Owner xác nhận; xác nhận thì xóa luôn các món | 2026-10-23 | yes |

## E5 · Design

**Chosen option:** console để quản lý (CRUD), một trang private trên landing để tra cứu [Owner]
**Why (Owner's words):** "console CRUD, landing tra cứu" [Owner]

### Options considered
| Option | Pros | Cons | Why not |
|---|---|---|---|
| A. Một trang private trên landing, vừa nhập vừa tra | một giao diện, nhập được trên điện thoại | form phải tự làm bằng `landing-*` | Owner muốn quản lý ở console |
| **B. Console CRUD + landing tra cứu** | console có sẵn khuôn CRUD (feature-tag); landing chỉ đọc nên nhẹ | hai giao diện | được chọn |
| C. File markdown trong repo learning, push lên như checklist | gần như không cần backend; git giữ lịch sử | không nhập được từ điện thoại; mỗi lần sửa phải push | không khớp cách Owner muốn quản lý |

### Data model [Claude-proposed]
- **`HealthProfile`**: một người được ghi dữ liệu (tên, quan hệ với Owner). Không phải tài khoản đăng nhập.
- **`MedicalItem`**: một món trong tủ, thuộc về một `HealthProfile`.
  - Chung: `kind` (`MEDICINE` / `SUPPLY`), tên, mục đích hoặc triệu chứng, kết quả (`WORKED` / `DID_NOT_SUIT` / `UNKNOWN`), nguồn (`PRESCRIBED` / `SELF_BOUGHT`), ghi chú
  - Chỉ `MEDICINE`: hoạt chất `activeIngredients String[]`, hàm lượng, liều, thời điểm uống (trước hay sau ăn), loại dùng (`LONG_TERM` / `COURSE`)
  - Ngày: `createdAt`, `updatedAt` do hệ thống ghi. Không có ô "ngày dùng gần nhất" [Q-7]
- Cùng một thuốc mà hai người dùng thì là hai `MedicalItem`, vì liều có thể khác.
- **Tên hiển thị** theo Q-2: đúng một hoạt chất thì hiện tên hoạt chất, còn lại hiện tên thuốc. Luật này là một domain policy có unit test. [Claude-proposed]
- **Xóa:** database luôn soft delete (`deletedAt`), theo khuôn chung của các entity nội dung (Tag, Skill, Project, …). UI là xóa hẳn: có hộp xác nhận, không có thùng rác để khôi phục [Q-9]. Hệ quả: dữ liệu sức khỏe còn trong database sau khi xóa trên UI.
- **Xóa một người khi còn món:** hộp xác nhận báo người đó còn bao nhiêu món; Owner xác nhận thì xóa người và xóa luôn các món của họ (cùng soft delete) [Q-11].

### Lookup [Claude-proposed]
- Trang private trên landing tải toàn bộ món một lần (dữ liệu nhỏ), lọc ở trình duyệt.
- Mặc định hiện mọi món của mọi người; lọc theo người.
- Tìm theo tên, hoạt chất, mục đích; không phân biệt hoa thường và dấu ("thuoc da day" ra "thuốc dạ dày"). Chữ "đ" phải về "d": NFD không làm việc này, nên dùng lại cách xử lý dấu của `slug.value.ts` và có test riêng cho "đ".
- Mỗi kết quả có link sang trang sửa ở console, để sửa liều sai ngay trên điện thoại (E3). Trang sửa đó phải dùng được ở bề rộng điện thoại. [Claude-proposed]
- Từ khóa không bao giờ nằm trên URL, để Umami không ghi tên thuốc.

### History
Không làm trong slice 1 [Owner]. Chuẩn chung dự kiến là epic audit trail (`epic-audit-trail-system.md`), nhưng epic đó **chưa có code**: chưa có module `audit`, chưa có interceptor trên `CommandBus`. Feature này chỉ chuẩn bị để được phủ sau:
- Mọi command của feature kế thừa `BaseCommand` (có `userId`), khác với command của checklist hiện nay.
- Slice 2 (machine token) cần một actor riêng cho token, vì command của radar hiện không mang actor.
- Yêu cầu cho audit trail, làm ở slice sau [Q-10]: chuẩn banking, lưu nguyên văn giá trị trước và sau; cho biết trường nào đã sửa, ai sửa, lúc nào; lọc được theo action. Epic audit trail hiện mask PII, nên khi làm phải ghi một ADR cho ngoại lệ dữ liệu sức khỏe.

### Security [Claude-proposed]
- Cả controller có `@UseGuards(JwtAccessGuard, RoleGuard)` + `@Roles(['ADMIN'])` như checklist, không như tag (tag để `GET` công khai). Một e2e test: gọi `GET` không đăng nhập thì nhận 401.
- Trang landing đi trong private area: chỉ render ở trình duyệt, header `noindex`.

### Observability [Claude-proposed]
Không thêm gì trong slice 1: chỉ một người dùng, lỗi API đã có log sẵn. Không gửi sự kiện Umami nào chứa tên thuốc.

### Blast radius
- **In code:** module API mới `medicine-cabinet`; Prisma migration chỉ thêm 2 bảng và enum (đảo ngược được bằng drop); console thêm một feature lib + mục menu; landing thêm một route private + mục trong `workspacePages`.
- **Outside code:** Umami (từ khóa không lên URL); backup database trên Railway giờ chứa dữ liệu sức khỏe.

### Migration
Chỉ thêm bảng mới, không đụng dữ liệu cũ. Rollback: drop 2 bảng.

### Rabbit holes and appetite
- **Appetite:** 1–2 buổi cho slice 1, để kịp chạy thử checklist [Owner]
- **Rabbit holes:**
  - Offline (PWA): out, mặc định mạng nhanh [Owner]
  - Full-text search: out; lọc chuỗi con ở trình duyệt là đủ với dữ liệu nhỏ
  - Cơ sở dữ liệu thuốc bên ngoài (tự điền hoạt chất): out
  - Lịch sử sửa: chuyển sang epic audit trail
  - Form hai dạng (thuốc và vật tư): một form, ẩn các trường chỉ dành cho thuốc khi `kind = SUPPLY`
  - Hai entity theo khuôn tag là khoảng 30 file; `HealthProfile` rút còn một danh sách nhỏ ở console, chỉ thêm và đổi tên, không có trang chi tiết [Q-8]

### Slices (T1)
1. **Slice 1:** API (2 entity, CRUD, list) · console CRUD theo khuôn feature-tag · trang tra cứu private trên landing
2. **Slice 2:** nhập bằng AI (machine token như radar, hoặc MCP); phase 2 của slice 2 quyết định
3. **Sau đó:** lịch sử sửa đến từ epic audit trail, không làm trong epic này

