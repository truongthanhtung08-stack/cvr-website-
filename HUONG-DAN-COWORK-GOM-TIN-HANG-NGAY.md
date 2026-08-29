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

### Bảng phải làm ĐÚNG theo file mẫu

**File mẫu:** `mau-nhap-tin-hang-loat.csv` (tải trên web tại
`/admin/tin-dang/nhap-hang-loat` → nút **“Tải file mẫu”**). Đây là khuôn bắt buộc — web đọc file
bằng **tên cột**, sai tên là không đọc được.

1. Mở file mẫu, **giữ nguyên dòng tên cột (dòng 1)**, xoá 15 dòng ví dụ, điền tin thật từ dòng 2.
2. **Không đổi tên cột, không xoá cột, không đổi thứ tự** — cứ để y nguyên cho chắc.
3. Mỗi dòng đúng **một tin**. Không gộp ô, không để tin ở sheet thứ hai.
4. Lưu lại dạng **`.csv` (UTF-8)** hoặc **`.xlsx`** — web đọc được cả hai.
5. **Được phép thêm cột riêng ở cuối** — web bỏ qua cột lạ. Bắt buộc thêm 2 cột này để chủ dự án
   kiểm tra và biên tập:

| Cột thêm | Ghi gì |
|---|---|
| `nguon` | Link / nơi lấy tin (link tin gốc, tên nhóm, ngày giờ thấy tin) |
| `ghi_chu` | Điều Cowork thấy đáng lưu ý: tin nghi trùng, giá bất thường, ảnh mờ, thiếu thông tin… |

> Hai cột này **không lên web**, chỉ để chủ dự án đối chiếu và gọi xác minh.

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
| `tieu_de` | **Lấy đúng tiêu đề người đăng viết.** Nếu ngắn hơn **30 ký tự** thì nối thêm thông tin **đã có sẵn trong chính tin đó** (loại hình, phường/xã, diện tích) cho đủ — vd `Bán nhà Sơn Trà` → `BÁN NHÀ RIÊNG 62M2 PHƯỜNG SƠN TRÀ, ĐÀ NẴNG`. **Không thêm chi tiết người đăng không nói** |
| `mo_ta` | **Chép nguyên mô tả của người đăng**, chỉ bỏ phần rác (hashtag, "LH em zalo", câu mời chào lặp). Nếu ngắn hơn **50 ký tự** thì nối thêm thông tin có sẵn trong tin (diện tích, số phòng, pháp lý, vị trí). Không bịa thêm |
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

**TẢI VỀ HẾT.** Tin có bao nhiêu ảnh thì lấy đủ bấy nhiêu, **không tự lọc, không tự bỏ ảnh xấu** —
chủ dự án sẽ chọn và xếp lại sau. Lấy bản **to nhất / rõ nhất** mà tin có.

**Cách đặt tên (dùng cái này):** cột `ma_anh` ghi mã `tin01`, ảnh lưu vào thư mục `anh/` với tên
`tin01-1.jpg`, `tin01-2.jpg`, `tin01-3.jpg`… **đánh số đúng thứ tự ảnh xuất hiện trong tin gốc**.
Hệ thống tự gom về đúng tin, **ảnh `-1` là ảnh đại diện**.

**Cách thay thế:** để trống `ma_anh`, ghi thẳng tên ảnh vào cột `anh`, ngăn nhau bằng `|`:
`condotel-nha-trang-1.jpg | condotel-nha-trang-2.jpg`. Ảnh ghi trước là ảnh đại diện.

**Web chỉ đăng N ảnh đầu theo hạng tin** — thừa thì bị cắt, nhưng **cứ tải hết về**,
chủ dự án đổi thứ tự / đổi hạng tin rồi mới đăng:

| Hạng | basic | silver | gold | diamond |
|---|---|---|---|---|
| Số ảnh được đăng | 7 | 10 | 12 | 15 |

Mỗi tệp ≤ 10MB. Web tự thu nhỏ và **đóng dấu chìm “COASTAL LAND”** khi tải lên — không cần tự làm.
Ảnh nào > 10MB thì ghi vào `bao-cao.txt`, đừng tự nén.

---

## 6. TUYỆT ĐỐI KHÔNG

1. **Không tự viết lại, không thêm thắt, không "làm cho hay hơn".**
   Ghi **đúng theo tin của người đăng**: nội dung của họ, giá của họ, ảnh của họ,
   tên và số điện thoại của họ. Việc biên tập là của chủ dự án ở bước sau, không phải của Cowork.
2. **Không bịa tin.** Không có tin thật thì để trống dòng đó và ghi vào `bao-cao.txt`.
   Thiếu số còn hơn có tin ma — khách gọi vào không có nhà là mất uy tín.
3. **Không bỏ bớt ảnh.** Tin có bao nhiêu ảnh tải về hết bấy nhiêu (xem mục 5).
4. Không ghi giá kèm chữ (`5,5 tỷ`) — chỉ ghi số.
5. Không gộp ô (merge) trong vùng dữ liệu, không để dữ liệu ở sheet thứ hai.
6. Không đổi tên cột trong file mẫu, không xoá cột.

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
- [ ] `ma_anh` có mã · trong thư mục `anh/` có **đủ toàn bộ** ảnh của tin, đánh số `-1`, `-2`…
- [ ] `nguon` có link/nơi lấy tin · `lien_he_sdt` có số của người đăng (hai cột này chủ dự án cần để gọi xin phép)
- [ ] Không trùng với tin đã giao hôm trước (so tiêu đề + địa chỉ + số điện thoại)
- [ ] Đủ định mức theo bảng mục 2: **tổng 50 tin** (Đà Nẵng 12 · Huế 10 · Nha Trang 10 ·
      Quy Nhơn 8 · Quảng Ngãi 5 · Quảng Trị 5), mỗi khu vực khoảng **70% bán – 30% thuê**

Ghi kết quả vào `bao-cao.txt`: tổng số tin · số tin theo từng khu vực (đủ/thiếu bao nhiêu so với 10) ·
số tin bán/thuê · dòng nào phải bỏ và vì sao · tin nào còn thiếu ảnh.

---

## 8. SAU KHI GIAO — CHỦ DỰ ÁN LÀM

Gói Cowork giao là **bản ghi thô**, chưa phải tin đăng. Thứ tự làm:

1. **Liên hệ người đăng** (cột `lien_he_sdt`, đối chiếu cột `nguon`) — xác minh tin còn hiệu lực.
2. **Xin phép** được đăng tin và dùng ảnh của họ.
3. **Chỉnh sửa lại** tiêu đề, mô tả, giá, thông tin liên hệ trong file `Bang-<ngày>.csv`.
4. **Chọn và xếp lại ảnh** trong thư mục `anh/` — bỏ ảnh xấu, đưa ảnh đẹp nhất về `-1` (ảnh đại diện).
5. Vào `/admin/tin-dang/nhap-hang-loat` → tải file → tải hết ảnh một lượt →
   xem bảng xem trước (**đỏ** = dòng sai phải sửa · **vàng** = chưa có ảnh nên chưa đăng được) →
   bấm **Đăng**.
6. Tin lên web trong vòng 60 giây.

> Người đăng không đồng ý → **xoá dòng đó khỏi file**, không đăng.
