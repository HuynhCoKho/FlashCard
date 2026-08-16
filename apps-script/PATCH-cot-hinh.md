# Bản vá Apps Script: đọc cột HÌNH

## Vì sao chỉ vá chứ không dán đè cả tệp

Mã đang chạy trên `script.google.com` mới hơn tệp `Code.gs` trong kho GitHub: nó
có thêm phần đọc giọng (`action=speak`, các hàm `speakPayload_`, `ttsLanguage_`,
`synthesizeSpeech_`, `upstreamMessage_`, `hideApiKey_`, `kiemTraGiongDoc`) và một
`lookupIpa_` dài hơn. Dán đè cả tệp sẽ xoá mất phần đó.

Đã đối chiếu từng hàm giữa bản đang chạy và bản trong kho: bốn hàm dưới đây
**giống hệt nhau từng ký tự**, nên thay riêng bốn hàm này là an toàn tuyệt đối.

## Cách làm

Mở https://script.google.com/home/projects/1EskPy-phNTuy5IAv4ybHb3NYLTQXUnwj26TVuYvxvSmsKAJNKd526uUD/edit
rồi tìm và thay lần lượt bốn hàm: `readWords_`, `readWordBatch_`,
`pickRandomRows_`, `detectColumns_` bằng bản dưới đây. Sau đó **Triển khai →
Quản lý bản triển khai → sửa bản hiện có → Phiên bản: Mới**, giữ nguyên đường dẫn
`/exec` để ứng dụng không phải đổi cấu hình.

Nội dung bốn hàm lấy nguyên văn từ `apps-script/Code.gs` trong kho này (đã cập nhật).

## Thêm cột HÌNH vào Google Sheet

Trong bảng tính FLASHCARD (`1MDt7HLzuhndU30Ln2uW7Ibd9O1M2FRqTtpGw3dRw_wM`), thêm
một cột tiêu đề `HÌNH` vào sheet nào muốn có ảnh riêng. Ô đó nhận:

| Kiểu ghi | Ví dụ |
| --- | --- |
| Emoji gõ thẳng | `🍎` |
| Mã tệp Drive | `1AbCdEfGhIjKlMnOpQrStUvWx` |
| Link chia sẻ Drive | `https://drive.google.com/file/d/1AbC.../view?usp=sharing` |
| Địa chỉ ảnh bất kỳ (bắt buộc https) | `https://vidu.com/tao.png` |

Ảnh trên Drive phải đặt quyền **Bất kỳ ai có đường liên kết → Người xem**, nếu
không ứng dụng sẽ không tải được.

Để trống ô này thì ứng dụng tự dùng bộ hình dựng sẵn trong `pictograms.js`
(hiện phủ trọn 227 từ của sheet Starters).

## Điền cột HÌNH hàng loạt

`DienCotHinh.gs` trong thư mục này điền sẵn cột HÌNH cho mọi sheet từ vựng, tra
theo cột NGHĨA tiếng Việt nên dùng chung được cho cả tiếng Trung, Hàn, Thái,
Đức, Ả Rập...

Cách dùng: mở trình biên tập Apps Script, tạo tệp mới tên `DienCotHinh.gs`, dán
toàn bộ nội dung vào, chọn hàm `dienCotHinh` rồi bấm Chạy. Chạy lại bao nhiêu
lần cũng được — thêm từ mới vào bảng tính rồi chạy lại là xong.

Hai điều script không bao giờ làm:

- **Không đè ô đã có hình.** Hình điền tay giữ nguyên tuyệt đối.
- **Không đụng sheet Starters.** Bộ hình dựng sẵn trong `pictograms.js` vẽ hẳn
  SVG cho màu sắc, số đếm, giới từ và đại từ — emoji không diễn tả nổi, mà cột
  HÌNH lại được ưu tiên hơn nên sẽ lấn át mất.

Độ phủ đo trên 26.251 từ: điền được 8.850 hình (34%). Sheet ngôn ngữ nhập môn
phủ 40–50%, sheet học thuật (SAT, IELTS) thấp hơn nhiều vì phần lớn là từ trừu
tượng — chỗ đó thà để trống còn hơn gán hình sai.
