// LỊCH SỬ TÌM KIẾM — MỘT LUẬT CHO MỌI Ô TÌM (trang chủ, Mua bán, Cho thuê, Dự án — anh 07/11/2026: "cái gì đã sửa thì đừng để lặp lại"):
// lưu và hiện CÂU ĐÃ SỬA ĐÚNG ("đất nền hòa xuân", không "dat nen nen hoa xuân"), câu cùng ý chỉ một dòng.
import { normalizeVi } from "@/lib/filters";
import { suaChinhTa } from "@/lib/smartSearch";

/** Câu đã sửa đúng để lưu / hiện */
export const cauLuu = (cau: string) => (suaChinhTa(cau.trim()) ?? cau.trim()).replace(/\s+/g, " ");
/** Khoá "cùng ý" — hai câu cùng khoá là một dòng */
export const yCau = (cau: string) => normalizeVi(cauLuu(cau)).replace(/[^a-z0-9]+/g, " ").trim();

/** Danh sách lịch sử (có thể lưu từ trước khi sửa) → câu đã sửa, bỏ dòng trùng ý, giữ thứ tự mới nhất trước */
export function lichSuGon<T extends { label: string; keyword?: string }>(ds: T[]): T[] {
  const thay = new Set<string>();
  const ra: T[] = [];
  for (const r of ds) {
    const l = cauLuu(r.label);
    const k = yCau(l);
    if (!k || thay.has(k)) continue;
    thay.add(k);
    ra.push({ ...r, label: l, ...(r.keyword ? { keyword: l } : {}) });
  }
  return ra;
}
