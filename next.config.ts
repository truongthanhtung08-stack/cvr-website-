import type { NextConfig } from "next";
import { provincesNew } from "./src/lib/provincesNew";
import { provincesOld } from "./src/lib/provincesOld";

// Khi build cho GitHub Pages (biến GITHUB_PAGES=true) thì xuất tĩnh.
// Từ 7/2026 chạy domain riêng coastalland.vn (custom domain) → KHÔNG còn basePath /cvr-website-.
const isPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = isPages
  ? {
      // GitHub Pages = static export: bắt buộc unoptimized (không có server tối ưu ảnh).
      output: "export",
      images: { unoptimized: true },
      trailingSlash: true,
    }
  : {
      // CHỈ máy chủ thử ở máy (npm run dev): cho điện thoại trong cùng Wi-Fi mở http://<IP máy>:3000 và BẤM ĐƯỢC.
      // Next 16 mặc định chặn mã trình duyệt khi mở từ máy khác → trang hiện hình mà không thao tác được.
      // Không ảnh hưởng web thật trên Vercel.
      allowedDevOrigins: ["10.41.101.234", "*.local"],
      // ⚠️ 5/9/2026 — TẮT tối ưu ảnh của Vercel.
      // Gói Vercel miễn phí có hạn mức ảnh tối ưu; đăng đi đăng lại vài đợt tin là
      // hết hạn mức → mọi ảnh trả về "402 Payment required"
      // (OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED) → TOÀN BỘ ảnh trên web trắng xoá,
      // trong khi ảnh gốc ở Supabase vẫn nguyên vẹn. Đã xảy ra thật.
      // Ảnh của mình vốn đã được nén sẵn lúc tải lên (WebP ~350KB) nên tải thẳng
      // từ Supabase vẫn chấp nhận được. Bật lại chỉ khi đã lên gói Vercel trả phí.
      images: {
        unoptimized: true,
        // AVIF trước (nhẹ nhất), WebP dự phòng cho máy cũ.
        formats: ["image/avif", "image/webp"],
        // Next 16 yêu cầu liệt kê mọi mức chất lượng được dùng trong code:
        //   40 = nền mờ Hero (blur) · 75 = thẻ tin (nhỏ, ưu tiên tải nhanh)
        //   90 = ẢNH LỚN: bộ xem toàn màn hình, ảnh chính trang chi tiết/dự án
        //   100 = ảnh Hero chính.
        qualities: [40, 75, 90, 100],
        // Cho phép tối ưu ảnh tin lấy từ Supabase Storage.
        remotePatterns: [
          { protocol: "https", hostname: "miyugmacyerqvzhgmbyd.supabase.co" },
        ],
        // Giữ bản tối ưu 30 ngày trên CDN Vercel → lần tải sau tức thì.
        minimumCacheTTL: 2592000,
      },

      // ── CỨU "THỢ PHỤ" CỦA BẢN ĐỒ MAPLIBRE ─────────────────────────────────
      // MapLibre 6 tìm file worker theo đường TƯƠNG ĐỐI so với chính nó, nên nó
      // gọi /_next/static/chunks/maplibre-gl-worker.mjs — file KHÔNG hề tồn tại
      // → 404 → worker chết câm → bản đồ TRẮNG TRƠN, không báo lỗi gì.
      // Đo trên web thật 11/09/2026: bản dựng production có HAI bản thư viện,
      // chỉ một bản nhận đường mà setWorkerUrl chỉ cho; bản còn lại vẫn đi tìm
      // đường cũ. Nên phải chặn ngay ở máy chủ: ai hỏi đường cũ thì trả file
      // thật trong public/maplibre/ (do scripts/chep-maplibre-worker.mjs chép ra).
      // beforeFiles = xét TRƯỚC khi tìm file tĩnh, nên áp được cho cả /_next/static.
      // TÌM KIẾM NỘI BỘ KHÔNG LẬP CHỈ MỤC (MASTER mục 4): mọi đường dẫn có ?q= trả thêm
      // X-Robots-Tag noindex. Làm bằng quy tắc header tĩnh để trang vẫn phục vụ từ bộ nhớ
      // đệm — đọc searchParams trong trang sẽ biến trang thành động (tốn chi phí Vercel).
      async headers() {
        return [
          { source: "/:path*", has: [{ type: "query", key: "q" }], headers: [{ key: "X-Robots-Tag", value: "noindex, follow" }] },
        ];
      },

      // ĐƯỜNG DẪN CŨ /mua-ban?tinh=<Tỉnh> → 301 về trang tỉnh /mua-ban/<tỉnh> (SEO, 15/10/2026).
      // Google còn nhớ các địa chỉ này (canonical về /mua-ban nên sức mạnh rơi mất). Chỉ áp cho
      // đúng TÊN TỈNH/THÀNH (cả hệ cũ lẫn mới); địa danh nhỏ hơn ("Nha Trang", "Quy Nhơn" — thẻ
      // trang chủ đã duyệt) giữ nguyên vì chúng lọc đúng phạm vi đô thị đó.
      async redirects() {
        const slug = (s: string) =>
          s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[đĐ]/g, "d").toLowerCase()
            .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
        const ten = Array.from(new Set([...provincesNew.map((p) => p.name), ...provincesOld.map((p) => p.name)]));
        const thoat = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return ["/mua-ban", "/cho-thue"].flatMap((base) =>
          ten.map((t) => ({
            source: base,
            has: [{ type: "query" as const, key: "tinh", value: `^${thoat(t)}$` }],
            destination: `${base}/${slug(t)}`,
            permanent: true,
          })),
        );
      },

      async rewrites() {
        const toi = (f: string) => `/maplibre/${f}`;
        return {
          beforeFiles: [
            { source: "/_next/static/chunks/maplibre-gl-worker.mjs", destination: toi("maplibre-gl-worker.js") },
            { source: "/_next/static/chunks/maplibre-gl-shared.mjs", destination: toi("maplibre-gl-shared.js") },
            { source: "/_next/static/chunks/maplibre-gl-shared.js", destination: toi("maplibre-gl-shared.js") },
          ],
          afterFiles: [],
          fallback: [],
        };
      },
    };

export default nextConfig;
