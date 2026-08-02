# FlashCard học ngoại ngữ

Trang GitHub Pages dùng Google Sheet làm nguồn từ vựng. Người học chọn sheet, xem nghĩa tiếng Việt, nhập từ ngoại ngữ tương ứng và nhận điểm ngay sau khi bấm Enter.

## Cách hoạt động

- GitHub Pages hiển thị giao diện flashcard.
- Apps Script đọc Google Sheet, tự liệt kê các sheet từ vựng và trả dữ liệu cho trang.
- Sheet `LEADERBOARD` được Apps Script tự tạo để lưu lượt chơi, người chơi và điểm cao nhất.
- Khi bạn thêm sheet mới hoặc thêm/bớt từ trong Google Sheet, bấm nút tải lại trên trang là dữ liệu được cập nhật.
- Giao diện và danh sách sheet được hiện ngay từ cấu hình/cache; dữ liệu mới và thống kê được cập nhật nền.
- Khi người dùng chọn một sheet, yêu cầu tải bộ từ đó được ưu tiên trước thống kê nền.

## Cấu trúc Google Sheet

Mỗi sheet từ vựng là một bộ chơi, ví dụ `English`, `Japanese`, `Korean`.

Hàng đầu tiên là tiêu đề cột. Nên dùng:

| Vietnamese | Foreign | Note | Aliases |
| --- | --- | --- | --- |
| con mèo | cat | danh từ | kitty; tomcat |
| chào buổi sáng | good morning | lời chào | morning |

Bạn cũng có thể dùng tên cột tiếng Việt:

- `Tiếng Việt`, `Nghĩa`, `Vietnamese`, `Meaning`
- `Từ`, `Đáp án`, `Foreign`, `English`, `Japanese`, `Korean`
- `Ghi chú`, `Note`
- `Aliases`, `Đáp án khác`, `Chấp nhận`

Nếu Apps Script không nhận ra tiêu đề, nó dùng cột A làm tiếng Việt và cột B làm đáp án ngoại ngữ.

Các sheet hệ thống như `LEADERBOARD`, `STATS`, `LOG`, `LINKS`, `CONFIG` sẽ không hiện trong danh sách chơi.

## Cấu hình Apps Script

1. Mở file Google Sheet nguồn.
2. Vào `Extensions > Apps Script`.
3. Dán nội dung file `apps-script/Code.gs`.
4. Bấm `Save`.
5. Chạy hàm `setupAuthorization()` một lần để cấp quyền đọc/ghi Google Sheet.
6. Vào `Deploy > Manage deployments > Edit > New version > Deploy`.
7. Web App nên đặt:
   - `Execute as`: `Me`
   - `Who has access`: `Anyone`

Sau khi deploy, dán URL `/exec` vào `config.js`:

```js
APPS_SCRIPT_WEB_APP_URL: 'https://script.google.com/macros/s/.../exec'
```

## Trang GitHub Pages

Repo `HuynhCoKho/FlashCard` có thể bật Pages từ branch chính, thư mục gốc. Trang sẽ chạy tại:

```text
https://huynhcokho.github.io/FlashCard/
```

## Tính năng

- Chọn sheet để chơi.
- Hiện nghĩa tiếng Việt ở flashcard.
- Ghi chú được hiển thị mờ, in nghiêng, trong ngoặc.
- Nhập đáp án và bấm Enter.
- Phần viết tắt ở cuối đáp án là tùy chọn: với `Generative AI (GenAI)`, nhập `Generative AI` vẫn được tính đúng.
- Đúng: cộng điểm và trình duyệt đọc to từ vừa nhập đúng.
- Sai: trừ điểm, thẻ đỏ và rung nhẹ.
- Từ xuất hiện ngẫu nhiên và hạn chế lặp lại quá sớm.
- Bảng xếp hạng 10 người chơi có điểm cao nhất.
- Thống kê số người chơi và lượt chơi.
