import { normalizeVi, cungDuAn } from "@/lib/filters";
import { cachGoiDuAn } from "@/lib/duAnTen";

// ============================================================================
// TIN GHI DỰ ÁN NÀO → KHỚP HỒ SƠ DỰ ÁN ĐÃ CÓ (anh 31/10/2026, D32: "sửa từ gốc")
// Tin mang mã dự án không có hồ sơ / sai hồ sơ thì không hiện ở trang dự án đúng. Khi nạp tin: tên dự án tin ghi phải khớp
// MỘT hồ sơ cùng tỉnh → lưu đúng mã + tên hồ sơ; không khớp hoặc khớp nhiều hồ sơ → báo đỏ, KHÔNG tự đặt mã mới.
// Khớp = cungDuAn (mã/tên lệch chút ít, src/lib/filters.ts) HOẶC tên lõi của bên này nằm trọn trong tên bên kia
// ("Đà Nẵng Golden Bay" ↔ "Căn hộ 5 sao Goldenbay Sơn Trà" chung lõi "goldenbay"). Tên dự án = tên + khu vực (luật 64):
// chỉ so hồ sơ cùng tỉnh với tin — "Mường Thanh" ở Đà Nẵng không nhận nhầm Mường Thanh Nha Trang.
// ============================================================================

export type HoSoDuAn = { slug: string; name: string; province: string | null };
export type KetQuaKhop = { hoSo: HoSoDuAn } | { loi: string };

const gon = (s: string) => normalizeVi(s).replace(/[^a-z0-9]/g, "");
const gonTinh = (s: string) => gon(normalizeVi(s).replace(/^(tinh|thanh pho|tp\.?)\s+/, ""));
// Tên lõi đủ đặc trưng (≥ 6 ký tự, bỏ khoảng trắng) — "cora" quá ngắn, dễ trùng chữ khác. Lõi chỉ là ĐỊA DANH thì bỏ:
// "Đà Nẵng Plaza" bỏ đuôi còn "danang" — chữ đó có trong tên mọi dự án Đà Nẵng (đo 31/10: khớp nhầm 13 hồ sơ).
const DIA_DANH = /^(danang|hue|thuathienhue|nhatrang|quynhon|sontra|nguhanhson|hoian|phanthiet|muine|binhdinh|khanhhoa|camranh|quangnam|quangtri|quangngai|quangbinh|donghoi|gialai|lamdong|dalat|binhthuan|hanoi|hochiminh|saigon)$/;
const loi = (ten: string) => cachGoiDuAn(ten).map(gon).filter((c) => c.length >= 6 && !DIA_DANH.test(c));

export function khopHoSoDuAn(ten: string, ma: string, tinh: string | null | undefined, hoSo: HoSoDuAn[]): KetQuaKhop {
  const t = tinh ? gonTinh(tinh) : "";
  const cungTinh = hoSo.filter((h) => !t || !h.province || gonTinh(h.province) === t);
  const tenGon = gon(ten);
  const loiTen = loi(ten);
  const khop = cungTinh.filter((h) =>
    cungDuAn(h.slug, ma) || cungDuAn(h.name, ten) ||
    loi(h.name).some((c) => tenGon.includes(c)) || loiTen.some((c) => gon(h.name).includes(c)));
  // Trùng hẳn mã thắng mọi cách khớp khác
  const dungMa = khop.find((h) => h.slug === ma);
  if (dungMa) return { hoSo: dungMa };
  if (khop.length === 1) return { hoSo: khop[0] };
  if (khop.length > 1) return { loi: `tên dự án "${ten}" khớp nhiều hồ sơ: ${khop.map((h) => h.name).join(", ")}` };
  return { loi: `chưa có hồ sơ dự án: ${ten}` };
}
