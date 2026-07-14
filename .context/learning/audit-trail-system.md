# Audit Trail System — kiến thức nền & tiêu chí

> Ghi chú research (phase 1), chưa gắn với thiết kế cụ thể cho console. Study date: 2026-07-13.
> Mục tiêu: hiểu một audit trail system **cần đạt tiêu chí / tiêu chuẩn / feature / vai trò gì**,
> để làm cơ sở thiết kế cho console app (app nhỏ, nội bộ, không ràng buộc compliance chính thức).
> Nguồn: tổng hợp từ NIST 800-53/800-92, ISO 27002, SOC 2, OWASP (Logging Cheat Sheet + ASVS V7),
> PCI-DSS Req 10, GDPR, HIPAA, cùng docs của CloudTrail / GCP Audit Logs / Azure Activity Log và
> các thư viện paper_trail / django-auditlog / Envers / Laravel-auditing. Link nguồn ở cuối.

---

## 0. TL;DR — cái gì là "đủ đúng" cho một app nội bộ nhỏ

Không cần SIEM, không cần ký số, không cần immutable-ledger DB. "Correct & defensible" tối thiểu gồm:

1. **Một bảng audit riêng, append-only** (không có code path UPDATE/DELETE), tách khỏi app log.
2. Ghi đủ **schema 5W+H**: ai (actor) — làm gì (action) — trên đối tượng nào (resource + id) —
   khi nào (UTC) — từ đâu (IP/source) — kết quả (success/fail), kèm before/after cho mutation.
3. Log tối thiểu: **auth events, hành động admin/phân quyền, CRUD trên entity nhạy cảm, và cả việc
   xem chính audit log**.
4. **Không bao giờ ghi secret/PII thô** vào nội dung log (mask/redact tại thời điểm ghi).
5. **Hạn chế quyền đọc** audit trail (permission riêng, không phải "admin nào cũng đọc hết").
6. **Timestamp UTC do server sinh**, có retention policy viết thành văn bản (vd giữ 12 tháng rồi archive).
7. Đọc/lọc được theo actor / resource / khoảng thời gian (chỉ cần SQL là đủ, chưa cần dashboard).

Công thức tinh gọn: **NIST AU-3 (schema) + ISO 27002 "user không được sửa log của chính mình" +
OWASP (danh sách field + danh sách never-log)**. Đó là mức bar tối thiểu để "đúng và phòng thủ được",
không phải gold-plating. Mọi thứ nặng hơn (hash-chain, ký số, WORM, ledger DB) chỉ thêm khi có
động lực thực (regulator, dữ liệu tài chính/y tế, tranh chấp pháp lý), không thêm theo bản năng.

---

## 1. Audit log KHÁC application log KHÁC security log

Đây là lỗi thiết kế bị các nguồn (OWASP, CrowdStrike) nhắc đi nhắc lại: gộp 3 loại làm một.

| | Application log | **Audit log** | Security log |
|---|---|---|---|
| Trả lời câu hỏi | "Phần mềm làm gì?" (debug) | **"Ai làm gì, khi nào, từ đâu?"** | "Có gì bất thường/độc hại không?" |
| Đối tượng đọc | Dev/ops | Auditor, compliance, legal, user bị ảnh hưởng | Đội security/SOC |
| Volume | Rất cao (mọi request, mọi error) | Chọn lọc — chỉ event nghiệp vụ/bảo mật có ý nghĩa | Trung bình |
| Retention | Ngắn (ngày–tuần) | Dài, thường bị luật ràng buộc (tháng–năm) | Trung bình |
| Tính bất biến | Xoay vòng/xoá thoải mái | **Bắt buộc immutable/append-only** | Nên tamper-evident |

**Hệ quả thực tế:** dùng chung một *pipeline* logging thì được, nhưng **bảng/luồng audit phải là store
riêng, có retention + immutability riêng**, không phải chỉ là một log-level filter trên app log chung.
Nếu gộp: hoặc debug log bị coi là bằng chứng pháp lý dù không có bảo đảm integrity, hoặc event audit
quan trọng bị chìm trong noise và mất khi log rotation chạy.

---

## 2. Các tiêu chí phổ quát một audit trail phải đạt

Chắt lọc từ tất cả framework, một audit trail "phòng thủ được" phải thoả:

- **Completeness (đầy đủ):** mọi hành động thay đổi state + mọi truy cập dữ liệu nhạy cảm đều được ghi;
  không có khoảng trống im lặng. (SOC 2 coi lỗ hổng coverage là finding; ISO nêu 10 nhóm event làm sàn.)
- **Accuracy (chính xác):** record phản ánh đúng chuyện đã xảy ra, đúng actor, đúng giá trị before/after.
- **Integrity / tamper-evidence:** sau khi ghi, chứng minh được nội dung chưa bị sửa. NIST AU-9 và ISO 8.15
  đều yêu cầu **cảnh báo khi có mưu toan sửa**, không chỉ ngăn chặn.
- **Non-repudiation (chống chối bỏ):** actor không thể chối đã làm hành động đó (NIST AU-10). Cần buộc chặt
  danh tính lúc ghi (session đã xác thực, không phải field "user" tự do).
- **Immutability / append-only:** không tồn tại đường update/delete record qua app; sửa sai = thêm bản ghi
  bù, không bao giờ edit tại chỗ.
- **Time synchronization:** mọi timestamp lấy từ một nguồn giờ chung đáng tin (NTP), lưu UTC (NIST AU-8,
  ASVS 7.3.4, PCI 10.4). Thiếu cái này thì thứ tự event liên hệ thống và non-repudiation đều đổ.
- **Retention:** giữ đúng bằng khoảng thời gian policy/luật yêu cầu — không xoá sớm (mất bằng chứng), không
  giữ vô hạn quá mức cần (tăng liability/PII). Các framework hội tụ về mô hình **hot/cold**: dữ liệu gần
  đây query nhanh, cũ hơn thì archive.
- **Confidentiality / access control:** bản thân log là tài sản được bảo vệ; quyền đọc bị hạn chế (thường
  chặt hơn cả dữ liệu nó mô tả — theo HIPAA), và secret/PII **không bao giờ được ghi vào** nội dung log.
- **Availability:** log phải lấy ra được khi cần (điều tra, audit, legal discovery), kể cả khi hệ thống
  hỏng một phần (vì vậy NIST AU-4 yêu cầu tính dung lượng, AU-5 yêu cầu cảnh báo khi logging fail thay vì
  mất log âm thầm).
- **Reviewability:** record thô là cần nhưng chưa đủ; phải có cách thực tế để người (hoặc hệ thống tự động)
  query/lọc/phân tích (NIST AU-7; nguyên tắc SOC 2: "log không ai xem thì không bảo vệ được gì").

---

## 3. Các tiêu chuẩn/framework nói gì (bảng tra nhanh)

Đọc để **biết** yêu cầu, không phải để làm hết. App nội bộ nhỏ chỉ cần bám NIST AU-3 + ISO 8.15 + OWASP.

| Framework | Field/nội dung bắt buộc | Yêu cầu integrity/tamper | Nhịp review | Retention |
|---|---|---|---|---|
| **NIST 800-53 AU-3/8/9** | type, time, location, source, outcome, identity | AU-9: chống truy cập/sửa/xoá trái phép, cảnh báo tamper | AU-6: review định kỳ | AU-11: theo rủi ro, tổ chức tự định |
| **ISO 27002 8.15** | user ID, activity, timestamp, device ID, network address | append-only/read-only/hash; user **không sửa được log của chính mình** | định kỳ, SIEM hỗ trợ | theo policy |
| **SOC 2 CC7.2** | (tự định) | ngụ ý qua completeness của monitoring | ưa near-real-time | ≥ kỳ audit, thường 12 tháng |
| **OWASP Logging CS** | when/where/who/what + interaction ID | tamper-detection, read-only media, mã hoá khi truyền | (guidance) | đúng cửa sổ policy |
| **OWASP ASVS V7** | quyết định auth/authz + metadata, **không secret** | encode chống log-injection, bảo vệ truy cập, đồng bộ giờ | — | — |
| **PCI-DSS Req 10** | **6 field rõ ràng:** user ID, event type, date/time, success/fail, origin, resource bị ảnh hưởng | access control + central store + file-integrity monitoring | hằng ngày (tự động) cho hệ CHD | **≥12 tháng, 3 tháng "hot"** |
| **GDPR Art 30 / 5(2)** | mức tổ chức (mục đích xử lý, loại dữ liệu, người nhận, retention) — không per-record | ngụ ý qua Art 32 | ROPA review hằng năm | theo lịch retention khai báo |
| **HIPAA §164.312(b)** | who/what/when/where + kết quả phân quyền (theo risk-analysis, **không prescribe**) | bảo vệ ngang mức ePHI | định kỳ + sau sự cố | thường trích 6 năm (norm chung) |

Ghi chú đáng nhớ:
- **PCI Req 10 là bản spec rõ ràng nhất** (dù không làm thanh toán vẫn nên "mượn" làm chuẩn vàng): buộc phải
  log cả việc **truy cập chính audit log** và **việc bật/tắt/tạm dừng tiến trình logging** (admin tắt logging
  cũng phải bị log).
- **HIPAA cố tình không prescribe** — scope tự suy ra từ risk analysis. Bài học: audit scope là quyết định
  rủi ro, không có con số cố định.
- **GDPR chủ yếu là record-of-processing mức tổ chức**, nhưng Art 5(2) + Art 32 khiến audit log trở thành
  *bằng chứng* để chứng minh accountability, dù GDPR không quy định field cụ thể.

---

## 4. Schema "5W + H" — bộ khung mọi framework hội tụ về

NIST AU-3 gọi là "type/when/where/source/outcome/identity"; ISO gọi "user ID/activity/timestamp/device/network";
OWASP gọi "when/where/who/what". Tất cả là một thứ:

| Câu hỏi | Field cụ thể |
|---|---|
| **Who** | Danh tính actor đã xác thực (user id, service-account id); chuỗi impersonation "acting as" nếu có |
| **What** | Loại action (create/update/delete/view/login/permission-change); loại + id resource; với mutation thì before/after (hoặc diff) |
| **When** | Timestamp UTC, đủ mịn để xác lập thứ tự; correlation/request id để gom các event liên quan |
| **Where** | Nguồn: IP, device/session id, tên+version app/service, endpoint/route |
| **Why** | Hiếm khi là field literal — thường tái dựng từ **context**: request kích hoạt, object nghiệp vụ liên kết ("duyệt theo ticket #123"), hoặc field reason/comment cho hành động nhạy cảm (xoá, cấp quyền) |
| **How (outcome)** | Success/failure, và nếu fail thì lý do (validation error, permission denied). PCI + NIST coi đây là field bắt buộc, không optional |

---

## 5. Canonical audit record schema (data model chi tiết)

CloudTrail, GCP AuditLog, Azure Activity Log, OWASP và các lib app-level đều hội tụ về 5 nhóm field.
Bảng tổng hợp (Required = tối thiểu cho app nội bộ; Conditional = khi loại event yêu cầu; Optional/high-assurance = chỉ khi cần):

| Field | Nhóm | Required? | Vì sao |
|---|---|---|---|
| `event_id` | Integrity | Required | GUID mỗi record; khoá tra cứu/dedup (≈ CloudTrail `eventID`) |
| `actor_id` | Identity | Required | Ai làm — user/service-account/system-job id |
| `actor_type` | Identity | Required | Phân biệt người / service account / integration / job. Quan trọng cho tool nội bộ: "Dana xoá" khác "Nightly sync xoá" |
| `actor_display_name` | Identity | Recommended | Tên người-đọc-được **tại thời điểm** action (tên thay đổi — lưu snapshot, đừng join live) |
| `on_behalf_of` / `impersonator_id` | Identity | Conditional | Impersonation / support-login / delegated-admin. Bắt buộc ở đâu có admin impersonate |
| `event_type` / `action` | Action | Required | Động từ — chuyện gì xảy ra (`user.login`, `invoice.updated`) |
| `event_category` | Action | Recommended | Nhóm thô để lọc: Management / Data / Auth / Admin |
| `outcome` / `success` | Action | Required | success/failure/denied — cốt lõi cho security review |
| `severity` | Action | Recommended | thang low/med/high theo OWASP |
| `error_code` / `error_message` | Action | Conditional | Điền khi fail |
| `resource_type` | Target | Required | Loại entity bị tác động (Invoice/User/Role) |
| `resource_id` | Target | Required | Định danh ổn định của target |
| `resource_name` | Target | Recommended | Nhãn người-đọc-được **tại thời điểm** event (tên/email đổi — đừng phụ thuộc join live) |
| `timestamp_utc` | Context | Required | Luôn lưu UTC, render theo giờ local của người xem |
| `correlation_id` | Context | Required | Gom nhiều row audit từ một hành động logic (bulk edit → nhiều child) hoặc một request qua nhiều service |
| `trace_id` / `span_id` | Context | Optional | Nối vào distributed tracing (OpenTelemetry) — khác correlation_id (cái này để debug/perf) |
| `session_id` | Context | Recommended | Nối action vào phiên đăng nhập; cần cho forensic session-hijack |
| `source_ip` | Context | Required | Gốc request |
| `user_agent` | Context | Recommended | Client/browser/CLI (cap ~1KB như CloudTrail) |
| `app_or_service_name` | Context | Recommended | Service/module nào phát event |
| `environment` | Context | Recommended | prod/staging/dev — tránh trộn noise test vào export compliance |
| `source` (screen/endpoint/job/import) | Context | Recommended | Phân biệt UI vs API vs background job vs CSV import — bịt lỗ hổng "đường không qua UI" |
| `before_state` / `old_values` | Change | Conditional | Giá trị trước (JSON) — cần cho update/delete |
| `after_state` / `new_values` | Change | Conditional | Giá trị sau (JSON) — cần cho create/update |
| `changed_fields` | Change | Recommended | Danh sách/diff key đã đổi — query rẻ hơn diff hai blob |
| `reason` / `justification` | Change | Optional | Bắt buộc cho thay đổi nhạy cảm (cấp quyền, override tài chính) |
| `sequence_number` | Integrity | Recommended | Bộ đếm tăng đơn điệu theo partition — phát hiện gap (thiếu số = tamper/mất write) |
| `record_hash` | Integrity | Optional (high-assurance) | SHA-256 nội dung đã chuẩn hoá |
| `prev_hash` | Integrity | Optional (high-assurance) | Hash record trước → log thành hash chain verify được; sửa 1 record là gãy chain |
| `signature` | Integrity | Optional (regulated) | Ký (HMAC/bất đối xứng) lên hash, non-repudiation ngoài phạm vi nội bộ |

---

## 6. Model "cái gì đã thay đổi" (before/after)

Ba cách tiếp cận:

- **Full snapshot mỗi event** — lưu nguyên state (hoặc nguyên before+after) dạng JSON mỗi lần đổi. Đơn giản,
  tự chứa, dễ trả lời "record này lúc T trông thế nào". Tốn với entity rộng / bảng đổi nhiều.
- **Field-level diff** — chỉ lưu `{field: [old, new]}` cho key đã đổi (django-auditlog `changes`,
  Laravel `old_values`/`new_values`). Nhỏ, dễ đọc ("status: Pending → Approved"), nhưng phải cẩn thận với
  field lồng nhau và schema drift (field bị bỏ sau này nên đánh dấu "field removed", đừng để biến mất âm thầm).
- **Event sourcing** — audit log **chính là** source of truth, state hiện tại là projection replay từ stream.
  Rigorous nhất (append-only tự nhiên, có full history "miễn phí") nhưng là cam kết kiến trúc, **thường
  over-kill** khi chỉ bolt-on audit vào hệ CRUD sẵn có.

**Hybrid thực dụng (nhiều nguồn khuyên):** field-level diff cho update thường; full snapshot cho create,
delete, và thay đổi object nhạy cảm (permission, giá) — nơi tái dựng chính xác state trước là quan trọng nhất.
Hibernate Envers đi đường giữa: bảng `REVINFO` (revision id + timestamp) + mỗi entity một bảng `_AUD` mang
mọi cột audited + `REV` + `REVTYPE` (0=ADD,1=MOD,2=DEL); row DEL chỉ lưu id, các cột data null — chủ ý trả lời
"biết nó bị xoá tại revision này" mà không giữ giá trị "after" giả.

**Field nhạy cảm** (OWASP + SonarSource nhất quán):
- **Không bao giờ log secret** (password, API key, session token, encryption key) — kể cả phía "old".
- **Mask/redact PII** (email, phone, government ID): lộ một phần (`****-1234`) hoặc hash khi vẫn cần correlate;
  redact hẳn (`[REDACTED]`) khi không.
- Field-level encryption là lựa chọn reversible khi reviewer có thẩm quyền thỉnh thoảng cần giá trị thật;
  redaction/masking là default an toàn (irreversible).

**Payload lớn:** đặt cap byte cứng cho cột JSON, **omit (không truncate giữa JSON)** khi vượt, và tham chiếu
payload lớn/binary (file upload, text dài) bằng id thay vì inline (CloudTrail cap 100KB requestParameters, cắt
theo thứ tự ưu tiên khi event vượt 1MB).

---

## 7. Event taxonomy (phân loại + đặt tên action)

**Nhóm hay gặp:** CRUD (create/update/delete/restore); Auth (`login.success`, `login.failed`, `logout`,
`password.changed`, `mfa.enabled/disabled`, `session.expired`); Authorization (`role.granted`, `role.revoked`,
`permission.updated`); Export/Import (`export.csv`, `import.bulk`); Config/Admin (`setting.changed`,
`feature_flag.toggled`, `impersonation.started/ended`); Bulk (một parent event "bulk update: 500 records" +
child event mỗi record nối bằng `correlation_id`, **không bao giờ** một row mơ hồ "updated 500 records").

**Quy ước đặt tên:** dạng `resource.action` (object.verb) dot-namespaced là chuẩn de-facto (GCP `method_name`
dùng `service.Resource.Verb`). Ưu điểm: nhóm tự nhiên theo alphabet, phân biệt `user.create` (admin tạo user)
với `user.login` (user tự đăng nhập), scale tới hàng trăm loại event không đụng nhau. Dùng **động từ quá khứ/
khai báo** (`updated` không phải `update`) vì log luôn mô tả chuyện đã xảy ra; giữ động từ trong một **vocab
nhỏ có kiểm soát** (create/update/delete/restore/login/logout/grant/revoke/export/import) thay vì tự do
("Updated"/"Edit"/"Change"/"Modify" lẫn lộn là anti-pattern có tên).

---

## 8. Feature set của hệ audit (UI/API)

Rút từ Microsoft Purview, ABP audit-logging module, uTPro, và thực tế compliance export:

- **Search & filter** — theo actor, resource type+id, khoảng ngày (kèm quick range), action, outcome, source
  (UI/API/job). Kết hợp full-text trên `resource_name`/`reason` với filter có cấu trúc.
- **Resource history / timeline** — "activity feed" cho một `resource_id`, mới nhất trước, mỗi row =
  verb + object + actor + tóm tắt thay đổi inline ("status: Pending → Approved").
- **Diff viewer** — mở row xem full before/after JSON theo từng field, **field nhạy cảm vẫn mask lúc render**
  kể cả với reviewer có thẩm quyền trừ khi có permission unmask riêng.
- **Export** — CSV/JSON cho compliance, lọc theo ngày + resource type, **không phải dump DB thô** (Purview cap
  50.000 row/lần export — trần hợp lý để noi theo).
- **Pagination log lớn** — cursor/keyset (không offset) vì bảng append-only lớn dần; index
  `(resource_type, resource_id, timestamp)` và `(actor_id, timestamp)`.
- **Alerting event khả nghi** — near-real-time cho pattern như login fail lặp, hành động admin ngoài giờ,
  escalate quyền rồi truy cập dữ liệu nhạy cảm ngay, export số lượng lớn đột ngột.
- **Tamper-evidence verification** — action "verify integrity" cho admin: đi dọc hash chain (tính lại
  `record_hash` từ `prev_hash` + nội dung), báo mắt xích gãy đầu tiên nếu có.
- **Audit-of-the-audit** — cảnh báo khi lượng audit-write tụt về 0 (đường ghi ngừng phát event tự nó là tín
  hiệu bảo mật, không chỉ là bug).

---

## 9. Kiến trúc capture (sinh event ở đâu)

| Cách | Cơ chế | Mạnh | Yếu |
|---|---|---|---|
| **App-level** (interceptor/decorator/service) | Code chủ động phát event tại điểm nghiệp vụ | Bắt được **context nghiệp vụ** (ai/vì sao/use case nào), log được cả event non-DB (login, export), test được | Phụ thuộc dev nhớ instrument mọi đường mutation; SQL trực tiếp/migration bypass |
| **DB trigger** | `AFTER INSERT/UPDATE/DELETE` bắn bất kể caller | Không gì bypass — bắt cả migration, hotfix, admin SQL | Không có context nghiệp vụ; bắn per-row (bulk chậm/spam); PL/pgSQL là ngôn ngữ thứ 2 phải nuôi; khó unit-test |
| **CDC** (Debezium đọc WAL) | Đọc write-ahead log, stream downstream | Overhead thấp nhất trên bảng nguồn; đầy đủ; decoupled | Vẫn không có "why" của app; cần thêm infra (Kafka) |
| **Event Sourcing** | State change **chính là** audit log | Full audit by construction; hợp domain kiểu kế toán | Cam kết kiến trúc lớn — không hợp để bolt-on |

**Khuyến nghị hội tụ:** dùng **app-level làm chính** (bắt intent, correlation, "what/why" nghiệp vụ), thêm
**DB trigger làm lưới an toàn** chỉ trên bảng cực nhạy cảm để bắt thay đổi out-of-band. (Team Pydantic/Logfire
đã bỏ pure-trigger vì bulk migration đơ dưới overhead per-row, audit bị spam noise hệ thống, và PL/pgSQL thành
gánh nặng bảo trì — họ chuyển sang app-level, async, queued.)

**Vị trí trong backend phân lớp/DDD (khớp repo này):** interceptor/middleware ở presentation layer chỉ để
**capture context** (actor, IP, correlation id); **write audit nằm ở application/service layer** (hoặc trong
command handler — nhất quán với "no errors in controllers"); persistence qua `AuditRepository` ở infrastructure,
controller không bao giờ ghi trực tiếp.

**Sync vs async — outbox pattern:** nếu record **phải** không được mất → ghi trong **cùng transaction** với
thay đổi nghiệp vụ (rollback là mất cả hai — atomicity miễn phí). Nếu cần delivery decoupled (stream sang
Kafka/Elastic) → **Transactional Outbox**: insert row vào bảng outbox cùng transaction, một relay riêng publish
+ đánh dấu sent (at-least-once, không cần distributed transaction).
**Trade-off phải quyết rõ:** ghi audit *trong* cùng transaction nghĩa là rollback cũng xoá luôn audit của
thao tác **thất bại** — đôi khi đó chính là cái ta *không* muốn (muốn biết một thao tác đã bị *thử*). Một số
thiết kế chủ ý ghi audit trên **connection/transaction riêng** để nó sống sót qua rollback nghiệp vụ.

---

## 10. Kiến trúc storage

- **Cùng DB vs store riêng:** app nội bộ nhỏ→vừa → giữ audit **trong Postgres, một bảng append-only riêng**,
  chưa cần log store riêng. Log store riêng (Elastic/OpenSearch, Loki, S3) chỉ đáng khi cần full-text/analytics
  trên lượng lớn nhiều app, hoặc volume vượt bảng quan hệ. Postgres thắng khi cần consistency giao dịch với dữ
  liệu nghiệp vụ, join với entity, và không muốn thêm infra. Hybrid phổ biến: Postgres là bản authoritative,
  đẩy một chiều (CDC/batch) sang store analytics cho dashboard.
- **Thiết kế bảng (pattern hội tụ):** partition theo thời gian (thường theo tháng); **partition key phải nằm
  trong mọi unique constraint** (nên PK là composite `(event_id, occurred_at)`); xoá partition cũ bằng
  `DROP TABLE` (O(1), tránh bloat VACUUM mà bulk `DELETE` gây ra).
- **Index theo query thật, không exhaustive:** `(actor_id, occurred_at DESC)`,
  `(resource_type, resource_id, occurred_at DESC)`, tuỳ chọn `(action, occurred_at DESC)`. Giữ index trên
  partition "hot" tối thiểu để bảo vệ write throughput.
- **Archival/growth:** chuyển partition cũ sang storage rẻ hoặc export batch ký (CSV/Parquet → S3 Object Lock);
  đừng dựa vào mass delete định kỳ.

---

## 11. Integrity & tamper-evidence (xếp theo chi phí/lợi ích)

**Phân biệt cốt lõi:** tamper-**evident** ≠ tamper-**proof**. Mục tiêu là làm cho việc sửa trái phép **bị phát
hiện được**, không phải bất khả thi vật lý.

| Kỹ thuật | Sức mạnh | Chi phí | Khi nào dùng |
|---|---|---|---|
| **DB permission hardening** — `REVOKE UPDATE, DELETE` khỏi app role, chỉ `INSERT`; thêm `BEFORE DELETE` trigger raise exception làm chốt 2 | Chặn xoá vô ý + tamper qua app-layer; dễ suy luận | ~0 (migration + đổi grant) | **Baseline cho MỌI bảng audit, luôn luôn.** Owner/superuser vẫn bypass được trừ khi thêm `FORCE ROW LEVEL SECURITY` — ghi rõ lỗ hổng này, đừng giả vờ không có |
| **Row-Level Security (RLS)** | Giới hạn row mỗi DB role thấy/chạm | Thấp-vừa | Nhiều role/tenant chung cluster, cần enforce dưới app |
| **Hash chaining** (mỗi record lưu `hash(record + prev_hash)`) | Phát hiện mọi sửa/xoá record quá khứ (chain gãy) | Thấp-vừa; verify O(n) trừ khi checkpoint | Hệ nhỏ→vừa muốn tamper-evidence mật mã mà không thêm infra — bậc "nâng lên" hợp lý từ pure-permission |
| **Merkle trees** | Proof inclusion từng phần hiệu quả (verify 1 record không replay cả log) | Vừa | Volume lớn đến mức verify cả chain mỗi query bất khả thi |
| **Digital signatures** | Chứng minh **tác giả**, không chỉ non-tamper; chống app server bị chiếm quyền giả record | Vừa (quản khoá, HSM/KMS) | Môi trường regulated cần non-repudiation, hoặc writer/verifier phải là bên mật mã tách biệt |
| **External anchoring** (định kỳ publish root hash ra log ngoài — RFC 3161, Sigstore Rekor, blockchain) | Đánh bại kịch bản "attacker viết lại cả chain hồi tố" | Vừa-cao | Hệ high-assurance, insider có full DB access nằm trong threat model |
| **WORM object storage** (S3 Object Lock Compliance, Azure immutable blob) cho archive/export | Cả account owner cũng không xoá/rút ngắn retention; đạt SEC 17a-4/FINRA | Thấp-vừa (feature cloud) | Cold/archive cần immutability mức pháp lý |
| **Immutable ledger DB** (QLDB cũ, Azure SQL Ledger, ImmuDB/Dolt) | Chained + Merkle-verified, "DBA cũng không tamper mà không bị phát hiện" | Cao (data store + operational model mới) | Chỉ khi regulator đòi non-repudiation mật mã. **Cảnh báo vendor-lifecycle: AWS đã ngừng QLDB cho signup mới 2024 và tắt hẳn 7/2025**, migrate sang Aurora Postgres (mất luôn bảo đảm verifiability) |

**Proportionality cho app nội bộ nhỏ:** stack thực dụng = **(1) DB permission hardening luôn** + **(2) hash
chaining** nếu tamper-evidence cần sống sót qua một actor app-level bị chiếm quyền/ác ý. Merkle/ký số/anchoring/
ledger DB là over-engineering trừ khi có driver quy định thực (tài chính, y tế, SOC2 Type II với auditor ngoài
đòi proof mật mã).

---

## 12. Access control & vai trò

**Nguyên tắc gốc — segregation of duties:** người có thể *thực hiện* một hành động không được là người có thể
*che giấu bằng chứng* của nó. Nếu admin vừa đổi được vừa xoá/sửa được audit trail của thay đổi đó thì control
vô nghĩa. Vì vậy **kể cả superadmin cũng bị chặn quyền write/delete trực tiếp** vào audit store — "hệ thiết kế
đúng ngăn bất kỳ ai sửa/xoá audit log, kể cả sysadmin".

**Truy cập audit trail tự nó là event bảo mật và phải được log.** Read của Auditor, và mọi mưu toan (bị từ chối)
write/delete, đều sinh audit entry riêng ("nghịch lý của log mà không được log").

| Vai trò | Đọc audit | Ghi audit | Xoá/sửa audit | Ghi chú |
|---|---|---|---|---|
| **App service account** (backend process) | Không | Insert-only | Không bao giờ | Role duy nhất có grant `INSERT`; không `UPDATE`/`DELETE` |
| **Admin/operator thường** | Có phạm vi (chỉ entry về resource họ quản), nếu có | Không | Không | Người dễ **là đối tượng** của entry nhất — không được xoá dấu vết của chính mình |
| **Auditor** (read-only chuyên biệt) | Full read toàn hệ | Không | Không | Least-privilege đọc; có thể là người hoặc tool compliance; truy cập tự nó bị log |
| **Superadmin / DBA** | Full read (cho incident response) | Không, qua app path | Không (chặn bởi DB grant + lý tưởng `FORCE ROW LEVEL SECURITY`) | Bị ràng buộc **by design**, không by trust — điểm của control là sống sót qua superadmin bị chiếm quyền |
| **Security/compliance team** | Full read + export | Không | Không (nhưng quản **policy** retention, không quản record lẻ) | Tách khỏi đội vận hành hằng ngày |

**Áp cho NestJS/Prisma repo này:** endpoint đọc audit sau một guard `Auditor`/read-only **riêng biệt** với
authorization admin thường; Prisma client dùng để ghi audit chạy dưới Postgres role **chỉ có `INSERT`** trên
bảng audit (enforce ở DB layer, không chỉ app layer — defense in depth); mọi endpoint đọc audit **tự phát**
một entry (`action: 'audit.viewed'`).

---

## 13. Reliability & vận hành

**Fail-open vs fail-closed — audit-write fail có chặn transaction nghiệp vụ không?**
- **Fail-closed** (fail → chặn/rollback): bảo đảm không hành động nào không được audit. Dùng ở hệ high-assurance
  (OpenBao: "nếu audit device không ghi được request thì chặn request").
- **Fail-open** (fail → log lỗi rồi cho chạy tiếp): ưu tiên availability; OWASP khuyên cho general logging
  ("lỗi trong logging không được ngăn app chạy").

Hai nguồn **mâu thuẫn trực tiếp** vì trả lời hai câu khác nhau: OWASP nói về diagnostic/security log (mất một
dòng là degradation chấp nhận được); OpenBao nói về audit compliance-grade (một hành động privileged không được
audit là không chấp nhận). **Lựa chọn phải tỉ lệ với độ nhạy cảm, quyết theo từng lớp action, không toàn cục:**
- Same-transaction write là cách đơn giản nhất để có fail-closed miễn phí, nhưng rollback cũng xoá audit của
  thao tác *thất bại*.
- Throughput cao/decoupled → **outbox**: business write + outbox insert atomic (fail-closed ở DB layer),
  delivery downstream async retry (fail-open cho delivery).
- **Khuyến nghị cho console nhỏ:** fail-closed cho **bản ghi bền** (same-transaction insert, hoặc outbox),
  fail-open chỉ cho **mối lo phụ** như ship bản sao sang analytics/search.

**Khác:**
- **Guaranteed delivery:** outbox (hoặc CDC đọc WAL) là cách chuẩn tránh fire-and-forget làm rớt event khi crash.
- **Monitor chính pipeline audit:** cảnh báo write fail, backlog/queue tăng, và **fail khi tạo partition**
  (thiếu partition tương lai → insert bắt đầu lỗi).
- **Time sync:** timestamp **server-generated, UTC**, host sync NTP (ISO 27001 A.8.17). **Không bao giờ tin
  timestamp do client gửi** cho `occurred_at`.
- **Perf hot path:** tránh trigger per-row đồng bộ trên bảng throughput cao; ưu tiên batched/async off critical
  path khi đã lo durability bằng outbox; giữ index bảng audit tối thiểu để insert rẻ.
- **Log-review workflow:** log ghi mà không ai review = vô giá trị bảo mật (OWASP Top 10 2025 A09 đổi tên thành
  "Security Logging and **Alerting** Failures"). Định rõ ai review, nhịp nào (điều tra ad-hoc / lấy mẫu định kỳ /
  rule tự động như "actor X xoá >100 record trong 1 giờ").

---

## 14. Privacy — GDPR vs immutable audit log

Căng thẳng có thật và chỉ giải được một phần bằng kỹ thuật: quyền xoá (Art 17) đối chọi mục đích audit (bản ghi
vĩnh viễn, chứng minh được).

- **Pseudonymization ≠ erasure.** Thay tên bằng token vẫn là *personal data* chừng nào còn đường tái định danh;
  xoá bảng mapping gần "erasure" hơn nhưng tính pháp lý còn chưa ngã ngũ (án CJEU C-413/23 P đang chờ).
- **Crypto-shredding** (mã hoá field PII bằng khoá per-subject; "xoá" = huỷ khoá, để lại ciphertext + cấu trúc
  audit bất biến) là cách reconcile kỹ thuật hay được đề xuất nhất: giữ immutability (chain không đụng) mà làm
  personal data thực tế bất khả phục hồi.
- **GDPR tự cho cơ sở giữ lại:** Art 17(3) miễn erasure khi cần cho nghĩa vụ pháp lý hoặc thiết lập/phòng vệ
  legal claim — audit trail cho mục đích security/accountability thường đủ điều kiện, **miễn tôn trọng data
  minimization**.

**Reconcile thực tế cho hệ kiểu này:**
1. **Tối giản PII đưa vào record ngay từ đầu** — lưu *reference* (user id, resource id) thay vì snapshot PII đầy
   đủ trong `old_value`/`new_value` ở field nhạy cảm.
2. **Pseudonymize actor reference** — lưu internal id ổn định, resolve ra tên qua một bảng identity riêng có
   access control, để bảng audit không cần đổi khi có erasure request (chỉ bảng identity đổi).
3. **Field buộc phải chứa PII trong diff** (vd "email đổi từ X sang Y") → field-level encryption per-subject,
   dùng crypto-shredding làm cơ chế erasure thay vì mutate/xoá row.
4. **Viết rõ retention policy + legal basis** (Art 6(1)(c)/(f)) thay vì âm thầm giữ mọi thứ mãi.

---

## 15. Anti-patterns (danh sách né)

1. **Bảng audit mutable / cho UPDATE-DELETE trên row audit** — record đổi được là nói dối by design.
2. **Thiếu correlation id** — mỗi row đứng lẻ, bulk/multi-service thành N row rời không gom lại được.
3. **ID-only logging** — chỉ lưu `resource_id` không snapshot tên; entity đổi tên/xoá sau → log không đọc nổi
   ("User 4821 updated Record 9931").
4. **Lưu PII/secret plaintext** — biến bảng audit thành bản sao thứ 2, kém bảo vệ hơn, của dữ liệu nhạy cảm nhất.
5. **Growth vô hạn không partition/retention** — bảng audit cuối cùng nuốt DB chính, hỏng backup/perf.
6. **Trigger-only capture** — thấy row đổi nhưng mất context nghiệp vụ (màn nào, endpoint nào, role gì, vì sao).
7. **Lỗ hổng đường không-qua-UI** — CSV import, background job, integration bên thứ 3 lách audit trừ khi ép mọi
   write qua một routine phát audit chung.
8. **Bulk entry mơ hồ** — một row "updated 500 records" vô dụng cho điều tra per-record.
9. **Vocab động từ không nhất quán** — "Updated"/"Edit"/"Change"/"Modify" lẫn lộn → stream không lọc/đọc được.
10. **Over-index bảng audit** — index mọi field làm chậm mọi insert + phình storage; chỉ index hot-path lookup.
11. **Không monitor chính pipeline audit** — đường ghi hỏng âm thầm để lại blind spot y hệt "không có gì xảy ra".

---

## 16. Tiering: minimum viable → enterprise (khung quyết định)

**Essential (làm kể cả app nội bộ nhỏ):** bảng audit riêng insert-only; schema 5W+H; log auth + admin/privilege
+ CRUD entity nhạy cảm + permission change + truy cập chính audit log; không lưu secret/PII thô; hạn chế quyền
đọc; timestamp UTC server-side; retention policy viết ra; đọc/lọc được theo actor/resource/ngày.

**Nice to have (biện minh bằng rủi ro thực, không theo bản năng gold-plate):** hash-chaining/ký per-record cho
tamper-*proof*; alerting/review tự động hằng ngày (mức PCI/SOC2); WORM storage khi có legal-hold thực; full
event-sourcing chỉ khi cũng muốn state reconstruction làm *feature*; non-repudiation ký số (NIST AU-10 vốn là
"High baseline only" ngay cả với hệ liên bang — bỏ qua trừ khi có yêu cầu tranh chấp/pháp lý cụ thể).

**Overkill cho console nội bộ:** SIEM real-time/correlation engine, đội security-analyst review riêng, federation
log liên tổ chức (NIST AU-16), chương trình ROPA đầy đủ (nếu thật sự low-risk, low-volume, <250 nhân viên),
pipeline log-review tự động dựng cho môi trường cardholder-data PCI.

---

## 17. Bước tiếp theo (phase 2, chưa làm)

Từ research này, khi thiết kế cho console cần chốt các quyết định:
1. Capture ở app-level (interceptor context + write ở service/command handler) — chốt vị trí trong kiến trúc DDD hiện tại.
2. Đặt schema Prisma cho `audit_event` (theo bảng §5, chọn Required + Recommended, bỏ Optional/high-assurance ban đầu).
3. Chốt sync same-transaction (fail-closed) hay outbox.
4. DB role insert-only + `REVOKE UPDATE, DELETE` (migration).
5. Event taxonomy `resource.action` cho các domain console hiện có.
6. Guard `Auditor` read-only + tự-audit endpoint đọc.
7. Retention + partition (nếu cần) — hay để đơn giản một bảng flat lúc đầu.
8. UI: timeline per-resource + search/filter + diff viewer (reuse primitive console sẵn có).

Hash-chaining, WORM, ký số: **để dành**, chỉ thêm khi có driver thực.

---

## Nguồn

**Standards / compliance**
- NIST SP 800-92: https://csrc.nist.gov/pubs/sp/800/92/final · Rev.1 draft: https://csrc.nist.gov/pubs/sp/800/92/r1/ipd
- NIST 800-53 Rev.5 AU family: https://csf.tools/reference/nist-sp-800-53/r5/au/
- ISO 27002 Control 8.15 Logging: https://www.isms.online/iso-27002/control-8-15-logging/
- SOC 2 CC7.2: https://www.isms.online/soc-2/controls/system-operations-cc7-2-explained/ · https://auditkit.dev/blog/soc-2-audit-log-requirements
- OWASP Logging Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html
- OWASP Logging Vocabulary Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Vocabulary_Cheat_Sheet.html
- OWASP Top 10:2025 A09: https://owasp.org/Top10/2025/A09_2025-Security_Logging_and_Alerting_Failures/
- OWASP ASVS V7: https://github.com/OWASP/ASVS/blob/master/4.0/en/0x15-V7-Error-Logging.md
- PCI-DSS Req 10: https://pcidssguide.com/pci-dss-requirement-10/ · https://www.herodevs.com/blog-posts/pci-dss-4-0-requirement-10-how-to-log-and-monitor-all-access-to-system-components-and-cardholder-data
- GDPR Art 30: https://gdpr-info.eu/art-30-gdpr/
- HIPAA §164.312(b): https://www.hhs.gov/sites/default/files/january-2017-cyber-newsletter.pdf · https://www.ecfr.gov/current/title-45/subtitle-A/subchapter-C/part-164/subpart-C/section-164.312

**Data model / schema / thư viện**
- AWS CloudTrail record contents: https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-event-reference-record-contents.html
- GCP audit_log.proto: https://github.com/googleapis/googleapis/blob/master/google/cloud/audit/audit_log.proto
- Azure Activity Log schema: https://learn.microsoft.com/en-us/azure/azure-monitor/platform/activity-log-schema
- django-auditlog: https://github.com/jazzband/django-auditlog/blob/master/auditlog/models.py
- paper_trail: https://github.com/paper-trail-gem/paper_trail
- Hibernate Envers: https://docs.jboss.org/envers/docs/ · https://vladmihalcea.com/the-best-way-to-implement-an-audit-log-using-hibernate-envers/
- Laravel Auditing: https://github.com/owen-it/laravel-auditing
- SonarSource audit logging: https://www.sonarsource.com/resources/library/audit-logging/
- AppMaster (internal-tools audit + partitioning): https://appmaster.io/blog/audit-logging-internal-tools-activity-feed · https://appmaster.io/blog/postgresql-partitioning-event-audit-tables
- Correlation ID vs Trace ID: https://last9.io/blog/correlation-id-vs-trace-id/

**Kiến trúc / integrity / ops / privacy**
- Martin Fowler Audit Log: https://martinfowler.com/eaaDev/AuditLog.html · Event Sourcing: https://martinfowler.com/eaaDev/EventSourcing.html
- NestJS audit trail: https://medium.com/@solomoncodes/building-an-audit-trail-system-in-nestjs-222a4604a6a2 · https://cropsly.com/blog/implementing-audit-logging-in-a-nestjs-application
- Transactional Outbox: https://microservices.io/patterns/data/transactional-outbox.html · https://learn.microsoft.com/en-us/azure/architecture/databases/guide/transactional-out-box-cosmos
- Pydantic/Logfire triggers→async migration: https://pydantic.dev/articles/audit-logs-replace-database-triggers
- Enforce immutability/append-only: https://www.designgurus.io/answers/detail/how-do-you-enforce-immutability-and-appendonly-audit-trails
- Crosby & Wallach tamper-evident logging (USENIX 2009): https://static.usenix.org/event/sec09/tech/full_papers/crosby.pdf
- AWS QLDB retirement: https://www.infoq.com/news/2024/07/aws-kill-qldb/ · https://www.dolthub.com/blog/2024-08-12-qldb-deprecated-alternatives/
- Segregation of duties: https://www.imperva.com/learn/data-security/separation-of-duties/ · https://www.fortra.com/blog/audit-log-best-practices-security-compliance
- Audit-ready access logs (RBAC): https://hoop.dev/blog/audit-ready-access-logs-with-role-based-access-control-the-foundation-of-compliance-security-and-trust/
- OpenBao fail-closed audit devices: https://deepwiki.com/openbao/openbao/9.5-audit-logging
- ISO 27001 A.8.17 clock sync: https://watchdogsecurity.io/iso-27001/clock-synchronization
- WORM / S3 Object Lock: https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock.html · Azure immutable blob: https://learn.microsoft.com/en-us/azure/storage/blobs/immutable-storage-overview
- Crypto-shredding vs GDPR: https://veritaschain.org/blog/posts/2026-01-18-crypto-shredding-gdpr-mifid-ii-reconciliation/
- Postgres vs Elasticsearch cho log: https://www.onsecurity.io/blog/solving-our-problem-with-audit-postgres-and-elasticsearch/
- Red-Gate DB design for audit logging: https://www.red-gate.com/blog/database-design-for-audit-logging/
