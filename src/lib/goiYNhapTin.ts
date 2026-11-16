// ============================================================================
// GỢI Ý NHẬP TIN — BÁM ĐÚNG LOẠI HÌNH ĐANG CHỌN
//
// Trước đây form đăng tin dùng MỘT bộ gợi ý cho mọi loại hình: chọn "Cho thuê
// kho bãi" mà ô Tiêu đề vẫn gợi ý "Bán căn hộ 2PN view sông Hàn", ô Giá gợi ý
// "VD: 12" (triệu/tháng) còn ô Diện tích gợi ý "VD: 100". Người đăng nhìn gợi ý
// sai chủ đề thì hoặc gõ bừa theo, hoặc nhập sai đơn vị — kho xưởng bị nhập
// thành 35 triệu/tháng trong khi thực tế là 35.000 đ/m²/tháng.
//
// Gom hết gợi ý về một chỗ để form chỉ việc gọi, và sửa một lần là mọi nơi theo.
// KHÔNG tự đổi dữ liệu khách đã nhập — chỉ gợi ý.
// ============================================================================

// Kho bãi · nhà xưởng · văn phòng · mặt bằng: nhóm báo giá theo m², không báo
// tổng tiền tháng. Đây là nhóm hay bị nhập sai đơn vị nhất.
export function laKhoXuongVanPhong(type: string): boolean {
  return /nhà xưởng|kho bãi|kho \/|văn phòng|mặt bằng|cửa hàng/i.test(type);
}

// Đơn vị giá NÊN dùng cho loại hình này (chỉ để gợi ý, không tự áp).
export function donViGiaNenDung(type: string, laThue: boolean): string | null {
  if (!laThue) return null;
  return laKhoXuongVanPhong(type) ? "nghìn/m²/tháng" : null;
}

// ─── GIÁ ────────────────────────────────────────────────────────────────────
// Gợi ý theo ĐƠN VỊ đang chọn — con số phải hợp lý với đơn vị đó, nếu không
// người đăng gõ theo gợi ý là sai cả trăm lần (35 triệu/m²/tháng thay vì 35 nghìn).
export function goiYGia(donVi: string): string {
  switch (donVi) {
    case "tỷ": return "VD: 4,2";
    case "triệu": return "VD: 850";
    case "triệu/m²": return "VD: 45";
    case "triệu/tháng": return "VD: 12";
    case "nghìn/m²/tháng": return "VD: 35  (= 35.000 đ/m²/tháng)";
    case "triệu/6 tháng": return "VD: 60";
    case "triệu/năm": return "VD: 120";
    default: return "VD: 12";
  }
}

// ─── DIỆN TÍCH ──────────────────────────────────────────────────────────────
// Kho xưởng thường tính bằng nghìn m², phòng trọ vài chục m² — gợi ý "VD: 100"
// cho cả hai làm người đăng tưởng nhập sai.
export function goiYDienTich(type: string): string {
  if (/nhà xưởng|kho bãi|kho \/|đất công nghiệp|thuê đất/i.test(type)) return "VD: 1200";
  if (/đất nông nghiệp/i.test(type)) return "VD: 2000";
  if (/trọ/i.test(type)) return "VD: 25";
  if (/văn phòng|mặt bằng|cửa hàng/i.test(type)) return "VD: 120";
  if (/căn hộ dịch vụ|condotel/i.test(type)) return "VD: 45";
  if (/căn hộ|chung cư/i.test(type)) return "VD: 68";
  if (/biệt thự|villa/i.test(type)) return "VD: 300";
  return "VD: 100";
}

