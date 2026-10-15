// "tháng 10/2026" theo giờ Việt Nam — đuôi tiêu đề + H1 trang danh sách (chủ dự án 15/10/2026:
// "Nhà đất bán Đà Nẵng tháng 10/2026"). Trang danh sách cache 1 giờ nên sang tháng là tự đổi,
// không cần lịch chạy nào.
export function thangHienTai(d = new Date()): string {
  const p = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Ho_Chi_Minh", month: "numeric", year: "numeric" }).formatToParts(d);
  return `tháng ${p.find((x) => x.type === "month")?.value}/${p.find((x) => x.type === "year")?.value}`;
}

// Bỏ đuôi tháng khi cần ghép tiêu đề vào câu khác ("… theo khu vực")
export const boDuoiThang = (s: string) => s.replace(/\s+tháng \d{1,2}\/\d{4}$/, "");
