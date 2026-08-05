# Bật giọng đọc từ máy chủ

Từ bản 1.3.0, khi điện thoại không có sẵn giọng cho một ngôn ngữ, ứng dụng hỏi
xuống Apps Script và nhận về file MP3 do Google Cloud Text-to-Speech tạo.

Vì sao cần: máy Huawei không có dịch vụ Google nên chỉ có bộ phát âm của hãng,
thiếu hẳn tiếng Trung, Thái, Đức và khoá luôn phần tải thêm giọng. Nhiều máy giá
rẻ khác cũng chỉ kèm vài thứ tiếng. Trước đây những máy đó im lặng hoàn toàn.

Máy nào có sẵn giọng thì vẫn dùng giọng máy — nhanh hơn, không cần mạng, không
tốn hạn mức. Máy chủ chỉ được gọi khi máy thật sự không đọc được.

---

## Các bước cấu hình

### 1. Tạo dự án Google Cloud và bật API

1. Vào https://console.cloud.google.com/ và tạo một dự án mới, ví dụ `flashcard-tts`.
2. Vào **APIs & Services → Library**, tìm **Cloud Text-to-Speech API**, bấm **Enable**.
3. Google bắt **bật thanh toán** cho dự án thì API mới chạy, kể cả khi bạn chỉ dùng
   trong mức miễn phí. Vào **Billing** và gắn thẻ.

### 2. Tạo khoá API

1. Vào **APIs & Services → Credentials → Create credentials → API key**.
2. Sao chép khoá vừa tạo.
3. Bấm **Edit API key**, phần **API restrictions** chọn **Restrict key** rồi tick
   đúng **Cloud Text-to-Speech API**. Bước này để khoá lỡ lộ cũng không dùng được
   vào việc khác.

### 3. Đặt khoá vào Apps Script

1. Mở dự án Apps Script của FlashCard.
2. Vào **Project Settings** (biểu tượng bánh răng bên trái).
3. Kéo xuống **Script Properties → Add script property**:

   | Property | Value |
   |---|---|
   | `TTS_API_KEY` | khoá vừa sao chép ở bước 2 |

4. Bấm **Save script properties**.

Khoá nằm trên máy chủ Apps Script, không bao giờ gửi xuống điện thoại.

### 4. Dán mã mới và triển khai lại

1. Chép toàn bộ nội dung `apps-script/Code.gs` trong kho mã đè lên `Code.gs`
   trong trình soạn thảo Apps Script.
2. Bấm **Deploy → Manage deployments → Edit (bút chì) → Version: New version →
   Deploy**.

Phải triển khai bản mới thì ứng dụng mới gọi được, chỉ lưu mã thôi là chưa đủ.

### 5. Kiểm tra

Mở đường dẫn sau trên trình duyệt, thay `<URL>` bằng địa chỉ Web App của bạn:

```
<URL>?action=speak&text=%E4%BD%A0%E5%A5%BD&lang=zh-CN
```

Đúng thì trả về JSON có `"ok":true` kèm một chuỗi `audio` rất dài. Nếu thấy
`"Máy chủ chưa tạo được âm thanh."` thì kiểm tra lại theo thứ tự: đã đặt
`TTS_API_KEY` chưa, đã bật API chưa, đã bật thanh toán chưa.

---

## Chi phí

Google Cloud Text-to-Speech miễn phí **4 triệu ký tự mỗi tháng** cho giọng
Standard. Mã trong `Code.gs` cố ý không chỉ định tên giọng để Google tự chọn
giọng Standard, nên nằm trong mức miễn phí.

Ước lượng: mỗi từ khoảng 10 ký tự, tức khoảng **400.000 lượt đọc mỗi tháng** vẫn
miễn phí. Vượt mức thì 4 USD cho mỗi triệu ký tự tiếp theo.

Có hai lớp giảm số lần gọi:

- **Máy chủ**: mỗi từ đã đọc được giữ lại 6 tiếng, ai học lại từ đó không tốn thêm.
- **Ứng dụng**: trong một phiên chơi, mỗi từ chỉ hỏi máy chủ đúng một lần.

Muốn giọng hay hơn thì thêm `name` vào phần `voice` trong `synthesizeSpeech_` để
dùng giọng WaveNet hoặc Neural2, nhưng mức miễn phí khi đó chỉ còn 1 triệu ký tự.

---

## Mã ngôn ngữ

Cloud Text-to-Speech đặt tên khác Android ở vài thứ tiếng, `Code.gs` tự quy đổi:

| Ứng dụng gửi | Cloud TTS nhận |
|---|---|
| `zh-CN`, `zh` | `cmn-CN` |
| `zh-TW` | `cmn-TW` |
| `zh-HK` | `yue-HK` (tiếng Quảng Đông) |
| `ar-SA`, `ar` | `ar-XA` |
| `iw-IL` | `he-IL` |
| `sa-IN` | `hi-IN` (Cloud TTS chưa có tiếng Phạn) |

Thêm ngôn ngữ mới chỉ cần bổ sung vào bảng `TTS_LANGUAGE_ALIASES`.
