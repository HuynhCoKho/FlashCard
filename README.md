# FlashCard học ngoại ngữ

Trang GitHub Pages dùng Google Sheet làm nguồn từ vựng. Người học chọn sheet, xem nghĩa tiếng Việt, nhập từ ngoại ngữ tương ứng và nhận điểm ngay sau khi bấm Enter.

## Giao diện 3 trang (bản 1.2.0)

Ứng dụng dùng giao diện 3D nổi, chia thành 3 trang:

1. **Trang chọn bộ từ** – nhập tên người chơi và chọn bộ từ. Danh sách bộ từ chính là
   danh sách sheet trong Google Sheet, tự đồng bộ khi bạn thêm hoặc xóa sheet.
   Bấm `BẮT ĐẦU HỌC` để vào màn chơi.
2. **Trang chơi** – hiển thị điểm, số câu đúng/sai, chuỗi đúng và thẻ từ vựng.
   Mỗi khi chuyển sang từ mới, thẻ lật mặt đúng kiểu flashcard. Nút loa đọc lại
   nghĩa tiếng Việt đang hiển thị; đáp án đúng vẫn được đọc tự động như trước.
3. **Trang bảng xếp hạng** – chỉ mở khi bấm `XEM BẢNG XẾP HẠNG` ở trang chơi, gồm
   số người chơi, số lượt chơi và Top 10.

Toàn bộ logic chơi, chấm điểm, cache và đồng bộ Google Sheet giữ nguyên như bản trước.

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

## Ứng dụng Android

Ứng dụng được đóng gói bằng Capacitor với mã gói `vn.huynhcokho.flashcard`,
compile/target Android 16 (API 36), hỗ trợ từ Android 7.0 (API 24).
Giao diện được chứa trực tiếp trong APK; kết nối Google Sheet, cập nhật từ mới và
bảng xếp hạng vẫn cần Internet.

Build APK sau khi đã cài Java 21 và Android SDK:

```text
npm.cmd install
npm.cmd run android:build
npm.cmd run android:bundle
```

Trên Windows có thể chạy một lệnh duy nhất, file kết quả được đặt tên theo phiên
bản và gom vào `dist\`:

```text
scripts\build-android.bat
```

Trên macOS/Linux dùng `npm run android:build:unix` và `npm run android:bundle:unix`.

APK debug được tạo tại `android/app/build/outputs/apk/debug/app-debug.apk`.

Bản phát hành Google Play dùng Android App Bundle tại
`android/app/build/outputs/bundle/release/app-release.aab`. Khóa upload và mật
khẩu phải được lưu riêng, tuyệt đối không commit vào Git. Khi có đủ 4 biến môi
trường `FLASHCARD_STORE_FILE`, `FLASHCARD_STORE_PASSWORD`, `FLASHCARD_KEY_ALIAS`,
`FLASHCARD_KEY_PASSWORD` thì AAB được ký ngay lúc build; nếu thiếu, Gradle vẫn
build ra bản chưa ký thay vì báo lỗi.

### Build tự động bằng GitHub Actions

Workflow `.github/workflows/android-release.yml` build cả APK debug lẫn AAB
release trên máy chủ GitHub (đã có sẵn Android SDK). Chạy tay ở tab **Actions**
hoặc đẩy tag `v1.2.0`; file kết quả nằm ở phần Artifacts và ở GitHub Release.

Để AAB được ký bằng khóa upload của Google Play, thêm 4 secret trong
`Settings > Secrets and variables > Actions`:

| Secret | Nội dung |
| --- | --- |
| `FLASHCARD_STORE_BASE64` | file keystore `.jks` mã hóa base64 |
| `FLASHCARD_STORE_PASSWORD` | mật khẩu keystore |
| `FLASHCARD_KEY_ALIAS` | alias của khóa upload |
| `FLASHCARD_KEY_PASSWORD` | mật khẩu khóa |

Tạo chuỗi base64 từ keystore hiện có:

```text
certutil -encode upload-key.jks upload-key.txt   :: Windows
base64 -w 0 upload-key.jks > upload-key.txt      # macOS/Linux
```

Phải dùng đúng khóa upload đã ký các bản trước, nếu không Play Console sẽ từ chối bản mới.

Tài sản Google Play nằm trong `play-store/`, gồm icon 512×512, feature graphic
1024×500 và nội dung mô tả tiếng Việt. Chính sách quyền riêng tư công khai tại
`privacy.html`.

## Tính năng

- Giao diện 3D nổi, chia 3 trang: chọn bộ từ, màn chơi, bảng xếp hạng.
- Thẻ lật mặt mỗi khi chuyển sang từ mới.
- Nút loa trên thẻ đọc lại nghĩa tiếng Việt đang hiển thị.
- Mỗi bộ từ có biểu tượng riêng, tự sinh theo tên sheet.
- Chọn sheet để chơi.
- Hiện nghĩa tiếng Việt ở flashcard.
- Ghi chú được hiển thị mờ, in nghiêng, trong ngoặc.
- Nhập đáp án và bấm Enter.
- Phần viết tắt ở cuối đáp án là tùy chọn: với `Generative AI (GenAI)`, nhập `Generative AI` vẫn được tính đúng.
- Đúng: cộng điểm và trình duyệt đọc to từ vừa nhập đúng.
- Bản Android dùng Text-to-Speech native để phát âm ổn định qua nhiều câu liên tiếp.
- Khi xoay ngang, panel bộ từ và panel trò chơi cuộn độc lập để không mất nội dung.
- Sai: trừ điểm, thẻ đỏ và rung nhẹ.
- Từ xuất hiện ngẫu nhiên và hạn chế lặp lại quá sớm.
- Bảng xếp hạng 10 người chơi có điểm cao nhất.
- Thống kê số người chơi và lượt chơi.
