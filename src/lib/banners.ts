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

// Banner Hero trang chủ — 3 slide. Chữ chạy trên banner = 2 DÒNG, canh trái.
// 👉 Bạn TỰ SỬA nội dung tại đây. Đặt showText:false để TẮT chữ trên 1 banner.
export const homeBanners: Banner[] = [
  // ===== 2 BANNER CÔNG TY (quảng cáo / landing page công ty) =====
  {
    id: "lp-gioi-thieu",
    image: "/images/hero-cty1.jpg",
    title: "Coastal Land — Bất động sản Duyên hải Miền Trung", // dòng 1
    subtitle: "Minh bạch · pháp lý rõ ràng · giao dịch an toàn", // dòng 2
    // cta: "Tìm hiểu thêm", // CTA TẮT cho banner công ty — bỏ // để bật
    showText: true,
    href: "/landing/ve-central-land",
  },
  {
    id: "lp-dich-vu",
    image: "/images/hero-cty2.jpg",
    title: "Ký gửi Bất động sản chuyên nghiệp", // dòng 1
    subtitle: "Định giá chuẩn · bán nhanh · hỗ trợ pháp lý", // dòng 2
    // cta: "Xem dịch vụ", // CTA TẮT cho banner công ty — bỏ // để bật
    showText: true,
    href: "/landing/dich-vu",
  },
  // ===== 1 BANNER DỰ ÁN (dòng 1 = TÊN dự án, dòng 2 = ĐỊA ĐIỂM) =====
  {
    id: "lp-vinhomes",
    image: "/images/duan-vinhomes.jpg",
    // status: "Đang mở bán", // ẨN dòng đầu — bỏ // để hiện
    title: "Vinhomes Skylake — Dream Apartment", // TÊN dự án
    subtitle: "Phạm Hùng, Nam Từ Liêm, Hà Nội", // ĐỊA CHỈ
    // cta: "Xem dự án", // ẨN dòng cuối (CTA) — bỏ // để hiện
    showText: true,
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
