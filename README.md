# COASTAL LAND (CVR) — coastalland.vn

Cổng thông tin & sàn giao dịch bất động sản trung gian khu vực Duyên hải Miền Trung
(trọng điểm Đà Nẵng – Huế). Mô hình Solopreneur + AI-Driven: 1 người vận hành, dùng AI
thay cho đội developer.

> **Nguyên tắc cốt lõi:** Người mua MIỄN PHÍ mãi mãi — chỉ thu phí người bán/môi giới.

📄 Bối cảnh & nguyên tắc làm việc đầy đủ: xem [CLAUDE.md](CLAUDE.md) và [docs/CVR_Context.md](docs/CVR_Context.md).

---

## Tech stack

| Tầng | Công nghệ |
|---|---|
| Frontend | Next.js 16 (App Router) + React 19 + TailwindCSS v4 + TypeScript |
| Database | Supabase (PostgreSQL) |
| Live hiện tại | GitHub Pages (static export, deploy tự động) |
| Hosting đích | Vercel (kế hoạch) |
| Thanh toán | PayOS API |
| AI kiểm duyệt tin | Claude API |
| Email · Analytics | Resend · Google Analytics 4 + Search Console |

---

## Chạy local

```bash
npm install
npm run dev      # http://localhost:3000
```

Tạo file `.env.local` ở gốc dự án với khóa Supabase (KHÔNG commit lên git):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Lệnh khác:

```bash
npm run build    # build production
npm run lint     # kiểm tra ESLint
```

---

## Deploy

- **Link công khai 24/7:** https://truongthanhtung08-stack.github.io/cvr-website-/
- **Cơ chế:** mỗi lần `git push` lên nhánh `main`, GitHub Actions
  (`.github/workflows/deploy.yml`) tự build static export và đẩy lên GitHub Pages (~2–3 phút).
- GitHub Pages chạy ở thư mục con `/cvr-website-/` → cần `basePath` (bật qua biến
  `GITHUB_PAGES=true` trong `next.config.ts`) và tiền tố ảnh qua helper `src/lib/asset.ts`.
  Local/dev không có tiền tố.

> ⚙️ **Mọi chỉnh sửa web: chỉ cần commit + push lên `main`, link tự cập nhật.**

---

## Cấu trúc thư mục

```
src/
├── app/          App Router + globals.css (@theme cấu hình màu Tailwind v4)
├── components/   PropertyCard, FeaturedListings, LocationGrid, NewsSection...
└── lib/          supabase/ (client.ts, server.ts), data.ts, asset.ts
public/
├── logo/         logo SVG thật
└── images/       tin/ · du-an/ · hero · gallery (xem README trong từng thư mục)
docs/             Brief, Kế hoạch v3, CVR_Context.md
```

---

## Quy ước

- **Tiếng Việt có dấu** cho mọi nội dung, commit, comment.
- Ảnh phải tham chiếu qua `src/lib/asset.ts` để chạy đúng trên GitHub Pages.
- Trước khi code, đọc mục **0. Nguyên tắc làm việc** trong [CLAUDE.md](CLAUDE.md).
