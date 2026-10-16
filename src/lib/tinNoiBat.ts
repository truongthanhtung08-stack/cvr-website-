import type { Listing } from "@/lib/data";
import { tierRank } from "@/lib/packages";

// ── Tab nhanh khối "tin nổi bật" trang chủ: MỤC ĐÍCH (bán/thuê) × LOẠI SẢN PHẨM ──
// Tách khỏi FeaturedListings (16/10/2026) để MÁY CHỦ chọn trước đúng số tin khối này hiện,
// thay vì gửi toàn bộ kho tin vào HTML trang chủ (632KB).
const isBan = (l: Listing) => (l.purpose ?? "ban") === "ban";
export type TypeTab = { label: string; match: (l: Listing) => boolean };
export const typeTabs: TypeTab[] = [
  { label: "Tất cả",        match: () => true },
  { label: "Bán đất",       match: (l) => isBan(l) && l.type.includes("Đất") },
  { label: "Bán nhà riêng", match: (l) => isBan(l) && (l.type.includes("Nhà") || l.type.includes("Villa") || l.type.includes("Biệt thự") || l.type.includes("Shophouse")) },
  { label: "Bán căn hộ",    match: (l) => isBan(l) && (l.type.includes("Căn hộ") || l.type.includes("Condotel")) },
  { label: "Cho thuê",      match: (l) => (l.purpose ?? "ban") === "thue" },
];

// Mỗi tab hiện tối đa 20 tin: máy tính 2 slide × 8, điện thoại 2 lần × 10; nhiều hơn là "Xem thêm"
// (mở danh sách đầy đủ, nạp từ /api/danh-sach). Giữ nguyên cách xếp: theo cấp tin, cùng cấp giữ thứ tự gốc.
export const TOI_DA_MOI_TAB = 20;

export function chonTinTrangChu(ds: Listing[]): Listing[] {
  const giu = new Set<string>();
  for (const t of typeTabs) {
    ds.filter((l) => t.match(l))
      .map((l, i) => ({ l, i }))
      .sort((a, b) => tierRank(a.l.badge) - tierRank(b.l.badge) || a.i - b.i)
      .slice(0, TOI_DA_MOI_TAB + 1) // +1 để khối biết còn tin → hiện nút "Xem thêm"
      .forEach(({ l }) => giu.add(l.id));
  }
  return ds.filter((l) => giu.has(l.id));
}
