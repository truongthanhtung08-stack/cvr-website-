import type { NextConfig } from "next";

// Khi build cho GitHub Pages (biến GITHUB_PAGES=true) thì xuất tĩnh + đặt basePath.
// Local/Vercel/Cloudflare giữ nguyên (không basePath).
const isPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = isPages
  ? {
      output: "export",
      basePath: "/cvr-website-",
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
