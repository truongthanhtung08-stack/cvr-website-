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
      // CHẶN MÁY DÒ AHREFS (anh chốt 07/11/2026): đo Vercel 7 ngày 7.500 lượt (AhrefsBot + AhrefsSiteAudit), chỉ 6–19% lấy
      // từ bộ đệm → gần như lượt nào cũng chạy máy chủ, tốn tiền Vercel, không giúp lên Google.
      { userAgent: ["AhrefsBot", "AhrefsSiteAudit"], disallow: "/" },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    // Không khai "Host:" (08/11/2026): Google không hỗ trợ, Search Console báo cảnh báo robots.txt. Tên miền chính đã do
    // chuyển hướng 308 (www → không www, http → https) + canonical quyết định.
  };
}
