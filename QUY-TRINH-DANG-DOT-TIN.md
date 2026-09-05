# QUY TRÌNH ĐĂNG MỘT ĐỢT TIN — chốt sau buổi hỏng việc 5/9/2026

> Đọc file này trước mỗi lần đăng đợt tin mới. Mọi mục ở đây đều sinh ra từ một lỗi có thật.

---

## 1. LẤY FILE Ở ĐÂU — chỉ một chỗ duy nhất

| | |
|---|---|
| ✅ **ĐÚNG** | `D:\Coastal Land\Đăng tin\TIN HANG NGAY chuẩn\<ngày>\` — bản **chủ dự án đã sửa tay**: đủ số điện thoại khách, nội dung đã biên tập |
| ❌ **SAI** | `C:\Users\…\Projects\TIN-HANG-NGAY\Tin-<ngày>\` — bản **thô cowork giao**: trống hết cột `lien_he_sdt`, mô tả bị cowork viết lại |

Ngày 5/9 lấy nhầm bản thô → 8 tin lên web không có số điện thoại → web tự điền hồ sơ
người đang đăng nhập vào → **tin của khách mang số của chủ sàn**. Không được lặp lại.

---

## 2. BỐN BƯỚC ĐĂNG

**B1. Chuẩn bị file** — mỗi đợt **một file riêng**, chỉ chứa đúng tin của đợt đó
(`Bang-<ngày>-DOT-1.csv`). Đừng để cả 50 tin trong một file rồi định "lấy 33 dòng đầu" —
web đọc cả file, tin đợt sau vẫn nhảy vào bảng.

**B2. Ảnh** — chọn hết các thư mục ảnh của đợt. **Bỏ hết tệp video** (xem mục 3).

**B3. TICK ô "Luôn đăng thành tin mới"** — bắt buộc khi mã tin (`dn01`, `hue01`…) trùng
với đợt ngày khác. Không tick thì web tưởng là tin cũ, **chỉ nhét thêm ảnh vào tin của
người khác** và báo "0 tin mới".

**B4. Đăng** → xong kiểm lại: số tin, số điện thoại, mô tả có xuống dòng, ảnh hiện đủ.

### Đăng lại cả một đợt cho sạch
`/admin/tin-dang` → tick các dòng (tick ô đầu bảng để chọn hết) → thanh đỏ **"Xoá N tin"**
nổi ở đáy màn hình → xoá → làm lại B1–B4. Sau đó vào **Dọn kho ảnh** xoá ảnh thừa.

---

## 3. VIDEO — KHÔNG tải lên web nữa

Kho ảnh gói miễn phí chỉ **1 GB**, mà 55 video đã ăn hết **1 GB** (mỗi video 16–44MB,
bằng cả trăm tấm ảnh). Từ nay:

1. Video tải lên **kênh YouTube của Coastal Land**.
2. Dán **link YouTube** vào cột `video` của file.
3. Web tự hiện: video nằm ngay trong thư viện ảnh của tin, **có khung hình thật** (lấy từ
   YouTube, không tốn dung lượng), trôi qua như một tấm ảnh, **bấm mới phát**, hết phim
   không hiện video của kênh khác.
4. Mỗi tin **tối đa 1 video**. Đã có link thì đừng kèm tệp, và ngược lại.

---

## 4. KHO ẢNH — theo dõi để không tràn

Đo ngày 5/9/2026: **1.762 MB / 1.024 MB (172%)** — video 1.048 MB · ảnh 713 MB (~356 KB/ảnh).

- Kho tràn thì tin mới **tải ảnh lên hỏng giữa chừng** mà không báo gì rõ ràng.
- Mỗi lần đăng lại một đợt là ảnh đợt cũ nằm lại → vào **Admin → Dọn kho ảnh** xoá.

**Tính cho 500 tin:** 500 × 8 ảnh × 356 KB ≈ **1,4 GB** → vượt gói miễn phí.

| Cách | Tiền | Ghi chú |
|---|---|---|
| Dọn rác + bỏ video khỏi kho | 0đ | Đang làm — về ~700 MB, đủ dùng tới khoảng 250 tin |
| Nén ảnh mạnh hơn (1600px, ~200 KB) | 0đ | 500 tin ≈ 800 MB, mắt thường khó thấy khác; cần sửa `uploadImage.ts` |
| **Cloudflare R2** | ~**5.000đ/tháng** cho 5 GB | Rẻ nhất, không tính tiền băng thông; cần code phần tải lên + đọc |
| **Supabase Pro** | **25 $/tháng (~650k)** | 100 GB, không phải đổi gì trong code |

Đề nghị: dọn rác + chuyển video sang YouTube trước (0đ). Khi kho chạm ~800 MB thì mới
quyết R2 hay Supabase Pro.

---

## 5. BA LỖI CỦA WEB ĐÃ VÁ NGÀY 5/9 — để hiểu vì sao có mấy luật trên

1. **Form admin tự điền liên hệ của người đang đăng nhập** vào tin thiếu số → nay chỉ điền
   khi TẠO TIN MỚI.
2. **Ảnh trắng toàn web**: gói Vercel miễn phí hết hạn mức tối ưu ảnh (402) → nay ảnh đi
   qua chính `coastalland.vn/anh/…`, không dùng bộ tối ưu, không phụ thuộc supabase.co.
3. **Sửa tin bằng form làm mất mã ảnh** → lần nhập file sau đăng trùng tin. Nay giữ nguyên.

Yêu cầu dành cho cowork nằm ở [`DE-BAI-CHO-COWORK.md`](DE-BAI-CHO-COWORK.md) — mục **2C**.
