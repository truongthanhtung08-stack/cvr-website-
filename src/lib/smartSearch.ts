// ============================================================================
// LÕI TÌM KIẾM THÔNG MINH — theo tài liệu "HỆ THỐNG BỘ LỌC VÀ TÌM KIẾM THÔNG MINH"
//   · Mục 2: bóc tách câu dài tiếng Việt thành tiêu chí (NLP Entity Extraction)
//   · Mục 4: xếp hạng 3 TẦNG để KHÔNG BAO GIỜ trả về màn hình trống
//
// Ví dụ: "căn hộ 3 phòng ngủ view biển mới xây tại Đà Nẵng"
//   → loại hình: Căn hộ · phòng ngủ: 3 · đặc điểm: view biển, mới xây · nơi: Đà Nẵng
//   → Tầng 1: tin khớp ĐỦ mọi tiêu chí
//     Tầng 2: khớp gần đủ (giữ khu vực/loại hình, nới các tiêu chí phụ)
//     Tầng 3: chỉ cần khớp 1 từ cũng hiện (chống gõ sai / thiếu dấu)
//
// KHÔNG đụng tới giao diện: chỉ trả về danh sách đã xếp hạng + danh sách từ đã
// khớp để nơi hiển thị BÔI ĐẬM (xem components/Highlight.tsx).
// ============================================================================

import { applyFilters, emptyFilters, normalizeVi, type Filters } from "@/lib/filters";

// ── Từ điển nhận diện ───────────────────────────────────────────────────────
// Mỗi mục: [nhãn chuẩn, các cách viết người dùng hay gõ]
const LOAI_HINH: [string, string[]][] = [
  ["Chung cư", ["chung cu"]],
  ["Căn hộ", ["can ho", "canho", "apartment", "officetel", "duplex", "penthouse", "studio"]],
  ["Nhà riêng", ["nha rieng", "nha o", "nha cap 4", "nha nguyen can"]],
  ["Nhà mặt phố", ["nha mat pho", "mat pho", "mat tien"]],
  ["Biệt thự", ["biet thu", "villa", "lien ke", "song lap"]],
  ["Shophouse", ["shophouse", "nha pho thuong mai"]],
  ["Đất nền", ["dat nen", "dat du an", "lo dat", "dat tho cu", "dat"]],
  ["Condotel", ["condotel", "nghi duong", "resort"]],
  ["Kho xưởng", ["kho xuong", "nha xuong", "kho bai", "nha kho"]],
  ["Văn phòng", ["van phong", "mat bang kinh doanh", "mat bang"]],
  ["Phòng trọ", ["phong tro", "nha tro", "tro"]],
];

const TINH: [string, string[]][] = [
  ["Đà Nẵng", ["da nang", "danang", "dn"]],
  ["Huế", ["hue", "thua thien hue", "thua thien"]],
  ["Quảng Nam", ["quang nam", "hoi an", "tam ky", "dien ban"]],
  ["Quảng Ngãi", ["quang ngai"]],
  ["Quảng Trị", ["quang tri", "dong ha"]],
  ["Gia Lai", ["gia lai", "quy nhon", "pleiku", "an nhon"]],
  ["Khánh Hòa", ["khanh hoa", "nha trang", "cam ranh"]],
  ["Đắk Lắk", ["dak lak", "buon ma thuot"]],
  ["Lâm Đồng", ["lam dong", "da lat"]],
  ["Hà Nội", ["ha noi", "hanoi"]],
  ["Hồ Chí Minh", ["ho chi minh", "hcm", "sai gon", "saigon", "tphcm"]],
];

// Đặc điểm mô tả — khớp vào tiêu đề/mô tả tin
const DAC_DIEM: [string, string[]][] = [
  ["view biển", ["view bien", "huong bien", "gan bien", "sat bien", "mat bien"]],
  ["view sông", ["view song", "ven song", "mat song"]],
  ["mới xây", ["moi xay", "moi 100", "xay moi", "moi hoan thien", "nha moi"]],
  ["full nội thất", ["full noi that", "day du noi that", "noi that cao cap", "co noi that"]],
  ["sổ hồng", ["so hong", "so do", "so rieng", "phap ly ro rang", "chinh chu"]],
  ["hẻm ô tô", ["o to", "hem o to", "oto vao nha", "duong rong"]],
  ["gần trường", ["gan truong", "truong hoc"]],
  ["gần chợ", ["gan cho", "sieu thi"]],
  ["trung tâm", ["trung tam", "gan trung tam"]],
];

// Từ nối / từ vô nghĩa khi chấm điểm
const TU_BO = new Set([
  "tai", "o", "co", "va", "cua", "cho", "voi", "gia", "can", "mua", "ban", "thue",
  "nha", "bat", "dong", "san", "bds", "khu", "vuc", "duoi", "tren", "tu", "den", "khoang",
]);

export type ParsedQuery = {
  raw: string;
  purpose: "ban" | "thue" | null;
  types: string[];      // nhãn loại hình
  places: string[];     // nhãn tỉnh/thành
  beds: number | null;
  priceMaxTy: number | null;
  priceMinTy: number | null;
  features: string[];   // nhãn đặc điểm
  terms: string[];      // từ khoá còn lại (đã bỏ dấu) để chấm điểm & bôi đậm
  highlight: string[];  // các cụm chữ NGUYÊN BẢN để bôi đậm trong kết quả
};

function timTuDien(nq: string, dict: [string, string[]][]): string[] {
  const found: string[] = [];
  for (const [nhan, keys] of dict) {
    if (keys.some((k) => nq.includes(k))) found.push(nhan);
  }
  return found;
}

// "3 phòng ngủ" / "3pn" / "3 pn" → 3
function bocPhongNgu(nq: string): number | null {
  const m = nq.match(/(\d+)\s*(pn|phong ngu|phòng ngủ)/);
  return m ? Number(m[1]) : null;
}

// "dưới 3 tỷ" · "từ 2 đến 5 tỷ" · "500 triệu" → khoảng giá (đơn vị TỶ)
function bocGia(nq: string): { min: number | null; max: number | null } {
  const soTy = (s: string, dv: string) => (dv.startsWith("tr") ? Number(s.replace(",", ".")) / 1000 : Number(s.replace(",", ".")));
  const khoang = nq.match(/(?:tu\s*)?(\d+[.,]?\d*)\s*(?:-|den|toi)\s*(\d+[.,]?\d*)\s*(ty|trieu|tr)/);
  if (khoang) return { min: soTy(khoang[1], khoang[3]), max: soTy(khoang[2], khoang[3]) };
  const duoi = nq.match(/(?:duoi|nho hon|<)\s*(\d+[.,]?\d*)\s*(ty|trieu|tr)/);
  if (duoi) return { min: null, max: soTy(duoi[1], duoi[2]) };
  const tren = nq.match(/(?:tren|lon hon|>)\s*(\d+[.,]?\d*)\s*(ty|trieu|tr)/);
  if (tren) return { min: soTy(tren[1], tren[2]), max: null };
  return { min: null, max: null };
}

export function parseQuery(raw: string): ParsedQuery {
  const nq = normalizeVi(raw);
  const gia = bocGia(nq);
  const types = timTuDien(nq, LOAI_HINH);
  const places = timTuDien(nq, TINH);
  const features = timTuDien(nq, DAC_DIEM);

  const purpose: "ban" | "thue" | null = /\b(thue|cho thue)\b/.test(nq)
    ? "thue"
    : /\b(mua|ban|can mua)\b/.test(nq)
      ? "ban"
      : null;

  // Từ khoá còn lại: bỏ số, bỏ từ nối, giữ từ ≥ 2 ký tự
  const terms = Array.from(
    new Set(
      nq
        .split(/[^a-z0-9]+/)
        .filter((t) => t.length >= 2 && !TU_BO.has(t) && !/^\d+$/.test(t)),
    ),
  );

  // Cụm để bôi đậm: giữ nguyên chữ người dùng gõ (kể cả có dấu)
  const highlight = Array.from(
    new Set(
      raw
        .split(/[^\p{L}\p{N}]+/u)
        .map((w) => w.trim())
        .filter((w) => w.length >= 2 && !TU_BO.has(normalizeVi(w))),
    ),
  );

  return { raw, purpose, types, places, beds: bocPhongNgu(nq), priceMaxTy: gia.max, priceMinTy: gia.min, features, terms, highlight };
}

// ── Chấm điểm 1 tin theo câu đã bóc tách ────────────────────────────────────
type Searchable = {
  id: string; title: string; location: string; type: string; price: string;
  area: string; beds?: number; purpose?: string;
};

export type Hit<T> = {
  item: T;
  tier: 1 | 2 | 3;       // 1 = khớp hoàn hảo · 2 = gần đúng · 3 = liên quan
  score: number;
  matched: string[];     // các từ đã khớp (để bôi đậm)
};

// Khớp mờ: chứa nguyên từ, hoặc lệch 1 ký tự với từ dài (chống gõ sai/thiếu dấu)
function khopMo(hay: string, tu: string): boolean {
  if (hay.includes(tu)) return true;
  if (tu.length < 5) return false;
  // bỏ 1 ký tự bất kỳ rồi thử lại — đủ bắt lỗi gõ thiếu/thừa 1 chữ
  for (let i = 0; i < tu.length; i++) {
    if (hay.includes(tu.slice(0, i) + tu.slice(i + 1))) return true;
  }
  return false;
}

function tyGia(price: string): number | null {
  const s = normalizeVi(price).replace(/\./g, "").replace(",", ".");
  const n = parseFloat(s);
  if (Number.isNaN(n)) return null;
  if (s.includes("ty")) return n;
  if (s.includes("trieu")) return n / 1000;
  return null;
}

export function smartSearch<T extends Searchable>(items: T[], raw: string): { hits: Hit<T>[]; parsed: ParsedQuery } {
  const parsed = parseQuery(raw);
  if (!raw.trim()) return { hits: items.map((item) => ({ item, tier: 1 as const, score: 0, matched: [] })), parsed };

  const hits: Hit<T>[] = [];

  for (const item of items) {
    const hay = normalizeVi(`${item.title} ${item.location} ${item.type} ${item.price} ${item.area}`);
    const matched: string[] = [];
    let dat = 0;   // số tiêu chí ĐẠT
    let tong = 0;  // tổng số tiêu chí bóc được từ câu

    // 1) Loại hình
    if (parsed.types.length) {
      tong++;
      const ok = parsed.types.some((t) => khopMo(hay, normalizeVi(t)));
      if (ok) { dat++; matched.push(...parsed.types); }
    }
    // 2) Khu vực
    if (parsed.places.length) {
      tong++;
      const ok = parsed.places.some((p) => khopMo(normalizeVi(item.location), normalizeVi(p)));
      if (ok) { dat++; matched.push(...parsed.places); }
    }
    // 3) Phòng ngủ
    if (parsed.beds != null) {
      tong++;
      if (item.beds != null && item.beds >= parsed.beds) { dat++; matched.push(`${parsed.beds} PN`); }
    }
    // 4) Giá
    if (parsed.priceMaxTy != null || parsed.priceMinTy != null) {
      tong++;
      const ty = tyGia(item.price);
      const okMax = parsed.priceMaxTy == null || (ty != null && ty <= parsed.priceMaxTy);
      const okMin = parsed.priceMinTy == null || (ty != null && ty >= parsed.priceMinTy);
      if (okMax && okMin) { dat++; matched.push(item.price); }
    }
    // 5) Mục đích (bán / cho thuê)
    if (parsed.purpose) {
      tong++;
      if ((item.purpose ?? "ban") === parsed.purpose) dat++;
    }
    // 6) Đặc điểm mô tả (view biển, mới xây…)
    for (const f of parsed.features) {
      tong++;
      if (khopMo(hay, normalizeVi(f))) { dat++; matched.push(f); }
    }

    // Từ khoá lẻ — dùng cho tầng 3 (gõ 1 chữ vẫn ra kết quả)
    const tuLe = parsed.terms.filter((t) => khopMo(hay, t));
    if (tuLe.length) matched.push(...tuLe);

    if (tong === 0 && tuLe.length === 0) continue;      // không dính gì
    if (tong > 0 && dat === 0 && tuLe.length === 0) continue;

    const tyLe = tong === 0 ? 0 : dat / tong;
    const tier: 1 | 2 | 3 = tong > 0 && dat === tong ? 1 : tyLe >= 0.5 ? 2 : 3;
    // Điểm: ưu tiên tỉ lệ đạt, cộng thêm số từ lẻ khớp để xếp trong cùng tầng
    const score = dat * 100 + tuLe.length * 10 + Math.round(tyLe * 10);

    hits.push({ item, tier, score, matched: Array.from(new Set(matched)) });
  }

  // ── LỚP BẢO ĐẢM: KHÔNG BAO GIỜ TRẢ VỀ MÀN HÌNH TRỐNG (tài liệu mục 4) ──────
  // Rơi hết các vòng trên → nới dần, mỗi bước vẫn xếp Tầng 3.
  if (hits.length === 0) {
    // B1: chỉ cần đúng KHU VỰC
    if (parsed.places.length) {
      for (const item of items) {
        if (parsed.places.some((p) => normalizeVi(item.location).includes(normalizeVi(p)))) {
          hits.push({ item, tier: 3, score: 30, matched: parsed.places });
        }
      }
    }
    // B2: chỉ cần đúng LOẠI HÌNH
    if (hits.length === 0 && parsed.types.length) {
      for (const item of items) {
        if (parsed.types.some((t) => normalizeVi(item.type).includes(normalizeVi(t)))) {
          hits.push({ item, tier: 3, score: 20, matched: parsed.types });
        }
      }
    }
    // B3: khớp MỘT PHẦN chữ (gõ sai nhiều, hoặc từ khoá lạ) — lấy tin có nhiều
    //     ký tự đầu trùng nhất, tối đa 24 tin, để màn hình luôn có nội dung.
    if (hits.length === 0) {
      const goc = parsed.terms.map((t) => t.slice(0, 3)).filter(Boolean);
      const cham = items.map((item) => {
        const hay = normalizeVi(`${item.title} ${item.location} ${item.type}`);
        const n = goc.filter((g) => hay.includes(g)).length;
        return { item, n };
      });
      const coDinh = cham.filter((c) => c.n > 0).sort((a, b) => b.n - a.n);
      const nguon = coDinh.length ? coDinh : cham; // vẫn rỗng → lấy nguyên danh sách
      for (const c of nguon.slice(0, 24)) hits.push({ item: c.item, tier: 3, score: c.n, matched: [] });
    }
  }

  hits.sort((a, b) => a.tier - b.tier || b.score - a.score);
  return { hits, parsed };
}

// ============================================================================
// NỚI LỎNG THÔNG MINH CHO CÁC TRƯỜNG LỌC CHỌN TAY
// (khu vực · loại hình · giá · diện tích · phòng ngủ · hướng · pháp lý · nội thất…)
//
// Cùng một logic với ô từ khoá: khớp ĐỦ → Tầng 1; thiếu vài tiêu chí phụ nhưng
// GIỮ ĐƯỢC khu vực + loại hình → Tầng 2; dính ít nhất 1 tiêu chí → Tầng 3.
// Nhờ vậy chọn lọc quá chặt cũng KHÔNG ra màn hình trống, mà tụt xuống gợi ý
// gần đúng — đúng tinh thần "Smart Relax" trong tài liệu mục 4.
//
// Mỗi tiêu chí được kiểm bằng CHÍNH applyFilters (chỉ bật đúng 1 trường) nên
// luật lọc không bao giờ lệch với bộ lọc gốc.
// ============================================================================
type Tieu = { ten: string; giu: boolean; f: Filters };

function tachTieuChi(f: Filters): Tieu[] {
  const ds: Tieu[] = [];
  const chi = (patch: Partial<Filters>) => ({ ...emptyFilters(), ...patch });
  if (f.locations.length) ds.push({ ten: "khu vực", giu: true, f: chi({ locations: f.locations }) });
  if (f.types.length) ds.push({ ten: "loại hình", giu: true, f: chi({ types: f.types }) });
  if (f.project.trim()) ds.push({ ten: "dự án", giu: true, f: chi({ project: f.project }) });
  if (f.priceMin != null || f.priceMax != null) ds.push({ ten: "mức giá", giu: false, f: chi({ priceMin: f.priceMin, priceMax: f.priceMax }) });
  if (f.areaMin != null || f.areaMax != null) ds.push({ ten: "diện tích", giu: false, f: chi({ areaMin: f.areaMin, areaMax: f.areaMax }) });
  if (f.beds) ds.push({ ten: "phòng ngủ", giu: false, f: chi({ beds: f.beds }) });
  if (f.direction) ds.push({ ten: "hướng", giu: false, f: chi({ direction: f.direction }) });
  if (f.legal) ds.push({ ten: "pháp lý", giu: false, f: chi({ legal: f.legal }) });
  if (f.furnishing) ds.push({ ten: "nội thất", giu: false, f: chi({ furnishing: f.furnishing }) });
  if (f.verified) ds.push({ ten: "tin xác thực", giu: false, f: chi({ verified: true }) });
  if (f.broker) ds.push({ ten: "môi giới chuyên nghiệp", giu: false, f: chi({ broker: true }) });
  return ds;
}

export type FilterHit<T> = { item: T; tier: 1 | 2 | 3; thieu: string[] };

export function smartFilter<T extends Searchable & { badge?: string }>(
  items: T[],
  f: Filters,
): FilterHit<T>[] {
  const tieu = tachTieuChi(f);
  // Không chọn tiêu chí nào → mọi tin đều là Tầng 1
  if (tieu.length === 0) return items.map((item) => ({ item, tier: 1, thieu: [] }));

  const out: FilterHit<T>[] = [];
  for (const item of items) {
    const dat: string[] = [];
    const thieu: string[] = [];
    let giuDu = true;
    for (const t of tieu) {
      const ok = applyFilters([item], t.f).length > 0;
      if (ok) dat.push(t.ten);
      else {
        thieu.push(t.ten);
        if (t.giu) giuDu = false; // hụt khu vực / loại hình → không được lên Tầng 2
      }
    }
    if (dat.length === 0) continue;
    const tier: 1 | 2 | 3 =
      thieu.length === 0 ? 1 : giuDu && dat.length / tieu.length >= 0.5 ? 2 : 3;
    out.push({ item, tier, thieu });
  }

  // Vẫn rỗng (chọn quá chặt, dữ liệu chưa có tin nào dính) → giữ lại tin cùng
  // KHU VỰC, không có nữa thì cùng LOẠI HÌNH, cuối cùng là toàn bộ danh sách.
  if (out.length === 0) {
    const kv = tieu.find((t) => t.ten === "khu vực");
    const lh = tieu.find((t) => t.ten === "loại hình");
    const thu = (t?: Tieu) => (t ? applyFilters(items, t.f) : []);
    const nguon = thu(kv).length ? thu(kv) : thu(lh).length ? thu(lh) : items;
    for (const item of nguon.slice(0, 24)) out.push({ item: item as T, tier: 3, thieu: tieu.map((t) => t.ten) });
  }

  out.sort((a, b) => a.tier - b.tier);
  return out;
}

// ============================================================================
// GỢI Ý TÌM KIẾM THEO BẬC THANG (nới lỏng dần)
// Gõ "Đất nền tại Đà Nẵng giá dưới 3 tỷ" → gợi ý theo đúng thứ tự ưu tiên:
//   1. Đất nền · Đà Nẵng · dưới 3 tỷ   (khớp 100%)
//   2. Đất nền · Đà Nẵng               (bỏ điều kiện phụ nhất: giá)
//   3. Đất nền                         (bỏ tiếp khu vực)
//   4. Bất động sản tại Đà Nẵng        (chỉ giữ khu vực)
// Bấm dòng nào là bộ lọc nhảy đúng dòng đó — không phải gõ lại.
// ============================================================================
export type GoiY = { label: string; sub: string; patch: Partial<Filters> };

export function goiYNoiLong(raw: string): GoiY[] {
  const p = parseQuery(raw);
  const loai = p.types[0];
  const noi = p.places[0];
  const coGia = p.priceMaxTy != null || p.priceMinTy != null;
  const giaChu = p.priceMaxTy != null
    ? `dưới ${p.priceMaxTy >= 1 ? `${p.priceMaxTy} tỷ` : `${Math.round(p.priceMaxTy * 1000)} triệu`}`
    : p.priceMinTy != null
      ? `trên ${p.priceMinTy} tỷ`
      : "";

  const pGia: Partial<Filters> = coGia ? { priceMin: p.priceMinTy, priceMax: p.priceMaxTy } : {};
  const pLoai: Partial<Filters> = loai ? { types: [loai] } : {};
  const pNoi: Partial<Filters> = noi ? { locations: [{ province: noi }] } : {};
  const pPn: Partial<Filters> = p.beds != null ? { beds: p.beds } : {};

  const ds: GoiY[] = [];
  const them = (label: string, sub: string, patch: Partial<Filters>) => {
    if (!label || ds.some((x) => x.label === label)) return;
    ds.push({ label, sub, patch });
  };

  const phanLoai = loai ?? "Bất động sản";
  const phanNoi = noi ? ` tại ${noi}` : "";
  const phanPn = p.beds != null ? ` ${p.beds} PN` : "";

  // 1) Đầy đủ mọi tiêu chí bóc được
  if (loai || noi || coGia || p.beds != null) {
    them(
      `${phanLoai}${phanPn}${phanNoi}${coGia ? ` ${giaChu}` : ""}`,
      "Khớp đầy đủ tiêu chí",
      { ...pLoai, ...pNoi, ...pGia, ...pPn },
    );
  }
  // 2) Bỏ GIÁ (điều kiện dễ nới nhất)
  if (coGia && (loai || noi)) {
    them(`${phanLoai}${phanPn}${phanNoi}`, "Bỏ điều kiện giá", { ...pLoai, ...pNoi, ...pPn });
  }
  // 3) Bỏ tiếp SỐ PHÒNG NGỦ
  if (p.beds != null && (loai || noi)) {
    them(`${phanLoai}${phanNoi}`, "Bỏ điều kiện phòng ngủ", { ...pLoai, ...pNoi });
  }
  // 4) Chỉ LOẠI HÌNH
  if (loai) them(`Tất cả ${loai.toLowerCase()}`, "Toàn quốc", pLoai);
  // 5) Chỉ KHU VỰC
  if (noi) them(`Bất động sản tại ${noi}`, "Mọi loại hình", pNoi);
  // 6) Chỉ GIÁ
  if (coGia) them(`Bất động sản ${giaChu}`, "Mọi khu vực, mọi loại hình", pGia);

  return ds.slice(0, 5);
}

// ============================================================================
// TÌM KIẾM DÙNG CHUNG CHO MỌI LOẠI DỮ LIỆU (dự án, tin tức, chuyên gia…)
// Cùng một luật với tin BĐS: bóc tách câu → 3 tầng → không bao giờ rỗng.
// Nơi gọi chỉ cần chỉ ra "chuỗi để dò" (hay) và các tiêu chí lọc theo trường.
//
//   searchAny(items, q, {
//     hay:   (p) => `${p.name} ${p.location} ${p.type}`,   // chuỗi để dò từ khoá
//     truong: [                                            // các trường lọc
//       { ten: "khu vực", chon: province !== "Tất cả", ok: (p) => provinceOf(p.location) === province },
//       ...
//     ],
//   })
// ============================================================================
export type TruongLoc<T> = { ten: string; chon: boolean; giu?: boolean; ok: (item: T) => boolean };

export function searchAny<T>(
  items: T[],
  q: string,
  cfg: { hay: (item: T) => string; truong?: TruongLoc<T>[] },
): { item: T; tier: 1 | 2 | 3; matched: string[] }[] {
  const parsed = parseQuery(q);
  const dung = (cfg.truong ?? []).filter((t) => t.chon);
  const coQ = q.trim().length > 0;
  const out: { item: T; tier: 1 | 2 | 3; matched: string[] }[] = [];

  for (const item of items) {
    const hay = normalizeVi(cfg.hay(item));
    // Điểm phần TỪ KHOÁ
    const tuKhop = coQ ? parsed.terms.filter((t) => khopMo(hay, t)) : [];
    const qDu = !coQ || (parsed.terms.length > 0 && tuKhop.length === parsed.terms.length);
    const qDinh = !coQ || tuKhop.length > 0;
    // Điểm phần TRƯỜNG LỌC
    const dat = dung.filter((t) => t.ok(item));
    const giuDu = dung.filter((t) => t.giu).every((t) => t.ok(item));
    const truongDu = dat.length === dung.length;

    if (!qDinh && dat.length === 0) continue;

    const tier: 1 | 2 | 3 =
      qDu && truongDu ? 1 : giuDu && (dung.length === 0 || dat.length / dung.length >= 0.5) && qDinh ? 2 : 3;
    out.push({ item, tier, matched: tuKhop.length ? parsed.highlight : [] });
  }

  // KHÔNG BAO GIỜ RỖNG: nới hết cỡ — giữ tin dính 3 ký tự đầu, cuối cùng lấy tất cả
  if (out.length === 0) {
    const goc = parsed.terms.map((t) => t.slice(0, 3)).filter(Boolean);
    const cham = items.map((item) => ({ item, n: goc.filter((g) => normalizeVi(cfg.hay(item)).includes(g)).length }));
    const co = cham.filter((c) => c.n > 0).sort((a, b) => b.n - a.n);
    for (const c of (co.length ? co : cham).slice(0, 24)) out.push({ item: c.item, tier: 3, matched: [] });
  }

  out.sort((a, b) => a.tier - b.tier);
  return out;
}

// Nhãn từng tầng (đúng chữ trong tài liệu mục 4)
export const TIER_LABEL: Record<1 | 2 | 3, string> = {
  1: "🔥 Khớp hoàn hảo với tiêu chí của bạn",
  2: "✨ Gợi ý tương tự có thể bạn quan tâm",
  3: "⚠️ Không có kết quả khớp tuyệt đối — gợi ý bất động sản liên quan",
};
