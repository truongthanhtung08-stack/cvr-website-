import type { MetadataRoute } from "next";

// robots.txt (Next tự sinh khi build) — cho Google/bot thu thập trang công khai,
// chặn khu vực riêng tư (admin, tài khoản, luồng đăng nhập, API/auth callback).
export default function robots(): MetadataRoute.Robots {
  const SITE = "https://coastalland.vn";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/auth", "/tai-khoan", "/dang-nhap", "/dang-ky", "/quen-mat-khau"],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
