import { applyFilters, matchType, type FilterableListing, type Filters } from "@/lib/filters";

// ============================================================================
// BỘ LỌC MUA BÁN · CHO THUÊ — MỘT GỐC đếm theo loại hình cho máy chủ (/api/danh-sach/<muc>/loc), trang danh sách và tab Mua bán /
// Cho thuê của bộ lọc tổng trang chủ (chủ dự án 01/11/2026: thu hẹp hai chiều cha ↔ con, gom về bộ lọc tổng).
// Số tin của từng LOẠI tính theo mọi trường đã chọn TRỪ loại hình. Toàn quốc luôn đủ tỉnh thành (chọn nơi chưa có tin thì danh sách ra
// gợi ý tương tự).
// ============================================================================

/** Bảng [loại hình của tin, số tin] theo mọi trường đã chọn trừ loại hình */
export function soTheoLoai(tin: FilterableListing[], f: Filters): [string, number][] {
  const m = new Map<string, number>();
  for (const l of applyFilters(tin, { ...f, keyword: "", types: [] })) if (l.type) m.set(l.type, (m.get(l.type) ?? 0) + 1);
  return [...m.entries()];
}

/** Số tin của một lựa chọn trong bảng Loại hình (một lựa chọn gồm nhiều cách ghi loại hình — matchType) */
export const demLoaiTu = (bang: [string, number][], loai: string) => bang.reduce((s, [t, so]) => (matchType(t, loai) ? s + so : s), 0);

/** Khách đã chọn trường nào KHÁC loại hình chưa — chưa thì bảng Loại hình để đủ */
export const coTruongKhacLoai = (f: Filters) =>
  f.locations.length > 0 || !!f.project || f.priceMin != null || f.priceMax != null || f.areaMin != null || f.areaMax != null ||
  !!f.beds || !!f.direction || !!f.legal || !!f.furnishing || f.verified || f.broker || !!f.dacDiem?.length;
