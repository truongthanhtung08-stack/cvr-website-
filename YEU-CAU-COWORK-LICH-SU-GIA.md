# YÊU CẦU COWORK — THU THẬP SỐ LIỆU LỊCH SỬ GIÁ

> ## ⛔ ĐÂY LÀ VIỆC LÀM MỚI — KHÔNG PHẢI BỔ SUNG
> - **Bỏ toàn bộ** số lịch sử giá đã nộp trước 03/10/2026 và mọi file mẫu cũ — số cũ
>   tính sai (gộp cả tỉnh, chia giá nhà cho m² đất).
> - Làm lại **từ đầu** theo file này.
> - Lần nộp ĐẦU TIÊN ở admin → **Lịch sử giá**: bấm **Thay toàn bộ**. Các lần sau: nộp
>   bình thường (bổ sung).
> - File này **thay thế** mục GÓI C cũ và mọi yêu cầu lịch sử giá trước đây.
>
> Ngày: 03/10/2026.

## 1. Cowork nhận gì, làm gì

**Web tự tính số từ tin đăng trên coastalland.vn mỗi tháng.** Cowork chỉ điền **phần
web còn thiếu** — chủ yếu là các tháng TRƯỚC khi web có tin.

Chủ dự án vào admin → **Lịch sử giá** → bấm **Tải danh sách còn thiếu (gửi Cowork)**.
File tải về là **đúng các dòng cần điền**: mỗi dòng = một tháng của một dãy mà tin
đang đăng trên web cần nhưng chưa có số. Cột `tinh`, `khu_vuc`, `du_an`, `loai_hinh`,
`muc_dich`, `ky`, `mau_so` **đã điền sẵn — không sửa**. Cowork chỉ điền giá + nguồn.

## 2. Trang tin cần gì thì mới hiện Lịch sử giá

Một tin chỉ hiện biểu đồ khi có **một dãy số** khớp **đủ** các điều kiện sau. Thiếu một
điều kiện là **không hiện** — không hiện tạm, không hiện 2 tháng, không mượn số nơi khác.

| # | Điều kiện |
|---|---|
| 1 | **Cùng phân khúc** = cùng loại hình + cùng bán/thuê |
| 2 | **Giá mỗi m² chia đúng diện tích của loại hình** (mục **4**) |
| 3 | **Cùng vị trí**, xét theo thứ tự: ① cùng **dự án** → ② cùng **tuyến đường** → ③ cùng **phường/xã** → ④ cả **tỉnh/thành** (chỉ khi nguồn công bố số cả tỉnh) |
| 4 | **Đủ 13 tháng LIỀN NHAU** tới tháng mới nhất — hổng 1 tháng là cả dãy không hiện |

Web lấy bậc sát nhất có đủ số. **Ít dãy mà đủ 13 tháng liền còn hơn nhiều dãy hổng tháng.**

## 3. Các cột

| Cột | Ghi gì |
|---|---|
| `tinh` · `khu_vuc` · `du_an` · `loai_hinh` · `muc_dich` · `ky` · `mau_so` | **Đã điền sẵn — không sửa** |
| `gia_m2_trieu` | Giá phổ biến, **triệu đồng/m²** (`78,5`). Thuê: triệu đồng/m²/tháng |
| `gia_thap_trieu` · `gia_cao_trieu` | Thấp nhất · cao nhất của tháng |
| `so_mau` | Số tin đã dùng để tính (khi tự tính, mục **5** bước 3) |
| `nguon` · `nguon_link` | Ai công bố + link tra lại. **Bắt buộc.** |
| `vi_tri` | **Để trống** |
| `duong` | Chỉ khi làm thêm dãy theo tuyến đường (thêm dòng mới, ghi kèm `khu_vuc`) |

Muốn nộp thêm dãy **cả tỉnh**: thêm dòng, `khu_vuc` để trống, **bắt buộc `nguon_link`**
tới nơi công bố số cả tỉnh. Không có nguồn công bố → không làm, không tự gộp các phường.

## 4. Chia cho diện tích gì — KHÔNG ĐƯỢC NHẦM

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
`muc_dich`). Làm trọn các tháng của dãy đó rồi mới sang dãy khác.

**Bước 2 — nguồn công bố.** Trên Batdongsan, mở trang **Lịch sử giá** của **đúng** dự án /
phường + đúng loại hình + đúng bán/thuê.
- Trang ghi phạm vi **rộng hơn** (quận, thành phố thay vì phường) → **không dùng**.
- **Nhà: KHÔNG chép số Batdongsan** (họ chia theo diện tích ghi trên tin, tức m² đất).
  Đất, căn hộ, văn phòng, mặt bằng, kho xưởng: chép được.
- Chép: giá phổ biến → `gia_m2_trieu` · thấp nhất → `gia_thap_trieu` · cao nhất →
  `gia_cao_trieu` · `nguon` = `Batdongsan` · `nguon_link` = link trang.

**Bước 3 — tự tính từ tin rao** (khi Bước 2 không dùng được):
1. Gom tin **đúng dự án / phường + đúng loại hình + đúng bán/thuê** của tháng đó.
2. Mỗi tin: giá ÷ diện tích theo mục **4**.
3. **Đủ từ 5 tin trở lên** mới điền: `gia_m2_trieu` = số ở giữa (trung vị) ·
   `gia_thap_trieu` = nhỏ nhất · `gia_cao_trieu` = lớn nhất · `so_mau` = số tin.
   Link từng tin ghi vào `bao-cao.txt`. Dưới 5 tin → **để trống**.

**Bước 4 — không có số thì để trống.** Cấm nội suy, cấm lấy trung bình hai tháng bên
cạnh, cấm lấy số phường khác / loại hình khác / cả tỉnh điền vào.

**Bước 5 — `bao-cao.txt`:** dãy nào đủ 13 tháng liền · dãy nào bỏ và vì sao.

## 6. Sau khi nộp

Web tự kiểm và **từ chối** dòng: thiếu loại hình · sai `mau_so` · có `vi_tri` · có `duong`
mà thiếu `khu_vuc` · dãy cả tỉnh thiếu `nguon_link`. Đọc bảng lỗi, sửa, nộp lại.
Mỗi tháng chủ dự án tải lại **danh sách còn thiếu** — chỉ còn những gì web chưa tự có.
