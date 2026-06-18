# CLAUDE.md — Dự án Central Coast Realty (CVR)

> File này Claude Code tự đọc mỗi khi mở dự án. Luôn cập nhật khi có thay đổi quan trọng.
> **Trả lời và viết mọi nội dung bằng tiếng Việt có dấu.**

---

## 1. Dự án là gì

| | |
|---|---|
| **Tên thương hiệu** | **CENTRAL LAND** (theo logo & ĐKKD chính thức) |
| **Tagline** | Gateway to Central Coast property |
| **Website** | centralcoast.vn |
| **Loại** | Sàn giao dịch BĐS trung gian (Đà Nẵng – Huế, mở rộng Miền Trung) |
| **Mô hình** | Solopreneur + AI-Driven (1 người vận hành, dùng AI thay developer) |
| **Tiêu chuẩn** | Chất lượng tương đương website $10.000 USD |

**Nguyên tắc kinh doanh cốt lõi:** Người mua MIỄN PHÍ mãi mãi — chỉ thu phí người bán/môi giới.

---

## 2. Tech Stack (đã chốt)

```
Frontend:   Next.js 14 (App Router) + TailwindCSS  — SSR/SSG, responsive, SEO
Database:   Supabase (PostgreSQL)                  — free tier năm 1
Hosting:    Vercel                                 — auto-deploy từ GitHub
CDN/Bảo mật: Cloudflare
Thanh toán: PayOS API
AI kiểm duyệt tin: Claude API
Email:      Resend
Analytics:  Google Analytics 4 + Search Console
```

**Bộ nhận diện CENTRAL LAND — ĐƠN SẮC (đen/trắng/xám):**
`#060606` (đen chủ đạo) · `#1F1F1F` (than chì) · `#E6E6E6` (xám nhạt) · trắng.
Token Tailwind: `cl-ink`, `cl-charcoal`, `cl-gray`, `cl-stone`.
Logo thật ở `public/logo/` (symbol-dark.svg cho nền sáng, symbol-white.svg cho nền tối).

---

## 3. Dịch vụ đã thiết lập (Giai đoạn 0 — xong)

| Dịch vụ | Trạng thái |
|---|---|
| Node.js 20 LTS + nvm-windows | ✅ Đã cài |
| WSL2 + Ubuntu | ✅ Đã cài |
| Claude Code CLI | ✅ 2.1.181 |
| Git (config tên + email) | ✅ Xong |
| GitHub repo `truongthanhtung08-stack/cvr-website-` | ✅ Đã tạo (PUBLIC — lưu ý tên có dấu `-` ở cuối) |
| Supabase project | ✅ URL: `https://miyugmacyerqvzhgmbyd.supabase.co` (region Tokyo) |
| Vercel | ⚠️ KHÔNG dùng — link `cvr-website-eight.vercel.app` bị 404 + khoá. BỎ QUA. |

> Khóa kết nối Supabase nằm ở `.env.local` (publishable key — an toàn cho client).

### 🚀 TRIỂN KHAI (Deploy) — QUAN TRỌNG
- **Link công khai 24/7 (CHÍNH THỨC):** `https://truongthanhtung08-stack.github.io/cvr-website-/`
- **Cơ chế:** GitHub Actions (`.github/workflows/deploy.yml`) tự build static export + deploy lên GitHub Pages **mỗi lần push lên `main`** (~2-3 phút).
- **→ Mọi chỉnh sửa web: chỉ cần commit + push lên `main`, link tự cập nhật.**
- GitHub Pages chạy ở thư mục con `/cvr-website-/` nên cần `basePath` (xem `next.config.ts`, chỉ bật khi `GITHUB_PAGES=true`) + tiền tố ảnh qua helper `src/lib/asset.ts` (`NEXT_PUBLIC_BASE_PATH=/cvr-website-`). Local/dev KHÔNG có tiền tố.

---

## 4. Cấu trúc thư mục dự án

```
cvr-website/
├── CLAUDE.md          ← file này (bối cảnh dự án)
├── .env.local         ← khóa kết nối Supabase (KHÔNG commit lên git)
├── docs/              ← tài liệu kế hoạch (Brief, KeHoach, Context...)
│   ├── CVR_Context.md ← BỐI CẢNH ĐẦY ĐỦ (đọc file này khi cần chi tiết)
│   └── CVR_SystemPrompt.txt
├── assets/            ← Logo, Giao diện (mockup), Hình ảnh, ĐKKD
└── (mã nguồn Next.js sẽ tạo ở đây: app/, components/, lib/, types/)
```

📌 **Khi cần thông tin chi tiết** (database schema, gói dịch vụ, lộ trình 3 năm, chi phí, prompt mẫu) → đọc `docs/CVR_Context.md`.

---

## 5. Nguyên tắc làm việc

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
GIAI ĐOẠN: 0 (Khởi động) → chuẩn bị sang Giai đoạn 1 (Lập trình)

✅ Đã xong:
  - Toàn bộ môi trường máy tính (Node, Git, WSL, Claude Code)
  - Tài khoản GitHub / Supabase / Vercel + repo + project
  - .env.local kết nối Supabase
  - Folder dự án + tài liệu
  - ✅ Khởi tạo project: Next.js 16 + React 19 + TailwindCSS v4 + TypeScript
  - ✅ Supabase client (src/lib/supabase/client.ts + server.ts)
  - ✅ Trang chủ đầy đủ kiểu Homedy (nền đen, chữ trắng, sang trọng):
       Header (logo SVG to rõ) → Hero (ảnh villa + bộ lọc) → BĐS nổi bật
       → Loại hình → BĐS theo khu vực → Giá trị → Tin tức → CTA → Footer đầy đủ
  - ✅ Dữ liệu mẫu: src/lib/data.ts (featuredListings, areas, articles)
  - ✅ Component: PropertyCard, FeaturedListings, LocationGrid, NewsSection
  - ✅ Ảnh mẫu: public/images/gallery/p01..p12.jpg (Unsplash, thay bằng ảnh thật sau)
  - ✅ Ảnh hero: public/images/hero.jpg (placeholder, thay bằng ảnh BĐS thật)

⏳ Bước kế tiếp (Giai đoạn 1):
  - Tạo bảng `listings` + dữ liệu mẫu trong Supabase
  - Trang danh sách /mua-ban (bộ lọc + grid + phân trang)
  - Trang chi tiết BĐS /bat-dong-san/[slug]
  - Đăng ký domain centralcoast.vn

GHI CHU KY THUAT:
  - Tailwind v4: cau hinh mau o src/app/globals.css trong @theme (KHONG co tailwind.config.js)
  - Mau dung qua class: bg-cvr-blue, text-cvr-sky, ...
  - Component giao diện o src/components/, Supabase helper o src/lib/supabase/
```

---

## 8. Website tham khảo
- https://homedy.com (UX/UI danh sách BĐS)
- https://batdongsan.com.vn (phân loại, bộ lọc)
