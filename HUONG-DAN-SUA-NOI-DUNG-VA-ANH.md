# HƯỚNG DẪN SỬA NỘI DUNG & HÌNH ẢNH TRỰC TIẾP TRONG VS CODE

> Dành cho chủ dự án COASTAL LAND — tự đổi **chữ và ảnh** của web mà không cần biết lập trình.
> Chữ sửa trong VS Code, ảnh tải lên qua Admin. Mọi đường dẫn tính từ thư mục gốc dự án:
> `C:\Users\X1 GEN 8\Projects\cvr-website`.

---

## ⭐ NGUYÊN TẮC CHIA VIỆC — NHỚ ĐÚNG MỘT CÂU NÀY

> **ẢNH thì vào Admin. CHỮ thì mở VS Code.**

| | Sửa ở đâu | Gồm những gì |
|---|---|---|
| 🖼️ **ẢNH** | **Admin** — `coastalland.vn/admin/noi-dung` | Hero trang chủ · ô khu vực · 2 banner cuối trang chủ · banner trang Dự án · ảnh trang Giới thiệu · ảnh tin, dự án, bài viết |
| 📝 **CHỮ** | **VS Code** | 9 trang văn bản (Điều khoản, Bảo mật, Quy chế, Quy định, FAQ, Liên hệ, Hướng dẫn, Tuyển dụng, Góp ý) · thông tin pháp lý · link footer · chữ SEO |

**Lý do chia như vậy:** ảnh phải tải lên máy chủ nên để Admin làm cho nhanh (lưu xong hiện
ngay, không phải push). Chữ để trong code thì dữ liệu gọn, có lịch sử sửa đổi, và sửa hàng
loạt nhanh hơn nhiều so với gõ từng ô trong Admin.

**Ngoại lệ cần nhớ:**
- Chữ đi kèm ảnh trong các khối Admin (3 dòng chữ trên Hero, tên ô khu vực, chữ trên banner)
  → sửa **trong Admin**, vì nó nằm chung khối với ảnh.
- Logo và icon app → **không có trong Admin**, chép đè file trong `public/logo/`, `public/icons/`.

Chi tiết từng khối xem bảng ở mục 0.1 ngay dưới.

---

## 0. ĐỌC TRƯỚC — NẾU KHÔNG SẼ MẤT THỜI GIAN VÔ ÍCH

### 0.1. Web có HAI nguồn nội dung — Admin ĐÈ LÊN code

| Nguồn | Ở đâu | Ưu tiên |
|---|---|---|
| **Mặc định trong code** | các file `.ts` trong `src/lib/` (bạn sửa trong VS Code) | thấp |
| **Nội dung Admin** | trang `/admin/noi-dung`, lưu trong Supabase (bảng `site_content`) | **CAO — đè lên code** |

**Hệ quả:** với những khối đã từng lưu trong Admin (Hero, Footer, banner cuối trang,
ô khu vực, trang Giới thiệu…), bạn **sửa trong code sẽ KHÔNG thấy gì đổi trên web**.
Code chỉ được dùng khi Admin **chưa có** dữ liệu cho khối đó.

**Cách xử lý khi sửa code mà web không đổi:**
1. Mở `/admin/noi-dung`, tìm khối tương ứng.
2. Hoặc sửa thẳng trong Admin (nhanh nhất),
3. Hoặc xoá dữ liệu khối đó trong Admin → web quay về dùng mặc định trong code.

#### Bảng tra: khối nào SỬA Ở ĐÂU *(rà lại bằng code ngày 20/08/2026)*

| Khối | Sửa ở đâu |
|---|---|
| **Hero trang chủ** (`hero_home`) | ✅ **Admin** — code không có tác dụng |
| **Footer** (`footer`) — hotline, email, mạng xã hội | ✅ **Admin** *(riêng ĐỊA CHỈ đã tách sang code, xem 4.3)* |
| **2 banner cuối trang chủ** (`home_ad`) | ✅ **Admin** |
| **5 ô khu vực trang chủ** (`home_areas`) | ✅ **Admin** |
| **Banner trang Dự án** (`banner_projects`) | ✅ **Admin** |
| **Trang Giới thiệu** (`about`) | ✅ **Admin** |
| **Landing page** (`landings`) | ✅ **Admin** — /admin/noi-dung |
| **Bảng giá gói tin** (`pricing`) | ✅ **Admin** — /admin/gia-khuyen-mai |
| **Cấp hội viên · khuyến mãi** (`billing`) | ✅ **Admin** — /admin/gia-khuyen-mai |
| **Ghim bài "tin chính" trang chủ** (`home_featured_article`) | ✅ **Admin** — /admin/tin-tuc, trong form bài viết |
| **Dự án · Bài viết · Tin đăng của khách** | ✅ **Admin** — /admin/du-an · /admin/tin-tuc · /admin/tin-dang |
| Mọi trang văn bản, thông tin pháp lý, link footer, SEO | ✅ **VS Code** |
| Logo, icon app | ✅ **VS Code** — chép đè file trong `public/logo`, `public/icons` |
| Bố cục, màu, kích thước khung | ✅ **VS Code** |

### Rà TOÀN BỘ trang trên web — trang nào sửa ở đâu *(rà bằng code 20/08/2026)*

Cột cuối trả lời đúng câu hỏi: **push lên có tác dụng không.**

| Trang trên web | Sửa ở đâu | Push có tác dụng? |
|---|---|---|
| Trang chủ — banner, ô khu vực, 2 banner cuối | /admin/noi-dung | Không |
| Trang chủ — danh sách tin · dự án · tin tức | /admin/tin-dang · /admin/du-an · /admin/tin-tuc | Không |
| Mua bán · Cho thuê · Tìm kiếm · Chi tiết tin | /admin/tin-dang | Không |
| Dự án (banner) | /admin/noi-dung | Không |
| Dự án (danh sách + chi tiết) | /admin/du-an | Không |
| Tin tức (danh sách + bài viết) | /admin/tin-tuc | Không |
| Giới thiệu | /admin/noi-dung | Không |
| Trang landing | /admin/noi-dung | Không |
| Bảng giá đăng tin | /admin/gia-khuyen-mai | Không |
| Nạp tiền · Đổi điểm · Tài khoản | /admin/gia-khuyen-mai | Không |
| Footer — điện thoại, email, mạng xã hội | /admin/noi-dung | Không |
| **Điều khoản** | `src/app/dieu-khoan/page.tsx` | **Có** |
| **Bảo mật** | `src/app/bao-mat/page.tsx` | **Có** |
| **Quy chế** | `src/app/quy-che/page.tsx` | **Có** |
| **Quy định đăng tin** | `src/app/quy-dinh/page.tsx` | **Có** |
| **FAQ** | `src/app/faq/page.tsx` | **Có** |
| **Liên hệ** | `src/app/lien-he/page.tsx` | **Có** |
| **Hướng dẫn** | `src/app/huong-dan/page.tsx` | **Có** |
| **Tuyển dụng** | `src/app/tuyen-dung/page.tsx` | **Có** |
| **Góp ý** | `src/app/gop-y/page.tsx` | **Có** |
| **Chuyên gia** (4 trang) | `src/app/chuyen-gia/` | **Có** |
| **Tiện ích** | `src/app/tien-ich/` | **Có** |
| **Đăng nhập · Đăng ký · Quên mật khẩu** | `src/app/dang-nhap/ · dang-ky/ · quen-mat-khau/` | **Có** |
| **Đăng tin · So sánh · Tin đã lưu** | `src/app/dang-tin/` · `src/app/so-sanh/` · `src/app/tin-luu/` | **Có** |
| **Tên công ty · mã số thuế · địa chỉ · miễn trừ** | `src/lib/phapLy.ts` | **Có** |
| **Các cột liên kết ở footer** | `src/components/Footer.tsx` | **Có** |
| **Logo · icon app** | `public/logo/` · `public/icons/` | **Có** |
| **Bố cục · màu · kích thước khung** | file giao diện tương ứng | **Có** |

**Đọc bảng này TRƯỚC KHI sửa bất cứ thứ gì.** Khối nào ghi Admin mà mở VS Code ra sửa là mất công
vô ích — web không đổi. Cách tự kiểm tra lại về sau: mở `/admin/noi-dung`, khối nào đã có
sẵn ảnh/chữ trong đó thì Admin đang quản khối đó.

### 0.2. Ba quy tắc bất di bất dịch về ảnh

1. Ảnh phải nằm trong thư mục **`public/`**. Không để ảnh ở Desktop rồi trỏ tới
   `C:\Users\...` — trên web sẽ mất ảnh.
2. Đường dẫn viết trong code **luôn bắt đầu bằng `/images/...`**, không có `public`,
   không có `./`, không có `../`.
   ✅ `/images/hero-bien.jpg` — ❌ `public/images/hero-bien.jpg` — ❌ `./hero-bien.jpg`
3. **Tên file: không dấu, không khoảng trắng, viết thường**, nối bằng gạch ngang.
   ✅ `hero-bien-my-khe.jpg` — ❌ `Hero Biển Mỹ Khê.JPG`
   (Máy chủ web phân biệt chữ hoa/thường; đúng trên máy bạn không có nghĩa là đúng trên web.)

### 0.3. Quy trình chuẩn mỗi lần sửa

```
1. Mở VS Code → sửa file → Ctrl+S (lưu)
2. Xem lại tại http://localhost:3000  (trang tự tải lại)
3. Không thấy đổi? → Ctrl+F5 (tải lại bỏ cache) → vẫn không đổi thì xem mục 0.1
4. Ưng ý → nói "Push" để đưa lên coastalland.vn
```

### 0.4. SỬA MỘT LẦN — ÁP DỤNG CHO CẢ 2 BẢN ⭐

#### A. Bản trên máy tính và bản trên điện thoại: **chỉ có MỘT nội dung**

Web này là **một website duy nhất tự co giãn**, không phải hai bản riêng. Sửa chữ hay
thay ảnh một lần là **cả máy tính lẫn điện thoại đều đổi theo** — không phải làm hai lần.

**Ngoại lệ DUY NHẤT trong toàn bộ mã nguồn: ảnh Hero trang chủ.**

| Cách làm | Viết gì trong `banners.ts` | Kết quả |
|---|---|---|
| **Dùng chung 1 ảnh** (đơn giản nhất) | chỉ có `image` | Điện thoại tự dùng ảnh PC — **bị cắt mạnh trên–dưới** |
| **Tách 2 ảnh** (đẹp nhất) | có cả `image` và `imageMobile` | Mỗi thiết bị một ảnh cắt sẵn đúng khung |

```ts
image: "/images/hero-bien.jpg",          // PC 2600×1000 — BẮT BUỘC
imageMobile: "/images/hero-bien-mb.jpg", // ĐT 1200×480 — bỏ dòng này = dùng chung ảnh PC
```

👉 Muốn **sửa một lần cho cả hai**: chỉ để `image`, và chọn ảnh có **chủ thể nằm gọn giữa
khung**, chừa rộng trên–dưới. Ảnh nào chủ thể sát mép thì bắt buộc phải tách `imageMobile`.

> Còn lại — chữ Hero, thẻ tin, ô khu vực, banner, footer, mọi trang văn bản — **một chỗ sửa,
> hai nơi cùng đổi**. Không có file riêng cho điện thoại.

#### B. Bản code: chỉ được có MỘT — thư mục chính

```
✅ SỬA Ở ĐÂY:  C:\Users\X1 GEN 8\Projects\cvr-website
❌ ĐỪNG SỬA:   ...\cvr-website\.claude\worktrees\...   (bản nháp của Claude)
```

Bản trong `.claude\worktrees\` là **bản sao tạm**: thiếu `.env.local`, không nối Supabase,
push cũng không lên web. Sửa nhầm ở đó thì công sức mất trắng.

**Quy tắc:** mở VS Code **luôn mở đúng thư mục `Projects\cvr-website`** — nhìn thanh tiêu đề
VS Code, thấy chữ `worktrees` là đang sai chỗ, đóng lại mở đúng.
Claude làm xong ở bản nháp thì phải **đồng bộ về thư mục chính rồi mới báo** — không để
tồn tại hai bản khác nhau qua đêm.

Kiểm tra nhanh mình đang ở đúng bản: trong thư mục phải **có file `.env.local`**.

---

## 1. BẢN ĐỒ NHANH — MUỐN ĐỔI GÌ THÌ MỞ FILE NÀO

| Muốn đổi | Mở file | Admin có đè không |
|---|---|---|
| **Ảnh + chữ Hero trang chủ** | ✅ **Sửa trong `/admin/noi-dung`** — xem mục 2.0. Code (`src/lib/banners.ts`) hiện KHÔNG có tác dụng | ✅ `hero_home` — **đang đè** |
| Banner đầu trang Dự án | `src/lib/banners.ts` → `projectBanners` | ✅ `banner_projects` |
| Số điện thoại, email, mạng xã hội ở Footer (địa chỉ xem dòng dưới) | `src/lib/siteContent.ts` → `FOOTER_DEFAULT` | ✅ `footer` |
| Các cột link trong Footer (Giới thiệu, Tuyển dụng…) | `src/components/Footer.tsx` → `columns` | ❌ chỉ trong code |
| **Thông tin pháp lý** (ĐKKD, MST, người chịu trách nhiệm, địa chỉ, miễn trừ) | `src/lib/phapLy.ts` — **điền 1 chỗ, hiện mọi nơi** | ❌ chỉ trong code |
| 2 banner quảng cáo cuối trang chủ | `src/lib/siteContent.ts` → `HOME_AD_DEFAULT` | ✅ `home_ad` |
| 5 ô khu vực trang chủ (Đà Nẵng, Huế…) | `src/lib/siteContent.ts` → `HOME_AREAS_DEFAULT` | ✅ `home_areas` |
| Nội dung trang Giới thiệu | `src/lib/siteContent.ts` → `ABOUT_DEFAULT` | ✅ `about` |
| Bảng giá đăng tin | `src/lib/pricingData.ts` | ✅ (trang giá khuyến mãi) |
| Trang Điều khoản / Bảo mật / Quy chế / Quy định / FAQ / Liên hệ / Hướng dẫn / Tuyển dụng / Góp ý | `src/app/<tên-trang>/page.tsx` | ❌ chỉ trong code |
| Tiêu đề + mô tả khi gửi link qua Zalo/Facebook (SEO) | `src/app/layout.tsx` (đầu file) | ❌ chỉ trong code |
| Logo | thay file trong `public/logo/` | ❌ chỉ trong code |
| Icon khi cài app lên điện thoại | `public/icons/` | ❌ chỉ trong code |

---

## 1B. ADMIN — VÀO Ở ĐÂU, CÓ GÌ TRONG ĐÓ

### Admin là gì

Admin **không phải phần mềm riêng**. Nó là **một trang nằm trên chính website của mình**,
chỉ tài khoản có quyền admin mới mở được. Người khác đăng nhập vào sẽ bị đưa về trang chủ.

### Vào bằng cách nào

Mở trình duyệt, gõ thẳng địa chỉ:

```
coastalland.vn/admin/noi-dung
```

Chưa đăng nhập thì nó đưa sang trang đăng nhập → đăng nhập bằng **tài khoản admin**
(`truongthanhtung08@gmail.com`) → nó tự quay lại đúng trang Nội dung web.

> 💡 Khi đang chạy thử ở máy: `localhost:3000/admin/noi-dung`

### Vào rồi thấy gì

Trang tên **"Nội dung web"**, cuộn xuống lần lượt các khối:

| # | Khối | Sửa được gì |
|---|---|---|
| 1 | **Hero trang chủ (3 slide)** | ảnh + 3 dòng chữ + nút + link của từng slide |
| 2 | Bất động sản theo khu vực | 5 ô khu vực: tên, số tin, ảnh, link |
| 3 | Footer | hotline, email, mạng xã hội |
| 4 | Banner quảng cáo cuối trang chủ | ảnh, tiêu đề, nội dung, nút |
| 5 | Banner trang Dự án | ảnh + chữ banner đầu trang Dự án |
| 6 | Landing page | các trang landing |
| 7 | Giới thiệu | toàn bộ nội dung trang Giới thiệu |

**Mỗi khối có nút Lưu riêng ở cuối khối.** Sửa khối nào bấm Lưu khối đó → web đổi **ngay
lập tức**, không cần push, không cần đợi deploy. Ra web bấm **Ctrl + F5** để thấy.

### Ảnh nào chỉnh ở đâu

| Muốn đổi ảnh | Vào đâu |
|---|---|
| **Hero trang chủ** | `/admin/noi-dung` → khối 1 |
| 5 ô khu vực trang chủ | `/admin/noi-dung` → khối 2 |
| 2 banner cuối trang chủ | `/admin/noi-dung` → khối 4 |
| Banner đầu trang Dự án | `/admin/noi-dung` → khối 5 |
| Ảnh trang Giới thiệu | `/admin/noi-dung` → khối 7 |
| Ảnh tin đăng | `/admin/tin-dang` → mở tin cần sửa |
| Ảnh dự án | `/admin/du-an` → mở dự án cần sửa |
| Ảnh bài viết | `/admin/tin-tuc` → mở bài cần sửa |
| **Logo · icon app** | ⚠️ KHÔNG có trong Admin — thay file trong `public/logo/`, `public/icons/` (mục 5) |

### Các địa chỉ Admin cần nhớ

| Việc | Địa chỉ |
|---|---|
| Tổng quan | `coastalland.vn/admin` |
| **Sửa ảnh & chữ của web** | `coastalland.vn/admin/noi-dung` |
| Duyệt / sửa tin đăng | `coastalland.vn/admin/tin-dang` |
| Dự án | `coastalland.vn/admin/du-an` |
| Tin tức | `coastalland.vn/admin/tin-tuc` |
| Khách hàng | `coastalland.vn/admin/khach-hang` |
| Yêu cầu khách gửi về | `coastalland.vn/admin/yeu-cau` |
| Bảng giá · khuyến mãi | `coastalland.vn/admin/gia-khuyen-mai` |
| Thanh toán | `coastalland.vn/admin/thanh-toan` |

---

## 2. HERO TRANG CHỦ — CHI TIẾT (quan trọng nhất)

### 2.0. ✅ HERO HIỆN KHÔNG SỬA ĐƯỢC TRONG VS CODE — PHẢI VÀO ADMIN

**Tình trạng hiện tại (17/08/2026):** Hero trang chủ **đang do Admin điều khiển** — 3 ảnh
đã tải lên Supabase. Sửa `src/lib/banners.ts` trong VS Code sẽ **KHÔNG có gì đổi trên web**.

**→ Sửa Hero tại: `coastalland.vn/admin/noi-dung` → khối "Hero trang chủ (3 slide)"**

Cách tự kiểm tra sau này Hero đang do ai quản: vào `/admin/noi-dung`, nếu khối Hero đã có
sẵn ảnh và chữ → Admin đang quản, sửa ở đó. Nếu trống trơn → web đang lấy từ code, lúc đó
mới sửa `banners.ts` (mục 2.3).

#### Các ô trong Admin và ý nghĩa

| Ô trong Admin | Hiện ra ở đâu | Ghi chú |
|---|---|---|
| **Ảnh MÁY TÍNH** | nền Hero trên máy tính | 2600 × 1000 px |
| **Ảnh ĐIỆN THOẠI** | nền Hero trên điện thoại | 1200 × 520 px · bỏ trống = dùng tạm ảnh PC |
| **Nhãn (dòng 1)** | chữ nhỏ trên cùng | 2–3 từ, hệ thống tự viết hoa |
| **Tiêu đề (dòng 2)** | chữ lớn nhất | ≤ 25 ký tự, giữ 1 dòng |
| **Mô tả (dòng 3)** | chữ nhỏ dưới tiêu đề | ≤ 40 ký tự |
| **Nút CTA** | nút bấm | để trống = ẩn nút |
| **Link khi bấm** | bấm banner đi đâu | `/du-an/...` · `/landing/...` |

Sửa xong bấm **Lưu** ngay dưới khối → web đổi **ngay lập tức**, không cần push, không cần
đợi deploy. Mở web bấm **Ctrl + F5** để thấy.

### 2.1. KÍCH THƯỚC ẢNH BẮT BUỘC

*(Áp dụng cho cả hai cách — sửa trong Admin hay trong code.)*

| Loại | Kích thước thiết kế | Tỷ lệ | Dùng khi |
|---|---|---|---|
| **Ảnh máy tính (PC)** | **2600 × 1000 px** | **2,6 : 1** | màn hình từ 640px trở lên |
| **Ảnh điện thoại** | **1200 × 520 px** | **2,3 : 1** | màn hình dưới 640px |

- Định dạng: **JPG**, chất lượng xuất 85–90%.
- Dung lượng mỗi ảnh: **nên ≤ 500 KB**, tối đa 800 KB. Ảnh 5 MB làm trang chủ tải chậm rõ rệt.
- Ảnh điện thoại **không bắt buộc**. Bỏ trống → hệ thống tự dùng ảnh PC (nhưng sẽ bị cắt
  nhiều ở 2 bên vì khung điện thoại rất dẹt).

### 2.2. Ảnh sẽ bị cắt thế nào — "vùng an toàn"

Ảnh Hero **phủ kín khung** (chế độ `cover`): khung cao bao nhiêu, ảnh phóng to lấp đầy
bấy nhiêu rồi **cắt bớt phần thừa**. Khung thật trên web:

- **Máy tính:** cao ≈ chiều cao màn hình trừ 120px → khung rất cao, ảnh 2:1 bị **cắt hai bên**.
- **Điện thoại:** một dải **rất thấp** (tối thiểu 170px) → ảnh bị **cắt trên và dưới**.

👉 Vì vậy khi chọn/cắt ảnh:
- Đặt **chủ thể chính (toà nhà, bờ biển, villa) vào giữa khung**, chừa rộng 4 phía.
- **Không** để chi tiết quan trọng sát mép — mép luôn là phần bị cắt đầu tiên.
- **Góc dưới bên trái** là nơi chữ (nhãn, tiêu đề, mô tả) đè lên → chọn ảnh có vùng đó
  tối hoặc trống, đừng để mặt người/logo ở đó.
- Hệ thống tự phủ 2 dải mờ: mép trên (cho bộ lọc) và mép dưới (cho chữ) — không cần
  tự làm tối ảnh trước.

### 2.3. Thay ảnh Hero TRONG CODE — chỉ khi Admin CHƯA có dữ liệu Hero

> ✅ Hiện tại Admin **đang có** dữ liệu Hero → làm theo mục 2.0, đừng làm mục này.
> Mục này để dành cho khi nào Hero được trả về cho code quản.

**Bước 1.** Chép ảnh vào `public/images/`. Ví dụ đặt tên `hero-bien-my-khe.jpg`
(và bản điện thoại `hero-bien-my-khe-mobile.jpg` nếu có).

**Bước 2.** Mở `src/lib/banners.ts`, tìm mảng `homeBanners`, sửa dòng `image`:

```ts
export const homeBanners: Banner[] = [
  {
    id: "lp-gioi-thieu",
    image: "/images/hero-bien-my-khe.jpg",              // ← ảnh PC 2600×1000
    imageMobile: "/images/hero-bien-my-khe-mobile.jpg", // ← ảnh ĐT 1200×480 (không có thì xoá dòng này)
    status: "Bất Động Sản",        // dòng 1 — nhãn nhỏ, tự IN HOA
    title: "Duyên hải Việt Nam",   // dòng 2 — tiêu đề lớn (giữ 1 dòng ngắn)
    subtitle: "Kết nối & uy tín",  // dòng 3 — mô tả ngắn
    // cta: "Tìm hiểu thêm",       // nút bấm: bỏ dấu // để BẬT, thêm // để TẮT
    showText: true,                // false = tắt toàn bộ chữ trên ảnh
    href: "/gioi-thieu",           // bấm banner thì đi tới đâu
  },
  // ... các slide khác
];
```

**Bước 3.** Lưu (Ctrl+S) → xem `http://localhost:3000`.
⚠️ Không thấy đổi → khối `hero_home` đang có dữ liệu trong Admin (xem mục 0.1).

### 2.4. Thêm / bớt slide Hero

- **Thêm:** chép nguyên một khối `{ ... },` rồi dán xuống dưới, đổi `id` (không được trùng),
  đổi `image`, `title`, `href`.
- **Bớt:** xoá trọn khối từ `{` tới `},`.
- Số slide **không giới hạn**; hiện đang có 3. Ít slide, ảnh đẹp vẫn hơn nhiều slide xoàng.

### 2.5. Ý nghĩa từng dòng chữ trên Hero

| Trường | Hiện ra | Gợi ý độ dài |
|---|---|---|
| `status` | dòng nhỏ trên cùng, tự viết hoa | 2–3 từ |
| `title` | dòng lớn nhất | ≤ 25 ký tự, **không xuống dòng** |
| `subtitle` | dòng nhỏ dưới tiêu đề | ≤ 40 ký tự |
| `cta` | chữ trên nút bấm | 2–4 từ |
| `showText: false` | tắt hết chữ, chỉ còn ảnh | dùng khi ảnh đã có sẵn chữ thiết kế |

---

## 3. BẢNG TỶ LỆ ẢNH CHO TOÀN BỘ WEBSITE

Cắt đúng tỷ lệ = ảnh không bị mất đầu, mất chân. Cột "khuyến nghị" là kích thước nên xuất.

| Vị trí trên web | Tỷ lệ khung | Kích thước khuyến nghị | Thư mục ảnh |
|---|---|---|---|
| **Hero trang chủ — PC** | **2,6 : 1** | **2600 × 1000** | 🖼️ Admin tải lên |
| **Hero trang chủ — điện thoại** | **2,3 : 1** | **1200 × 520** | 🖼️ Admin tải lên |
| **Banner trang Dự án — PC** | **3,2 : 1** | **1920 × 600** | 🖼️ Admin tải lên |
| **Banner trang Dự án — điện thoại** | **2 : 1** | **1200 × 600** | 🖼️ Admin tải lên |
| **Thẻ tin bất động sản** | **16 : 10** | **1200 × 750** | 🖼️ Admin → Tin đăng |
| Ô khu vực trang chủ | ảnh phủ kín ô | 1600 × 1200 | 🖼️ Admin tải lên |
| Thẻ dự án | 3 : 2 và 4 : 3 | 1500 × 1000 | 🖼️ Admin → Dự án |
| Ảnh lớn trong thư viện tin | 2 : 1 | 2000 × 1000 | Supabase (Admin tải lên) |
| Ảnh nhỏ trong thư viện tin | 16 : 9 | 1600 × 900 | Supabase (Admin tải lên) |
| Ảnh bài viết / tin tức | 16 : 9 | 1600 × 900 | 🖼️ Admin → Tin tức |
| Ảnh nhỏ bài viết trong danh sách | 4 : 3 | 1200 × 900 | `public/images/` |
| Ảnh trang Giới thiệu | 16 : 10 | 1600 × 1000 | 🖼️ Admin tải lên |
| Dải ảnh ngang trang Giới thiệu | 4 : 1 | 2400 × 600 | `public/images/gioi-thieu/` |
| Mặt bằng căn hộ | 4 : 3 | 1600 × 1200 | `public/images/du-an/` |
| **Ảnh hiện khi gửi link Zalo/Facebook** | **1,91 : 1** | **1200 × 630** | `public/images/` |

**Mẹo cắt ảnh nhanh:** dùng Photoshop / Canva / [squoosh.app](https://squoosh.app) (miễn phí,
không cần cài): kéo ảnh vào → chọn Resize đúng kích thước → xuất JPG chất lượng 85 → tải về.

---

## 4. SỬA CHỮ CƠ BẢN

### 4.1. Thông tin liên hệ ở Footer

Mở `src/lib/siteContent.ts`, tìm `FOOTER_DEFAULT`:

```ts
export const FOOTER_DEFAULT: FooterData = {
  tagline: "Bất động sản Duyên hải Miền Trung",   // dòng đậm dưới logo
  description: "Coastal Land (coastalland.vn) là ...",
  hotline: "+84 377 985 036",
  email: "lienhe@coastalland.vn",
  address: "...",   // ⚠️ Ô NÀY KHÔNG CÒN DÙNG — địa chỉ lấy từ src/lib/phapLy.ts
  company: "Central Coast Vietnam Real Estate (CVR)",
  socials: [
    { label: "Zalo", href: "#" },        // "#" = chưa có link → icon mờ, không bấm được
    { label: "Facebook", href: "https://facebook.com/..." },
  ],
};
```
⚠️ Khối này Admin đè (`footer`) — hotline, email, mạng xã hội thường phải sửa ở
`/admin/noi-dung`.

**Riêng ĐỊA CHỈ thì không:** đã tách hẳn sang `src/lib/phapLy.ts` → `diaChiDayDu` (mục 4.3),
sửa trong VS Code là lên thẳng, Admin không đè được. Lý do: địa chỉ phải giống nhau ở footer,
trang Liên hệ và Quy chế — để 2 nơi thì sớm muộn cũng lệch.

### 4.2. Các cột link trong Footer (chỉ có trong code)

Mở `src/components/Footer.tsx`, tìm `const columns = [`. Mỗi dòng là một link:

```ts
{ label: "Tuyển dụng", href: "/tuyen-dung" },
```
- `label` = chữ hiện ra · `href` = trang sẽ mở.
- **Thêm link mới phải có trang tương ứng**, nếu không bấm vào sẽ báo lỗi 404.

### 4.3. Thông tin pháp lý — ĐIỀN MỘT CHỖ, HIỆN MỌI NƠI ⭐

Mở **`src/lib/phapLy.ts`** — đây là nơi duy nhất chứa thông tin pháp lý. Sửa file này thì
**footer và trang Quy chế hoạt động tự cập nhật theo**, không phải sửa chỗ nào khác.

```ts
export const PHAP_LY = {
  dangKyKinhDoanh: "",        // "Giấy CN ĐKKD số ... do Sở KH&ĐT thành phố Đà Nẵng cấp ngày ..."
  maSoThue: "",               // "0401234567"
  chiuTrachNhiemNoiDung: "",  // "Ông Trương Thanh Tùng"
  boCongThuong: "",           // link online.gov.vn sau khi đăng ký website TMĐT
  diaChiDayDu: "220 Nguyễn Mậu Tài, phường Hòa Xuân, thành phố Đà Nẵng",
};
```

**Quy tắc vàng:** ô nào để trống `""` thì **dòng đó tự ẩn** trên web — không hiện chữ mẫu,
không hiện "đang cập nhật". Có giấy tờ thật thì điền vào giữa 2 dấu nháy, dòng tự hiện lên.

**Địa chỉ ghi theo đơn vị hành chính MỚI — 2 cấp:** `số nhà, đường` → `Phường/Xã` →
`Tỉnh/Thành phố`. **Không còn cấp Quận/Huyện.**

Ngay dưới đó là `MIEN_TRU` — câu miễn trừ trách nhiệm (sàn nào cũng có). Sửa chữ được, nhưng
**giữ nguyên ý**: Coastal Land là cổng thông tin, không môi giới, không định giá, không phải
một bên trong giao dịch. Bỏ ý này đi là tự nhận trách nhiệm pháp lý cho tin của người khác.

### 4.4. Các trang văn bản (Điều khoản, Quy chế, FAQ, Liên hệ…) — SỬA TRONG VS CODE

> ✅ 9 trang này **Admin không quản** → mở VS Code sửa là lên web (sau khi push).
> Mở file ra, **ngay dòng đầu đã có bảng hướng dẫn sửa** dán sẵn trong đó.

Mỗi trang là một file riêng, sửa thẳng chữ trong đó:

```
src/app/dieu-khoan/page.tsx     src/app/quy-che/page.tsx
src/app/bao-mat/page.tsx        src/app/quy-dinh/page.tsx
src/app/huong-dan/page.tsx      src/app/faq/page.tsx
src/app/lien-he/page.tsx        src/app/tuyen-dung/page.tsx
src/app/gop-y/page.tsx          src/app/gioi-thieu/page.tsx
```

Trong file, phần chữ nằm giữa các thẻ — chỉ sửa **chữ tiếng Việt**, giữ nguyên dấu ngoặc,
dấu phẩy và các thẻ `<p>`, `<Muc>`, `<DanhSach>`:

```tsx
<Muc so={1} title="Tiêu đề mục">      ← sửa chữ trong dấu nháy
  <p>Đoạn văn bản của bạn.</p>        ← sửa chữ giữa <p> và </p>
</Muc>
```

Riêng trang FAQ: mỗi câu hỏi là một khối `{ q: "câu hỏi", a: <p>trả lời</p> }`.

### 4.5. Chữ hiện khi gửi link qua Zalo / Facebook / Google

Mở `src/app/layout.tsx`, ngay đầu file:

```ts
const SITE_TAGLINE = "COASTAL LAND — Bất động sản Duyên hải Miền Trung";
const SITE_DESC = "Sàn giao dịch bất động sản Đà Nẵng, Huế ...";
const OG_IMAGE_PATH = "/images/hero-thanh-pho-hien-dai-26.jpg";  // ảnh 1200×630
```
Đây là thứ hiện ra khi ai đó dán link coastalland.vn vào Zalo/Messenger — nên chỉnh cho gọn và đúng.

---

## 5. LOGO & ICON

| Việc | File cần thay | Ghi chú |
|---|---|---|
| Logo trên nền sáng | `public/logo/symbol-dark.svg` | giữ nguyên **tên file**, chỉ thay nội dung |
| Logo trên nền tối (Header, Footer) | `public/logo/symbol-white.svg` | |
| Logo ngang | `public/logo/logo-horizontal-*.svg` | |
| Icon khi cài app lên điện thoại | `public/icons/icon-192.png` · `icon-512.png` · `maskable-512.png` | PNG vuông, nền không trong suốt |

⚠️ **Giữ nguyên tên file cũ** khi thay. Đổi tên file thì phải sửa cả trong code.
Icon `maskable-512.png`: chừa lề trống ~10% quanh logo vì Android bo tròn icon.

---

## 6. LỖI THƯỜNG GẶP — TRA NHANH

| Hiện tượng | Nguyên nhân | Cách sửa |
|---|---|---|
| Sửa code xong web **không đổi** | khối đó Admin đang đè | sửa trong `/admin/noi-dung` (mục 0.1) |
| Ảnh **không hiện**, ô trắng/xám | sai đường dẫn | phải là `/images/ten-anh.jpg`, không có chữ `public` |
| Ảnh hiện ở máy nhưng **mất trên web** | tên file có dấu / chữ hoa | đổi tên không dấu, viết thường, sửa lại trong code |
| Ảnh **bị cắt mất chủ thể** | sai tỷ lệ | cắt lại đúng bảng mục 3 |
| Trang chủ **tải chậm** | ảnh Hero quá nặng | nén còn ≤ 500 KB (squoosh.app) |
| Bấm link trong Footer ra **404** | trang chưa tồn tại | tạo trang hoặc xoá link |
| Web **lỗi trắng trang** sau khi sửa | thiếu dấu `"` , `,` hoặc `}` | Ctrl+Z hoàn tác về lúc còn chạy được, sửa lại từ từ |

**Nguyên tắc an toàn:** mỗi lần chỉ sửa **một chỗ** rồi lưu và xem ngay. Sửa 10 chỗ mới xem,
lỗi ở đâu sẽ rất khó tìm.

---

## 7. CHECKLIST TRƯỚC KHI PUSH

- [ ] Đã xem lại trên `http://localhost:3000` (cả máy tính và thu nhỏ cửa sổ như điện thoại)
- [ ] Ảnh mới nằm trong `public/`, tên không dấu, viết thường
- [ ] Ảnh đúng tỷ lệ theo bảng mục 3, dung lượng đã nén
- [ ] Chữ tiếng Việt **có dấu**, không sai chính tả
- [ ] Không có link nào dẫn tới trang chưa tồn tại
- [ ] Trang không báo lỗi đỏ trong Terminal của VS Code

Xong hết → nhắn **"Push"** để đưa lên coastalland.vn (khoảng 2–3 phút là domain cập nhật).
