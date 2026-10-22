// ============================================================================
// ĐỊA CHỈ ĐƯA BẢN ĐỒ + TOẠ ĐỘ ĐÃ TRA SẴN (chủ dự án 23/10/2026: "chỉnh cả hệ thống theo địa chỉ hiển thị đã thống nhất")
//
// Một tin = MỘT chuỗi địa chỉ = MỘT chỗ đặt dấu đỏ, ở trang tin lẫn bản đồ nhiều tin (Mua bán / Cho thuê / Dự án → Bản đồ).
// Trang tin tự tra khi mở (timToaDo). Bản đồ nhiều tin không tra nổi hàng trăm địa chỉ một lúc (OpenStreetMap tối đa
// 1 lượt/giây) → cron /api/tin-dang/toa-do tra SẴN mỗi tin một lần bằng CÙNG hàm timToaDo, lưu ở site_content key
// "toa_do" (bảng công khai, chỉ máy chủ ghi). Tệp nhỏ, không kéo thư viện nào — bản đồ nhiều tin đọc thẳng.
// ============================================================================

/** Chuỗi địa chỉ đưa bản đồ của một tin: số nhà – tên đường khách ghi, phường, quận (hệ cũ), tỉnh. */
export const chuoiDiaChiBanDo = (...phan: (string | null | undefined)[]) =>
  phan.map((x) => x?.trim()).filter(Boolean).join(", ");

/** Dấu vân tay ngắn của chuỗi địa chỉ (FNV-1a) — toạ độ đã lưu chỉ dùng khi địa chỉ chưa đổi kể từ lúc tra. */
export function vanTayDiaChi(q: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < q.length; i++) h = Math.imul(h ^ q.charCodeAt(i), 0x01000193) >>> 0;
  return h.toString(36);
}

/** site_content "toa_do": ds["tin:<id>" | "du-an:<slug>"] = [lat, lng, mức độ, vân tay địa chỉ]. */
export type ToaDoLuu = { ds: Record<string, [number, number, "ghim" | "duong" | "khuVuc", string]>; luc?: string };
export const KHOA_TOA_DO = "toa_do";
