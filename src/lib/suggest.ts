// Tìm kiếm ĐA TẦNG cho ô tìm khoá — phủ TẤT CẢ nội dung site:
//   Khu vực (địa chỉ) · Loại hình · Sản phẩm (BĐS) · Dự án · Tin tức.
// Khớp KHÔNG phân biệt dấu (normalizeVi) + sửa lỗi gõ (fuzzy theo từ).
// Chọn Khu vực/Loại hình → đổ vào bộ lọc; chọn Sản phẩm/Dự án/Tin tức → mở trang chi tiết.

import { provinces } from "@/lib/locations";
import { propertyTypeOptions, normalizeVi } from "@/lib/filters";
import { featuredListings, projects, articles } from "@/lib/data";

export type SuggestKind = "Khu vực" | "Loại hình" | "Sản phẩm" | "Dự án" | "Tin tức";

export type Suggestion = {
  label: string;
  kind: SuggestKind;
  sub?: string; // dòng phụ (vị trí / danh mục)
  // Khu vực → đổ vào bộ lọc địa giới
  province?: string;
  district?: string;
  ward?: string;
  // Loại hình → thêm vào lọc loại nhà đất
  type?: string;
  // Sản phẩm / Dự án / Tin tức → điều hướng tới trang chi tiết
  href?: string;
  // Phụ: từ khoá đổ vào ô tìm (khi không điều hướng được)
  keyword?: string;
};

type Entry = Suggestion & { norm: string; primary: string };

// Bỏ dấu + thay dấu câu (",", "/") bằng khoảng trắng để tách từ sạch
// (tránh token dính dấu phẩy như "xuan," làm hụt so khớp gần đúng).
const toNorm = (s: string) => normalizeVi(s).replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

// Dựng chỉ mục một lần. `norm` = cả nội dung (cho khớp chuỗi); `primary` = tên chính (cho fuzzy).
const ENTRIES: Entry[] = [];

// 1) Khu vực / Địa chỉ — tỉnh / quận-huyện / phường-xã
for (const p of provinces) {
  ENTRIES.push({ label: p.name, kind: "Khu vực", province: p.name, norm: toNorm(p.name), primary: toNorm(p.name) });
  for (const d of p.districts) {
    const dl = `${d.name}, ${p.name}`;
    ENTRIES.push({ label: dl, kind: "Khu vực", province: p.name, district: d.name, norm: toNorm(dl), primary: toNorm(d.name) });
    for (const w of d.wards) {
      const wl = `${w}, ${d.name}, ${p.name}`;
      ENTRIES.push({ label: wl, kind: "Khu vực", province: p.name, district: d.name, ward: w, norm: toNorm(wl), primary: toNorm(w) });
    }
  }
}

// 2) Loại hình BĐS
for (const t of propertyTypeOptions) {
  ENTRIES.push({ label: t, kind: "Loại hình", type: t, norm: toNorm(t), primary: toNorm(t) });
}

// 3) Sản phẩm (tin BĐS) — khớp theo tiêu đề + vị trí
for (const it of featuredListings) {
  ENTRIES.push({
    label: it.title, kind: "Sản phẩm", sub: it.location,
    href: `/bat-dong-san/${it.id}`, keyword: it.title,
    norm: toNorm(`${it.title} ${it.location}`), primary: toNorm(it.title),
  });
}

// 4) Dự án — khớp theo tên + vị trí + chủ đầu tư
for (const p of projects) {
  ENTRIES.push({
    label: p.name, kind: "Dự án", sub: p.location,
    href: `/du-an/${p.slug}`, keyword: p.name,
    norm: toNorm(`${p.name} ${p.location} ${p.developer}`), primary: toNorm(p.name),
  });
}

// 5) Tin tức — khớp theo tiêu đề + danh mục
for (const a of articles) {
  ENTRIES.push({
    label: a.title, kind: "Tin tức", sub: a.category,
    href: `/tin-tuc/${a.slug}`, keyword: a.title,
    norm: toNorm(`${a.title} ${a.category}`), primary: toNorm(a.title),
  });
}

// Gợi ý phổ biến — hiện ngay khi người dùng chạm vào ô tìm kiếm (chưa gõ), kiểu Homedy.
export const popularSuggestions: Suggestion[] = [
  { label: "Đà Nẵng", kind: "Khu vực", province: "Đà Nẵng" },
  { label: "Huế", kind: "Khu vực", province: "Huế" },
  { label: "Khánh Hòa", kind: "Khu vực", province: "Khánh Hòa" },
  { label: "Lâm Đồng", kind: "Khu vực", province: "Lâm Đồng" },
  { label: "Gia Lai", kind: "Khu vực", province: "Gia Lai" },
  { label: "Căn hộ chung cư", kind: "Loại hình", type: "Căn hộ chung cư" },
  { label: "Đất nền / Đất nền dự án", kind: "Loại hình", type: "Đất nền / Đất nền dự án" },
  { label: "Villa / Biệt thự biển", kind: "Loại hình", type: "Villa / Biệt thự biển" },
];

// Khoảng cách Levenshtein có chặn trên `max` (thoát sớm để nhanh).
function editDistance(a: string, b: string, max: number): number {
  const m = a.length, n = b.length;
  if (Math.abs(m - n) > max) return max + 1;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    let best = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (cur[j] < best) best = cur[j];
    }
    if (best > max) return max + 1;
    prev = cur;
  }
  return prev[n];
}

// Một từ khoá khớp gần đúng một từ trong tên? (tiền tố, hoặc sai 1–2 ký tự)
function wordFuzzy(qt: string, et: string): boolean {
  if (et.startsWith(qt) || qt.startsWith(et)) return true;
  if (qt.length < 3) return false; // từ quá ngắn dễ nhiễu
  const thr = qt.length <= 4 ? 1 : 2;
  return editDistance(qt, et, thr) <= thr;
}

// Khớp gần đúng:
// - 1 từ: khớp bất kỳ từ nào trong tên.
// - Nhiều từ: phải khớp LIÊN TIẾP, đúng thứ tự (tránh ghép lẻ từ rời rạc thành nhiễu).
function tokensFuzzy(qTokens: string[], eTokens: string[]): boolean {
  if (qTokens.length === 1) return eTokens.some((et) => wordFuzzy(qTokens[0], et));
  for (let start = 0; start + qTokens.length <= eTokens.length; start++) {
    let ok = true;
    for (let k = 0; k < qTokens.length; k++) {
      if (!wordFuzzy(qTokens[k], eTokens[start + k])) { ok = false; break; }
    }
    if (ok) return true;
  }
  return false;
}

// Cùng hạng khớp: ưu tiên lọc cấu trúc (khu vực, loại) trước, rồi dự án/sản phẩm/tin.
const KIND_ORDER: Record<SuggestKind, number> = {
  "Khu vực": 0, "Loại hình": 1, "Dự án": 2, "Sản phẩm": 3, "Tin tức": 4,
};

// Trả về tối đa `limit` gợi ý.
// Hạng: 0 = khớp đầu chuỗi · 1 = chứa chuỗi · 2 = khớp gần đúng (sửa lỗi gõ).
export function suggest(query: string, limit = 8): Suggestion[] {
  const q = toNorm(query);
  if (!q) return [];
  const qTokens = q.split(" ").filter(Boolean);

  const scored: { e: Entry; rank: number }[] = [];
  for (const e of ENTRIES) {
    let rank: number;
    if (e.norm.startsWith(q)) rank = 0;
    else if (e.norm.includes(q)) rank = 1;
    else if (tokensFuzzy(qTokens, e.primary.split(" "))) rank = 2;
    else continue;
    scored.push({ e, rank });
  }
  scored.sort(
    (a, b) =>
      a.rank - b.rank ||
      KIND_ORDER[a.e.kind] - KIND_ORDER[b.e.kind] ||
      a.e.label.length - b.e.label.length,
  );
  return scored.slice(0, limit).map((s) => s.e);
}
