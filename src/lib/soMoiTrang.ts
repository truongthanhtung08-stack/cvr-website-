// ============================================================================
// MỘT QUY ĐỊNH CHO MỌI DANH SÁCH CHIA TRANG (chủ dự án 22/10/2026): PC 15 · điện thoại 10 ("PC cuộn bằng chuột, mobile
// chạm vuốt"). Đủ thì chia trang theo số này, không đủ thì một trang với số đang có. Áp cho: danh sách tin Mua bán / Cho
// thuê, kết quả tìm, danh sách mở từ "Xem thêm", danh sách dự án, tin tức, "Tin đăng của tôi". Các khối "Xem thêm" (slide)
// KHÔNG dùng số này — giữ số đã chốt riêng.
// Trang 1 máy chủ dựng sẵn PER_PAGE cho mọi máy (Google đọc bản điện thoại); PC đổi sang 15 ngay khi trang mở.
// ============================================================================
export const PER_PAGE = 10;
export const MOI_TRANG_PC = 15;

export function soTinMoiTrang(): number {
  return typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches ? MOI_TRANG_PC : PER_PAGE;
}
// Thành phần trình duyệt dùng useSoMoiTrang (lib/useSoMoiTrang) — tách riêng vì tệp này máy chủ cũng nhập.
