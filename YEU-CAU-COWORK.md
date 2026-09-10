# YÊU CẦU CHO COWORK — COASTAL LAND

> **ĐÂY LÀ TÀI LIỆU DUY NHẤT — DÙNG CHUNG CHO MỌI NGÀY.**
> Mọi bản cũ (DE-BAI-CHO-COWORK, YEU-CAU-COWORK-FINAL, LENH-COWORK,
> YEU-CAU-COWORK-30-08…) đã bỏ. Đọc hết file này là làm được, không cần hỏi lại.
>
> File này **không gắn với ngày nào cả**. Mỗi ngày chủ dự án chỉ nhắn một câu kèm
> **ngày cần làm**; mọi luật lệ đều nằm sẵn ở đây và **không đổi theo ngày**.
> Ở đâu viết `<NGÀY>` thì thay bằng ngày của gói đang làm, dạng `NĂM-THÁNG-NGÀY`
> — ví dụ ngày 10 tháng 9 năm 2026 → `2026-09-10`.
>
> Website đang **thu tiền khách hàng thật**. Sai một tin là mất uy tín với người trả tiền
> — yêu cầu ở đây là **làm chuẩn, không làm nhanh**. Chỗ nào không chắc thì **để trống và
> ghi vào `ghi_chu`**, tuyệt đối không đoán, không bịa.

---

## 📌 TÓM TẮT MỘT PHÚT

Mỗi ngày giao **hai gói**, vào **đúng ba file**, trong thư mục của ngày hôm đó:

| Gói | File | Nội dung |
|---|---|---|
| **A** | `Bang-<ngày>.csv` | **34 tin** bất động sản · 48 cột |
| **B** | `TinTuc-<ngày>.csv` | **5 bài** tin tức chuẩn SEO · 9 cột |
| — | `bao-cao.txt` | Báo cáo chung cho cả hai gói |

**Sáu câu gói gọn cả việc:**

1. **Gói A: chép Y NGUYÊN của người đăng.** Không viết lại, không tóm tắt, không thêm thắt.
2. **Gói B: TỰ VIẾT.** Cấm sao chép bài báo khác dù một đoạn.
3. **Sửa gì của tin gốc là phải ghi vào `ghi_chu`** — không ghi thì chủ dự án không có cách nào biết.
4. **Ảnh: không tải về.** Chỉ ghi đủ link ảnh trực tiếp vào `link_anh`; công cụ trên máy chủ dự án lo hết.
5. **Chọn tin theo ảnh trước:** cạnh NGẮN của ảnh nguồn phải **≥ 1200px**. Dưới 900px → **bỏ tin**.
6. **Ảnh kém thì bỏ tin · thiếu chữ thì vẫn giao** (để trống ô đó + ghi `ghi_chu`).

---

## 1. BA BÊN LÀM GÌ — RANH GIỚI KHÔNG ĐƯỢC LẤN

| Bên | Làm gì | TUYỆT ĐỐI KHÔNG |
|---|---|---|
| **1. Cowork** | Gom tin BĐS + viết 5 bài tin tức, điền đúng khuôn bảng, quy đổi giá/diện tích/loại hình/địa giới | Viết lại nội dung tin gốc · tóm tắt · thêm câu của mình · đoán ô trống · bịa số liệu · tự chấm hạng tin |
| **2. Chủ dự án** | Gọi người đăng xin phép, lấy nốt phần thiếu, chọn và cắt ảnh, duyệt bài, nâng hạng tin, bấm Đăng | — |
| **3. Claude Code** | Sửa web để mọi ô trong bảng lên đúng chỗ, tự dịch cách viết đời thường về danh mục chuẩn, tự bắt lỗi trước khi đăng | — |

**Đích ngắm:** mỗi ngày chủ dự án chỉ còn **hai việc tay** — *thêm số điện thoại* và *sửa ảnh*.
Mọi thứ khác phải đúng sẵn từ bảng Cowork giao.

> ### ⚖️ LUẬT GHI CHÚ — quan trọng nhất cả file
> Cowork **sửa bất kỳ chữ nào** của tin gốc thì **BẮT BUỘC** ghi vào cột `ghi_chu`:
> `đã sửa tiêu đề: <lý do>` · `đã sửa mô tả: <lý do>`.
> Web **bôi vàng** đúng những dòng đó để chủ dự án mở tin gốc đối chiếu.
> **Sửa mà không ghi chú = tin sai lên web, không ai biết.**

> ### 🚫 COASTAL LAND LÀ CỔNG THÔNG TIN, KHÔNG PHẢI MÔI GIỚI
> Áp dụng cho **cả tin đăng lẫn bài viết**. Coastal Land **không** phân phối, không ký gửi,
> không môi giới, không định giá, không đứng ra giao dịch.
> Cấm mọi câu kiểu *"Coastal Land nhận ký gửi"*, *"liên hệ Coastal Land để được tư vấn mua"*,
> *"đội ngũ môi giới của chúng tôi"*. Giao dịch là việc giữa **người mua và người đăng tin**.

---

## 2. THƯ MỤC LÀM VIỆC

```
C:\Users\X1 GEN 8\Projects\TIN-HANG-NGAY\
│
├── _MAU\                                   ← KHUÔN GỐC. KHÔNG SỬA, KHÔNG XOÁ.
│   ├── YEU-CAU-COWORK.md                   ← chính file này
│   ├── mau-nhap-tin-hang-loat.csv          ← khuôn GÓI A (48 cột + 17 dòng ví dụ)
│   ├── mau-tin-tuc-hang-ngay.csv           ← khuôn GÓI B (9 cột + 2 bài mẫu)
│   ├── DANH-SACH-PHUONG-XA-MIEN-TRUNG.txt  ← 734 phường/xã, chép tên từ đây
│   └── anh-tin.mjs                         ← công cụ của chủ dự án, Cowork không dùng
│
├── Tin-<NGÀY>\                             ← gói của ngày, mỗi ngày một thư mục
│   ├── Bang-<NGÀY>.csv                     ← GÓI A
│   ├── TinTuc-<NGÀY>.csv                   ← GÓI B
│   ├── bao-cao.txt                         ← báo cáo chung
│   └── anh\  (da-nang · hue · quy-nhon · nha-trang · phan-thiet)
│
└── DA-DANG\                                ← đăng xong, chủ dự án kéo cả thư mục ngày vào đây
```

**Ngày hôm sau:** chép thư mục ngày cũ thành `Tin-<ngày mới>`, xoá sạch nội dung bên trong
(giữ nguyên cấu trúc thư mục con), rồi làm tiếp.

**Đúng ba file. Không tạo file phụ, không tạo bản v2, không tạo file `.ps1` tải ảnh.**

**Chia nhiều đợt thì mỗi đợt MỘT FILE RIÊNG** — `Bang-<ngày>-DOT-1.csv`, `Bang-<ngày>-DOT-2.csv`;
ảnh cũng tách thư mục theo đợt. Đừng giao một file 50 tin rồi dặn *"đợt 1 lấy 33 dòng đầu"* —
web đọc cả file, tin đợt sau vẫn nhảy vào bảng.

---
---

# 🅰️ GÓI A — 34 TIN BẤT ĐỘNG SẢN

## A1. Định mức — 34 tin, 5 khu vực

| Khu vực | `tinh_thanh` (hệ MỚI) | Địa bàn trọng tâm | Tin/ngày | Mã ảnh |
|---|---|---|---|---|
| **Đà Nẵng** | `Đà Nẵng` | Sơn Trà · An Hải · Hải Châu · Ngũ Hành Sơn · Hòa Xuân · Hội An · Điện Bàn | **10** | `dn01`–`dn10` |
| **Huế** | `Huế` | Phú Xuân · Thuận Hóa · Vỹ Dạ · An Cựu · Thuận An · Hương Thủy | **6** | `hue01`–`hue06` |
| **Quy Nhơn** | **`Gia Lai`** | Quy Nhơn · Quy Nhơn Bắc/Nam/Đông/Tây · An Nhơn | **6** | `qnhon01`–`qnhon06` |
| **Nha Trang** | **`Khánh Hòa`** | Nha Trang · Bắc/Tây/Nam Nha Trang · Cam Ranh | **6** | `nt01`–`nt06` |
| **Phan Thiết** | **`Lâm Đồng`** | Phan Thiết · Mũi Né · Phú Thủy · Tiến Thành · La Gi | **6** | `pt01`–`pt06` |
| | | **Tổng** | **34** | |

Mỗi khu vực phải có **cả tin mua bán LẪN tin cho thuê**, tỷ lệ khoảng **70% bán · 30% thuê**.

⚠️ **Hai tỉnh dễ ghi nhầm** — sáp nhập 2025 đổi tỉnh chủ quản:
**Quy Nhơn** nay thuộc **Gia Lai** · **Phan Thiết** nay thuộc **Lâm Đồng**.
Ghi `Bình Định` / `Bình Thuận` là **SAI**, tin không lọc được theo khu vực.

**Khu vực dự bị** khi một khu vực không gom đủ: Quảng Nam/Hội An (thuộc `Đà Nẵng`),
Quảng Ngãi, Quảng Trị, Đắk Lắk.

> Không gom đủ số tin **thật** thì **giao thiếu** và ghi rõ trong `bao-cao.txt` —
> **tuyệt đối không bịa thêm cho đủ số.**

## A2. Địa giới — BẮT BUỘC dùng hệ MỚI 2 cấp

Từ 2025 **không còn Quận/Huyện**. Chỉ có: **Tỉnh/Thành → Phường/Xã**.

- `tinh_thanh` = tên tỉnh trong bảng A1, đúng chính tả, có dấu.
- `phuong_xa` = tên phường/xã, **ghi cả chữ "Phường"/"Xã"** — vd `Phường Sơn Trà`, `Xã Hòa Vang`.
- **Chép từ `DANH-SACH-PHUONG-XA-MIEN-TRUNG.txt`, không tự gõ theo trí nhớ.** Sai một chữ là tin chìm.
- **Tin gốc ghi theo địa giới CŨ** ("Quận Hải Châu", "Phường Mỹ An, Ngũ Hành Sơn"): tìm phường/xã
  MỚI gần đúng nhất, **đồng thời chép nguyên chữ trong tin gốc vào `ghi_chu`** —
  vd `tin gốc ghi: Mỹ An, Ngũ Hành Sơn`. **Đừng bỏ tin chỉ vì địa danh cũ.**
- Địa danh quen thuộc vẫn còn, chỉ đổi cấp: `Phường Hội An`, `Phường Điện Bàn` (Đà Nẵng) ·
  `Phường Quy Nhơn` (Gia Lai) · `Phường Nha Trang` (Khánh Hòa) · `Phường Đông Hà` (Quảng Trị).
- Cột `quan_huyen` **không có trong mẫu mới** — đừng thêm vào.

## A3. Nguồn tin — thứ tự ưu tiên

| # | Nguồn | Vì sao xếp ở đây |
|---|---|---|
| 1 | **batdongsan.com.vn** | **Nguồn chính.** Cập nhật liên tục, nhiều nhất, ảnh to rõ, nội dung đầy đủ nhất |
| 2 | **homedy.com** | Tin có kiểm duyệt, ảnh khá, mô tả đủ |
| 3 | **mogi.vn** | Tương tự Homedy |
| 4 | **alonhadat.com.vn** | **Lấy ít thôi** — tin không xác thực, ảnh xấu (đo thật: tối đa 670px). Chỉ dùng khi ba nguồn trên không đủ |
| 5 | Nhóm **Zalo · Facebook** | Cần đăng nhập → **bỏ qua**, chủ dự án tự lấy tay |

**Cách tìm:** trên chính trang đó, lọc theo **tỉnh + loại hình**, sắp xếp **Tin mới nhất**,
lấy tin đăng trong **3 ngày gần đây**.

**Hai vướng đã biết trước ở batdongsan.com.vn:**

1. **Cloudflare chặn** (`Just a moment…`, lỗi 403). Vào được thì cứ lấy; không vào được thì
   **chuyển sang Homedy/Mogi** và **ghi vào `bao-cao.txt`**. Không tìm cách vượt lớp kiểm tra đó.
2. **Số điện thoại giấu sau nút "Hiện số".** Không bấm được thì: `lien_he_sdt` để trống ·
   `ghi_chu` = `số ẩn, bấm "Hiện số" ở link nguon` · **`nguon` phải có link tin gốc**.

### Tiêu chí chọn tin — CHẤT LƯỢNG TRƯỚC, SỐ LƯỢNG SAU

| Ưu tiên lấy | Bỏ qua |
|---|---|
| **Nhiều ảnh, ảnh to rõ** — cạnh NGẮN ≥ 1200px | Tin 1 ảnh mờ, ảnh chụp màn hình, watermark to |
| **Mô tả đầy đủ** — kết cấu, vị trí, pháp lý, giá | Mô tả 1–2 dòng cụt, chỉ có số điện thoại |
| Có đủ diện tích · giá · số phòng · hướng · pháp lý | Thiếu cả giá lẫn diện tích |
| Có **tên + số điện thoại** người đăng | Không có cách nào liên hệ |
| Có **video** (YouTube) | |
| Địa chỉ rõ tới tên đường | Chỉ ghi tên tỉnh chung chung |
| Tin đăng **trong 3 ngày** | Tin cũ hơn 1 tháng |

Tin không đủ tiêu chí thì **bỏ, tìm tin khác** — đừng cố nhét cho đủ số.

## A4. Tiêu đề — ưu tiên GIỮ NGUYÊN tin gốc

Người bán tự đặt tiêu đề bao giờ cũng sát thực tế hơn câu do máy ghép.
**Chỉ sửa khi không đạt chuẩn SEO:**

| Tiêu đề gốc | Vì sao phải sửa | Sửa thành |
|---|---|---|
| `Bán nhà Sơn Trà` | dưới 30 ký tự, Google coi là tiêu đề rỗng | `BÁN NHÀ RIÊNG 62M2 PHƯỜNG SƠN TRÀ, ĐÀ NẴNG` |
| `🔥🔥 SIÊU PHẨM GIÁ SẬP SÀN 🔥🔥` | không có thông tin nào | Loại hình + diện tích + phường/xã |
| `Chính chủ cần bán gấp LH 0905…` | có số điện thoại trong tiêu đề | Bỏ số, thay bằng loại hình + khu vực |
| `bán nhà 3 tầng kiệt ô tô hà bổng` | viết thường toàn bộ | Viết Hoa Đầu Từ, giữ nguyên chữ |

**Chỉ được ghép thông tin ĐÃ CÓ SẴN trong chính tin đó** (loại hình · diện tích · phường/xã ·
số phòng). Không thêm chi tiết người đăng không nói.

➜ Sửa xong ghi `ghi_chu` = `đã sửa tiêu đề: gốc ngắn 15 ký tự`.

## A5. Nội dung (`mo_ta`) — GIỮ NGUYÊN xuống dòng và ngắt đoạn

Đây là chỗ hỏng đi hỏng lại. Người đăng viết mỗi ý một dòng thì ô `mo_ta` phải xuống dòng y như vậy:

```
- Diện tích: 68m2, kết cấu 3 tầng
- Tầng 1: phòng khách, bếp, 1 wc
- Tầng 2: 2 phòng ngủ, 1 wc

Pháp lý sổ hồng riêng, công chứng ngay.
```

Trong Excel: **xuống dòng trong ô bằng Alt + Enter**. **Dòng trống = ngắt đoạn**, web giữ đúng cả hai.
Dán qua công cụ trung gian là **dồn hết thành một cục chữ** — lên web khách đọc không nổi, bỏ đi ngay.

**Chỉ được sửa mô tả khi:**
- **Ngắn dưới 50 ký tự** → nối thêm thông tin có sẵn trong tin (diện tích, số phòng, pháp lý, vị trí).
- **Có rác**: hashtag, emoji, `LH em zalo`, câu mời chào lặp, số điện thoại rải giữa bài.

➜ Sửa xong ghi `ghi_chu` = `đã sửa mô tả: bỏ hashtag và số điện thoại`.

**Không viết lại, không tóm tắt, không thêm câu của mình.** Đã có đợt cả 50 tin dài đúng
400–470 chữ, văn phong giống hệt nhau — đó là **viết lại** chứ không phải chép. Có tin còn lòi
ra câu của người gom: *"Tin gốc niêm yết giá theo m2, cần đối chiếu lại tại link nguồn"* —
câu này lên web là hỏng. Muốn nhắc gì cho chủ dự án thì ghi vào `ghi_chu`, **không ghi vào `mo_ta`**.

**Không làm vỡ số:** `2.000m2` ≠ `2. 000m2` · `11,5 tỷ` ≠ `11. 5 tỷ` · `700.000đ` ≠ `700. 000đ`.
Lỗi này sinh ra khi dán qua công cụ trung gian — dán xong phải đọc lại cột `mo_ta` một lượt.

> Web tự bắt lỗi này: mô tả dài trên 250 ký tự mà **không có một lần xuống dòng nào** sẽ bị
> **bôi vàng** kèm dòng chữ *"Mô tả dồn thành MỘT ĐOẠN"*.

## A6. Giá

| Loại tin | Cột `gia` | Ví dụ |
|---|---|---|
| **BÁN** | theo **TỶ**, chỉ ghi số, dấu **phẩy** thập phân | `5,5` = 5,5 tỷ |
| **THUÊ** | theo **TRIỆU/tháng** | `18` = 18 triệu/tháng |
| Thoả thuận / LH | **để trống** | |

⚠️ Ghi `5.5` sẽ ra 5,5 — nhưng ghi `5,5 tỷ` (kèm chữ) là **lỗi**.

**Quy đổi từ chữ người đăng viết:**

| Người đăng viết | Ghi vào `gia` |
|---|---|
| `5,5 tỷ` · `5ty5` · `5 tỷ 500` | `5,5` |
| `1 tỷ 250` · `1ty25` · `1250 triệu` | `1,25` |
| `850 triệu` · `850tr` | `0,85` |
| `12tr/tháng` · `12 triệu/th` (tin thuê) | `12` |
| `7tr5` (tin thuê) | `7,5` |
| `giá thương lượng` · `LH` · `thoả thuận` | **để trống** |

## A7. ⚠️ ĐƠN GIÁ THUÊ NHÀ XƯỞNG · KHO BÃI · VĂN PHÒNG · MẶT BẰNG

> **Đợt vừa rồi sai HẾT nhóm này.** Đọc kỹ mục này trước khi gom tin cho thuê.

Bốn loại hình này thị trường **không báo tổng tiền mỗi tháng**, mà báo **ĐƠN GIÁ theo m²**:

> *"Cho thuê xưởng 2.000m², giá **35.000đ/m²/tháng**"*

Ghi `35` vào cột `gia` là web hiểu **35 triệu/tháng** — sai gấp đôi.
Tự nhân ra `70` cũng dễ sai (nhầm dấu chấm, nhầm bậc giá).

**Chép NGUYÊN con số đơn giá theo NGÀN ĐỒNG vào cột `don_gia_thue`. KHÔNG nhân, KHÔNG tính nhẩm.**

| Tin gốc ghi | `don_gia_thue` | `dien_tich` | `gia` | Web tự tính ra |
|---|---|---|---|---|
| 35.000đ/m²/tháng, 2.000m² | `35` | `2000` | **để trống** | 70.000.000 đ/tháng · hiện thêm "35.000 đ/m²/tháng" |
| 25.000đ/m²/tháng, 5.000m² | `25` | `5000` | **để trống** | 125.000.000 đ/tháng |
| 120.000đ/m²/tháng (văn phòng), 90m² | `120` | `90` | **để trống** | 10.800.000 đ/tháng |
| Tin báo trọn gói 18 triệu/tháng | để trống | `90` | `18` | 18.000.000 đ/tháng |

### Đơn giá BẬC THANG theo diện tích

Tin kho xưởng rất hay niêm yết hai mức:

> *"Dưới 1.000m²: **35.000đ/m²** · Trên 1.000m²: **25.000đ/m²**"*

➜ Ghi **đúng mức áp cho diện tích của chính tin đó**. Tin 2.000m² thì `don_gia_thue` = `25`,
không phải `35`. Chép cả câu hai mức vào `ghi_chu`.

### Diện tích phải CHÍNH XÁC

Nhóm này diện tích tính bằng **ngàn m²** (2.000 · 5.000 · 10.000 m²).
**Sai một số 0 là tiền thuê sai gấp 10 lần.** Đọc kỹ tin gốc, không làm tròn, không đoán.
Bộ lọc trên web đã có sẵn các mức 500–1.000 · 1.000–2.000 · 2.000–5.000 · trên 5.000 m².

### Cột riêng của kho / nhà xưởng — có thì lấy hết

| Cột | Ghi gì | Ví dụ |
|---|---|---|
| `dien_tich_su_dung` | Diện tích xưởng/kho thực dùng (m²) | `2000` |
| `loai_kho` | `Xưởng sản xuất` · `Kho hàng khô` · `Kho lạnh` · `Kho + xưởng` · `Bãi / đất trống` | `Xưởng sản xuất` |
| `chieu_cao` | Chiều cao thông thuỷ (m) — quyết định xếp mấy tầng hàng | `9` |
| `tai_trong_nen` | Tải trọng nền | `3 tấn/m2` |
| `cong_suat_dien` | Công suất điện | `560 KVA` |
| `pccc` | `Đã có` · `Chưa có` | `Đã có` |
| `van_phong_trong_kho` | Văn phòng trong khuôn viên (m²) | `120` |
| `xe_container` | `Container 40 feet` · `Container 20 feet` · `Xe tải nhỏ` | `Container 40 feet` |
| `duong_vao` | Bề rộng đường container (m) | `12` |

**Mọi tin CHO THUÊ** (không riêng kho xưởng) còn có hai cột khách hỏi đầu tiên:
`thoi_han_thue` (`3 năm`) · `tien_coc` (`3 tháng`).

> Xem hai dòng ví dụ `tin16` (nhà xưởng) và `tin17` (kho bãi) trong file mẫu.

## A8. Diện tích

| Người đăng viết | Ghi vào `dien_tich` |
|---|---|
| `5x20` · `5m x 20m` | `100` |
| `100m2` · `100 m²` | `100` |
| `DT 62,5m2` | `62,5` |
| `1 sào` | để trống + ghi `ghi_chu` |
| Không nói diện tích | **để trống**, `ghi_chu` = `tin không ghi diện tích` |

Chỉ ghi **số**, không ghi `62m2`.

## A9. Loại hình — chép đúng nguyên văn

**Khi `muc_dich = ban`:**
Căn hộ · Chung cư · Nhà riêng · Nhà mặt phố · Nhà biệt thự / Liền kề ·
Shophouse / Nhà phố thương mại · Đất nền / Đất nền dự án · Đất nông nghiệp ·
Villa / Biệt thự biển · Condotel · Đất công nghiệp · Kho / Nhà xưởng · Bất động sản khác

**Khi `muc_dich = thue`:**
Căn hộ · Chung cư · Căn hộ dịch vụ · Nhà riêng · Nhà mặt phố · Nhà phố thương mại ·
Biệt thự / Liền kề · Nhà trọ / Phòng trọ · Văn phòng · Mặt bằng / Cửa hàng bán lẻ ·
Thuê đất / Nhà xưởng / Kho bãi · Bất động sản khác

> Danh mục bán và thuê **khác nhau**. `Văn phòng` chỉ có ở cho thuê, `Condotel` chỉ có ở mua bán.

**Dịch chữ đời thường sang danh mục:**

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

## A10. Số điện thoại — 10 chữ số, CÓ SỐ 0 ĐỨNG ĐẦU

| Tin gốc ghi | Ghi vào `lien_he_sdt` |
|---|---|
| `0905.123.456` · `0905 123 456` | `0905123456` |
| `+84 905 123 456` · `84905123456` | `0905123456` |
| `905123456` (rơi mất số 0) | `0905123456` |
| Số cố định `0236 3825 888` | `02363825888` (11 số — giữ nguyên, không cắt) |
| Tin có **2 số** | `0905123456 \| 0935777888` — **ghi đủ cả hai** |

Không dấu chấm, không khoảng trắng, không `+84`.

> **Vì sao đây là cột quan trọng nhất sau nhóm bắt buộc:** tin này là chủ dự án **đăng hộ**
> người bán. Sau này người bán tạo tài khoản trên web, hệ thống dựa vào **số điện thoại / email**
> để trả tin về đúng tài khoản của họ — khỏi phải đăng lại. Thiếu số là mất luôn mối nối đó,
> sau không sửa được.

## A11. Tên dự án

`ten_du_an` = tên dự án **đúng như tin gốc** (`Monarchy`, `The Sang Residence`).
Trang tin hiện ngay tên đó **kể cả khi dự án chưa được tạo trong admin** — chủ dự án cập nhật
dự án sau, hệ thống tự nối vào. **Đừng bỏ trống vì "chưa thấy dự án này trên web".**

## A12. Tiện ích · Nội thất · Pháp lý — chép đúng danh mục

Trang tin chỉ hiện mục **khớp danh mục chuẩn**. Web đã được sửa để **tự dịch** những cách viết
quen thuộc, nhưng chép đúng ngay từ đầu vẫn chắc hơn.

**`tien_ich` — nội khu:**
Hồ bơi · Phòng gym · Công viên cây xanh · Khu BBQ · Sân chơi trẻ em · Thang máy ·
Hầm / bãi đỗ xe · An ninh 24/7 · Camera giám sát · Khu thương mại

**`tien_ich` — xung quanh:**
Gần biển · Gần sông / hồ · Gần chợ / siêu thị · Gần trường học · Gần bệnh viện ·
Gần TTTM · Gần công viên · Gần sân bay · Mặt tiền đường lớn · Gần khu hành chính

**`noi_that_ban_giao`:**
Điều hoà · Tủ lạnh · Máy giặt · Bếp từ / gas · Máy hút mùi · Tủ bếp · Giường ngủ ·
Tủ quần áo · Sofa · Bàn ăn · Bình nóng lạnh · Rèm cửa · Tivi · Lò vi sóng ·
Bàn làm việc · Đèn trang trí

**`phap_ly`:**
Sổ đỏ / Sổ hồng chính chủ · Hợp đồng mua bán · Đang chờ sổ · Sổ chung / vi bằng · Đang cập nhật

**`tinh_trang_noi_that`:**
Bàn giao thô · Nội thất cơ bản · Nội thất đầy đủ · Nội thất cao cấp

**`huong` / `huong_ban_cong`:**
Đông · Tây · Nam · Bắc · Đông Bắc · Đông Nam · Tây Bắc · Tây Nam

**Web tự dịch sẵn những cách viết này** (ghi kiểu nào cũng đúng):

| Hay viết | Web hiểu là |
|---|---|
| Bảo vệ 24/7 · Lễ tân 24/7 · Bảo vệ | An ninh 24/7 |
| Hầm xe · Bãi xe · Chỗ để xe · Gara | Hầm / bãi đỗ xe |
| Bể bơi · Hồ bơi riêng · Hồ bơi vô cực | Hồ bơi |
| Gym · Phòng tập | Phòng gym |
| Gần chợ · Gần siêu thị | Gần chợ / siêu thị |
| Máy lạnh · Máy điều hoà | Điều hoà |
| Máy nước nóng · Nóng lạnh | Bình nóng lạnh |
| Bếp ga · Bếp gas · Bếp từ · Bếp điện | Bếp từ / gas |
| Sổ hồng riêng · Sổ đỏ · Sổ hồng lâu dài · Chính chủ | Sổ đỏ / Sổ hồng chính chủ |
| Đầy đủ · Full nội thất | Nội thất đầy đủ |

Mục thật sự không có trong danh mục (`Kiệt ô tô`, `Gần KCN`, `Wifi miễn phí`) thì **cứ ghi** —
trang tin hiện ở nhóm **"Tiện ích khác"**, không bị mất.

## A13. Ảnh

**CHỌN TIN THEO ẢNH TRƯỚC.** Đo theo **CẠNH NGẮN**, không phải cạnh dài — vì chủ dự án còn
cắt lại ảnh về tỷ lệ **4:3** rồi mới đăng, mà cắt 4:3 thì cạnh ngắn quyết định:

| Cạnh NGẮN ảnh nguồn | Cắt 4:3 ra | Làm gì |
|---|---|---|
| **≥ 1200px** | ≥ 1600 × 1200 | ✅ Lấy — đây là chuẩn nhắm tới |
| **900 – 1200px** | ~1200 × 900 | ⚠️ Tạm được, ghi `ảnh hơi nhỏ` vào `ghi_chu` |
| **< 900px** | mờ | ❌ **BỎ TIN, tìm tin khác** — đừng giao rồi ghi chú |

**Phóng to ảnh nhỏ KHÔNG cứu được.** Đã thử thật: kéo 670px lên 2048px chỉ ra ảnh nhoè to hơn.

### Nhiệm vụ về ảnh của Cowork rút gọn còn ĐÚNG MỘT VIỆC

**Ghi ĐỦ LINK ẢNH trực tiếp vào cột `link_anh`**, ngăn nhau bằng `|`.
Không cần tải, không cần đặt tên, không cần viết script — công cụ trên máy chủ dự án lo hết.

| Cột | Ghi gì |
|---|---|
| `ma_anh` | Mã của tin, có tiền tố khu vực: `dn01`, `hue01`, `nt01`… (một mã cho cả tin, dù tin có 10 ảnh) |
| `link_anh` | **TOÀN BỘ** link ảnh trực tiếp (`.jpg`/`.png`/`.webp`), ngăn bằng `\|` |
| `anh` | **ĐỂ TRỐNG.** Dán link trang ngoài vào đây là ảnh vỡ trắng trên web |

- **Ghi link Y NHƯ trang đó cho, đừng tự sửa** — kể cả link có đoạn thu nhỏ
  `file4.batdongsan.com.vn/resize/1275x717/…`. Công cụ **tự bỏ đoạn `/resize/…/`** để lấy bản gốc
  (đã đo thật: `956×717` mờ → `1600×1200` đạt chuẩn).
- **Lấy ĐỦ ảnh, không phải một tấm.** Trang batdongsan nạp thư viện ảnh bằng JavaScript nên nhìn
  nguồn trang chỉ thấy 1 link, trong khi tin có 8–20 ảnh. Thật sự chỉ lấy được 1 thì ghi
  `ghi_chu` = `chỉ lấy được 1 ảnh, mở link nguon để lấy đủ`.
- **Tối đa 15 ảnh/tin** (web đăng nhiều nhất 15 ảnh — hạng Diamond). Nhiều hơn thì lấy 15 link
  đầu và ghi `còn N ảnh nữa` vào `ghi_chu`.
- **Tin gốc không có ảnh nào → BỎ TIN, tìm tin khác.** Tin nào cũng phải có ảnh thật mới đăng được.

### Video

Tin gốc có video thì dán **link YouTube** vào cột `video`. **Mỗi tin tối đa 1 video.**
**KHÔNG tải tệp video về** — kho ảnh của web chỉ 1GB, mà 55 video đã ăn hết 1GB.
**Video KHÔNG thay được ảnh:** tin chỉ có video mà không có ảnh vẫn tính là thiếu ảnh.

## A14. Lấy hết thông tin — càng đầy đủ càng tốt

Mỗi ô điền được là một tín hiệu để Google xếp hạng trang tin, và là một câu khách khỏi phải gọi hỏi.
Thứ tự ưu tiên khi thời gian có hạn:

1. `lien_he_sdt` · `nguon` · `link_anh` — thiếu là mất mối, không cứu lại được
2. `dien_tich` · `gia` (hoặc `don_gia_thue`) · `phap_ly` · `huong`
3. `dia_chi` (tên đường) · `ten_du_an` · `phong_ngu` · `phong_tam`
4. `tien_ich` · `noi_that_ban_giao` · `tinh_trang_noi_that`
5. `so_tang` · `mat_tien` · `chieu_dai` · `duong_vao` · `nam_xay_dung` · `tang_so` + bộ kho xưởng ở A7

**Lấy đủ ≠ đoán bừa.** Ô nào tin gốc không nói thì **để trống**, ghi thiếu gì vào `ghi_chu`.

## A15. Bảng cột đầy đủ — 48 cột

> ### ⚠️ FILE MẪU ĐÃ ĐỔI: 25 CỘT → 48 CỘT
> Bản Cowork dùng trước đây chỉ có **25 cột**, thiếu 23 cột — trong đó có cả `nguon`,
> `link_anh`, `ghi_chu`, `duong_vao`, `mat_tien`, `so_tang`.
> **Tải lại `mau-nhap-tin-hang-loat.csv`.** Dùng bản cũ là mất dữ liệu đã gom.

Giữ nguyên dòng tên cột, **không đổi tên, không xoá cột, không đổi thứ tự**.
Mỗi dòng đúng một tin. Lưu dạng **`.csv` (UTF-8)** hoặc **`.xlsx`** — web đọc được cả hai.

| Nhóm | Cột |
|---|---|
| **Bắt buộc** — thiếu là web báo đỏ, không đăng được | `tieu_de` · `mo_ta` · `dien_tich` · `muc_dich` · `loai_hinh` · `tinh_thanh` · `phuong_xa` · `ma_anh` |
| **Giá** | `gia` · **`don_gia_thue`** ⭐ |
| **Quy mô, kích thước** | `duong_vao` · `mat_tien` · `so_tang` · **`chieu_dai`** ⭐ · **`nam_xay_dung`** ⭐ · **`tang_so`** ⭐ · `phong_ngu` · `phong_tam` |
| **Kho · nhà xưởng · bãi** | **`dien_tich_su_dung`** ⭐ · **`loai_kho`** ⭐ · **`chieu_cao`** ⭐ · **`tai_trong_nen`** ⭐ · **`cong_suat_dien`** ⭐ · **`pccc`** ⭐ · **`van_phong_trong_kho`** ⭐ · **`xe_container`** ⭐ |
| **Riêng tin cho thuê** | `thoi_gian_du_kien_vao_o` · **`thoi_han_thue`** ⭐ · **`tien_coc`** ⭐ · `muc_gia_dien` · `muc_gia_nuoc` |
| **Vị trí** | `dia_chi` · `ten_du_an` |
| **Thuộc tính** | `hang_tin` *(LUÔN để trống)* · `phap_ly` · `huong` · `huong_ban_cong` · `tinh_trang_noi_that` · `noi_that_ban_giao` · `tien_ich` |
| **Liên hệ** | `lien_he_ten` · `lien_he_sdt` · `lien_he_email` |
| **Nội bộ** *(không lên web)* | `ghi_chu` · `nguon` · `link_anh` |
| **Ảnh / video** | `anh` *(để trống)* · `video` |

⭐ = **14 cột MỚI** so với bản mẫu 25 cột trước đây.

**`hang_tin` LUÔN ĐỂ TRỐNG.** Cowork không quyết hạng tin — chủ dự án tự nâng khi đăng.
**`nguon`** — mọi dòng đều phải có **link tin gốc**. Không có link thì ghi nơi lấy + ngày giờ thấy tin.

---
---

# 🅱️ GÓI B — 5 BÀI TIN TỨC MỖI NGÀY, CHUẨN SEO

> Mục tiêu: **traffic tự nhiên từ Google**. Bài viết là thứ kéo người lạ vào web mà không mất
> tiền quảng cáo. Chủ dự án đọc → duyệt → đăng trong ngày.
> **Thà 3 bài thật tốt còn hơn 5 bài viết lấy lệ.**

## B1. Định mức — 5 bài, phân theo chuyên mục

Web có sẵn **6 chuyên mục**. Mỗi ngày phân bổ:

| # | `chuyen_muc` | Bài/ngày | Viết về gì |
|---|---|---|---|
| 1 | **Phân tích thị trường** | **2** | Giá, nguồn cung, giao dịch, xu hướng theo **từng khu vực Miền Trung** |
| 2 | **Cẩm nang** | **1** | Hướng dẫn thực dụng: xem nhà, kiểm pháp lý, đo hướng, tránh bẫy |
| 3 | Luân phiên: **Đầu tư** · **Tài chính** · **Quy hoạch** · **Dự án** | **2** | Mỗi ngày chọn 2 chuyên mục khác nhau, xoay vòng cho đủ tuần |

Chuyên mục chỉ được chọn trong **6 tên này**, chép đúng nguyên văn:
`Phân tích thị trường` · `Cẩm nang` · `Đầu tư` · `Tài chính` · `Quy hoạch` · `Dự án`

**Địa bàn:** ưu tiên **Đà Nẵng · Huế · Quy Nhơn · Nha Trang · Phan Thiết**.
Mỗi ngày phải có **ít nhất 3 bài gắn địa danh cụ thể** — đây là điểm mạnh cạnh tranh của
Coastal Land so với các trang toàn quốc.

## B2. Chuẩn SEO longtail — luật cứng

**Longtail** = cụm từ khoá dài, cụ thể, ít người tranh. Đó là thứ Coastal Land thắng được.

| ❌ Từ khoá ngắn (không tranh nổi) | ✅ Longtail (nhắm vào đây) |
|---|---|
| `giá đất Đà Nẵng` | `giá đất nền quận Ngũ Hành Sơn Đà Nẵng tháng 9 2026` |
| `mua nhà` | `kinh nghiệm mua nhà kiệt ô tô Đà Nẵng tránh dính quy hoạch` |
| `cho thuê kho` | `giá thuê nhà xưởng khu công nghiệp Hoà Khánh Đà Nẵng` |
| `đầu tư bất động sản` | `có nên đầu tư condotel Nha Trang năm 2026 không` |

**Mỗi bài chọn ĐÚNG MỘT từ khoá chính**, ghi vào `tu_khoa_chinh`, và từ khoá đó phải xuất hiện
đủ **5 chỗ**:

- [ ] **Tiêu đề** (`tieu_de`) — càng gần đầu càng tốt
- [ ] **Mô tả ngắn** (`mo_ta_ngan`)
- [ ] **Đoạn mở đầu** của nội dung (100 chữ đầu)
- [ ] **Ít nhất 1 tiêu đề phụ**
- [ ] **Slug**

**Mật độ tự nhiên 1–2%.** Nhồi từ khoá là bị Google phạt — viết cho người đọc trước.

## B3. Từng ô phải viết thế nào

| Cột | Luật | Ví dụ |
|---|---|---|
| `tieu_de` | **50–65 ký tự**, chứa từ khoá chính, không viết hoa toàn bộ, không emoji, không câu giật gân | `Giá đất nền Ngũ Hành Sơn Đà Nẵng tháng 9/2026 tăng hay giảm?` |
| `chuyen_muc` | Chép **đúng một** trong 6 tên ở B1 | `Phân tích thị trường` |
| `slug` | Không dấu, chữ thường, nối bằng `-`, **tối đa 8 từ**, không có ngày tháng | `gia-dat-nen-ngu-hanh-son-da-nang` |
| `mo_ta_ngan` | **120–160 ký tự.** Đây là dòng Google hiện dưới tiêu đề — phải hấp dẫn và chứa từ khoá. Một câu, không dấu ba chấm | `Cập nhật giá đất nền Ngũ Hành Sơn Đà Nẵng tháng 9/2026 theo từng tuyến đường, kèm phân tích nguồn cung và lời khuyên cho người mua ở thực.` |
| `noi_dung` | **800–1.200 từ.** **Mỗi ĐOẠN xuống 1 dòng** (Alt + Enter). Tiêu đề phụ viết thành **một dòng riêng**. Xem bố cục ở B4 | |
| `anh` | **Link ảnh trực tiếp** (`.jpg`/`.png`/`.webp`), ngang **≥ 1200px**, tỷ lệ **16:9**, **liên quan thật** tới bài | |
| `tu_khoa_chinh` | Đúng **một** cụm longtail | `giá đất nền Ngũ Hành Sơn Đà Nẵng` |
| `nguon` | **Bắt buộc.** Link các trang đã tham khảo, ngăn bằng `\|`. Bài có số liệu thì **link tới đúng nguồn số liệu đó** | |
| `ghi_chu` | Số liệu chưa chắc · nguồn bị chặn · ảnh chưa ưng ý | `số liệu quý 2 lấy từ báo cáo Savills, chưa có quý 3` |

> **Hai bài trong `mau-tin-tuc-hang-ngay.csv` là BÀI MẪU RÚT GỌN** (~380 từ), chỉ để xem
> **cấu trúc và cách xuống dòng trong ô Excel**. Bài thật phải đủ **800–1.200 từ**.
> Số liệu trong bài mẫu là ví dụ — **không dùng lại**.

## B4. Bố cục một bài — bắt buộc

```
[Đoạn mở — 2 đến 3 câu]
Trả lời NGAY câu hỏi trong tiêu đề. Chứa từ khoá chính. Không vòng vo,
không "trong bối cảnh thị trường bất động sản hiện nay…".

Bối cảnh khu vực
[2–3 đoạn] Vị trí, hạ tầng, những gì đã và đang thay đổi ở khu vực đó.

Số liệu và diễn biến giá
[2–3 đoạn] Con số cụ thể, có mốc thời gian, có nguồn. Nên có 1 bảng nhỏ
so sánh theo tuyến đường / theo loại hình / theo quý.

Nguyên nhân
[2–3 đoạn] Vì sao tăng, vì sao giảm — hạ tầng, quy hoạch, nguồn cung, tín dụng.

Người mua nên làm gì
[2–3 đoạn] Lời khuyên thực dụng, phân biệt rõ mua ở thực và mua đầu tư.

Kết
[1 đoạn] Tóm lại 2–3 ý. KHÔNG kêu gọi liên hệ Coastal Land để mua bán.
```

- **4–6 tiêu đề phụ**, mỗi tiêu đề một dòng riêng.
- **Đoạn ngắn: 2–4 câu.** Đoạn dài là người đọc trên điện thoại bỏ đi.
- Có ít nhất **một danh sách gạch đầu dòng** hoặc **một bảng**.
- Viết **tiếng Việt có dấu**, giọng bình thường, không sáo rỗng, không "chuyên gia nhận định"
  chung chung.

## B5. Nguồn tham khảo

| Loại | Nguồn |
|---|---|
| Số liệu thị trường | Savills VN · CBRE VN · Batdongsan.com.vn (báo cáo quý) · Hội Môi giới BĐS VN (VARS) |
| Chính sách, quy hoạch | Cổng thông tin điện tử **Đà Nẵng · Huế · Gia Lai · Khánh Hòa · Lâm Đồng** · Bộ Xây dựng |
| Tài chính, lãi suất | Ngân hàng Nhà nước · website các ngân hàng thương mại |
| Tin tức | VnExpress · Tuổi Trẻ · Thanh Niên · Báo Đầu tư · CafeLand |

Nguồn bị chặn (Cloudflare, cần đăng nhập) → **ghi vào `bao-cao.txt`**, chuyển nguồn khác,
đừng tìm cách vượt.

---
---

# 📊 TỔNG KẾT HAI SHEET

| | **Sheet A — Tin đăng** | **Sheet B — Tin tức** |
|---|---|---|
| File | `Bang-<ngày>.csv` | `TinTuc-<ngày>.csv` |
| Số lượng/ngày | **34 tin** (10/6/6/6/6) | **5 bài** |
| Số cột | **48** | **9** |
| Nguyên tắc nội dung | **CHÉP NGUYÊN** tin gốc · sửa phải ghi chú | **TỰ VIẾT** · cấm sao chép |
| Ảnh | Link vào `link_anh`, cạnh ngắn ≥ 1200px | Link vào `anh`, ngang ≥ 1200px, 16:9 |
| Nguồn | Link tin gốc — bắt buộc | Link tham khảo — bắt buộc |
| Chỗ dễ sai nhất | Đơn giá thuê kho xưởng · xuống dòng mô tả · số điện thoại | Sao chép bài báo · bịa số liệu · từ khoá quá ngắn |

**Sheet B — 9 cột:**
`tieu_de` · `chuyen_muc` · `slug` · `mo_ta_ngan` · `noi_dung` · `anh` · `tu_khoa_chinh` · `nguon` · `ghi_chu`
*(tất cả đều bắt buộc, trừ `ghi_chu`)*

---

# ⛔ TUYỆT ĐỐI KHÔNG

### Gói A

1. **Không tự viết lại, không thêm thắt, không "làm cho hay hơn".** Ghi đúng theo tin của người
   đăng: nội dung của họ, giá của họ, ảnh của họ, tên và số điện thoại của họ.
2. **Không bịa tin.** Không có tin thật thì giao thiếu và ghi vào `bao-cao.txt`.
   Thiếu số còn hơn có tin ma — khách gọi vào không có nhà là mất uy tín.
3. **Không bỏ bớt ảnh.** Tin có bao nhiêu ảnh thì ghi đủ bấy nhiêu link.
4. **Phân biệt rõ hai trường hợp:** ảnh KHÔNG đạt chuẩn (không có ảnh · cạnh ngắn < 900px)
   → **bỏ tin**. Ảnh đạt chuẩn nhưng thiếu thông tin khác → **vẫn giao**, để trống ô đó + `ghi_chu`.
5. **Không ghi giá kèm chữ** (`5,5 tỷ`) — chỉ ghi số.
6. **Không tự nhân đơn giá thuê ra tổng tiền tháng.** Xưởng 2.000m² giá 35.000đ/m² thì điền
   `don_gia_thue` = `35`, để trống `gia`.
7. **Không sửa tiêu đề / mô tả mà không ghi chú.**
8. **Không dán link ảnh trang khác vào cột `anh`** — web chặn, ảnh vỡ trắng.
9. Không gộp ô (merge) trong vùng dữ liệu, không để dữ liệu ở sheet thứ hai.
10. Không đổi tên cột trong file mẫu, không xoá cột.

### Gói B

1. **Không sao chép bài của báo khác.** Dù một đoạn. Google phát hiện trùng lặp là **hạ hạng
   toàn bộ tên miền**, hỏng luôn cả phần tin đăng. Đọc nhiều nguồn rồi **viết lại bằng chữ của mình**.
2. **Không bịa số liệu.** Mọi con số phải có **nguồn + mốc thời gian**, link vào `nguon`.
   Không tìm được số thật thì **viết bài không có số**.
3. **Không dùng ảnh có bản quyền của báo khác.** Ưu tiên Unsplash / Pexels hoặc ảnh khu vực
   chụp thực tế. Ghi nguồn ảnh vào `ghi_chu`.
4. **Không viết như quảng cáo:** "cơ hội vàng", "siêu phẩm", "đừng bỏ lỡ".
5. **Không định vị Coastal Land là môi giới.**
6. **Không trùng chủ đề trong 30 ngày.** Kiểm lại các file `TinTuc-*.csv` cũ trong
   `TIN-HANG-NGAY\` và `DA-DANG\`.
7. **Không dùng nội dung do máy sinh mà không kiểm.** Bài phải đọc lại, số phải soi lại.

### Được phép làm cho dễ nhìn

Tô màu · in đậm · giãn cột · đóng băng dòng · thêm cột riêng ở cuối · chèn dòng tiêu đề
trang trí phía trên dòng tên cột. Hệ thống vẫn đọc đúng.

---

# ✅ TỰ KIỂM TRƯỚC KHI GIAO

### Gói A

- [ ] Đủ **34 tin**: Đà Nẵng 10 · Huế 6 · Quy Nhơn 6 · Nha Trang 6 · Phan Thiết 6, mỗi khu vực có **cả bán lẫn thuê** (~70/30)
- [ ] `tinh_thanh` của Quy Nhơn = `Gia Lai`, Phan Thiết = `Lâm Đồng`
- [ ] `tieu_de` ≥ 30 ký tự · `mo_ta` ≥ 50 ký tự
- [ ] **Tiêu đề và mô tả giữ nguyên tin gốc.** Có sửa → đã ghi `ghi_chu` chưa?
- [ ] `mo_ta` **giữ đúng xuống dòng / gạch đầu dòng / dòng trống**, không dồn một đoạn
- [ ] `lien_he_sdt` đúng **10 chữ số, có số 0 đầu**, không dấu chấm/khoảng trắng/+84
- [ ] Tin **thuê kho xưởng · kho bãi · văn phòng · mặt bằng**: đã điền `don_gia_thue`
      (ngàn đ/m²/tháng), **để trống `gia`**, đã đọc kỹ diện tích (2.000 hay 200)?
- [ ] Tin thuộc dự án → đã ghi `ten_du_an`?
- [ ] `tien_ich` · `noi_that_ban_giao` · `phap_ly` · `tinh_trang_noi_that` theo danh mục A12
- [ ] `loai_hinh` khớp danh mục **theo `muc_dich`** (bán và thuê khác nhau)
- [ ] `phuong_xa` chép từ `DANH-SACH-PHUONG-XA-MIEN-TRUNG.txt`, đúng chính tả có dấu
- [ ] `gia` chỉ có số, dấu **phẩy** thập phân · `dien_tich` có số
- [ ] Mã ảnh đúng tiền tố khu vực, không trùng nhau · **mọi dòng đều có `link_anh`**
- [ ] `nguon` có **link tin gốc**
- [ ] `hang_tin` để trống hết
- [ ] **Chống trùng ngày trước:** mở tất cả `Bang-*.csv` trong `TIN-HANG-NGAY\` và `DA-DANG\`.
      Trùng = **cùng số điện thoại VÀ cùng địa chỉ/diện tích/giá**. Chỉ trùng số điện thoại thôi
      thì **KHÔNG** phải trùng — một môi giới đăng nhiều căn là bình thường.

### Gói B

- [ ] Đủ **5 bài**, đúng phân bổ chuyên mục ở B1
- [ ] **Ít nhất 3 bài gắn địa danh cụ thể** Miền Trung
- [ ] Mỗi bài có **đúng 1** `tu_khoa_chinh` dạng longtail, xuất hiện đủ **5 chỗ** ở B2
- [ ] `tieu_de` 50–65 ký tự · `mo_ta_ngan` 120–160 ký tự
- [ ] `noi_dung` **800–1.200 từ**, mỗi đoạn 1 dòng, 4–6 tiêu đề phụ, có ít nhất 1 bảng hoặc danh sách
- [ ] Mọi con số đều có **nguồn + mốc thời gian**, link trong `nguon`
- [ ] **Không đoạn nào sao chép** từ bài gốc
- [ ] `slug` không dấu, không trùng bài cũ
- [ ] `anh` là link trực tiếp, ngang ≥ 1200px, 16:9, liên quan thật tới bài
- [ ] **Không trùng chủ đề trong 30 ngày**
- [ ] Không câu nào định vị Coastal Land là môi giới

---

# 📝 `bao-cao.txt` — CHUNG CHO CẢ HAI GÓI

```
NGÀY: <NGÀY>

── GÓI A — TIN ĐĂNG ──
1. Tổng tin giao: __ / 34
   Đà Nẵng __/10 · Huế __/6 · Quy Nhơn __/6 · Nha Trang __/6 · Phan Thiết __/6
   Tổng bán __ · Tổng thuê __
2. Lấy tin từ nguồn nào, mỗi nguồn bao nhiêu tin
3. batdongsan.com.vn CÓ VÀO ĐƯỢC KHÔNG — lấy được bao nhiêu tin, hay bị chặn
4. Số tin BỎ vì ảnh không đạt: __
5. Dòng nào thiếu thông tin, thiếu gì (ghi rõ mã tin)
6. Số tin có sửa tiêu đề: __ · sửa mô tả: __ (đã ghi ghi_chu chưa?)
7. Tin cho thuê kho xưởng/văn phòng/mặt bằng: __ tin, đã điền don_gia_thue chưa?
8. Tin nghi trùng với ngày trước
9. Vướng mắc khác

── GÓI B — TIN TỨC ──
1. Tổng bài giao: __ / 5
   Phân tích thị trường __ · Cẩm nang __ · Chuyên mục khác: __
2. Số bài gắn địa danh cụ thể: __
3. Từ khoá chính từng bài + số từ mỗi bài
4. Bài nào chưa tìm được số liệu thật
5. Nguồn đã tham khảo / nguồn bị chặn
6. Ảnh minh hoạ lấy từ đâu, có vướng bản quyền không
7. Đã kiểm trùng chủ đề 30 ngày chưa?
```

---

# 🚫 NHỮNG VIỆC COWORK KHÔNG LÀM ĐƯỢC — ghi lại rồi đi tiếp

Gặp là **ghi vào `ghi_chu` / `bao-cao.txt` rồi đi tiếp**, đừng dừng lại loay hoay.

| Việc | Làm được? | Gặp thì làm gì |
|---|---|---|
| Vào nhóm Facebook / Zalo phải đăng nhập | **Không** | Ghi `bao-cao.txt` mục "nguồn bị chặn", chuyển nguồn công khai |
| Tải ảnh nằm sau đăng nhập, hoặc trong app | **Không** | Bỏ tin đó, tìm tin khác có ảnh công khai |
| Gọi điện xác minh tin còn hay hết | **Không** | Ghi số vào `lien_he_sdt` — chủ dự án gọi |
| Xin phép người đăng | **Không** | Việc của chủ dự án |
| Quyết định `hang_tin` | **Không nên** | Luôn để trống |
| Đoán thông tin tin không ghi | **Cấm** | Để trống + ghi `ghi_chu` |
| Bịa số liệu cho bài viết | **Cấm** | Viết bài không có số, ghi `ghi_chu` |
| Chuẩn hoá địa danh cũ → phường/xã mới | **Được** | Theo A2, ghi chữ gốc vào `ghi_chu` |
| Quy đổi giá, diện tích, loại hình | **Được** | Theo A6, A8, A9 |
| Chép đơn giá thuê kho xưởng vào `don_gia_thue` | **Được** | Theo A7 — chép nguyên số, **không nhân** |
| Sửa tiêu đề / mô tả không đạt chuẩn | **Được, phải ghi chú** | Theo A4, A5 |
| Chống trùng với ngày trước | **Được** | Theo mục Tự kiểm |

---
---

# 📋 LỆNH GỌI COWORK — chép từ đây

## Phần 1 — DÁN VÀO Ô HƯỚNG DẪN CỦA PROJECT *(dán một lần, không đổi nữa)*

```
Mỗi ngày làm hai gói cho website Coastal Land theo file YEU-CAU-COWORK.md đính
kèm project. ĐỌC HẾT FILE ĐÓ TRƯỚC KHI LÀM. Có gì không rõ thì xem lại file đó,
đừng tự nghĩ cách khác. Đó là tài liệu DUY NHẤT — bỏ qua mọi bản hướng dẫn cũ.

GHI VÀO THƯ MỤC CỦA NGÀY HÔM ĐÓ:
  C:\Users\X1 GEN 8\Projects\TIN-HANG-NGAY\Tin-<NĂM-THÁNG-NGÀY>\
    - Bang-<NĂM-THÁNG-NGÀY>.csv      (GÓI A — 34 tin, 48 cột)
    - TinTuc-<NĂM-THÁNG-NGÀY>.csv    (GÓI B — 5 bài, 9 cột)
    - bao-cao.txt                     (báo cáo chung cho cả hai gói)
Đúng ba file. Không tạo file phụ, không tạo bản v2, không tạo file .ps1.

Ba điều sai nhiều nhất, đọc kỹ trong file:
  A7  — đơn giá thuê nhà xưởng/kho bãi ghi theo NGÀN đ/m2, KHÔNG tự nhân
  A5  — mô tả giữ nguyên xuống dòng của người đăng, dùng Alt+Enter
  A10 — số điện thoại 10 chữ số, có số 0 đứng đầu

Không gom đủ số thì GIAO THIẾU và ghi rõ trong bao-cao.txt. KHÔNG bịa cho đủ.
```

## Phần 2 — TIN NHẮN MỖI NGÀY *(chỉ đổi ngày)*

```
Hôm nay làm gói ngày <NGÀY>.
Ghi vào: C:\Users\X1 GEN 8\Projects\TIN-HANG-NGAY\Tin-<NGÀY>\
  - Bang-<NGÀY>.csv     (34 tin bất động sản, 48 cột)
  - TinTuc-<NGÀY>.csv   (5 bài tin tức, 9 cột)
  - bao-cao.txt
Làm đúng như hướng dẫn của project. Xong báo tôi.
```

> `<NGÀY>` viết dạng `NĂM-THÁNG-NGÀY` — ví dụ `2026-09-10`.
> **Đây là câu duy nhất đổi theo ngày.** Mọi thứ khác giữ nguyên mãi mãi.

## Phần 3 — FILE ĐÍNH KÈM VÀO PROJECT *(gỡ hết bản cũ trước khi đính)*

```
_MAU\YEU-CAU-COWORK.md                    (tài liệu DUY NHẤT)
_MAU\mau-nhap-tin-hang-loat.csv           (khuôn gói A — 48 cột + 17 ví dụ)
_MAU\mau-tin-tuc-hang-ngay.csv            (khuôn gói B — 9 cột + 2 bài mẫu)
_MAU\DANH-SACH-PHUONG-XA-MIEN-TRUNG.txt   (734 phường/xã, 8 tỉnh)
```

**Đúng 4 file.** Gỡ mọi bản cũ (`DE-BAI-CHO-COWORK.md`, `LENH-COWORK.txt`,
`YEU-CAU-COWORK-30-08*.md`, file mẫu 25 cột) ra khỏi project trước khi đính bản mới —
để Cowork không đọc nhầm hướng dẫn cũ.
