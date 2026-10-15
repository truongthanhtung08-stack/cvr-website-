// Tách TÊN ĐƯỜNG từ "địa chỉ chi tiết" người đăng nhập — cho trang pSEO theo đường (trục 4).
//   "Dự án Regal Complex, Đường Đào Duy Tùng" → "Đào Duy Tùng"
//   "Kiệt đường Núi Thành"                     → "Núi Thành"
//   "Hẻm 58 Lương Định Của"                    → "Lương Định Của"
//   "39 Đường Ngô Mây"                         → "Ngô Mây"
// Không thấy chữ đường/kiệt/hẻm/ngõ → trả rỗng (không đoán).
export function tachTenDuong(diaChi?: string | null): string {
  const s = (diaChi ?? "").trim();
  if (!s) return "";
  const m =
    s.match(/(?:^|[\s,])đường\s+([^,]+)/i) ??
    s.match(/(?:^|[\s,])(?:kiệt|hẻm|ngõ)\s+(?:\d+[\s/]*)*([^,\d][^,]*)/i);
  if (!m) return "";
  // Giữ nguyên tên đường có số ("Đường 2/4", "Đường số 5").
  const ten = m[1].replace(/\s+/g, " ").trim();
  if (ten.length < 2) return "";
  return ten.charAt(0).toUpperCase() + ten.slice(1);
}
