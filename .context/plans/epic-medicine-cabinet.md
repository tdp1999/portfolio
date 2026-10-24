# Epic: Tủ thuốc cá nhân

Size: L · chạm dữ liệu sức khỏe của nhiều người (Owner, mẹ, có thể thêm người khác); ghi sai liều có thể gây hại khi dùng lại

## Status: draft

Phase 1 (Problem Discovery) đã xong ngày 2026-10-23: Owner (cũng là người đưa vấn đề) đã trả lời vòng confirm. Phase 2 (Solution Design) xong ngày 2026-10-23: Owner (ở vai Manager) duyệt E5. Ngày 2026-10-24 checklist đổi thứ tự: phase 3 giờ là Flow & Prototype, phase 4 là Acceptance & Test Design. Epic quay lại phase 3 để viết flow, danh sách màn hình và data dictionary; quy tắc ở E6 giữ làm bản nháp cho phase 4. Checklist size L, run 1 (xem `learning/workflow/run-log.md`). Các bản phát hành gọi là **slice 1, slice 2** để không lẫn với phase của checklist.

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
| Thời gian từ lúc cần tới lúc biết thuốc nào + liều bao nhiêu | hỏi lại AI: 10–20 phút với thuốc mới, 2–3 phút với thuốc đã dùng (Owner ước, 2026-10-23) [Q-6] | dưới 1 phút trên điện thoại [Owner] | Owner tự bấm giờ ở 2–3 lần tra đầu tiên |

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
- Slice 1 nhập tay. Thông tin tối thiểu: tên thuốc, mục đích, liều/hàm lượng, thời điểm và cách uống (trước hay sau ăn) [Owner]
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
| Mạng yếu hoặc mất mạng | out | mặc định mạng nhanh, không làm offline [Owner] |
| Ghi chép sai liều, Owner tin ghi chép hơn dược sĩ nên dùng sai | in | ghi chép phải dễ sửa; không ghi nguồn, mặc định tin dữ liệu Owner nhập [Owner] |

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
| Q-12 | Trường bắt buộc chỉ là người, loại, tên; còn lại để trống được, để nhập nhanh. Đúng không? | Owner | Bắt buộc: người (profile), tên, hàm lượng (ô riêng, không ghi chung với tên), loại (mặc định là Thuốc). Hàm lượng chỉ bắt buộc với thuốc, vì vật tư không có ô này [R2] | 2026-10-24 | yes |
| Q-13 | Đổi một thuốc sang vật tư khi nó đã có liều, hoạt chất: xóa các trường đó khi lưu (có cảnh báo), hay không cho đổi loại sau khi tạo? (mặc định: không cho đổi loại) | Owner | Không cho đổi loại sau khi tạo; cần đổi thì xóa món đó và tạo món mới | 2026-10-24 | yes |
| Q-14 | Danh sách tra cứu mặc định mở ở chế độ nào (mini card hay dòng), và có nhớ lựa chọn lần trước không? | Owner | Mặc định dòng (row/table); nhớ lựa chọn | 2026-10-24 | no |

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
  - Chung: `kind` (`MEDICINE` / `SUPPLY`), tên, mục đích hoặc triệu chứng, ghi chú
  - Không có trường kết quả và trường nguồn (YAGNI) [Owner]. Thuốc không hợp hoặc chưa rõ kết quả [Q-3] ghi vào ghi chú. Hệ quả đã chấp nhận: không có nhãn "Không hợp" nổi bật, và ghi chú không được tìm (R4.4); Owner tự quyết định ghi gì [Owner]
  - Chỉ `MEDICINE`: hoạt chất `activeIngredients String[]`, hàm lượng, liều, thời điểm uống (trước hay sau ăn), loại dùng (`LONG_TERM` / `COURSE`)
  - Ngày: `createdAt`, `updatedAt` do hệ thống ghi. Không có ô "ngày dùng gần nhất" [Q-7]
- Cùng một thuốc mà hai người dùng thì là hai `MedicalItem`, vì liều có thể khác.
- **Tên hiển thị** theo Q-2: đúng một hoạt chất thì hiện tên hoạt chất, còn lại hiện tên thuốc. Luật này là một domain policy có unit test. [Claude-proposed]
- **Xóa:** database luôn soft delete (`deletedAt`), theo khuôn chung của các entity nội dung (Tag, Skill, Project, …). UI là xóa hẳn: có hộp xác nhận, không có thùng rác để khôi phục [Q-9]. Hệ quả: dữ liệu sức khỏe còn trong database sau khi xóa trên UI.
- **Xóa một người khi còn món:** hộp xác nhận báo người đó còn bao nhiêu món; Owner xác nhận thì xóa người và xóa luôn các món của họ (cùng soft delete) [Q-11].

### Lookup [Claude-proposed]
- Trang private trên landing tải toàn bộ món một lần (dữ liệu nhỏ), lọc ở trình duyệt.
- Một page: ô tìm kiếm ở trên, chip lọc theo người, kết quả có hai chế độ xem: mini card hoặc dòng (row/table), để ở nhà thuốc Owner thấy cả danh sách cùng lúc mà không phải lướt từng card [Owner]. Mặc định là dòng; trang nhớ chế độ Owner chọn lần trước [Q-14]. Không dùng tab theo người (mâu thuẫn với xem tất cả) [Owner]
- Mặc định hiện mọi món của mọi người; lọc theo người.
- Tìm theo tên, hoạt chất, mục đích; không phân biệt hoa thường và dấu ("thuoc da day" ra "thuốc dạ dày"). Chữ "đ" phải về "d": NFD không làm việc này, nên dùng lại cách xử lý dấu của `slug.value.ts` và có test riêng cho "đ".
- Mỗi kết quả có một icon nhỏ dẫn sang trang sửa món đó ở console (E3) [Owner]. Responsive của console để sau, không làm trong slice 1 [Owner]
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


## E6 · Rules and examples *(logic)*

Mọi quy tắc dưới đây là bản nháp của Claude, rút từ E1–E5 [Claude-proposed]. Owner chốt từng quy tắc; dòng nào sai thì sửa hoặc xóa.

### R1 · Tên hiển thị: đúng một hoạt chất thì hiện tên hoạt chất, còn lại hiện tên thuốc [Q-2]
| Example | Given | When | Expected (incl. what the user sees next) | Source |
|---|---|---|---|---|
| R1.1 | Thuốc "Air-X", hoạt chất ["Simethicone"] | Mở trang tra cứu | Item ghi "Simethicone", dòng phụ "Air-X" | [Q-2] |
| R1.2 | Thuốc "Panadol Extra", hoạt chất ["Paracetamol", "Caffeine"] | Mở trang tra cứu | Item ghi "Panadol Extra", dòng phụ "Paracetamol + Caffeine" | [Q-2] |
| R1.3 | Thuốc "Men tiêu hóa X", chưa nhập hoạt chất | Mở trang tra cứu | Item ghi "Men tiêu hóa X" | [Claude-proposed] |
| R1.4 | Vật tư "Nhiệt kế điện tử" | Mở trang tra cứu | Item ghi "Nhiệt kế điện tử", nhãn "Vật tư" | [Claude-proposed] |

### R2 · Vật tư không có các trường chỉ dành cho thuốc; API là nơi kiểm [E5]
| Example | Given | When | Expected | Source |
|---|---|---|---|---|
| R2.1 | Form ở console, chọn loại "Vật tư" | Nhìn form | Không thấy ô hoạt chất, hàm lượng, liều, thời điểm uống, loại dùng | [E5] |
| R2.2 | Gọi API tạo vật tư "Băng gạc" kèm `dosage: "1 miếng"` | Gửi | 400, lỗi ở trường `dosage`; không có gì được lưu | [E5] |
| R2.3 | Đang sửa một thuốc có liều "2 viên" | Nhìn form sửa | Ô loại chỉ đọc, không đổi được; muốn thành vật tư thì xóa món rồi tạo món mới | [Q-13] |

### R3 · Trường bắt buộc: người, tên, loại (mặc định Thuốc); thuốc bắt buộc thêm hàm lượng, ghi ở ô riêng [Q-12]
| Example | Given | When | Expected | Source |
|---|---|---|---|---|
| R3.1 | Form có người "Mẹ", loại "Thuốc", tên "Atorvastatin", hàm lượng "10mg" | Lưu | Lưu được; item hiện các trường trống là "Chưa ghi" | [Q-12] |
| R3.2 | Form để trống tên | Lưu | Ô tên báo lỗi bắt buộc; không gửi | [Q-12] |
| R3.3 | Thuốc "Atorvastatin", để trống hàm lượng | Lưu | Ô hàm lượng báo lỗi bắt buộc; không gửi | [Q-12] |
| R3.4 | Vật tư "Nhiệt kế điện tử", không có ô hàm lượng | Lưu | Lưu được | [Q-12], R2 |
| R3.5 | Mở form tạo món mới | Nhìn ô loại | Đã chọn sẵn "Thuốc" | [Q-12] |

### R4 · Tìm theo tên, hoạt chất, mục đích; không phân biệt hoa thường và dấu, "đ" coi như "d" [E5]
| Example | Given | When | Expected | Source |
|---|---|---|---|---|
| R4.1 | Món có mục đích "Đau dạ dày" | Gõ "da day" | Món hiện trong kết quả | [E5] |
| R4.2 | Thuốc "Air-X", hoạt chất "Simethicone" | Gõ "SIMETHICON" | Món hiện trong kết quả (khớp hoạt chất) | [E5] |
| R4.3 | Ở nhà thuốc nơi khác, chỉ biết hoạt chất | Gõ "simethicone" | Thấy "Air-X" của mình; đưa hoạt chất cho dược sĩ | [E3] |
| R4.4 | Ghi chú có chữ "uống sau ăn", không trường nào khác có | Gõ "sau an" | Không ra món đó (ghi chú không được tìm) | [Claude-proposed] |
| R4.5 | Không món nào khớp "xyz" | Gõ "xyz" | Thông báo "Không tìm thấy món nào", gợi ý xóa từ khóa | [Claude-proposed] |
| R4.6 | Gõ "simethicone" | Nhìn thanh địa chỉ và Umami | URL không đổi, không có `?q=` | [E5] |

### R5 · Mặc định thấy mọi món của mọi người; chip lọc theo một người [Owner]
| Example | Given | When | Expected | Source |
|---|---|---|---|---|
| R5.1 | Owner có 5 món, Mẹ có 3 món | Mở trang | Thấy 8 item, mỗi item ghi tên người | [Owner] |
| R5.2 | Như R5.1 | Bấm chip "Mẹ" | Thấy 3 item của Mẹ | [Owner] |
| R5.3 | Chip "Mẹ" đang chọn | Gõ "simethicone" | Chỉ thấy món của Mẹ có khớp | [Claude-proposed] |
| R5.4 | Owner và Mẹ đều dùng Simethicone, liều khác nhau | Gõ "simethicone" | Hai item, mỗi item đúng liều và tên người | [E3] |

### R6 · Mỗi món cho thấy đủ để dùng lại: liều, thời điểm uống, loại dùng [E3]
| Example | Given | When | Expected | Source |
|---|---|---|---|---|
| R6.2 | Thuốc mỡ máu, loại dùng "Lâu dài" | Mở trang | Item có nhãn "Dùng lâu dài" | [Q-5] |
| R6.3 | Bất kỳ món nào | Bấm icon sửa | Mở trang sửa món đó ở console | [E5] |

### R7 · Xóa trên UI là xóa hẳn, có xác nhận; database soft delete [Q-9, Q-11]
| Example | Given | When | Expected | Source |
|---|---|---|---|---|
| R7.1 | Món "Air-X" của Owner | Bấm Xóa, xác nhận | Món biến mất khỏi console và landing; database còn dòng với `deletedAt` | [Q-9] |
| R7.2 | Như R7.1 | Bấm Xóa, hủy | Không có gì thay đổi | [Q-9] |
| R7.3 | Người "Mẹ" còn 3 món | Bấm Xóa | Hộp xác nhận ghi "Mẹ còn 3 món, xóa luôn cả 3?" | [Q-11] |
| R7.4 | Như R7.3 | Xác nhận | Mẹ và 3 món biến mất khỏi mọi trang; chip "Mẹ" không còn | [Q-11] |

### R8 · Chỉ Owner (ADMIN đã đăng nhập) đọc và ghi được [E5]
| Example | Given | When | Expected | Source |
|---|---|---|---|---|
| R8.1 | Chưa đăng nhập | Gọi `GET` danh sách món | 401, không có dữ liệu | [E5] |
| R8.2 | Chưa đăng nhập | Mở trang tra cứu trên landing | Chuyển sang trang Sign in, quay lại sau khi đăng nhập | [E5] |
| R8.3 | Chưa có món nào | Mở trang tra cứu | "Chưa có món nào", kèm link sang console để thêm | [Claude-proposed] |

### R9 · Chế độ xem: dòng (mặc định) hoặc mini card; trang nhớ lựa chọn [Q-14]
| Example | Given | When | Expected | Source |
|---|---|---|---|---|
| R9.1 | Lần đầu mở trang tra cứu | Nhìn danh sách | Item hiện dạng dòng (row/table) | [Q-14] |
| R9.2 | Đang ở chế độ dòng | Chọn mini card, đóng trang, mở lại | Item hiện dạng mini card | [Q-14] |

### Edge case giá trị (EP + BVA) [Claude-proposed]
| Trường | Hợp lệ | Ngay dưới | Tại ranh giới | Ngay trên | Expected khi vượt |
|---|---|---|---|---|---|
| Tên | 1–200 ký tự | 0 (rỗng) | 1 và 200 | 201 | Lỗi ở ô tên |
| Mỗi hoạt chất | 1–100 ký tự | 0 | 1 và 100 | 101 | Lỗi ở ô hoạt chất đó |
| Số hoạt chất | 0–10 | — | 0 và 10 | 11 | Lỗi "tối đa 10 hoạt chất" |
| Mục đích | 0–500 ký tự | — | 500 | 501 | Lỗi ở ô mục đích |
| Ghi chú | 0–2000 ký tự | — | 2000 | 2001 | Lỗi ở ô ghi chú |
| Tên người | 1–50 ký tự | 0 | 1 và 50 | 51 | Lỗi ở ô tên người |

**Non-functional:** [Claude-proposed]
- Performance: trang tra cứu hiện kết quả dưới 1 giây với 300 món; lọc trên trình duyệt không thấy độ trễ khi gõ.
- Phân quyền: R8.
- Bảo mật input: Zod ở API; chuỗi người dùng nhập luôn hiển thị dạng text, không qua `innerHTML`.
- Responsive: trang tra cứu theo 4 breakpoint của landing. Console để sau [Owner].
- Chuỗi giao diện landing (nhãn, thông báo) đi qua `LANDING_COPY` EN/VI; nội dung món là dữ liệu, không dịch.

### Acceptance criteria and test levels [Claude-proposed]
Feature mới, không có hành vi cũ cần giữ (3.3c bỏ qua). Test viết trước code, mỗi test ghi ID của AC; expected lấy từ ví dụ ở trên, không đọc từ code.

| AC | Rule | WHEN … THE SYSTEM SHALL … | Test level | Ví dụ phủ |
|---|---|---|---|---|
| AC-1 | R1 | WHEN một thuốc có đúng một hoạt chất THE SYSTEM SHALL hiện tên hoạt chất làm tên chính; còn lại hiện tên thuốc | Unit (policy tên hiển thị) | R1.1–R1.4 |
| AC-2 | R2 | WHEN API nhận một vật tư có trường chỉ dành cho thuốc THE SYSTEM SHALL trả 400 và không lưu | Unit (Zod schema) + 1 integration | R2.2 |
| AC-3 | R2 | WHEN form console chọn loại "Vật tư" THE SYSTEM SHALL ẩn các trường thuốc; WHEN sửa một món đã có THE SYSTEM SHALL không cho đổi loại | Component + Unit (schema cập nhật không nhận `kind`) | R2.1, R2.3 |
| AC-4 | R3 | WHEN thiếu người hoặc tên, hoặc một thuốc thiếu hàm lượng, THE SYSTEM SHALL báo lỗi ở ô đó và không gửi | Unit (schema) + Component | R3.1–R3.5 |
| AC-5 | R4 | WHEN Owner gõ từ khóa THE SYSTEM SHALL lọc theo tên, hoạt chất, mục đích, bỏ qua hoa thường, dấu, đ/d | Unit (hàm chuẩn hóa + lọc) | R4.1–R4.5 |
| AC-6 | R4 | WHEN Owner gõ từ khóa THE SYSTEM SHALL giữ nguyên URL | Component | R4.6 |
| AC-7 | R5 | WHEN Owner chọn chip một người THE SYSTEM SHALL chỉ hiện món của người đó, kết hợp với từ khóa | Unit (lọc) | R5.1–R5.4 |
| AC-8 | R6 | WHEN một món có loại dùng "Lâu dài" THE SYSTEM SHALL hiện nhãn "Dùng lâu dài" | Component | R6.2 |
| AC-9 | R7 | WHEN Owner xác nhận xóa một món THE SYSTEM SHALL đặt `deletedAt` và ẩn món khỏi mọi danh sách | Unit (handler) + integration | R7.1, R7.2 |
| AC-10 | R7 | WHEN Owner xóa một người còn N món THE SYSTEM SHALL hỏi kèm số N, và khi xác nhận thì soft delete người đó cùng N món | Unit (handler) + Component (hộp xác nhận) | R7.3, R7.4 |
| AC-11 | R8 | WHEN request không có quyền ADMIN THE SYSTEM SHALL trả 401/403 cho mọi endpoint của module | E2E (API) | R8.1 |
| AC-12 | R8 | WHEN chưa đăng nhập mà mở trang tra cứu THE SYSTEM SHALL chuyển sang Sign in rồi quay lại | E2E (landing), chạy tay một lần | R8.2 |
| AC-13 | BVA | WHEN một trường vượt ranh giới ở bảng EP + BVA THE SYSTEM SHALL báo lỗi ở đúng trường đó | Unit (schema, mỗi ranh giới một case) | bảng BVA |
| AC-14 | R9 | WHEN Owner mở trang tra cứu THE SYSTEM SHALL hiện chế độ xem đã chọn lần trước, mặc định là dòng | Component | R9.1, R9.2 |

Kiểm tay trên điện thoại (không tự động): R4.3 ở nhà thuốc thật, thước đo E2 (dưới 1 phút).

## Changelog

### 2026-10-24 Owner chấp nhận rủi ro không có nhãn "Không hợp"; thêm Q-14 và R9
- Updated: Data model ghi hệ quả đã chấp nhận; Lookup thêm chế độ mặc định; E4 thêm Q-14; E6 đổi "card" thành "item", thêm R9 và AC-14
- Reason: [Owner], [Q-14]

### 2026-10-24 Owner duyệt mục 1–5, 7, 8 của bảng [Claude-proposed]
- Updated: E2 giữ một thước đo (thời gian tra, dưới 1 phút) và bỏ thước đo số lần tra; E3 bỏ edge case "đang gấp" (trùng E2) và bỏ ghi nguồn; E5 bỏ trường kết quả và nguồn, thêm hai chế độ xem mini card và dòng, link sửa thành icon nhỏ, responsive console để sau; R6, R6.1, R6.3, AC-8, non-functional sửa theo
- Reason: [Owner], YAGNI

### 2026-10-24 Owner trả lời Q-12, Q-13
- Updated: R2.3 (không đổi loại), R3 và R3.1 đến R3.5 (trường bắt buộc, hàm lượng ở ô riêng), AC-3, AC-4
- Reason: [Q-12], [Q-13]
