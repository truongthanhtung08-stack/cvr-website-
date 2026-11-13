// ============================================================================
// CHỜ DUYỆT — MỘT NGUỒN cho mọi chỗ trong Admin (anh chốt 14/11/2026)
//   · Chờ duyệt TIN KHÁCH = tin khách đã bấm gửi duyệt (status "pending"). Chỉ chỗ này mới là "Chờ duyệt"
//     của mục Tin đăng, số đỏ menu Tin đăng, ô Chờ duyệt Tổng quan.
//   · Tin ĐĂNG HỘ / nạp file chờ duyệt (ẩn + details.choChuDuyet) — CẤM vào chỗ của khách; chỉ ở trang
//     Tin chờ duyệt (/admin/tin-dang/duyet-nap), số đỏ ở mục "Đăng nhiều tin (file)".
//   · Tin NHÁP khách soạn dở (chưa gửi) không thuộc Admin — để nguyên trong tài khoản khách. Admin chỉ giữ
//     nháp do Admin soạn (tài khoản Admin hoặc tài khoản tạo hộ).
// Bỏ cách gộp 29/10/2026 (commit 0c886475) đưa tin nạp file vào Chờ duyệt của khách.
// ============================================================================

type TinXet = { status?: string | null; owner_id?: string | null; details?: unknown };
type ChuTin = { id: string; role?: string | null; tao_ho?: boolean | null };

/** Bộ lọc PostgREST: tin khách gửi chờ duyệt. */
export const LOC_CHO_DUYET_KHACH = { cot: "status", gia: "pending" } as const;

export const laChoDuyetKhach = (r: TinXet) => r.status === "pending";

export const laTinDangHoChoDuyet = (r: TinXet) =>
  r.status === "hidden" && !!(r.details as { choChuDuyet?: boolean } | null)?.choChuDuyet;

/** Chủ tin có phải Admin soạn (Admin / tài khoản tạo hộ) không — nháp của các tài khoản này mới hiện trong Admin. */
export const laChuAdminSoan = (h?: ChuTin | null) => !!h && (h.role === "admin" || !!h.tao_ho);

/** Tin hiện trong danh sách Tin đăng của Admin: bỏ tin đăng hộ chờ duyệt (ở trang riêng) và nháp khách tự soạn. */
export function hienTrongTinDangAdmin(r: TinXet, chuAdminSoan: Set<string>): boolean {
  if (laTinDangHoChoDuyet(r)) return false;
  if (r.status === "draft") return !r.owner_id || chuAdminSoan.has(r.owner_id);
  return true;
}
