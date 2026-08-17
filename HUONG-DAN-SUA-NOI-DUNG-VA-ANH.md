# HƯỚNG DẪN SỬA NỘI DUNG & HÌNH ẢNH TRỰC TIẾP TRONG VS CODE

> Dành cho chủ dự án COASTAL LAND. Mục tiêu: tự đổi chữ và ảnh cơ bản mà **không cần
> nhập dữ liệu vào Admin**, không cần biết lập trình.
> Mọi đường dẫn tính từ thư mục gốc dự án: `C:\Users\X1 GEN 8\Projects\cvr-website`.

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

Các khối do Admin quản (key trong bảng `site_content`):
`hero_home` · `footer` · `home_ad` · `home_areas` · `banner_projects` · `landings` · `about`

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
image: "/images/hero-bien.jpg",          // PC 2560×1280 — BẮT BUỘC
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
| **Ảnh + chữ Hero trang chủ** | `src/lib/banners.ts` → `homeBanners` | ✅ `hero_home` |
| Banner đầu trang Dự án | `src/lib/banners.ts` → `projectBanners` | ✅ `banner_projects` |
| Số điện thoại, email, địa chỉ, mạng xã hội ở Footer | `src/lib/siteContent.ts` → `FOOTER_DEFAULT` | ✅ `footer` |
| Các cột link trong Footer (Giới thiệu, Tuyển dụng…) | `src/components/Footer.tsx` → `columns` | ❌ chỉ trong code |
| 2 banner quảng cáo cuối trang chủ | `src/lib/siteContent.ts` → `HOME_AD_DEFAULT` | ✅ `home_ad` |
| 5 ô khu vực trang chủ (Đà Nẵng, Huế…) | `src/lib/siteContent.ts` → `HOME_AREAS_DEFAULT` | ✅ `home_areas` |
| Nội dung trang Giới thiệu | `src/lib/siteContent.ts` → `ABOUT_DEFAULT` | ✅ `about` |
| Bảng giá đăng tin | `src/lib/pricingData.ts` | ✅ (trang giá khuyến mãi) |
| Trang Điều khoản / Bảo mật / Quy chế / Quy định / FAQ / Liên hệ / Hướng dẫn / Tuyển dụng / Góp ý | `src/app/<tên-trang>/page.tsx` | ❌ chỉ trong code |
| Tiêu đề + mô tả khi gửi link qua Zalo/Facebook (SEO) | `src/app/layout.tsx` (đầu file) | ❌ chỉ trong code |
| Logo | thay file trong `public/logo/` | ❌ chỉ trong code |
| Icon khi cài app lên điện thoại | `public/icons/` | ❌ chỉ trong code |

---

## 2. HERO TRANG CHỦ — CHI TIẾT (quan trọng nhất)

### 2.1. KÍCH THƯỚC ẢNH BẮT BUỘC

| Loại | Kích thước thiết kế | Tỷ lệ | Dùng khi |
|---|---|---|---|
| **Ảnh máy tính (PC)** | **2560 × 1280 px** | **2 : 1** | màn hình từ 640px trở lên |
| **Ảnh điện thoại** | **1200 × 480 px** | **2,5 : 1** | màn hình dưới 640px |

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

### 2.3. Thay ảnh Hero — 3 bước

**Bước 1.** Chép ảnh vào `public/images/`. Ví dụ đặt tên `hero-bien-my-khe.jpg`
(và bản điện thoại `hero-bien-my-khe-mobile.jpg` nếu có).

**Bước 2.** Mở `src/lib/banners.ts`, tìm mảng `homeBanners`, sửa dòng `image`:

```ts
export const homeBanners: Banner[] = [
  {
    id: "lp-gioi-thieu",
    image: "/images/hero-bien-my-khe.jpg",              // ← ảnh PC 2560×1280
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
| **Hero trang chủ — PC** | **2 : 1** | **2560 × 1280** | `public/images/` |
| **Hero trang chủ — điện thoại** | **2,5 : 1** | **1200 × 480** | `public/images/` |
| Banner đầu trang Dự án | 3 : 1 | 2400 × 800 | `public/images/du-an/` |
| **Thẻ tin bất động sản** | **16 : 10** | **1200 × 750** | `public/images/tin/` |
| Ô khu vực trang chủ | ô dọc/ngang, ảnh phủ kín | 1600 × 1200 | `public/images/tin/` |
| Thẻ dự án | 3 : 2 và 4 : 3 | 1500 × 1000 | `public/images/du-an/` |
| Ảnh lớn trong thư viện tin | 2 : 1 | 2000 × 1000 | Supabase (Admin tải lên) |
| Ảnh nhỏ trong thư viện tin | 16 : 9 | 1600 × 900 | Supabase (Admin tải lên) |
| Ảnh bài viết / tin tức | 16 : 9 | 1600 × 900 | `public/images/` |
| Ảnh nhỏ bài viết trong danh sách | 4 : 3 | 1200 × 900 | `public/images/` |
| Ảnh trang Giới thiệu | 16 : 10 | 1600 × 1000 | `public/images/gioi-thieu/` |
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
  address: "Đà Nẵng",
  company: "Central Coast Vietnam Real Estate (CVR)",
  socials: [
    { label: "Zalo", href: "#" },        // "#" = chưa có link → icon mờ, không bấm được
    { label: "Facebook", href: "https://facebook.com/..." },
  ],
};
```
⚠️ Khối này Admin đè (`footer`) — thường phải sửa ở `/admin/noi-dung`.

### 4.2. Các cột link trong Footer (chỉ có trong code)

Mở `src/components/Footer.tsx`, tìm `const columns = [`. Mỗi dòng là một link:

```ts
{ label: "Tuyển dụng", href: "/tuyen-dung" },
```
- `label` = chữ hiện ra · `href` = trang sẽ mở.
- **Thêm link mới phải có trang tương ứng**, nếu không bấm vào sẽ báo lỗi 404.

### 4.3. Các trang văn bản (Điều khoản, Quy chế, FAQ, Liên hệ…)

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

### 4.4. Chữ hiện khi gửi link qua Zalo / Facebook / Google

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
