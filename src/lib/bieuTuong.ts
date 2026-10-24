// MỘT BỘ BIỂU TƯỢNG CHO CẢ WEB (chủ dự án 25/10/2026: "cái nào có icon phải đồng bộ hết, không phải chỗ này chỗ kia khác nhau").
// Menu (máy tính + điện thoại), thanh tab dưới đáy, ô tìm trang chủ, nút Lưu… đều lấy đường vẽ từ đây.
// Nét vẽ: SVG 24×24, viền (stroke), đầu nét tròn. Đổi một biểu tượng ở đây là đổi ở mọi nơi.
export const BIEU_TUONG = {
  // Toà nhà + cây (Tabler — chủ dự án chọn 17/10/2026)
  muaBan: "M3 21h18M19 21v-4M19 17a2 2 0 0 0 2 -2v-2a2 2 0 1 0 -4 0v2a2 2 0 0 0 2 2zM14 21v-14a3 3 0 0 0 -3 -3h-4a3 3 0 0 0 -3 3v14M9 17v4M8 13h2M8 9h2",
  // Cửa ra vào — cùng kiểu nét đứng + đường nền với Mua bán, Dự án (25/10/2026, thay chìa khoá vẽ nghiêng lệch kiểu)
  choThue: "M14 12v.01M3 21h18M6 21v-16a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v16",
  // Toà cao tầng (Tabler)
  duAn: "M3 21l18 0M5 21v-14l8 -4v18M19 21v-10l-6 -4M9 9l0 .01M9 12l0 .01M9 15l0 .01M9 18l0 .01",
  // Người — Tài khoản
  taiKhoan: "M15.9 8.2a3.9 3.9 0 1 1-7.8 0 3.9 3.9 0 0 1 7.8 0ZM4.9 20.6a7.1 7.1 0 0 1 14.2 0",
  // Trái tim — Lưu tin / Tin đã lưu (cùng hình nút tim trên thẻ tin)
  tim: "M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z",
} as const;
