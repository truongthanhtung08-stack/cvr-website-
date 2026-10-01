// ============================================================================
// GÓI UP NHIỀU LƯỢT — LƯỢT GẮN VỚI KỲ HIỂN THỊ CỦA TIN (chuẩn Batdongsan, chủ dự án
// chốt 01/10/2026, thay cho chốt 17/09 "lượt không hết hạn"):
//   · Mua tối đa bằng số ngày CÒN ĐẨY ĐƯỢC trong kỳ hiển thị (mỗi ngày 1 lượt, theo
//     lịch hàng ngày / cuối tuần) — không bán lượt mà tin không kịp dùng.
//   · Tin hết hạn thì lượt còn lại hết theo tin (hetHanTin đặt bump_credits = 0).
// ============================================================================

const NGAY_MS = 86_400_000;
// Ngày theo giờ Việt Nam (GMT+7), dạng số ngày kể từ 1970 — so sánh cho gọn.
const ngayVn = (t: number) => Math.floor((t + 7 * 3_600_000) / NGAY_MS);

/** Số lượt còn đẩy được từ hôm nay tới hết kỳ hiển thị. */
export function soNgayConDay(hetHan: string | null, lich: string | null | undefined, daDayHomNay: boolean): number {
  if (!hetHan) return 0;
  const het = new Date(hetHan).getTime();
  if (het <= Date.now()) return 0;
  let dem = 0;
  for (let d = ngayVn(Date.now()); d <= ngayVn(het); d++) {
    if (d === ngayVn(Date.now()) && daDayHomNay) continue;
    // 1/1/1970 là Thứ Năm → (d + 4) % 7: 0 = Chủ nhật, 6 = Thứ Bảy.
    const thu = (d + 4) % 7;
    if (lich === "cuoi_tuan" && thu !== 0 && thu !== 6) continue;
    dem++;
  }
  return dem;
}
