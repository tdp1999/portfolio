# 389 — [learning] Refresh a stale test: pesticide + defect-clustering kata

> **[learning]** — Đây là bài tập của Learning Loop (domain: Testing, buổi 4), không phải yêu cầu sản phẩm. Giá trị nằm ở việc NGƯỜI HỌC tự quyết oracle, không delegate AI. Nối buổi học: `~/Code/personal/learning/domains/testing/`.

## Mục tiêu học

Luyện hai nguyên tắc testing trên code thật:

- **#4 Defect clustering** — tự tìm nhánh logic phức tạp chưa được test chạm.
- **#5 Pesticide paradox** — một bộ test cố định cùn dần; làm mới nó bằng ca test từ bug thật.

## Việc (chọn 1 trong 2)

Chọn **1 file test thật** trong `portfolio` nghi là "regression đã cùn" (test xanh lâu, ít động — ví dụ một `*.form.util.spec.ts` hoặc một validator spec), rồi:

- **(a)** Thêm **1 ca test** cho một **nhánh logic hiện chưa được chạm**. Tự tìm nhánh đó (= luyện #4). Xác định nhánh bằng cách đọc code + coverage, không đoán.
- **(b)** Tìm **1 bug thật/nghi ngờ**, viết **test tái hiện nó TRƯỚC**, chạy cho nó đỏ, rồi mới vá (= luyện #5 đúng bài: bug thật → test mới → vá).

## Ràng buộc (oracle ownership — từ buổi 3)

- **NGƯỜI HỌC quyết** nhánh nào chưa test / bug nào, và "đúng" nghĩa là gì (giá trị `expect`).
- AI được nháp ứng viên, nhưng mỗi quyết định nguyên tử phải người học xác nhận/sửa.
- Kiểm = "giá trị `expect` khớp acceptance criteria của mình không", KHÔNG phải "test có xanh không".

## Xong khi

- [ ] Chọn được file + nói được VÌ SAO nó "cùn" (theo ngôn ngữ #5).
- [ ] Thêm/sửa test, tự quyết oracle.
- [ ] Ghi lại 1–2 câu bài học vào Apply log của buổi học (`log.md`).

## Trạng thái

`pending` — tạo buổi 4 (2026-07-24). Không deadline cứng; làm trong tuần.
