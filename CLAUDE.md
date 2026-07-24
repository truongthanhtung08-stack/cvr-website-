# CLAUDE.md — Dự án COASTAL LAND (CVR)

> File này Claude Code tự đọc mỗi khi mở dự án. Luôn cập nhật khi có thay đổi quan trọng.
> **Trả lời và viết mọi nội dung bằng tiếng Việt có dấu.**

---

## 0. NGUYÊN TẮC LÀM VIỆC (áp dụng cho mọi task — theo Andrej Karpathy)

> Bốn nguyên tắc cốt lõi: **suy nghĩ trước khi code, đơn giản trước, sửa tối thiểu, có mục tiêu đo được.**
> Áp dụng cho mọi yêu cầu trong dự án này — đặt _cẩn thận_ lên trên _nhanh_.

**1. Suy nghĩ trước khi code**
- Nói rõ giả định thay vì đoán ngầm và làm tới.
- Khi yêu cầu mơ hồ → nêu các cách hiểu khác nhau, KHÔNG tự chọn một cách rồi làm.
- Thấy cách làm đơn giản hơn → đề xuất.
- Thật sự chưa rõ → DỪNG và hỏi (đặc biệt với việc khó hoàn tác: xoá file, đổi schema, deploy).

**2. Đơn giản trước (Simplicity First)**
- Chỉ viết code giải quyết đúng vấn đề được nêu.
- Không thêm tính năng "phòng xa", không xử lý lỗi cho tình huống không thể xảy ra.
- Mục tiêu: cắt giảm 60%+ độ phức tạp thừa khi có thể.
- Tự kiểm: "Một kỹ sư senior có gọi đoạn này là over-engineer không?"

**3. Sửa tối thiểu, đúng phạm vi (Surgical Changes)**
- Chỉ động vào những gì yêu cầu đòi hỏi. Giữ nguyên style, format, comment hiện có.
- Không refactor code đang chạy tốt mà không liên quan.
- Chỉ xoá import/biến do CHÍNH thay đổi của mình làm thừa ra.
- Code chết có sẵn → **báo chứ không tự xoá** trừ khi được yêu cầu.

**4. Thực thi theo mục tiêu (Goal-Driven)**
- Trước khi làm, định nghĩa tiêu chí thành công kiểm chứng được.
- Biến yêu cầu mơ hồ ("sửa cái bug") thành mục tiêu test được.
- Việc nhiều bước → chia nhỏ, có checkpoint kiểm chứng.

**Dấu hiệu làm đúng:** ít thay đổi thừa trong diff · ít phải viết lại do over-engineer · hỏi cho rõ TRƯỚC khi code thay vì sửa sai SAU.

---

## 0B. QUY TRÌNH BẮT BUỘC — đọc `QUY-TRINH-LAM-VIEC.md`

> 📌 **File chi tiết: [`QUY-TRINH-LAM-VIEC.md`](QUY-TRINH-LAM-VIEC.md) — PHẢI đọc và tuân thủ.**

**Nguyên tắc 1 — ĐÃ DUYỆT LÀ KHÔNG ĐỘNG VÀO.**
Phần nào chủ dự án đã xem và duyệt thì GIỮ NGUYÊN 100%. Không tự ý chỉnh kích thước, màu,
bố cục, khoảng cách, hiệu ứng; không "tiện tay" refactor. **Chỉ đổi khi được yêu cầu rõ ràng.**
Buộc phải đụng vào vì lý do kỹ thuật → **DỪNG, HỎI TRƯỚC.**

**Nguyên tắc 2 — MỘT LẦN CHO XONG.** Mỗi yêu cầu đi trọn 4 bước trong một lượt:

| 1. SỬA | 2. KIỂM TRA | 3. DUYỆT | 4. PUSH |
|---|---|---|---|
| Claude sửa **thẳng trong** `Projects\cvr-website` (KHÔNG worktree) | **Claude tự** xác minh thay đổi đã lên + xác định **đúng cổng**, rồi mới báo link | Chủ dự án xem, trả lời "OK" / "chỉnh [gì]" | Chỉ khi nghe **"Push"** → `git add -A` + commit + `git push origin main` |

**Ba cái bẫy đã từng làm mất rất nhiều thời gian:**
1. **Nhiều dev server cùng chạy** (3000 + 3001) → chủ dự án xem nhầm bản cũ, sửa 5 lần vẫn thấy y nguyên.
   → Chỉ chạy MỘT server; Claude phải tự xác định cổng nào chạy từ thư mục chính.
2. **Làm trong worktree** → thiếu `.env.local`, chủ dự án không thấy thay đổi. → Luôn đồng bộ về thư mục chính.
3. **Nội dung admin (Supabase) đè lên mặc định trong code** → đổi ảnh/chữ trong code sẽ KHÔNG hiện.
   → Muốn đổi thật phải sửa trong `/admin/noi-dung`.

---

## 1. Dự án là gì

> ⚡ **Đây KHÔNG chỉ là một website thông thường — đây là Dự án COASTAL LAND PLATFORM.**
> **Phiên bản hiện tại: 1.0 (Foundation).**

| | |
|---|---|
| **Tên dự án** | **Coastal Land Platform** — phiên bản **1.0 (Foundation)** |
| **Tên thương hiệu** | **COASTAL LAND** (theo Brief & Kế hoạch v3 chính thức) |
| **Tên đầy đủ** | Central Coast Vietnam Real Estate |
| **Tên viết tắt** | **CVR** |
| **Tagline** | Gateway to Central Coast property |
| **Website (đích)** | coastalland.vn |
| **Loại** | Nền tảng PropTech — giai đoạn 1.0 là sàn giao dịch BĐS trung gian (Đà Nẵng – Huế, mở rộng Miền Trung) |
| **Mô hình** | Solopreneur + AI-Driven (1 người vận hành, dùng AI thay developer) |
| **Ngôn ngữ** | Tiếng Việt (có dấu) + Tiếng Anh |
| **Tiêu chuẩn** | Chất lượng tương đương website $20.000 USD |

**🎯 Mục tiêu dài hạn (tầm nhìn Platform):** Xây dựng **nền tảng PropTech hàng đầu Việt Nam**, theo lộ trình:
1. **Foundation (1.0 — hiện tại):** làm chủ thị trường Miền Trung (Đà Nẵng – Huế).
2. **Mở rộng toàn quốc:** nhân rộng mô hình ra các thị trường lớn cả nước.
3. **Hệ sinh thái:** tích hợp **AI, Big Data** cùng hệ sinh thái dịch vụ bất động sản (định giá, pháp lý, tài chính, quản lý...).

→ Mọi quyết định kiến trúc/kỹ thuật phải tính đến tầm nhìn này: code viết cho 1.0 nhưng **không được khoá đường mở rộng** (đa khu vực, đa dịch vụ, dữ liệu lớn).

**Nguyên tắc kinh doanh cốt lõi:** Người mua MIỄN PHÍ mãi mãi — chỉ thu phí người bán/môi giới.

---

## 1B. SMART SEARCH SYSTEM — "TRÁI TIM" CỦA NỀN TẢNG ❤️

> Trong Coastal Land Platform, **trái tim là cấu trúc và xây dựng Smart Search System**.
> Mọi tính năng tìm kiếm/lọc/gợi ý đều là bộ phận của hệ thống này — thiết kế đồng bộ,
> KHÔNG làm rời rạc từng mảnh.

### 8 thành phần của Smart Search System

| # | Thành phần | Vai trò |
|---|---|---|
| 1 | **AI Search** | Hiểu truy vấn tự nhiên tiếng Việt ("căn hộ 2PN gần biển dưới 3 tỷ") → tự tách khu vực/loại hình/giá/tiện ích. Dùng Claude API khi cần. |
| 2 | **Quick Search** | Ô tìm nhanh + autocomplete thông minh (đã có nền: `suggest.ts`, normalizeVi) — gõ là ra khu vực, dự án, loại hình, tin. Phản hồi tức thì. |
| 3 | **Dynamic Filter** | Bộ lọc đa tầng nhảy theo ngữ cảnh: chọn Mua bán/Cho thuê → loại hình đổi theo (taxonomy 2 trục đã có); chọn khu vực → dự án lọc động; đếm kết quả realtime. |
| 4 | **Semantic Search** | Tìm theo NGỮ NGHĨA, không chỉ khớp chữ: "gần trường học", "view sông", "hợp đầu tư" → khớp thuộc tính/tiện ích/mô tả tin. (Về sau: embeddings + Supabase pgvector.) |
| 5 | **Recommendation Engine** | Gợi ý cá nhân hoá: từ tin đã xem/đã lưu/khu vực quan tâm → "Dành riêng cho bạn", tin tương tự (đã có nền: pickRelated + provinceOf/districtOf/segmentOf). |
| 6 | **Ranking Engine** | Thứ hạng kết quả = điểm tổng hợp: độ khớp truy vấn + hạng tin (VIP/Diamond/Gold) + độ tươi + chất lượng tin (ảnh/mô tả đầy đủ) + hành vi người dùng. Minh bạch, không để VIP đè hoàn toàn độ khớp. |
| 7 | **Saved Search** | Lưu bộ lọc/truy vấn + thông báo khi có tin mới khớp (email/notification). Giữ chân người mua quay lại — nguồn lead cho người bán. |
| 8 | **Search Analytics** | Ghi nhận truy vấn, bộ lọc dùng nhiều, truy vấn 0 kết quả, CTR từng vị trí → dữ liệu để tinh chỉnh Ranking + báo giá trị cho người đăng tin. |

### UX Research bắt buộc (làm TRƯỚC khi thiết kế từng phần)

Phân tích 7 nền tảng chuẩn thế giới + Việt Nam, từ đó **đúc kết "Best Practices" riêng cho Coastal Land**:

1. **Batdongsan.com.vn** (VN — thị phần lớn nhất: taxonomy, bộ lọc, tin VIP)
2. **Homedy** (VN — UX bộ lọc & danh sách gọn)
3. **Zillow** (US — search map-first, Zestimate, saved search/notification)
4. **Rightmove** (UK — tốc độ, bộ lọc đơn giản mà đủ, email alert)
5. **PropertyGuru** (SEA — đa thị trường, gần bối cảnh VN nhất về hành vi)
6. **Domain** (AU — UX mobile, shortlist/collections)
7. **Realtor.com** (US — dữ liệu chuẩn hoá, SEO search page)

→ Mỗi phân tích trả lời: *họ tổ chức search thế nào · bộ lọc gì được ưu tiên · ranking ra sao ·
giữ chân người dùng bằng gì · điều gì đáng học / đáng tránh cho thị trường Miền Trung.*
Kết quả đúc kết lưu vào `docs/` (file UX research riêng) trước khi code từng thành phần.

### Trạng thái hiện tại (nền đã có → sẽ nâng cấp thành hệ thống)

- ✅ Nền Quick Search (autocomplete `suggest.ts` + normalizeVi) · Dynamic Filter đa tầng (locations[] đa chọn, dự án lọc động, giá/m², lọc theo ý định) · Recommendation sơ khai (pickRelated, tin tương tự, RecentlyViewed) · Saved (tin lưu localStorage)
- ⏳ Chưa có: AI Search, Semantic Search, Ranking Engine đúng nghĩa, Saved Search (lưu bộ lọc + alert), Search Analytics, và bộ UX Research 7 nền tảng.

> ⚠️ Tài liệu cũ từng dùng tên "Central Land / Central Coast Realty" và domain "centralcoast.vn".
> **Tên & domain chuẩn đã chốt: COASTAL LAND / coastalland.vn.** Nếu thấy tên/domain cũ ở đâu → sửa.

---

## 2. Tech Stack (đã chốt)

```
Frontend:    Next.js 16 (App Router) + React 19 + TailwindCSS v4 + TypeScript
Database:    Supabase (PostgreSQL)                  — free tier năm 1
Hosting:     Vercel (kế hoạch)                       — auto-deploy từ GitHub
Live hiện tại: GitHub Pages (static export)          — xem mục 3
CDN/Bảo mật: Cloudflare
Thanh toán:  PayOS API (ưu tiên) · dự phòng MoMo/ZaloPay/Stripe
AI kiểm duyệt tin: Claude API
Email:       Resend
Analytics:   Google Analytics 4 + Search Console
```

### Bộ nhận diện COASTAL LAND — màu sắc

**Hệ màu chuẩn (đích): TRẮNG / ĐEN + điểm nhấn VÀNG (luxury).**
- Nền chủ đạo trắng, chữ đen; Header/Footer có thể đảo nền đen chữ trắng.
- Vàng dùng cho điểm nhấn đặc biệt: badge VIP, nút CTA quan trọng (theo logo thương hiệu).

> ⚠️ **Lệch giữa tài liệu và code hiện tại:** giao diện đang chạy vẫn là bản **đơn sắc nền tối**
> (`#060606` đen, chữ trắng — token `cl-ink/cl-charcoal/cl-gray/cl-stone` trong `src/app/globals.css`).
> Việc chuyển sang hệ trắng/đen+vàng là **đầu mục còn tồn**, chưa làm. Đừng mô tả là đã xong.
> Comment `Bộ nhận diện CENTRAL LAND` trong `globals.css` còn ghi tên cũ — cần đổi thành COASTAL LAND khi đụng tới.

Logo thật ở `public/logo/` (symbol-dark.svg cho nền sáng, symbol-white.svg cho nền tối).

---

## 3. TRIỂN KHAI (Deploy) — QUAN TRỌNG

- **Website CHÍNH THỨC (từ 3/7/2026):** `https://coastalland.vn` — domain mua tại PA Vietnam,
  DNS trỏ GitHub Pages (4 bản ghi A `185.199.108-111.153` + CNAME `www` → `truongthanhtung08-stack.github.io`),
  đã gắn Custom domain trong repo Settings → Pages. Link cũ
  `truongthanhtung08-stack.github.io/cvr-website-/` tự chuyển hướng về domain.
- **Cơ chế:** GitHub Actions (`.github/workflows/deploy.yml`) tự build static export + deploy lên GitHub Pages **mỗi lần push lên `main`** (~2–3 phút).
- **→ Mọi chỉnh sửa web: chỉ cần commit + push lên `main`, domain tự cập nhật.**
- Custom domain chạy ở GỐC → **KHÔNG còn basePath/tiền tố `/cvr-website-`** (đã gỡ khỏi
  `next.config.ts` + `deploy.yml` ngày 3/7/2026). Helper `src/lib/asset.ts` vẫn dùng cho ảnh (prefix rỗng).
- Repo GitHub: `truongthanhtung08-stack/cvr-website-` (PUBLIC — lưu ý có dấu `-` ở cuối).
- ⚠️ Vercel: link `cvr-website-eight.vercel.app` từng 404 + khoá. Hiện BỎ QUA, dùng GitHub Pages.

---

## 4. Cấu trúc thư mục dự án

```
cvr-website/
├── CLAUDE.md          ← file này (bối cảnh + nguyên tắc làm việc)
├── README.md          ← hướng dẫn chạy/deploy nhanh
├── .env.local         ← khóa kết nối Supabase (KHÔNG commit lên git)
├── next.config.ts     ← cấu hình basePath cho GitHub Pages
├── docs/              ← tài liệu kế hoạch (Brief, Kế hoạch v3, Context...)
│   ├── CVR_Context.md ← BỐI CẢNH ĐẦY ĐỦ (đọc khi cần chi tiết)
│   └── CVR_KeHoach_toàn diện_v3..docx ← kế hoạch gốc (nguồn sự thật, không sửa trực tiếp)
├── src/
│   ├── app/           ← App Router + globals.css (@theme cấu hình màu)
│   ├── components/    ← PropertyCard, FeaturedListings, LocationGrid, NewsSection...
│   └── lib/           ← supabase/ (client.ts, server.ts), data.ts, asset.ts
└── public/
    ├── logo/          ← logo SVG thật
    └── images/        ← ảnh tin (tin/), dự án (du-an/), hero, gallery
```

📌 **Khi cần thông tin chi tiết** (database schema, gói dịch vụ, lộ trình 3 năm, chi phí, prompt mẫu) → đọc `docs/CVR_Context.md`.

---

## 5. Nguyên tắc dự án (bổ sung cho mục 0)

1. **Tiếng Việt có dấu** — luôn luôn, không ngoại lệ.
2. Ưu tiên giải pháp **1 người làm được** bằng AI và tự động hóa.
3. **Không thuê developer** — dùng Claude Code cho toàn bộ lập trình.
4. **Người mua miễn phí mãi mãi** — không thay đổi chiến lược này.
5. **Depth trước Breadth** — làm thật tốt Đà Nẵng + Huế trước khi mở rộng.
6. Tính chi phí theo **VNĐ**.
7. Vai trò của Claude: vừa là CTO + CFO + CMO của dự án.

---

## 6. Database Supabase (các bảng chính)

`listings` (tin BĐS) · `users` · `categories` · `locations` · `subscription_plans` ·
`payments` · `listing_images` · `banner_ads` · `ai_moderation_logs`

> Schema cột chi tiết xem `docs/CVR_Context.md` mục 4.

---

## 7. Trạng thái hiện tại

```
GIAI ĐOẠN: 1 (Lập trình) — trang chủ + dữ liệu mẫu đã có, đang xây các trang con

✅ Đã xong:
  - Môi trường: Node 20, Git, WSL, Claude Code CLI
  - Tài khoản GitHub / Supabase + repo + project; .env.local kết nối Supabase
  - Khởi tạo project: Next.js 16 + React 19 + TailwindCSS v4 + TypeScript
  - Supabase client (src/lib/supabase/client.ts + server.ts)
  - Trang chủ đầy đủ: Header → Hero (ảnh + bộ lọc) → BĐS nổi bật → Loại hình
       → BĐS theo khu vực → Giá trị → Tin tức → CTA → Footer
  - Dữ liệu mẫu: src/lib/data.ts (featuredListings, areas, articles)
  - Component: PropertyCard, FeaturedListings, LocationGrid, NewsSection
  - Ảnh mẫu thật: public/images/tin/*.jpg, public/images/du-an/*.jpg, hero
  - Deploy tự động lên GitHub Pages qua GitHub Actions

⏳ Bước kế tiếp:
  - Chuyển hệ màu giao diện sang TRẮNG/ĐEN + VÀNG (hiện còn đơn sắc nền tối) — xem mục 2
  - Tạo bảng `listings` + dữ liệu thật trong Supabase
  - Trang danh sách /mua-ban, /cho-thue (bộ lọc + grid + phân trang)
  - Trang chi tiết BĐS /bat-dong-san/[slug]
  - ✅ Domain coastalland.vn ĐÃ MUA + ĐÃ GẮN, site chạy chính thức (3/7/2026)

GHI CHÚ KỸ THUẬT:
  - Tailwind v4: cấu hình màu ở src/app/globals.css trong @theme (KHÔNG có tailwind.config.js)
  - Component giao diện ở src/components/, Supabase helper ở src/lib/supabase/
  - Ảnh phải qua helper src/lib/asset.ts để chạy đúng trên GitHub Pages
```

---

## 8. Website tham khảo
- https://homedy.com (UX/UI danh sách BĐS — bộ lọc tìm kiếm là ưu tiên số 1)
- https://batdongsan.com.vn (phân loại, bộ lọc)
- https://apple.com (về giao diện và annimation)
