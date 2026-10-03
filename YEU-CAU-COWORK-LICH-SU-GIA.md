# YÊU CẦU COWORK — THU THẬP SỐ LIỆU LỊCH SỬ GIÁ

> ## ⛔ VỀ LỊCH SỬ GIÁ: CHỈ LÀM THEO ĐÚNG TỆP NÀY
> Mọi tệp, ghi chú, trí nhớ (memory) cũ về lịch sử giá — kể cả trong thư mục `claude`,
> `THU-GIAO-VIEC-LICH-SU-GIA`, `mau-lich-su-gia` — **đã bỏ**. Chỗ nào khác tệp này thì
> **theo tệp này**.
>
> ## ⛔ ĐÂY LÀ VIỆC LÀM MỚI — KHÔNG PHẢI BỔ SUNG
> - **Bỏ toàn bộ** số lịch sử giá đã nộp trước 03/10/2026 và mọi file mẫu cũ — số cũ
>   tính sai (gộp cả tỉnh, chia giá nhà cho m² đất).
> - Làm lại **từ đầu** theo file này.
> - Lần nộp ĐẦU TIÊN: nộp tại `https://coastalland.vn/nop-so-lieu?lam-moi=1` (thay toàn bộ
>   số cũ). Các lần sau: `https://coastalland.vn/nop-so-lieu` (bổ sung). Xem mục **0**.
> - File này **thay thế** mục GÓI C cũ và mọi yêu cầu lịch sử giá trước đây.
>
> Ngày: 03/10/2026.

## 0. TỰ ĐỘNG — Cowork tự lấy, tự nộp (mã nộp do chủ dự án cấp)

1. **Lấy danh sách cần điền** (kể cả lần đầu): mở
   `https://coastalland.vn/api/chi-so-gia/con-thieu?ma=<MÃ NỘP>` → tải về tệp CSV.
   Tệp này dựng từ CHÍNH TIN ĐANG ĐĂNG trên web — chỉ gồm những dãy tin trên web cần.
2. **Điền THEO THỨ TỰ TỪ TRÊN XUỐNG.** Cột `so_tin_tren_web` = số tin đang chờ dãy đó;
   dãy nhiều tin nằm trên cùng. **Làm trọn từng dãy (đủ 5 quý liền) rồi NỘP NGAY**, không
   đợi làm hết file — nộp sớm dãy nào là tin của dãy đó hiện lịch sử giá ngay.
   Cách điền: mục 2 → 5 bên dưới. Cowork chỉ CHÉP số công bố — không tự chia giá. File `mau-lich-su-gia.csv` chỉ để tham khảo khuôn.
3. **Nộp:** mở `https://coastalland.vn/nop-so-lieu` → nhập mã nộp → chọn tệp → Nộp.
   **Lần nộp ĐẦU TIÊN của đợt làm mới:** mở `https://coastalland.vn/nop-so-lieu?lam-moi=1`
   (bỏ hết số cũ, chỉ giữ tệp này). Các lần sau: không có `?lam-moi=1`.
4. Web tự kiểm, số hợp lệ lên web ngay. Dòng bị từ chối → sửa theo bảng lỗi, nộp lại.
5. **Mỗi quý** làm lại từ bước 1.

## 1. Cowork nhận gì, làm gì

**Web tự tính số từ tin đăng trên coastalland.vn, theo QUÝ** (như Batdongsan). Cowork
chỉ điền **phần web còn thiếu** — chủ yếu là các quý TRƯỚC khi web có tin.

Danh sách cần điền lấy ở mục **0** bước 1 (chủ dự án cũng tải được ở admin → **Lịch sử
giá** → **Tải danh sách còn thiếu**). File là **đúng các dòng cần điền**: mỗi dòng = một QUÝ của một dãy mà tin
đang đăng trên web cần nhưng chưa có số. Cột `tinh`, `khu_vuc`, `du_an`, `loai_hinh`,
`muc_dich`, `ky`, `mau_so` **đã điền sẵn — không sửa**. Cowork chỉ điền giá + nguồn.

## 2. Trang tin cần gì thì mới hiện Lịch sử giá

Một tin chỉ hiện biểu đồ khi có **một dãy số** khớp **đủ** các điều kiện sau. Thiếu một
điều kiện là **không hiện** — không hiện tạm, không hiện 2 tháng, không mượn số nơi khác.

| # | Điều kiện |
|---|---|
| 1 | **Cùng phân khúc** = cùng loại hình + cùng bán/thuê |
| 2 | **Bán:** giá mỗi m² theo đúng cách web tính (mục **4**). **Thuê:** tổng tiền thuê mỗi tháng |
| 3 | **Cùng vị trí**, xét theo thứ tự: ① cùng **dự án** → ② cùng **tuyến đường** → ③ cùng **phường/xã** → ④ cả **tỉnh/thành** (chỉ khi nguồn công bố số cả tỉnh) |
| 4 | **Đủ 5 QUÝ LIỀN NHAU** tới quý mới nhất (VD Q2/25 → Q2/26) — hổng 1 quý là cả dãy không hiện |

Web lấy bậc sát nhất có đủ số. **Ít dãy mà đủ 5 quý liền còn hơn nhiều dãy hổng quý.**

## 3. Các cột

| Cột | Ghi gì |
|---|---|
| `tinh` · `khu_vuc` · `du_an` · `loai_hinh` · `muc_dich` · `ky` · `mau_so` | **Đã điền sẵn — không sửa** (thuê: `mau_so` để trống) |
| `ky` | Quý: `2026-Q2` (đã điền sẵn) |
| `gia_m2_trieu` | Giá phổ biến. **Bán:** triệu đồng/m² (`78,5`). **Thuê:** TỔNG triệu đồng/tháng (`58`) |
| `gia_thap_trieu` · `gia_cao_trieu` | Thấp nhất · cao nhất của quý |
| `so_mau` | Số tin — chép nếu trang nguồn có ghi, không thì để trống |
| `nguon` · `nguon_link` | Ai công bố + link tra lại. **Bắt buộc.** |
| `vi_tri` | **Để trống** |
| `so_tin_tren_web` | Chỉ để xếp thứ tự ưu tiên — không sửa, web bỏ qua khi nộp |
| `duong` | Chỉ khi làm thêm dãy theo tuyến đường (thêm dòng mới, ghi kèm `khu_vuc`) |

Muốn nộp thêm dãy **cả tỉnh**: thêm dòng, `khu_vuc` để trống, **bắt buộc `nguon_link`**
tới nơi công bố số cả tỉnh. Không có nguồn công bố → không làm, không tự gộp các phường.

## 4. Cowork KHÔNG tự chia giá

**Việc chia giá là của web**: web tự tính từ giá + diện tích khách đăng trên coastalland.vn.
Cowork chỉ **chép số đã công bố** (Batdongsan). Không tự lấy giá chia diện tích, không tự
tính trung vị.

Số chép về phải **cùng cách tính với web** thì mới dùng được:

| Phân khúc | Web tính | Số Batdongsan chép được? |
|---|---|---|
| Bán đất (đất nền, nông nghiệp, kho xưởng) | giá ÷ m² đất | ✅ |
| Bán căn hộ / chung cư / condotel | giá ÷ m² căn | ✅ |
| **Bán nhà** (riêng, mặt phố, biệt thự, shophouse) | giá ÷ **m² sàn** | ⛔ **KHÔNG** — Batdongsan chia theo diện tích ghi trên tin (m² đất), khác cách web tính |
| **Cho thuê** mọi loại hình | tổng tiền/tháng | ✅ |

## 5. Lấy số — từng bước cho MỖI dãy

**Bước 1.** Lấy một dãy trong file (cùng `tinh` + `khu_vuc`/`du_an` + `loai_hinh` +
`muc_dich`). Làm trọn các quý của dãy đó rồi mới sang dãy khác.

**Bước 2.** Trên Batdongsan, mở trang **Lịch sử giá** của **đúng** dự án / phường + đúng
loại hình + đúng bán/thuê.
- Trang ghi phạm vi **rộng hơn** (quận, thành phố thay vì phường) → **không dùng**.
- Phân khúc ⛔ ở mục **4** → **không dùng**.
- Chép đúng từng quý (Q2/26 → `2026-Q2`): giá phổ biến → `gia_m2_trieu` · thấp nhất →
  `gia_thap_trieu` · cao nhất → `gia_cao_trieu` · số tin (nếu trang ghi) → `so_mau` ·
  `nguon` = `Batdongsan` · `nguon_link` = link trang.

**Bước 3 — không có số thì để trống.** Cấm nội suy, cấm lấy trung bình hai quý bên
cạnh, cấm lấy số phường khác / loại hình khác / cả tỉnh điền vào, cấm tự chia giá.
Dãy để trống thì web tự lấp dần bằng số tự tính từ tin đăng.

**Bước 4 — `bao-cao.txt`:** dãy nào đủ 5 quý liền · dãy nào bỏ và vì sao.

## 6. Sau khi nộp

Web tự kiểm và **từ chối** dòng: thiếu loại hình · bán sai `mau_so` · thuê có `mau_so` ·
có `vi_tri` · có `duong` mà thiếu `khu_vuc` · dãy cả tỉnh thiếu `nguon_link`. Đọc bảng
lỗi, sửa, nộp lại. Mỗi quý chủ dự án tải lại **danh sách còn thiếu** — chỉ còn những gì
web chưa tự có.
