# ĐỀ BÀI CHO COWORK — GOM TIN BĐS MIỀN TRUNG HÀNG NGÀY

> File này là **đề bài giao cho Cowork** (hoặc bất kỳ ai/công cụ nào làm việc gom tin).
> Đọc xong là làm được, không cần hỏi lại.
>
> **Năm câu tóm gọn cả việc:**
> 1. Điền **đúng theo file mẫu** — đúng tên cột, đúng định dạng từng ô.
>    Trường **bắt buộc** phải có đủ; trường khác **có thì lấy hết, không có thì để trống**.
> 2. Nội dung **lấy y nguyên của người đăng**, không viết lại, không thêm thắt, không bịa.
> 3. **Ảnh: KHÔNG cần tải về.** Chỉ cần ghi **đủ link ảnh trực tiếp** vào cột `link_anh`
>    (ngăn bằng `\|`) và điền `ma_anh`. Chủ dự án bấm `TAI-ANH-VA-KIEM.bat` là tải hết,
>    đặt tên chuẩn và kiểm ảnh tự động — xem mục 5E.
> 4. **CHỌN TIN THEO ẢNH TRƯỚC: cạnh NGẮN của ảnh nguồn phải ≥ 1200px.**
>    Tin không có ảnh, hoặc ảnh cạnh ngắn dưới 900px → **BỎ TIN, tìm tin khác**.
>    Lý do: chủ dự án còn cắt lại ảnh về 4:3 rồi mới đăng, cắt là mất bớt, phóng to không cứu được.
> 5. **Ảnh kém thì bỏ tin · thiếu chữ thì vẫn giao.** Thiếu pháp lý/hướng/số điện thoại…
>    thì để trống ô đó, dán link vào `nguon`, ghi rõ thiếu gì vào `ghi_chu`. Đừng đoán.

---

## 1. MỖI NGÀY GIAO GÌ — VÀ LƯU VÀO ĐÂU

Thư mục làm việc **đã dựng sẵn trên máy chủ dự án**:

```
C:\Users\X1 GEN 8\Projects\TIN-HANG-NGAY\
│
├── _MAU\                          ← KHUÔN GỐC, KHÔNG SỬA, KHÔNG XOÁ
│   ├── mau-nhap-tin-hang-loat.csv
│   ├── DANH-SACH-PHUONG-XA-MIEN-TRUNG.txt   ← 734 phường/xã, chép tên từ đây
│   └── DE-BAI-CHO-COWORK.md       ← chính file này
│
├── Tin-2026-08-30\                ← gói của ngày, mỗi ngày một thư mục
│   ├── Bang-2026-08-30.csv        ← bảng tin (đã tạo sẵn, chỉ việc điền)
│   ├── anh\
│   │   ├── da-nang\               ← ảnh Đà Nẵng
│   │   ├── hue\
│   │   ├── quy-nhon\
│   │   ├── nha-trang\
│   │   └── phan-thiet\
│   ├── bao-cao.txt                ← khung sẵn, điền vào chỗ chấm
│   └── KIEM-ANH.html              ← công cụ tự tạo, xem mục 5E
│
├── TAI-ANH-VA-KIEM.bat            ← chủ dự án bấm 2 lần để tải hết ảnh
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
| `link_anh` | **LUÔN LUÔN ghi đủ link ảnh trực tiếp** (`…jpg`), ngăn nhau bằng `\|` — **kể cả khi đã tải ảnh về rồi**. Chủ dự án cần để tải lại và đối chiếu. Không có link ảnh thì ghi link tin gốc |
| `ghi_chu` | Thiếu gì, vướng gì: `tin không ghi diện tích` · `nghi trùng tin hôm qua` · `giá bất thường` |

> Ba cột này **không lên web**, chỉ để chủ dự án mở link vào lấy nốt phần còn thiếu.

---

## 2. ĐỊNH MỨC MỖI NGÀY — 34 TIN, 5 KHU VỰC

**Mỗi khu vực phải có CẢ tin mua bán LẪN tin cho thuê**, tỷ lệ khoảng **70% bán · 30% thuê**.

| # | Khu vực | Tỉnh MỚI (ghi vào `tinh_thanh`) | Địa bàn trọng tâm | Tin/ngày | Mã ảnh |
|---|---|---|---|---|---|
| 1 | **Đà Nẵng** | `Đà Nẵng` | Sơn Trà · An Hải · Hải Châu · Ngũ Hành Sơn · Hòa Xuân · Hội An · Điện Bàn | **10** | `dn01`–`dn10` |
| 2 | **Huế** | `Huế` | Phú Xuân · Thuận Hóa · Vỹ Dạ · An Cựu · Thuận An · Hương Thủy | **6** | `hue01`–`hue06` |
| 3 | **Quy Nhơn** | `Gia Lai` | Quy Nhơn · Quy Nhơn Bắc/Nam/Đông/Tây · An Nhơn | **6** | `qnhon01`–`qnhon06` |
| 4 | **Nha Trang** | `Khánh Hòa` | Nha Trang · Bắc/Tây/Nam Nha Trang · Cam Ranh | **6** | `nt01`–`nt06` |
| 5 | **Phan Thiết** | `Lâm Đồng` | Phan Thiết · Mũi Né · Phú Thủy · Tiến Thành · Bình Thuận · La Gi | **6** | `pt01`–`pt06` |
| | | | **Tổng** | **34** | |

⚠️ **Hai tỉnh dễ ghi nhầm** — sáp nhập 2025 đổi tỉnh chủ quản:
- **Quy Nhơn** nay thuộc tỉnh **Gia Lai** (Bình Định đã nhập vào Gia Lai)
- **Phan Thiết** nay thuộc tỉnh **Lâm Đồng** (Bình Thuận đã nhập vào Lâm Đồng)

Ghi `tinh_thanh` = `Bình Định` hay `Bình Thuận` là **sai**, tin sẽ không lọc được theo khu vực.

**Khu vực dự bị** — khi một khu vực không gom đủ số: Quảng Nam/Hội An (thuộc `Đà Nẵng`),
Quảng Ngãi, Quảng Trị, Đắk Lắk. Danh sách phường/xã của cả 8 tỉnh có trong
`_MAU\DANH-SACH-PHUONG-XA-MIEN-TRUNG.txt`.

> Không gom đủ số tin **thật** cho một khu vực thì giao thiếu và ghi rõ trong `bao-cao.txt` —
> **tuyệt đối không bịa thêm cho đủ số.**

---

## 2B. NGUỒN TIN — THỨ TỰ ƯU TIÊN (chủ dự án đã chốt)

Làm theo đúng thứ tự này. Chất lượng tin quan trọng hơn tốc độ gom.

| # | Nguồn | Vì sao xếp ở đây |
|---|---|---|
| 1 | **batdongsan.com.vn** | **Nguồn chính.** Tin cập nhật liên tục, nhiều nhất, ảnh to và rõ, nội dung đầy đủ nhất |
| 2 | **homedy.com** | Tin có kiểm duyệt, ảnh khá, mô tả đủ |
| 3 | **mogi.vn** | Tương tự Homedy |
| 4 | **alonhadat.com.vn** | **Lấy ít thôi** — tin không xác thực, ảnh xấu (đo thật: tối đa 670px), nội dung thiếu. Chỉ dùng khi ba nguồn trên không đủ số |
| 5 | Nhóm **Zalo · Facebook** | Tin tươi nhất nhưng cần đăng nhập — xem ghi chú dưới |

**Cách tìm:** trên chính trang đó, lọc theo **tỉnh + loại hình**, sắp xếp **Tin mới nhất**,
lấy tin đăng trong **3 ngày gần đây**. Tin cũ hơn phần lớn đã bán hoặc đã cho thuê.

### Tiêu chí chọn tin — CHẤT LƯỢNG TRƯỚC, SỐ LƯỢNG SAU

Thà giao 8 tin tốt còn hơn 10 tin cẩu thả. Đứng trước 2 tin thì lấy tin nào **điểm cao hơn**:

| Ưu tiên lấy | Bỏ qua |
|---|---|
| **Nhiều ảnh, ảnh to rõ** — **cạnh NGẮN ≥ 1200px** | Tin 1 ảnh mờ, ảnh chụp màn hình, ảnh dính watermark to |
| **Mô tả đầy đủ** — kết cấu, vị trí, pháp lý, giá | Mô tả 1–2 dòng cụt, chỉ có số điện thoại |
| **Có đủ**: diện tích · giá · số phòng · hướng · pháp lý | Thiếu cả giá lẫn diện tích |
| Có **tên + số điện thoại** người đăng | Không có cách nào liên hệ |
| Có **video** (YouTube / clip nhà) — cột `video` | |
| Địa chỉ rõ tới tên đường | Chỉ ghi tên tỉnh chung chung |
| Tin đăng **trong 3 ngày** | Tin cũ hơn 1 tháng |

Tin nào không đủ tiêu chí thì **bỏ, tìm tin khác** — đừng cố nhét cho đủ số.
Cả khu vực không đủ tin tốt thì giao thiếu và ghi rõ trong `bao-cao.txt`.

#### Vì sao ảnh phải có cạnh NGẮN ≥ 1200px

Chủ dự án còn phải **cắt lại ảnh về tỷ lệ 4:3** rồi mới đăng. Cắt là **mất bớt**,
không bao giờ thêm được. Nên phải chừa dư ngay từ ảnh nguồn:

| Ảnh nguồn | Cắt 4:3 ra | Dùng được? |
|---|---|---|
| 1600 × 1200 (bản gốc batdongsan) | 1600 × 1200 | ✅ Đạt |
| 1600 × 900 | 1200 × 900 | ⚠️ Vừa đủ |
| 956 × 717 | 956 × 717 | ❌ Mờ |
| 670 × 502 (alonhadat) | 670 × 502 | ❌ Hỏng hẳn |

**Phóng to ảnh nhỏ KHÔNG cứu được.** Đã thử thật: kéo ảnh 670px lên 2048px là phóng
306%, chỉ ra ảnh nhoè to hơn. Ảnh nhỏ mà nét vẫn hơn ảnh to mà mờ.

Vì vậy: **thấy tin ảnh nhỏ thì bỏ luôn tin đó, tìm tin khác** — đừng giao rồi ghi chú.

### Cột `video` — có thì lấy

Tin gốc có video (YouTube, Vimeo, hoặc file `.mp4`) thì dán link vào cột **`video`**,
nhiều link ngăn bằng `|`. Trang chi tiết tự tách ra mục Video riêng.

**Video KHÔNG thay được ảnh** — tin chỉ có video mà không có ảnh vẫn tính là thiếu ảnh.

**Hai vướng đã biết trước ở batdongsan.com.vn** — gặp thì xử lý thế này, đừng dừng lại:

1. **Cloudflare chặn** (`Just a moment…`, lỗi 403). Đã thử thực tế, có xảy ra.
   Vào được bằng công cụ đọc web thì cứ lấy. Không vào được thì **chuyển sang Homedy/Mogi**
   và **ghi vào `bao-cao.txt`**. Không tìm cách vượt lớp kiểm tra đó.
2. **Số điện thoại bị giấu sau nút “Hiện số”.** Không bấm được thì:
   → `lien_he_sdt` để trống · `ghi_chu` = `số ẩn, bấm "Hiện số" ở link nguon`
   → **`nguon` phải có link tin gốc** — chủ dự án đằng nào cũng mở link đó để xin ảnh gốc,
   bấm luôn "Hiện số" một thể, không mất thêm bước nào.

**Nhóm Zalo / Facebook:** máy không vào được (phải đăng nhập). Đây là phần **chủ dự án tự lấy tay** —
thấy tin hay thì dán link vào cột `nguon` của bảng ngày hôm đó, Cowork điền nốt các cột còn lại.

**Nguồn tốt nhất, không phải xin ai:** form “Đăng tin” trên chính `coastalland.vn`,
Fanpage / Zalo OA, và môi giới gửi thẳng qua Zalo cho chủ dự án.

---

## 2C. SÁU LỖI CỦA ĐỢT 30/08 VÀ 02/09 — KHÔNG ĐƯỢC LẶP LẠI

> Hai đợt vừa rồi chủ dự án phải sửa tay hơn 20 tin vì mấy lỗi dưới đây. Đọc kỹ mục này.

**1. Giữ NGUYÊN xuống dòng và gạch đầu dòng của người đăng.**
Người đăng viết mỗi ý một dòng (`- Diện tích: 68m²` · `+ Tầng 2: 2 phòng ngủ`) thì ô `mo_ta`
phải xuống dòng y như vậy — trong Excel xuống dòng trong ô bằng **Alt + Enter**.
Dồn hết thành MỘT ĐOẠN DÀI là sai: lên web đọc như một cục chữ, khách bỏ đi.
*Đợt 30/08 có 21/34 tin bị dồn thành một đoạn.*

**2. Không viết lại, không tóm tắt, không thêm câu của mình.**
Đợt 02/09 cả 50 tin đều dài đúng 400–470 chữ, văn phong giống hệt nhau — đó là **viết lại**
chứ không phải chép. Có tin còn lòi ra câu của người gom:
*“Tin gốc niêm yết giá theo m2, cần đối chiếu lại tại link nguồn”* — câu này lên web là hỏng.
Muốn nhắc gì cho chủ dự án thì ghi vào cột `ghi_chu`, KHÔNG ghi vào `mo_ta`.

**3. Không làm vỡ số.**
`2.000m2` không được thành `2. 000m2` · `11,5 tỷ` không được thành `11. 5 tỷ` ·
`700.000đ` không được thành `700. 000đ`. Lỗi này sinh ra khi dán qua công cụ trung gian —
dán xong phải đọc lại cột `mo_ta` một lượt.

**4. Mã tin nào có trong bảng thì thư mục ảnh phải có ảnh của mã đó.**
Đợt 02/09 giao 10 tin Quảng Trị nhưng ảnh chỉ có tới `qtri08` — hai tin `qtri09`, `qtri10`
không đăng được, phải gạt ra. **Thiếu ảnh thì bỏ hẳn tin đó khỏi bảng.**

**5. VIDEO — đây là chỗ tốn dung lượng nhất, làm sai là web hết chỗ đăng tin.**
Kho ảnh của web chỉ có 1GB, mà 55 video đã ăn hết **1GB** (mỗi video 16–44MB, bằng cả trăm tấm ảnh).
Từ nay:
· **KHÔNG tải video về máy nữa.** Chỉ **dán link video** (YouTube hoặc link gốc) vào cột `video`.
· Mỗi tin **tối đa 1 video**. Đã có link rồi thì đừng kèm thêm tệp, và ngược lại.
· Tên tệp (khi nào chủ dự án yêu cầu tải) đặt gọn: `dn02-video.mp4` — đợt 02/09 đặt thành
  `dn02-video.mp4.mp4`, thừa đuôi.

**6. Chia làm nhiều đợt thì mỗi đợt MỘT FILE RIÊNG.**
Đừng giao một file 50 tin rồi dặn “đợt 1 lấy 33 tin đầu”. Web đọc cả file nên tin của đợt sau
vẫn nhảy vào bảng chờ đăng, chủ dự án phải ngồi gạt ra từng dòng.
Đặt tên rõ: `Bang-<ngày>-DOT-1.csv`, `Bang-<ngày>-DOT-2.csv`; ảnh cũng tách thư mục theo đợt.

---

## 3. ĐỊA GIỚI — BẮT BUỘC DÙNG HỆ MỚI 2 CẤP

Từ 2025 **không còn Quận/Huyện**. Chỉ có: **Tỉnh/Thành → Phường/Xã**.

- `tinh_thanh` = tên tỉnh trong bảng mục 2 (ghi đúng chính tả, có dấu).
- `phuong_xa` = tên phường/xã, **ghi cả chữ “Phường”/“Xã”** — vd `Phường Sơn Trà`, `Xã Hòa Vang`.
- **Danh sách phường/xã để chép:** `_MAU\DANH-SACH-PHUONG-XA-MIEN-TRUNG.txt`
  — 734 phường/xã của 8 tỉnh, đã lọc sẵn. **Chép từ file đó ra, không tự gõ theo trí nhớ.**
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
| `lien_he_ten` | Tên người đăng |
| `lien_he_sdt` | **QUAN TRỌNG NHẤT trong nhóm này.** Số điện thoại người đăng. Tin có **nhiều số thì ghi đủ**, ngăn bằng `\|` — vd `0905123456 \| 0935777888`. Chỉ ghi chữ số |
| `lien_he_email` | Email người đăng nếu tin có. Không có thì để trống |

> **Vì sao số điện thoại và email quan trọng hơn các cột khác:** tin này là chủ dự án
> **đăng hộ** người bán. Sau này người bán tạo tài khoản trên web, hệ thống dựa vào
> **số điện thoại / email** để trả tin về đúng tài khoản của họ — khỏi phải đăng lại.
> Thiếu số là mất luôn mối nối đó, sau không sửa được. **Khách hay có 2 số → ghi đủ cả hai.**
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
| Đà Nẵng | `anh\da-nang\` | `dn01` … `dn10` | `dn01-1.jpg`, `dn01-2.jpg`… |
| Huế | `anh\hue\` | `hue01` … `hue06` | `hue01-1.jpg`… |
| Quy Nhơn | `anh\quy-nhon\` | `qnhon01` … `qnhon06` | `qnhon01-1.jpg`… |
| Nha Trang | `anh\nha-trang\` | `nt01` … `nt06` | `nt01-1.jpg`… |
| Phan Thiết | `anh\phan-thiet\` | `pt01` … `pt06` | `pt01-1.jpg`… |

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
| **1. Tải được ảnh** (tốt nhất) | Lấy được file về máy | `ma_anh` = `dn01`, ảnh để trong `anh\da-nang\` tên `dn01-1.jpg`… |
| **2. Không tải được nhưng có link ảnh trực tiếp** | Link kết thúc bằng `.jpg` / `.png` | Vẫn ghi `ma_anh` = `dn01` như thường, **để trống cột `anh`**, và xuất thêm file **`tai-anh-<ngày>.ps1`** (xem dưới) để chủ dự án tải ảnh về bằng một cú double-click |
| **3. Không có ảnh nào** | Tin gốc không đăng ảnh · ảnh nằm sau đăng nhập | **BỎ TIN, tìm tin khác.** Tin nào cũng phải có ảnh thật mới đăng được |

> ⛔ **TUYỆT ĐỐI KHÔNG dán link ảnh của trang khác vào cột `anh`.**
> Web chỉ nhận ảnh từ kho ảnh riêng (`supabase.co`). Link từ alonhadat, chotot,
> batdongsan… sẽ **bị chặn và ảnh vỡ trắng** trên trang. Ngoài ra ảnh vẫn nằm trên
> máy chủ của họ — họ đổi hoặc xoá là tin của mình mất ảnh.
>
> ✅ **Link ảnh để ở cột `link_anh`** — cột này web bỏ qua, nhưng chủ dự án cần nó
> để tải lại ảnh và đối chiếu. **Mọi dòng có ảnh đều phải có link ảnh ở đây**,
> kể cả dòng đã tải ảnh về đủ. Nhiều link ngăn nhau bằng `\|`.

**File `tai-anh-<ngày>.ps1` — cách chuyển ảnh về máy chủ dự án**

Đặt trong thư mục ngày, nội dung là danh sách `tên tệp → link ảnh`, chạy bằng PowerShell trên
máy chủ dự án (máy đó không bị chặn mạng). Đặt sẵn **đúng tên chuẩn `dn01-1.jpg`** ngay trong
script, tải xong là dùng được luôn, không phải đổi tên tay.

**Dòng ở mức 3 sẽ báo đỏ “Thiếu ảnh” trong bảng xem trước — đúng như vậy.** Đó là cách web nhắc
chủ dự án còn tin chưa có ảnh. Mở `link_anh`, xin ảnh, tải lên là hết đỏ.

### 5D. NGƯỠNG ẢNH — ĐO THEO CẠNH NGẮN

Nhiều trang rao vặt chỉ cho tải bản **thu nhỏ**. Đã đo thực tế: ảnh trên
**alonhadat.com.vn tối đa 670px** — cắt 4:3 xong là mờ nhoè, không đăng được.

**Đo theo CẠNH NGẮN**, không phải cạnh dài. Vì chủ dự án còn cắt lại ảnh về tỷ lệ **4:3**
trong Photoshop rồi mới đăng, mà cắt 4:3 thì **cạnh ngắn quyết định** kích thước ảnh ra:

| Cạnh NGẮN ảnh nguồn | Cắt 4:3 ra | Làm gì |
|---|---|---|
| **≥ 1200px** | ≥ 1600 × 1200 | ✅ Lấy — đây là chuẩn nhắm tới |
| **900 – 1200px** | ~1200 × 900 | ⚠️ Tạm được, ghi `ảnh hơi nhỏ` vào `ghi_chu` |
| **< 900px** | mờ | ❌ **BỎ TIN, tìm tin khác** — đừng giao rồi ghi chú |

Bản gốc batdongsan (bỏ đoạn `/resize/1275x717/`) đúng **1600 × 1200** → cắt 4:3 ra đúng
1600 × 1200, không mất gì. Đó là mức nên nhắm.

**Phóng to ảnh nhỏ KHÔNG cứu được.** Đã thử thật: kéo 670px lên 2048px là phóng 306%,
chỉ ra ảnh nhoè to hơn. Ảnh gốc trong điện thoại người đăng luôn 2000–4000px — chủ dự án
gọi xin là có ngay, vừa nét vừa sạch watermark. **Đó mới là ảnh đăng lên web.**

### 5E. CÔNG CỤ TẢI ẢNH — CHỦ DỰ ÁN BẤM 2 LẦN LÀ XONG

Trong `TIN-HANG-NGAY\` có sẵn **`TAI-ANH-VA-KIEM.bat`**. Bấm hai lần là nó:

0. **Tự chuẩn hoá bảng** — việc máy làm được thì máy làm, chủ dự án khỏi sửa tay:
   · cấp `ma_anh` cho dòng còn trống (tự điền vào chỗ khuyết: `dn04`, không nối đuôi `dn06`)
   · bỏ emoji, hashtag, dấu chấm lặp, gạch trang trí trong tiêu đề & mô tả
   · tiêu đề VIẾT HOA TOÀN BỘ → Viết Hoa Đầu Từ
   · `gia`, `dien_tich`, `phong_ngu`, `phong_tam` chỉ giữ số (`5,5 tỷ` → `5,5`)
   · `lien_he_sdt` chỉ giữ chữ số
   Bản trước khi sửa lưu thành `Bang-<ngày>.goc.csv`. **Phải đóng Excel** thì mới ghi được.
1. Đọc `link_anh` của mọi dòng trong bảng ngày mới nhất
2. **Tải hết ảnh** về đúng thư mục khu vực, đặt sẵn tên `dn01-1.jpg`, `dn01-2.jpg`…
   (8 ảnh cùng lúc · ảnh đã có thì bỏ qua nên chạy lại bao nhiêu lần cũng được)
3. **Đo từng ảnh** rồi mở **`KIEM-ANH.html`** — một trang xem nhanh: mỗi tin một khối,
   ảnh hiện thành hình nhỏ, dưới mỗi ảnh ghi `1600×1200 · 340KB`, ảnh nhỏ hơn 1000px
   được **viền vàng**, tin chưa có ảnh **viền đỏ**. Nhìn một lượt là biết phải xin ảnh tin nào.

**Vì vậy nhiệm vụ của Cowork về ảnh rút gọn còn đúng một việc: ghi ĐỦ LINK ẢNH vào cột
`link_anh`.** Không cần tự tải, không cần tự đặt tên, không cần viết script — công cụ lo hết.
Link nào cũng phải là link ảnh trực tiếp (kết thúc `.jpg` / `.png` / `.webp`), ngăn nhau bằng `|`.

**Ghi link Y NHƯ trang đó cho, đừng tự sửa** — kể cả link có đoạn thu nhỏ, vd
`file4.batdongsan.com.vn/resize/1275x717/2026/07/31/abc.jpg`. Công cụ **tự bỏ đoạn
`/resize/…/` để lấy bản gốc**: đã đo thật, `956×717` (mờ) → `1600×1200` (đạt chuẩn).

**Lấy ĐỦ ảnh, không phải một tấm.** Trang batdongsan nạp thư viện ảnh bằng JavaScript nên
nhìn nguồn trang chỉ thấy 1 link đại diện, trong khi tin có 8–20 ảnh. Cố lấy hết; thật sự
chỉ lấy được 1 thì ghi `ghi_chu` = `chỉ lấy được 1 ảnh, mở link nguon để lấy đủ`.

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
3. **Không bỏ bớt ảnh.** Tin có bao nhiêu ảnh thì ghi đủ bấy nhiêu link (xem mục 5).
4. **Phân biệt rõ hai trường hợp — đừng lẫn:**
   · **Ảnh KHÔNG ĐẠT CHUẨN** (tin không có ảnh nào · cạnh ngắn < 900px)
     → **BỎ TIN, tìm tin khác.** Đừng giao rồi ghi chú.
   · **Ảnh đạt chuẩn nhưng thiếu thông tin khác** (thiếu pháp lý, hướng, số điện thoại…)
     → **VẪN GIAO**, để trống ô đó, dán link vào `nguon` và ghi thiếu gì vào `ghi_chu`.
   Nói gọn: **ảnh kém thì bỏ tin · thiếu chữ thì vẫn giao.**
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
      **Không dòng nào được để trống cả hai.** Tin không có ảnh đạt chuẩn thì đã bỏ từ đầu.
- [ ] `nguon` có **link tin gốc** · `lien_he_sdt` có số của người đăng — chủ dự án cần hai cái này
      để gọi xin phép và vào lấy nốt phần thiếu
- [ ] Ô nào không có trong tin gốc thì **để trống**, không đoán — ghi thiếu gì vào `ghi_chu`
- [ ] **Chống trùng với các ngày trước:** trước khi gom, mở tất cả file `Bang-*.csv` trong
      `TIN-HANG-NGAY\` và `TIN-HANG-NGAY\DA-DANG\`. Tin mới bị coi là **trùng** khi
      **cùng số điện thoại VÀ cùng địa chỉ/diện tích/giá** → bỏ, ghi vào `bao-cao.txt`.
      Chỉ trùng số điện thoại thôi thì **KHÔNG phải trùng** — một môi giới đăng nhiều căn khác nhau
      là bình thường, bỏ đi là mất tin thật.
- [ ] Đủ định mức theo bảng mục 2: **tổng 34 tin** — Đà Nẵng 10 · Huế 6 · Quy Nhơn 6 ·
      Nha Trang 6 · Phan Thiết 6. Mỗi khu vực phải có **cả tin bán lẫn tin thuê** (~70/30)
- [ ] `tinh_thanh` của Quy Nhơn ghi là `Gia Lai`, của Phan Thiết ghi là `Lâm Đồng` — không phải
      `Bình Định` / `Bình Thuận`

Ghi kết quả vào `bao-cao.txt`: tổng số tin · số tin từng khu vực (đủ/thiếu bao nhiêu so với định mức) ·
số tin bán/thuê · **số tin đã bỏ vì ảnh không đạt** · **danh sách dòng còn thiếu thông tin và thiếu gì** ·
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
| Tải ảnh nằm sau đăng nhập, hoặc trong app | **Không** | Bỏ tin đó, tìm tin khác có ảnh công khai |
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
