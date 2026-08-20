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
      // Chỉ khai MÃ SỐ DOANH NGHIỆP để Google đối chiếu được với đăng ký doanh nghiệp
      // (yếu tố tin cậy E-E-A-T). KHÔNG khai legalName tiếng Việt đầy đủ — theo yêu cầu
      // chủ dự án, web chỉ dùng tên viết tắt COASTAL LAND (đã nằm ở trường "name").
      taxID: "0402353502",
      url: SITE,
      logo: `${SITE}/logo/logo-horizontal-dark.svg`,
      image: `${SITE}/images/hero-thanh-pho-hien-dai-26.jpg`,
      description:
        "Sàn giao dịch bất động sản trực tuyến tại Đà Nẵng, Huế và Duyên hải Miền Trung — mua bán, cho thuê nhà đất, căn hộ, đất nền và dự án.",
      slogan: "Bất động sản Duyên hải Miền Trung",
      areaServed: [
        { "@type": "City", name: "Đà Nẵng" },
        { "@type": "City", name: "Huế" },
        { "@type": "Place", name: "Duyên hải Miền Trung, Việt Nam" },
      ],
      // ĐỊA CHỈ + ĐIỆN THOẠI phải TRÙNG TỪNG CHỮ với hồ sơ Google Business.
      // Đây là cách Google nối "website này" với "doanh nghiệp này" thành MỘT thực thể
      // → bảng thương hiệu bên phải kết quả tìm kiếm mới hiện đúng và mạnh.
      // Lệch một chữ (viết tắt tên đường, thiếu phường) là Google coi như 2 nơi khác nhau.
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
