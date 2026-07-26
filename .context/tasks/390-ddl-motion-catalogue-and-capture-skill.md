# 390 — Hoàn thiện trang `/ddl/motion` + validate skill "video-from-capture"

> Hai deliverable buộc dính nhau: trang catalogue là **consumer** thật của skill, và skill là **pipeline** sinh clip cho trang. Làm trang mà không sửa skill thì clip vẫn mờ; sửa skill mà không có trang thì không có nơi kiểm chất lượng thật. Vì vậy gộp một task.

## Bối cảnh

Session 2026-07-26 đã dựng **scaffold** trang `/ddl/motion` (catalogue hoạt ảnh landing, nhóm theo trigger) và **pilot** một pipeline Playwright video-recording → ffmpeg. Scaffold chạy được, build production xanh, nhưng **clip đang rất tệ — mờ, và vài clip lỗi/không đọc được**. Đây là task để đưa cả hai lên mức ship được.

- Trang: `apps/landing/src/app/pages/ddl/ddl-motion/` (types/data/ts/html/scss), route `/ddl/motion`, registry `status: shipped`.
- Clip hiện có: `apps/landing/public/motion/{mega-menu-mist,mega-menu-pop,de-marquee,arrow-liftoff}.{mp4,webm,poster.png}` — **4 / 12** effect.
- Harness pilot: `…/scratchpad/capture-batch.js` (recipe per-effect + `manifest.json` → ffmpeg encode). Đây là hạt giống skill, **chưa** đóng gói thành skill chính thức.

## Vấn đề đã biết (phải sửa, không chỉ chép lại)

1. **Clip mờ (nghiêm trọng nhất).** Playwright `recordVideo` quay ở **CSS px, không phải retina** — DSF không nhân vào output. Crop một vùng nhỏ rồi hiển thị to trong card → upscale → mờ. Hướng sửa cần thử: quay ở `deviceScaleFactor: 2` + `recordVideo.size` gấp đôi, hoặc quay vùng lớn hơn/đúng tỉ lệ card rồi **không** upscale khi encode; kiểm bằng cách so poster.png với frame gốc.
2. **`de-marquee` loop drift.** Marquee chu kỳ ~42s, cắt `[A,B]` không seamless → clip nháy khi lặp. Cần: hoặc tắt `loop` riêng cho nó, hoặc tìm đúng một chu kỳ nguyên để cắt.
3. **`arrow-liftoff` quá mờ nhạt.** Clip 8K — hiệu ứng nhỏ, gần như không thấy trong card. Cân nhắc zoom sát hơn hoặc bỏ khỏi catalogue nếu không quay ra thứ đọc được.
4. **8 effect còn thiếu clip** (đang render placeholder "clip pending"): `status-dot-radar`, `command-palette`, `show-more`, `lightbox-open`, `spotlight-bloom`, `router-progress`, `stagger-text`, `de-scroll-rise`. Vài cái khó (`de-scroll-rise` cần scroll thật, `router-progress` cần điều hướng, `stagger-text` chạy 1 lần lúc load).

## Việc

### Phần A — Skill "video-from-capture" (làm trước, vì trang phụ thuộc)
- [ ] Chốt nguyên nhân + cách sửa **độ nét** (mục 1). Ra được **1 clip mẫu nét** trước khi nhân bản cách làm.
- [ ] Đóng gói pilot `capture-batch.js` thành **skill chính thức** (skill-creator): input = recipe per-effect (url, trigger interaction, crop/trim), output = `{mp4, webm, poster.png}` chuẩn. Đây là điều user "luôn muốn có" — skill làm video từ screenshot/capture, dùng lại được cho mọi session sau, không chỉ landing motion.
- [ ] Ghi rõ trong skill: recordVideo.size = px output thật (không ×DSF ở toạ độ bbox), cạm bẫy `scrollIntoViewIfNeeded`/`boundingBox` timeout với phần tử animate vô hạn (dùng `evaluate`+`getBoundingClientRect`), `reducedMotion:'no-preference'` để transition chạy, ffmpeg crop cần dim chẵn cho h264.
- [ ] **Không dùng playwright-skill để tự khởi động landing dev-server** — chỉ dùng server user đang chạy, hoặc build. (Rule dự án.)

### Phần B — Hoàn thiện trang `/ddl/motion`
- [ ] Quay lại 4 clip hiện có bằng pipeline đã sửa → nét, đọc được. Xử lý `de-marquee` drift + quyết định số phận `arrow-liftoff`.
- [ ] Quay 8 clip còn thiếu (mục 4) → flip `hasClip: true` trong `ddl-motion.data.ts`.
- [ ] Visual-verify trang trên server 4200 (user tự restart cho route lazy mới): grid 1→2→3 cột theo BP, video autoplay-loop-muted chạy, poster fallback, badge reduce-motion, link "See it live".
- [ ] Kiểm `prefers-reduced-motion`: clip vẫn autoplay hay nên `preload`-poster tĩnh? Quyết định + ghi lại.

## Xong khi
- [ ] Skill video-from-capture tồn tại, có doc, tái tạo được **1 clip nét** từ đầu (không phải chép clip cũ).
- [ ] `/ddl/motion` đủ 12 clip nét (hoặc số effect đã chốt sau khi loại cái không quay được), không còn placeholder ngoài ý muốn.
- [ ] Build production xanh + budget OK; commit qua `/cap` (github-personal, no Co-Authored-By).
- [ ] DDL registry/route khớp; trang là source-of-truth cho motion landing.

## Trạng thái

`in-progress` — scaffold + 4 clip pilot đã có (2026-07-26); nợ lại phần chất lượng clip + đóng gói skill + 8 clip còn thiếu. Là **B2** trong ledger document-engine.
