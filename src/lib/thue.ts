// ════════════════════════════════════════════════════════════════════════════
// THUẾ GTGT — MỘT CHỖ TÍNH DUY NHẤT CHO CẢ WEB
//
// Mọi nơi cần tách "tiền hàng / tiền thuế" đều gọi hàm ở đây, KHÔNG tự nhân 0.08
// rải rác trong code. Đổi thuế suất thì sửa đúng một dòng.
//
// Nguồn số liệu (tra ngày 24/08/2026):
//   · Thuế suất 8% — Nghị quyết 204/2025/QH15, áp dụng 01/7/2025 → hết 31/12/2026.
//     👉 TỪ 01/01/2027 QUAY LẠI 10% nếu Quốc hội không gia hạn — nhớ sửa dòng dưới.
//   · Giá niêm yết CHƯA gồm VAT — chủ dự án chốt 24/08/2026. Khách trả giá + 8%.
// ════════════════════════════════════════════════════════════════════════════

/** Thuế suất GTGT hiện hành. Hết 2026 phải xem lại (xem ghi chú đầu file). */
export const THUE_SUAT_GTGT = 0.08;

/**
 * Giá hiển thị trên web đã bao gồm VAT chưa?
 * false = giá niêm yết là tiền hàng, khách trả thêm 8% (đang chọn).
 * true  = giá niêm yết là số khách trả, VAT nằm trong đó.
 */
export const GIA_DA_GOM_VAT = false;

export type TachThue = {
  /** Doanh thu chưa thuế — ĐÂY là số đưa vào tờ khai GTGT và tính thuế TNDN. */
  tienHang: number;
  /** Thuế GTGT đầu ra — thu hộ nhà nước, KHÔNG phải doanh thu. */
  tienThue: number;
  /** Số tiền khách thực trả (trừ ví đúng số này). */
  tongTra: number;
  /** Thuế suất đã áp, lưu kèm giao dịch để sau này đối chiếu khi thuế suất đổi. */
  thueSuat: number;
};

/**
 * Tách một khoản tiền thành tiền hàng + thuế GTGT.
 *
 * @param gia Giá lấy từ `quotePrice().total` (đã trừ khuyến mãi và ưu đãi cấp).
 *
 * Ví dụ giá chưa gồm VAT, gói 980.000đ:
 *   tienHang 980.000 · tienThue 78.400 · tongTra 1.058.400
 */
export function tachThue(gia: number, thueSuat: number = THUE_SUAT_GTGT): TachThue {
  const g = Math.max(0, Math.round(gia));

  if (GIA_DA_GOM_VAT) {
    // Giá đã gồm thuế: bóc ngược ra. Lấy tienThue = tongTra - tienHang để tổng
    // luôn khớp tuyệt đối, không lệch 1đ do làm tròn hai lần.
    const tienHang = Math.round(g / (1 + thueSuat));
    return { tienHang, tienThue: g - tienHang, tongTra: g, thueSuat };
  }

  const tienThue = Math.round(g * thueSuat);
  return { tienHang: g, tienThue, tongTra: g + tienThue, thueSuat };
}

/**
 * Kỳ khai thuế theo QUÝ của một mốc thời gian — dùng để gom số liệu cuối quý.
 * Trả về dạng { nam: 2026, quy: 3, nhan: "Quý 3/2026" }.
 */
export function kyThue(d: Date | string): { nam: number; quy: number; nhan: string } {
  const t = typeof d === "string" ? new Date(d) : d;
  const nam = t.getFullYear();
  const quy = Math.floor(t.getMonth() / 3) + 1;
  return { nam, quy, nhan: `Quý ${quy}/${nam}` };
}

/** Mốc đầu và cuối một quý (dùng để lọc giao dịch khi lập báo cáo). */
export function khoangQuy(nam: number, quy: number): { tu: Date; den: Date } {
  const thangDau = (quy - 1) * 3;
  return {
    tu: new Date(nam, thangDau, 1, 0, 0, 0, 0),
    den: new Date(nam, thangDau + 3, 0, 23, 59, 59, 999),
  };
}
