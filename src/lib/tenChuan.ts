import { provincesNew } from "@/lib/provincesNew";
import { normalizeVi } from "@/lib/filters";

// ============================================================================
// BẢNG TÊN CHUẨN khi nạp dữ liệu (kế hoạch tự động hoá D2, 15/10/2026)
// Viết khác một chữ là sinh trang trùng (vd 6 cách ghi "Sun Group" → 3 trang chủ đầu tư).
// ============================================================================

// Cách ghi khác (đã bỏ dấu, viết thường) → tên chuẩn. Chủ dự án chọn tên chuẩn rồi thêm vào đây.
// (Nhóm Sun Group: chờ chủ dự án chọn — docs/DANH-SACH-BO-SUNG-SUA-DOI.md B3.)
export const TEN_CHU_DAU_TU_CHUAN: Record<string, string> = {};

export function chuDauTuChuan(ten: string): string {
  const t = ten.trim().replace(/\s+/g, " ");
  return TEN_CHU_DAU_TU_CHUAN[normalizeVi(t)] ?? t;
}

// Tỉnh/thành + phường/xã phải đúng HỆ MỚI (34 tỉnh) — trả lỗi để màn hình nạp báo đúng dòng.
export function loiDiaDanh(tinh: string, phuong?: string): string | null {
  const p = provincesNew.find((x) => normalizeVi(x.name) === normalizeVi(tinh));
  if (!p) return `tỉnh "${tinh}" không thuộc hệ mới (34 tỉnh/thành)`;
  if (phuong && !p.wards.some((w) => normalizeVi(w) === normalizeVi(phuong)))
    return `"${phuong}" không phải phường/xã hệ mới của ${p.name} (ghi đủ chữ "Phường"/"Xã")`;
  return null;
}
