# FlashCard – Giới thiệu và hướng dẫn chơi

Tác giả: Huỳnh Cỏ Khô · Phiên bản 1.2.0

---

## 1. FlashCard là gì

FlashCard là ứng dụng học từ vựng bằng thẻ nhanh. Mỗi lượt, ứng dụng đưa ra
nghĩa tiếng Việt của một từ, việc của bạn là gõ lại từ đó bằng ngoại ngữ. Trả
lời đúng được cộng điểm, sai bị trừ, điểm được gửi lên bảng xếp hạng chung để
so với những người học khác.

Điểm khác biệt so với các app từ vựng thông thường:

- **Bộ từ lấy trực tiếp từ Google Sheets.** Người quản lý thêm một sheet mới là
  ứng dụng tự hiện thêm bộ từ, không cần cập nhật app.
- **Học được nhiều ngôn ngữ trong cùng một app**: tiếng Anh, Trung, Hàn, Nhật,
  Đức, Thái, Tây Ban Nha, Bồ Đào Nha, Ả Rập, Hebrew, Hindi, Sanskrit…
- **Gõ đáp án chứ không chọn đáp án.** Bạn phải nhớ ra mặt chữ, không đoán mò
  được như trắc nghiệm.
- **Có bảng xếp hạng chung**, tạo động lực quay lại mỗi ngày.

Ứng dụng cần kết nối Internet để tải bộ từ và đồng bộ điểm.

---

## 2. Bắt đầu trong 30 giây

1. **Nhập tên** vào ô "Người chơi". Tên này sẽ hiện trên bảng xếp hạng và được
   nhớ lại cho những lần mở sau, không cần gõ lại.
2. **Chạm vào một bộ từ** trong lưới bên dưới. Bộ đang chọn sẽ đổi sang màu xanh
   đậm. Con số bên phải là số từ có trong bộ đó.
3. **Bấm "BẮT ĐẦU HỌC".**

Nếu danh sách bộ từ chưa hiện hoặc bạn vừa được báo là có bộ từ mới, bấm nút **↻**
ở góc phải mục "Chọn bộ từ" để tải lại.

---

## 3. Ba màn hình của ứng dụng

### Trang 1 – Chọn bộ từ

Nơi nhập tên và chọn bộ từ muốn học. Mỗi bộ có một biểu tượng riêng để dễ nhận
ra: ⭐ Starters, 🚀 Movers, ✈️ Flyers, 🎓 SAT, 📖 IELTS, 🏛️ Bank, 🤖 AI…

Nút **✕** ở góc trên bên trái để thoát ứng dụng.

### Trang 2 – Màn chơi

Đây là nơi bạn ở lâu nhất. Từ trên xuống:

| Khu vực | Ý nghĩa |
|---|---|
| Tên bộ từ | Bộ từ đang học |
| **Điểm** | Tổng điểm của lượt chơi hiện tại |
| **XEM BẢNG XẾP HẠNG** | Mở trang 3 |
| ✓ *n* đúng | Số câu trả lời đúng |
| ✕ *n* sai | Số câu trả lời sai |
| 🔥 Chuỗi *n* | Số câu đúng liên tiếp, sai một câu là về 0 |
| Thẻ từ | Nghĩa tiếng Việt, phiên âm, ghi chú |
| Ô nhập | Gõ từ ngoại ngữ tương ứng |
| **Enter** | Nộp đáp án |

Trên thẻ từ, ngoài nghĩa tiếng Việt in đậm còn có thể có:

- **Phiên âm** trong hai dấu gạch chéo, ví dụ `/saʊnd/`.
- **Ghi chú** trong ngoặc đơn, ví dụ *(Nhiều nghĩa)* nghĩa là từ tiếng Việt này
  ứng với nhiều từ ngoại ngữ khác nhau, hoặc *(To hơn say/talk)* để gợi ý sắc
  thái, giúp bạn chọn đúng từ cần gõ.

Thẻ có hai mặt và **lật sang mặt kia mỗi khi chuyển sang từ mới**, đúng cảm giác
lật một xấp thẻ giấy.

### Trang 3 – Bảng xếp hạng

Hiện tổng số người chơi, tổng số lượt chơi và **Top 10** điểm cao nhất. Ba hạng
đầu có huy chương vàng, bạc, đồng. Mỗi lần mở trang này, số liệu được làm mới.

Bấm **←** để quay lại màn chơi.

---

## 4. Luật tính điểm

| Tình huống | Điểm | Chuỗi | Chuyện gì xảy ra |
|---|---|---|---|
| Trả lời **đúng** | **+10** | +1 | Ứng dụng đọc to đáp án, sau khoảng nửa giây tự sang từ mới |
| Trả lời **sai** | **−4** | về **0** | Thẻ rung, hiện đáp án đúng, **vẫn ở lại từ đó** |

Ba điều cần nhớ:

- **Sai thì không bị bỏ qua từ đó.** Ứng dụng hiện đáp án đúng ngay và bạn phải
  gõ đúng thì mới sang từ mới. Đây là cách app bắt bạn nhớ mặt chữ chứ không cho
  trôi qua.
- **Điểm có thể âm.** Đoán bừa liên tục sẽ kéo điểm xuống dưới 0.
- **Chuỗi đúng là thứ đáng giữ nhất.** Nó không cộng thêm điểm, nhưng là thước đo
  trung thực nhất cho biết bạn thật sự thuộc bài hay đang may mắn.

Điểm được gửi lên bảng xếp hạng tự động trong lúc chơi, và chỉ gửi khi vượt mức
cao nhất bạn đã đạt trong lượt đó — nên điểm trên bảng xếp hạng không bị tụt vì
vài câu sai cuối lượt.

Lượt chơi không có điểm dừng. Từ được lấy ngẫu nhiên và ứng dụng tránh lặp lại
những từ vừa ra, đồng thời tải thêm từ ở chế độ nền nên bạn học được bao lâu
tùy ý.

---

## 5. Ứng dụng chấm đáp án dễ tính hơn bạn tưởng

Bạn không cần gõ chính xác từng ký tự. Trước khi so sánh, cả đáp án của bạn lẫn
đáp án đúng đều được đưa về một dạng chuẩn, nên những khác biệt sau **không bị
tính là sai**:

- **Viết hoa hay viết thường**: `Sound`, `sound`, `SOUND` đều đúng.
- **Dấu tiếng Việt**: gõ `dep` vẫn khớp với `đẹp`. Chữ **đ** và **d** được coi
  như nhau.
- **Dấu câu, dấu nháy, gạch nối**: `dont`, `don't`, `don’t` đều được chấp nhận.
- **Khoảng trắng thừa** ở đầu, cuối hoặc giữa các từ.
- **Phần viết tắt trong ngoặc**: nếu đáp án là `Ho Chi Minh City (HCMC)`, bạn gõ
  `Ho Chi Minh City` là đủ.
- **Nhiều đáp án cùng đúng**: một từ có thể được khai báo sẵn nhiều cách dịch,
  gõ trúng cách nào cũng được tính đúng.

Nói cách khác: app chấm **bạn có nhớ từ đó không**, chứ không bắt bẻ chính tả
dấu má.

---

## 6. Phát âm

Khi bạn trả lời đúng, ứng dụng **đọc to đáp án** bằng giọng đọc có sẵn trên
điện thoại, để bạn nghe và nhớ luôn cách phát âm.

Ứng dụng tự đoán ngôn ngữ cần đọc dựa trên tên bộ từ và mặt chữ của đáp án, nên
bộ 日本語 sẽ được đọc bằng giọng Nhật chứ không phải giọng Trung, dù cùng dùng
chữ Hán.

Nếu máy bạn chưa cài giọng đọc của ngôn ngữ đó, ứng dụng sẽ báo một lần thay vì
im lặng khó hiểu. Cách khắc phục trên Android:

> **Cài đặt → Hệ thống → Ngôn ngữ và phương thức nhập → Đầu ra chuyển văn bản
> thành lời nói → Cài đặt bên cạnh Google Text-to-Speech → Cài đặt dữ liệu giọng
> nói**, rồi tải ngôn ngữ bạn cần.

---

## 7. Mẹo học hiệu quả

1. **Học ngắn, học đều.** 10 phút mỗi ngày ăn đứt 2 tiếng mỗi tuần. Từ được lấy
   ngẫu nhiên nên mỗi lần mở là một tổ hợp khác.
2. **Đọc kỹ ghi chú trong ngoặc trước khi gõ.** Với những nghĩa có nhiều từ ứng
   với nó, ghi chú chính là thứ cho biết app đang chờ từ nào.
3. **Đừng đoán bừa để mong trôi từ.** Sai vừa mất 4 điểm vừa mất chuỗi mà vẫn
   phải gõ đúng từ đó, hoàn toàn không lợi gì.
4. **Đọc theo mỗi khi app phát âm.** Nghe và nhại lại giúp nhớ lâu hơn nhiều so
   với chỉ nhìn.
5. **Bắt đầu từ bộ vừa sức.** Starters → Movers → Flyers rồi mới tới SAT, IELTS.
   Vào thẳng bộ khó chỉ tổ nản.
6. **Lấy chuỗi đúng làm mục tiêu, đừng lấy điểm.** Đặt mục tiêu phá kỷ lục chuỗi
   của chính mình, điểm sẽ tự lên theo.

---

## 8. Câu hỏi thường gặp

**Không có mạng thì chơi được không?**
Không. Ứng dụng cần Internet để tải bộ từ và gửi điểm.

**Tên của tôi có bị lộ không?**
Tên bạn nhập chỉ dùng để hiện trên bảng xếp hạng. Ứng dụng không thu thập thông
tin cá nhân nào khác. Chi tiết xem Chính sách quyền riêng tư ở cuối trang chủ.

**Tôi muốn đổi tên hiển thị?**
Quay về trang chủ, sửa lại ô "Người chơi". Điểm mới sẽ được ghi cho tên mới.

**Sao bộ từ mới chưa thấy?**
Bấm nút **↻** ở mục "Chọn bộ từ" để tải lại danh sách.

**Điểm tôi vừa được sao chưa lên bảng xếp hạng?**
Bảng xếp hạng chỉ làm mới khi bạn mở trang đó. Thoát ra vào lại là thấy.

**Có giới hạn số lần chơi không?**
Không. Chơi bao lâu, bao nhiêu lượt tùy bạn.

---

## 9. Lệnh đưa cho NotebookLM để tạo video

Cách làm trong NotebookLM:

1. Tạo notebook mới, bấm **Add source** rồi tải file `huong-dan-su-dung.md` này
   lên. Thêm luôn 4 ảnh trong `play-store/screenshots/` làm nguồn hình ảnh.
2. Ở cột Studio bên phải, chọn **Video Overview**.
3. Bấm **Customize** và dán đoạn dưới đây vào ô prompt.

### Prompt cho video giới thiệu (khoảng 2–3 phút)

```
Tạo video giới thiệu ứng dụng học từ vựng FlashCard cho người dùng Việt Nam,
chủ yếu là học sinh cấp 2, cấp 3 và người đi làm đang tự học ngoại ngữ.

Giọng kể: tiếng Việt, thân thiện, gãy gọn, như một người bạn chỉ cho bạn mình
dùng app, không dùng giọng quảng cáo cường điệu.

Bố cục mong muốn:
1. Mở đầu: vấn đề quen thuộc — học từ vựng mãi không nhớ, app trắc nghiệm thì
   đoán mò được nên học xong vẫn không viết ra được.
2. FlashCard giải quyết thế nào: bắt gõ đáp án bằng tay, sai thì phải gõ đúng
   mới đi tiếp.
3. Hướng dẫn dùng theo đúng 3 bước: nhập tên, chọn bộ từ, bấm Bắt đầu học.
4. Giải thích màn chơi: điểm, số câu đúng/sai, chuỗi đúng, thẻ từ có phiên âm
   và ghi chú.
5. Luật tính điểm: đúng +10, sai −4, sai thì mất chuỗi và vẫn phải gõ lại
   cho đúng.
6. Nhấn mạnh phần chấm đáp án dễ tính: không phân biệt hoa thường, không cần
   dấu tiếng Việt, bỏ qua dấu câu.
7. Bảng xếp hạng Top 10 và động lực thi đua.
8. Kết: gợi ý học 10 phút mỗi ngày, bắt đầu từ bộ Starters.

Yêu cầu bắt buộc:
- Chỉ dùng thông tin có trong tài liệu nguồn, không tự bịa thêm tính năng.
- Dùng đúng các ảnh chụp màn hình được cung cấp khi nói về từng trang.
- Nêu rõ ứng dụng cần kết nối Internet.
- Không hứa hẹn kiểu "thuộc 1000 từ trong 1 tuần".
- Độ dài khoảng 2 đến 3 phút.
```

### Prompt cho video hướng dẫn ngắn (khoảng 60 giây)

```
Tạo video hướng dẫn nhanh 60 giây bằng tiếng Việt, chỉ tập trung vào thao tác:
nhập tên, chọn bộ từ, bấm Bắt đầu học, gõ đáp án, bấm Enter, xem bảng xếp hạng.
Mỗi bước một câu ngắn, đi kèm ảnh chụp màn hình tương ứng. Không giới thiệu dài
dòng, vào thẳng thao tác. Kết thúc bằng luật điểm: đúng +10, sai −4.
```
