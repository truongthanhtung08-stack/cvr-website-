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
| **A** | `Bang-<ngày>.csv` | **34 tin** bất động sản · 54 cột |
| **B** | `TinTuc-<ngày>.csv` | **5 bài** tin tức chuẩn SEO · 9 cột |
| — | `bao-cao.txt` | Báo cáo chung cho cả hai gói |
| **C** | `LichSuGia-<ngày>.csv` | **KHÔNG làm hằng ngày** — chỉ khi được yêu cầu riêng (xem **GÓI C**) |

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
│   ├── mau-nhap-tin-hang-loat.csv          ← khuôn GÓI A (54 cột + 17 dòng ví dụ)
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

## A1. Định mức — 34 tin, 7 khu vực (mở rộng 17/09/2026)

| Khu vực | `tinh_thanh` (hệ MỚI) | Địa bàn trọng tâm | Tin/ngày | Mã ảnh |
|---|---|---|---|---|
| **Đà Nẵng** | `Đà Nẵng` | Sơn Trà · An Hải · Hải Châu · Ngũ Hành Sơn · Hòa Xuân · Hội An · Điện Bàn | **6** | `dn01-<ngày>`–`dn06-<ngày>` |
| **Huế** | `Huế` | Phú Xuân · Thuận Hóa · Vỹ Dạ · An Cựu · Thuận An · Hương Thủy | **5** | `hue01-<ngày>`–`hue05-<ngày>` |
| **Quy Nhơn** | **`Gia Lai`** | Quy Nhơn · Quy Nhơn Bắc/Nam/Đông/Tây · An Nhơn | **5** | `qnhon01-<ngày>`–`qnhon05-<ngày>` |
| **Nha Trang** | **`Khánh Hòa`** | Nha Trang · Bắc/Tây/Nam Nha Trang · Cam Ranh | **5** | `nt01-<ngày>`–`nt05-<ngày>` |
| **Phan Thiết** | **`Lâm Đồng`** | Phan Thiết · Mũi Né · Phú Thủy · Tiến Thành · La Gi | **5** | `pt01-<ngày>`–`pt05-<ngày>` |
| **Quảng Trị** ⭐ | `Quảng Trị` | Đông Hà · Quảng Trị · Cửa Việt · Gio Linh · Đồng Hới (Quảng Bình cũ) | **4** | `qtri01-<ngày>`–`qtri04-<ngày>` |
| **Quảng Ngãi** ⭐ | `Quảng Ngãi` | TP. Quảng Ngãi · Sơn Tịnh · Tư Nghĩa · Bình Sơn (Dung Quất) · Đức Phổ | **4** | `qngai01-<ngày>`–`qngai04-<ngày>` |
| | | **Tổng** | **34** | |

**Mã ảnh kèm NGÀY** — `dn01-1009` cho gói ngày 10/09 (xem A13). Tên tệp ảnh cũng theo mã đó: `dn01-1009-1.jpg`.

**Phân bổ phải ĐỀU — không dồn tin vào một vài khu vực dễ tìm.** Khu vực nào gom
không đủ thì lấy bù từ khu vực liền kề, nhưng **mỗi khu vực phải có ít nhất 3 tin**
và phải ghi rõ trong `bao-cao.txt` đã bù bao nhiêu, từ đâu sang đâu.

Mỗi khu vực phải có **cả tin mua bán LẪN tin cho thuê**, tỷ lệ khoảng **70% bán · 30% thuê**.

⚠️ **Bốn tỉnh dễ ghi nhầm** — sáp nhập 2025 đổi tỉnh chủ quản:
**Quy Nhơn** nay thuộc **Gia Lai** · **Phan Thiết** nay thuộc **Lâm Đồng** ·
**Đồng Hới / Quảng Bình cũ** nay thuộc **Quảng Trị** · **Kon Tum** nay thuộc **Quảng Ngãi**.
Ghi `Bình Định` / `Bình Thuận` / `Quảng Bình` ở cột `tinh_thanh` là **SAI**, tin không lọc
được theo khu vực — tên cũ đó thuộc về cột `tinh_cu`.

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

### ⭐ MỚI (17/09/2026) — BA CỘT ĐỊA CHỈ HỆ CŨ: `phuong_xa_cu` · `quan_huyen_cu` · `tinh_cu`

Tin gốc gần như luôn ghi theo **địa giới CŨ**. Trước đây Cowork chỉ ghi hệ mới rồi để web
tự suy ngược ra hệ cũ — **cách đó KHÔNG BAO GIỜ đúng được**, vì một phường mới gộp 2–4
phường cũ. Đo thật trên 34 tin ngày 10/09: **13 tin mất hẳn cấp phường**, và có tin ra
**sai người sai chỗ** ("Phường Thủy Vân" thành "Vỹ Dạ").

Từ nay **chép NGUYÊN địa chỉ cũ của tin gốc vào ba cột này** — có sẵn ngay trên trang nguồn:

| Tin gốc ghi | `phuong_xa` (mới) | `phuong_xa_cu` | `quan_huyen_cu` | `tinh_cu` |
|---|---|---|---|---|
| Phường Mân Thái, Quận Sơn Trà, Đà Nẵng | `Phường Sơn Trà` | `Mân Thái` | `Sơn Trà` | `Đà Nẵng` |
| Phường Thủy Vân, TP Huế | `Phường Vỹ Dạ` | `Thủy Vân` | `Thuận Hóa` | `Thừa Thiên Huế` |
| Xã Nhơn Lý, TP Quy Nhơn, Bình Định | `Phường Quy Nhơn Đông` | `Nhơn Lý` | `Quy Nhơn` | `Bình Định` |
| Phường Phú Hài, Phan Thiết, Bình Thuận | `Phường Phú Thủy` | `Phú Hài` | `Phan Thiết` | `Bình Thuận` |

- **Bỏ tiền tố cấp** ở hai cột `_cu` cho gọn: ghi `Mân Thái`, không ghi `Phường Mân Thái`.
- `tinh_cu` là tên tỉnh **trước sáp nhập**: `Bình Định` (nay Gia Lai) · `Bình Thuận` (nay
  Lâm Đồng) · `Thừa Thiên Huế` (nay Huế) · `Quảng Nam` (nay Đà Nẵng).
- Tin gốc **không ghi hệ cũ** → để trống cả ba, web tự suy như trước. **Đừng đoán.**
- Vẫn giữ thói quen ghi `tin gốc ghi: …` vào `ghi_chu` — hai chỗ đối chiếu được nhau.

Trang tin hiện: dòng trên là địa chỉ hệ MỚI (kèm số nhà/đường), dòng dưới nhỏ hơn
`Địa chỉ hệ cũ: Mân Thái, Sơn Trà, Đà Nẵng`.

## A3. Nguồn tin — thứ tự ưu tiên

| # | Nguồn | Vì sao xếp ở đây |
|---|---|---|
| 1 | **batdongsan.com.vn** | Cập nhật liên tục, nhiều nhất, ảnh to rõ, nội dung đầy đủ nhất |
| 2 | **nhatot.com** (Nhà Tốt) | Rất nhiều tin chính chủ, ảnh chụp thật, hay có tin mà batdongsan không có |
| 3 | **homedy.com** | Tin có kiểm duyệt, ảnh khá, mô tả đủ |
| 4 | **mogi.vn** | Tương tự Homedy |
| 5 | **muaban.net · dothi.net · bds123.vn** | Bổ sung cho tỉnh lẻ (Quảng Trị · Quảng Ngãi) — nơi ba nguồn trên ít tin |
| 6 | **alonhadat.com.vn** | **Lấy ít thôi** — tin không xác thực, ảnh xấu (đo thật: tối đa 670px). Chỉ khi các nguồn trên không đủ |
| 7 | Nhóm **Zalo · Facebook** | Cần đăng nhập → **bỏ qua**, chủ dự án tự lấy tay |

> ### ⭐ ĐA DẠNG NGUỒN (chốt 17/09/2026) — không lấy hết từ một trang
> Đợt 10/09 **34/34 tin đều từ batdongsan.com.vn**. Một nguồn thì trùng tin với chính
> mình, và hôm nào Cloudflare chặn là mất cả ngày.
> **Luật: không quá 60% số tin mỗi ngày (tối đa 20/34) từ một trang.** Ghi rõ trong
> `bao-cao.txt`: mỗi nguồn bao nhiêu tin.
>
> **Ba tiêu chí xếp thứ tự khi chọn giữa nhiều tin cùng khu vực:**
> 1. **Đầy đủ thông tin nhất** — điền được nhiều cột nhất (xem A14), nhất là pháp lý,
>    hướng, kết cấu, nội thất, tiện ích.
> 2. **Mới nhất** — ưu tiên tin đăng trong **3 ngày**; quá 7 ngày chỉ lấy khi khu vực
>    đó thiếu tin.
> 3. **Ảnh đúng chuẩn** — cạnh ngắn **≥ 1200px**, ảnh chụp thật, không chụp màn hình,
>    không watermark to, cắt 4:3 vẫn nét.

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

> ### ⭐ CHUẨN SEO CHO TIÊU ĐỀ (chốt 17/09/2026) — web báo vàng nếu không đạt
>
> **Công thức:** `Bán|Cho thuê` + `loại hình` + `diện tích / đặc điểm chính` +
> `đường hoặc dự án` + `, phường/xã, tỉnh` — **45–70 ký tự**.
>
> `Bán nhà riêng 2 tầng kiệt Trương Định, Phường Sơn Trà, Đà Nẵng` ✅ (62 ký tự)
>
> | Luật | Vì sao |
> |---|---|
> | **1. Mở đầu bằng "Bán…" hoặc "Cho thuê…"** | Khách lướt danh sách chỉ đọc tiêu đề; đó cũng đúng cụm người ta gõ Google. Đo 34 tin ngày 10/09: **9 tiêu đề không cho biết bán hay thuê** ("Studio The Camellia 30m2 tầng 5") |
> | **2. Có TÊN PHƯỜNG/XÃ và TỈNH** | Mất từ khoá địa phương là mất thế mạnh của Coastal Land. Đo: **26/34 tiêu đề thiếu** một trong hai |
> | **3. Dài 45–70 ký tự** | Trên 75 ký tự Google cắt mất đuôi. Đo: **17 tiêu đề trên 80 ký tự** |
> | **4. Không "siêu phẩm · sập sàn · giá sốc", không emoji, không số điện thoại** | Google xếp vào nhóm tin rác |
> | **5. Đúng mục đích** | `muc_dich` ghi `ban` mà tiêu đề nói "cho thuê" là sai cả dòng — web báo vàng |
>
> Sửa tiêu đề thì **ghi `ghi_chu`**: `đã sửa tiêu đề: gốc 98 ký tự, thiếu phường và tỉnh`.

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

> ### 🧭 Giá và diện tích đi liền nhau — web lấy hai cái đó chia ra giá mỗi m²
>
> | Tin là gì | Web tính giá mỗi m² bằng | Cột Cowork phải có |
> |---|---|---|
> | **Bán đất** | giá ÷ **m² đất** | `gia` · `dien_tich` |
> | **Bán nhà** (nhà riêng · mặt phố · biệt thự · shophouse) | giá ÷ **m² sàn xây dựng** | `gia` · `dien_tich` · **`dien_tich_xay_dung`** ⭐ |
> | **Bán căn hộ · chung cư · condotel** | giá ÷ **m² căn** | `gia` · `dien_tich` |
> | **Thuê kho xưởng · văn phòng · mặt bằng** | **đơn giá ÷ m²/tháng** — xem A7 | `don_gia_thue` · `dien_tich` |
> | **Thuê nhà · căn hộ trọn gói** | **tổng tiền mỗi tháng**, KHÔNG chia m² | `gia` · `dien_tich` |
>
> Ghi sai một ô là con số trên web sai gấp mấy lần. Đọc kỹ **A7** (giá thuê theo m²)
> và **A8** (hai ô diện tích) trước khi gom tin.

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

## A6b. ⭐ `don_gia_ban` — ĐƠN GIÁ MỖI M² **CHỈ KHI NGƯỜI BÁN CÓ GHI**

> **Nguyên tắc chủ dự án chốt 19/09:** *chỉ ghi những gì người bán ghi. Giá mỗi m² người
> bán ghi thì mình ghi, không ghi thì thôi. Mình tự tính chỉ để tham khảo cho lịch sử giá.*

Người bán **nhà** niêm yết **tổng giá cả căn** (đất + nhà), không ai báo giá mỗi m² sàn.
Web tự chia ra rồi in lên tin là đặt vào miệng người bán một con số họ chưa từng nói.

| Loại hình | Trang tin hiện đơn giá mỗi m²? | Chia cho |
|---|---|---|
| **Đất** nền · nông nghiệp · công nghiệp | ✔ **luôn** — thị trường vốn tính theo m² đất | m² **đất** |
| **Căn hộ** · chung cư · condotel | ✔ **luôn** — báo tổng giá nhưng chia m² căn được | m² **căn** |
| **Nhà** riêng · mặt phố · biệt thự · shophouse | ✔ **chỉ khi** có `don_gia_ban` | m² **sàn** |

Tin nhà không có `don_gia_ban` thì trang tin chỉ hiện **Diện tích đất · Diện tích xây dựng ·
Mức giá (tổng)** — đủ để người mua tự tính.

| Tin gốc ghi | `gia` | `don_gia_ban` |
|---|---|---|
| *"Nhà 12 tỷ, 100m² đất, 300m² sàn"* | `12` | **để trống** |
| *"Nhà 12 tỷ, giá 40 triệu/m² sàn"* | `12` | `40` |
| *"Bán 45 triệu/m² sàn, tổng 13,5 tỷ"* | `13,5` | `45` |

Đơn vị **TRIỆU đồng mỗi m²**. ⛔ **Tin không ghi thì BỎ TRỐNG — tuyệt đối không tự chia.**

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

### ⭐ MỚI 19/09 — TIN BÁO GIÁ THEO **QUÝ** HAY **NĂM**: cột `chu_ky_thue`

Văn phòng, kho xưởng, đất thuê rất hay niêm yết *"150 triệu/quý"* hoặc *"1,2 tỷ/năm"*.
**ĐỪNG tự chia 3 hay chia 12** — cứ chép NGUYÊN con số của tin gốc, ghi kỳ vào cột mới,
web tự quy về tiền mỗi tháng.

| Tin gốc ghi | `gia` | `don_gia_thue` | `chu_ky_thue` | Web tính ra |
|---|---|---|---|---|
| 18 triệu/tháng | `18` | — | để trống *(= tháng)* | 18 triệu/tháng |
| 54 triệu/**quý** | `54` | — | `quy` | 18 triệu/tháng |
| 216 triệu/**năm** | `216` | — | `nam` | 18 triệu/tháng |
| 120.000đ/m²/tháng, 90m² | — | `120` | để trống | 10,8 triệu/tháng |
| 360.000đ/m²/**quý**, 90m² | — | `360` | `quy` | 10,8 triệu/tháng |

Chỉ nhận đúng ba chữ: **`thang`** · **`quy`** · **`nam`** (không dấu). Ghi chữ khác web báo **đỏ**.
Trang tin sẽ hiện thêm dòng *"Kỳ báo giá: Theo quý"* — người thuê cần biết mình trả một lần bao nhiêu.

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

## A7b. 🔴 DẤU CHẤM TRONG Ô SỐ — chỗ vừa làm 3 tin sai GẤP 1000 LẦN

Ngày 19/09 phát hiện 3 tin **đã lên web** với số sai 1000 lần, chỉ vì một dấu chấm:

| Tin gốc | File ghi | Web hiểu thành | Đơn giá ra |
|---|---|---|---|
| `Diện tích: 2.222 m²` | `2.222` | **2,222 m²** | 3.690 triệu/m² |
| `1. 668m2` | `1.668` | **1,668 m²** | 522 triệu/m² |
| `giá 2,246 tỷ` | `2.246` | **2.246 tỷ** | 74.867 triệu/m² |

> **LUẬT: ô số chỉ ghi CON SỐ. Dấu PHẨY là thập phân. KHÔNG dùng dấu chấm phân cách hàng nghìn.**

| Tin gốc | ✔ Ghi đúng | ✘ Đừng ghi |
|---|---|---|
| 2.222 m² | `2222` | `2.222` |
| 1.668 m² | `1668` | `1. 668` |
| 62,5 m² | `62,5` | `62.5` |
| 2,246 tỷ | `2,246` | `2.246` |
| 850 triệu | `0,85` | `850` |

**Web nay có cửa chặn cuối:** chia giá cho diện tích, đơn giá ra ngoài khoảng thường gặp
(bán `0,3 – 400 triệu/m²` · thuê `5 nghìn – 3 triệu đ/m²/tháng`) là **báo vàng ngay lúc nộp
file**, kèm đúng câu nhắc về dấu chấm. Thấy dòng đó thì **mở tin gốc đối chiếu lại**.

## A8. Diện tích — ⭐ TỪ 19/09 CÓ THÊM CỘT `dien_tich_xay_dung`

| Người đăng viết | Ghi vào `dien_tich` |
|---|---|
| `5x20` · `5m x 20m` | `100` |
| `100m2` · `100 m²` | `100` |
| `DT 62,5m2` | `62,5` |
| `1 sào` | để trống + ghi `ghi_chu` |
| Không nói diện tích | **để trống**, `ghi_chu` = `tin không ghi diện tích` |

Chỉ ghi **số**, không ghi `62m2`.

### ⚠️ HAI Ô DIỆN TÍCH — ĐỪNG DỒN VÀO MỘT

Web dùng diện tích làm **mẫu số để tính giá mỗi m²**. Đất chia cho m² đất, nhà chia
cho m² **sàn xây dựng** — hai con số lệch nhau vài lần, ghi nhầm ô là giá mỗi m²
của tin sai hẳn.

> Biệt thự 24 tỷ · **200 m² đất** · **500 m² sàn**
> → trên m² đất: **120 triệu/m²** · trên m² sàn: **48 triệu/m²**

| Cột | Ghi gì | Loại hình nào phải có |
|---|---|---|
| `dien_tich` | Diện tích **THỬA ĐẤT** (nhà gắn liền đất) hoặc **diện tích thông thuỷ của căn** (căn hộ, chung cư, condotel) | ⛔ **Mọi tin** |
| `dien_tich_xay_dung` ⭐ | **Tổng m² SÀN**, cộng hết các tầng (kể cả tầng lửng, áp mái nếu tin gốc ghi) | Nhà riêng · Nhà mặt phố · Nhà biệt thự / Liền kề · Shophouse |

**Cách đọc ra `dien_tich_xay_dung` từ tin gốc:**

| Tin gốc ghi | `dien_tich` | `dien_tich_xay_dung` |
|---|---|---|
| `DT đất 100m2, DT sàn 263,3m2` | `100` | `263,3` |
| `Đất 5x20 (100m2), nhà 3 tầng` | `100` | `300` *(100 × 3 tầng)* |
| `100m2, 3 tầng + lửng` | `100` | `350` *(100 × 3,5)* |
| `Nhà 4 tầng, mỗi sàn 80m2, đất 90m2` | `90` | `320` |
| Tin không ghi số tầng, không ghi DT sàn | `100` | **để trống** + `ghi_chu` = `tin không ghi diện tích sàn` |

⛔ **KHÔNG tự đoán số tầng.** Tin gốc không nói số tầng và không nói m² sàn thì để
trống — web hiện giá trên m² đất là xong, còn hơn bịa ra một con số sai.

⛔ **Căn hộ · chung cư · condotel · đất nền · kho xưởng · văn phòng: ĐỂ TRỐNG cột này.**
Căn hộ chỉ có một diện tích, đã ghi ở `dien_tich`. Kho xưởng có ô riêng
`dien_tich_su_dung`. Ghi vào đây là thừa, web bỏ qua.

> Thiếu cột này ở nhà gắn liền đất, web báo **vàng** (vẫn đăng được) với dòng
> *"Thiếu dien_tich_xay_dung — loại hình này cần m² sàn để tính đúng giá mỗi m²"*.

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

## A10. Số điện thoại — BẮT BUỘC, 10 chữ số, CÓ SỐ 0 ĐỨNG ĐẦU

> ### ⛔ TỪ 17/09/2026: THIẾU HOẶC SAI SỐ LÀ WEB BÁO ĐỎ, TIN KHÔNG LÊN ĐƯỢC
> Trước đây chỉ báo vàng nên tin thiếu số vẫn lọt lên web. Nay `lien_he_sdt` nằm trong
> nhóm **bắt buộc**: để trống, ghi thiếu số, hay rơi mất số 0 đầu đều bị chặn ngay ở
> bước đọc file.
>
> **⚠️ Bẫy Excel nuốt số 0:** ô để kiểu *Số* thì `0905123456` tự thành `905123456`.
> Trước khi lưu file: bôi cả cột `lien_he_sdt` → **Format Cells → Text**, rồi nhìn lại
> xem mọi ô còn số 0 đầu không.
>
> Số bị giấu sau nút "Hiện số" mà không bấm được thì **bỏ tin đó, tìm tin khác** —
> đừng giao tin không có số.

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

## A10b. `dia_chi` — CÓ SỐ NHÀ THÌ PHẢI CÓ SỐ NHÀ

`dia_chi` = phần địa chỉ **ngoài** đơn vị hành chính: số nhà + tên đường (hoặc tên khu,
lô, kiệt/hẻm). Tin gốc ghi tới đâu **chép tới đó**, đừng cắt bớt cho gọn:

**Thứ tự viết: SỐ NHÀ — hoặc TÊN DỰ ÁN — đứng TRƯỚC, rồi mới tới tên đường.**

| Tin gốc | Ghi vào `dia_chi` |
|---|---|
| `77 Đặng Văn Chấn` | `77 Đường Đặng Văn Chấn` |
| `K83/12 Huỳnh Ngọc Huệ` | `Kiệt 83/12 Huỳnh Ngọc Huệ` |
| `Lô A12 KĐT An Phú Thịnh` | `Lô A12, Khu đô thị An Phú Thịnh` |
| Căn hộ dự án Ocean Dunes, đường Tôn Đức Thắng | `Dự án Ocean Dunes, Đường Tôn Đức Thắng` |
| Biệt thự NovaWorld Phan Thiết, đường Lạc Long Quân | `NovaWorld Phan Thiết, Đường Lạc Long Quân` |
| Chỉ ghi `đường Trần Phú` | `Đường Trần Phú` |

- Có **cả số nhà lẫn dự án** thì viết: `Lô A12, Dự án An Phú Thịnh, Đường Huỳnh Tấn Phát`.
- Tin thuộc dự án **vẫn phải điền `ten_du_an`** — `dia_chi` là dòng hiện cho khách đọc,
  `ten_du_an` là chìa nối tin với trang dự án. Ghi một chỗ là mất chỗ kia.

- Tin thuộc **dự án** thì ghi cả hai: `dia_chi` = đường, `ten_du_an` = tên dự án.
- Số nhà nằm trong **mô tả** chứ không ở ô địa chỉ của trang nguồn → vẫn phải đưa lên
  `dia_chi`. Web hiện dòng `<số nhà, đường>, <phường>, <tỉnh>` nên thiếu số nhà là khách
  không tìm ra nhà.
- Tin gốc **không cho số nhà** (rất hay gặp) → ghi tên đường là đủ, **không bịa số**.

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

**`phap_ly` — ⭐ ĐỔI 19/09: SỔ ĐỎ VÀ SỔ HỒNG LÀ HAI THỨ, KHÔNG ĐỔ ĐỒNG**

Sổ đỏ là giấy của **quyền sử dụng đất**; sổ hồng có thêm **quyền sở hữu nhà / căn hộ**
trên đất đó. Chào "sổ hồng" cho một lô đất trống là sai bản chất giấy tờ — đây lại là
thứ người mua tra kỹ nhất trước khi đặt cọc.

| Loại hình | Được ghi |
|---|---|
| **Đất** nền · đất nông nghiệp · đất công nghiệp | `Sổ đỏ chính chủ` |
| **Nhà** riêng · mặt phố · biệt thự · shophouse | `Sổ đỏ chính chủ` **hoặc** `Sổ hồng chính chủ` — theo đúng tin gốc |
| **Căn hộ** · chung cư · condotel | `Sổ hồng chính chủ` |
| Mọi loại hình | `Hợp đồng mua bán` · `Đang chờ sổ` · `Sổ chung / vi bằng` · `Đang cập nhật` |

Tin gốc viết mập mờ ("sổ đỏ/sổ hồng", "chính chủ", "đã có sổ") thì **chép nguyên** —
web tự chốt theo loại hình. Ghi sai loại giấy so với loại hình thì web báo **vàng**.

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
| Sổ hồng riêng · Sổ hồng lâu dài | Sổ hồng chính chủ |
| Sổ đỏ riêng · Sổ đỏ | Sổ đỏ chính chủ |
| Chính chủ · Đã có sổ · Sẵn sổ | web tự chốt theo loại hình (xem **A12**) |
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
| `ma_anh` | Mã của tin, có tiền tố khu vực **kèm NGÀY**: `dn01-1009`, `hue01-1009`, `nt01-1009`… (một mã cho cả tin, dù tin có 10 ảnh) |
| `link_anh` | **TOÀN BỘ** link ảnh trực tiếp (`.jpg`/`.png`/`.webp`), ngăn bằng `\|` |
| `anh` | **ĐỂ TRỐNG.** Dán link trang ngoài vào đây là ảnh vỡ trắng trên web |

> ### ⛔ MÃ ẢNH PHẢI KÈM NGÀY — bài học đợt 10/09/2026
> Trước đây mỗi ngày Cowork đánh lại mã từ `dn01`, nên mã ngày 10/09 trùng y hệt mã
> ngày 05/09. Web dùng `ma_anh` để nhận ra "tin này đã đăng rồi" → **30/34 tin của đợt
> 10/09 không lên được**, mà ảnh mới thì chui vào **tin của người khác** cùng mã.
>
> Nay web đã tự chống (chỉ đối chiếu với tin đăng trong 3 ngày), nhưng **mã kèm ngày là
> cách chắc chắn nhất**: `dn01-1009` (ngày 10 tháng 09). **Tên tệp ảnh cũng theo mã đó**:
> `dn01-1009-1.jpg`, `dn01-1009-2.jpg`… — ảnh khớp về tin theo tiền tố tên tệp.

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

### ⭐ MỚI (17/09/2026) — BÓC CẢ THÔNG TIN NẰM TRONG BÀI VIẾT, KHÔNG CHỈ Ở BẢNG THÔNG SỐ

Trang nguồn có **bảng thông số** (diện tích, hướng, pháp lý…) và có **bài mô tả** người bán tự
viết. Rất nhiều thứ **chỉ nằm trong bài mô tả**, không có trong bảng thông số — trước đây bị
bỏ qua hết, nên tin lên web trống trơn dù tin gốc nói đủ.

**Luật: đọc HẾT bài mô tả, thấy thông tin nào khớp một cột của Coastal Land thì đưa vào
đúng cột đó** — kể cả khi trang nguồn không có mục ấy.

| Trong bài mô tả người bán viết | Bóc vào cột |
|---|---|
| "nhà 3 tầng, đúc kiên cố" | `so_tang` = `3` |
| "đường trước nhà 7,5m, ô tô tránh nhau" | `duong_vao` = `7.5` |
| "ngang 5m dài 21m" | `mat_tien` = `5` · `chieu_dai` = `21` |
| "sổ hồng riêng, công chứng ngay" | `phap_ly` = `Sổ hồng chính chủ` |
| "hướng Đông Nam, ban công hướng biển" | `huong` = `Đông Nam` · `huong_ban_cong` = ghi đúng hướng |
| "nhà xây 2019" | `nam_xay_dung` = `2019` |
| "căn tầng 12 toà A" | `tang_so` = `12` |
| "full nội thất: máy lạnh, tủ bếp, giường…" | `tinh_trang_noi_that` = `Đầy đủ` · `noi_that_ban_giao` = liệt kê đúng danh mục A12 |
| "hồ bơi, gym, an ninh 24/7" | `tien_ich` = theo danh mục A12 |
| "cọc 3 tháng, thuê tối thiểu 1 năm" | `tien_coc` = `3 tháng` · `thoi_han_thue` = `1 năm` |
| "điện 3.500đ/kWh, nước theo giá nhà nước" | `muc_gia_dien` · `muc_gia_nuoc` |
| "xưởng cao 8m, có PCCC, xe container vào tận nơi" | `chieu_cao` · `pccc` · `xe_container` |
| "dọn vào ở ngay sau Tết" | `thoi_gian_du_kien_vao_o` |

**Ba ranh giới không được vượt:**
1. **Chỉ bóc thứ người bán THẬT SỰ viết.** "Gần biển" không thành `Gần biển 500m`.
2. **Bóc ra cột riêng thì VẪN GIỮ NGUYÊN câu đó trong `mo_ta`** — không cắt chữ của người bán.
3. Câu mơ hồ ("nhà mới đẹp", "giá tốt") **không phải thông tin** — đừng nhét vào cột nào.

## A15. Bảng cột đầy đủ — 54 cột

> ### ⚠️ FILE MẪU ĐÃ ĐỔI: 25 CỘT → 54 CỘT
> Bản Cowork dùng trước đây chỉ có **25 cột**, thiếu 23 cột — trong đó có cả `nguon`,
> `link_anh`, `ghi_chu`, `duong_vao`, `mat_tien`, `so_tang`. Đợt 19/09 thêm cột thứ 52:
> **`dien_tich_xay_dung`**.
> **Tải lại `mau-nhap-tin-hang-loat.csv`.** Dùng bản cũ là mất dữ liệu đã gom.

Giữ nguyên dòng tên cột, **không đổi tên, không xoá cột, không đổi thứ tự**.
Mỗi dòng đúng một tin. Lưu dạng **`.csv` (UTF-8)** hoặc **`.xlsx`** — web đọc được cả hai.

| Nhóm | Cột |
|---|---|
| **Bắt buộc** — thiếu là web báo đỏ, không đăng được | `tieu_de` · `mo_ta` · `dien_tich` · `muc_dich` · `loai_hinh` · `tinh_thanh` · `phuong_xa` · `ma_anh` · **`lien_he_sdt`** ⭐ |
| **Địa chỉ hệ CŨ** ⭐ *(mới 17/09)* | `phuong_xa_cu` · `quan_huyen_cu` · `tinh_cu` |
| **Giá** | `gia` · **`don_gia_thue`** ⭐ · **`chu_ky_thue`** ⭐ · **`don_gia_ban`** ⭐ |
| **Quy mô, kích thước** | **`dien_tich_xay_dung`** ⭐ · `duong_vao` · `mat_tien` · `so_tang` · **`chieu_dai`** ⭐ · **`nam_xay_dung`** ⭐ · **`tang_so`** ⭐ · `phong_ngu` · `phong_tam` |
| **Kho · nhà xưởng · bãi** | **`dien_tich_su_dung`** ⭐ · **`loai_kho`** ⭐ · **`chieu_cao`** ⭐ · **`tai_trong_nen`** ⭐ · **`cong_suat_dien`** ⭐ · **`pccc`** ⭐ · **`van_phong_trong_kho`** ⭐ · **`xe_container`** ⭐ |
| **Riêng tin cho thuê** | `thoi_gian_du_kien_vao_o` · **`thoi_han_thue`** ⭐ · **`tien_coc`** ⭐ · `muc_gia_dien` · `muc_gia_nuoc` |
| **Vị trí** | `dia_chi` · `ten_du_an` |
| **Thuộc tính** | `hang_tin` *(LUÔN để trống)* · `phap_ly` · `huong` · `huong_ban_cong` · `tinh_trang_noi_that` · `noi_that_ban_giao` · `tien_ich` |
| **Liên hệ** | `lien_he_ten` · `lien_he_sdt` · `lien_he_email` |
| **Nội bộ** *(không lên web)* | `ghi_chu` · `nguon` · `link_anh` |
| **Ảnh / video** | `anh` *(để trống)* · `video` |

⭐ = cột **MỚI** so với bản mẫu cũ. Đợt 17/09/2026 thêm **3 cột địa chỉ hệ cũ**
(`phuong_xa_cu` · `quan_huyen_cu` · `tinh_cu`) và chuyển `lien_he_sdt` sang nhóm **bắt buộc**.
Đợt 19/09/2026 thêm **3 cột nữa**: **`dien_tich_xay_dung`** (m² sàn của nhà — xem **A8**),
**`don_gia_ban`** (đơn giá người bán tự niêm yết — xem **A6b**), **`chu_ky_thue`**
(tin báo giá theo quý/năm — xem **A7**).

**`hang_tin` LUÔN ĐỂ TRỐNG.** Cowork không quyết hạng tin — chủ dự án tự nâng khi đăng.
**`nguon`** — mọi dòng đều phải có **link tin gốc**. Không có link thì ghi nơi lấy + ngày giờ thấy tin.

---
---

# 🅲 GÓI C — LỊCH SỬ GIÁ THEO KHU VỰC ⭐ MỚI 19/09/2026

> Đây là kho số làm nên biểu đồ **Lịch sử giá** trên từng trang tin — thứ khách xem để biết
> khu đó đang lên hay xuống. Nộp bằng file mẫu **`mau-lich-su-gia.csv`**
> (admin → **Lịch sử giá** → *Tải tệp mẫu*). File đã dựng sẵn khung, chỉ việc điền cột giá.

## C1. Mỗi dãy số định danh bằng NĂM chiều

> **Tỉnh/Thành → KHU VỰC (phường/xã) → VỊ TRÍ (đường) → LOẠI HÌNH → Bán/Thuê**

Xếp từ chiều quyết định nhiều nhất tới ít nhất. **Vị trí đứng trên loại hình**, vì trong
cùng một phường thì khoảng cách giữa mặt tiền đường lớn và kiệt hẻm còn xa hơn khoảng cách
giữa hai loại hình.

## C2. ⭐ Cột `mau_so` — giá này tính trên m² GÌ

| Loại hình | `mau_so` | Cách thu |
|---|---|---|
| Đất nền · nông nghiệp · công nghiệp | `dat` | tổng giá lô ÷ **m² đất** |
| **Nhà** riêng · mặt phố · biệt thự · shophouse | **`san`** | tổng giá cả căn ÷ **tổng m² sàn** |
| Căn hộ · chung cư · condotel | `can` | tổng giá căn ÷ **m² căn** |

File mẫu **đã điền sẵn đúng cho từng dòng** — cứ theo đó mà thu, đừng sửa.

> ### ⚠️ ĐỔI CÁCH THU CHO NHÀ
> Số cũ trong hệ thống thu theo **m² đất** (đo 7/7 dãy đều vậy) — thông lệ báo cáo thị
> trường, không sai, nhưng **không đem so với tin được**.
>
> Nhà 12 tỷ · 99,5 m² đất · 263,3 m² sàn:
> chia m² đất ra **121 triệu/m²**, chia m² sàn ra **46 triệu/m²** — lệch 2,6 lần.
>
> **Nguồn:** tin rao ghi đủ *DT đất + DT sàn + tổng giá* thì tự chia ra; báo cáo nào công bố
> theo m² sàn thì ghi rõ nguồn. **Không có số theo m² sàn thì để trống dòng đó** — đừng lấy
> số m² đất điền vào rồi ghi `san`.

## C3. ⭐ Cột `vi_tri` — con đường trước nhà

Giá lệch rất xa **ngay trong cùng một phường**, tuỳ con đường:

| Ghi | Nghĩa |
|---|---|
| `lon` | mặt tiền đường lớn — từ **10 m** |
| `nho` | mặt tiền đường nhỏ — **5 – 10 m** |
| `kiet` | kiệt / hẻm — **dưới 5 m** |
| *(để trống)* | mức chung cả khu vực, chưa tách |

Ví dụ thật, cùng phường cùng loại hình: `lon` **95** · *(trống)* **70** · `kiet` **48** triệu/m².

Tách được thì tách — số mới nói đúng về từng căn. Chưa tách cũng không sao, web tự ghi thêm
dòng *"Mức chung của cả khu vực — chưa tách theo vị trí"* để người xem không hiểu nhầm.

## C4. Các cột còn lại

| Cột | Ghi gì |
|---|---|
| `ky` | `2026-08` (tháng) · `2026-Q2` (quý) · `2025` (năm) |
| `gia_m2_trieu` | giá phổ biến, đơn vị **TRIỆU đồng/m²** (`78,5`) |
| `gia_thap_trieu` · `gia_cao_trieu` | mức thấp / cao của kỳ → vẽ hai đường biên |
| `so_mau` | kỳ này tính từ bao nhiêu tin — **không hiện ra cho khách** |
| `nguon` · `nguon_link` | ai công bố + link tra lại. **Số nào cũng phải truy được về gốc.** |

⛔ **Ô giá bỏ trống là bình thường** — khung dựng sẵn nhiều dòng, mỗi đợt điền một phần.
Chỉ đừng điền số mà không có nguồn.

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

**Địa bàn:** ưu tiên **Đà Nẵng · Huế · Quy Nhơn · Nha Trang · Phan Thiết · Quảng Trị · Quảng Ngãi**.
Mỗi ngày phải có **ít nhất 3 bài gắn địa danh cụ thể** — đây là điểm mạnh cạnh tranh của
Coastal Land so với các trang toàn quốc.

> ### ⭐ CHỐT 17/09/2026 — ĐỦ 5 BÀI · ĐA DẠNG · MỖI BÀI PHẢI ĐƯỢC "FINAL"
>
> **1. Đủ 5 bài mỗi ngày**, không ngày nào giao 3–4 bài rồi ghi "không tìm được tư liệu".
>
> **2. Đa dạng theo đúng cấu trúc chuyên mục của web** — 5 bài KHÔNG được rơi hết vào một
> chuyên mục hay một khu vực. Mỗi ngày: **ít nhất 3 chuyên mục khác nhau** và
> **ít nhất 3 khu vực khác nhau** trong 7 khu vực ở A1.
>
> **3. Tư liệu lấy từ NHIỀU nguồn, và phải là nguồn tra được:** cổng thông tin tỉnh/thành,
> Sở Xây dựng, Tổng cục Thống kê, báo lớn (VnExpress, Tuổi Trẻ, Thanh Niên, CafeF,
> CafeLand, Báo Đầu tư), công bố của chủ đầu tư. **Không lấy số từ bài của trang rao vặt
> khác rồi chép lại.**
>
> **4. FINAL từng bài trước khi giao** — tự rà đủ 6 mục này, bài nào chưa đạt thì viết lại,
> **đừng giao bản nháp**:
>
> - [ ] Từ khoá chính xuất hiện đủ **5 chỗ** (B2), mật độ 1–2%, không nhồi
> - [ ] `tieu_de` 50–65 ký tự · `mo_ta_ngan` 140–160 ký tự · `slug` không dấu, có từ khoá
> - [ ] Nội dung **≥ 800 chữ**, có tiêu đề phụ, đoạn ngắn 3–4 dòng
> - [ ] **Mọi con số đều ghi rõ nguồn và mốc thời gian** ("theo Sở Xây dựng Đà Nẵng,
>       quý II/2026") — không có nguồn thì **bỏ con số đó đi**, đừng viết chung chung
> - [ ] Tự viết 100%, **không chép đoạn nào** của bài khác
> - [ ] Không câu nào biến Coastal Land thành bên môi giới / định giá / nhận ký gửi
>
> **Thông tin sai một lần là mất uy tín cả trang** — thà bài ngắn mà đúng.
>
> **5. NỘI DUNG VÀ NGÔN NGỮ PHẢI LÀ CỦA NGƯỜI VIỆT, VIẾT CHO NGƯỜI VIỆT:**
> - **Tiếng Việt có dấu, đúng chính tả**, viết hoa tên riêng đúng chuẩn.
> - **Không văn dịch máy**: không "điều này cho phép…", "một trong những… nhất", câu bị động
>   dài dòng. Viết như người Việt nói: câu ngắn, chủ ngữ rõ, xuống dòng thoáng.
> - **Không chèn tiếng Anh khi tiếng Việt có từ**: viết *căn hộ* không phải *apartment*,
>   *mặt bằng bán lẻ* không phải *retail space*, *dòng tiền* không phải *cashflow*.
>   Thuật ngữ buộc phải dùng thì mở ngoặc giải thích một lần.
> - **Bối cảnh phải là Việt Nam**: đơn vị **m² · tỷ · triệu · VNĐ**, pháp lý theo luật Việt
>   Nam (sổ đỏ, sổ hồng, quy hoạch 1/500), mốc thời gian theo lịch dương Việt Nam.
>   Không lấy ví dụ, số liệu hay tên cơ quan của nước ngoài.
> - **Giọng văn**: người trong nghề nói chuyện với người mua nhà — thẳng, dễ hiểu,
>   không hoa mỹ, không hô khẩu hiệu, không hứa lợi nhuận.

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


## B6. 📝 ĐẶT BÀI RIÊNG — **LOẠN GIÁ NHÀ ĐẤT** ⭐ phiên tới

**Chuyên mục:** `Phân tích thị trường` · **2 bài** · Đà Nẵng (bài 1) · Huế hoặc Nha Trang (bài 2)

Đây đúng là vấn đề Coastal Land vừa giải bằng dữ liệu, nên viết được sâu hơn nơi khác.

### Bài phải trả lời được 4 câu

1. **Vì sao cùng một khu mà giá loạn?** — vị trí (đường lớn / đường nhỏ / kiệt hẻm), pháp lý
   (sổ riêng · sổ chung · chờ sổ), tình trạng công trình, tin rao "giá ảo" để câu cuộc gọi.
2. **Cùng một căn sao lại có hai con số?** — giá trên **m² đất** và trên **m² sàn** là hai
   thứ khác nhau. Lấy ví dụ tính ra số cụ thể cho người đọc thấy.
3. **Người mua tự kiểm bằng cách nào?** — đối chiếu ít nhất 3 tin cùng phường **cùng hạng
   đường**, hỏi rõ đơn giá tính trên m² gì, kiểm loại sổ đúng với loại hình.
4. **Mức giá tham chiếu khu vực đó đang bao nhiêu?** — số phải có nguồn và mốc thời gian.

### Ràng buộc

- ⛔ **Không** viết Coastal Land định giá, thẩm định, môi giới hay bảo đảm giá.
  Cách đúng: *"Coastal Land là cổng thông tin; mức giá tham chiếu tổng hợp từ báo cáo thị
  trường và tin đăng, người mua vẫn cần tự kiểm tra thực địa."*
- ⛔ **Không** nêu tên sàn đối thủ khi nói về tin rao giá ảo.
- ✔ Mọi con số kèm **nguồn + mốc thời gian**; không có nguồn thì bỏ con số đó.
- ✔ Có **ví dụ tính tay** để người đọc làm theo được.

### Từ khoá gợi ý

`loạn giá nhà đất Đà Nẵng` · `giá nhà đất mỗi m² tính thế nào` ·
`giá đất theo mặt tiền và kiệt hẻm` · `cách kiểm tra giá nhà đất có hợp lý không`

---

# 📊 TỔNG KẾT CÁC SHEET

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

# 📝 `bao-cao.txt` — CHUNG CHO CẢ BA GÓI

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
    - Bang-<NĂM-THÁNG-NGÀY>.csv      (GÓI A — 34 tin, 54 cột)
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
  - Bang-<NGÀY>.csv     (34 tin bất động sản, 54 cột)
  - TinTuc-<NGÀY>.csv   (5 bài tin tức, 9 cột)
  - bao-cao.txt
Làm đúng như hướng dẫn của project. Xong báo tôi.
```

> `<NGÀY>` viết dạng `NĂM-THÁNG-NGÀY` — ví dụ `2026-09-10`.
> **Đây là câu duy nhất đổi theo ngày.** Mọi thứ khác giữ nguyên mãi mãi.

## Phần 3 — FILE ĐÍNH KÈM VÀO PROJECT *(gỡ hết bản cũ trước khi đính)*

```
_MAU\YEU-CAU-COWORK.md                    (tài liệu DUY NHẤT)
_MAU\mau-nhap-tin-hang-loat.csv           (khuôn gói A — 54 cột + 17 ví dụ)
_MAU\mau-tin-tuc-hang-ngay.csv            (khuôn gói B — 9 cột + 2 bài mẫu)
_MAU\DANH-SACH-PHUONG-XA-MIEN-TRUNG.txt   (734 phường/xã, 8 tỉnh)
```

**Đúng 4 file.** Gỡ mọi bản cũ (`DE-BAI-CHO-COWORK.md`, `LENH-COWORK.txt`,
`YEU-CAU-COWORK-30-08*.md`, file mẫu 25 cột) ra khỏi project trước khi đính bản mới —
để Cowork không đọc nhầm hướng dẫn cũ.
