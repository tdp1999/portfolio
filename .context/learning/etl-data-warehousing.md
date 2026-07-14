# ETL & Data Warehousing — kiến thức nền

> Ghi chú học tập, không gắn với thư viện cụ thể. Study date: 2026-07-13.
> (Xuất phát từ việc đọc repo datacoolie, nhưng phần dưới là khái niệm chung của ngành.)

## 1. Bài toán gốc

Một công ty vận hành nhiều hệ thống, dữ liệu **rải rác nhiều nơi, nhiều định dạng**:
DB vận hành (Postgres), cổng thanh toán (API), quảng cáo (Facebook/Google Ads API),
tồn kho (CSV), CSKH (ticket tool)... Sếp và các phòng ban hỏi những câu **cần ghép
nhiều nguồn** (VD: "1 đồng Facebook Ads đẻ ra bao nhiêu doanh thu?" cần ghép quảng cáo
+ đơn hàng + thanh toán).

**Không được phân tích thẳng trên DB vận hành**, vì:
1. Query phân tích rất nặng → làm chậm/sập app đang phục vụ khách thật.
2. DB vận hành chỉ giữ trạng thái *hiện tại*, không giữ lịch sử.
3. Nhiều nguồn (Facebook, tồn kho...) không nằm trong DB đó.

## 2. Lời giải chung của ngành

**Đừng phân tích tại nguồn. Copy hết dữ liệu về MỘT kho tập trung, làm sạch, rồi phân
tích ở đó.** Kho đó = **data warehouse** (thiết kế để đọc/tổng hợp, không phục vụ app).
Việc copy + làm sạch + biến đổi dọc đường = **ETL** (Extract → Transform → Load).

**Mục đích sau cùng:** biến dữ liệu thô rải rác thành **quyết định kinh doanh** — qua
dashboard (BI), báo cáo định kỳ, hoặc mô hình machine learning.

## 3. Các nấc trưởng thành (cách giải bài toán từ sơ khai → chuẩn công nghiệp)

**Nấc 0 — Excel thủ công.** Analyst tự export CSV, ghép tay bằng VLOOKUP, gửi email.
Chỉ hợp lúc rất nhỏ. Chậm, dễ sai, không lặp lại, không có lịch sử.

**Nấc 1 — Script + cron.** Dev viết script Python kéo từng nguồn, cron chạy 2h sáng.
Đây là ETL thật, nhưng lộ ra đúng những nỗi đau mà cả ngành phải giải:
- Không biết cái nào chạy xong / lỗi (2h sáng lỗi, sáng ra dashboard sai không rõ vì sao).
- Không có retry (mạng chớp là hỏng cả mẻ).
- Không nhớ trạng thái → mỗi đêm quét lại TOÀN BỘ từ đầu, càng ngày càng chậm.
  (Cái "nhớ tới đâu" này gọi là **watermark** / incremental load.)
- Phụ thuộc lẫn nhau khó quản (bảng B phải chờ bảng A xong).
- Code kết nối/retry/log bị copy-paste khắp nơi.

**Nấc 2 — Modern data stack (chuẩn hiện đại).** Lắp ghép công cụ chuyên dụng:
- **Kho:** data warehouse (Snowflake, BigQuery) hoặc **lakehouse** (Databricks/Delta Lake).
  Lakehouse = vừa rẻ như lưu file thô, vừa query được như database.
- **Nhạc trưởng điều phối:** **Airflow** (thay cron: khai báo thứ tự phụ thuộc, tự retry,
  có UI theo dõi). Đối thủ: Prefect, Dagster.
- **Công cụ transform:** **dbt** (biến đổi bằng SQL, có test, có version git).
- **Kiến trúc phân tầng medallion:**
  - **Bronze** = bản sao thô y nguyên (để lần lại được nếu sai).
  - **Silver** = đã làm sạch, chuẩn kiểu, khử trùng lặp, ghép nguồn.
  - **Gold** = đã tổng hợp theo nhu cầu kinh doanh, sẵn cho dashboard.
- **Người dùng cuối:** cắm **BI tool** (Power BI, Tableau, Metabase) vào tầng Gold.

**Phân vai người làm:** data engineer (xây/vận hành pipeline, hạ tầng) · analytics
engineer (model dbt tầng silver/gold) · data analyst (dashboard, trả lời câu hỏi KD) ·
data scientist (lấy dữ liệu làm mô hình dự đoán).

## 4. Vài khái niệm cần nhớ

- **OLTP vs OLAP:** OLTP = hệ thống giao dịch (Core, app) tối ưu cho ghi/đọc nhanh từng
  bản ghi. OLAP = kho phân tích tối ưu cho tổng hợp hàng triệu dòng. Không dùng chung.
- **System of record:** hệ thống "nguồn sự thật" gốc (VD Core banking). Warehouse chỉ là
  bản sao để phân tích, không phải nguồn sự thật.
- **Watermark / incremental load:** chỉ lấy dữ liệu mới hơn lần chạy trước (con trỏ thời gian).
- **SCD2 (Slowly Changing Dimension type 2):** lưu **lịch sử thay đổi** của một dòng — mỗi
  lần đổi thêm một phiên bản mới thay vì ghi đè. Cực quan trọng cho audit & báo cáo.
- **CDC (Change Data Capture):** bắt thay đổi ở nguồn gần thời gian thực (thay cho batch đêm).
- **Batch vs Streaming:** chạy theo mẻ định kỳ (đêm) vs chảy liên tục gần realtime.
- **DataFrame:** bảng dữ liệu trong bộ nhớ (rows × cột) mà engine thao tác.
- **Engine (Spark/Polars):** Spark = xử lý phân tán nhiều máy (big data). Polars = nhanh
  gọn trên một máy (single-node).
- **Format bảng (Delta Lake / Iceberg / Parquet):** định dạng file lưu bảng tối ưu analytics.

## 5. Ngành ngân hàng và data warehouse

Ngân hàng là một trong những **khách hàng lâu đời & nặng nhất** của data warehouse.

**Kiến trúc vận hành (OLTP)** thường có: **Core banking** (sổ cái, tài khoản, giao dịch —
system of record; VD Temenos T24, Finacle, Flexcube) ← **ESB** (bus tích hợp, định tuyến
message giữa hệ thống) ← **Channel/Initiator** (mobile, internet banking, ATM, quầy — nơi
khởi tạo giao dịch).

**Warehouse đứng TÁCH RIÊNG** khỏi luồng đó (đúng lý do mục 1: không được phân tích thẳng
trên Core). Luồng dữ liệu điển hình:
- **Batch cuối ngày (EOD):** đêm nào cũng trích toàn bộ giao dịch/số dư/tài khoản từ Core
  → landing/bronze → silver → **data mart** theo chủ đề → báo cáo.
- **Realtime qua ESB/Kafka:** ngày càng phổ biến — bắt sự kiện giao dịch từ ESB để chống
  gian lận (fraud/AML) gần thời gian thực. Tức **ESB cũng là một NGUỒN** cho data platform.

**Vì sao ngân hàng bắt buộc phải có:**
1. **Báo cáo tuân thủ** cho ngân hàng nhà nước (SBV), Basel, IFRS9, AML/KYC — bắt buộc.
2. **Quản trị rủi ro:** chấm điểm tín dụng, phát hiện gian lận.
3. **Customer 360:** gộp một khách qua nhiều sản phẩm (tiết kiệm, vay, thẻ).
4. **SCD2 là xương sống:** phải giữ lịch sử mọi thay đổi (trạng thái tài khoản, địa chỉ KH)
   để audit & báo cáo — không được ghi đè.

**Công cụ:** ngân hàng truyền thống dùng ETL enterprise (Informatica, IBM DataStage,
Ab Initio, Talend) + kho Teradata/Oracle Exadata, mô hình dữ liệu chuẩn ngành (Teradata
FSLDM, IBM FSDM). Đang dịch dần lên cloud (Snowflake/Databricks/BigQuery + dbt) nhưng nhiều
nơi vẫn on-prem vì quy định & chủ quyền dữ liệu.

**VN thực tế:** hầu hết ngân hàng lớn (Vietcombank, Techcombank, VPBank, TPBank...) đều có
chương trình data warehouse / data lake. Techcombank làm nền tảng dữ liệu cloud quy mô lớn;
nhiều bank xây data lake để chống gian lận & chấm điểm tín dụng.

### 5b. Tình huống xuyên suốt (ngân hàng)

> Khách bấm chuyển tiền trên **mobile app (Channel)** → lệnh qua **ESB** → tới **Core**
> ghi sổ. Cuối ngày, job batch trích toàn bộ giao dịch trong ngày từ Core → **bronze**
> (thô) → **silver** (sạch) → **gold** (VD "dư nợ theo chi nhánh theo ngày"). Tầng gold
> nuôi: báo cáo gửi SBV, hệ thống chống rửa tiền, mô hình rủi ro tín dụng, dashboard ban
> lãnh đạo. Song song, một luồng realtime nghe sự kiện trên ESB để cảnh báo giao dịch
> nghi ngờ gian lận trong vài giây.

### 5c. Không chỉ Core — mọi hệ thống nguồn đều có data giá trị

Core giữ "cái đã xảy ra" (khoản vay đã giải ngân). Nhưng các **initiator** như **LOS
(Loan Origination System)** giữ "cái suýt xảy ra": hồ sơ bị từ chối, khách rớt ở bước nào,
điểm tín dụng lúc nộp, lý do duyệt/từ chối, thời gian xử lý. Với mô hình rủi ro tín dụng,
**dữ liệu hồ sơ bị từ chối của LOS còn quý hơn cả Core** (cần cả hồ sơ bị từ chối để xây
scorecard không thiên lệch — gọi là *reject inference*). Nên LOS chắc chắn là nguồn cho EDW.

**Vì sao trong code LOS lại không thấy đoạn "export sang EDW" nào?** Vì việc nạp dữ liệu
vào warehouse là **pull-based và tách rời (decoupled)** — đây là thiết kế ĐÚNG, không phải
thiếu sót:
- EDW **tự đọc** DB của hệ thống nguồn (qua read-replica, bản trích DB, hoặc **CDC** bắt
  thay đổi), source app không viết code gì cả.
- Hoặc data platform **nghe ké sự kiện trên ESB** mà LOS đã publish sẵn cho tích hợp.
- Nguyên tắc: **hệ thống nguồn không được biết tới warehouse** (loose coupling). Source là
  system of record; warehouse copy TỪ nó. Việc source "ngây thơ" không biết EDW là đúng chuẩn.

Muốn kiểm chứng LOS có đang chảy vào EDW không, tìm dấu vết ở tầng hạ tầng (không ở code app):
read-replica của DB LOS, agent CDC (GoldenDebezium/GoldenGate...), user DB kiểu `etl_reader`,
job trích theo lịch, hoặc subscriber lạ trên ESB. App dev thường không thấy — hỏi team
DBA/data hoặc integration.

### 5d. Schema evolution (schema nguồn liên tục đổi)

Phân biệt: **SCD2** = đổi GIÁ TRỊ trong một dòng (versioning). **Schema evolution / drift**
= đổi CẤU TRÚC / tập cột (thêm/bỏ/đổi tên field). Medallion sinh ra để hấp thụ cái sau:
- **Bronze dễ dãi:** Delta/Iceberg `mergeSchema` tự thêm cột mới (dòng cũ = NULL); hoặc đổ
  JSON/blob ("schema-on-read") nhận mọi shape, parse sau. → ingest gần như không vỡ.
- **Silver kiểm soát theo luật additive:** thêm cột = dễ, tương thích ngược. Bỏ cột = KHÔNG
  xoá vật lý, giữ lại + ngừng đổ (NULL) + deprecate, để báo cáo quá khứ không vỡ. Đổi tên =
  thêm mới + deprecate cũ. Đổi kiểu = cột mới / cast có fallback.
- **Entity đang roll-out chưa chốt:** giữ ở dạng bán cấu trúc (JSON) trong silver tới khi model
  ổn định rồi mới promote thành cột; chưa hardening gold cho entity biến động.
- **Quản trị:** schema drift ở nguồn là nguyên nhân số 1 làm vỡ pipeline → dùng **data contract**
  (báo trước, versioned), **schema registry** (ép luật tương thích với luồng event), **cảnh báo
  drift tự động**. Warehouse không "chống" đổi — nó hấp thụ (bronze) + kiểm soát additive (silver)
  + giao tiếp qua contract.

### 5e. Unstructured data (remarks, comment free-text)

Sự thật: phần lớn free-text KHÔNG dùng để phân tích định lượng, và thế là bình thường. Các tầng
giá trị từ dễ tới khó:
- **Tầng 0 — chỉ để tra cứu/audit:** giữ trong bronze/silver cho drill-down, không vào gold.
- **Tầng 1 — metadata *về* text:** có điền hay trống (completeness metric), độ dài, ai/khi nào.
  Sự hiện diện tự nó là tín hiệu.
- **Tầng 2 — phi cấu trúc → cấu trúc:** phân loại bằng rule/regex/dictionary; **sửa từ gốc**
  (thay free-text bằng dropdown/enum ở nguồn — giải pháp thật); NLP (sentiment, topic, entity);
  **LLM extraction** (rút field cấu trúc từ text → JSON, cách hiện đại); search/embedding để gom cụm.
- **Đặc thù ngân hàng:** free-text là RỦI RO tuân thủ — có thể chứa PII hoặc lý do vi phạm fair
  lending → warehouse hay mask/redact/hạn chế quyền. Ngược lại AML lại đào free-text tìm cờ đỏ.
- **Chốt:** free-text thuần gần như không nuôi thẳng dashboard; muốn dùng thì structure hoá ở
  nguồn hoặc chạy bước phân loại/LLM.

## 6. Công cụ ETL "portable" (nơi datacoolie chen vào) — mục phụ

Ngay cả stack hiện đại vẫn còn nỗi đau: logic pipeline **dính chặt vào công cụ chạy**.
Prototype local chạy ngon, lên Spark/Databricks/AWS phải viết lại; đổi cloud/engine lại sửa.

**datacoolie** (Python, AGPL-3.0) đề xuất: mô tả pipeline **một lần bằng metadata (JSON)**,
phần chạy bằng engine gì (Polars/Spark) trên cloud nào (local/AWS/Databricks/Fabric) thì
framework lo. Kiến trúc: một orchestrator `DataCoolieDriver` + các **plugin** cắm-rút (engine,
platform, source, transformer, destination) nạp lười qua Python entry points. Repo cache tại
`~/.repomix-bank/datacoolie__datacoolie__main__compress.xml`.

**Lưu ý giá trị:** điểm mạnh không chỉ là "đổi cloud". Xem thảo luận ở mục dưới của phiên học.
Với ngân hàng thì một lib non trẻ AGPL khó lọt vào — bank dùng đồ enterprise được chứng nhận.
