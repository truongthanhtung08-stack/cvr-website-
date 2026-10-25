// LUẬT KIỂM TIN DÙNG CHUNG — một chỗ cho cả ba khâu: lọc tin (nạp hàng loạt `csvTin.ts`), kiểm đợt
// (`scripts/kiem-noi-dung-dot.mjs`) và cảnh báo trong admin (`BangKiemTinSeo.tsx`). Quy định: docs/CHUAN-TIN-DANG-SEO.md mục 5b.
// Chủ dự án 25/10/2026: khách không ghi thì không phải lỗi, không báo — chỉ báo khi khách CÓ ghi mà ô còn trống.

import { fieldsFor } from "./listingSpec";

// Mô tả có ghi hướng: "hướng" đi kèm tên hướng (Đông, Tây, Nam, Bắc…)
export const coGhiHuong = (s: string) => /hướng\s*(nhà|cửa|ban công|đất|chính)?\s*[:\-]?\s*(đông|tây|nam|bắc)/i.test(s);

// Tên đường khách ghi làm ĐỊA CHỈ trong mô tả: "đường / kiệt / hẻm / ngõ" + tên viết hoa chữ đầu (vd "kiệt 109 Minh Mạng"
// → "Minh Mạng"). Bỏ đường chỉ để tả vị trí lân cận ("gần đường…", "cách đường…") và số đo ("đường 5,5m", "đường 28" thì giữ
// khi ô địa chỉ trống) — đo 25/10 trên 174 tin: luật cũ báo nhầm 27 tin vì "mặt đường 30m", "gần đường Võ Chí Công".
export const duongTrongMoTa = (s: string) => {
  // Chữ viết hoa chữ đầu (tên riêng) — dải À-Ỹ của Unicode có cả chữ thường nên phải so thật
  const hoa = (w: string) => w.charAt(0) !== w.charAt(0).toLowerCase();
  for (const m of s.matchAll(/(đường|kiệt|hẻm|ngõ)[ \t]+(?:\d+\/?\d*[ \t]+)?(\p{L}+(?:[ \t]\p{L}+){0,3})/gu)) {
    const truoc = s.slice(Math.max(0, (m.index ?? 0) - 14), m.index).toLowerCase();
    if (/(gần|cách|giáp|thông|sát|ra|tới|đến|và|với|ngay|cạnh|đối diện)\s*(\d+\s*)?$/.test(truoc)) continue;
    // Lấy các chữ viết hoa liền nhau ở đầu: "Trưng Nữ Vương, phường…" → "Trưng Nữ Vương"; "ô tô 3 m" → bỏ
    const ten = [];
    for (const w of m[2].split(/[ \t]/)) { if (!hoa(w)) break; ten.push(w); }
    if (ten.length) return ten.join(" ");
  }
  return null;
};

// Mô tả có tên đường (làm địa chỉ) mà ô địa chỉ CHƯA có đường nào — ô địa chỉ đã có đường / kiệt / hẻm / ngõ thì thôi
export const thieuTenDuong = (moTa: string, diaChi: string) => {
  if (/(đường|kiệt|hẻm|ngõ)/i.test(diaChi)) return false;
  const ten = duongTrongMoTa(moTa);
  return !!ten && !diaChi.toLowerCase().includes(ten.toLowerCase());
};

// GIÁ TRONG CHỮ PHẢI KHỚP Ô GIÁ (chuẩn N8) — chuyển từ máy kiểm đợt sang đây để admin dùng chung (25/10/2026).
// Bỏ số không phải giá tổng: đơn giá ("120 triệu/m²"), tiền giảm / cọc / phí / hoa hồng / thu nhập (đo 19/10).
// "tr" phải là chữ đứng riêng — "287 Trần Hưng Đạo" không phải 287 triệu.
const so = (s: string) => Number(String(s).replace(/\./g, "").replace(",", "."));
const boNgu = (t: string) => t
  .replace(/(\d+(?:[.,]\d+)?)\s*(tỷ|ty|triệu|tr)(?![\p{L}\d])\s*\/\s*(m²|m2)/giu, " ")
  .replace(/(giảm|bớt|cọc|đặt cọc|phí|quản lý|điện|nước|hoa hồng|thu nhập|doanh thu|lợi nhuận|chiết khấu|hỗ trợ|vay|trả trước|thanh toán trước)[^.\n]{0,25}?\d+(?:[.,]\d+)?\s*(tỷ|ty|triệu|tr)(?![\p{L}\d])/giu, " ");
const giaTrongChu = (t: string) => [
  ...[...boNgu(t).matchAll(/(\d+(?:[.,]\d+)?)\s*(tỷ|ty)(?![\p{L}\d])/giu)].map((m) => so(m[1]) * 1e9),
  ...[...boNgu(t).matchAll(/(\d+(?:[.,]\d+)?)\s*(triệu|tr)(?![\p{L}\d])/giu)].map((m) => so(m[1]) * 1e6),
];
const docGia = (v: number) => (v >= 1e9 ? `${v / 1e9} tỷ` : `${v / 1e6} triệu`);

// Trả câu báo lỗi khi giá ghi trong tiêu đề / mô tả lệch HẲN ô giá (gấp hoặc kém 10 lần trở lên — gõ sai đơn vị, thừa / thiếu
// số 0, vd gõ 14000000 vào ô tính theo triệu thành 14.000 tỷ). Lệch nhỏ không báo: mô tả hay ghi giá trả trước, giá các căn
// khác của dự án, "4 tỷ 600" — đo 25/10 trên 174 tin, luật "khớp từng con số" báo nhầm 17/18 tin.
export function giaLechChu(tieuDe: string, moTa: string, gia: number, mucDich?: string): string | null {
  const chu = giaTrongChu(`${tieuDe} ${moTa}`).filter((v) => v >= 1e8 || mucDich === "thue");
  if (!gia || !chu.length) return null;
  const gan = Math.min(...chu.map((v) => Math.max(v / gia, gia / v)));
  if (gan < 10) return null;
  return `giá trong chữ (${[...new Set(chu)].map(docGia).join(", ")}) khác hẳn ô giá (${docGia(gia)})`;
}

// ── DANH SÁCH LỖI CHUẨN SEO CỦA MỘT TIN — MỘT HÀM cho mọi khâu (chủ dự án 25/10/2026) ──────────────────────
// Bảng kiểm admin hiện đúng danh sách này; nút Duyệt (máy chủ /api/tin-dang/duyet + form đăng tin) KHOÁ khi còn lỗi;
// trang Tổng quan admin liệt kê mọi tin còn lỗi. Chưa sửa hết thì không cho lên web. Chỉ báo lỗi THẬT: khách không
// ghi thì không phải lỗi (hướng, tên đường); tiêu đề giữ nguyên văn khách (không xét chữ hoa, độ dài).
export type TinKiem = {
  title?: string | null;
  description?: string | null;
  purpose?: string | null;
  type?: string | null;
  price_vnd?: number | null;
  area_m2?: number | null;
  beds?: number | null;
  images?: string[] | null;
  details?: Record<string, unknown> | null;
};
// ma = khoá cố định của loại lỗi — admin đã thấy, kiểm và vẫn bấm Duyệt thì lưu ma vào details.seoChapNhan, tin đó KHÔNG báo
// lại lỗi ấy nữa (chủ dự án 25/10/2026); phát sinh lỗi loại khác thì vẫn báo.
export type LoiTin = { ma: string; ten: string; cho: string; o: string };

const laVideo = (s: string) => /youtu|\.mp4|\.mov|\.webm/i.test(s);

export function loiTinSeo(r: TinKiem, soTinTrung = 0): LoiTin[] {
  const d = (r.details ?? {}) as { addressDetail?: string; direction?: string; specs?: { balcony?: string }; giaTuGhi?: string; seoChapNhan?: string[] };
  const moTa = (r.description ?? "").trim();
  const anh = (r.images ?? []).filter((s) => !laVideo(s)).length;
  const loi: LoiTin[] = [];
  if (anh < 3) loi.push({ ma: "anh", ten: `Ảnh thật ≥ 3 (đang có ${anh})`, cho: "phần Ảnh tin đăng", o: "o-anh" });
  if (moTa.length < 100) loi.push({ ma: "mota", ten: `Mô tả ≥ 100 ký tự (đang có ${moTa.length})`, cho: "phần Nội dung · ô Mô tả", o: "o-mota" });
  if (soTinTrung > 0) loi.push({ ma: "trung", ten: "Trùng tin khác (cùng người · loại · giá · diện tích)", cho: "xem tin trùng ghi bên dưới", o: "" });
  // Giá để trống = "Thỏa thuận" — chuẩn cho phép (N3), không phải lỗi; diện tích thì bắt buộc
  if (r.area_m2 == null) loi.push({ ma: "dientich", ten: "Thiếu diện tích", cho: "phần Giá & thông số", o: "o-giathongso" });
  const lechGia = giaLechChu(r.title ?? "", moTa, Number(r.price_vnd) || 0, r.purpose ?? undefined);
  if (lechGia) loi.push({ ma: "gia", ten: lechGia.charAt(0).toUpperCase() + lechGia.slice(1), cho: "phần Giá & thông số · ô Giá", o: "o-gia" });
  if (thieuTenDuong(moTa, d.addressDetail ?? ""))
    loi.push({ ma: "duong", ten: "Mô tả có tên đường mà ô địa chỉ chưa có", cho: "phần Vị trí · ô Địa chỉ cụ thể", o: "o-diachi" });
  // Hướng nhà và Hướng ban công XÉT RIÊNG — mỗi ô trống là một lỗi, cảnh báo ghi đúng tên ô, bấm nhảy đúng ô (25/10/2026:
  // dn20-2410 "Cửa chính hướng Nam, ban công hướng Bắc" có Hướng nhà mà trống Hướng ban công, luật cũ xét gộp nên bỏ sót)
  const HUONG = "(đông|tây|nam|bắc)(\\s*(đông|tây|nam|bắc))?";
  const reBanCong = new RegExp(`(ban công\\s*hướng|hướng\\s*ban công)\\s*[:\\-]?\\s*${HUONG}`, "gi");
  const coOBanCong = fieldsFor(r.type ?? "", r.purpose ?? undefined).some((f) => f.key === "balcony");
  if (coOBanCong && new RegExp(reBanCong.source, "i").test(moTa) && !d.specs?.balcony)
    loi.push({ ma: "huongbancong", ten: "Mô tả có ghi hướng ban công mà ô Hướng ban công còn trống", cho: "phần Đặc điểm bất động sản · ô Hướng ban công", o: "o-balcony" });
  if (coGhiHuong(coOBanCong ? moTa.replace(reBanCong, "") : moTa) && !d.direction)
    loi.push({ ma: "huong", ten: "Mô tả có ghi hướng mà ô Hướng nhà / đất còn trống", cho: "phần Đặc điểm bất động sản · ô Hướng nhà / đất", o: "o-huong" });
  const daChapNhan = d.seoChapNhan ?? [];
  return loi.filter((x) => !daChapNhan.includes(x.ma));
}
