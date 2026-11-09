import { provincesNew } from "@/lib/diaDanhNguon";
import { normalizeVi } from "@/lib/filters";

// TÊN PHƯỜNG/XÃ CHUẨN theo danh mục hệ mới (provincesNew). Tin nạp hàng loạt có thể ghi sai dấu ("Phường Thanh Khe") → trang tin,
// breadcrumb, trang pSEO hiện tên lệch với trang phường (đo 09/11/2026: /mua-ban/can-ho-chung-cu/da-nang/phuong-thanh-khe có 2 tên).
// Khớp không dấu trong ĐÚNG tỉnh, chỉ thay khi có đúng một phường trùng; không có / chưa nạp địa danh (trình duyệt) → giữ nguyên chữ.
let bang: Map<string, string> | null = null;
let soTinh = 0;
export function tenPhuongChuan(tinh: string, phuong: string): string {
  if (!tinh || !phuong) return phuong;
  if (!bang || soTinh !== provincesNew.length) {
    bang = new Map();
    soTinh = provincesNew.length;
    for (const p of provincesNew) for (const w of p.wards) {
      const k = `${normalizeVi(p.name)}|${normalizeVi(w)}`;
      bang.set(k, bang.has(k) ? "" : w); // "" = trùng không dấu, không đoán
    }
  }
  return bang.get(`${normalizeVi(tinh)}|${normalizeVi(phuong)}`) || phuong;
}
