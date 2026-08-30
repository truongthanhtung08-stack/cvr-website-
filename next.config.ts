import type { NextConfig } from "next";

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
      // Dev/Vercel: BẬT tối ưu ảnh của Next. Đây là đòn bẩy tốc độ lớn nhất trên mobile —
      // điện thoại 375px chỉ tải bản ảnh ~640px định dạng AVIF/WebP thay vì nguyên PNG gốc
      // ~2000px từ Supabase (giảm ~70–85% dung lượng ảnh), tải nhanh + mượt như apple.com.
      images: {
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
    };

export default nextConfig;
