# YÊU CẦU COWORK — THU THẬP SỐ LIỆU LỊCH SỬ GIÁ

> ## ⛔ ĐÂY LÀ VIỆC LÀM MỚI — KHÔNG PHẢI BỔ SUNG
> - **Bỏ toàn bộ** số lịch sử giá đã nộp trước 03/10/2026 và mọi file mẫu cũ — số cũ
>   tính sai (gộp cả tỉnh, chia nhà theo m² đất, không tách vị trí).
> - Làm lại **từ đầu** theo file này, trên **file mẫu mới** (tải 03/10/2026).
> - Khi nộp ở admin → **Lịch sử giá**: bấm **Thay toàn bộ** (không phải Thêm).
> - File này **thay thế** mục GÓI C cũ trong `YEU-CAU-COWORK.md` và mọi yêu cầu lịch sử
>   giá trước đây. Dùng riêng cho dự án thu thập số liệu.
>
> Ngày: 03/10/2026.

> Số của gói này vẽ biểu đồ **Lịch sử giá** trên từng trang tin. Nộp bằng file mẫu
> **`mau-lich-su-gia.csv`** (admin → **Lịch sử giá** → *Tải tệp mẫu*) — **tải bản mới
> 03/10**, bản cũ web không nhận.

## C1. Trang tin cần gì thì mới hiện được Lịch sử giá

Một tin chỉ hiện biểu đồ khi có **một dãy số** khớp **đủ** các điều kiện sau. Thiếu một
điều kiện là **không hiện** — không có chuyện hiện tạm, hiện 2 tháng, hay mượn số nơi khác.

| # | Điều kiện | Ví dụ |
|---|---|---|
| 1 | **Cùng loại hình** (cột `loai_hinh` viết đúng tên ở **C4**) | Nhà riêng ≠ Nhà mặt phố |
| 2 | **Cùng bán / thuê** (`muc_dich` = `ban` / `thue`) | |
| 3 | **Giá mỗi m² chia đúng diện tích của loại hình** (`mau_so`, xem **C3**) | Nhà chia m² sàn, KHÔNG chia m² đất |
| 4 | **Cùng vị trí**, xét theo thứ tự: | |
|   | ① cùng **dự án** (`du_an`) | Căn hộ Sun Cosmo |
|   | ② cùng **tuyến đường** trong phường (`duong` + `khu_vuc` + `vi_tri`) | Nguyễn Văn Thoại, An Hải, mặt tiền đường lớn |
|   | ③ cùng **phường** + cùng **vị trí** (`khu_vuc` + `vi_tri`) | An Hải · kiệt |
|   | ④ cả **tỉnh/thành** — chỉ khi nguồn công bố số cả tỉnh (`khu_vuc` để trống) | Đà Nẵng |
| 5 | **Đủ 13 tháng LIỀN NHAU** tới tháng mới nhất (hổng 1 tháng là cả dãy không hiện) | 2025-09 → 2026-09 |

Web lấy bậc sát nhất có đủ số: có số dự án thì dùng số dự án; không có mới xuống tuyến
đường, rồi phường, rồi tỉnh.

## C2. Mỗi dòng trong file là gì

**Một dòng = một tháng của một dãy.** Một dãy = một bộ *tỉnh + (dự án | đường | phường) +
vị trí + loại hình + bán/thuê*. File mẫu dựng sẵn **259 dãy × 24 tháng (T10/2024 → T9/2026)**,
đã điền sẵn `mau_so` và `vi_tri` — chỉ việc điền cột giá. Muốn thêm dãy dự án / tuyến
đường / cả tỉnh thì **thêm dòng mới** theo đúng cột.

| Cột | Bắt buộc | Ghi gì |
|---|---|---|
| `tinh` | ✅ | Tên tỉnh hệ mới: `Đà Nẵng`, `Huế`… |
| `khu_vuc` | ✅ trừ dãy cả tỉnh / dãy dự án | Phường/xã hệ mới: `An Hải`, `Phường Phú Xuân` |
| `duong` | khi làm dãy tuyến đường | Tên đường, **không số nhà**: `Nguyễn Văn Thoại` |
| `du_an` | khi làm dãy dự án | Tên dự án đúng như trên web |
| `vi_tri` | ✅ với mọi loại hình **trừ căn hộ** (dãy phường, dãy đường) | `lon` (đường ≥ 10 m) · `nho` (5–10 m) · `kiet` (< 5 m) |
| `loai_hinh` | ✅ | Đúng tên ở **C4** |
| `muc_dich` | ✅ | `ban` / `thue` |
| `mau_so` | ✅ | Đúng bảng **C3** — file mẫu đã điền, **đừng sửa** |
| `ky` | ✅ | Tháng: `2026-09` |
| `gia_m2_trieu` | ✅ | Giá phổ biến, **triệu đồng/m²** (`78,5`). Thuê: triệu đồng/m²/tháng |
| `gia_thap_trieu` · `gia_cao_trieu` | nên có | Thấp nhất · cao nhất của tháng (vẽ hai đường biên) |
| `so_mau` | ✅ khi tự tính | Số tin đã dùng để tính |
| `nguon` · `nguon_link` | ✅ | Ai công bố + link tra lại. Dãy cả tỉnh thiếu link → web từ chối |

## C3. Chia cho diện tích gì — KHÔNG ĐƯỢC NHẦM

| `mau_so` | Loại hình | Giá mỗi m² = |
|---|---|---|
| `dat` | Đất nền · đất nông nghiệp · thuê đất / kho xưởng | tổng giá ÷ **m² đất** |
| `san` | **Nhà** riêng · mặt phố · biệt thự · shophouse · nhà phố thương mại | tổng giá ÷ **m² sàn** |
| `san` | Văn phòng · mặt bằng / cửa hàng | giá ÷ **m² sàn cho thuê** (diện tích ghi trên tin) |
| `can` | Căn hộ · condotel · căn hộ dịch vụ | tổng giá ÷ **m² căn** |

**m² sàn của nhà** (giống hệt cách web tính, chủ dự án chốt 19/09):
- tin ghi tổng m² sàn → dùng số đó;
- tin ghi m² sàn nhỏ hơn m² đất → đó là sàn mỗi tầng → nhân số tầng;
- tin không ghi m² sàn, có số tầng → m² đất × số tầng;
- không có cả hai → **bỏ tin đó**.

⛔ **Tuyệt đối không chia tổng giá nhà cho m² đất.**

## C4. Tên loại hình — viết ĐÚNG từng chữ

- **Bán:** `Căn hộ` · `Chung cư` · `Condotel` · `Nhà riêng` · `Nhà mặt phố` ·
  `Nhà biệt thự / Liền kề` · `Shophouse / Nhà phố thương mại` · `Đất nền / Đất nền dự án` ·
  `Đất nông nghiệp`
- **Thuê:** `Căn hộ` · `Chung cư` · `Căn hộ dịch vụ` · `Nhà riêng` · `Nhà mặt phố` ·
  `Nhà phố thương mại` · `Biệt thự / Liền kề` · `Văn phòng` · `Mặt bằng / Cửa hàng bán lẻ` ·
  `Thuê đất / Nhà xưởng / Kho bãi`

## C5. Lấy số ở đâu — từng bước cho MỖI dãy

**Bước 1.** Chọn một dãy trong file. Làm trọn dãy đó (đủ 24 tháng) rồi mới sang dãy khác.
**Ít dãy mà đủ 13 tháng liền nhau còn hơn nhiều dãy mà hổng tháng** — dãy hổng là vô dụng.

**Bước 2 — nguồn công bố.** Trên Batdongsan, mở trang **Lịch sử giá** của đúng phạm vi
(dự án / đường / phường / tỉnh) + đúng loại hình + đúng bán/thuê.
- Phạm vi trên trang **rộng hơn** dãy đang làm (VD trang ghi quận mà dãy là phường) → **không
  dùng**, sang Bước 3.
- Chỉ chép được cho loại hình mà diện tích ghi trên tin **chính là** mẫu số ở **C3**: đất,
  căn hộ, văn phòng, mặt bằng, kho xưởng. **Nhà: KHÔNG chép số Batdongsan** (họ chia theo
  diện tích ghi trên tin, tức m² đất) → sang Bước 3.
- Trang không tách vị trí (`lon`/`nho`/`kiet`) mà dãy cần vị trí → **không dùng**, sang Bước 3.
- Chép: giá phổ biến → `gia_m2_trieu` · thấp nhất → `gia_thap_trieu` · cao nhất →
  `gia_cao_trieu` · `nguon` = `Batdongsan` · `nguon_link` = link trang.

**Bước 3 — tự tính từ tin rao** (khi Bước 2 không dùng được):
1. Gom tin đang đăng **đúng phạm vi + đúng loại hình + đúng bán/thuê + đúng vị trí** (bề
   rộng đường vào ghi trên tin: ≥ 10 m → `lon`, 5–10 m → `nho`, < 5 m → `kiet`).
2. Mỗi tin: giá ÷ diện tích theo **C3**.
3. **Đủ từ 5 tin trở lên** mới điền: `gia_m2_trieu` = số ở giữa (trung vị) ·
   `gia_thap_trieu` = nhỏ nhất · `gia_cao_trieu` = lớn nhất · `so_mau` = số tin.
   Link từng tin ghi vào `bao-cao.txt`. Dưới 5 tin → **để trống**.
4. Cách này chỉ ra được **tháng hiện tại**. Tháng cũ không có tin để tính → để trống.

**Bước 4 — không có số thì để trống.** Cấm nội suy, cấm lấy trung bình hai tháng bên cạnh,
cấm lấy số phường khác / loại hình khác / cả tỉnh điền vào. Ô trống web tự bỏ qua.

**Bước 5 — ghi `bao-cao.txt`:** dãy nào làm đủ 13 tháng liền · dãy nào bỏ và vì sao.

## C6. Sau khi nộp

Web tự kiểm và **từ chối** dòng: thiếu loại hình · sai `mau_so` · nhà/đất thiếu `vi_tri` ·
có `duong` mà thiếu `khu_vuc` · dãy cả tỉnh thiếu `nguon_link`. Đọc bảng lỗi, sửa, nộp lại.
Từ tháng 10/2026 web tự tính tiếp hằng tháng từ tin trên coastalland.vn.

---

