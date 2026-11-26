import { isVideoUrl } from "@/lib/media";

// ẢNH (không video) theo thứ tự hiển thị — MỘT luật cho trang tin (máy chủ) và thẻ tin (trình duyệt, khi khách bấm mở ảnh).
// Tin admin ĐĂNG HỘ có details.anh_bia = ảnh hợp khung 4:3 nhất trong 5 ảnh đầu (chủ dự án 09/10/2026) → đưa lên đầu.
// Tin khách tự đăng giữ ảnh khách chọn.
export function anhTheoThuTu(images: string[], anhBia?: string | null): string[] {
  const ds = images.filter((s) => !isVideoUrl(s));
  return anhBia && ds.includes(anhBia) ? [anhBia, ...ds.filter((s) => s !== anhBia)] : ds;
}
