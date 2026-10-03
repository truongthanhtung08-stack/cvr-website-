# YÊU CẦU COWORK — THU THẬP SỐ LIỆU LỊCH SỬ GIÁ

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

1. **Lấy danh sách cần điền:** mở
   `https://coastalland.vn/api/chi-so-gia/con-thieu?ma=<MÃ NỘP>` → tải về tệp CSV.
   (Đợt làm mới đầu tiên: dùng file `mau-lich-su-gia.csv` gửi kèm.)
2. **Điền** theo mục 2 → 5 bên dưới.
3. **Nộp:** mở `https://coastalland.vn/nop-so-lieu` → nhập mã nộp → chọn tệp → Nộp.
   **Lần nộp ĐẦU TIÊN của đợt làm mới:** mở `https://coastalland.vn/nop-so-lieu?lam-moi=1`
   (bỏ hết số cũ, chỉ giữ tệp này). Các lần sau: không có `?lam-moi=1`.
4. Web tự kiểm, số hợp lệ lên web ngay. Dòng bị từ chối → sửa theo bảng lỗi, nộp lại.
5. **Mỗi quý** làm lại từ bước 1.

## 1. Cowork nhận gì, làm gì

**Web tự tính số từ tin đăng trên coastalland.vn, theo QUÝ** (như Batdongsan). Cowork
chỉ điền **phần web còn thiếu** — chủ yếu là các quý TRƯỚC khi web có tin.

**Lần đầu (đợt làm mới này):** điền vào file **`mau-lich-su-gia.csv`** gửi kèm — 97 dãy
theo phường × 8 quý (Q4/2024 → Q3/2026).

**Các lần sau:** chủ dự án vào admin → **Lịch sử giá** → bấm **Tải danh sách còn thiếu
(gửi Cowork)**. File tải về là **đúng các dòng cần điền**: mỗi dòng = một QUÝ của một dãy mà tin
đang đăng trên web cần nhưng chưa có số. Cột `tinh`, `khu_vuc`, `du_an`, `loai_hinh`,
`muc_dich`, `ky`, `mau_so` **đã điền sẵn — không sửa**. Cowork chỉ điền giá + nguồn.

## 2. Trang tin cần gì thì mới hiện Lịch sử giá

Một tin chỉ hiện biểu đồ khi có **một dãy số** khớp **đủ** các điều kiện sau. Thiếu một
điều kiện là **không hiện** — không hiện tạm, không hiện 2 tháng, không mượn số nơi khác.

| # | Điều kiện |
|---|---|
| 1 | **Cùng phân khúc** = cùng loại hình + cùng bán/thuê |
| 2 | **Bán:** giá mỗi m² chia đúng diện tích của loại hình (mục **4**). **Thuê:** tổng tiền thuê mỗi tháng |
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
| `so_mau` | Số tin đã dùng để tính (khi tự tính, mục **5** bước 3) |
| `nguon` · `nguon_link` | Ai công bố + link tra lại. **Bắt buộc.** |
| `vi_tri` | **Để trống** |
| `duong` | Chỉ khi làm thêm dãy theo tuyến đường (thêm dòng mới, ghi kèm `khu_vuc`) |

Muốn nộp thêm dãy **cả tỉnh**: thêm dòng, `khu_vuc` để trống, **bắt buộc `nguon_link`**
tới nơi công bố số cả tỉnh. Không có nguồn công bố → không làm, không tự gộp các phường.

## 4. BÁN: chia cho diện tích gì — KHÔNG ĐƯỢC NHẦM

> **CHO THUÊ không chia diện tích:** ghi tổng tiền thuê mỗi tháng, như Batdongsan
> ("58 tr/tháng"). `mau_so` để trống.

| `mau_so` | Loại hình | Giá mỗi m² = |
|---|---|---|
| `dat` | Đất nền · đất nông nghiệp · thuê đất / kho xưởng | tổng giá ÷ **m² đất** |
| `san` | **Nhà** riêng · mặt phố · biệt thự · shophouse · nhà phố thương mại | tổng giá ÷ **m² sàn** |
| `san` | Văn phòng · mặt bằng / cửa hàng | giá ÷ **m² sàn cho thuê** |
| `can` | Căn hộ · chung cư · condotel · căn hộ dịch vụ | tổng giá ÷ **m² căn** |

**m² sàn của nhà** (giống hệt cách web tính, chủ dự án chốt 19/09):
- tin ghi tổng m² sàn → dùng số đó;
- tin ghi m² sàn nhỏ hơn m² đất → đó là sàn mỗi tầng → nhân số tầng;
- tin không ghi m² sàn, có số tầng → m² đất × số tầng;
- không có cả hai → **bỏ tin đó**.

⛔ **Tuyệt đối không chia tổng giá nhà cho m² đất.**

## 5. Lấy số ở đâu — từng bước cho MỖI dãy

**Bước 1.** Lấy một dãy trong file (cùng `tinh` + `khu_vuc`/`du_an` + `loai_hinh` +
`muc_dich`). Làm trọn các quý của dãy đó rồi mới sang dãy khác.

**Bước 2 — nguồn công bố.** Trên Batdongsan, mở trang **Lịch sử giá** của **đúng** dự án /
phường + đúng loại hình + đúng bán/thuê.
- Trang ghi phạm vi **rộng hơn** (quận, thành phố thay vì phường) → **không dùng**.
- **Bán nhà: KHÔNG chép số Batdongsan** (họ chia theo diện tích ghi trên tin, tức m² đất).
  Bán đất, căn hộ: chép được. **Cho thuê mọi loại hình: chép được** (Batdongsan ghi
  tổng tr/tháng — đúng cách web tính).
- Batdongsan ghi theo quý (Q2/26) → chép đúng quý vào `ky`.
- Chép: giá phổ biến → `gia_m2_trieu` · thấp nhất → `gia_thap_trieu` · cao nhất →
  `gia_cao_trieu` · `nguon` = `Batdongsan` · `nguon_link` = link trang.

**Bước 3 — tự tính từ tin rao** (khi Bước 2 không dùng được):
1. Gom tin **đúng dự án / phường + đúng loại hình + đúng bán/thuê** đăng trong quý đó.
2. Mỗi tin: bán → giá ÷ diện tích theo mục **4**; thuê → tổng tiền/tháng.
3. Có tin là điền (như Batdongsan): `gia_m2_trieu` = số ở giữa (trung vị) ·
   `gia_thap_trieu` = nhỏ nhất · `gia_cao_trieu` = lớn nhất · **`so_mau` = số tin
   (bắt buộc — web hiện "x tin" cho khách)**. Link từng tin ghi vào `bao-cao.txt`.

**Bước 4 — không có số thì để trống.** Cấm nội suy, cấm lấy trung bình hai quý bên
cạnh, cấm lấy số phường khác / loại hình khác / cả tỉnh điền vào.

**Bước 5 — `bao-cao.txt`:** dãy nào đủ 5 quý liền · dãy nào bỏ và vì sao.

## 6. Sau khi nộp

Web tự kiểm và **từ chối** dòng: thiếu loại hình · bán sai `mau_so` · thuê có `mau_so` ·
có `vi_tri` · có `duong` mà thiếu `khu_vuc` · dãy cả tỉnh thiếu `nguon_link`. Đọc bảng
lỗi, sửa, nộp lại. Mỗi quý chủ dự án tải lại **danh sách còn thiếu** — chỉ còn những gì
web chưa tự có.
