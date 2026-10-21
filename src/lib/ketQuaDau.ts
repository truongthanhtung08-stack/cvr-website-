import { getListings, getListingsHetHan } from "@/lib/listingsDb";
import { goiNheTin } from "@/lib/goiNhe";
import { locDanhSach, boLocKhoiDau, type KetQuaLoc } from "@/lib/locDanhSach";
import { emptyFilters, type Filters } from "@/lib/filters";

// ============================================================================
// TRANG 1 DỰNG SẴN Ở MÁY CHỦ (SEO + tốc độ, 21/10/2026)
// ----------------------------------------------------------------------------
// Trước đây trang danh sách chỉ có khung chờ + danh sách tin ẨN (sr-only) cho Google; khách phải chờ trình duyệt gọi
// /api/danh-sach/<muc>/loc mới thấy tin (LCP /mua-ban 10 giây trên điện thoại). Giờ máy chủ chạy đúng hàm lọc của API cho
// bộ lọc mặc định của trang, trang 1 → HTML có sẵn 10 tin thật khách nhìn thấy, Google đọc đúng thứ khách thấy.
// Chi phí: trang vẫn tĩnh, dựng lại theo bộ nhớ đệm "listings" (1 giờ + xoá khi tin đổi thật) — không thêm lượt gọi
// hàm khi khách xem, không thêm truy vấn Supabase (dùng chung bản đệm getListings).
// ============================================================================

/** Gói kết quả lọc đúng dạng API /api/danh-sach/<muc>/loc trả về (không kèm danh sách đầy đủ `ketQua`). */
export function goiKetQua(kq: KetQuaLoc): KetQuaLoc {
  return {
    trang: goiNheTin(kq.trang),
    tong: kq.tong,
    soTrang: kq.soTrang,
    trangHienTai: kq.trangHienTai,
    tangDau: kq.tangDau,
    boiDam: kq.boiDam,
    tangTheoId: kq.tangTheoId,
    khuVuc: kq.khuVuc,
    tinhHieu: kq.tinhHieu,
    khoangRe: kq.khoangRe,
    thongBao: kq.thongBao,
  };
}

/** Kết quả trang 1 cho bộ lọc mặc định của trang — cùng cách API lọc (cùng nguồn tin, cùng hàm).
 *  `macDinh` phải trùng các prop initialTypes / initialProvince / initialFilters truyền cho ListingBrowser. */
export async function ketQuaTrangDau(
  muc: "ban" | "thue",
  macDinh: { initialTypes?: string[]; initialProvince?: string; initialFilters?: Partial<Filters> } = {},
): Promise<KetQuaLoc> {
  const [tatCa, hetHan] = await Promise.all([getListings(), getListingsHetHan()]);
  const tin = tatCa.filter((l) => ((l.purpose ?? "ban") === "thue" ? "thue" : "ban") === muc);
  return goiKetQua(locDanhSach(tin, hetHan, muc, boLocKhoiDau(emptyFilters(), macDinh), "moi", 1));
}
