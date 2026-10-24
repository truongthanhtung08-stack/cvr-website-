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
        // "/*_rsc=": tệp phụ Next.js (?_rsc=…) — Search Console 24/10/2026: 37% lượt thu thập 90 ngày rơi vào đây, chỉ 8% là
        // trang HTML, 306 trang chưa được ghé lần nào. Trang đã dựng sẵn ở máy chủ nên Google không cần tệp này để đọc nội dung.
        disallow: ["/admin", "/api", "/auth", "/tai-khoan", "/dang-nhap", "/dang-ky", "/quen-mat-khau", "/*_rsc="],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
