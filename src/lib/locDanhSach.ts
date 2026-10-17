import type { Listing } from "@/lib/data";
import { sortListings, applyFilters, emptyFilters, normalizeVi, typeGroupsFor, type Filters, type SortKey } from "@/lib/filters";
import { smartFilter, smartSearch, goiYNoiLong } from "@/lib/smartSearch";
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

export const PER_PAGE = 10;
const TOI_DA_GOI_Y = 12; // số tin gợi ý tối đa khi ít tin khớp đủ // 10 tin/trang (chủ dự án chốt 10/9/2026)

export type KetQuaLoc = {
  trang: Listing[];
  tong: number;
  soTrang: number;
  trangHienTai: number;
  /** Tầng khớp của tin đầu trang (1 = khớp đủ) — để hiện nhãn tầng */
  tangDau: 1 | 2 | 3;
  /** Tầng khớp của từng tin trong trang — để chèn dòng phân cách trước tin "gần đúng" */
  tangTheoId: Record<string, 1 | 2 | 3>;
  /** Chữ cần bôi đậm theo id tin (chỉ tin trong trang) */
  boiDam: Record<string, string[]>;
  /** Số tin theo tỉnh/thành (cột phải "theo khu vực") */
  khuVuc: [string, number][];
  /** Tỉnh máy hiểu được (từ bộ lọc hoặc từ câu khách gõ) — để đặt dòng "Gợi ý khác tại …" */
  tinhHieu: string[];
};

// CÂU GÕ MÁY HIỂU ĐƯỢC → BỘ LỌC (chủ dự án 17/10/2026: "đất giá rẻ dưới 3 tỷ tại Hòa Xuân" phải ra đất Hòa Xuân
// trước, rồi giá, rồi khu vực Đà Nẵng — không phải xếp theo số chữ trùng). Bóc được nơi / loại nhà / giá thì lọc
// đúng như khách chọn trường lọc; "đất" trần = cả nhóm Đất (đất nền, đất thổ cư…).
export function cauThanhBoLoc(f: Filters, purpose: "ban" | "thue"): Filters | null {
  const kw = f.keyword.trim();
  if (!kw) return null;
  const pt = goiYNoiLong(kw)[0]?.patch;
  if (!pt || (!pt.locations?.length && !pt.types?.length && pt.priceMax == null && pt.priceMin == null)) return null;
  let types = f.types;
  if (pt.types?.length) {
    // Nhãn của bộ tách câu ("Đất nền") khác chữ loại nhà trên tin ("Đất nền / Đất nền dự án") → so theo NHÓM
    const nhan = normalizeVi(pt.types[0]);
    const nq = normalizeVi(kw);
    const nhom = typeGroupsFor(purpose).filter((g) => g.label !== "Khác");
    const g = nhom.find((x) => normalizeVi(x.label) === nhan || x.items.some((t) => normalizeVi(t).includes(nhan)))
      ?? nhom.find((x) => nhan.startsWith(normalizeVi(x.label)));
    const chiTiet = g?.items.filter((t) => normalizeVi(t).includes(nhan)) ?? [];
    // Gõ đúng chữ chi tiết ("đất nền") → đúng loại đó; gõ trần ("đất") → cả nhóm
    types = g ? (nq.includes(nhan) && chiTiet.length ? chiTiet : g.items) : pt.types;
  }
  return {
    ...f,
    types: f.types.length ? f.types : types,
    locations: f.locations.length ? f.locations : pt.locations?.length ? pt.locations : f.locations,
    priceMin: f.priceMin != null || f.priceMax != null ? f.priceMin : pt.priceMin ?? null,
    priceMax: f.priceMin != null || f.priceMax != null ? f.priceMax : pt.priceMax ?? null,
    beds: f.beds || pt.beds || 0,
    keyword: "",
  };
}

export function locDanhSach(
  items: Listing[],
  hetHan: Listing[],
  purpose: "ban" | "thue",
  filters: Filters,
  sort: SortKey,
  page: number,
): KetQuaLoc & { ketQua: Listing[] } {
  // Câu có "giá rẻ" → trong cùng nhóm, tin rẻ đứng trước (cùng quy ước với trang sạch ?sapxep=gia-tang)
  if (sort === "moi" && / gia re /.test(` ${normalizeVi(filters.keyword)} `)) sort = "gia-tang";
  filters = cauThanhBoLoc(filters, purpose) ?? filters;
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
  // GỢI Ý THÔNG MINH (chủ dự án 17/10/2026: "gợi ý phải dựa trên nhu cầu người search, chính xác"):
  // khớp đủ đứng trước, đủ bao nhiêu hiện bấy nhiêu. Gợi ý xếp theo NHU CẦU CHÍNH là loại hình:
  // ① đúng loại hình + đúng tỉnh (chỉ nới giá/chi tiết) → ② đúng loại hình, địa phương khác →
  // ③ loại hình khác, đúng tỉnh → ④ còn lại. Tối đa TOI_DA_GOI_Y tin gợi ý.
  const khopDu = sortListings(hits.filter((h) => h.tier === 1).map((h) => h.item), sort);
  const tinhChon = new Set(filters.locations.map((x) => x.province));
  // THỨ TỰ ƯU TIÊN (chủ dự án 17/10/2026): đúng LOẠI NHÀ là nền → đúng PHƯỜNG/QUẬN → đúng GIÁ → đúng TỈNH
  // → tỉnh khác. VD đất Hòa Xuân > đất Đà Nẵng dưới 3 tỷ > đất Đà Nẵng khác > đất tỉnh khác > nhà Hòa Xuân.
  const sauChon = filters.locations.filter((x) => x.district || x.ward);
  const coGia = filters.priceMin != null || filters.priceMax != null;
  const diemGoiY = (l: Listing) => {
    const dungLoai = filters.types.length === 0 || filters.types.includes(l.type);
    const dungTinh = tinhChon.size === 0 || tinhChon.has(l.location.split(",").pop()?.trim() ?? "");
    const dungSau = sauChon.length > 0 && applyFilters([l], { ...emptyFilters(), locations: sauChon }).length > 0;
    const dungGia = !coGia || applyFilters([l], { ...emptyFilters(), priceMin: filters.priceMin, priceMax: filters.priceMax }).length > 0;
    return (dungLoai ? 128 : 0) + (dungSau ? 64 : 0) + (dungTinh ? 48 : 0) + (dungGia ? 32 : 0);
  };
  const tam = tinhChon.size === 1 ? coordOf([...tinhChon][0], "") : null;
  const khoangCach = (l: Listing) => {
    if (!tam) return 0;
    const [a, b] = coordOf(l.location.split(",").pop()?.trim() ?? "", "");
    return (a - tam[0]) ** 2 + (b - tam[1]) ** 2;
  };
  const goiY = sortListings(hits.filter((h) => h.tier > 1).map((h) => h.item), sort)
    .map((l, i) => ({ l, i, d: diemGoiY(l), xa: khoangCach(l) }))
    // cùng mức khớp: nơi GẦN tỉnh khách chọn đứng trước (Quảng Trị → Huế, Đà Nẵng trước Khánh Hòa)
    .sort((a, b) => b.d - a.d || a.xa - b.xa || a.i - b.i)
    .slice(0, TOI_DA_GOI_Y)
    .map((x) => x.l);
  const ketQua = [
    ...(coTuKhoa ? search.hits.map((h) => h.item) : [...khopDu, ...goiY]),
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
  const tangTheoId: Record<string, 1 | 2 | 3> = {};
  for (const l of trang) tangTheoId[l.id] = tierById.get(l.id) ?? 1;
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
    tangTheoId,
    khuVuc: [...m.entries()].sort((a, b) => b[1] - a[1]),
    tinhHieu: [...tinhChon],
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
