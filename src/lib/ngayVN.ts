// Ngày theo GIỜ VIỆT NAM (YYYY-MM-DD) — khớp cột `ngay` của các bảng đếm lượt
// xem / hiển thị / người xem (0038 ghi theo giờ VN). Dùng toISOString() là ra
// ngày UTC: từ 0h tới 7h sáng, lượt xem bị tính sang hôm trước.
export function ngayVN(luc: Date | string = new Date()): string {
  return new Date(luc).toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
}

// "N ngày gần nhất, tính cả hôm nay" → ngày bắt đầu. soNgay=7 → hôm nay lùi 6.
export function tuNgayVN(soNgay: number): string {
  return ngayVN(new Date(Date.now() - (soNgay - 1) * 86_400_000));
}
