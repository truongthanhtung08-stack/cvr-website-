// "tháng 10/2026" theo giờ Việt Nam — đuôi tiêu đề + H1 trang danh sách (chủ dự án 15/10/2026:
// "Nhà đất bán Đà Nẵng tháng 10/2026"). Trang danh sách cache 1 giờ nên sang tháng là tự đổi,
// không cần lịch chạy nào.
export function thangHienTai(d = new Date()): string {
  const p = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Ho_Chi_Minh", month: "numeric", year: "numeric" }).formatToParts(d);
  return `tháng ${p.find((x) => x.type === "month")?.value}/${p.find((x) => x.type === "year")?.value}`;
}

// Bỏ đuôi tháng khi cần ghép tiêu đề vào câu khác ("… theo khu vực")
export const boDuoiThang = (s: string) => s.replace(/\s+tháng \d{1,2}\/\d{4}$/, "");

// Tiêu đề Google: nếu cộng đuôi " | COASTAL LAND" (layout) mà vượt 65 ký tự thì bỏ đuôi thương hiệu,
// giữ trọn cụm từ khoá — Google cắt tiêu đề dài, phần bị cắt là phần từ khoá ở cuối.
// Bản thân tiêu đề vẫn dài hơn 65 ký tự (bài viết dài) → cắt tại ranh giới từ cho thẻ <title>; H1 trên trang giữ nguyên.
export const tieuDeGoogle = (t: string): string | { absolute: string } => {
  if (`${t} | COASTAL LAND`.length <= 65) return t;
  if (t.length <= 65) return { absolute: t };
  const cat = t.slice(0, 65);
  return { absolute: cat.slice(0, cat.lastIndexOf(" ")).replace(/[\s,.;:—–-]+$/, "") };
};

// Mô tả Google dài quá 155 ký tự → cắt tại ranh giới từ (không viết câu mới, chỉ cắt bớt).
export const catMoTa = (s: string, toiDa = 155): string => {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= toiDa) return t;
  const cat = t.slice(0, toiDa - 1);
  return `${cat.slice(0, cat.lastIndexOf(" ")).replace(/[\s,.;:—-]+$/, "")}…`;
};
