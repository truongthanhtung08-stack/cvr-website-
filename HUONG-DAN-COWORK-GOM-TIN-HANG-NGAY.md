# ĐỀ BÀI CHO COWORK — GOM TIN BĐS MIỀN TRUNG HÀNG NGÀY

> File này là **đề bài giao cho Cowork** (hoặc bất kỳ ai/công cụ nào làm việc gom tin).
> Đọc xong là làm được, không cần hỏi lại.
>
> **Ba câu tóm gọn cả việc:**
> 1. Điền **đúng theo file mẫu** — đúng tên cột, đúng định dạng từng ô.
> 2. Nội dung và ảnh **lấy y nguyên của người đăng**, không viết lại, không bỏ bớt.
> 3. **Cái nào thiếu — nội dung hay ảnh — thì để trống ô đó, dán LINK vào `nguon` / `link_anh`
>    và ghi rõ thiếu gì vào `ghi_chu`.** Chủ dự án tự vào lấy nốt. Đừng đoán, đừng bỏ tin.

---

## 1. MỖI NGÀY GIAO GÌ — VÀ LƯU VÀO ĐÂU

Thư mục làm việc **đã dựng sẵn trên máy chủ dự án**:

```
C:\Users\X1 GEN 8\Projects\TIN-HANG-NGAY\
│
├── _MAU\                          ← KHUÔN GỐC, KHÔNG SỬA, KHÔNG XOÁ
│   ├── mau-nhap-tin-hang-loat.csv
│   ├── DANH-SACH-PHUONG-XA-MIEN-TRUNG.txt   ← 610 phường/xã, chép tên từ đây
│   └── DE-BAI-CHO-COWORK.md       ← chính file này
│
├── Tin-2026-08-30\                ← gói của ngày, mỗi ngày một thư mục
│   ├── Bang-2026-08-30.csv        ← bảng tin (đã tạo sẵn, chỉ việc điền)
│   ├── anh\
│   │   ├── da-nang\               ← ảnh Đà Nẵng
│   │   ├── hue\
│   │   ├── nha-trang\
│   │   ├── quy-nhon\
│   │   ├── quang-ngai\
│   │   └── quang-tri\
│   └── bao-cao.txt                ← khung sẵn, điền vào chỗ chấm
│
└── DA-DANG\                       ← đăng xong thì kéo cả thư mục ngày vào đây
```

**Ngày hôm sau:** chép thư mục `Tin-2026-08-30` thành `Tin-<ngày mới>`, xoá sạch nội dung
bên trong (giữ nguyên cấu trúc thư mục con), rồi làm tiếp.

> Thư mục này nằm **ngoài** thư mục mã nguồn `cvr-website` — cố ý như vậy để ảnh không
> bị đẩy lên GitHub. Đừng chuyển nó vào trong `cvr-website`.

### Bảng phải làm ĐÚNG theo file mẫu

**File mẫu:** `mau-nhap-tin-hang-loat.csv` (tải trên web tại
`/admin/tin-dang/nhap-hang-loat` → nút **“Tải file mẫu”**). Đây là khuôn bắt buộc — web đọc file
bằng **tên cột**, sai tên là không đọc được.

1. Mở file mẫu, **giữ nguyên dòng tên cột (dòng 1)**, xoá 15 dòng ví dụ, điền tin thật từ dòng 2.
2. **Không đổi tên cột, không xoá cột, không đổi thứ tự** — cứ để y nguyên cho chắc.
3. Mỗi dòng đúng **một tin**. Không gộp ô, không để tin ở sheet thứ hai.
4. Lưu lại dạng **`.csv` (UTF-8)** hoặc **`.xlsx`** — web đọc được cả hai.
5. **Được phép thêm cột riêng ở cuối** — web bỏ qua cột lạ. Bắt buộc thêm 3 cột này để chủ dự án
   kiểm tra và biên tập:

| Cột thêm | Ghi gì |
|---|---|
| `nguon` | **Link tin gốc** (bắt buộc, dán link đầy đủ). Không có link thì ghi nơi lấy + ngày giờ thấy tin |
| `link_anh` | Link tới **chỗ có ảnh** khi không tải được ảnh về — xem mục 5 |
| `ghi_chu` | Thiếu gì, vướng gì: `chưa tải được ảnh` · `tin không ghi diện tích` · `nghi trùng tin hôm qua` · `giá bất thường` |

> Ba cột này **không lên web**, chỉ để chủ dự án mở link vào lấy nốt phần còn thiếu.

---

## 2. ĐỊNH MỨC MỖI NGÀY — 50 TIN, CHIA 6 KHU VỰC

Trong mỗi khu vực giữ khoảng **70% tin bán · 30% tin cho thuê**.

| # | Khu vực (tỉnh MỚI) | Đã gồm tỉnh cũ | Địa bàn trọng tâm | Số tin/ngày |
|---|---|---|---|---|
| 1 | **Đà Nẵng** | Đà Nẵng + Quảng Nam | Sơn Trà · An Hải · Hải Châu · Ngũ Hành Sơn · Hòa Xuân · Hội An · Điện Bàn | **12** |
| 2 | **Huế** | Thừa Thiên Huế | Phú Xuân · Thuận Hóa · Vỹ Dạ · An Cựu · Thuận An · Hương Thủy | **10** |
| 3 | **Khánh Hòa — Nha Trang** | Khánh Hòa + Ninh Thuận | Nha Trang · Bắc Nha Trang · Tây Nha Trang · Nam Nha Trang · Cam Ranh | **10** |
| 4 | **Gia Lai — Quy Nhơn** | Gia Lai + Bình Định | Quy Nhơn · Quy Nhơn Bắc/Nam/Đông/Tây · An Nhơn | **8** |
| 5 | **Quảng Ngãi** | Quảng Ngãi + Kon Tum | Cẩm Thành · Nghĩa Lộ · Trương Quang Trọng | **5** |
| 6 | **Quảng Trị** | Quảng Trị + Quảng Bình | Đông Hà · Nam Đông Hà · Đồng Hới · Ba Đồn | **5** |
| | | | **Tổng** | **50** |

Ba thị trường ven biển lớn (Đà Nẵng · Huế · Nha Trang) chiếm hơn nửa định mức vì lượng tin
và lượng người tìm ở đó nhiều nhất. Muốn đổi số thì sửa thẳng cột cuối bảng này.

**Khu vực dự bị** — dùng khi một khu vực trên không gom đủ số:
**Đắk Lắk** (gồm Phú Yên — Buôn Ma Thuột, Tuy Hòa).
File mẫu có sẵn ví dụ cho cả 7 tỉnh nên đổi khu vực chỉ là thay dòng.

> Không gom đủ số tin **thật** cho một khu vực thì giao thiếu và ghi rõ trong `bao-cao.txt` —
> **tuyệt đối không bịa thêm cho đủ số.**

---

## 3. ĐỊA GIỚI — BẮT BUỘC DÙNG HỆ MỚI 2 CẤP

Từ 2025 **không còn Quận/Huyện**. Chỉ có: **Tỉnh/Thành → Phường/Xã**.

- `tinh_thanh` = tên tỉnh trong bảng mục 2 (ghi đúng chính tả, có dấu).
- `phuong_xa` = tên phường/xã, **ghi cả chữ “Phường”/“Xã”** — vd `Phường Sơn Trà`, `Xã Hòa Vang`.
- **Danh sách phường/xã để chép:** `_MAU\DANH-SACH-PHUONG-XA-MIEN-TRUNG.txt`
  — 610 phường/xã của 7 tỉnh, đã lọc sẵn. **Chép từ file đó ra, không tự gõ theo trí nhớ.**
  Sai một chữ là tin không lọc được theo khu vực, coi như tin chìm.
- **Tin gốc ghi theo địa giới CŨ** (rất hay gặp — "Quận Hải Châu", "Phường Mỹ An, Ngũ Hành Sơn"):
  tìm phường/xã MỚI gần đúng nhất trong file trên, **đồng thời chép nguyên chữ trong tin gốc
  vào cột `ghi_chu`** — vd `ghi_chu` = `tin gốc ghi: Mỹ An, Ngũ Hành Sơn`. Chủ dự án đối chiếu lại.
  Đừng bỏ tin chỉ vì địa danh cũ.
- Địa danh quen thuộc vẫn còn, chỉ đổi cấp: `Phường Hội An`, `Phường Điện Bàn` (thuộc Đà Nẵng) ·
  `Phường Quy Nhơn` (thuộc Gia Lai) · `Phường Nha Trang` (thuộc Khánh Hòa) ·
  `Phường Buôn Ma Thuột` (thuộc Đắk Lắk) · `Phường Đông Hà`, `Phường Đồng Hới` (thuộc Quảng Trị).
- Cột `quan_huyen` **không có trong mẫu mới** — đừng thêm vào.

---

## 4. CÁC CỘT VÀ LUẬT ĐIỀN

### 4.1 Bắt buộc — thiếu là hệ thống báo đỏ, không đăng được

| Cột | Luật |
|---|---|
| `tieu_de` | **Lấy đúng tiêu đề người đăng viết.** Nếu ngắn hơn **30 ký tự** thì nối thêm thông tin **đã có sẵn trong chính tin đó** (loại hình, phường/xã, diện tích) cho đủ — vd `Bán nhà Sơn Trà` → `BÁN NHÀ RIÊNG 62M2 PHƯỜNG SƠN TRÀ, ĐÀ NẴNG`. **Không thêm chi tiết người đăng không nói** |
| `mo_ta` | **Chép nguyên mô tả của người đăng**, chỉ bỏ phần rác (hashtag, "LH em zalo", câu mời chào lặp). Nếu ngắn hơn **50 ký tự** thì nối thêm thông tin có sẵn trong tin (diện tích, số phòng, pháp lý, vị trí). Không bịa thêm |
| `dien_tich` | Số m², chỉ ghi số (`62`), không ghi `62m2` |
| `muc_dich` | `ban` hoặc `thue` |
| `loai_hinh` | Chép **đúng một tên** trong danh sách mục 4.3 — sai một chữ là báo lỗi |
| `tinh_thanh` | Theo mục 2 |
| `phuong_xa` | Theo mục 3 |
| `ma_anh` | Mã ảnh **có tiền tố khu vực**: `dn01`, `hue01`, `nt01`… (bảng ở mục 5). Không tải được ảnh thì để trống và làm theo **mục 5B** |

### 4.2 Nên có — bỏ trống vẫn đăng được nhưng tin yếu

| Cột | Cách ghi |
|---|---|
| `gia` | Tin **bán ghi theo TỶ** (`5,5` = 5,5 tỷ) · tin **thuê ghi theo TRIỆU/tháng** (`18` = 18 triệu). **Chỉ ghi số**, dùng dấu **phẩy** thập phân. Bỏ trống = “Thỏa thuận”. ⚠️ Ghi `5.5` sẽ ra 5,5 — nhưng ghi `5,5 tỷ` là **lỗi** |
| `phong_ngu`, `phong_tam` | Chỉ số. Đất nền để trống |
| `dia_chi` | Tên đường / tên khu, **không ghi số nhà cụ thể** khi chưa được chủ nhà đồng ý |
| `hang_tin` | `diamond` · `gold` · `silver` · `basic` (bỏ trống = basic) |
| `phap_ly` | `Sổ hồng riêng` · `Sổ đỏ` · `Sổ hồng lâu dài` · `Hợp đồng mua bán` |
| `huong` | `Đông` · `Đông Nam` · `Tây Bắc`… |
| `ten_du_an` | Tên dự án nếu tin thuộc dự án (vd `Monarchy`) |
| `huong_ban_cong` | Chỉ với căn hộ/chung cư |
| `tinh_trang_noi_that` | `Bàn giao thô` · `Cơ bản` · `Đầy đủ` · `Đầy đủ / Cao cấp` |
| `noi_that_ban_giao` | Nhiều mục ngăn bằng **dấu phẩy**: `Máy lạnh, Tủ bếp, Sofa` |
| `tien_ich` | Nhiều mục ngăn bằng **dấu phẩy**: `Hồ bơi, Phòng gym, Bảo vệ 24/7` |
| `lien_he_ten`, `lien_he_sdt` | Tên + số của người đăng tin |
| `anh` | Chỉ dùng khi ghi thẳng tên ảnh hoặc link, ngăn bằng `\|` (xem mục 5) |

### 4.3 Danh mục `loai_hinh` — chép đúng nguyên văn

**Khi `muc_dich = ban`:**
Căn hộ · Chung cư · Nhà riêng · Nhà mặt phố · Nhà biệt thự / Liền kề ·
Shophouse / Nhà phố thương mại · Đất nền / Đất nền dự án · Đất nông nghiệp ·
Villa / Biệt thự biển · Condotel · Đất công nghiệp · Kho / Nhà xưởng · Bất động sản khác

**Khi `muc_dich = thue`:**
Căn hộ · Chung cư · Căn hộ dịch vụ · Nhà riêng · Nhà mặt phố · Nhà phố thương mại ·
Biệt thự / Liền kề · Nhà trọ / Phòng trọ · Văn phòng · Mặt bằng / Cửa hàng bán lẻ ·
Thuê đất / Nhà xưởng / Kho bãi · Bất động sản khác

> Danh mục bán và thuê **khác nhau**. `Văn phòng` chỉ có ở cho thuê, `Condotel` chỉ có ở mua bán.

### 4.4 QUY ĐỔI TỪ CHỮ NGƯỜI ĐĂNG VIẾT → Ô TRONG BẢNG

Đây là chỗ sinh ra nhiều dòng đỏ nhất. Người đăng viết tự do, bảng thì cần đúng định dạng.

**Giá** — bán quy về **TỶ**, thuê quy về **TRIỆU/tháng**, chỉ ghi số, dấu **phẩy** thập phân:

| Người đăng viết | Ghi vào ô `gia` |
|---|---|
| `5,5 tỷ` · `5ty5` · `5 tỷ 500` | `5,5` |
| `1 tỷ 250` · `1ty25` · `1250 triệu` | `1,25` |
| `850 triệu` · `850tr` | `0,85` |
| `12tr/tháng` · `12 triệu/th` (tin thuê) | `12` |
| `7tr5` (tin thuê) | `7,5` |
| `giá thương lượng` · `LH` · `thoả thuận` | **để trống** |
| `2 tỷ 1 / m2` hoặc giá theo m² | để trống ô `gia`, ghi nguyên câu vào `ghi_chu` |

**Diện tích** — quy về **một số m²**:

| Người đăng viết | Ghi vào ô `dien_tich` |
|---|---|
| `5x20` · `5m x 20m` | `100` |
| `100m2` · `100 m²` · `1 sào` | `100` · `100` · để trống + ghi `ghi_chu` |
| `DT 62,5m2` | `62,5` |
| Không nói diện tích | **để trống**, `ghi_chu` = `tin không ghi diện tích` |

**Loại hình** — dịch chữ đời thường sang đúng tên danh mục ở mục 4.3:

| Người đăng viết | `loai_hinh` |
|---|---|
| bán đất · lô đất · đất thổ cư · đất nền | `Đất nền / Đất nền dự án` |
| nhà cấp 4 · nhà 2 tầng · nhà trong kiệt/hẻm · nhà nguyên căn | `Nhà riêng` |
| nhà mặt tiền · nhà mặt đường | `Nhà mặt phố` |
| chung cư · căn hộ · CH · apartment | `Căn hộ` |
| chung cư mini · phòng trọ · nhà trọ (tin thuê) | `Nhà trọ / Phòng trọ` |
| kiot · ki-ốt · shop · mặt bằng (tin thuê) | `Mặt bằng / Cửa hàng bán lẻ` |
| villa · biệt thự biển · resort villa | `Villa / Biệt thự biển` |
| biệt thự (không phải biển) | `Nhà biệt thự / Liền kề` (bán) · `Biệt thự / Liền kề` (thuê) |
| shophouse · nhà phố thương mại | `Shophouse / Nhà phố thương mại` (bán) · `Nhà phố thương mại` (thuê) |
| kho · xưởng · nhà xưởng | `Kho / Nhà xưởng` (bán) · `Thuê đất / Nhà xưởng / Kho bãi` (thuê) |
| đất ruộng · đất vườn · đất nông nghiệp | `Đất nông nghiệp` |
| không xếp được vào đâu | `Bất động sản khác` + ghi rõ vào `ghi_chu` |

**Số điện thoại** — chỉ giữ **chữ số**: `0905.123.456` · `0905 123 456` · `+84905123456`
→ `0905123456`. Tin có nhiều số thì lấy số đầu, các số còn lại đưa vào `ghi_chu`.

**`hang_tin`** — **luôn để trống.** Cowork không quyết hạng tin. Chủ dự án tự nâng hạng khi đăng.

---

## 5. ẢNH

**TẢI VỀ HẾT, TỐI ĐA 15 ẢNH MỖI TIN.** Không tự lọc, **không tự bỏ ảnh xấu** —
chủ dự án sẽ chọn và xếp lại sau. Lấy bản **to nhất / rõ nhất** mà tin có.

Vì sao dừng ở 15: web đăng nhiều nhất 15 ảnh một tin (hạng Diamond), tải hơn nữa là phí thời gian.
Tin nào có nhiều hơn 15 ảnh thì lấy 15 tấm đầu và ghi `còn N ảnh nữa` vào `ghi_chu`.

### Mã ảnh — MỖI KHU VỰC MỘT TIỀN TỐ RIÊNG

Khi đăng, chủ dự án chọn **toàn bộ ảnh của cả ngày trong một lần**, và web khớp ảnh với tin
**chỉ dựa vào tên tệp**. Nếu cả 6 khu vực đều dùng `tin01` thì ảnh sẽ lẫn sang tin khác.
Vì vậy mã ảnh phải mang tiền tố khu vực:

| Khu vực | Thư mục ảnh | Mã ảnh (`ma_anh`) | Tên tệp |
|---|---|---|---|
| Đà Nẵng | `anh\da-nang\` | `dn01` … `dn12` | `dn01-1.jpg`, `dn01-2.jpg`… |
| Huế | `anh\hue\` | `hue01` … `hue10` | `hue01-1.jpg`… |
| Nha Trang | `anh\nha-trang\` | `nt01` … `nt10` | `nt01-1.jpg`… |
| Quy Nhơn | `anh\quy-nhon\` | `qnhon01` … `qnhon08` | `qnhon01-1.jpg`… |
| Quảng Ngãi | `anh\quang-ngai\` | `qngai01` … `qngai05` | `qngai01-1.jpg`… |
| Quảng Trị | `anh\quang-tri\` | `qtri01` … `qtri05` | `qtri01-1.jpg`… |

Số cuối tên tệp là thứ tự ảnh **đúng như trong tin gốc**; **ảnh `-1` là ảnh đại diện**.

**Cách thay thế:** để trống `ma_anh`, ghi thẳng tên ảnh vào cột `anh`, ngăn nhau bằng `|`:
`nt03-1.jpg | nt03-2.jpg`. Ảnh ghi trước là ảnh đại diện.

**Web chỉ đăng N ảnh đầu theo hạng tin** — thừa thì bị cắt, nhưng **cứ tải hết về**,
chủ dự án đổi thứ tự / đổi hạng tin rồi mới đăng:

| Hạng | basic | silver | gold | diamond |
|---|---|---|---|---|
| Số ảnh được đăng | 7 | 10 | 12 | 15 |

Mỗi tệp ≤ 10MB. Web tự thu nhỏ và **đóng dấu chìm “COASTAL LAND”** khi tải lên — không cần tự làm.
Ảnh nào > 10MB thì ghi vào `bao-cao.txt`, đừng tự nén.

### 5B. KHÔNG TẢI ĐƯỢC ẢNH THÌ ĐỂ LINK LẠI — ĐỪNG BỎ TIN

Nguồn chặn tải, cần đăng nhập, ảnh lỗi… **vẫn giữ dòng tin đó**, chỉ đổi cách ghi ảnh.
Ba mức, dùng mức cao nhất làm được:

| Mức | Khi nào | Ghi thế nào |
|---|---|---|
| **1. Tải được ảnh** (tốt nhất) | Lấy được file về máy | `ma_anh` = `dn01`, ảnh để trong `anhda-nang` tên `dn01-1.jpg`… |
| **2. Không tải được nhưng có link ảnh trực tiếp** | Link kết thúc bằng `.jpg` / `.png` / `.webp` | Dán các link vào **cột `anh`**, ngăn nhau bằng `\|`. Web dùng thẳng link đó. Để trống `ma_anh` |
| **3. Không có cả hai** | Ảnh sau đăng nhập, ảnh trong app | Để trống `ma_anh` và `anh`. Dán **link tin gốc** vào cột `link_anh` + `nguon`, `ghi_chu` = `chưa lấy được ảnh` |

⚠️ **Mức 2 chỉ là tạm.** Link ảnh Facebook/Zalo thường hết hạn sau vài giờ, ảnh sẽ mất trên web.
Chủ dự án nên mở link tải lại về rồi đăng bằng mức 1.

**Dòng ở mức 3 sẽ báo đỏ “Thiếu ảnh” trong bảng xem trước — đúng như vậy.** Đó là cách web nhắc
chủ dự án còn tin chưa có ảnh. Mở `link_anh`, lấy ảnh, tải lên là hết đỏ.

### 5C. THIẾU NỘI DUNG CŨNG LÀM Y VẬY

Tin gốc không ghi diện tích / số phòng / pháp lý / giá → **để trống ô đó, tuyệt đối đừng đoán**.
Dán link tin gốc vào `nguon`, ghi rõ thiếu gì vào `ghi_chu` — vd `tin không ghi diện tích`.
Chủ dự án mở link vào lấy nốt, hoặc gọi hỏi người đăng.

Dòng thiếu **cột bắt buộc** (mục 4.1) sẽ báo đỏ khi tải lên — điền xong là hết đỏ.
Thiếu cột ở mục 4.2 thì vẫn đăng được bình thường.

---

## 6. TUYỆT ĐỐI KHÔNG

1. **Không tự viết lại, không thêm thắt, không "làm cho hay hơn".**
   Ghi **đúng theo tin của người đăng**: nội dung của họ, giá của họ, ảnh của họ,
   tên và số điện thoại của họ. Việc biên tập là của chủ dự án ở bước sau, không phải của Cowork.
2. **Không bịa tin.** Không có tin thật thì để trống dòng đó và ghi vào `bao-cao.txt`.
   Thiếu số còn hơn có tin ma — khách gọi vào không có nhà là mất uy tín.
3. **Không bỏ bớt ảnh.** Tin có bao nhiêu ảnh tải về hết bấy nhiêu (xem mục 5).
4. **Không bỏ tin chỉ vì không tải được ảnh, hay vì tin thiếu thông tin.**
   Vẫn giao dòng đó, **để lại link** trong `nguon` / `link_anh` và ghi thiếu gì vào `ghi_chu` —
   chủ dự án sẽ tự vào lấy nốt (mục 5B, 5C).
5. Không ghi giá kèm chữ (`5,5 tỷ`) — chỉ ghi số.
6. Không gộp ô (merge) trong vùng dữ liệu, không để dữ liệu ở sheet thứ hai.
7. Không đổi tên cột trong file mẫu, không xoá cột.

> **Vì sao lấy y nguyên:** gói Cowork giao **chưa phải là tin đăng**, mới là **bản ghi thô** để
> chủ dự án làm việc tiếp. Chủ dự án sẽ: **liên hệ người đăng → xin phép → chỉnh sửa lại toàn bộ
> nội dung và ảnh → mới đăng lên web.** Cowork tự sửa chữ hay tự bỏ ảnh chỉ làm sai lệch bản gốc,
> khiến chủ dự án không đối chiếu được khi gọi cho người đăng.
> Vì vậy cột `nguon` và `lien_he_sdt` phải luôn đầy đủ.

**Được phép làm cho dễ nhìn:** tô màu · in đậm · giãn cột · đóng băng dòng ·
thêm cột riêng ở cuối (`nguon`, `ghi_chu`, STT) · chèn dòng tiêu đề trang trí phía trên dòng tên cột.
Hệ thống vẫn đọc đúng.

> Web thực ra còn chịu được cả việc đổi thứ tự cột và đổi tên cột sang tiếng Việt có dấu,
> nhưng **đừng làm** — giữ đúng khuôn mẫu thì mỗi ngày đỡ phải kiểm tra lại.

---

## 7. TỰ KIỂM TRƯỚC KHI GIAO

Rà lại từng dòng cho **đúng khuôn** — sửa định dạng (chính tả địa danh, tên loại hình, cách ghi giá),
**không sửa nội dung tin**. Dòng nào không đạt thì vẫn giao nhưng ghi lý do vào cột `ghi_chu`:

- [ ] `tieu_de` ≥ 30 ký tự · `mo_ta` ≥ 50 ký tự
- [ ] `loai_hinh` khớp đúng danh mục theo `muc_dich`
- [ ] `tinh_thanh` + `phuong_xa` chép từ `provincesNew.ts`, đúng chính tả có dấu
- [ ] `dien_tich` có số · `gia` chỉ có số, dấu phẩy thập phân
- [ ] Mã ảnh đúng tiền tố khu vực (`dn` · `hue` · `nt` · `qnhon` · `qngai` · `qtri`), không trùng nhau
- [ ] Ảnh: hoặc `ma_anh` + đủ ảnh trong đúng thư mục khu vực (mức 1) · hoặc link ảnh trong cột `anh` (mức 2) ·
      hoặc `link_anh` + `ghi_chu` = `chưa lấy được ảnh` (mức 3). **Không được để trống cả ba.**
- [ ] `nguon` có **link tin gốc** · `lien_he_sdt` có số của người đăng — chủ dự án cần hai cái này
      để gọi xin phép và vào lấy nốt phần thiếu
- [ ] Ô nào không có trong tin gốc thì **để trống**, không đoán — ghi thiếu gì vào `ghi_chu`
- [ ] **Chống trùng với các ngày trước:** trước khi gom, mở tất cả file `Bang-*.csv` trong
      `TIN-HANG-NGAY\` và `TIN-HANG-NGAY\DA-DANG\`. Tin mới bị coi là **trùng** khi
      **cùng số điện thoại VÀ cùng địa chỉ/diện tích/giá** → bỏ, ghi vào `bao-cao.txt`.
      Chỉ trùng số điện thoại thôi thì **KHÔNG phải trùng** — một môi giới đăng nhiều căn khác nhau
      là bình thường, bỏ đi là mất tin thật.
- [ ] Đủ định mức theo bảng mục 2: **tổng 50 tin** (Đà Nẵng 12 · Huế 10 · Nha Trang 10 ·
      Quy Nhơn 8 · Quảng Ngãi 5 · Quảng Trị 5), mỗi khu vực khoảng **70% bán – 30% thuê**

Ghi kết quả vào `bao-cao.txt`: tổng số tin · số tin từng khu vực (đủ/thiếu bao nhiêu so với định mức) ·
số tin bán/thuê · **danh sách dòng chưa lấy được ảnh** · **danh sách dòng còn thiếu thông tin và thiếu gì** ·
lấy tin từ những nguồn nào, nguồn nào chặn không vào được.

---

## 8. SAU KHI GIAO — CHỦ DỰ ÁN LÀM

Gói Cowork giao là **bản ghi thô**, chưa phải tin đăng. Thứ tự làm:

1. **Liên hệ người đăng** (cột `lien_he_sdt`, đối chiếu cột `nguon`) — xác minh tin còn hiệu lực.
2. **Xin phép** được đăng tin và dùng ảnh của họ.
3. **Lấy nốt phần Cowork không lấy được:** lọc cột `ghi_chu`, mở `link_anh` / `nguon` để
   tải ảnh về và điền các ô còn trống. Đây là phần việc tay duy nhất mỗi ngày.
4. **Chỉnh sửa lại** tiêu đề, mô tả, giá, thông tin liên hệ trong file `Bang-<ngày>.csv`.
5. **Chọn và xếp lại ảnh** trong thư mục `anh/` — bỏ ảnh xấu, đưa ảnh đẹp nhất về `-1` (ảnh đại diện).
6. Vào `/admin/tin-dang/nhap-hang-loat` → tải file → tải hết ảnh một lượt →
   xem bảng xem trước (**đỏ** = dòng sai phải sửa · **vàng** = chưa có ảnh nên chưa đăng được) →
   bấm **Đăng**.
7. Tin lên web trong vòng 60 giây.

> Người đăng không đồng ý → **xoá dòng đó khỏi file**, không đăng.

---

## 9. NHỮNG VIỆC COWORK KHÔNG LÀM ĐƯỢC — ĐỪNG CỐ, GHI LẠI RỒI CHUYỂN

Có mấy việc công cụ tự động gần như chắc chắn làm không nổi. Gặp là **ghi vào `ghi_chu`
rồi đi tiếp**, đừng dừng lại loay hoay — mất thời gian mà vẫn không xong:

| Việc | Cowork làm được? | Gặp thì làm gì |
|---|---|---|
| Vào nhóm Facebook / Zalo phải đăng nhập | **Không** | Ghi vào `bao-cao.txt` mục "nguồn bị chặn". Chuyển sang nguồn công khai khác |
| Tải ảnh nằm sau đăng nhập, hoặc trong app | **Không** | Vẫn giữ dòng tin, dán link vào `link_anh`, `ghi_chu` = `chưa lấy được ảnh` |
| Gọi điện xác minh tin còn hay hết | **Không** | Ghi số vào `lien_he_sdt` — chủ dự án gọi |
| Xin phép người đăng | **Không** | Việc của chủ dự án |
| Quyết định `hang_tin` | **Không nên** | Luôn để trống |
| Đoán thông tin tin không ghi | **Cấm** | Để trống + ghi `ghi_chu` |
| Chuẩn hoá địa danh cũ → phường/xã mới | **Được** | Theo mục 3, ghi chữ gốc vào `ghi_chu` |
| Quy đổi giá, diện tích, loại hình | **Được** | Theo mục 4.4 |
| Đặt tên ảnh, xếp thứ tự | **Được** | Theo mục 5 |
| Chống trùng với ngày trước | **Được** | Theo mục 7 |

**Ngày đầu tiên quan trọng nhất là câu trả lời này:** trong `bao-cao.txt` phải nói rõ
**lấy tin từ nguồn nào, tải được ảnh về không, nguồn nào chặn**. Biết sớm thì chủ dự án
đổi cách làm ngay, đỡ mất cả tuần chạy sai hướng.
