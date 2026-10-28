import { ZALO_OA_URL } from "@/lib/lienHe";
// ── DỮ LIỆU CÓ CẤU TRÚC CẤP TOÀN SITE (JSON-LD) ────────────────────────────
// Đặt ở layout gốc → có mặt trên mọi trang. Ba việc:
//   1. Organization  → Google dựng "Bảng tri thức" bên phải khi tìm "Coastal Land"
//                      (logo, tên chính thức, hotline, mạng xã hội).
//   2. WebSite + SearchAction → có thể hiện Ô TÌM KIẾM NGAY trong kết quả Google
//                      (sitelinks searchbox) — khách gõ thẳng vào Google là ra tin.
//   (21/10/2026: bỏ kiểu RealEstateAgent — đó là "môi giới", sai vai trò: Coastal Land là cổng thông tin, không môi giới.
//    Chỉ khai Organization; địa chỉ, điện thoại, khu vực phục vụ vẫn giữ.)

const SITE = "https://coastalland.vn";

const data = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE}/#to-chuc`,
      name: "COASTAL LAND",
      // Tên gọi khác khách hay gõ — AI tìm kiếm của Google (24/10/2026) đang lẫn "coastalland" với khu nghỉ dưỡng
      // Vinpearl Coastalland; khai đủ tên + lĩnh vực để Google nhận đúng thực thể cổng thông tin bất động sản.
      alternateName: ["Coastal Land", "Coastalland", "coastalland.vn", "Central Coast Vietnam Real Estate"],
      foundingDate: "2026-08-17", // ngày cấp mã số doanh nghiệp (trang Giới thiệu)
      email: "hotro@coastalland.vn",
      knowsAbout: ["Mua bán nhà đất", "Cho thuê nhà đất", "Căn hộ chung cư", "Đất nền", "Dự án bất động sản"],
      // Chỉ khai MÃ SỐ DOANH NGHIỆP để Google đối chiếu được với đăng ký doanh nghiệp
      // (yếu tố tin cậy E-E-A-T). KHÔNG khai legalName tiếng Việt đầy đủ — theo yêu cầu
      // chủ dự án, web chỉ dùng tên viết tắt COASTAL LAND (đã nằm ở trường "name").
      taxID: "0402353502",
      url: SITE,
      // Logo cho Google phải là ẢNH (PNG/JPG/WebP, ≥ 112 px) — Google không nhận SVG cho logo Organization (28/10/2026).
      // Logo vuông nền trắng, đúng logo hồ sơ Google Doanh nghiệp.
      logo: { "@type": "ImageObject", url: `${SITE}/logo/app-icon-1024.png`, width: 1024, height: 1024 },
      image: `${SITE}/logo/logo-horizontal.jpg`,
      description:
        "Cổng thông tin mua bán, cho thuê nhà đất, căn hộ, đất nền và dự án.",
      slogan: "Cổng thông tin mua bán, cho thuê nhà đất",
      // Câu phân biệt (28/10/2026): gõ "coastal land" thì khung AI của Google trả nghĩa từ điển "đất ven biển" — nói rõ đây là TÊN
      // THƯƠNG HIỆU của cổng thông tin bất động sản (schema.org disambiguatingDescription).
      disambiguatingDescription:
        "COASTAL LAND (coastalland.vn) là tên cổng thông tin mua bán, cho thuê nhà đất tại Việt Nam, không phải thuật ngữ tiếng Anh “coastal land” (đất ven biển).",
      areaServed: [
        { "@type": "Country", name: "Việt Nam" },
      ],
      // ĐỊA CHỈ + ĐIỆN THOẠI phải TRÙNG TỪNG CHỮ với hồ sơ Google Business.
      // Đây là cách Google nối "website này" với "doanh nghiệp này" thành MỘT thực thể
      // → bảng thương hiệu bên phải kết quả tìm kiếm mới hiện đúng và mạnh.
      // Lệch một chữ (viết tắt tên đường, thiếu phường) là Google coi như 2 nơi khác nhau.
      // Kênh chính thức của Coastal Land — giúp Google gom các kênh về MỘT thực thể (E-E-A-T, 15/10/2026).
      // 20/10/2026: thêm Fanpage (tạo 16/10, KE-HOACH-MXH.md) + kênh YouTube. Hồ sơ Google Doanh nghiệp: có link thì thêm.
      sameAs: [ZALO_OA_URL, "https://www.facebook.com/profile.php?id=61595622503937", "https://www.youtube.com/@CoastalLandvn"],
      telephone: "+84377985036",
      address: {
        "@type": "PostalAddress",
        streetAddress: "220 Nguyễn Mậu Tài, Hòa Xuân",
        addressLocality: "Đà Nẵng",
        addressCountry: "VN",
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE}/#website`,
      url: SITE,
      name: "COASTAL LAND",
      alternateName: ["Coastal Land", "coastalland.vn"],
      inLanguage: "vi-VN",
      publisher: { "@id": `${SITE}/#to-chuc` },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE}/tim-kiem?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function SiteJsonLd() {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}
