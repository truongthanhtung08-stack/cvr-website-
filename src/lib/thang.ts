// "tháng 10/2026" theo giờ Việt Nam — đuôi tiêu đề + H1 trang danh sách (chủ dự án 15/10/2026:
// "Nhà đất bán Đà Nẵng tháng 10/2026"). Trang danh sách cache 1 giờ nên sang tháng là tự đổi,
// không cần lịch chạy nào.
export function thangHienTai(d = new Date()): string {
  const p = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Ho_Chi_Minh", month: "numeric", year: "numeric" }).formatToParts(d);
  return `tháng ${p.find((x) => x.type === "month")?.value}/${p.find((x) => x.type === "year")?.value}`;
}

// 00:00 ngày 1 tháng hiện tại theo giờ Việt Nam. Trang danh sách mang "tháng MM/YYYY" trong tiêu đề + H1 → sang tháng là
// nội dung ĐỔI THẬT; sitemap phải khai ngày này làm lastmod, không thì Google giữ tiêu đề tháng cũ cả tháng (đo 08/11/2026:
// Google đọc /cho-thue/can-ho-chung-cu/da-nang/gia-duoi-20-trieu lần cuối 29/10, Google Search vẫn hiện "tháng 10/2026").
export function dauThang(d = new Date()): Date {
  const p = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Ho_Chi_Minh", month: "numeric", year: "numeric" }).formatToParts(d);
  const thang = Number(p.find((x) => x.type === "month")?.value);
  const nam = Number(p.find((x) => x.type === "year")?.value);
  return new Date(Date.UTC(nam, thang - 1, 1) - 7 * 3600 * 1000);
}

// Bỏ đuôi tháng khi cần ghép tiêu đề vào câu khác ("… theo khu vực")
export const boDuoiThang = (s: string) => s.replace(/\s+tháng \d{1,2}\/\d{4}$/, "");

// Tiêu đề Google: nếu cộng đuôi " | COASTAL LAND" (layout) mà vượt 65 ký tự thì bỏ đuôi thương hiệu,
// giữ trọn cụm từ khoá — Google cắt tiêu đề dài, phần bị cắt là phần từ khoá ở cuối.
// Bản thân tiêu đề vẫn dài hơn 65 ký tự → đuôi "tháng 10/2026" viết gọn "T10/2026" như batdongsan, nhadat24h (D47, chủ dự án
// duyệt 31/10/2026: "tháng 10/2026" là chuẩn, chỉ tiêu đề quá dài mới gọn); vẫn dài → bỏ hẳn cụm tháng; cuối cùng mới cắt tại
// ranh giới từ (không để chữ "tháng" treo). H1 trên trang giữ nguyên.
export const tieuDeGoogle = (t: string): string | { absolute: string } => {
  if (`${t} | COASTAL LAND`.length <= 65) return t;
  if (t.length <= 65) return { absolute: t };
  const gon = t.replace(/ tháng (\d{1,2})\/(\d{4})$/, " T$1/$2");
  if (gon.length <= 65) return { absolute: gon };
  t = t.replace(/ tháng \d{1,2}\/\d{4}$/, "");
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
