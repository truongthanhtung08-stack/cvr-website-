// ===== HỆ THỐNG BANNER (quảng cáo thu phí) — dữ liệu rời, KHÔNG giới hạn slide =====
// 👉 Sau này quản lý qua Admin/Supabase. Ảnh để trong /public/images (đường dẫn RAW,
//    component sẽ tự thêm basePath qua asset()).
//
//  - homeBanners : Hero TRANG CHỦ → chạy LANDING PAGE (công ty / khách hàng tự thiết kế)
//  - projectBanners : banner TRANG DỰ ÁN → ảnh dự án + 2 dòng (Tên + Địa chỉ) kiểu batdongsan
import { projects } from "@/lib/data";

export type Banner = {
  id: string;
  image: string; // đường dẫn RAW trong /public, vd "/images/hero1.png"
  title: string; // dòng 2: tiêu đề chính — cũng dùng làm alt
  subtitle?: string; // dòng 3: mô tả ngắn / địa chỉ
  status?: string; // dòng 1: trạng thái mở bán hoặc nhãn
  showStatus?: boolean; // hiển thị dòng trạng thái
  showTitle?: boolean; // hiển thị dòng tiêu đề
  showSubtitle?: boolean; // hiển thị dòng mô tả
  href?: string; // bấm banner → tới đâu
};

// Banner Hero trang chủ — mỗi banner trỏ tới 1 Landing Page (mẫu của công ty)
export const homeBanners: Banner[] = [
  {
    id: "lp-gioi-thieu",
    image: "/images/hero-cty1.jpg",
    status: "Quảng cáo",
    title: "Coastal Land — Kết Nối Bất Động Sản Duyên Hải Miền Trung",
    subtitle: "Minh bạch, pháp lý rõ ràng, giao dịch an toàn",
    showStatus: true,
    showTitle: true,
    showSubtitle: true,
    href: "/landing/ve-central-land",
  },
  {
    id: "lp-dich-vu",
    image: "/images/hero-cty2.jpg",
    status: "Quảng cáo",
    title: "Ký gửi bất động sản chuyên nghiệp",
    subtitle: "Định giá chuẩn, bán nhanh, hỗ trợ pháp lý",
    showStatus: true,
    showTitle: true,
    showSubtitle: true,
    href: "/landing/dich-vu",
  },
  {
    id: "lp-vinhomes",
    image: "/images/duan-vinhomes.jpg",
    status: "Đang mở bán",
    title: "Vinhomes Skylake — Căn hộ cao cấp",
    subtitle: "View hồ điều hoà, tiện ích 5 sao, pháp lý đảm bảo",
    showStatus: true,
    showTitle: true,
    showSubtitle: true,
    href: "/du-an/vinhomes-skylake-dream",
  },
];

// Banner trang Dự án — 5 mẫu lấy từ ảnh chính mỗi dự án + Tên + Địa chỉ
export const projectBanners: Banner[] = projects.slice(0, 5).map((p) => ({
  id: p.slug,
  image: `/images/du-an/${p.slug}.jpg`,
  title: p.name,
  subtitle: p.location,
  href: `/du-an/${p.slug}`,
}));

