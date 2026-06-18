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
  : {};

export default nextConfig;
