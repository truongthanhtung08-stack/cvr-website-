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
  status?: string; // (DỰ ÁN) tình trạng: "Đang mở bán" / "Sắp mở bán" — nhãn dòng trên cùng
  title: string; // DÒNG chính (lớn): tiêu đề / tên dự án — cũng dùng làm alt ảnh
  subtitle?: string; // DÒNG phụ (nhỏ): mô tả ngắn / ĐỊA CHỈ
  cta?: string; // nhãn nút CTA (vd "Xem dự án", "Tìm hiểu thêm"); bỏ trống → KHÔNG hiện nút
  showText?: boolean; // BẬT/TẮT phần chữ chạy trên banner (mặc định: bật)
  href?: string; // bấm banner / bấm CTA → tới đâu
};

// Banner Hero trang chủ — 3 slide. Chữ chạy trên banner = 3 DÒNG (Nhãn · Tiêu đề · Mô tả), canh trái, sát dưới.
// 👉 Bạn TỰ SỬA nội dung tại đây. Đặt showText:false để TẮT chữ trên 1 banner.
export const homeBanners: Banner[] = [
  // ===== 2 BANNER CÔNG TY (quảng cáo / landing page công ty) =====
  {
    id: "lp-gioi-thieu",
    image: "/images/hero-thanh-pho-hien-dai-26.jpg",
    status: "Coastal Land", // dòng 1 (nhãn)
    title: "Bất động sản Duyên hải Miền trung", // dòng 2
    subtitle: "Kết nối - Tiện ích - Xác thực", // dòng 3
    // cta: "Tìm hiểu thêm", // CTA TẮT cho banner công ty — bỏ // để bật
    showText: true,
    href: "/landing/ve-coastal-land",
  },
  {
    id: "lp-dich-vu",
    image: "/images/hero-pho-bien-9-26.jpg",
    status: "Coastal Land", // dòng 1 (nhãn — tự hiển thị IN HOA)
    title: "Nền tảng công nghệ Bất động sản hàng đầu", // dòng 2
    subtitle: "Mua bán - Cho thuê - Dự án", // dòng 3
    // cta: "Xem dịch vụ", // CTA TẮT cho banner công ty — bỏ // để bật
    showText: true,
    href: "/landing/dich-vu",
  },
  // ===== 1 BANNER DỰ ÁN (dòng 1 = TÊN dự án, dòng 2 = ĐỊA ĐIỂM) =====
  {
    id: "lp-vinhomes",
    image: "/images/hero-villa-view-bien-12-26.jpg",
    // CHỈ hiện dòng 2 (bỏ nhãn dòng 1 + mô tả dòng 3)
    title: "Dự án nổi bật", // dòng 2
    // cta: "Xem dự án", // ẨN dòng cuối (CTA) — bỏ // để hiện
    showText: true,
    href: "/du-an/vinhomes-skylake-dream",
  },
];

// Banner trang Dự án — 5 mẫu, ảnh PANORAMA (biển/đô thị/bến du thuyền/đảo) crop đúng
// tỷ lệ khung banner (3:1), chân trời ở giữa nên KHÔNG mất chủ thể; KHÔNG dùng ảnh thẻ dự án (16:10).
export const projectBanners: Banner[] = projects.slice(0, 5).map((p) => ({
  id: p.slug,
  image: `/images/du-an/hero-${p.slug}-3x1.jpg`,
  title: p.name,
  subtitle: p.location,
  href: `/du-an/${p.slug}`,
}));
