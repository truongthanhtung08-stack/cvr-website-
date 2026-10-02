# BÀN GIAO — HỆ THỐNG BÁO CÁO THUẾ (02/10/2026)

> Phiên cloud 02/10/2026 dừng ở đây vì mạng của phiên bị chặn tới cổng thuế (`gdt.gov.vn`) và các
> trang văn bản luật — không đọc được mẫu gốc thì KHÔNG làm tiếp hai việc còn lại (xem mục 3).
> Phiên sau chạy trên máy chủ dự án (mạng đầy đủ) đọc file này + `QUY-TRINH-BAO-CAO-THUE.md` mục 0
> rồi làm tiếp — **không làm lại từ đầu.**

---

## 1. ĐÃ XONG — đang chạy trên coastalland.vn (commit cuối `75829f8`)

| Việc | Ở đâu | Ghi chú |
|---|---|---|
| Sổ khách hàng theo thuế (gom doanh thu theo MST, hóa đơn chưa xuất, CSV) | `/admin/hoa-don-thue` | |
| Tờ khai 01/GTGT có ô **[22]** (khấu trừ kỳ trước) | `/admin/hoa-don-thue` | Nhớ theo từng quý trên máy |
| Mục **Thuế TNCN**: nhập mỗi lần trả lương/hoa hồng → web tự tính khấu trừ | `/admin/hoa-don-thue` → "Thuế TNCN khấu trừ" | Luật 109/2025: 5 bậc 10/30/60/100tr · giảm trừ 15,5tr/6,2tr · CTV 10% từ 5tr/lần (từ 01/7/2026). Lưu trong bảng `bi_mat` có sẵn — **không cần chạy SQL** |
| **Trang in báo cáo** A4 / Lưu PDF | nút "In báo cáo Quý X" và "In báo cáo cả năm" | Quý: 01/GTGT · phụ lục giảm thuế 8% · bảng tính tạm nộp TNDN · 05/KK-TNCN · bảng kê hóa đơn. Năm: tổng hợp GTGT · số liệu quyết toán TNDN (kiểm 80%) · 05/QTT-TNCN + bảng kê 05-1, 05-2 |
| Số liệu tính ở MỘT chỗ | `src/lib/soLieuThue.ts`, `src/lib/thueTncn.ts` | Trang nhập và trang in dùng chung → không lệch |
| Thuế suất **8%** — CHỐT | `src/lib/thue.ts` | Đăng tin = dịch vụ quảng cáo, được giảm theo NQ 204/2025 + NĐ 174/2025 đến 31/12/2026. Công ty KHÔNG môi giới. batdongsan.com.vn cũng 8% |
| Sổ tay quy trình + bảng tiến độ | `QUY-TRINH-BAO-CAO-THUE.md` | Có địa chỉ, địa bàn Thuế cơ sở 4 Đà Nẵng |

Kiểm chứng đã làm: build qua; công thức TNCN khớp công thức rút gọn ở cả 5 bậc; bản in thử bằng dữ liệu
giả ra đúng số. **Chưa ai bấm thử trên admin thật** (phiên cloud không đăng nhập được) — việc đầu tiên
của phiên sau là mở `/admin/hoa-don-thue` xem bằng mắt.

---

## 2. CÁCH DÙNG (cho chủ dự án)

1. `/admin/hoa-don-thue` → chọn Quý/Năm.
2. Nhập: hóa đơn mua vào (tải XML), hóa đơn nước ngoài (tải PDF), ô [22], chi trả TNCN.
3. Bấm **In báo cáo** → **In / Lưu PDF**.
4. Lên cổng thuế, khai trực tuyến: chép số từ bản in **theo TÊN chỉ tiêu** → cắm USB ký → nộp → nộp tiền.

---

## 3. CÒN LẠI — phiên sau làm (cần mạng tới gdt.gov.vn + trang luật)

### A7 — 🔴 GẤP, trước 31/10/2026: cập nhật bản in theo mẫu **Thông tư 89/2026/TT-BTC**
Từ kỳ tháng 7/2026 mọi tờ khai dùng mẫu TT89 (hiệu lực 01/7/2026). Bản in hiện theo TT80 — trang in
đang có băng đỏ cảnh báo việc này. Đã biết (từ tóm tắt tìm kiếm, CHƯA đọc văn bản gốc):
- **01/GTGT:** đổi tên [06] [08] [11a] [23a] [24a] [32a]; **bỏ [11b]**; **thêm [32b], [34a]**; **đổi công thức [27]**.
- **05/KK-TNCN:** thêm chỉ tiêu thu nhập được miễn thuế / số thuế được miễn; bỏ kỳ khai tháng (chỉ còn quý).
- **05/QTT-TNCN:** có mẫu mới TT89 trong HTKK.
- Việc làm: đọc Phụ lục Thông tư 89/2026 (nguồn gốc), sửa `ToKhaiGtgt` và `ToKhai05` trong
  `src/app/admin/hoa-don-thue/in/page.tsx` + `tongHop05` trong `src/lib/thueTncn.ts`, gỡ băng đỏ.

### A6 — Xuất file XML để "Nộp tờ khai XML" trên cổng
Cần cấu trúc XML chính thức (XSD trong bộ cài HTKK, hoặc 1 file XML tờ khai thật của công ty tải từ
cổng: Tra cứu → Tra cứu tờ khai). Có rồi thì thêm nút "Tải XML" cạnh "In báo cáo". **Không đoán cấu trúc.**

### Chờ chủ dự án / kế toán (không phải việc code)
- Ngày hết hạn USB chữ ký số · tài khoản thuế điện tử · đã nộp tờ khai Q1, Q2/2026 chưa + số [43].
- C2: tiền khách nạp ví có phải xuất hóa đơn lúc nạp không — **không tự sửa luồng ví.**
- E1 trước 15/12/2026: Quốc hội có gia hạn 8% sang 2027 không → sửa `THUE_SUAT_GTGT`, `HAN_THUE_SUAT`,
  ký hiệu hóa đơn `1C27TCL`.

---

## 4. BÀI HỌC PHIÊN NÀY (đã ghi vào CLAUDE.md mục 0E)
- Đã đổi thuế suất 8% → 10% → 8% vì một ý sai chưa kiểm ("NĐ 174 loại trừ dịch vụ CNTT" — thật ra là
  NĐ 180/2024 cũ). **Việc thuế/pháp lý: đối chiếu văn bản gốc trước khi sửa code; không mở được → nói rõ, không sửa.**
- Chủ dự án muốn **mọi thứ làm trên admin / trình duyệt** — không bắt chạy SQL, không bắt thao tác ngoài.
