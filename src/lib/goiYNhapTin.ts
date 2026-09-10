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

// ─── TIÊU ĐỀ ────────────────────────────────────────────────────────────────
// Mẫu viết theo đúng cách người mua tìm: loại hình + diện tích/số phòng + điểm
// mạnh + khu vực — cũng chính là cấu trúc tiêu đề tốt cho SEO.
const TIEU_DE_BAN: [RegExp, string][] = [
  [/condotel/i, "VD: Bán condotel 45 m² view biển, bàn giao full nội thất, cam kết lợi nhuận"],
  [/căn hộ|chung cư/i, "VD: Bán căn hộ 2PN 68 m² view sông Hàn, full nội thất"],
  [/shophouse|nhà phố thương mại/i, "VD: Bán shophouse 5x20m mặt tiền đường 10,5m, kinh doanh sẵn"],
  [/biệt thự|villa/i, "VD: Bán biệt thự biển 300 m² 4PN, hồ bơi riêng, sổ hồng lâu dài"],
  [/nhà riêng|nhà mặt phố|liền kề/i, "VD: Bán nhà 3 tầng 90 m² kiệt ô tô Hải Châu, sổ hồng riêng"],
  [/đất nông nghiệp/i, "VD: Bán 2.000 m² đất nông nghiệp mặt tiền đường bê tông, gần khu dân cư"],
  [/đất công nghiệp/i, "VD: Bán 5.000 m² đất công nghiệp thuê 50 năm, mặt tiền QL1A"],
  [/nhà xưởng|kho/i, "VD: Bán nhà xưởng 1.200 m² trong KCN Hoà Khánh, điện 3 pha, PCCC đầy đủ"],
  [/đất nền|đất/i, "VD: Bán đất nền 100 m² mặt tiền 5m, đường 7,5m Hoà Xuân, sổ đỏ"],
];

const TIEU_DE_THUE: [RegExp, string][] = [
  [/căn hộ dịch vụ/i, "VD: Cho thuê căn hộ dịch vụ 40 m² full nội thất, gần biển Mỹ Khê"],
  [/căn hộ|chung cư/i, "VD: Cho thuê căn hộ 2PN 70 m² full nội thất, gần biển Mỹ Khê"],
  [/trọ/i, "VD: Cho thuê phòng trọ 25 m² có gác, wc riêng, gần Đại học Duy Tân"],
  [/văn phòng/i, "VD: Cho thuê văn phòng 120 m² sàn thông, mặt tiền Nguyễn Văn Linh"],
  [/mặt bằng|cửa hàng/i, "VD: Cho thuê mặt bằng 80 m² mặt tiền 6m, vỉa hè rộng, kinh doanh mọi ngành"],
  [/nhà xưởng|kho bãi|thuê đất/i, "VD: Cho thuê kho xưởng 1.200 m² container vào tận nơi, PCCC đầy đủ"],
  [/biệt thự|villa|liền kề/i, "VD: Cho thuê biệt thự 4PN sân vườn, hồ bơi, khu Nam Việt Á"],
  [/nhà riêng|nhà mặt phố|nhà phố/i, "VD: Cho thuê nhà 3 tầng 4PN mặt tiền Nguyễn Văn Linh, có chỗ đậu ô tô"],
];

export function goiYTieuDe(type: string, laThue: boolean): string {
  const bang = laThue ? TIEU_DE_THUE : TIEU_DE_BAN;
  for (const [re, mau] of bang) if (re.test(type)) return mau;
  return laThue
    ? "VD: Cho thuê nhà 3 tầng 4PN mặt tiền Nguyễn Văn Linh, có chỗ đậu ô tô"
    : "VD: Bán nhà 3 tầng 90 m² kiệt ô tô Hải Châu, sổ hồng riêng";
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
