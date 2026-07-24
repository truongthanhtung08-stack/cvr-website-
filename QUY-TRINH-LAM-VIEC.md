# QUY TRÌNH LÀM VIỆC — COASTAL LAND

> File này là **quy tắc bắt buộc** cho mọi phiên làm việc với Claude Code.
> Mục đích: làm một lần cho xong, không lòng vòng, không mất thời gian và token.

---

## 0. HAI NGUYÊN TẮC SẮT

### Nguyên tắc 1 — ĐÃ DUYỆT LÀ KHÔNG ĐỘNG VÀO

Bất kỳ phần nào chủ dự án **đã xem và duyệt** thì **GIỮ NGUYÊN 100%**, không được:
- tự ý chỉnh lại cho "đẹp hơn"
- tự ý đổi kích thước, màu, bố cục, khoảng cách
- tự ý thêm/bớt hiệu ứng
- "tiện tay" refactor, dọn code, đổi tên

→ **Chỉ thay đổi khi chủ dự án YÊU CẦU RÕ RÀNG bằng lời.**
→ Nếu buộc phải đụng vào phần đã duyệt (vì lý do kỹ thuật) → **DỪNG, HỎI TRƯỚC.**

### Nguyên tắc 2 — MỘT LẦN CHO XONG

Mỗi yêu cầu đi trọn 4 bước bên dưới trong **một lượt**, không chia nhỏ, không hỏi lại giữa chừng
những thứ có thể tự kiểm tra được.

---

## 1. QUY TRÌNH 4 BƯỚC

| Bước | Ai làm | Nội dung |
|---|---|---|
| **1. SỬA** | Claude | Sửa code **thẳng trong** `C:\Users\X1 GEN 8\Projects\cvr-website` |
| **2. KIỂM TRA** | **Claude** | Tự xác minh thay đổi ĐÃ LÊN, rồi báo **đúng link + đúng cổng** |
| **3. DUYỆT** | Chủ dự án | Mở đúng link Claude đưa → trả lời "OK" hoặc "chỉnh [gì]" |
| **4. PUSH** | Claude | Chỉ khi chủ dự án nói **"Push"** → đẩy **TẤT CẢ** thay đổi |

---

## 2. CHI TIẾT TỪNG BƯỚC

### Bước 1 — SỬA

- **Luôn sửa trong thư mục chính:** `C:\Users\X1 GEN 8\Projects\cvr-website`
- **KHÔNG dùng worktree** (`.claude\worktrees\...`) — thư mục đó thiếu `.env.local`,
  dev server của chủ dự án không đọc nó → sửa xong chủ dự án không thấy gì.
- Nếu phiên Claude bị mở trong worktree → **đồng bộ file về thư mục chính ngay**.

### Bước 2 — KIỂM TRA (Claude tự làm, KHÔNG đẩy việc cho chủ dự án)

Claude **bắt buộc** tự xác minh trước khi báo cáo:

1. **Xác định đúng cổng đang chạy thư mục chính.** Kiểm tra bằng:
   ```
   Get-NetTCPConnection -LocalPort <port> | ... Win32_Process → xem CommandLine
   ```
   Chỉ cổng nào chạy từ `Projects\cvr-website` mới đúng.
2. **Đọc HTML server trả về** (`curl`) hoặc **đo DOM thật** để xác nhận thay đổi đã lên.
3. Chỉ khi xác nhận xong mới báo: *"Anh xem ở http://localhost:PORT"*.

> ⚠️ **CHỈ CHẠY MỘT DEV SERVER.** Nhiều server cùng lúc (3000 + 3001) từng làm chủ dự án
> xem nhầm bản cũ, sửa 5 lần vẫn thấy y nguyên. Nếu phát hiện >1 server → báo ngay.

### Bước 3 — DUYỆT

Chủ dự án xem và trả lời ngắn: **"OK"** hoặc **"chỉnh [gì]"**.

### Bước 4 — PUSH (chỉ khi được lệnh "Push")

Chạy trọn gói, không chia nhỏ:

```bash
cd "C:\Users\X1 GEN 8\Projects\cvr-website"
git add -A
git commit -m "<mô tả thay đổi>"
git push origin main
```

Sau push: đợi **1–2 phút** → Vercel tự build → kiểm tra **https://coastalland.vn**

**Trước khi push phải tự kiểm:**
- `git status` sạch, không sót file
- `npx tsc --noEmit` không lỗi (build lỗi = Vercel không deploy được)
- Xác nhận nội dung mới thật sự nằm trong commit

---

## 3. LƯU Ý KỸ THUẬT QUAN TRỌNG

### Nội dung admin đè lên code

Nội dung sửa ở `/admin/noi-dung` lưu trên **Supabase**, và **luôn đè lên giá trị mặc định trong code**.

→ Đổi ảnh/chữ mặc định trong code sẽ **KHÔNG hiện** nếu admin đã lưu giá trị riêng.
→ Muốn đổi thật thì phải sửa trong admin.

### Admin dùng chung một cơ sở dữ liệu

`localhost` và `coastalland.vn` **dùng chung một Supabase**.

→ Sửa nội dung ở đâu cũng đổi cả hai **ngay lập tức**, không cần push.
→ Nên vào admin ở **localhost** (đang chạy code mới nhất) để xem đúng kết quả cuối.

### Ô ảnh trong admin là nút TẢI LÊN

Không gõ được đường dẫn — phải chọn file từ máy.

---

## 4. CÁCH BÁO CÁO

- Ngắn gọn, gạch đầu dòng, **không giải thích dài dòng**.
- Nói rõ **đã làm gì** và **link để xem**.
- Chưa xong hoặc không chắc → **nói thẳng**, không hứa suông.
- Không đoán mò. Kiểm tra được thì phải kiểm tra rồi mới nói.
