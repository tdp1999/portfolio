# Hồ sơ project: Portfolio

File này (`.context/checklist-profile.md`) chứa dữ liệu riêng của một project: những câu trả lời đã biết. Luật chung nằm ở checklist và `lookup.md`, không chép lại ở đây.
Checklist trỏ tới đây bằng dấu "📁 §N". Lớn dần theo ticket: phát hiện điều mới thì ghi thêm một dòng. Điều gì gặp lại ở project thứ hai thì đưa lên file evergreen.

Dùng cho 3 tuần chạy thử workflow. Owner đóng luôn vai người đưa vấn đề, Manager và người nghiệm thu UAT.

## 1. Người dùng và bối cảnh sử dụng

| Ai | Ở đâu, thiết bị gì | Tay có rảnh không, mạng có ổn không | Hệ quả cho thiết kế |
| --- | --- | --- | --- |
| Người xem landing (recruiter, đồng nghiệp) | Desktop và điện thoại, 4 breakpoint | Thường lướt nhanh | Đọc được ở mobile; SSR để tải nhanh |
| Owner (tác giả nội dung, và người dùng duy nhất của các trang private) | Console và landing, cả điện thoại lẫn desktop | Desktop: ổn định · điện thoại: chưa ghi nhận | Form, rich-text editor; trang private ở cả console lẫn landing phải dùng được trên điện thoại |

## 2. Hôm nay họ làm thế nào

Cách làm hiện tại (kể cả Excel, gọi điện) và ràng buộc nó lộ ra.

## 3. Danh sách edge case riêng

- Hai ngôn ngữ EN / VI: chuỗi thiếu một bên, chuỗi tiếng Việt dài hơn
- SSR và hydration: nội dung khác nhau giữa server và client
- Dữ liệu prod là nguồn thật, seed local không phản ánh đủ

## 4. Câu hỏi hay phải hỏi (và ai trả lời)

Câu hỏi mà gần như ticket nào cũng phải hỏi, kèm người trả lời được. Chỉ giữ câu có câu trả lời đổi theo từng ticket; câu nào đã có câu trả lời ổn định thì chuyển câu trả lời sang mục tương ứng và xóa câu hỏi ở đây.

## 5. NFR mặc định và ràng buộc

- Responsive theo 4 breakpoint (mobile, tablet, laptop, wide)
- Chuỗi hiển thị trên landing đi qua dictionary EN / VI

## 6. Phụ thuộc mà code không cho thấy

- Ảnh nằm trên Cloudinary: URL và transform đã phát hành không được đổi tùy tiện
- Dữ liệu prod là nguồn thật của nội dung; seed local chỉ là bản nháp
- Link đã chia sẻ ra ngoài (slug blog, slug project, ảnh OG trên mạng xã hội) phải tiếp tục chạy
- Umami analytics và Railway là dịch vụ bên ngoài, đổi cấu hình là ảnh hưởng chi phí

## 7. Cách làm kỹ thuật

Lệnh và quy ước ở `.context/commands.md`, `.context/testing-guide.md`. Design system: `/ddl` cho landing, Angular Material + `ui-*` cho console.

## 8. Môi trường, release, rollback, monitoring

Local → production trên Railway. Không có SIT / UAT riêng: coi bản build production chạy local là SIT, chính Owner nghiệm thu.

Theo dõi sau release: size M 3 ngày, size L 7 ngày (Umami, log Railway).

## 9. Người liên quan và từ vựng domain

| Ai | Vai trò trong workflow |
| --- | --- |
| Owner | Tất cả các vai |

## 10. Tài liệu nằm ở đâu

`.context/` trong repo: `decisions.md` (ADR), `tasks/`, `plans/`.
