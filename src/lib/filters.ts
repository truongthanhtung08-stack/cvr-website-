// Tuỳ chọn bộ lọc dùng chung cho Hero, trang danh sách & tìm kiếm.
// 👉 Thêm/bớt loại hình hoặc mức giá tại đây — toàn bộ bộ lọc tự cập nhật.

// ═══════════════════════════════════════════════════════════════════════════
// LOẠI HÌNH (sản phẩm) PHÂN THEO MỤC ĐÍCH — chuẩn Brief + Kế hoạch V3.
// Mọi tin do thành viên (người bán/môi giới) đăng, phân theo MỤC ĐÍCH:
//   • "ban"  = Mua bán  → danh mục saleTypeGroups
//   • "thue" = Cho thuê → danh mục rentTypeGroups (có Văn phòng, Mặt bằng,
//              Phòng trọ, Căn hộ dịch vụ… — KHÔNG có ở mua bán)
// ═══════════════════════════════════════════════════════════════════════════
type TypeGroup = { label: string; items: string[] };

// MUA BÁN
export const saleTypeGroups: TypeGroup[] = [
  { label: "Nhà ở", items: ["Căn hộ chung cư", "Nhà riêng", "Nhà mặt phố", "Nhà biệt thự / Liền kề", "Shophouse / Nhà phố thương mại"] },
  { label: "Đất", items: ["Đất nền / Đất nền dự án", "Đất nông nghiệp"] },
  { label: "Du lịch / Nghỉ dưỡng", items: ["Villa / Biệt thự biển", "Condotel"] },
  { label: "Công nghiệp", items: ["Đất công nghiệp", "Kho / Nhà xưởng"] },
  { label: "Khác", items: ["Bất động sản khác"] },
];

// CHO THUÊ (11 danh mục — Kế hoạch V3)
export const rentTypeGroups: TypeGroup[] = [
  { label: "Nhà ở", items: ["Căn hộ chung cư", "Căn hộ dịch vụ", "Nhà riêng", "Nhà mặt phố", "Nhà phố thương mại", "Biệt thự / Liền kề", "Nhà trọ / Phòng trọ"] },
  { label: "Thương mại & văn phòng", items: ["Văn phòng", "Mặt bằng / Cửa hàng bán lẻ"] },
  { label: "Đất & công nghiệp", items: ["Thuê đất / Nhà xưởng / Kho bãi"] },
  { label: "Khác", items: ["Bất động sản khác"] },
];

// Chọn bộ danh mục theo mục đích (dùng cho FilterBar trên từng trang)
export function typeGroupsFor(purpose: "ban" | "thue"): TypeGroup[] {
  return purpose === "thue" ? rentTypeGroups : saleTypeGroups;
}

// Mặc định = mua bán (giữ tương thích nơi chưa truyền purpose)
export const propertyTypeGroups: TypeGroup[] = saleTypeGroups;

// Danh sách phẳng (gộp cả 2 mục đích, không trùng) — cho autocomplete loại hình
export const propertyTypeOptions: string[] = [
  ...new Set([...saleTypeGroups, ...rentTypeGroups].flatMap((g) => g.items)),
];

// Mức giá — bounds tính theo TỶ đồng (max = null nghĩa là không giới hạn trên)
export type PriceRange = { label: string; min: number; max: number | null };

export const priceRanges: PriceRange[] = [
  { label: "Dưới 500 triệu", min: 0, max: 0.5 },
  { label: "500 - 800 triệu", min: 0.5, max: 0.8 },
  { label: "800 triệu - 1 tỷ", min: 0.8, max: 1 },
  { label: "1 - 2 tỷ", min: 1, max: 2 },
  { label: "2 - 3 tỷ", min: 2, max: 3 },
  { label: "3 - 5 tỷ", min: 3, max: 5 },
  { label: "5 - 7 tỷ", min: 5, max: 7 },
  { label: "7 - 10 tỷ", min: 7, max: 10 },
  { label: "10 - 20 tỷ", min: 10, max: 20 },
  { label: "20 - 30 tỷ", min: 20, max: 30 },
  { label: "Trên 30 tỷ", min: 30, max: null },
];

export const priceRangeLabels: string[] = priceRanges.map((r) => r.label);

// Mức giá CHO THUÊ — tính theo TRIỆU/THÁNG (bounds quy về đơn vị tỷ để dùng chung
// priceToTy: "18 triệu/tháng" → 0.018). Dùng cho sidebar trang /cho-thue.
export const rentPriceRanges: PriceRange[] = [
  { label: "Dưới 3 triệu", min: 0, max: 0.003 },
  { label: "3 - 5 triệu", min: 0.003, max: 0.005 },
  { label: "5 - 10 triệu", min: 0.005, max: 0.01 },
  { label: "10 - 20 triệu", min: 0.01, max: 0.02 },
  { label: "20 - 40 triệu", min: 0.02, max: 0.04 },
  { label: "40 - 70 triệu", min: 0.04, max: 0.07 },
  { label: "70 - 100 triệu", min: 0.07, max: 0.1 },
  { label: "Trên 100 triệu", min: 0.1, max: null },
];

// Chọn bộ mức giá theo mục đích (mua bán = tỷ · cho thuê = triệu/tháng)
export function priceRangesFor(purpose: "ban" | "thue"): PriceRange[] {
  return purpose === "thue" ? rentPriceRanges : priceRanges;
}

// Đổi chuỗi giá "28,5 tỷ" → số tỷ. "Thỏa thuận" → null
export function priceToTy(price: string): number | null {
  const m = price.replace(",", ".").match(/[\d.]+/);
  if (!m) return null;
  const n = parseFloat(m[0]);
  return price.includes("triệu") ? n / 1000 : n;
}

export function priceInRange(ty: number | null, label: string): boolean {
  if (ty === null) return false;
  const r = priceRanges.find((x) => x.label === label);
  if (!r) return true;
  return ty >= r.min && (r.max === null || ty < r.max);
}

// ===== Diện tích (m²) — preset + khoảng tuỳ chỉnh, giống Homedy =====
export type AreaRange = { label: string; min: number; max: number | null };

export const areaRanges: AreaRange[] = [
  { label: "Dưới 30 m²", min: 0, max: 30 },
  { label: "30 - 50 m²", min: 30, max: 50 },
  { label: "50 - 80 m²", min: 50, max: 80 },
  { label: "80 - 100 m²", min: 80, max: 100 },
  { label: "100 - 150 m²", min: 100, max: 150 },
  { label: "150 - 200 m²", min: 150, max: 200 },
  { label: "200 - 300 m²", min: 200, max: 300 },
  { label: "300 - 500 m²", min: 300, max: 500 },
  { label: "Trên 500 m²", min: 500, max: null },
];

// Đổi chuỗi diện tích "1.500 m²" → số m² (dấu "." là phân tách hàng nghìn)
export function areaToM2(area: string): number | null {
  const m = area.replace(/\./g, "").match(/\d+/);
  return m ? parseInt(m[0], 10) : null;
}

// ===== Phòng ngủ & Hướng nhà =====
export const bedroomOptions = [1, 2, 3, 4, 5]; // 5 = "5+"

// Thứ tự PHẢI khớp mảng trong buildListingDetail (data.ts) để hướng ở trang chi tiết
// và bộ lọc luôn nhất quán.
export const directionOptions = ["Đông", "Đông Nam", "Nam", "Tây Nam", "Tây", "Tây Bắc", "Bắc", "Đông Bắc"];

// Hướng suy ra ổn định từ id (cùng công thức với buildListingDetail)
export function listingDirection(id: string): string {
  const idx = parseInt(id, 10) || 1;
  return directionOptions[idx % directionOptions.length];
}

// ===== Bộ lọc gộp — dùng chung cho mọi trang =====
export type Filters = {
  province: string;
  district: string;
  ward: string;
  types: string[]; // chọn nhiều loại hình
  priceMin: number | null; // tỷ
  priceMax: number | null; // tỷ
  areaMin: number | null; // m²
  areaMax: number | null; // m²
  beds: number; // 0 = bất kỳ, 5 = 5+
  direction: string;
  keyword: string;
};

export function emptyFilters(): Filters {
  return {
    province: "", district: "", ward: "",
    types: [],
    priceMin: null, priceMax: null,
    areaMin: null, areaMax: null,
    beds: 0, direction: "", keyword: "",
  };
}

// Khởi tạo bộ lọc từ query string (link từ Hero, khu vực, v.v.)
export function filtersFromParams(params: URLSearchParams): Filters {
  const f = emptyFilters();
  f.province = params.get("tinh") ?? "";
  f.district = params.get("quan") ?? "";
  f.ward = params.get("phuong") ?? "";
  const loai = params.get("loai");
  if (loai) f.types = loai.split(",").map((s) => s.trim()).filter(Boolean);
  // Khoảng giá: ưu tiên min/max (số tỷ), fallback nhãn preset (tương thích cũ)
  const giaMin = params.get("giaMin"); const giaMax = params.get("giaMax");
  if (giaMin != null || giaMax != null) {
    f.priceMin = giaMin != null && giaMin !== "" ? Number(giaMin) : null;
    f.priceMax = giaMax != null && giaMax !== "" ? Number(giaMax) : null;
  } else {
    const gia = params.get("gia");
    if (gia) {
      const r = priceRanges.find((x) => x.label === gia);
      if (r) { f.priceMin = r.min; f.priceMax = r.max; }
    }
  }
  // Khoảng diện tích: ưu tiên min/max (m²), fallback nhãn preset
  const dtMin = params.get("dtMin"); const dtMax = params.get("dtMax");
  if (dtMin != null || dtMax != null) {
    f.areaMin = dtMin != null && dtMin !== "" ? Number(dtMin) : null;
    f.areaMax = dtMax != null && dtMax !== "" ? Number(dtMax) : null;
  } else {
    const dt = params.get("dientich");
    if (dt) {
      const r = areaRanges.find((x) => x.label === dt);
      if (r) { f.areaMin = r.min; f.areaMax = r.max; }
    }
  }
  const pn = params.get("pn");
  if (pn) f.beds = parseInt(pn, 10) || 0;
  f.direction = params.get("huong") ?? "";
  f.keyword = params.get("q") ?? "";
  return f;
}

// Serialize bộ lọc ra query string (cho Hero điều hướng sang trang tìm kiếm, không mất dữ liệu)
export function filtersToParams(f: Filters): URLSearchParams {
  const p = new URLSearchParams();
  if (f.province) p.set("tinh", f.province);
  if (f.district) p.set("quan", f.district);
  if (f.ward) p.set("phuong", f.ward);
  if (f.types.length) p.set("loai", f.types.join(","));
  if (f.priceMin != null) p.set("giaMin", String(f.priceMin));
  if (f.priceMax != null) p.set("giaMax", String(f.priceMax));
  if (f.areaMin != null) p.set("dtMin", String(f.areaMin));
  if (f.areaMax != null) p.set("dtMax", String(f.areaMax));
  if (f.beds) p.set("pn", String(f.beds));
  if (f.direction) p.set("huong", f.direction);
  if (f.keyword.trim()) p.set("q", f.keyword.trim());
  return p;
}

// Có đang áp dụng bộ lọc nào không
export function hasActiveFilters(f: Filters): boolean {
  return Boolean(
    f.province || f.district || f.ward || f.types.length ||
    f.priceMin != null || f.priceMax != null ||
    f.areaMin != null || f.areaMax != null ||
    f.beds || f.direction || f.keyword.trim()
  );
}

// Bỏ dấu tiếng Việt + thường hoá để khớp gần đúng / không phân biệt dấu.
// Gõ "hoa xuan" hay "hoas xuan" vẫn khớp "Hòa Xuân".
export function normalizeVi(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // bỏ dấu thanh + dấu phụ
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

// Khớp loại hình (lỏng — nhãn menu khác chuỗi loại trong dữ liệu)
function matchType(itemType: string, option: string): boolean {
  const head = option.split(/[ /]/)[0].toLowerCase();
  return itemType.toLowerCase().includes(head);
}

type FilterableListing = {
  id: string; title: string; price: string; area: string;
  beds?: number; location: string; type: string;
};

// Áp dụng toàn bộ bộ lọc lên danh sách
export function applyFilters<T extends FilterableListing>(items: T[], f: Filters): T[] {
  const kw = normalizeVi(f.keyword);
  return items.filter((item) => {
    if (f.province && !item.location.includes(f.province)) return false;
    if (f.district && !item.location.includes(f.district)) return false;
    if (f.ward && !item.location.includes(f.ward)) return false;
    if (f.types.length && !f.types.some((t) => matchType(item.type, t))) return false;

    const ty = priceToTy(item.price);
    if (f.priceMin != null && (ty == null || ty < f.priceMin)) return false;
    if (f.priceMax != null && (ty == null || ty > f.priceMax)) return false;

    const m2 = areaToM2(item.area);
    if (f.areaMin != null && (m2 == null || m2 < f.areaMin)) return false;
    if (f.areaMax != null && (m2 == null || m2 > f.areaMax)) return false;

    if (f.beds) {
      const b = item.beds ?? 0;
      if (f.beds >= 5 ? b < 5 : b !== f.beds) return false;
    }
    if (f.direction && listingDirection(item.id) !== f.direction) return false;
    if (kw && !normalizeVi(`${item.title} ${item.location} ${item.type}`).includes(kw)) return false;
    return true;
  });
}

// Sắp xếp kết quả
export type SortKey = "moi" | "gia-tang" | "gia-giam" | "dt-giam";

export function sortListings<T extends FilterableListing>(items: T[], sort: SortKey): T[] {
  const s = [...items];
  if (sort === "gia-tang") s.sort((a, b) => (priceToTy(a.price) ?? 1e9) - (priceToTy(b.price) ?? 1e9));
  if (sort === "gia-giam") s.sort((a, b) => (priceToTy(b.price) ?? -1) - (priceToTy(a.price) ?? -1));
  if (sort === "dt-giam") s.sort((a, b) => (areaToM2(b.area) ?? -1) - (areaToM2(a.area) ?? -1));
  return s;
}

// Văn bản hiển thị khoảng giá / diện tích (cho nút & chip)
export function priceRangeText(min: number | null, max: number | null): string {
  const f = (n: number) => (n >= 1 ? `${(+n.toFixed(2))} tỷ` : `${Math.round(n * 1000)} triệu`);
  if (min != null && max != null) return `${f(min)} - ${f(max)}`;
  if (min != null) return `Trên ${f(min)}`;
  if (max != null) return `Dưới ${f(max)}`;
  return "";
}

export function areaRangeText(min: number | null, max: number | null): string {
  if (min != null && max != null) return `${min} - ${max} m²`;
  if (min != null) return `Trên ${min} m²`;
  if (max != null) return `Dưới ${max} m²`;
  return "";
}
