import type { Listing } from "@/lib/data";
import { sortListings, type Filters, type SortKey } from "@/lib/filters";
import { smartFilter, smartSearch } from "@/lib/smartSearch";
import { nhanDoiHienThi } from "@/lib/nhanDoiHienThi";
import { parseLatLng } from "@/lib/googleMaps";
import { coordOf } from "@/lib/geo";
import type { DiemBanDo } from "@/components/MapViewGoogle";

// ============================================================================
// LỌC DANH SÁCH TIN — MỘT hàm cho cả máy chủ lẫn trình duyệt (#1b kế hoạch SEO, 17/10/2026)
// ----------------------------------------------------------------------------
// Trước đây trình duyệt tải TOÀN BỘ tin (124 tin = 451 KB; 10.000 tin ≈ 30 MB) rồi mới lọc.
// Giờ trang lớn gọi /api/danh-sach/<muc>/loc: máy chủ chạy đúng hàm này, chỉ gửi 10 tin của
// trang đang xem. Trang nhỏ (tin tương tự trong trang tin…) vẫn lọc ngay ở trình duyệt bằng
// chính hàm này — hai nơi một cách xếp, không lệch nhau.
// ============================================================================

export const PER_PAGE = 10; // 10 tin/trang (chủ dự án chốt 10/9/2026)

export type KetQuaLoc = {
  trang: Listing[];
  tong: number;
  soTrang: number;
  trangHienTai: number;
  /** Tầng khớp của tin đầu trang (1 = khớp đủ) — để hiện nhãn tầng */
  tangDau: 1 | 2 | 3;
  /** Chữ cần bôi đậm theo id tin (chỉ tin trong trang) */
  boiDam: Record<string, string[]>;
  /** Số tin theo tỉnh/thành (cột phải "theo khu vực") */
  khuVuc: [string, number][];
};

export function locDanhSach(
  items: Listing[],
  hetHan: Listing[],
  purpose: "ban" | "thue",
  filters: Filters,
  sort: SortKey,
  page: number,
): KetQuaLoc & { ketQua: Listing[] } {
  // Nguồn theo đúng MỤC ĐÍCH + NHÂN ĐÔI HIỂN THỊ của CVR Diamond (nhanDoiHienThi.ts)
  const base = nhanDoiHienThi(items.filter((l) => (l.purpose ?? "ban") === purpose));
  // NỚI LỎNG THÔNG MINH: tin khớp đủ lên đầu (Tầng 1), thiếu tiêu chí phụ xuống Tầng 2/3
  const hits = smartFilter(base, { ...filters, keyword: "" });
  const coTuKhoa = filters.keyword.trim().length > 0;
  const search = smartSearch(hits.map((h) => h.item), filters.keyword);

  // Tin hết hạn: cùng mục đích + khớp ĐỦ bộ lọc (Tầng 1) và từ khoá — không nới lỏng.
  const gocHetHan = hetHan.filter((l) => (l.purpose ?? "ban") === purpose);
  let ketQuaHetHan: Listing[] = [];
  if (gocHetHan.length) {
    const khop = smartFilter(gocHetHan, { ...filters, keyword: "" }).filter((h) => h.tier === 1).map((h) => h.item);
    ketQuaHetHan = coTuKhoa
      ? smartSearch(khop, filters.keyword).hits.filter((h) => h.tier === 1).map((h) => h.item)
      : sortListings(khop, sort);
  }

  // Sắp xếp RIÊNG từng tầng: tin khớp đủ luôn đứng trước tin gần đúng (17/10/2026 — trước đây sắp
  // chung nên tin VIP ở tỉnh khác nhảy lên trên tin khớp đúng của trang "Căn hộ Nha Trang").
  const ketQua = [
    ...(coTuKhoa ? search.hits.map((h) => h.item) : ([1, 2, 3] as const).flatMap((t) => sortListings(hits.filter((h) => h.tier === t).map((h) => h.item), sort))),
    ...ketQuaHetHan,
  ];
  const tierById = new Map(hits.map((h) => [h.item.id, h.tier]));
  const termsById = new Map(search.hits.map((h) => [h.item.id, h.matched]));

  const m = new Map<string, number>();
  for (const l of base) {
    if (l.banSao) continue; // bản kèm không phải tin riêng — không đếm
    const p = l.location.split(",").pop()?.trim() ?? "";
    if (p) m.set(p, (m.get(p) ?? 0) + 1);
  }

  const soTrang = Math.max(1, Math.ceil(ketQua.length / PER_PAGE));
  const trangHienTai = Math.min(Math.max(1, page), soTrang);
  const trang = ketQua.slice((trangHienTai - 1) * PER_PAGE, trangHienTai * PER_PAGE);
  const boiDam: Record<string, string[]> = {};
  for (const l of trang) { const t = termsById.get(l.id); if (t?.length) boiDam[l.id] = t; }
  return {
    ketQua,
    trang,
    tong: ketQua.length,
    soTrang,
    trangHienTai,
    tangDau: trang[0] ? tierById.get(trang[0].id) ?? 1 : 1,
    boiDam,
    khuVuc: [...m.entries()].sort((a, b) => b[1] - a[1]),
  };
}

/** Điểm bản đồ của một tin — dùng chung cho bản đồ danh sách (MapViewMo) và máy chủ. */
export function diemTuTin(it: Listing): DiemBanDo {
  const ghim = it.mapPin ? parseLatLng(it.mapPin) : null;
  const [lat, lng] = ghim ? [ghim.lat, ghim.lng] : coordOf(it.location, it.id);
  return {
    id: it.id,
    lat,
    lng,
    chinhXac: !!ghim,
    nhan: it.price,
    title: it.title,
    phu: `${it.price} · ${it.area}`,
    loc: it.location,
    image: it.image,
    href: `/bat-dong-san/${it.id}`,
  };
}
