# ĐỀ BÀI CHO COWORK — GOM TIN BĐS MIỀN TRUNG HÀNG NGÀY

> File này là **đề bài giao cho Cowork** (hoặc bất kỳ ai/công cụ nào làm việc gom tin).
> Đọc xong là làm được, không cần hỏi lại. Sản phẩm mỗi ngày: **một gói file** để chủ dự án
> kiểm tra → chỉnh ảnh → xác minh người đăng → tự tải lên `/admin/tin-dang/nhap-hang-loat`.

---

## 1. MỖI NGÀY GIAO GÌ

Một thư mục tên `Tin-<NĂM-THÁNG-NGÀY>` gồm đúng 3 thứ:

```
Tin-2026-08-31/
├── Bang-2026-08-31.csv     ← bảng tin, đúng mẫu (mở bằng Excel được)
├── anh/                    ← ảnh, đặt tên khớp cột ma_anh
│   ├── tin01-1.jpg
│   ├── tin01-2.jpg
│   └── tin02-1.jpg …
└── bao-cao.txt             ← gom được bao nhiêu tin, tỉnh nào bao nhiêu, tin nào còn thiếu gì
```

**File mẫu để làm theo:** `public/mau-nhap-tin-hang-loat.csv` trong dự án
(trong web: `/admin/tin-dang/nhap-hang-loat` → nút **“Tải file mẫu”**).
Giữ nguyên dòng tên cột, xoá 15 dòng ví dụ, điền tin thật từ dòng 2.

---

## 2. ĐỊNH MỨC MỖI NGÀY — 50 TIN, CHIA 5 KHU VỰC

**Mỗi ngày 50 tin, mỗi khu vực 10 tin.** Trong 10 tin của một khu vực:
**7 tin bán · 3 tin cho thuê**.

| # | Khu vực (tỉnh MỚI) | Đã gồm tỉnh cũ | Địa bàn trọng tâm | Số tin/ngày |
|---|---|---|---|---|
| 1 | **Đà Nẵng** | Đà Nẵng + Quảng Nam | Sơn Trà · An Hải · Hải Châu · Ngũ Hành Sơn · Hòa Xuân · Hội An · Điện Bàn | **10** |
| 2 | **Huế** | Thừa Thiên Huế | Phú Xuân · Thuận Hóa · Vỹ Dạ · An Cựu · Thuận An · Hương Thủy | **10** |
| 3 | **Quảng Trị** | Quảng Trị + Quảng Bình | Đông Hà · Nam Đông Hà · Đồng Hới · Ba Đồn | **10** |
| 4 | **Quảng Ngãi** | Quảng Ngãi + Kon Tum | Cẩm Thành · Nghĩa Lộ · Trương Quang Trọng | **10** |
| 5 | **Gia Lai** | Gia Lai + Bình Định | Quy Nhơn · Quy Nhơn Bắc/Nam/Đông/Tây · An Nhơn | **10** |
| | | | **Tổng** | **50** |

**Khu vực dự bị** — dùng khi một khu vực trên không gom đủ 10 tin, hoặc khi chủ dự án
muốn đổi danh sách: **Khánh Hòa** (gồm Ninh Thuận — Nha Trang, Cam Ranh) và
**Đắk Lắk** (gồm Phú Yên — Buôn Ma Thuột, Tuy Hòa).
File mẫu có sẵn ví dụ cho cả 7 tỉnh nên đổi khu vực chỉ là thay dòng.

> Không gom đủ 10 tin **thật** cho một khu vực thì giao thiếu và ghi rõ trong `bao-cao.txt` —
> **tuyệt đối không bịa thêm cho đủ số.**

---

## 3. ĐỊA GIỚI — BẮT BUỘC DÙNG HỆ MỚI 2 CẤP

Từ 2025 **không còn Quận/Huyện**. Chỉ có: **Tỉnh/Thành → Phường/Xã**.

- `tinh_thanh` = tên tỉnh trong bảng mục 2 (ghi đúng chính tả, có dấu).
- `phuong_xa` = tên phường/xã, **ghi cả chữ “Phường”/“Xã”** — vd `Phường Sơn Trà`, `Xã Hòa Vang`.
- Danh sách phường/xã chuẩn: file `src/lib/provincesNew.ts` trong dự án (34 tỉnh · 3321 phường/xã).
  **Chép từ đó ra, không tự gõ theo trí nhớ** — sai một chữ là tin không lọc được theo khu vực.
- Địa danh quen thuộc vẫn còn, chỉ đổi cấp: `Phường Hội An`, `Phường Điện Bàn` (thuộc Đà Nẵng) ·
  `Phường Quy Nhơn` (thuộc Gia Lai) · `Phường Nha Trang` (thuộc Khánh Hòa) ·
  `Phường Buôn Ma Thuột` (thuộc Đắk Lắk) · `Phường Đông Hà`, `Phường Đồng Hới` (thuộc Quảng Trị).
- Cột `quan_huyen` **không có trong mẫu mới** — đừng thêm vào.

---

## 4. CÁC CỘT VÀ LUẬT ĐIỀN

### 4.1 Bắt buộc — thiếu là hệ thống báo đỏ, không đăng được

| Cột | Luật |
|---|---|
| `tieu_de` | **≥ 30 ký tự**. Công thức: `HÀNH ĐỘNG + LOẠI HÌNH + ĐẶC ĐIỂM + PHƯỜNG/XÃ` — vd `BÁN NHÀ 3 TẦNG KIỆT Ô TÔ PHƯỜNG SƠN TRÀ, CÁCH BIỂN MỸ KHÊ 500M` |
| `mo_ta` | **≥ 50 ký tự**, 2–3 câu. Nêu: kết cấu/hiện trạng · vị trí so với mốc quen thuộc · pháp lý. **Viết bằng lời của mình**, không chép của sàn khác |
| `dien_tich` | Số m², chỉ ghi số (`62`), không ghi `62m2` |
| `muc_dich` | `ban` hoặc `thue` |
| `loai_hinh` | Chép **đúng một tên** trong danh sách mục 4.3 — sai một chữ là báo lỗi |
| `tinh_thanh` | Theo mục 2 |
| `phuong_xa` | Theo mục 3 |
| `ma_anh` | Mã ảnh của tin: `tin01`, `tin02`… (xem mục 5) |

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

---

## 5. ẢNH

**Cách chuẩn (dùng cái này):** cột `ma_anh` ghi mã `tin01`, đặt tên ảnh trên máy là
`tin01-1.jpg`, `tin01-2.jpg`, `tin01-3.jpg`… Hệ thống tự gom về đúng tin,
**ảnh `-1` là ảnh đại diện** nên chọn ảnh đẹp nhất làm `-1`.

**Cách thay thế:** để trống `ma_anh`, ghi thẳng tên ảnh vào cột `anh`, ngăn nhau bằng `|`:
`condotel-nha-trang-1.jpg | condotel-nha-trang-2.jpg`. Ảnh ghi trước là ảnh đại diện.

**Số ảnh tối đa theo hạng tin** — thừa sẽ bị cắt bớt:

| Hạng | basic | silver | gold | diamond |
|---|---|---|---|---|
| Số ảnh | 7 | 10 | 12 | 15 |

Mỗi tệp ≤ 10MB. Web tự thu nhỏ và **đóng dấu chìm “COASTAL LAND”** khi tải lên — không cần tự làm.

---

## 6. TUYỆT ĐỐI KHÔNG

1. **Không chép nguyên văn tiêu đề / mô tả / ảnh từ sàn khác** (Batdongsan, Homedy, Chợ Tốt…).
   Ba lý do: ảnh và chữ là tài sản của người khác · số điện thoại trong tin là dữ liệu cá nhân ·
   Google phạt nội dung trùng lặp, làm hỏng đúng cái SEO mà việc đăng tin sinh ra để phục vụ.
   Nếu lấy từ nguồn công khai thì **chỉ lấy làm đầu mối** → gọi xác minh → tự viết lại → xin ảnh gốc.
2. **Không bịa tin.** Không có nhà thật thì để trống dòng đó. Khách gọi vào không có nhà là mất uy tín.
3. Không ghi giá kèm chữ (`5,5 tỷ`) — chỉ ghi số.
4. Không gộp ô (merge) trong vùng dữ liệu, không để dữ liệu ở sheet thứ hai.
5. Không ghi số nhà chính xác khi chủ nhà chưa đồng ý.

**Được phép làm cho dễ nhìn:** tô màu · in đậm · giãn cột · đóng băng dòng · đổi thứ tự cột ·
đổi tên cột sang tiếng Việt có dấu · thêm cột riêng (STT, ghi chú) · chèn dòng tiêu đề trang trí phía trên.
Hệ thống vẫn đọc đúng.

---

## 7. TỰ KIỂM TRƯỚC KHI GIAO

Rà lại từng dòng, dòng nào không qua được thì **sửa hoặc bỏ**, đừng giao dòng lỗi:

- [ ] `tieu_de` ≥ 30 ký tự · `mo_ta` ≥ 50 ký tự
- [ ] `loai_hinh` khớp đúng danh mục theo `muc_dich`
- [ ] `tinh_thanh` + `phuong_xa` chép từ `provincesNew.ts`, đúng chính tả có dấu
- [ ] `dien_tich` có số · `gia` chỉ có số, dấu phẩy thập phân
- [ ] `ma_anh` có mã · trong thư mục `anh/` có đủ ảnh `-1`, `-2`… cho mã đó
- [ ] Không trùng với tin đã giao hôm trước (so tiêu đề + địa chỉ + số điện thoại)
- [ ] Đủ định mức: **50 tin · 10 tin mỗi khu vực · khoảng 7 bán – 3 thuê mỗi khu vực**

Ghi kết quả vào `bao-cao.txt`: tổng số tin · số tin theo từng khu vực (đủ/thiếu bao nhiêu so với 10) ·
số tin bán/thuê · dòng nào phải bỏ và vì sao · tin nào còn thiếu ảnh.

---

## 8. SAU KHI GIAO — CHỦ DỰ ÁN LÀM

1. Mở `Bang-<ngày>.csv` bằng Excel, đọc lại nội dung, sửa câu chữ cho đúng ý.
2. Xem lại ảnh trong thư mục `anh/`, bỏ ảnh xấu, đổi ảnh đại diện nếu cần.
3. Liên hệ người đăng để xác minh tin còn hiệu lực.
4. Vào `/admin/tin-dang/nhap-hang-loat` → tải file → tải hết ảnh một lượt →
   xem bảng xem trước (dòng đỏ = lỗi, dòng vàng = chưa có ảnh) → bấm **Đăng**.
5. Tin lên web trong vòng 60 giây.
