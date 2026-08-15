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
      "Coastal Land (www.coastalland.vn) là nền tảng kết nối bất động sản số 1 tại Duyên hải Trung bộ. Với nền tảng công nghệ cùng chiến lược Marketing vượt trội, Chúng tôi gắn kết và tạo kết nối giữa những người có nhu cầu mua và bán bất động sản, giữa người dùng và các chuyên gia nhằm giúp mọi người tìm kiếm, chia sẻ và giao dịch nhanh chóng, thuận tiện.",
    stats: [
      { value: "2.500+", label: "Tin đã kiểm duyệt" },
      { value: "7", label: "Tỉnh/thành phủ sóng" },
      { value: "100%", label: "Tin kiểm chứng thực địa" },
     ],
    blocks: [
      { title: "Khách quan & minh bạch", desc: "Thông tin trung lập, không thổi giá; mọi tin đều ghi rõ pháp lý, diện tích, vị trí thật." },
      { title: "Kiểm chứng thực địa", desc: "Đội ngũ đi thực tế, xác minh sổ và hiện trạng trước khi đăng — giảm rủi ro cho người mua." },
      { title: "Phủ sóng toàn khu vực", desc: "Duyên hải Miền trung và Tây Nguyên — cập nhật liên tục." },
    ],
    gallery: ["/images/tin/1.jpg", "/images/tin/13.jpg", "/images/tin/19.jpg", "/images/tin/24.jpg"],
    ctaLabel: "Khám phá nhà đất",
    ctaHref: "/mua-ban",
  },
  {
    slug: "dich-vu",
    image: "/images/hero-cty2.jpg",
    // ⚠️ ĐỊNH VỊ: Coastal Land là CỔNG THÔNG TIN BĐS — KHÔNG ký gửi, KHÔNG môi
    // giới, KHÔNG phân phối/mua bán bất kỳ bất động sản nào. Mọi câu chữ ở đây
    // chỉ được nói về DỊCH VỤ ĐĂNG TIN & QUẢNG BÁO TIN trên nền tảng.
    eyebrow: "Dành cho người bán & môi giới",
    title: "Dịch vụ hỗ trợ đăng tin mua bán, cho thuê",
    subtitle: "Tin chuẩn · Đúng khu vực · Đúng người mua",
    intro:
      "Bạn cần bán hoặc cho thuê bất động sản tại miền Trung? Coastal Land là cổng thông tin giúp tin của bạn hiển thị đúng khu vực, đúng loại hình và tiếp cận người mua đang thật sự tìm — qua website, gói tin VIP và banner quảng bá.",
    stats: [
      { value: "Duyệt nhanh", label: "Tin lên trong ít phút" },
      { value: "Đa kênh", label: "Website · Zalo · Facebook" },
      { value: "Miễn phí", label: "Với người tìm mua" },
      { value: "Kiểm chứng", label: "Tin đăng được xác minh" },
    ],
    blocks: [
      { title: "Đăng tin đúng chuẩn", desc: "Biểu mẫu đầy đủ thuộc tính theo từng loại hình, tin lên là hiển thị đúng khu vực người mua đang tìm." },
      { title: "Quảng bá đúng tệp", desc: "Gói tin VIP, vị trí nổi bật và banner đưa tin của bạn tới đúng nhóm khách hàng quan tâm." },
      { title: "Kiểm duyệt minh bạch", desc: "Tin được kiểm duyệt trước khi công bố — giữ chất lượng thông tin cho cả người mua lẫn người bán." },
    ],
    gallery: ["/images/tin/3.jpg", "/images/tin/7.jpg", "/images/tin/16.jpg", "/images/segments/canho1.jpg"],
    ctaLabel: "Xem bảng giá đăng tin",
    ctaHref: "/bao-gia-dang-tin",
  },
];

export function getLandingBySlug(slug: string): Landing | undefined {
  return landings.find((l) => l.slug === slug);
}

