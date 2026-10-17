import type { Listing } from "@/lib/data";
import { tatCaTrang, tieuDe, cha, NGUONG_INDEX } from "@/lib/pseo";

// ============================================================================
// GỢI Ý CỤM TỪ KHOÁ DÀI (chủ dự án 17/10/2026: "gợi ý theo ý muốn của người dùng! 1 từ khóa dài!")
// ----------------------------------------------------------------------------
// Như Google gợi ý cả câu: "Bán căn hộ Đà Nẵng dưới 3 tỷ", "Cho thuê phòng trọ Huế"… — KHÔNG liệt kê
// vị trí trần. Mỗi cụm là đúng một trang sạch đang có tin thật (bộ trang pSEO tatCaTrang: ≥ NGUONG_INDEX
// tin, trang được index hoặc trang tỉnh gốc), chữ của cụm là tiêu đề trang → bấm là về đúng trang đó.
// Tính ở máy chủ khi dựng trang chủ (cùng bộ tin, không thêm lần gọi nào); máy khách chỉ nhận chữ + link
// (lọc theo chữ gõ ở TimTrangChu). Chỉ chạy ở máy chủ — đừng import hàm này vào component máy khách.
// ============================================================================

// loai: cụm có loại hình (cụ thể) — lúc chưa gõ chỉ hiện loại này
export type CauGoiY = { nhan: string; sub: string; href: string; muc: "ban" | "thue"; loai: boolean };

export function goiYTrangChu(tin: Listing[]): CauGoiY[] {
  return [...tatCaTrang(tin).values()]
    .filter((p) => !p.dk.huong && p.n >= NGUONG_INDEX && (p.index || !cha(p.dk)))
    .sort((a, b) => b.n - a.n)
    .map((p) => ({ nhan: tieuDe(p.dk), sub: `${p.n} tin`, href: p.path, muc: p.dk.muc, loai: !!p.dk.cat }));
}

// ĐẾM TIN cho nút "Xem N tin" của hàng trường lọc (chủ dự án 17/10/2026): chỉ những trường applyFilters cần,
// gửi một lần trong trang chủ đã dựng sẵn — đếm ngay ở trình duyệt, không gọi máy chủ khi khách chọn lọc.
export type TinDem = {
  id: string; title: string; price: string; area: string; beds?: number; location: string; diaChiTim?: string;
  type: string; purpose: "ban" | "thue"; huong?: string; phapLy?: string; noiThat?: string;
};

export function tinDem(tin: Listing[]): TinDem[] {
  return tin.map((l) => ({
    id: l.id, title: "", price: l.price, area: l.area, beds: l.beds, location: l.location, diaChiTim: l.diaChiTim,
    type: l.type, purpose: l.purpose === "thue" ? "thue" : "ban", huong: l.huong, phapLy: l.phapLy, noiThat: l.noiThat,
  }));
}
