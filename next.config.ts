import type { NextConfig } from "next";

// Khi build cho GitHub Pages (biến GITHUB_PAGES=true) thì xuất tĩnh.
// Từ 7/2026 chạy domain riêng coastalland.vn (custom domain) → KHÔNG còn basePath /cvr-website-.
const isPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = isPages
  ? {
      output: "export",
      images: { unoptimized: true },
      trailingSlash: true,
    }
  : {
      // Dev/Vercel: cũng tắt tối ưu ảnh để KHỚP production (GitHub Pages static export
      // luôn unoptimized). Đồng thời dev phục vụ ảnh gốc từ /public tức thì thay vì
      // qua /_next/image (vốn chậm, gây treo tải khi chụp/kiểm thử).
      images: { unoptimized: true },
    };

export default nextConfig;
