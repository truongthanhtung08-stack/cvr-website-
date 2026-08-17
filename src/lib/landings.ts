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
    // ⚠️ Không dùng "số 1" / "100%" / "mọi tin" — Luật Quảng cáo cấm tuyên bố
    // hạng nhất không chứng minh được, và Coastal Land chỉ NỖ LỰC xác thực.
    intro:
      "Coastal Land (www.coastalland.vn) là cổng thông tin bất động sản tại Duyên hải Trung bộ. Với nền tảng công nghệ cùng chiến lược Marketing bài bản, chúng tôi kết nối người có nhu cầu mua, bán, cho thuê bất động sản với nhau và với các chuyên gia — giúp mọi người tìm kiếm, chia sẻ thông tin nhanh chóng, thuận tiện.",
    stats: [
      { value: "2.500+", label: "Tin đã kiểm duyệt" },
      { value: "7", label: "Tỉnh/thành phủ sóng" },
      { value: "Rà soát", label: "Tin được xác thực trước khi đăng" },
     ],
    blocks: [
      { title: "Khách quan & minh bạch", desc: "Thông tin trung lập, không thổi giá; tin đăng ghi rõ pháp lý, diện tích, vị trí thật." },
      { title: "Xác thực trước khi đăng", desc: "Đội ngũ rà soát thông tin, đối chiếu sổ và hiện trạng trước khi công bố — giảm rủi ro cho người mua." },
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
      { value: "Miền Trung", label: "Đà Nẵng · Huế và lân cận" },
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

