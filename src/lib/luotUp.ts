// ============================================================================
// GÓI UP NHIỀU LƯỢT — LƯỢT GẮN VỚI KỲ HIỂN THỊ CỦA TIN (chuẩn Batdongsan, chủ dự án
// chốt 01/10/2026, thay cho chốt 17/09 "lượt không hết hạn"):
//   · Mua tối đa bằng số lượt CÒN ĐẨY ĐƯỢC trong kỳ hiển thị (mỗi ngày tối đa LUOT_MOI_NGAY lượt — anh 12/11/2026: 2 lần/ngày, theo
//     lịch hàng ngày / cuối tuần) — không bán lượt mà tin không kịp dùng.
//   · Tin hết hạn thì lượt còn lại hết theo tin (hetHanTin đặt bump_credits = 0).
// ============================================================================

const NGAY_MS = 86_400_000;
// Ngày theo giờ Việt Nam (GMT+7), dạng số ngày kể từ 1970 — so sánh cho gọn.
const ngayVn = (t: number) => Math.floor((t + 7 * 3_600_000) / NGAY_MS);

// Mỗi tin đẩy tối đa bao nhiêu lần mỗi ngày — khớp hàm CSDL day_tin / day_tin_bang_luot (0073)
export const LUOT_MOI_NGAY = 2;

/** Số lượt còn đẩy được từ hôm nay tới hết kỳ hiển thị (khách tự đẩy lúc nào tuỳ ý, tối đa LUOT_MOI_NGAY lần/ngày). */
export function soNgayConDay(hetHan: string | null, lich: string | null | undefined, soLanHomNay: number): number {
  if (!hetHan) return 0;
  const het = new Date(hetHan).getTime();
  if (het <= Date.now()) return 0;
  let dem = 0;
  for (let d = ngayVn(Date.now()); d <= ngayVn(het); d++) {
    const homNay = d === ngayVn(Date.now());
    // 1/1/1970 là Thứ Năm → (d + 4) % 7: 0 = Chủ nhật, 6 = Thứ Bảy.
    const thu = (d + 4) % 7;
    if (lich === "cuoi_tuan" && thu !== 0 && thu !== 6) continue;
    dem += homNay ? Math.max(0, LUOT_MOI_NGAY - soLanHomNay) : LUOT_MOI_NGAY;
  }
  return dem;
}
