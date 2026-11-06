import { redirect } from "next/navigation";

// MỘT BẢNG GIÁ DUY NHẤT (chủ dự án chốt 08/10/2026): mọi giá, khuyến mãi, miễn phí
// thành viên mới, số ảnh/video và cỡ gói đẩy đã gom về /admin/gia-chuan.
export default function GiaKhuyenMaiCu() {
  redirect("/admin/gia-chuan");
}
