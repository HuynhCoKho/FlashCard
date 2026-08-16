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

- **Không đè ô đã có nội dung.** Chỉ ô trống mới được điền.
- **Không đụng sheet Starters.** Bộ hình dựng sẵn trong `pictograms.js` vẽ hẳn
  SVG cho màu sắc, số đếm, giới từ và đại từ — emoji không diễn tả nổi, mà cột
  HÌNH lại được ưu tiên hơn nên sẽ lấn át mất.

### Điền tay rồi chạy lại có mất không

Không. Ô đang có nội dung được giữ nguyên si, kể cả những kiểu nhìn qua tưởng ô
trống:

| Kiểu ô | Chạy lại thì sao |
| --- | --- |
| Emoji tự chọn khác bộ mặc định | giữ nguyên |
| Chữ có khoảng trắng thừa hai bên | giữ nguyên từng ký tự, không chuẩn hoá |
| Link Drive tự dán | giữ nguyên |
| Công thức `=IMAGE("...")` | giữ nguyên công thức |
| Ảnh chèn thẳng vào ô (Chèn › Hình ảnh trong ô) | không ghi vào dòng đó |

Hai dòng cuối là chỗ dễ mất nhất: cả hai đều trả về chuỗi rỗng khi đọc bằng
`getDisplayValues()`, nhìn qua y hệt ô trống. Script phải đọc thêm
`getFormulas()` và `getValues()` mới phân biệt được, và ghi theo từng đoạn liền
mạch để nhảy qua những dòng đang giữ ảnh trong ô.

Độ phủ đo trên 26.251 từ: điền được **11.031 hình (42%)** từ 1.103 khái niệm.
Sheet ngôn ngữ và chuyên ngành phủ 40–57%, riêng SAT và IELTS thấp hơn nhiều vì
phần lớn là từ trừu tượng — chỗ đó thà để trống còn hơn gán hình sai.

## Soát cột HÌNH trước khi tin nó

Hàm `kiemTraCotHinh` trong cùng tệp quét toàn bộ cột HÌNH và chỉ ra những ô
**ứng dụng sẽ không hiện được**. Chạy nó mỗi khi vừa dán link ảnh hàng loạt.

Cần có, vì khi ảnh hỏng thì ứng dụng lặng lẽ giấu khung đi chứ không báo gì:
nhìn bảng tính thấy ô có nội dung, mở app lại chẳng thấy hình, không lần ra
được nguyên nhân. Các lỗi hàm này bắt:

| Ô ghi | Vì sao hỏng |
| --- | --- |
| `http://...` | bản Android chạy trên scheme https, ảnh http bị chặn |
| link thư mục Drive `/drive/folders/...` | phải là link từng tệp |
| link Drive không rút được mã tệp | sai định dạng |
| tệp Drive chưa mở công khai | máy người học không tải được |
| tệp Drive đã xoá hoặc sai mã | không mở được |
| chuỗi dài hơn 12 ký tự mà không phải link | ứng dụng bỏ qua, không coi là emoji |

Luật kiểm tra chép đúng theo hàm `imageSource` trong `script.js`, nên cái gì
hàm này bảo đạt thì ứng dụng hiện được.
