# BÀN GIAO 31/10/2026 — PHẦN DỰ ÁN (đọc HẾT file này trước khi làm)

> Phiên nhận: làm tiếp phần **Dự án** (trang /du-an, thẻ dự án, trang chi tiết dự án nổi bật + dự án tra cứu).
> Làm thẳng ở `C:\Users\X1 GEN 8\Projects\cvr-website`, nhánh `main`, **CẤM worktree**.
> Bản trước: `BAN-GIAO-30-10.md` (mục 3 — việc điều phối hằng ngày — VẪN CÒN, chưa làm).
> Ghi nhớ đã ghi: memory `the-du-an-mot-chuan` (chuẩn thẻ dự án). Đọc cả file đó.

## 0. CÁCH LÀM VIỆC VỚI CHỦ DỰ ÁN (phiên 31/10 làm sai rất nhiều điều này — chủ rất bực)

1. **Nói ít, ngắn.** Trả lời đúng câu hỏi, vài dòng. Không giải thích dài, không liệt kê phương án dài.
2. **Đọc hết yêu cầu đã chốt TRƯỚC khi làm** (file này + memory). Chủ đã bàn giao thì cấm để chủ nói lại.
3. **Tự soát kỹ trước khi báo "xong"**: chụp màn hình THẬT + đo bằng JS, đủ mọi trường hợp (xem mục 4), PC + điện thoại.
   ⛔ Phiên 31/10 báo xong 3 lần mà chủ thấy lỗi (tên bị che, khung ảnh xám, chừa khoảng trống) → chủ chửi "đừng giơ rác".
4. **Không hiểu → hỏi MỘT câu ngắn** kèm 2–3 lựa chọn. Hiểu rồi → làm luôn, không hỏi lại.
5. Chủ chỉ cần **MỘT link** để xem, tự cập nhật — gửi đúng 1 link.
6. Chỉ push khi chủ gõ đúng **"Push"**. Push xong: `npx next build` sạch trước (xoá `.next` trước), chờ Vercel READY rồi mới báo.
7. ⚠️ Bẫy màn hình: ảnh chụp trong khung xem của Claude hay ra **xám** dù ảnh đã tải (khi trang có hiệu ứng). Muốn chắc ảnh có hiện
   thì đo `img.complete/naturalWidth` + **ẩn thử lớp trên** để biết có bị đè không (đã có lỗi thật: lớp nền mờ đè ảnh).

## 1. Tình trạng mã

| | |
|---|---|
| Web đang chạy | `origin/main` = **a5fcc52** |
| Trên máy, chưa push | 22 commit của 30/10 (`1b20d10`→`5d10c5d`) + **34 commit 31/10** (`60e900d`→`f2d2fde`) |
| Máy xem thử | http://localhost:3001 (cấu hình `xem-thu-3001` trong `.claude/launch.json`; tắt thì `.claude\xem-thu-3001.cmd`). Ngày 31/10 máy này từng treo (mọi trang 404) → tắt hẳn tiến trình cổng 3001 rồi chạy lại là hết |
| Rác đừng commit | `next-env.d.ts`, `.claude/*.jpg|png`, `public/_mau-*.html`, `public/_so-sanh-*`, `scripts/_tam-doc.mjs` |
| Trước khi push | `rm -rf .next && npx next build` phải sạch; ⚠️ trang demo `demo-tra-cuu*` chỉ chạy khi `NODE_ENV !== "production"` (không lên web thật) |

## 2. ĐÃ XONG 31/10 (chủ đã xem — không đổi nếu chủ không yêu cầu)

### 2.1 Trang chi tiết dự án NỔI BẬT (ví dụ `/du-an/s-light-tower-da-nang`)
- Bảng **Tổng quan**: 2 cột, đọc trái → phải đúng thứ tự chốt: **Chủ đầu tư → Loại hình → Diện tích dự án → Quy mô → Loại hình căn hộ →
  Số lượng căn hộ → mục khác theo thứ tự Admin**. Dự án thường (không VIP) có thêm dòng **Tình trạng** sau Loại hình.
- Chuẩn chữ: nội dung 15 px · nhãn 14 px · dòng cao 24 px · các dòng cách 12 px · tiêu đề mục 24 px cách nội dung 20 px · mục cách mục 48 px.
- Giới thiệu cách bảng 32 px. Tiện ích 2 cột thẳng hàng bảng Tổng quan.
- Tiêu đề/mô tả Google: chỉ ghi giá khi Admin cho hiện giá.

### 2.2 MỘT NGUỒN = ADMIN (nhập liệu · hiển thị · Cowork · SEO đồng bộ)
- `src/lib/thongSoDuAn.ts`: MỘT cách xếp bảng thông số cho **form Admin** + **trang web** + **nạp hàng loạt** (4 dòng chuẩn đứng đầu; tên cùng nghĩa
  "Diện tích/Diện tích đất/Số căn/Sản phẩm…" đổi về tên chuẩn khi nạp). Form Admin luôn có sẵn 4 dòng chuẩn.
- `src/lib/csvDuAn.ts` + mẫu CSV (`public/mau-nhap-du-an.csv` = `D:\Coastal Land\SEO\MAU\mau-nhap-du-an.csv`) + sheet "Dự án" trong
  `MAU-DANG-TIN-HANG-LOAT.xlsx` + yêu cầu Cowork mục 12 (`YEU-CAU-COWORK-DANG-TIN-HANG-LOAT.md`): cùng cột, cùng thứ tự, có `toa_do`.
  Bản cũ để ở `D:\Coastal Land\SEO\_cu\`.
- `src/lib/truongDuAn.ts`: **trường bắt buộc** (tên · địa chỉ · loại hình · tình trạng · chủ đầu tư) — `giaTriThat()` bỏ chữ thay thế
  ("Đang cập nhật", "Dự án bất động sản"). Mọi thẻ + trang chi tiết + mô tả Google + JSON-LD dùng hàm này. Trống → "Đang cập nhật".
- `contentDb.ts`: tình trạng = đúng Admin ghi (bỏ tự gán "Đang mở bán").
- Admin lưu / duyệt dự án → web xoá bộ nhớ đệm ngay (`lamMoiWeb`) — đã có sẵn, đã kiểm.

### 2.3 Thẻ dự án — MỘT chuẩn mọi nơi (chi tiết: memory `the-du-an-mot-chuan`)
- Nơi: trang chủ (`ProjectsSection`), /du-an (`ProjectsBrowser` → `theDuAnWeb`), Dự án tương tự (`TheDuAnDoc` trong `TraCuuDuAn.tsx` — LÀM MẪU).
- **Chỉ dòng Vị trí có biểu tượng**; dòng khác nhãn đậm "Loại hình: …", "Tiến độ: …"; dòng cuối "Chủ đầu tư: …" + giá; gạch ngang trên.
- **Loại hình gom 1 dòng** (dài → lấy loại hình chính, `loaiHinhThe`). **Địa chỉ đầy đủ**, được xuống dòng.
- **Nhãn tình trạng**: chỉ dự án VIP (Kim cương/Vàng/Bạc) → nhãn trên ảnh, màu cấp lấy từ `packages.ts`, nhỏ 18 px, cách góc 8 px —
  một component `src/components/NhanTinhTrang.tsx`. Dự án thường → dòng "Tiến độ:".
- Thẻ Dự án tương tự gọn, cao theo nội dung (chủ chấp nhận vài thẻ dài cao hơn) — như thẻ tin mua bán.
- Thẻ /du-an: khung chữ cao theo nội dung (tối thiểu 109 / 178 px) — đã sửa lỗi tên bị che.
- Đã soát 81 thẻ (trang chủ 16 · /du-an 45 · tương tự 8 · Xem thêm 12): đủ 5 trường, không thẻ nào bị cắt chữ.

### 2.4 Sắp xếp
- Dự án nổi bật theo cấp VIP; dự án tra cứu theo tên A–Z.
- **Dự án tương tự**: cùng tỉnh (bắt buộc) → cùng loại hình → cùng chủ đầu tư; trong nhóm: nổi bật theo VIP, tra cứu A–Z.
- Dải thẻ và "Xem thêm" (12 dự án/trang) cùng một thẻ.

## 3. ĐANG DỞ — TRANG CHI TIẾT DỰ ÁN TRA CỨU (VIỆC SỐ 1 của phiên sau)

**Chủ CHƯA duyệt. Chủ chê nhiều lần ("mất thẩm mỹ", "nhìn không được").** Đã thử 7 bố cục trong ngày — xem mục 3.3, ĐỪNG lặp lại.

### 3.1 Yêu cầu chủ dự án (nguyên ý, gom đủ)
- Dự án tra cứu có **TRANG HIỂN THỊ RIÊNG** (chủ đã chấp nhận — không chung khuôn dự án nổi bật). Dự án nổi bật GIỮ NGUYÊN.
- Trang **chỉ có: 1 khung ảnh (ảnh đại diện), tên, thông tin cơ bản**. Có từ 2 ảnh → **tự chạy slide**. Bấm ảnh → xem to.
- **Ảnh tra cứu lấy từ nhiều nguồn, cỡ/tỷ lệ khác nhau, không chỉnh được** → khung không được cắt hỏng ảnh, không để trống.
- **Nội dung ngoài trường bắt buộc chỉ hiện khi Admin có nhập.** Nhiều hay ít nội dung → **giao diện không thay đổi** (khối đầu trang cố định).
- **Tính đủ trường hợp**: dự án mặc định (chỉ trường bắt buộc) · có thêm thông tin · không ảnh · 1 ảnh · nhiều ảnh · dự án chỉ biết từ tin rao.
- **Tập trung SEO**; bỏ phần không cần thiết cho gọn. ⛔ **"Dự án theo khu vực" KHÔNG được bỏ** (chủ nói "không được").
- Phải **cân đối toàn trang** — không khoảng trắng vô lý, không lệch.
- Chủ gửi ảnh **trang Mua bán** làm mẫu bố cục: tiêu đề trên cùng; cột trái khối ảnh to; cột phải hộp, mép trên ngang mép trên ảnh.

### 3.2 Bản đang có (commit `f2d2fde`) — chủ chưa xem bản này
- Tên + địa chỉ trên cùng (H1). Cột trái: ảnh to 800 × 450 (`src/components/AnhTraCuu.tsx`: ảnh hiện trọn `object-contain`, nền chính ảnh làm
  mờ lấp khung, tự chuyển 4,5 s, chấm chuyển ảnh, bấm xem to bằng `PhotoViewer`, chưa có ảnh → khung xám + logo). Cột phải: hộp 3 trường
  bắt buộc (Chủ đầu tư · Loại hình · Tình trạng) + hộp "Dự án theo khu vực" (mép trên ngang ảnh; đáy cột phải 594 vs đáy ảnh 632 — lệch 38 px).
- Bên dưới: mục Tổng quan (chỉ mục Admin ghi thêm + giới thiệu), Tiện ích (nếu có), bản đồ **chỉ khi Admin ghim toạ độ** (`p.mapPin`),
  Tin thuộc dự án (nếu có), Dự án tương tự.
- Đã bỏ ở trang tra cứu: thanh mục dính, form "Tải tài liệu & báo giá".
- Mã: `src/app/du-an/[slug]/page.tsx` — biến `traCuu` (= `p.dangThe || tuTin`), `hangBatBuoc` / `hangThem`, `coCotPhai`, `coMucTongQuan`.

### 3.3 Đã thử và chủ CHÊ — đừng làm lại
1. Khung ảnh 800 × 450 chỉ ở cột trái, đầu trang → chủ: "khoảng trống bên phải làm gì".
2. Khung rộng hết khổ 1216 × 300 → ảnh thường chỉ chiếm ~450 px giữa, hai bên mờ.
3. Ảnh 384 × 216 bên phải tên, tên + bảng bên trái → chủ chưa ưng, đòi "đưa hình vào cột trái cạnh tên".
4. Bảng giãn (tên thẳng mép trên ảnh, bảng thẳng mép dưới ảnh) → chừa khoảng trống giữa địa chỉ và bảng.
5. Bỏ cột phải, nội dung rộng hết khổ → chủ: "không được, rất không được và mất thẩm mỹ".
6. Ảnh 288 × 162 trong cột trái cạnh tên, cột phải ngang đầu → chủ chửi.
7. (Lỗi) lớp nền mờ đè ảnh → khung xám — ĐÃ SỬA bằng `z-0`/`z-[1]` trong `AnhTraCuu`.

### 3.4 Việc phiên sau
1. Mở bản `f2d2fde`, tự soát đủ trường hợp (mục 4), sửa chỗ lệch 38 px cột phải/ảnh nếu cần, chụp màn hình THẬT.
2. Gửi chủ **1 link** + 1 câu: http://localhost:3001/du-an/demo-tra-cuu. Chủ chê → hỏi **một câu**: chê chỗ nào (ảnh to quá · cột phải ·
   bảng thông tin…), rồi sửa đúng chỗ đó. KHÔNG tự đổi cả bố cục lần nữa.
3. Duyệt xong → làm bản điện thoại (hiện: ảnh trên tràn viền, chữ dưới; đã kiểm không tràn ngang).
4. Trước push: XOÁ hoặc giữ trang demo? (`DU_AN_DEMO` cuối `page.tsx`, chỉ chạy dev) — hỏi chủ.

## 4. Bộ kiểm bắt buộc trước khi báo (trang tra cứu)

| Trường hợp | Link |
|---|---|
| Nhiều ảnh + có thêm thông tin | http://localhost:3001/du-an/demo-tra-cuu |
| 1 ảnh, chỉ trường bắt buộc | http://localhost:3001/du-an/demo-tra-cuu-1-anh |
| Không ảnh, tên + địa chỉ dài | http://localhost:3001/du-an/demo-tra-cuu-khong-anh |
| Dự án chỉ biết từ tin (thật) | http://localhost:3001/du-an/apec-mandala-wyndham-binh-thuan |
| Dự án nổi bật — PHẢI KHÔNG ĐỔI | http://localhost:3001/du-an/s-light-tower-da-nang |

Mỗi trang: PC 1440 + điện thoại 375 · 1 H1 · ảnh hiện thật (không xám) · không tràn ngang · các mục cách 48 px · không khoảng trắng vô lý.

## 5. Việc khác còn treo (từ bàn giao 30/10, chưa làm)
- Nạp **39 hồ sơ dự án** `D:\Coastal Land\SEO\DA-DUYET\30102026\du-an-GOM-chua-len-30102026.csv` (đã thử nạp trên máy: 0 lỗi; **hồ sơ không có
  ảnh nào** — Cowork cần bổ sung cột `anh`). Ghi DB phải được chủ OK.
- Đợt tin dn10, dn11 thiếu SĐT (chờ chủ) · gắn lại 2 tin sai dự án (chờ chủ OK) · ghi VIEC.md cho Cowork (nguon + toa_do + anh) · khối ✍ ANH CẦN DUYỆT.
- Lỗi SEO /du-an: HTML máy chủ chỉ có 21 link dự án / ~45, sitemap 11 link dự án — dự án ở trang 2–4 Google không thấy (chưa sửa).
- Tệp `MEMORY.md` gần 200 dòng — cần gọn lại.

## 6. CẬP NHẬT CUỐI NGÀY 31/10 (phiên trang dự án chi tiết — đã soát A→Z, Z→A, PC 1440 + điện thoại 375)

**Trang chi tiết dự án — đã làm theo chủ dự án trong ngày (chưa push, chờ chủ duyệt):**
- Nổi bật: tên + địa chỉ lên trên, khung ảnh như cũ; bỏ Dự án tương tự (cả 2 loại); BreadcrumbList thêm tỉnh (chỉ dữ liệu, không hiện).
- Tra cứu: hàng đầu trang 3 cột bằng nhau — khung ảnh 16:9 (≥ 2 ảnh tự chạy, hiện trọn) · bảng thông tin (trường bắt buộc + mục Admin) · Dự án theo khu vực; mục có thông tin mới hiện; thanh mục khi ≥ 2 mục; điện thoại chưa ảnh thì bỏ khung.
- Thu gọn kiểu Batdongsan: `ThuGonTrang` bao từ Tổng quan tới mục cuối, Xem thêm ở chỗ cắt, Thu gọn cuối phần thông tin; MỘT luật chỗ cắt `diemCat` (src/lib/thuGon.ts) — không cắt ngang ảnh/bản đồ/video/bảng, không treo tiêu đề; mô tả tin dùng chung. Memory `xem-them-thu-gon-kieu-bds`.
- Tin thuộc dự án: xếp chuẩn cả web (cấp → mốc); trang chỉ gửi 8 tin/nhóm + mã tin, Xem thêm nạp từng trang ở máy chủ; sửa `/api/danh-sach/[muc]/loc` không chèn tin hết hạn cả web khi lọc theo mã (hết thừa trang — áp cả Tin tương tự).
- pSEO: khối "Tìm kiếm phổ biến" (TabTimKiemPhoBien) gom tin dự án + trang mua bán/cho thuê + hệ trang dự án; đã bỏ Câu hỏi thường gặp theo chủ.
- Điện thoại: ảnh + video dùng bộ ảnh trang tin (Gallery, kiểu Facebook); Liên hệ + Tải tài liệu gộp một khối sau tin; Dự án theo khu vực xuống cuối (KhuVucLinks); thanh Quay lại luôn đúng tên; mọi khối cách 48 px.
- Thẻ dự án: trang chủ điện thoại đồng nhất (địa chỉ phường + tỉnh, loại hình chính, đủ dòng Tiến độ, cao bằng nhau); thẻ tra cứu điện thoại xếp như nổi bật (ảnh trên 5:2, không ảnh thì bỏ khung, chữ không cắt); chia trang theo chiều cao thẻ từng màn hình; Xem thêm trang chủ ra "Dự án bất động sản", điện thoại ẩn dòng tiêu đề này (vẫn H1/HTML).

**Đã soát:** 288 liên kết của vòng (trang chủ, /du-an, /du-an/da-nang, 2 nổi bật, demo tra cứu, Apec) — chỉ 1 link hỏng ở trang demo (chủ đầu tư giả, chỉ máy dev). Luồng trang chủ → Xem thêm → trang 3 → dự án tra cứu → tin → về dự án → Quay lại: chạy đúng.

**Còn treo:** chủ chưa duyệt bản cuối; chưa bấm thử trên điện thoại thật; câu chữ tên tab "Tìm kiếm phổ biến" và từ khoá dự án là chữ Claude ghép theo công thức kế hoạch SEO — chưa duyệt; trang demo `DU_AN_DEMO` (chỉ dev) — hỏi chủ xoá hay giữ trước push; ảnh bìa /du-an có 1 link rỗng từ trước.

**Link xem (máy xem thử cổng 3001; điện thoại cùng wifi thay `localhost` bằng `192.168.0.189`):** nổi bật http://localhost:3001/du-an/can-ho-5-sao-goldenbay-son-tra ·
tra cứu đủ phần http://localhost:3001/du-an/demo-tra-cuu · tra cứu 1 ảnh …/du-an/demo-tra-cuu-1-anh · không ảnh …/du-an/demo-tra-cuu-khong-anh ·
chỉ biết từ tin …/du-an/apec-mandala-wyndham-binh-thuan · danh sách …/du-an · trang chủ http://localhost:3001/
**Trước push:** `rm -rf .next && npx next build` phải sạch (phiên này chỉ chạy `tsc --noEmit` — sạch, CHƯA chạy next build).
