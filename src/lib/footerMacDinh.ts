// Nội dung chân trang MẶC ĐỊNH (trước khi đọc admin). Tách khỏi siteContent (27/10/2026): Footer có ở MỌI trang, nhập từ
// siteContent thì kéo theo banners → data → filters → listingSpec, locations, billing… vào mã tải của mọi trang.
// siteContent xuất lại y như cũ.
export type FooterSocial = { label: string; href: string };
export type FooterShot = { src: string; alt: string };
export type FooterData = {
  tagline: string;      // dòng đậm dưới logo
  description: string;  // đoạn giới thiệu ngắn
  hotline: string;
  email: string;
  address: string;
  company: string;      // tên pháp lý (dòng cuối)
  socials: FooterSocial[];
  images: FooterShot[]; // 3 ảnh minh hoạ (dẫn tới trang Giới thiệu)
};

// Mặc định = đúng nội dung Footer hiện tại (khớp Footer.tsx cũ).
export const FOOTER_DEFAULT: FooterData = {
  // Dòng đậm dưới logo — mặc định = ĐÚNG câu admin đang lưu (25/10/2026): trước để tên cũ CVR nên lúc mới tải
  // footer loé tên cũ rồi mới đổi, và Google đọc được tên cũ trong HTML.
  tagline: "Cổng thông tin mua bán, cho thuê nhà đất",
  description:
    "Coastal Land (coastalland.vn) là nền tảng công nghệ và cổng thông tin bất động sản trực tuyến hàng đầu tại Việt Nam.",
  hotline: "+84 377 985 036",
  email: "hotro@coastalland.vn",
  // Địa chỉ công ty — ghi theo đơn vị hành chính MỚI 2025 (Tỉnh/Thành → Phường/Xã)
  address: "220 Nguyễn Mậu Tài, Phường Hòa Xuân, Thành phố Đà Nẵng",
  company: "Central Coast Vietnam Real Estate (CVR)",
  socials: [
    { label: "Zalo", href: "#" },
    { label: "Facebook", href: "#" },
    { label: "X", href: "#" },
    { label: "YouTube", href: "#" },
  ],
  images: [
    { src: "/images/gioi-thieu/intro-thanh-pho.jpg", alt: "Đô thị ven biển Duyên hải Miền Trung" },
    { src: "/images/gioi-thieu/villa-bien.jpg", alt: "Biệt thự view biển" },
    { src: "/images/gioi-thieu/ben-du-thuyen.jpg", alt: "Đô thị ven biển" },
  ],
};
