// ===== LANDING PAGE mẫu (chạy từ banner Hero trang chủ) =====
// Mỗi landing = 1 trang đích đẹp, chuyên nghiệp. Sau này khách hàng/công ty tự thiết kế;
// đây là 3 mẫu của Coastal Land để minh hoạ. Ảnh lấy trong /public/images.

export type LandingStat = { value: string; label: string };
export type LandingBlock = { title: string; desc: string };

export type Landing = {
  slug: string;
  image: string; // ảnh hero của landing (RAW path)
  eyebrow: string;
  title: string;
  subtitle: string;
  intro: string;
  stats: LandingStat[];
  blocks: LandingBlock[];
  gallery: string[]; // vài ảnh minh hoạ (RAW path)
  ctaLabel: string;
  ctaHref: string;
};

export const landings: Landing[] = [
  {
    slug: "ve-coastal-land",
    image: "/images/hero-cty1.jpg",
    eyebrow: "Central Coast Vietnam Properties (CVR)",
    title: "Bất động sản Duyên hải Miền trung",
    subtitle: "Cổng thông tin Bất động sản trực tuyến ưu việt",
    intro:
      "Coastal Land là sàn giao dịch bất động sản trung gian, khách quan tại Đà Nẵng – Huế và toàn vùng Duyên hải miền Trung. Chúng tôi kết nối trực tiếp người mua và người bán, kiểm chứng pháp lý và thực địa từng tin đăng — với nguyên tắc cốt lõi: người mua MIỄN PHÍ mãi mãi.",
    stats: [
      { value: "2.500+", label: "Tin đã kiểm duyệt" },
      { value: "7", label: "Tỉnh/thành phủ sóng" },
      { value: "100%", label: "Tin kiểm chứng thực địa" },
      { value: "0đ", label: "Phí cho người mua" },
    ],
    blocks: [
      { title: "Khách quan & minh bạch", desc: "Thông tin trung lập, không thổi giá; mọi tin đều ghi rõ pháp lý, diện tích, vị trí thật." },
      { title: "Kiểm chứng thực địa", desc: "Đội ngũ đi thực tế, xác minh sổ và hiện trạng trước khi đăng — giảm rủi ro cho người mua." },
      { title: "Phủ sóng miền Trung", desc: "Đà Nẵng, Huế, Quảng Ngãi, Gia Lai, Đắk Lắk, Khánh Hòa, Quảng Trị — cập nhật liên tục." },
    ],
    gallery: ["/images/tin/1.jpg", "/images/tin/13.jpg", "/images/tin/19.jpg", "/images/tin/24.jpg"],
    ctaLabel: "Khám phá nhà đất",
    ctaHref: "/mua-ban",
  },
  {
    slug: "dich-vu",
    image: "/images/hero-cty2.jpg",
    eyebrow: "Dành cho người bán & môi giới",
    title: "Ký gửi & môi giới chuyên nghiệp",
    subtitle: "Định giá đúng · Bán nhanh · Pháp lý an toàn",
    intro:
      "Bạn cần bán hoặc cho thuê bất động sản tại miền Trung? Coastal Land hỗ trợ định giá sát thị trường, chụp ảnh chuyên nghiệp, phân phối tin trên đa kênh và đồng hành pháp lý đến khi giao dịch hoàn tất.",
    stats: [
      { value: "15 ngày", label: "Thời gian bán trung bình" },
      { value: "Đa kênh", label: "Website · Zalo · Facebook" },
      { value: "1-1", label: "Chuyên viên đồng hành" },
      { value: "Cam kết", label: "Pháp lý minh bạch" },
    ],
    blocks: [
      { title: "Định giá sát thị trường", desc: "Phân tích dữ liệu giao dịch khu vực để định giá đúng, bán nhanh, không hớ." },
      { title: "Marketing chuyên nghiệp", desc: "Ảnh đẹp, mô tả chuẩn SEO, đẩy tin VIP & banner tới đúng tệp khách hàng." },
      { title: "Hỗ trợ pháp lý trọn gói", desc: "Tư vấn công chứng, sang tên, thuế phí — an toàn cho cả hai bên." },
    ],
    gallery: ["/images/tin/3.jpg", "/images/tin/7.jpg", "/images/tin/16.jpg", "/images/segments/canho1.jpg"],
    ctaLabel: "Nhận báo giá ký gửi",
    ctaHref: "/bao-gia-dang-tin",
  },
];

export function getLandingBySlug(slug: string): Landing | undefined {
  return landings.find((l) => l.slug === slug);
}

