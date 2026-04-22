# K-Tour Guide v6

Ứng dụng PWA học cụm từ tiếng Hàn thực chiến cho hướng dẫn viên du lịch tại Đà Nẵng – Hội An – Bà Nà – Chùa Linh Ứng.

## Tính năng chính

- Flashcard 2 mặt (Hàn ↔ Việt) có phát âm thường/chậm.
- Dữ liệu tách theo chủ đề trong `phrases.js`, dễ mở rộng.
- Tìm kiếm nhanh, lọc chủ đề, học ngẫu nhiên.
- Đánh dấu yêu thích, đánh dấu cụm từ khó, theo dõi tiến độ học.
- Lưu trạng thái bằng `localStorage`.
- Hỗ trợ PWA qua `manifest.json` và `service-worker.js`.

## Cấu trúc đề xuất cho audio thật

Khi muốn thay Web Speech API bằng file audio thu sẵn, có thể dùng cấu trúc:

```text
/audio/
  chao-hoi/hello.mp3
  san-bay/passport.mp3
  ...
```

Trong đó `<topic-id>/<phrase-id>.mp3` bám theo `phrases.js`.

## Deploy GitHub Pages

1. Push toàn bộ file lên GitHub.
2. Vào **Settings → Pages**, chọn branch cần publish.
3. Mở URL Pages trên Chrome mobile.
4. Chọn **Add to Home Screen** để cài như app.
