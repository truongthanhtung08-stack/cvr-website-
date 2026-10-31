// Câu gõ → các trường lọc. Tách khỏi TruongLocTrangChu để FilterBar (trang kết quả) dùng chung mà không
// nạp chéo hai component (FilterBar ↔ TruongLocTrangChu) — nạp chéo làm trang chủ không chạy được.
import { typeGroupsFor, normalizeVi, emptyFilters, type Filters } from "@/lib/filters";
import { parseQuery } from "@/lib/smartSearch";

// Nhãn loại hình của bộ tách câu → loại hình của bộ lọc (cùng nguồn typeGroupsFor)
function loaiTuNhan(nhan: string, nq: string, mb: "ban" | "thue"): string[] {
  const nhom = typeGroupsFor(mb).filter((g) => g.label !== "Khác");
  const n = normalizeVi(nhan);
  // "đất" trần → cả nhóm Đất; "đất nền" mới là loại chi tiết
  if (n === "dat nen" && !nq.includes("dat nen")) return nhom.find((g) => g.label === "Đất")?.items ?? [];
  // "chung cư" và "căn hộ" là một nhu cầu → cả nhóm Căn hộ
  if (n === "chung cu" || n === "can ho") return nhom.find((g) => g.label === "Căn hộ, chung cư")?.items ?? [];
  const g = nhom.find((x) => normalizeVi(x.label) === n);
  if (g) return g.items;
  const khop = nhom.flatMap((x) => x.items).filter((t) => normalizeVi(t).includes(n));
  if (khop.length) return khop;
  const dau = n.split(" ")[0];
  return nhom.flatMap((x) => x.items).filter((t) => normalizeVi(t).split(/[^a-z0-9]+/).includes(dau));
}

/** Câu gõ → các trường lọc (khu vực · loại hình · giá · phòng ngủ) — phần còn lại để ô tìm xử lý */
export function locTuCau(cau: string, mb: "ban" | "thue"): Filters {
  const f = emptyFilters();
  if (!cau.trim()) return f;
  const p = parseQuery(cau);
  const nq = ` ${normalizeVi(cau).replace(/[^a-z0-9]+/g, " ")} `;
  const pl = p.place;
  if (pl) f.locations = [{ province: pl.province, district: pl.district, ward: pl.ward }];
  else if (p.places[0]) f.locations = [{ province: p.places[0] }];
  if (p.types.length) f.types = [...new Set(p.types.flatMap((t) => loaiTuNhan(t, nq, mb)))];
  else if (/ nha /.test(nq) && !/ nha dat /.test(nq)) f.types = typeGroupsFor(mb).find((g) => g.label === "Nhà")?.items ?? [];
  f.priceMin = p.priceMinTy;
  f.priceMax = p.priceMaxTy;
  if (p.beds) f.beds = Math.min(5, p.beds);
  return f;
}
