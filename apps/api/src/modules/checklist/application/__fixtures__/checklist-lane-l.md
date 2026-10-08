# Checklist làn L

Vào làn L khi có **một** trong các dấu hiệu: đổi hành vi người dùng đang dựa vào · chạm tiền, quyền, dữ liệu, migration · nhiều hệ thống · khó đảo ngược (tra A).

Tiêu đề mỗi pha: **tên pha | role ngoài thực tế thường làm việc này** (để Owner đổi góc nhìn khi vào pha).

**Vai trò** (gọi theo góc nhìn người ngoài):
**Owner** = người làm chủ ticket (con người) · **Claude** = Claude trong session đang làm việc · **Claude, session mới** = Claude ở context sạch, không thấy quá trình làm ra sản phẩm · **Máy** = test, lint, type check, build · **Người đưa vấn đề** = CS, BA hoặc Manager · **Manager** · **Tester** · **Người nghiệm thu UAT**

Dòng in đậm không có ô ✔ là **tên nhóm**; các dòng bắt đầu bằng ↳ ngay dưới nó là việc con của nhóm đó.
Ô "Ai kiểm" để "—" nghĩa là việc đó **chưa có ai kiểm**, Owner chấp nhận điều đó một cách có chủ ý.
Chỗ cần cách làm thì có chỉ dẫn "tra X" sang `bang-tra.md`. Dấu **📁 §N** nghĩa là dòng đó cần dữ liệu riêng của project: mở mục N trong hồ sơ project (`projects/<project>.md`), dùng cái đã có, ghi thêm cái mới phát hiện.

## 1. Problem Discovery | Business Analyst

**Qua pha khi:** Người đưa vấn đề xác nhận Owner đã hiểu đúng vấn đề.

| ✔  | Việc                                                                                                                              | Ai làm                      | Ai kiểm                             |
| --- | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | ----------------------------------- |
| [ ] | **Ai dùng, ở bối cảnh nào**: ở đâu, thiết bị gì, tay có rảnh không, mạng có ổn không; một ngày làm việc này bao nhiêu lần · 📁 §1 | Owner                       | Người đưa vấn đề                    |
| [ ] | **Hôm nay họ làm thế nào** (kể cả Excel hay gọi điện); cách làm đó lộ ra ràng buộc gì · 📁 §2                                     | Owner                       | Người đưa vấn đề                    |
| [ ] | Vấn đề trong một câu; bằng chứng; vì sao lúc này                                                                                  | Owner                       | Người đưa vấn đề                    |
| [ ] | **"Xong" là một câu quan sát được về người dùng**, không phải "màn hình chạy được"                                                | Owner                       | Người đưa vấn đề                    |
| [ ] | Ai bị ảnh hưởng **gián tiếp** (team khác, báo cáo, integration, CS phải trả lời khách); ai có quyền nói "đúng" · 📁 §6, §9        | Owner                       | Người đưa vấn đề                    |
| [ ] | Ngoài phạm vi + danh sách câu hỏi mở: quét danh mục chung (tra G) + câu hỏi hay phải hỏi · 📁 §4                                  | Owner; Claude gợi ý câu hỏi | Người đưa vấn đề trả lời câu hỏi mở |

## 2. Solution Design | Solution Architect

**Qua pha khi:** Manager duyệt design doc.

| ✔  | Việc                                                                                                                                                       | Ai làm                                                   | Ai kiểm                                          |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------ |
| [ ] | Design doc: ít nhất hai phương án, phương án chọn và vì sao, **alternatives considered**                                                                   | Claude soạn; Owner chọn                                  | Claude, session mới: tìm điểm yếu; Manager duyệt |
| [ ] | Cross-cutting concerns: bảo mật, dữ liệu, observability · 📁 §5                                                                                            | Owner                                                    | Manager                                          |
| [ ] | Blast radius + tương thích: **trong code** (ai gọi, ai đọc) + **ngoài code** (client cũ, integration, báo cáo và export, cấu hình riêng của khách) · 📁 §6 | Claude dò phần trong code; Owner bổ sung phần ngoài code | Owner                                            |
| [ ] | Dữ liệu: migration chạy thế nào, dữ liệu cũ xử lý ra sao, có đảo ngược được không · 📁 §6                                                                  | Owner                                                    | Manager                                          |
| [ ] | Chia nhỏ thành các lần release độc lập nếu được                                                                                                            | Owner                                                    | Manager                                          |
| [ ] | Rabbit hole đã chặn + appetite (vượt thì cắt scope)                                                                                                        | Owner                                                    | Manager                                          |

## 3. Acceptance & Test Design | Business Analyst + Tester

**Qua pha khi:** Không còn thẻ câu hỏi nào chặn việc build.

| ✔  | Việc                                                                                                                                  | Ai làm              | Ai kiểm                                                 |
| --- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------- |
|     | **Example mapping**                                                                                                                   |                     |                                                         |
| [ ] | ↳ Viết quy tắc; mỗi quy tắc ít nhất một ví dụ cụ thể (có số, có tên, có tình huống); chỗ không viết được ví dụ thì thành thẻ câu hỏi  | Owner               | Claude, session mới: tìm quy tắc thiếu, ví dụ mâu thuẫn |
| [ ] | ↳ **Ít nhất ba trường hợp biên**: quét danh sách chung (tra F) + danh sách riêng · 📁 §3                                              | Claude soạn         | Owner                                                   |
| [ ] | ↳ **Đọc bản map**: nhiều câu hỏi → chưa build · nhiều quy tắc → chia nhỏ, quay lại pha 2 · một quy tắc kéo nhiều ví dụ → đi chậm ở đó | Owner               | —                                                       |
| [ ] | NFR **bắt buộc xét** performance, phân quyền, bảo mật input; các NFR khác chọn cái áp dụng (tra C) · 📁 §5                            | Owner               | —                                                       |
|     | **Từ quy tắc ra test**                                                                                                                |                     |                                                         |
| [ ] | ↳ Quy tắc → AC dạng `WHEN … THE SYSTEM SHALL …`, mỗi AC có ID                                                                         | Claude soạn         | Owner                                                   |
| [ ] | ↳ Ba câu hỏi, kỹ thuật, test level cho từng luật (tra B) · 📁 §7                                                                      | Claude soạn nháp    | Owner                                                   |
| [ ] | ↳ Sửa tính năng đang chạy: test hành vi cũ cần giữ **trước** khi sửa                                                                  | Claude              | Owner                                                   |
| [ ] | ↳ Logic chạm tiền hoặc quyền: kiểm chính bộ test bằng mutation testing · 📁 §7                                                        | Máy (mutation tool) | Owner đọc mutation score                                |
| [ ] | ↳ Ví dụ → test case, viết **trước** code, ở session riêng, test ghi ID của AC; **expected lấy từ ví dụ, không đọc từ code** (tra H)   | Claude              | Owner                                                   |

## 4. Prototype | UI/UX Designer

**Qua pha khi:** Manager đồng ý với mockup hoặc demo.

| ✔  | Việc                                                           | Ai làm | Ai kiểm |
| --- | -------------------------------------------------------------- | ------ | ------- |
| [ ] | Design system đủ thì tự làm, không đủ thì gọi designer · 📁 §7 | Owner  | —       |
| [ ] | Mockup hoặc demo bấm được; present; ghi feedback               | Owner  | Manager |

## 5. Implementation | Developer

**Qua pha khi:** Máy báo mọi check xanh.

| ✔  | Việc                                                            | Ai làm              | Ai kiểm          |
| --- | --------------------------------------------------------------- | ------------------- | ---------------- |
| [ ] | Session mới, chỉ đọc spec + test; test của pha 3 không được sửa | Claude, session mới | Owner            |
| [ ] | Type check, lint, test, build · 📁 §7                           | Máy                 | Owner xem output |

## 6. Testing | Tester

**Qua pha khi:** Owner xác nhận không còn bug **đã biết** trong phạm vi.

| ✔  | Việc                                                                                                                                         | Ai làm                                  | Ai kiểm                       |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ----------------------------- |
| [ ] | Mỗi test mới đã từng **đỏ** ít nhất một lần                                                                                                  | Claude                                  | Owner xem output              |
|     | **Đọc và review diff**                                                                                                                       |                                         |                               |
| [ ] | ↳ Đọc diff **nguội**: **giải thích được từng dòng**, không giải thích được thì chưa merge; tìm thứ không liên quan tới task (tra D)          | Owner                                   | —                             |
| [ ] | ↳ Review diff so với AC, chỉ lấy finding về correctness và thứ ngoài phạm vi task                                                            | Claude, session mới                     | Owner lọc finding             |
| [ ] | ↳ Review chuyên môn (bảo mật hoặc performance) · 📁 §5                                                                                       | Claude, session mới                     | Owner lọc finding             |
| [ ] | Migration chạy thử trên bản sao dữ liệu giống thật · 📁 §6                                                                                   | Owner                                   | Máy (so dữ liệu trước và sau) |
|     | **Tự kiểm 4 lớp trên app thật**, theo thứ tự; lớp trước hỏng thì chưa sang lớp sau                                                           |                                         |                               |
| [ ] | ↳ **Lớp 1 · Đường hạnh phúc**: chạy đúng kịch bản chính bằng tay, như người dùng thật, theo các ví dụ của pha 3. Không phải "unit test pass" | Owner                                   | —                             |
| [ ] | ↳ **Lớp 2 · Biên**: chạy 3 biên của pha 3; xem màn hình lỗi, rỗng, đang tải khi thứ này fail                                                 | Owner                                   | —                             |
| [ ] | ↳ **Lớp 3 · Hồi quy quanh chỗ sửa**: mở thử ít nhất một chỗ dùng chung hàm, component, endpoint này (từ blast radius ở pha 2) · 📁 §6        | Claude dò (grep, git log); Owner mở thử | —                             |
| [ ] | ↳ **Lớp 4 · Dữ liệu thật**: thử với dữ liệu cũ, bẩn, thiếu field, sai format; không phải seed sạch · 📁 §3, §6                               | Owner                                   | —                             |
| [ ] | 30 phút exploratory có charter: "Khám phá ‹vùng› với ‹cách / dữ liệu› để tìm ‹loại vấn đề›"; ghi lại bug, câu hỏi, ý tưởng                   | Owner                                   | —                             |
| [ ] | Kiểm các NFR đã chọn ở pha 3 · 📁 §5                                                                                                         | Owner                                   | —                             |
| [ ] | Ghi chú bàn giao: đổi gì, test ở đâu, rủi ro ở đâu · 📁 §9                                                                                   | Owner                                   | Tester (nếu có)               |

## 7. Release | Release Manager

**Qua pha khi:** Người nghiệm thu UAT ký nhận.

| ✔  | Việc                                                                                                       | Ai làm | Ai kiểm                       |
| --- | ---------------------------------------------------------------------------------------------------------- | ------ | ----------------------------- |
|     | **Chuẩn bị trước khi release**                                                                             |        |                               |
| [ ] | ↳ Rollback (cách làm, ai làm, feature flag) viết **trước**; migration, config, env từng môi trường · 📁 §8 | Owner  | Manager                       |
| [ ] | ↳ **Diễn tập rollback** ít nhất một lần ở SIT hoặc UAT · 📁 §8                                             | Owner  | Máy (smoke test sau rollback) |
| [ ] | ↳ Chốt trước: theo dõi chỉ số nào, ngưỡng nào thì rollback · 📁 §8                                         | Owner  | Manager                       |
| [ ] | ↳ Báo trước cho CS và người bị ảnh hưởng: đổi gì, khi nào, hỏi ai · 📁 §9                                  | Owner  | Người đưa vấn đề              |
|     | **Đưa lên từng bước**                                                                                      |        |                               |
| [ ] | ↳ SIT → UAT → PROD, smoke test sau mỗi bước · 📁 §8                                                        | Owner  | Người nghiệm thu UAT          |
| [ ] | ↳ Rollout từng phần ở PROD: feature flag → nội bộ → một nhóm nhỏ → toàn bộ · 📁 §8                         | Owner  | Máy (chỉ số đã chốt)          |

## 8. Post-release Review | Product Manager

**Qua pha khi:** Owner đã so thước đo ở pha 1 với kết quả thật.

| ✔  | Việc                                                                                    | Ai làm                   | Ai kiểm          |
| --- | --------------------------------------------------------------------------------------- | ------------------------ | ---------------- |
| [ ] | Theo dõi lỗi, log và các chỉ số đã chốt ở pha 7, lâu hơn làn M; báo lại kết quả · 📁 §8 | Owner                    | Người đưa vấn đề |
| [ ] | Xem lại thước đo ở pha 1 sau một mốc thời gian cố định                                  | Owner                    | Người đưa vấn đề |
| [ ] | As-built doc, gỡ flag, một dòng bài học → sửa checklist · 📁 §10                        | Claude soạn as-built doc | Owner            |

**Gặp bug ở bất kỳ pha nào:** tra E.
