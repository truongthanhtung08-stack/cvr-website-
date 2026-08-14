// ── DỮ LIỆU CÓ CẤU TRÚC CẤP TOÀN SITE (JSON-LD) ────────────────────────────
// Đặt ở layout gốc → có mặt trên mọi trang. Ba việc:
//   1. Organization  → Google dựng "Bảng tri thức" bên phải khi tìm "Coastal Land"
//                      (logo, tên chính thức, hotline, mạng xã hội).
//   2. WebSite + SearchAction → có thể hiện Ô TÌM KIẾM NGAY trong kết quả Google
//                      (sitelinks searchbox) — khách gõ thẳng vào Google là ra tin.
//   3. RealEstateAgent → khai đúng ngành nghề + khu vực phục vụ, giúp xếp hạng
//                      các truy vấn có yếu tố địa phương (Đà Nẵng, Huế…).

const SITE = "https://coastalland.vn";

const data = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["Organization", "RealEstateAgent"],
      "@id": `${SITE}/#to-chuc`,
      name: "COASTAL LAND",
      alternateName: "Central Coast Vietnam Real Estate",
      url: SITE,
      logo: `${SITE}/logo/logo-horizontal-dark.svg`,
      image: `${SITE}/images/hero-thanh-pho-hien-dai-26.jpg`,
      description:
        "Sàn giao dịch bất động sản trực tuyến tại Đà Nẵng, Huế và Duyên hải Miền Trung — mua bán, cho thuê nhà đất, căn hộ, đất nền và dự án.",
      areaServed: [
        { "@type": "City", name: "Đà Nẵng" },
        { "@type": "City", name: "Huế" },
        { "@type": "Place", name: "Duyên hải Miền Trung, Việt Nam" },
      ],
      address: {
        "@type": "PostalAddress",
        addressLocality: "Đà Nẵng",
        addressCountry: "VN",
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE}/#website`,
      url: SITE,
      name: "COASTAL LAND",
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
