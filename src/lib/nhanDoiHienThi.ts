import type { Listing } from "@/lib/data";

// ============================================================================
// NHÂN ĐÔI HIỂN THỊ — quyền lợi của CVR Diamond (quy định chung, chốt 01/10/2026)
// "Khi tạo tin, khách hàng được tặng kèm một tin CVR Basic hiển thị đồng thời ở trang
// kết quả tìm kiếm; khi Đẩy tin CVR Diamond, tin CVR Basic đi kèm cũng được đẩy."
// Làm bằng BẢN KÈM ẢO (không tạo thêm tin trong CSDL): mỗi tin Diamond CÒN HẠN hiện
// thêm một lần dạng thẻ CVR Basic, đặt NGAY SAU tin gốc trong danh sách đã xếp theo
// thời gian → sau khi xếp theo hạng, bản kèm nằm đúng vị trí thời gian trong nhóm Basic.
// Cùng một tin nên đẩy tin gốc = đẩy luôn bản kèm, sửa / hết hạn cùng lúc.
// CHỈ dùng ở trang kết quả tìm kiếm (Mua bán, Cho thuê, Tìm kiếm). Số đếm, bản đồ,
// thống kê khu vực phải bỏ bản kèm (lọc banSao) — không được cộng đôi.
// ============================================================================
export function nhanDoiHienThi(ds: Listing[]): Listing[] {
  const ra: Listing[] = [];
  for (const l of ds) {
    ra.push(l);
    if (l.badge === "VIP") ra.push({ ...l, badge: undefined, banSao: true });
  }
  return ra;
}

/** Khoá React riêng cho bản kèm (cùng id với tin gốc). */
export const khoaThe = (l: Listing) => (l.banSao ? `${l.id}-kem` : l.id);
