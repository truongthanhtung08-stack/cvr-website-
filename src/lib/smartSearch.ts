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

import { applyFilters, emptyFilters, normalizeVi, quaNoiDung, DAC_DIEM, type Filters } from "@/lib/filters";
import { provinces, newProvinceOf, soLaMaCuoi } from "@/lib/locations";
// Tỉnh khách nói (có thể là tên CŨ: "hội an" → Quảng Nam) có chứa tỉnh của nơi tìm được (tên MỚI: Đà Nẵng) không
const cungTinh = (tinh: string[], p: string) => tinh.some((t) => t === p || newProvinceOf(t) === p);
import { daCoDiaDanh, provincesNew, provincesOld } from "@/lib/diaDanhNguon";

// ── Từ điển nhận diện ───────────────────────────────────────────────────────
// Mỗi mục: [nhãn chuẩn, các cách viết người dùng hay gõ]
export const LOAI_HINH: [string, string[]][] = [
  ["Chung cư", ["chung cu"]],
  ["Căn hộ", ["can ho", "canho", "apartment", "officetel", "duplex", "penthouse", "studio"]],
  ["Nhà riêng", ["nha rieng", "nha o", "nha cap 4", "nha nguyen can"]],
  ["Nhà mặt phố", ["nha mat pho", "mat pho", "mat tien", "nha pho"]],
  ["Biệt thự", ["biet thu", "villa", "lien ke", "song lap"]],
  ["Shophouse", ["shophouse", "nha pho thuong mai"]],
  // Trang trại = đất nông nghiệp; homestay, farmstay và khu nghỉ dưỡng là BĐS nghỉ dưỡng (chủ dự án 29/10/2026, D24).
  // Cụm dài thắng cụm ngắn của nhãn khác ("dat trang trai" ≠ Đất nền, "khu nghi duong" ≠ Condotel) — luật nhường ở timTuDien.
  ["Đất khác", ["dat nong nghiep", "dat trang trai", "trang trai", "dat vuon", "dat khac"]],
  ["Đất nền", ["dat nen", "dat du an", "lo dat", "dat tho cu", "dat"]],
  ["Homestay", ["homestay", "home stay", "farmstay", "farm stay"]],
  ["Khu nghỉ dưỡng", ["khu nghi duong", "resort"]],
  ["Condotel", ["condotel", "nghi duong"]],
  ["Kho xưởng", ["kho xuong", "nha xuong", "kho bai", "nha kho"]],
  ["Văn phòng", ["van phong"]],
  // MẶT BẰNG là loại riêng ("Mặt bằng / Cửa hàng bán lẻ"), không phải văn phòng (rà 21/10/2026: "mặt bằng kinh doanh" ra trang văn phòng)
  ["Mặt bằng", ["mat bang", "mat bang kinh doanh", "cua hang", "ki ot", "kiot"]],
  ["Phòng trọ", ["phong tro", "nha tro", "tro"]],
];

const TINH: [string, string[]][] = [
  ["Đà Nẵng", ["da nang", "danang", "dn", "my khe"]], // biển Mỹ Khê → Đà Nẵng
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

// Tên đủ 34 tỉnh mới + 63 tỉnh cũ (tỉnh cũ → tỉnh mới) — khớp TRỌN tên trong câu, tên dài trước ("thua thien hue" trước "hue")
let _tenTinh: [string, string][] | null = null;
function tinhDungTen(nq: string): string[] {
  if (!daCoDiaDanh()) return [];
  const x = tenTinhTrongCau(nq);
  return x ? [x[1]] : [];
}
/** Tỉnh (mới) của TÊN TỈNH ĐẦY ĐỦ đứng SAU CÙNG trong câu (địa chỉ viết từ nhỏ tới lớn) — cùng vị trí thì tên dài thắng */
function tinhTheoTenCuoi(nq: string): string | null {
  if (!daCoDiaDanh()) return null;
  tenTinhTrongCau(nq); // dựng _tenTinh
  const s = ` ${nq.replace(/[^a-z0-9]+/g, " ").trim()} `;
  let tot: { cuoi: number; dai: number; tinh: string } | null = null;
  for (const [n, tinh] of _tenTinh ?? []) {
    let i = s.indexOf(` ${n} `);
    while (i >= 0) {
      const cuoi = i + n.length;
      if (!tot || cuoi > tot.cuoi || (cuoi === tot.cuoi && n.length > tot.dai)) tot = { cuoi, dai: n.length, tinh };
      i = s.indexOf(` ${n} `, i + 1);
    }
  }
  return tot?.tinh ?? null;
}
/** Tên tỉnh (cũ hoặc mới) khách gõ trong câu: [tên đã bỏ dấu, tỉnh mới] — để bỏ khỏi "chữ lạ" và biết câu đã trọn tên nơi */
export function tenTinhTrongCau(nq: string): [string, string] | null {
  if (!daCoDiaDanh()) return null;
  const nt = (t: string) => normalizeVi(t).replace(/[^a-z0-9]+/g, " ").trim(); // "Bà Rịa - Vũng Tàu" → "ba ria vung tau" như câu gõ
  _tenTinh ??= [...provincesNew.map((p): [string, string] => [nt(p.name), p.name]), ...provincesOld.map((p): [string, string] => [nt(p.name), newProvinceOf(p.name)])]
    .filter(([n]) => n.length >= 3).sort((a, b) => b[0].length - a[0].length);
  const s = ` ${nq.replace(/[^a-z0-9]+/g, " ").trim()} `;
  return _tenTinh.find(([n]) => s.includes(` ${n} `)) ?? null;
}

// ── Chỉ mục ĐỊA GIỚI SÂU: phường/xã + quận/huyện (dựng 1 lần từ locations.ts) ──
// Câu dài kiểu "Đất nền tại Hoà Quý Đà Nẵng" trước đây chỉ bóc được TỈNH nên
// phường "Hoà Quý" bị bỏ rơi → gợi ý hiện sai thành "Đất nền tại Đà Nẵng".
// Xếp CHUỖI DÀI TRƯỚC để "ngu hanh son" thắng "hoa son", "hoa quy" thắng "hoa".
export type PlaceHit = { province: string; district?: string; ward?: string; label: string };

// Dựng LÚC CẦN (lần gõ đầu), không dựng lúc tải trang — dựng sẵn từng tốn ~200ms làm ô tìm chậm bấm được (đo 17/10/2026)
type NoiDG = { norm: string; ten: string[]; place: PlaceHit };
let _diaGioi: NoiDG[] | null = null;
let _theoChuDau: Map<string, NoiDG[]> | null = null;
function diaGioi(): NoiDG[] {
  if (_diaGioi) return _diaGioi;
  // trình duyệt chưa nạp địa danh → rỗng, chưa giữ (xem useDiaDanh)
  if (!daCoDiaDanh()) return [];
  _diaGioi = (() => {
  const ds: { norm: string; ten: string[]; place: PlaceHit }[] = [];
  for (const p of provinces) {
    for (const d of p.districts) {
      for (const w of d.wards) {
        const ten = w.replace(/\s*\(.*\)\s*$/, "").trim(); // "Sịa (TT)" → "Sịa"
        // dò theo TÊN RIÊNG (bỏ chữ cấp còn sót: "Phường Nghĩa Lộ") — giữ chữ cấp thì "phường nghĩa lộ" khớp trọn tên này, thắng nơi tỉnh web
        ds.push({ norm: normalizeVi(ten.replace(/^(Phường|Xã|Thị trấn)\s+(?=\D)/i, "")), ten: [], place: { province: p.name, district: d.name, ward: ten, label: `${ten}, ${d.name}, ${p.name}` } });
      }
      ds.push({ norm: normalizeVi(d.name), ten: [], place: { province: p.name, district: d.name, label: `${d.name}, ${p.name}` } });
    }
  }
  // TÊN CŨ HƠN (gộp TRƯỚC 30/06/2025 — "Hải Châu I", "Hải Châu II" → Phường Hải Châu): bảng địa danh ghi ở `cu` của từng quận
  // [tên, CHỈ SỐ PHƯỜNG MỚI trong provincesNew — xem đầu provincesOld.ts]; tin và khách vẫn dùng tên này (anh 07/11/2026: "phải đọc
  // chính xác địa chỉ") → quy về đúng phường HỆ MỚI đó (2 cấp: tỉnh → phường)
  // tên đã là phường cũ HIỆN CÓ trong cùng tỉnh mới ("Triệu Lăng") → không thêm bản "tên cũ hơn" chồng lên (quy sai phường mới)
  const coSan = new Set(ds.map((x) => `${x.place.province}|${x.norm}`));
  for (const p of provincesOld) {
    const moi = newProvinceOf(p.name);
    const dsMoi = provincesNew.find((x) => x.name === moi)?.wards ?? [];
    for (const d of p.districts) for (const [tenCu, i] of d.cu ?? []) {
      const phuong = dsMoi[i];
      if (!phuong) continue;
      const ten = tenCu.replace(/^(Phường|Xã|Thị trấn)\s+/i, "").trim();
      if (coSan.has(`${moi}|${normalizeVi(ten)}`)) continue;
      ds.push({ norm: normalizeVi(ten), ten: [], place: { province: moi, ward: phuong, label: `${phuong}, ${moi}` } });
    }
  }
  // PHƯỜNG XÃ MỚI (sau sáp nhập 2025) — trước đây bảng chỉ có phường xã CŨ nên "Hải Vân" (phường mới của Đà Nẵng) không có,
  // máy dò gần đúng ra "Hải Tân, Hải Dương" (rà 21/10/2026, ảnh chủ dự án). Lọc theo phường mới dùng đúng tên đầy đủ "Phường Hải Vân".
  for (const p of provincesNew) {
    for (const w of p.wards) {
      const ten = w.replace(/^(Phường|Xã|Thị trấn|Đặc khu)\s+/i, "").trim();
      ds.push({ norm: normalizeVi(ten), ten: [], place: { province: p.name, ward: w, label: `${w}, ${p.name}` } });
    }
  }
  // TÊN TỈNH / THÀNH — ĐỦ 34 TỈNH MỚI + 63 TỈNH CŨ (tỉnh cũ quy về tỉnh mới sau sáp nhập), cùng nguồn bảng chọn Khu vực (chủ dự án
  // 01/11/2026, ảnh: gõ "Quang tri" không ra gì — trước đây chỉ nhận tên tỉnh web đang có tin)
  for (const p of provincesNew) ds.push({ norm: normalizeVi(p.name), ten: [], place: { province: p.name, label: p.name } });
  for (const p of provincesOld) {
    const moi = newProvinceOf(p.name);
    if (normalizeVi(moi) !== normalizeVi(p.name)) ds.push({ norm: normalizeVi(p.name), ten: [], place: { province: moi, label: moi } }); // không ghi "(nay thuộc …)" (07/11/2026)
  }
  // tên có số La Mã cuối ("Hải Châu I") → khách gõ "hải châu 1" cũng khớp (soLaMaCuoi — cùng luật bộ so khu vực)
  for (const x of ds) x.norm = soLaMaCuoi(x.norm);
  for (const x of ds) x.ten = x.norm.split(" ");
  return ds.sort((a, b) => b.norm.length - a.norm.length);
  })();
  return _diaGioi;
}
// TRA THEO CHỮ ĐẦU của tên nơi: mỗi phím gõ chỉ soi các nơi bắt đầu bằng một chữ có trong câu, thay vì quét cả nghìn
// phường xã (điện thoại chậm từng mất cả giây mỗi phím — chủ dự án 17/10/2026)
function theoChuDau(): Map<string, NoiDG[]> {
  if (_theoChuDau) return _theoChuDau;
  if (!daCoDiaDanh()) return new Map();
  const m = new Map<string, NoiDG[]>();
  for (const x of diaGioi()) { const k = x.ten[0]; const ds = m.get(k); if (ds) ds.push(x); else m.set(k, [x]); }
  return (_theoChuDau = m);
}

// ── ĐỌC ĐỊA CHỈ THEO CÂY (anh 07/11/2026: "địa chỉ bắt buộc phải đọc được — admin, trường Toàn quốc đã có sẵn hết") ──
// CÙNG NGUỒN trường Khu vực: hệ mới tỉnh → phường/xã (provincesNew) · hệ cũ tỉnh → quận/huyện → phường/xã (provincesOld, kèm tên cũ hơn).
// ① tỉnh = tên tỉnh đầy đủ đứng SAU CÙNG (tinhTheoTenCuoi) · ② chỉ tìm tên trong ĐÚNG tỉnh đó (tỉnh mới: phường mới + mọi quận/phường cũ
// gộp vào; tỉnh cũ: quận/phường cũ của nó + phường mới) · ③ tên DÀI khớp trước; phường nằm trong quận cũng được nhắc thắng quận
const CAP_TEN = /^(Phường|Xã|Thị trấn|Đặc khu|Quận|Huyện|Thị xã|Thành phố)\s+/i;
type MucCay = { n: string; hit: PlaceHit; cap: "w" | "d"; quan?: string };
const _cay = new Map<string, MucCay[]>();
function cayCua(tinhMoi: string, chiTinhCu?: string): MucCay[] {
  const khoa = `${tinhMoi}|${chiTinhCu ?? ""}`;
  const co = _cay.get(khoa);
  if (co) return co;
  // số La Mã chỉ khi tên GỐC viết chữ in La Mã ("Hải Châu I" → "hai chau 1"); "Ba Vì" không phải "Ba VI" (07/11/2026)
  const nn = (t: string) => {
    const goc = t.replace(/\s*\(.*\)\s*$/, "").replace(CAP_TEN, "").trim();
    const n = normalizeVi(goc).replace(/[^a-z0-9]+/g, " ").trim();
    return / (I{1,3}|IV|VI{0,3}|IX|X)$/.test(goc) ? soLaMaCuoi(n) : n;
  };
  const ds: MucCay[] = [];
  const pm = provincesNew.find((p) => p.name === tinhMoi);
  for (const w of pm?.wards ?? []) ds.push({ n: nn(w), cap: "w", hit: { province: tinhMoi, ward: w, label: `${w}, ${tinhMoi}` } });
  for (const po of provincesOld) {
    if (po.newName !== tinhMoi || (chiTinhCu && po.name !== chiTinhCu)) continue;
    for (const d of po.districts) {
      ds.push({ n: nn(d.name), cap: "d", hit: { province: tinhMoi, district: d.name, label: `${d.name}, ${tinhMoi}` } });
      for (const w of d.wards) ds.push({ n: nn(w), cap: "w", quan: nn(d.name), hit: { province: tinhMoi, district: d.name, ward: w.replace(/\s*\(.*\)\s*$/, "").trim(), label: `${w}, ${d.name}, ${tinhMoi}` } });
      for (const [ten, i] of d.cu ?? []) { const w = pm?.wards[i]; if (w) ds.push({ n: nn(ten), cap: "w", hit: { province: tinhMoi, ward: w, label: `${w}, ${tinhMoi}` } }); }
    }
  }
  const ra = ds.filter((x) => x.n.length >= 2 || /^\d+$/.test(x.n)).sort((a, b) => b.n.length - a.n.length); // "Quận 3" giữ, chỉ khớp khi khách gõ kèm chữ cấp
  _cay.set(khoa, ra);
  return ra;
}
function docDiaChiCay(nq: string, tinh: string | null, goc = ""): PlaceHit | null {
  // câu khách gõ CÓ DẤU → tên trùng chữ khác dấu (Cẩm Giang · Cẩm Giàng, Đồng Tiến · Đông Tiến) chọn đúng tên khách gõ
  const goDau = goc && normalizeVi(goc) !== goc.normalize("NFC").toLowerCase() ? ` ${goc.normalize("NFC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ")} ` : "";
  const dau = (m: MucCay) => {
    if (!goDau) return true;
    const ten = (m.hit.ward ?? m.hit.district ?? "").replace(/\s*\(.*\)\s*$/, "").replace(CAP_TEN, "").normalize("NFC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
    return goDau.includes(` ${ten} `);
  };
  if (!daCoDiaDanh()) return null;
  const s = ` ${nq.replace(/[^a-z0-9]+/g, " ").trim()} `;
  // phần địa chỉ ĐỨNG TRƯỚC tên tỉnh (tên tỉnh không được khớp nhầm thành phường: "hà nội" ≠ phường Hà …)
  let truoc = s;
  let tinhCu: string | undefined;
  if (tinh) {
    tenTinhTrongCau(nq);
    let cuoi = -1, ten = "";
    for (const [n, t] of _tenTinh ?? []) { if (t !== tinh) continue; const i = s.lastIndexOf(` ${n} `); if (i > cuoi || (i === cuoi && n.length > ten.length)) { cuoi = i; ten = n; } }
    if (cuoi >= 0) { truoc = s.slice(0, cuoi + 1); tinhCu = provincesOld.find((p) => normalizeVi(p.name) === ten && p.name !== p.newName)?.name; }
  }
  const tim = (tinhMoi: string, cu?: string): PlaceHit | null => {
    const muc = cayCua(tinhMoi, cu);
    const CAP_W = ["phuong", "xa", "thi tran", "dac khu"], CAP_D = ["quan", "huyen", "thi xa", "thanh pho", "tp"];
    const CAP_MOI = [...CAP_W, ...CAP_D];
    // chữ CẤP khách gõ ngay trước tên: "w" (phường/xã) · "d" (quận/huyện/thị xã/thành phố) · null
    const capTruoc = (n: string): "w" | "d" | null => {
      for (const c of CAP_W) if (truoc.includes(` ${c} ${n} `)) return "w";
      for (const c of CAP_D) if (truoc.includes(` ${c} ${n} `)) return "d";
      return null;
    };
    // đúng dấu khách gõ trước (cùng mức thì giữ thứ tự tên dài trước)
    // tên CHỈ LÀ SỐ ("Phường 14", "Quận 3") chỉ nhận khi khách gõ kèm chữ cấp — "3 phòng ngủ" không phải Quận 3
    let khop = muc.filter((m) => truoc.includes(` ${m.n} `) && (!/^\d+$/.test(m.n) || capTruoc(m.n) !== null)).sort((a, b) => Number(dau(b)) - Number(dau(a)));
    if (!khop.length) return null;
    // VỊ TRÍ chữ trong câu — tên phường không được CHỒNG lên tên quận đã khớp ("sơn phú định hóa" không thành "phú đình")
    const tok = truoc.trim().split(" ");
    const vt = (n: string) => { const w = n.split(" "); const r: number[] = []; for (let i = 0; i + w.length <= tok.length; i++) if (tok.slice(i, i + w.length).join(" ") === n) r.push(i); return r; };
    const roiNhau = (a: string, b: string) => vt(a).some((i) => vt(b).some((j) => i + a.split(" ").length <= j || j + b.split(" ").length <= i));
    // phường/xã có QUẬN CŨ của nó cũng được nhắc, hai tên KHÔNG chồng nhau → chắc chắn đúng phường đó ("Phương Mai, Đống Đa")
    const quanKhop = khop.filter((m) => m.cap === "d");
    // TÊN XÃ MỚI DÀI CHỨA LUÔN TÊN HUYỆN ("Xã Nam Ban Lâm Hà") khớp trọn → chính xã đó, không tách thành xã cũ "Nam Ban" + huyện "Lâm Hà"
    const daiNhat = [...khop].sort((a, b) => b.n.length - a.n.length)[0];
    if (daiNhat.cap === "w" && quanKhop.some((q) => q.n !== daiNhat.n && ` ${daiNhat.n} `.includes(` ${q.n} `))) return daiNhat.hit;
    // phường và quận CÙNG SỐ ("Phường 3, Quận 3") được khi khách gõ đủ hai chữ cấp
    const cungSo = (m: MucCay) => m.n === m.quan && truoc.includes(` phuong ${m.n} `) && truoc.includes(` quan ${m.n} `);
    const chacChan = khop.filter((m) => m.cap === "w" && m.quan && (m.n !== m.quan || cungSo(m)) && quanKhop.some((q) => q.n === m.quan && (roiNhau(m.n, q.n) || cungSo(m))))
      .sort((a, b) => Number(dau(b)) - Number(dau(a)) || b.n.length - a.n.length)[0];
    if (chacChan) return chacChan.hit;
    // tên mà chữ đầu là CHỮ CẤP khách gõ ("phuong son" trong "phuong son tay") nhường cho tên đứng ngay sau chữ cấp đó ("son tay")
    khop = khop.filter((m) => {
      const c = CAP_MOI.find((x) => m.n.startsWith(`${x} `));
      return !c || !khop.some((x) => x !== m && truoc.includes(` ${c} ${x.n} `) && x.n.startsWith(m.n.slice(c.length + 1).split(" ")[0]));
    });
    // bỏ tên nằm trọn trong tên dài hơn đã khớp ("liet" của "phuong liet")
    const dai = khop.filter((m) => !khop.some((x) => x.n.length > m.n.length && ` ${x.n} `.includes(` ${m.n} `)));
    const quanGo = new Set(dai.filter((m) => m.cap === "d" && capTruoc(m.n) !== "w").map((m) => m.n));
    const phuong = dai.filter((m) => m.cap === "w");
    // ① phường/xã có QUẬN CŨ của nó cũng được nhắc (tên khác nhau) → đúng phường đó (hệ cũ 3 cấp)
    const coQuan = phuong.find((m) => m.quan && quanGo.has(m.quan) && m.n !== m.quan);
    if (coQuan) return coQuan.hit;
    // ② khách gõ chữ "phường/xã …" → phường/xã (hệ mới trước, rồi hệ cũ)
    const goW = phuong.filter((m) => capTruoc(m.n) === "w");
    if (goW.length) return (goW.find((m) => !m.quan) ?? goW[0]).hit;
    // ③ khách gõ "quận/huyện …" → quận/huyện
    const goD = dai.find((m) => m.cap === "d" && capTruoc(m.n) === "d");
    if (goD) return goD.hit;
    // ④ tên chỉ là phường/xã (không trùng tên quận đang khớp) → phường (hệ mới trước)
    const rieng = phuong.filter((m) => !quanGo.has(m.n));
    if (rieng.length) return (rieng.find((m) => !m.quan) ?? rieng[0]).hit;
    // ⑤ tên trùng quận/huyện → cấp lớn: quận/huyện
    const q = dai.find((m) => m.cap === "d");
    return q?.hit ?? phuong[0]?.hit ?? null;
  };
  if (tinh) return tim(tinh, tinhCu);
  return null;
}

// Câu có nhắc tên phường/quận nào không? Ưu tiên: đúng tỉnh người dùng nói →
// cấp SÂU nhất (phường trước quận) → tên dài nhất.
function timDiaGioi(nq: string, tinh: string[]): PlaceHit | null {
  // Lọc thô bằng includes (rất nhanh) rồi mới soi TRỌN TỪ bằng regex — tránh
  // "hoa" khớp vào "hoà xuân", "an" khớp vào "hoà an".
  const co = (t: string) =>
    nq.includes(t) && new RegExp(`(^|[^a-z0-9])${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`).test(nq);
  const chu = [...new Set(nq.split(/[^a-z0-9]+/).filter(Boolean))];
  const tho = chu.flatMap((c) => theoChuDau().get(c) ?? []).filter((x) => x.norm.length >= 4 && co(x.norm)).sort((a, b) => b.norm.length - a.norm.length);
  // Tên nằm TRỌN trong một tên dài hơn cũng khớp thì bỏ: "ngu hanh son" (quận) không được
  // đẻ ra phường "Hạnh Sơn" (Lào Cai) chỉ vì "hanh son" là đuôi của nó.
  const ung = tho.filter((x) => !tho.some((y) => y.norm.length > x.norm.length && ` ${y.norm} `.includes(` ${x.norm} `)));
  if (!ung.length) return timGanDung(nq, tinh);
  // KHÔNG CÓ TIN VẪN PHẢI HIỂU ĐỊA DANH (chủ dự án 01/11/2026): thành phố / quận / huyện ở MỌI tỉnh đều nhận ("đà lạt", "phú quốc",
  // "thủ đức"); chỉ PHƯỜNG ở tỉnh web chưa phục vụ mới bỏ (hay trùng tên đường — "Nguyễn Văn Linh", luật 18/10/2026)
  const hop = tinh.length ? ung.filter((x) => cungTinh(tinh, x.place.province)) : ung.filter((x) => TINH_WEB.has(x.place.province) || !x.place.ward);
  // Khách KHÔNG nêu tỉnh mà tên chỉ khớp phường ở tỉnh web chưa có tin (vd "nhà mặt phố Nguyễn Văn Linh" khớp phường Nguyễn
  // Văn Linh, Hưng Yên) → đó là tên ĐƯỜNG, không đoán sang tỉnh khác (rà 18/10/2026)
  if (!tinh.length && !hop.length) return null;
  // Khách ĐÃ NÊU tỉnh mà không có nơi nào khớp trong tỉnh đó → không nhảy sang tỉnh khác (21/10/2026)
  if (!hop.length) return null;
  // TRÙNG TÊN Ở NHIỀU TỈNH ("an hải": Đà Nẵng · Khánh Hòa) → nơi thuộc thị trường web phục vụ trước, theo thứ tự danh sách TINH
  // (Đà Nẵng, Huế… — nơi web có tin), như đoán gõ sai (timGanDung) — 01/11/2026
  const thuTu = (x: NoiDG) => { const i = TINH.findIndex(([t]) => t === x.place.province); return i < 0 ? 999 : i; };
  // KHÁCH GÕ RÕ CẤP "phường …" / "xã …" (07/11/2026) → chỉ xét phường/xã (bỏ quận, thị xã cũ trùng tên ở tỉnh khác: "phường thuận an"
  // từng ra thị xã Thuận An, Bình Dương); "phường" thì phường trước xã, "xã" thì xã trước
  const capGo = (x: NoiDG) => (nq.match(new RegExp(`(?:^|[^a-z0-9])(phuong|xa) ${x.norm}(?:[^a-z0-9]|$)`)) ?? [])[1];
  const coCap = hop.filter((x) => x.place.ward && capGo(x));
  const nguon = coCap.length ? coCap : hop;
  const dungCap = (x: NoiDG) => { const c = capGo(x); return !c ? 0 : normalizeVi(x.place.ward ?? "").startsWith(c === "xa" ? "xa " : "phuong ") ? 0 : 1; };
  const chon = [...nguon].sort((a, b) => dungCap(a) - dungCap(b) || thuTu(a) - thuTu(b));
  // Trùng tên giữa quận và phường (Hải Châu, Sơn Trà…) → lấy cấp LỚN: khách nói "Hải Châu" là quận Hải Châu
  // Đà Nẵng, không phải phường Hải Châu ở Ninh Bình — quận phải CÙNG TỈNH với phường trùng tên (không lấy thị xã Thuận An, Bình Dương
  // khi khớp phường Thuận An, Huế)
  const quan = chon.find((x) => !x.place.ward && chon.some((y) => y.place.ward && y.norm === x.norm && y.place.province === x.place.province));
  // …nhưng câu còn nêu PHƯỜNG nằm trong quận đó ("hòa xuân cẩm lệ") → lấy phường, quận chỉ là chữ ghi kèm (01/11/2026)
  const phuongTrong = quan && chon.find((y) => y.place.ward && y.norm !== quan.norm && y.place.district === quan.place.district && y.place.province === quan.place.province);
  if (phuongTrong) return phuongTrong.place;
  if (quan) return quan.place;
  return chon.find((x) => x.place.ward)?.place ?? chon[0].place;
}

// Che cụm chữ chung + tên tỉnh đã khớp trước khi dò phường/quận: "căn hộ sơn trà" không được ghép "hồ sơn",
// "2 phòng ngủ đà nẵng" không được đoán thành "Đăk Năng". "zz" không nằm trong tên nơi nào nên cắt đứt mọi ghép.
// Các tỉnh web đang phục vụ (danh sách TINH) — tên phường trùng ở tỉnh khác xếp sau
const TINH_WEB = new Set(TINH.map(([t]) => t));
const CUM_CHUNG = /\b(can ho|chung cu|nha dat|nha rieng|dat nen|ban dat|mua dat|ban nha|mua nha|thue nha|thue dat|phong ngu|phong tro|nha tro|van phong|mat bang|mat pho|du an|gia re|view bien|gan bien|cho thue|bat dong san|biet thu|lien ke)\b/g;
function cheChuChung(nq: string): string {
  let s = nq.replace(CUM_CHUNG, " zz ");
  // Che cả chữ ĐẶC ĐIỂM (trung tâm, gần chợ, gần trường, ô tô…) — trước đây "nhà trung tâm Đà Nẵng" bị hiểu thành phường
  // "Trung Tâm" ở Lào Cai (rà 21/10/2026, ảnh chủ dự án)
  for (const [, keys] of DAC_DIEM) for (const k of keys) if (s.includes(k)) s = s.replace(new RegExp(`\\b${k}\\b`, "g"), " zz ");
  // chỉ che TÊN TỈNH (khoá đầu) — tên thành phố như "hoi an", "nha trang" vẫn dò được tới phường/quận
  for (const [, keys] of TINH) { const k = keys[0]; if (s.includes(k)) s = s.replace(new RegExp(`\\b${k}\\b`, "g"), " zz "); }
  return s.replace(/\s+/g, " ").trim();
}

// GÕ SAI CHÍNH TẢ NHẸ (chủ dự án 17/10/2026): chỉ chạy khi KHÔNG tên nào khớp đúng. Tên ≥ 2 chữ, cả tên được
// sai đúng MỘT chữ cái ("ngu hang son" → Ngũ Hành Sơn). Chữ chung của câu tìm (bán, nhà, đất, căn hộ…) không
// bao giờ được đoán thành tên nơi — tránh "căn hộ" thành phường An Hải.
const TU_CHUNG = new Set(["nen", "ban", "mua", "nha", "dat", "can", "ho", "cho", "thue", "phong", "tro", "ngu", "pn", "duoi", "tren", "ty", "trieu", "gia", "re", "tai", "o", "gan", "bien", "view", "du", "an", "chung", "cu", "mat", "pho", "tim", "va", "co"]);
function lechMot(a: string, b: string): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > 1) return 2;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  const conA = a.slice(i), conB = b.slice(i);
  // thay một chữ · thêm một chữ · bớt một chữ
  return conA.slice(1) === conB.slice(1) || conA.slice(1) === conB || conA === conB.slice(1) ? 1 : 2;
}
// Tên tỉnh/thành gõ sai đúng MỘT chữ cái ("da nag" → Đà Nẵng, "nha trag" → Nha Trang). Chỉ tên ≥ 2 chữ, chữ chung
// của câu tìm không bao giờ bị đoán thành tên nơi.
function tinhGanDung(nq: string, raw = ""): string[] {
  const tu = nq.split(/[^a-z0-9]+/).filter(Boolean);
  // chữ khách gõ CÓ DẤU là chữ tiếng Việt thật, không phải gõ nhầm tên tỉnh ("ăn ngon" từng thành An Nhơn → Gia Lai — 01/11/2026)
  const goc = raw.normalize("NFC").toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const coDau = goc.length === tu.length ? goc.map((w, i) => w !== tu[i]) : tu.map(() => false);
  for (const [nhan, keys] of TINH) {
    for (const k of keys) {
      const ten = k.split(" ");
      if (ten.length < 2) continue;
      for (let i = 0; i + ten.length <= tu.length; i++) {
        const cua = tu.slice(i, i + ten.length);
        if (cua.every((w) => TU_CHUNG.has(w))) continue;
        if (coDau.slice(i, i + ten.length).some(Boolean)) continue;
        let lech = 0;
        for (let j = 0; j < ten.length && lech <= 1; j++) lech += ten[j] === cua[j] ? 0 : ten[j].length < 3 || TU_CHUNG.has(cua[j]) ? 2 : lechMot(ten[j], cua[j]);
        if (lech === 1) return [nhan];
      }
    }
  }
  return [];
}
function timGanDung(nq: string, tinh: string[]): PlaceHit | null {
  const tu = nq.split(/[^a-z0-9]+/).filter(Boolean);
  if (tu.length < 2) return null;
  // DIA_GIOI xếp tên DÀI trước → hop[0] là tên dài nhất khớp; tên ngắn nằm trong tên dài bị bỏ
  // ("hang son" không được thắng "ngu hang son")
  const hop: PlaceHit[] = [];
  let daiNhat = 0;
  for (const x of diaGioi()) {
    if (x.norm.length < daiNhat) break;
    const ten = x.ten;
    if (ten.length < 2 || x.norm.length < 6) continue;
    for (let i = 0; i + ten.length <= tu.length; i++) {
      const cua = tu.slice(i, i + ten.length);
      if (cua.every((w) => TU_CHUNG.has(w))) continue;
      let lech = 0;
      for (let k = 0; k < ten.length && lech <= 1; k++) lech += ten[k] === cua[k] ? 0 : ten[k].length < 3 || TU_CHUNG.has(cua[k]) ? 2 : lechMot(ten[k], cua[k]);
      if (lech === 1) { hop.push(x.place); daiNhat = x.norm.length; break; }
    }
  }
  if (!hop.length) return null;
  // Khách ĐÃ NÓI tên tỉnh ("… tại Huế") → chỉ đoán trong tỉnh đó; đoán ra nơi tỉnh khác là sai ý khách
  // (chủ dự án 17/10/2026: "Phòng trọ cho thuê tại Huế" từng bị đoán thành Phong Thổ, Lai Châu).
  if (tinh.length) {
    const trongTinh = hop.filter((p) => cungTinh(tinh, p.province));
    return trongTinh.find((p) => !p.ward) ?? trongTinh[0] ?? null;
  }
  // Gõ sai cả hai nơi đều gần đúng ("sơn tà" → Sơn Trà hay Sơn Tây) → nơi thuộc tỉnh web phục vụ, theo thứ tự danh sách
  // TINH (Đà Nẵng, Huế… trước) — thị trường chính của web.
  const thuTu = (x: PlaceHit) => { const i = TINH.findIndex(([t]) => t === x.province); return i < 0 ? 999 : i; };
  const dungTinh = hop.filter((p) => TINH_WEB.has(p.province)).sort((a, b) => thuTu(a) - thuTu(b));
  // Gõ gần đúng mà không nêu tỉnh: chỉ đoán trong tỉnh web phục vụ — đoán sang tỉnh khác là sai ý (chủ dự án 21/10/2026: nơi khác
  // thì khách phải gõ tỉnh; "Hải Vân" từng bị đoán thành "Hải Tân, Hải Dương")
  if (!dungTinh.length) return null;
  const chon = dungTinh;
  // gõ sai thì ưu tiên cấp LỚN (quận) — chắc ý hơn một phường trùng tên ở nơi khác
  return chon.find((p) => !p.ward) ?? chon[0];
}

// SỬA CHÍNH TẢ KIỂU GOOGLE (chủ dự án 17/10/2026, ảnh "Đang hiển thị kết quả cho can hộ 2 phong ngu…"): chữ gõ sai đúng
// MỘT chữ cái so với một chữ có trong từ điển nhà đất (loại nhà · tỉnh · phường xã · đặc điểm · chữ chung) → thay bằng chữ
// đúng; giữ nguyên các chữ còn lại như khách gõ. Không sai chữ nào → null.
let TU_DIEN: Set<string> | null = null;
// Chữ có DẤU của từng chữ trong từ điển — câu đã sửa hiện ra đủ dấu như Google ("can ho" → "căn hộ")
let CO_DAU: Map<string, string> | null = null;
function tuDien(): Set<string> {
  if (TU_DIEN) return TU_DIEN;
  const s = new Set<string>();
  const dau = new Map<string, string>();
  const them = (x: string) => x.split(/[^a-z0-9]+/).forEach((w) => { if (w.length >= 2) s.add(w); });
  const ghiDau = (x: string) => x.toLowerCase().split(/[\s,()/]+/).forEach((w) => { const n = normalizeVi(w).replace(/[^a-z0-9]/g, ""); if (n.length >= 2 && !dau.has(n)) dau.set(n, w); });
  ghiDau("bán mua thuê cho căn nhà đất phòng ngủ trọ dưới trên tỷ triệu gần biển sông view tại ở hướng giá rẻ mới xây hẻm phố mặt tiền chung cư dự án nguyên ghép trường học bệnh viện chợ trung tâm thành quận huyện phường xã đường kiệt hộ nền riêng biệt thự liền kề bằng văn sổ hồng đỏ nội thất kho xưởng");
  for (const [ten, keys] of LOAI_HINH) { keys.forEach(them); ghiDau(ten); }
  for (const [ten, keys] of TINH) { keys.forEach(them); ghiDau(ten); }
  for (const [ten, keys] of DAC_DIEM) { keys.forEach(them); ghiDau(ten); }
  for (const x of diaGioi()) { them(x.norm); ghiDau(x.place.ward ?? x.place.district ?? ""); }
  them("ban mua thue cho can nha dat phong ngu tro duoi tren ty trieu gan bien song view tai o huong gia re moi xay hem pho mat tien chung cu du an nguyen ghep truong hoc benh vien cho trung tam thanh quan huyen phuong xa duong kiet");
  TU_DIEN = s;
  CO_DAU = dau;
  return s;
}
const coDau = (n: string) => CO_DAU?.get(n) ?? n;
// MỌI TÊN NƠI CẢ NƯỚC, HAI HỆ (tỉnh mới · phường/xã mới · tỉnh cũ · quận/huyện cũ · phường/xã cũ · tên cũ hơn), bỏ dấu, từ 2 chữ — để bộ sửa
// chính tả KHÔNG ĐỤNG vào tên nơi khách gõ (anh 07/11/2026: "địa chỉ bắt buộc phải đọc được"). Cụm toàn chữ nhà đất ("bản nhà") không tính.
let _tenNoiDu: Set<string> | null = null;
const _tenNoiDau = new Set<string>(); // cùng các tên, GIỮ DẤU, viết thường — khách gõ đúng dấu một tên có thật thì không đổi
function tenNoiDu(): Set<string> {
  if (_tenNoiDu) return _tenNoiDu;
  const s = new Set<string>();
  const them = (ten?: string) => {
    const n = normalizeVi((ten ?? "").replace(/\s*\(.*\)\s*$/, "").replace(/^(Phường|Xã|Thị trấn|Đặc khu|Quận|Huyện|Thị xã|Thành phố)\s+/i, "")).replace(/[^a-z0-9]+/g, " ").trim();
    const w = n.split(" ");
    if (w.length >= 2 && w.length <= 5 && !w.every((x) => TU_NHA_DAT.has(x))) { s.add(n); _tenNoiDau.add((ten ?? "").replace(/\s*\(.*\)\s*$/, "").replace(/^(Phường|Xã|Thị trấn|Đặc khu|Quận|Huyện|Thị xã|Thành phố)\s+/i, "").normalize("NFC").toLowerCase().trim()); }
  };
  for (const p of provincesNew) { them(p.name); p.wards.forEach(them); }
  for (const p of provincesOld) { them(p.name); for (const d of p.districts) { them(d.name); d.wards.forEach(them); d.cu?.forEach(([t]) => them(t)); } p.huyenCuHon?.forEach((h) => them(h.name)); }
  _tenNoiDu = s;
  return s;
}
/** Vị trí các chữ (theo mảng chữ đã bỏ dấu, phần tử rỗng = khoảng trắng) nằm trong một tên nơi — cụm dài khớp trước */
function viTriTenNoi(nTok: string[]): Set<number> {
  const ten = tenNoiDu();
  const viTri = nTok.map((t, i) => (t ? i : -1)).filter((i) => i >= 0);
  const ra = new Set<number>();
  for (let a = 0; a < viTri.length; a++) for (let k = Math.min(5, viTri.length - a); k >= 2; k--) {
    const ds = viTri.slice(a, a + k);
    if (ten.has(ds.map((i) => nTok[i]).join(" "))) { ds.forEach((i) => ra.add(i)); break; }
  }
  return ra;
}

/** TÊN NƠI ĐANG GÕ DỞ ở cuối câu → điền trọn, kiểu Google (anh 07/11/2026: "căn ho ngủ hanh" từng gợi ý "căn hộ ngủ hanh huế"):
 *  2–3 chữ cuối là phần đầu của ĐÚNG MỘT tên nơi (chữ trước khớp trọn, chữ cuối là đầu chữ) → thay bằng tên đủ dấu ("căn hộ ngũ hành sơn"). */
export function hoanTenNoiCuoi(raw: string): string | null {
  if (!daCoDiaDanh()) return null;
  const tu = raw.trim().split(/\s+/).filter(Boolean);
  const nt = tu.map((t) => normalizeVi(t).replace(/[^a-z0-9]/g, ""));
  const noi = cumNoi();
  for (let k = Math.min(3, nt.length); k >= 2; k--) {
    const duoi = nt.slice(-k);
    if (duoi[k - 1].length < 2) continue;
    const ung = [...noi.keys()].filter((c) => {
      const w = c.split(" ");
      return w.length > k - 1 && duoi.every((d, j) => (j < k - 1 ? w[j] === d : w[j].startsWith(d))) && c !== duoi.join(" ");
    });
    const ten = [...new Set(ung.map((c) => noi.get(c)!))];
    if (ten.length === 1) return [...tu.slice(0, -k), ten[0]].join(" ");
    if (ten.length > 1) return null;
  }
  return null;
}

export function suaChinhTa(raw: string): string | null {
  // Chưa có địa danh thì từ điển thiếu tên phường xã → "sửa" nhầm tên nơi khách gõ đúng. Tạm không sửa (vài trăm ms đầu).
  if (!daCoDiaDanh()) return null;
  const td = tuDien();
  let doi = false;
  // CHỮ NẰM TRONG TÊN NƠI không đặt lại dấu theo chữ nhà đất (anh 07/11/2026: "ngũ hành sơn" từng thành "ngủ hành sơn" vì "ngủ" của phòng ngủ;
  // "Đội Cấn" thành "Đội căn", "Tây Hồ" thành "Tây hộ") — TÊN NƠI CẢ NƯỚC, HAI HỆ (tenNoiDu), không chỉ tỉnh web phục vụ
  const nTok = raw.split(/(\s+)/).map((t) => normalizeVi(t).replace(/[^a-z0-9]/g, ""));
  const trongTenNoi = viTriTenNoi(nTok);
  const kq = raw.split(/(\s+)/).map((tok, viTri) => {
    const n = normalizeVi(tok).replace(/[^a-z0-9]/g, "");
    // CHỮ NHÀ ĐẤT GÕ SAI DẤU ("đât" → "đất", "gân" → "gần", 07/11/2026): chỉ chữ trong từ điển nhà đất (không đụng tên nơi — "hóa"/"hòa")
    if (trongTenNoi.has(viTri)) return tok; // chữ thuộc tên nơi: giữ nguyên như khách gõ
    const dauDung = CHU_NHA_DAT.get(n);
    if (dauDung && normalizeVi(tok) !== tok.toLowerCase() && tok.toLowerCase() !== dauDung) { doi = true; return dauDung; }
    if (n.length < 4 || /\d/.test(n) || td.has(n)) return tok; // chữ ngắn (sun, an…) dễ đoán nhầm — "sun cosmo" thành "sung"
    if (/[/\-]/.test(tok)) return tok; // "triệu/tháng", "2-3" — khách cố ý viết liền bằng dấu, không phải gõ sai (01/11/2026)
    // CHỮ ĐANG GÕ DỞ (là phần đầu của một chữ có thật: "thiế" → "thiết") thì không sửa — "phan thiế" từng thành "phan thiện"
    for (const w of td) if (w.length > n.length && w.startsWith(n)) return tok;
    // GÕ THỪA CHỮ LẶP ("xuaan", "nhaa"): bỏ chữ lặp mà ra chữ có thật → lấy chữ đó, xét TRƯỚC tách chữ dính ("xuaan" từng thành "xùa án")
    const boLap = n.replace(/(.)\1+/g, "$1");
    if (boLap !== n && td.has(boLap)) { doi = true; return coDau(boLap); }
    // HAI CHỮ DÍNH LIỀN (quên dấu cách): "tạiphan" → "tại phan", "canho" → "căn hộ"
    for (let k = 2; k <= n.length - 2; k++) {
      if (td.has(n.slice(0, k)) && td.has(n.slice(k))) { doi = true; return `${coDau(n.slice(0, k))} ${coDau(n.slice(k))}`; }
    }
    // chữ gần đúng: lệch đúng một chữ cái, cùng chữ đầu; ưu tiên chữ DÀI hơn (khách hay gõ thiếu chữ: "phog" → "phòng")
    let tot = "";
    for (const w of td) {
      if (w[0] !== n[0] || Math.abs(w.length - n.length) > 1 || lechMot(w, n) !== 1) continue;
      if (w.length > tot.length) tot = w;
    }
    if (!tot) return tok;
    doi = true;
    return coDau(tot);
  });
  // CỤM HAI CHỮ QUEN (căn hộ, phòng ngủ, view biển…): chữ gõ sai trùng một chữ có thật ("họi" là chữ của "Hội An") vẫn sửa được
  // khi chữ đứng cạnh khớp cụm; cụm đúng chữ mà SAI/THIẾU DẤU cũng đặt lại dấu — "căn họi" → "căn hộ", "view biên" → "view biển"
  const tu = kq.join("").split(/\s+/).filter(Boolean);
  const nt = tu.map((t) => normalizeVi(t).replace(/[^a-z0-9]/g, ""));
  const daCum = new Set<number>(); // vị trí chữ đã khớp cụm nhà đất quen
  const noiTu = viTriTenNoi(nt); // chữ thuộc tên nơi (cả nước) — cụm nhà đất không ghép đè lên
  for (let i = 0; i + 1 < nt.length; i++) {
    if (noiTu.has(i) || noiTu.has(i + 1)) continue;
    let khop = CUM_QUEN.has(`${nt[i]} ${nt[i + 1]}`) ? `${nt[i]} ${nt[i + 1]}` : "";
    if (!khop) {
      for (const c of CUM_QUEN.keys()) {
        const [a, b] = c.split(" ");
        // chữ gõ là CHỮ CÓ NGHĨA (mặt, văn…) thì chỉ sửa khi gõ thừa/thiếu một chữ cái ("họi" → "hộ"), không đổi sang chữ
        // khác cùng độ dài — "nhà mặt phố" không thành "nhà đất phố", "nguyễn văn linh" không thành "nguyên căn" (rà 18/10/2026)
        const duocDoi = (goc: string, dung: string) => goc.length >= 2 && lechMot(dung, goc) === 1 && (!td.has(goc) || goc.length !== dung.length);
        if ((nt[i] === a && duocDoi(nt[i + 1], b)) || (nt[i + 1] === b && duocDoi(nt[i], a))) { khop = c; break; }
      }
    }
    if (!khop) continue;
    const [da, db] = CUM_QUEN.get(khop)!.split(" ");
    if (tu[i].toLowerCase() !== da || tu[i + 1].toLowerCase() !== db) { tu[i] = da; tu[i + 1] = db; doi = true; }
    daCum.add(i); daCum.add(i + 1);
    [nt[i], nt[i + 1]] = khop.split(" ");
    i++;
  }
  // TÊN NƠI (tỉnh, phường xã, quận cũ) GÕ SAI DẤU hoặc SAI MỘT CHỮ CÁI (anh 07/11/2026, ảnh Google "đât nên hoa xuân đag năng" → "đất nền
  // hòa xuân đà nẵng"): cụm 2–4 chữ khớp tên nơi → đặt đúng chữ. Gõ KHÔNG DẤU mà đúng chữ ("da nang") thì để nguyên, như Google.
  const noi = cumNoi();
  const chiDatDau: [number, string[]][] = [];
  for (let i = 0; i < nt.length; i++) {
    for (let k = Math.min(4, nt.length - i); k >= 2; k--) {
      const go = nt.slice(i, i + k);
      // chữ chỉ CẤP (phường, xã, quận…) không phải tên nơi; cụm khách đã gõ ĐỦ DẤU thì tin chữ khách ("phường sơn" không thành "Phượng Sơn")
      // khách gõ ĐÚNG DẤU một tên nơi có thật (bất kỳ tỉnh nào: "Đại Thanh", "Phú Linh") → giữ nguyên, không đổi sang tên tỉnh web gần giống
      tenNoiDu();
      if (_tenNoiDau.has(tu.slice(i, i + k).join(" ").normalize("NFC").toLowerCase())) { i += k - 1; break; }
      if (go.some((w) => CHU_CAP.has(w)) || tu.slice(i, i + k).every((t, j) => normalizeVi(t) !== t.toLowerCase() && td.has(go[j]))) continue;
      let dung = noi.get(go.join(" "));
      if (!dung) {
        // đúng MỘT chữ lệch một chữ cái, các chữ kia trùng — và chỉ một tên nơi khớp kiểu đó (nhiều tên thì không đoán)
        // chữ đã thuộc cụm nhà đất vừa sửa ("đất nền") không đem so tên nơi — "đât nên" từng thành "đăk nên"
        if (go.some((_, j) => daCum.has(i + j))) continue;
        const gan = (noiTheoSo.get(k) ?? []).filter((c) => {
          const w = c.split(" "); let lech = 0;
          // chữ khách gõ là chữ CÓ NGHĨA thì không đổi sang chữ khác ("đất" không thành "đăk", "phường hòa" không thành "Hướng Hóa")
          // tên nơi TỪ 3 CHỮ mà các chữ kia khớp đúng ("nhu hành sơn" → Ngũ Hành Sơn, anh 07/11/2026) thì đủ chắc, cho đổi cả chữ có nghĩa
          for (let j = 0; j < k; j++) if (w[j] !== go[j]) { if (lechMot(w[j], go[j]) !== 1 || go[j].length < 2 || (td.has(go[j]) && k < 3)) return false; lech++; }
          return lech === 1;
        });
        // nhiều tên gần đúng → ưu tiên tên TỈNH ("đag năng" → Đà Nẵng); vẫn nhiều thì không đoán
        const tinhGan = gan.filter((c) => TEN_TINH_KHOA.has(c));
        const chon = gan.length === 1 ? gan : tinhGan.length === 1 ? tinhGan : [];
        if (chon.length === 1) dung = noi.get(chon[0]);
      }
      if (!dung) continue;
      const dungTu = dung.split(" ");
      const goTu = tu.slice(i, i + k).map((t) => t.toLowerCase());
      const khongDau = goTu.every((t) => normalizeVi(t) === t);
      const daDung = goTu.every((t, j) => t === dungTu[j]);
      if (!daDung && !(khongDau && go.join(" ") === normalizeVi(dung))) { tu.splice(i, k, ...dungTu); nt.splice(i, k, ...normalizeVi(dung).split(" ")); doi = true; }
      // gõ không dấu mà đúng chữ: chỉ đặt dấu khi câu đằng nào cũng sửa (dòng "Đang hiển thị kết quả cho" đủ dấu: "bán nhà sơn trà")
      else if (!daDung) chiDatDau.push([i, dungTu]);
      i += k - 1;
      break;
    }
  }
  if (doi) for (const [i, ds] of chiDatDau) tu.splice(i, ds.length, ...ds);
  // CHỮ GÕ LẶP LIỀN NHAU ("đất nền nen hòa xuân") → bỏ chữ lặp, như Google (07/11/2026); số thì giữ ("2 2" hiếm, không đoán)
  const noiLap = viTriTenNoi(tu.map((t) => normalizeVi(t).replace(/[^a-z0-9]/g, "")));
  for (let i = tu.length - 1; i > 0; i--) {
    const a = normalizeVi(tu[i]), b = normalizeVi(tu[i - 1]);
    // hai chữ CÙNG CÓ DẤU mà khác dấu là hai chữ khác nhau ("phòng ngủ Ngũ Hành Sơn") — không phải gõ lặp
    const khacDau = normalizeVi(tu[i]) !== tu[i].toLowerCase() && normalizeVi(tu[i - 1]) !== tu[i - 1].toLowerCase() && tu[i].toLowerCase() !== tu[i - 1].toLowerCase();
    // chữ thuộc tên nơi ("Phường Phương Liệt", "Ngọc Hà Hà Nội") không phải gõ lặp
    if (a && a === b && !/\d/.test(a) && !khacDau && !noiLap.has(i) && !noiLap.has(i - 1)) { tu.splice(i, 1); doi = true; }
  }
  // chữ chỉ cấp gõ không dấu cũng đặt dấu khi câu đằng nào cũng sửa ("quan cẩm lệ" → "quận cẩm lệ", "thanh pho" → "thành phố")
  const noiCap = viTriTenNoi(tu.map((t) => normalizeVi(t).replace(/[^a-z0-9]/g, ""))); // "Quán Thánh", "Phúc Xá", "Thành phố …" trong tên nơi: không đổi thành "quận", "xã"
  if (doi) for (let i = 0; i < tu.length; i++) {
    if (noiCap.has(i)) continue;
    const t = tu[i].toLowerCase();
    if (t === "thanh" && normalizeVi(tu[i + 1] ?? "") === "pho") { tu[i] = "thành"; tu[i + 1] = "phố"; i++; continue; }
    const cap: Record<string, string> = { phuong: "phường", xa: "xã", quan: "quận", huyen: "huyện" };
    if (cap[t]) tu[i] = cap[t];
  }
  return doi ? tu.join(" ") : null;
}
// Chữ nhà đất → đúng dấu (một nghĩa trong lĩnh vực này): dùng để đặt lại dấu khi khách gõ SAI dấu
const CHU_NHA_DAT = new Map("bán mua thuê căn nhà đất phòng ngủ trọ dưới trên tỷ triệu gần biển sông giá rẻ mới xây hẻm phố mặt tiền chung cư dự án nguyên ghép trường chợ trung tâm đường kiệt hộ nền riêng biệt thự liền kề văn sổ hồng đỏ nội thất kho xưởng"
  .split(" ").map((w) => [normalizeVi(w), w] as [string, string]));
const CHU_CAP = new Set(["phuong", "xa", "quan", "huyen", "tp"]); // "thanh", "pho"… nằm trong tên nơi (Thanh Khê) — không chặn
const TEN_TINH_KHOA = new Set(TINH.map(([t]) => normalizeVi(t).replace(/[^a-z0-9]+/g, " ").trim()));
const TU_NHA_DAT = new Set(["ban", "mua", "nha", "dat", "thue", "cho", "can", "ho", "gia", "tai", "duoi", "tren", "gan", "phong", "view"]);
// Tên nơi (bỏ chữ cấp) → chữ đúng dấu, viết thường; dựng một lần
let CUM_NOI: Map<string, string> | null = null;
const noiTheoSo = new Map<number, string[]>();
function cumNoi(): Map<string, string> {
  if (CUM_NOI) return CUM_NOI;
  const m = new Map<string, string>();
  const them = (ten?: string) => {
    const t = (ten ?? "").replace(/^(Phường|Xã|Thị trấn|Đặc khu|Quận|Huyện|Thị xã|Thành phố|TP\.?)\s+/i, "").toLowerCase().trim();
    const n = normalizeVi(t).replace(/[^a-z0-9]+/g, " ").trim();
    const so = n.split(" ").length;
    if (so < 2 || so > 4 || m.has(n)) return;
    m.set(n, t);
    noiTheoSo.set(so, [...(noiTheoSo.get(so) ?? []), n]);
  };
  for (const [ten] of TINH) them(ten);
  // chỉ nơi thuộc tỉnh web phục vụ — tên phường tỉnh khác trùng chữ nhà đất ("bản …") sẽ sửa nhầm câu khách
  for (const x of diaGioi()) if (TINH_WEB.has(x.place.province)) { them(x.place.ward); them(x.place.district); }
  // cụm có chữ nhà đất chung (bán, nhà, đất…) không phải tên nơi khách gõ
  for (const n of [...m.keys()]) if (n.split(" ").some((w) => TU_NHA_DAT.has(w))) m.delete(n);
  for (const [so, ds] of noiTheoSo) noiTheoSo.set(so, ds.filter((n) => m.has(n)));
  CUM_NOI = m;
  return m;
}
const CUM_QUEN = new Map([
  ["can ho", "căn hộ"], ["chung cu", "chung cư"], ["phong ngu", "phòng ngủ"], ["dat nen", "đất nền"], ["nha rieng", "nhà riêng"],
  ["nha pho", "nhà phố"], ["biet thu", "biệt thự"], ["lien ke", "liền kề"], ["mat bang", "mặt bằng"], ["van phong", "văn phòng"],
  ["phong tro", "phòng trọ"], ["nha tro", "nhà trọ"], ["view bien", "view biển"], ["ven bien", "ven biển"], ["view song", "view sông"], ["gan bien", "gần biển"],
  ["mat tien", "mặt tiền"], ["so hong", "sổ hồng"], ["so do", "sổ đỏ"], ["noi that", "nội thất"], ["du an", "dự án"],
  ["cho thue", "cho thuê"], ["ban nha", "bán nhà"], ["ban dat", "bán đất"], ["mua nha", "mua nhà"], ["mua dat", "mua đất"],
  ["thue nha", "thuê nhà"], ["nguyen can", "nguyên căn"], ["o ghep", "ở ghép"], ["kho xuong", "kho xưởng"], ["nha dat", "nhà đất"],
  // "gâm trung tâm", "gia rẽ" (01/11/2026, câu ví dụ chủ dự án) — các cụm "gần …", "giá rẻ" khách hay gõ sai
  ["gan trung", "gần trung"], ["gan cho", "gần chợ"], ["gan truong", "gần trường"], ["gan song", "gần sông"], ["gia re", "giá rẻ"],
]);

// Đặc điểm mô tả — khớp vào tiêu đề/mô tả tin
// DAC_DIEM: MỘT NGUỒN ở filters.ts (trường Lọc thêm → Đặc điểm đọc cùng bảng này, 07/11/2026)

// Từ nối / từ vô nghĩa khi chấm điểm
const TU_BO = new Set([
  "tai", "o", "co", "va", "cua", "cho", "voi", "gia", "can", "mua", "ban", "thue",
  "nha", "bat", "dong", "san", "bds", "khu", "vuc", "duoi", "tren", "tu", "den", "khoang",
  // "dự án" xuất hiện ở gần như mọi dự án → giữ lại chỉ gây nhiễu điểm
  "du", "an", "du an", "cac", "mot", "nao", "khong",
]);

export type ParsedQuery = {
  raw: string;
  purpose: "ban" | "thue" | null;
  types: string[];      // nhãn loại hình
  places: string[];     // nhãn tỉnh/thành
  place: PlaceHit | null; // địa giới SÂU nhất bóc được (phường → quận → tỉnh)
  beds: number | null;
  priceMaxTy: number | null;
  priceMinTy: number | null;
  features: string[];   // nhãn đặc điểm
  terms: string[];      // từ khoá còn lại (đã bỏ dấu) để chấm điểm & bôi đậm
  highlight: string[];  // các cụm chữ NGUYÊN BẢN để bôi đậm trong kết quả
};

function timTuDien(nq: string, dict: [string, string[]][], nhuong = false): string[] {
  const cau = ` ${nq.replace(/[^a-z0-9]+/g, " ")} `;
  const trung = dict.map(([nhan, keys]) => ({ nhan, k: keys.filter((k) => cau.includes(` ${k} `)) })).filter((x) => x.k.length);
  // Cụm ngắn nằm trong cụm dài của nhãn khác thì nhường ("khu nghi duong" → Khu nghỉ dưỡng, không thêm Condotel vì "nghi duong";
  // "dat trang trai" → Đất nông nghiệp, không thêm Đất nền vì "dat") — 29/10/2026
  const tuNoi = (ngan: string, dai: string) => dai !== ngan && ` ${dai} `.includes(` ${ngan} `);
  return trung
    .filter((x) => !nhuong || !x.k.every((k) => trung.some((y) => y !== x && y.k.some((d) => tuNoi(k, d)))))
    .map((x) => x.nhan);
}

// "3 phòng ngủ" / "3pn" / "3 pn" → 3
function bocPhongNgu(nq: string): number | null {
  const m = nq.match(/(\d+)\s*(pn|phong ngu|phòng ngủ)/);
  return m ? Number(m[1]) : null;
}

// "dưới 3 tỷ" · "từ 2 đến 5 tỷ" · "500 triệu" → khoảng giá (đơn vị TỶ)
function bocGia(nq: string): { min: number | null; max: number | null } {
  const soTy = (s: string, dv: string) => (dv.startsWith("tr") ? Number(s.replace(",", ".")) / 1000 : Number(s.replace(",", ".")));
  const khoang = nq.match(/(?:tu\s*)?(\d+[.,]?\d*)\s*(?:-|den|toi)\s*(\d+[.,]?\d*)\s*(ty|ti|trieu|tr)\b/);
  if (khoang) return { min: soTy(khoang[1], khoang[3]), max: soTy(khoang[2], khoang[3]) };
  const duoi = nq.match(/(?:duoi|nho hon|<)\s*(\d+[.,]?\d*)\s*(ty|ti|trieu|tr)\b/);
  if (duoi) return { min: null, max: soTy(duoi[1], duoi[2]) };
  const tren = nq.match(/(?:tren|lon hon|>)\s*(\d+[.,]?\d*)\s*(ty|ti|trieu|tr)\b/);
  if (tren) return { min: soTy(tren[1], tren[2]), max: null };
  // MỘT MỨC GIÁ ("800 triệu", "khoảng 5 tỷ", "3,5 tỷ", "10 triệu/tháng") → khoảng ±15% quanh mức đó (01/11/2026: trước đây bỏ qua)
  const mot = nq.match(/(\d+[.,]?\d*)\s*(ty|ti|trieu|tr)\b/);
  if (mot) { const g = soTy(mot[1], mot[2]); return { min: Math.round(g * 0.85 * 100000) / 100000, max: Math.round(g * 1.15 * 100000) / 100000 }; }
  return { min: null, max: null };
}

// NHỚ KẾT QUẢ (chủ dự án 17/10/2026: điện thoại gõ mỗi phím 0,4–3 giây): một câu bị phân tích 5–6 lần mỗi phím
// (menu, trường lọc, gợi ý, đường dẫn…) và mỗi lần dò cả nghìn phường xã → câu đã phân tích thì trả lại ngay.
const daPhanTich = new Map<string, ParsedQuery>();
export function parseQuery(raw: string): ParsedQuery {
  const co = daPhanTich.get(raw);
  if (co) return co;
  const kq = phanTichCau(raw);
  if (!daCoDiaDanh()) return kq; // chưa có địa danh → kết quả thiếu phường/quận, không ghi nhớ
  if (daPhanTich.size > 300) daPhanTich.clear();
  daPhanTich.set(raw, kq);
  return kq;
}
// ── TỪ MÁY CHƯA HIỂU (chủ dự án 21/10/2026: "không hiểu một câu khác với không hiểu một từ — từ ghép tiếng Việt").
// Bỏ khỏi câu mọi chữ đã vào trường (mục đích · loại hình · khu vực · giá · phòng ngủ · đặc điểm, cùng cụm do nơi gọi đưa
// vào như tên dự án) và chữ nối; còn lại là các TỪ ngoài các trường ("sân vườn", "nở hậu", "Nguyễn Văn Linh") → trả về
// đúng chữ khách gõ, các cụm cách nhau dấu phẩy, để giữ nguyên trong gợi ý và dò trong nội dung tin. Hiểu hết → "".
const CUM_CHUNG_HIEU = ["cho thue", "can mua", "can ban", "can thue", "can tim", "mua ban", "mua", "ban", "thue",
  "nha dat", "bat dong san", "bds", "nha", "du an", "thanh pho", "thi xa", "thi tran", "gia re", "sang nhuong"];
const TU_NOI = new Set(["tai", "o", "co", "va", "cua", "voi", "tim", "khu", "vuc", "hoac", "hay", "la", "cac", "mot", "nao", "gan",
  "thuoc", "quanh", "khong", "gia", "phuong", "xa", "quan", "huyen", "tinh", "tp", "muon", "dang"]);
const boCapNoi = (s: string) => normalizeVi(s).replace(/^(phuong|xa|thi tran|dac khu|quan|huyen|thanh pho|thi xa|tp)\s+/, "").trim();
// ── ĐỌC CÁC MỤC "LỌC THÊM" TRONG CÂU GÕ (chủ dự án 01/11/2026: "phần lọc thêm bạn đã không chú ý nên đọc toàn sai") — hướng, pháp lý,
// nội thất đọc thẳng ra TRƯỜNG LỌC (rồi bộ lọc khớp ô dữ liệu + vòng 2 nội dung), không còn là chữ dò trong bài. Phòng ngủ đã đọc (beds).
const HUONG_CAU: [RegExp, string][] = [
  [/\bhuong dong nam\b/, "Đông Nam"], [/\bhuong dong bac\b/, "Đông Bắc"], [/\bhuong tay nam\b/, "Tây Nam"], [/\bhuong tay bac\b/, "Tây Bắc"],
  [/\bhuong dong\b/, "Đông"], [/\bhuong tay\b/, "Tây"], [/\bhuong nam\b/, "Nam"], [/\bhuong bac\b/, "Bắc"],
];
const PHAP_LY_CAU: [RegExp, string][] = [[/\bso (do|hong)\b/, "Sổ đỏ / Sổ hồng"], [/\bhop dong mua ban\b/, "Hợp đồng mua bán"], [/\bcho so\b/, "Đang chờ sổ"]];
const NOI_THAT_CAU: [RegExp, string][] = [
  [/\b(full|day du|du) noi that\b|\bnoi that (day du|cao cap|full)\b/, "Đầy đủ nội thất"],
  [/\bnoi that co ban\b/, "Nội thất cơ bản"], [/\b(nha trong|noi that trong|ban giao tho)\b/, "Nội thất trống"],
];
// Lọc thêm còn 2 công tắc (Tin xác thực · Môi giới chuyên nghiệp) + Tình trạng của mục Dự án (truongDuAn.TINH_TRANG_DU_AN)
const XAC_THUC_CAU = /\b(tin )?(da )?xac thuc\b/;
const MOI_GIOI_CAU = /\bmoi gioi( chuyen nghiep)?\b/;
const TINH_TRANG_CAU: [RegExp, string][] = [[/\bsap mo ban\b/, "Sắp mở bán"], [/\bdang mo ban\b/, "Đang mở bán"], [/\bda ban giao\b/, "Đã bàn giao"], [/\bda hoan thanh\b/, "Đã hoàn thành"]];
export function docLocThem(raw: string): { direction: string; legal: string; furnishing: string; verified: boolean; broker: boolean; tinhTrang: string; cum: string[] } {
  const nq = normalizeVi(raw).replace(/[^a-z0-9]+/g, " ");
  const lay = (ds: [RegExp, string][]) => { const x = ds.find(([re]) => re.test(nq)); return x ? { gt: x[1], cum: nq.match(x[0])![0] } : null; };
  const h = lay(HUONG_CAU), l = lay(PHAP_LY_CAU), n = lay(NOI_THAT_CAU), tt = lay(TINH_TRANG_CAU);
  const xt = nq.match(XAC_THUC_CAU)?.[0], mg = nq.match(MOI_GIOI_CAU)?.[0];
  return {
    direction: h?.gt ?? "", legal: l?.gt ?? "", furnishing: n?.gt ?? "", verified: !!xt, broker: !!mg, tinhTrang: tt?.gt ?? "",
    cum: [h?.cum, l?.cum, n?.cum, xt, mg, tt?.cum].filter((x): x is string => !!x),
  };
}

/** MỤC ĐÍCH CỦA CÂU → TAB (Mua bán · Cho thuê · Dự án) — MỘT HÀM cho ô trang tổng (tự chuyển tab) lẫn máy gợi ý (chủ dự án 01/11/2026:
 *  "bắt buộc phải hiểu được từ câu từ khoá để chia ra đúng tab"). Thứ tự xét:
 *   ① chữ mục đích khách gõ: mua · bán · cần mua/bán · chuyển nhượng → Mua bán; thuê · cho thuê · sang nhượng · "…/tháng" → Cho thuê
 *      ("mua căn hộ dự án X" vẫn là Mua bán — tin thuộc dự án)
 *   ② dấu hiệu Dự án: "dự án" (trừ loại "đất nền dự án") · mở bán · bàn giao · chủ đầu tư · khu đô thị · tiến độ · gõ tên dự án (laTenDuAn)
 *   ③ dấu hiệu Cho thuê: nguyên căn · ở ghép · ngắn hạn · loại chỉ có cho thuê (phòng trọ, văn phòng, mặt bằng) · giá triệu (không phải đất)
 *   ④ dấu hiệu Mua bán: giá tỷ · sổ đỏ/hồng · hợp đồng mua bán · loại chỉ có mua bán (đất)
 *   không dấu hiệu nào → null (giữ tab đang đứng) */
export function docMucDich(raw: string, laTenDuAn?: (nq: string) => boolean): "ban" | "thue" | "duan" | null {
  const pq = parseQuery(raw);
  const w = ` ${normalizeVi(raw).replace(/[^a-z0-9]+/g, " ")} `;
  // DỰ ÁN XÉT TRƯỚC (chủ dự án 02/11/2026: "đọc mục đích liên quan đến dự án phải coi lại"): câu nói tới dự án (dự án · mở bán · bàn giao ·
  // chủ đầu tư · khu đô thị · tiến độ · trọn tên dự án) mà KHÔNG nói rõ mua / bán / thuê → Dự án. "mở bán", "bàn giao" có chữ "bán"/"ban"
  // nhưng là chữ của dự án, không phải khách nói mua bán (trước đây "dự án đang mở bán…" bị hiểu là Mua bán).
  const wDa = w.replace(/ dat nen du an /g, " dat nen ");
  const coDuAn = / du an | mo ban | ban giao | chu dau tu | khu do thi | tien do /.test(wDa) || !!laTenDuAn?.(w);
  const noiMuaThue = / (mua|ban|thue|chuyen nhuong) /.test(w.replace(/ (mo ban|ban giao) /g, " "));
  if (coDuAn && !noiMuaThue) return "duan";
  if (/ (chuyen nhuong|can ban|ban gap) /.test(w) && !/ thue /.test(w)) return "ban";
  if (pq.purpose) return pq.purpose;
  if (coDuAn) return "duan";
  const chiThue = pq.types.length > 0 && pq.types.every((t) => ["Phòng trọ", "Văn phòng", "Mặt bằng"].includes(t));
  if (/ thang | nguyen can | o ghep | ngan han | dai han /.test(w) || chiThue) return "thue";
  // giá từ 100 TRIỆU trở lên ("căn hộ 800 triệu") là giá bán — không ai thuê trăm triệu một tháng
  const soTrieu = Number(w.match(/ (\d+[.,]?\d*) ?(trieu|tr) /)?.[1]?.replace(",", ".") ?? 0);
  if ((pq.priceMinTy ?? 0) >= 1 || (pq.priceMaxTy ?? 0) >= 1 || / \d+[.,]?\d* ?(ty|ti) /.test(w) || soTrieu >= 100 || / so do | so hong | hop dong mua ban /.test(w)) return "ban";
  const laDat = pq.types.length > 0 && pq.types.every((t) => /^đất/i.test(t));
  if ((pq.priceMaxTy != null || pq.priceMinTy != null || / \d+[.,]?\d* ?(trieu|tr) /.test(w)) && !laDat) return "thue";
  if (laDat) return "ban";
  return null;
}

/** DIỆN TÍCH trong câu → trường Diện tích (01/11/2026: "100m2" từng là chữ lạ): "dưới 80m2" · "trên/từ 100 m2" · "100m2" (khoảng ±15%) */
export function docDienTich(raw: string): { areaMin: number | null; areaMax: number | null; cum: string } {
  const nq = normalizeVi(raw).replace(/[^a-z0-9.,]+/g, " ");
  const m = nq.match(/\b(?:(duoi|tren|tu)\s+)?(\d+(?:[.,]\d+)?)\s*(?:m2|m vuong|met vuong)\b/);
  // NGANG × DÀI ("5x20") → diện tích 100 m², khoảng ±15%
  const nd = !m && nq.match(/\b(\d+(?:[.,]\d+)?)\s*x\s*(\d+(?:[.,]\d+)?)\b/);
  if (nd) { const so = Number(nd[1].replace(",", ".")) * Number(nd[2].replace(",", ".")); return { areaMin: Math.round(so * 0.85), areaMax: Math.round(so * 1.15), cum: nd[0].trim() }; }
  if (!m) return { areaMin: null, areaMax: null, cum: "" };
  const so = Number(m[2].replace(",", "."));
  if (m[1] === "duoi") return { areaMin: null, areaMax: so, cum: m[0].trim() };
  if (m[1] === "tren" || m[1] === "tu") return { areaMin: so, areaMax: null, cum: m[0].trim() };
  return { areaMin: Math.round(so * 0.85), areaMax: Math.round(so * 1.15), cum: m[0].trim() };
}

export function chuChuaHieu(raw: string, cumKhac: string[] = []): string {
  // cụm Lọc thêm đã đọc thành trường (hướng, pháp lý, nội thất, diện tích) không còn là "chữ chưa hiểu"
  cumKhac = [...cumKhac, ...docLocThem(raw).cum, docDienTich(raw).cum].filter(Boolean);
  const p = parseQuery(raw);
  const goc = raw.normalize("NFC").split(/\s+/).filter(Boolean);
  const tu = goc.map((w) => normalizeVi(w).replace(/[^a-z0-9.,]/g, "").replace(/^[.,]+|[.,]+$/g, "") || "~");
  const cum = new Set<string>([...CUM_CHUNG_HIEU, ...cumKhac.map((c) => normalizeVi(c).replace(/[^a-z0-9]+/g, " ").trim())]);
  for (const [nhan, keys] of LOAI_HINH) if (p.types.includes(nhan)) keys.forEach((k) => cum.add(k));
  // "Mỹ Khê" là tên bãi biển — hiểu ra Đà Nẵng nhưng vẫn giữ chữ trong gợi ý, không đọc thành cả Đà Nẵng
  for (const [nhan, keys] of TINH) if (p.places.includes(nhan)) keys.filter((k) => k !== "my khe").forEach((k) => cum.add(k));
  for (const [nhan, keys] of DAC_DIEM) if (p.features.includes(nhan)) keys.forEach((k) => cum.add(k));
  if (p.features.includes("view biển")) cum.add("bien");
  for (const n of [p.place?.ward, p.place?.district, p.place?.province]) if (n) { cum.add(normalizeVi(n)); cum.add(boCapNoi(n)); }
  // tên TỈNH CŨ khách gõ ("quảng bình" → Quảng Trị) cũng là chữ đã hiểu
  const tt = tenTinhTrongCau(normalizeVi(raw)); if (tt) cum.add(tt[0]);
  // Đánh dấu chữ đã hiểu bằng "_" (giữ đúng số chữ để ghép lại chữ gốc của khách)
  let s = ` ${tu.join(" ")} `;
  const xoa = (m: string) => m.replace(/\S+/g, "_");
  if (p.priceMaxTy != null || p.priceMinTy != null) {
    s = s.replace(/(?:tu\s*)?\d+[.,]?\d*\s*(?:-|den|toi)\s*\d+[.,]?\d*\s*(?:ty|ti|trieu|tr)\b/g, xoa)
      .replace(/(?:duoi|nho hon|tren|lon hon|<|>)\s*\d+[.,]?\d*\s*(?:ty|ti|trieu|tr)\b/g, xoa)
      .replace(/\b\d+[.,]?\d*\s+\d+[.,]?\d*\s*(?:ty|ti|trieu|tr)\b/g, xoa) // "2-3 tỷ" (dấu gạch đã bỏ)
      .replace(/(?:khoang |tam )?\d+[.,]?\d*\s*(?:ty|ti|trieu|tr|trieuthang)(?:\s+(?:mot|1|moi))?(?:\s+thang)?\b/g, xoa); // một mức, theo tháng
  }
  if (p.beds) s = s.replace(/\b\d+\s*(?:pn|phong ngu)\b/g, xoa);
  for (const c of [...cum].filter(Boolean).sort((a, b) => b.length - a.length)) {
    while (s.includes(` ${c} `)) s = s.replace(` ${c} `, ` ${xoa(c)} `);
  }
  const danhDau = s.trim().split(" ");
  if (danhDau.length !== goc.length) return ""; // lệch số chữ (không xảy ra) → coi như đã hiểu
  // Gom chữ chưa hiểu đứng liền nhau thành CỤM (từ ghép tiếng Việt: "sân vườn", "nở hậu", "Nguyễn Văn Linh" — không tách lẻ
  // từng tiếng); bỏ chữ nối ở hai đầu cụm ("có sân vườn" → "sân vườn"), riêng "gần"/"giá" đầu cụm giữ ("gần sân bay", "giá rẻ")
  const cumCon: string[][] = [];
  let dang: string[] = [];
  goc.forEach((w, i) => {
    if (danhDau[i] !== "_" && tu[i] !== "~") dang.push(w.replace(/^[.,;:!?]+|[.,;:!?]+$/g, ""));
    else if (dang.length) { cumCon.push(dang); dang = []; }
  });
  if (dang.length) cumCon.push(dang);
  // "cần" là chữ nối, "căn" (căn góc) thì không — bỏ dấu trùng nhau nên xét chữ có dấu
  const la = (w: string) => TU_NOI.has(normalizeVi(w).replace(/[^a-z0-9]/g, "")) || w.toLowerCase() === "cần";
  const giuDau = (w: string) => ["gan", "gia"].includes(normalizeVi(w));
  return cumCon
    .map((c) => {
      let a = 0, b = c.length;
      while (a < b && la(c[a]) && !(giuDau(c[a]) && a + 1 < b)) a++;
      while (b > a && la(c[b - 1])) b--;
      return c.slice(a, b).join(" ");
    })
    .filter(Boolean)
    .join(", ");
}

function phanTichCau(raw: string): ParsedQuery {
  const nq = normalizeVi(raw);
  const gia = bocGia(nq);
  // "nhà đất" / "bất động sản" là cách nói CHUNG, không phải loại hình — phải bỏ
  // trước khi dò, nếu không chữ "đất" trong "nhà đất" bị hiểu thành "Đất nền".
  // "2 mặt tiền" / "hai mặt tiền" là đặc điểm (căn góc), không phải loại Nhà mặt phố
  const types = timTuDien(nq.replace(/nha dat|bat dong san|bds/g, " ").replace(/\b(\d+|hai|ba) mat tien\b/g, " "), LOAI_HINH, true);
  // CỤM HƯỚNG NHÀ không phải nơi chốn (01/11/2026: "đất nền hướng đông nam" từng bị hiểu thành Phường Nam Nha Trang) — bỏ trước khi dò địa danh
  const nqNoi = nq.replace(/\bhuong (dong|tay) (nam|bac)\b|\bhuong (dong|tay|nam|bac)\b/g, " ");
  // TỈNH = TÊN ĐẦY ĐỦ (34 mới + 63 cũ) ĐỨNG SAU CÙNG trong câu — địa chỉ viết phường → quận → tỉnh (anh 07/11/2026: "Xã Nguyễn Huệ, Cao Bằng"
  // từng đọc ra Huế vì chữ "huệ"; "Thụy Lâm, Đông Anh, Hà Nội" ra Lâm Đồng). Không có tên đầy đủ mới dùng tên gọi tắt của tỉnh web (TINH)
  const tinhCuoi = tinhTheoTenCuoi(nq); // câu gốc — bước bỏ "hướng …" từng xoá mất "Tân Hương Đồng Tháp"
  const places = tinhCuoi ? [tinhCuoi] : timTuDien(nqNoi, TINH);
  // TÊN TỈNH / THÀNH CŨ HOẶC MỚI GÕ ĐÚNG (bắt buộc đọc được — chủ dự án 01/11/2026): khớp trọn tên trước khi đoán gần đúng — "thanh hoa"
  // từng thành Khánh Hòa, "quang binh" thành huyện ở Tuyên Quang, "binh dinh" thành phường ở Đà Nẵng
  if (!places.length) places.push(...tinhDungTen(nqNoi));
  if (!places.length) places.push(...tinhGanDung(nqNoi, nqNoi === nq ? raw : ""));
  const features = timTuDien(nq, DAC_DIEM);
  // "Villa biển gần Hội An", "nhà biển": chữ BIỂN đứng riêng cũng là đặc điểm gần biển (chủ dự án 21/10/2026). Chỉ nhận khi gõ
  // có dấu "biển" — bỏ dấu thành "bien" thì trùng "Biên Hòa", "biên giới".
  if (!features.includes("view biển") && /(^|[^\p{L}])biển([^\p{L}]|$)/iu.test(raw.normalize("NFC"))) features.push("view biển");
  // Phường/quận trong câu ("Hoà Quý", "Ngũ Hành Sơn") — suy ra luôn TỈNH nếu
  // người dùng không gõ tên tỉnh ("nhà đất Hoà Quý" → Đà Nẵng).
  // có TÊN TỈNH → đọc theo CÂY địa chỉ của đúng tỉnh đó (docDiaChiCay); không có tỉnh / cây không ra → bộ dò cũ (tỉnh web trước, gần đúng)
  const place0 = (tinhCuoi ? docDiaChiCay(nq, tinhCuoi, raw) : null) ?? timDiaGioi(soLaMaCuoi(cheChuChung(nqNoi)), places); // "hải châu i" = "hải châu 1"
  // GÕ CÓ DẤU THÌ ĐỊA DANH PHẢI KHỚP ĐÚNG DẤU (01/11/2026: "đang mở bán" từng đọc thành xã Dang, Tây Giang; "hòa" thành "Hóa"):
  // tên nơi (bỏ cấp) phải có trong câu khách gõ theo đúng dấu — chỉ so khi khách gõ có dấu, gõ không dấu vẫn khớp như cũ
  const dungDau = (ten?: string) => {
    if (!ten || normalizeVi(raw) === raw.normalize("NFC").toLowerCase()) return true;
    const chuan = (s: string) => s.normalize("NFC").toLowerCase().replace(/o([àáảãạ])/g, (_, x) => ({ "à": "òa", "á": "óa", "ả": "ỏa", "ã": "õa", "ạ": "ọa" } as Record<string, string>)[x])
      .replace(/u([ỳýỷỹỵ])/g, (_, x) => ({ "ỳ": "ùy", "ý": "úy", "ỷ": "ủy", "ỹ": "ũy", "ỵ": "ụy" } as Record<string, string>)[x]);
    // số La Mã chỉ khi tên viết chữ in La Mã ("Hải Châu I"); "Pả Vi", "Mường Vi" không phải số 6 (07/11/2026)
    const tenBo = ten.replace(/^(Phường|Xã|Thị trấn|Đặc khu|Quận|Huyện|Thị xã|Thành phố)\s+/i, "");
    const ma = (/ (I{1,3}|IV|VI{0,3}|IX|X)$/.test(tenBo) ? soLaMaCuoi(chuan(tenBo)) : chuan(tenBo)).replace(/[^\p{L}\p{N}]+/gu, " ").trim(); // "Văn Miếu - Quốc Tử Giám": bỏ gạch nối như câu gõ
    const go = ` ${chuan(raw).replace(/[^\p{L}\p{N}]+/gu, " ")} `;
    if (go.includes(` ${ma} `)) return true;
    // chỉ xét dấu trên ĐÚNG PHẦN TÊN NƠI khách gõ: phần đó gõ không dấu ("phường thanh khe") thì nhận
    const tu = go.trim().split(" "), n = ma.split(" ").length, khoa = normalizeVi(ma);
    for (let i = 0; i + n <= tu.length; i++) {
      const doan = tu.slice(i, i + n).join(" ");
      if (normalizeVi(doan) === khoa && normalizeVi(doan) === doan) return true;
    }
    return false;
  };
  const place = place0 && dungDau(place0.ward ?? place0.district) ? place0 : null;
  if (place && !places.includes(place.province)) places.push(place.province);

  // MỤC ĐÍCH (rà 21/10/2026): "ban công" không phải "bán", "thuế" không phải "thuê" (bỏ dấu thì trùng chữ); câu nói CẢ mua/bán
  // lẫn thuê ("mua hoặc thuê") → chưa rõ mục đích, để gợi ý cả hai.
  // "cơ bản" (nội thất cơ bản), "bản đồ" không phải "bán" — 01/11/2026
  // "mở bán", "bàn giao" (tình trạng dự án) cũng không phải "bán"
  const nqMd = nq.replace(/\b(ban cong|co ban|ban do|ban ve|mo ban|ban giao)\b/g, " ");
  const thueThat = !(/thuế/i.test(raw.normalize("NFC")) && !/thuê/i.test(raw.normalize("NFC")));
  // "sang nhượng" (mặt bằng, cửa hàng) và giá THEO THÁNG ("10 triệu/tháng") là cho thuê (01/11/2026)
  const coThue = thueThat && (/\b(thue|cho thue|sang nhuong)\b/.test(nqMd) || /\d\s*(trieu|tr)\s*(\/|mot|1|moi)?\s*thang\b/.test(normalizeVi(raw).replace(/[^a-z0-9/]+/g, " ")));
  const coBan = /\b(mua|ban|can mua)\b/.test(nqMd);
  const purpose: "ban" | "thue" | null = coThue && coBan ? null : coThue ? "thue" : coBan ? "ban" : null;

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

  return { raw, purpose, types, places, place, beds: bocPhongNgu(nq), priceMaxTy: gia.max, priceMinTy: gia.min, features, terms, highlight };
}

// ── Chấm điểm 1 tin theo câu đã bóc tách ────────────────────────────────────
type Searchable = {
  id: string; title: string; location: string; type: string; price: string;
  area: string; beds?: number; purpose?: string; badge?: string; agentName?: string;
  // MÔ TẢ tin — cũng được dò khi tìm từ khoá (khớp cả nội dung bài, không chỉ tiêu đề)
  desc?: string;
  // MỌI TRƯỜNG CÒN LẠI đã nhập của tin, gộp thành một chuỗi: pháp lý, hướng,
  // nội thất, tiện ích, tiện ích xung quanh, địa chỉ chi tiết, đặc điểm, dự án,
  // người đăng… (dựng ở listingsDb.rowToListing). Nhờ vậy gõ "sổ hồng",
  // "hồ bơi", "gần trường học", "đông nam"… đều tìm ra tin.
  searchText?: string;
};

export type Hit<T> = {
  item: T;
  tier: 1 | 2 | 3;       // 1 = khớp hoàn hảo · 2 = gần đúng · 3 = liên quan
  score: number;
  matched: string[];     // các từ đã khớp (để bôi đậm)
};

// Khớp mờ: chứa nguyên từ, hoặc lệch 1 ký tự với từ dài (chống gõ sai/thiếu dấu).
// ⚠️ Từ NGẮN (≤3 ký tự) phải khớp TRỌN TỪ, không được khớp chèn giữa chữ khác —
// nếu không "an" sẽ khớp vào "hoà xuAN", "da" khớp vào "danh khôi"… làm dự án
// chẳng liên quan cũng lọt lên đầu.
function khopMo(hay: string, tu: string): boolean {
  if (tu.length <= 3) {
    return new RegExp(`(^|[^a-z0-9])${tu}([^a-z0-9]|$)`).test(hay);
  }
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
    // VÙNG DÒ = MỌI TRƯỜNG CÓ THÔNG TIN của tin: tiêu đề, địa chỉ, loại hình,
    // giá, diện tích, hạng tin, người đăng, mô tả, và searchText (pháp lý, hướng,
    // nội thất, tiện ích, tiện ích xung quanh, đặc điểm, dự án…).
    const hay = normalizeVi(
      `${item.title} ${item.location} ${item.type} ${item.price} ${item.area} ${item.badge ?? ""} ${item.agentName ?? ""} ${item.desc ?? ""} ${item.searchText ?? ""}`,
    );
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
    // 2b) Địa giới SÂU (phường/quận bóc được từ câu) — chấm riêng, ăn điểm cao
    //     hơn tỉnh vì cụ thể hơn. Có nó thì "Đất nền Hoà Quý" mới đẩy đúng tin ở
    //     Hoà Quý lên trước tin cùng Đà Nẵng nhưng khác phường.
    const nDiaChi = normalizeVi(item.location);
    const tenSau = parsed.place?.ward ?? parsed.place?.district ?? null;
    const dungDiaGioiSau = tenSau != null && nDiaChi.includes(normalizeVi(tenSau));
    if (tenSau) {
      tong++;
      if (dungDiaGioiSau) { dat++; matched.push(tenSau); }
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

    // ── CHẤM ĐIỂM CHẶT, ƯU TIÊN CHÍNH XÁC LÊN TRƯỚC ────────────────────────
    // Thứ tự trọng số (cao → thấp), đúng thứ tự chủ dự án yêu cầu:
    //   nguyên cụm > đủ mọi từ > mục đích > loại hình > khu vực > đặc điểm
    //   > phòng ngủ / giá > từ lẻ (khớp ở TIÊU ĐỀ ăn điểm gấp đôi địa chỉ)
    const nquery = normalizeVi(raw);
    const nTitle = normalizeVi(item.title);
    const nRest = normalizeVi(`${item.location} ${item.type}`);
    const duMoiTu = parsed.terms.length > 0 && tuLe.length === parsed.terms.length;

    let score = 0;
    if (nTitle.includes(nquery)) score += 100000;        // nguyên cụm nằm trong tiêu đề
    else if (`${nTitle} ${nRest}`.includes(nquery)) score += 60000; // nguyên cụm ở đâu đó
    if (duMoiTu) score += 20000;                          // đủ MỌI từ khoá
    if (parsed.purpose && (item.purpose ?? "ban") === parsed.purpose) score += 8000;
    if (parsed.types.length && parsed.types.some((t) => khopMo(hay, normalizeVi(t)))) score += 6000;
    if (dungDiaGioiSau) score += 7000;                    // đúng phường/quận — cụ thể nhất
    if (parsed.places.length && parsed.places.some((p) => khopMo(normalizeVi(item.location), normalizeVi(p)))) score += 5000;
    score += parsed.features.filter((f) => khopMo(hay, normalizeVi(f))).length * 2000;
    if (parsed.beds != null && item.beds != null && item.beds >= parsed.beds) score += 1500;
    if ((parsed.priceMaxTy != null || parsed.priceMinTy != null) && matched.includes(item.price)) score += 1500;
    for (const t of tuLe) score += khopMo(nTitle, t) ? 60 : 30;

    // Tầng: CHẶT hơn trước — muốn Tầng 1 phải đạt ĐỦ tiêu chí VÀ đủ mọi từ khoá.
    const tyLe = tong === 0 ? 0 : dat / tong;
    const tier: 1 | 2 | 3 =
      tong > 0 && dat === tong && (parsed.terms.length === 0 || duMoiTu)
        ? 1
        : tyLe >= 0.6 || duMoiTu
          ? 2
          : 3;

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
        // Dò đủ mọi trường như tầng trên — địa danh dân gian, pháp lý, tiện ích…
        // thường chỉ nằm ở mô tả hoặc các trường phụ.
        const hay = normalizeVi(`${item.title} ${item.location} ${item.type} ${item.desc ?? ""} ${item.searchText ?? ""}`);
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
  for (const d of f.dacDiem ?? []) ds.push({ ten: d, giu: false, f: chi({ dacDiem: [d] }) });
  return ds;
}

export type FilterHit<T> = { item: T; tier: 1 | 2 | 3; thieu: string[] };

/** Tin có khớp ÍT NHẤT MỘT tiêu chí khách nêu không — loại các tin smartFilter đổ vào khi không có gì khớp (dự phòng "không để
 *  trống"). Chủ dự án 21/10/2026: không có thì nói là không có, không đưa tin không liên quan vào gợi ý. */
export function coKhopTieuChi<T>(h: FilterHit<T>, f: Filters): boolean {
  return h.thieu.length < tachTieuChi(f).length;
}

export function smartFilter<T extends Searchable & { badge?: string }>(
  items: T[],
  f: Filters,
): FilterHit<T>[] {
  const tieu = tachTieuChi(f);
  // Không chọn tiêu chí nào → mọi tin đều là Tầng 1
  if (tieu.length === 0) return items.map((item) => ({ item, tier: 1, thieu: [] }));

  // CHÍNH XÁC THEO TỪNG MỤC ƯU TIÊN (chủ dự án 17/10/2026): trong cùng tầng, tin khớp mục quan trọng hơn
  // đứng trước — khu vực > loại hình/dự án > giá > diện tích > phòng ngủ > còn lại. Hụt phường/quận nhưng
  // cùng tỉnh vẫn được nửa điểm khu vực (gần hơn tin tỉnh khác).
  const TRONG: Record<string, number> = { "khu vực": 64, "loại hình": 32, "dự án": 32, "mức giá": 16, "diện tích": 8, "phòng ngủ": 4 };
  const tinhChon = f.locations.map((l) => l.province);
  const sau = f.locations.some((l) => l.district || l.ward);
  const diem = new Map<T, number>();
  const out: FilterHit<T>[] = [];
  for (const item of items) {
    const dat: string[] = [];
    const thieu: string[] = [];
    let giuDu = true;
    let d = 0;
    for (const t of tieu) {
      const ok = applyFilters([item], t.f).length > 0;
      if (ok) { dat.push(t.ten); d += TRONG[t.ten] ?? 1; }
      else {
        thieu.push(t.ten);
        if (t.giu) giuDu = false; // hụt khu vực / loại hình → không được lên Tầng 2
        if (t.ten === "khu vực" && sau && tinhChon.includes(item.location.split(",").pop()?.trim() ?? "")) d += 32;
      }
    }
    if (dat.length === 0) continue;
    // VÒNG 2 (Lọc thêm khớp nhờ ĐỌC NỘI DUNG vì ô dữ liệu trống — filters.quaNoiDung): xếp SAU tin khớp đúng ô trong cùng tầng (01/11/2026)
    if (quaNoiDung(item as unknown as Parameters<typeof quaNoiDung>[0], f)) d -= 0.5;
    const tier: 1 | 2 | 3 =
      thieu.length === 0 ? 1 : giuDu && dat.length / tieu.length >= 0.5 ? 2 : 3;
    diem.set(item, d);
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

  out.sort((a, b) => a.tier - b.tier || (diem.get(b.item) ?? 0) - (diem.get(a.item) ?? 0));
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
  const pl = p.place;                       // phường/quận bóc được (nếu có)
  const noi = pl?.province ?? p.places[0];   // tỉnh/thành
  const coGia = p.priceMaxTy != null || p.priceMinTy != null;
  const giaChu = p.priceMaxTy != null
    ? `dưới ${p.priceMaxTy >= 1 ? `${p.priceMaxTy} tỷ` : `${Math.round(p.priceMaxTy * 1000)} triệu`}`
    : p.priceMinTy != null
      ? `trên ${p.priceMinTy} tỷ`
      : "";

  const pGia: Partial<Filters> = coGia ? { priceMin: p.priceMinTy, priceMax: p.priceMaxTy } : {};
  const pLoai: Partial<Filters> = loai ? { types: [loai] } : {};
  // Khu vực ở cấp SÂU nhất bóc được (phường → quận → tỉnh)
  const pNoi: Partial<Filters> = pl
    ? { locations: [{ province: pl.province, district: pl.district, ward: pl.ward }] }
    : noi ? { locations: [{ province: noi }] } : {};
  const pPn: Partial<Filters> = p.beds != null ? { beds: p.beds } : {};

  const ds: GoiY[] = [];
  const them = (label: string, sub: string, patch: Partial<Filters>) => {
    if (!label || ds.some((x) => x.label === label)) return;
    ds.push({ label, sub, patch });
  };

  const phanLoai = loai ?? "Bất động sản";
  // Nhãn khu vực đọc lên đúng như người dùng nghĩ: "Hoà Quý, Ngũ Hành Sơn"
  const tenSau = pl?.ward ?? pl?.district ?? "";
  const phanNoi = pl
    ? ` tại ${pl.ward ? `${pl.ward}, ${pl.district}` : pl.district}`
    : noi ? ` tại ${noi}` : "";
  const phanPn = p.beds != null ? ` ${p.beds} PN` : "";

  // 1) Đầy đủ mọi tiêu chí bóc được
  if (loai || noi || coGia || p.beds != null) {
    them(
      `${phanLoai}${phanPn}${phanNoi}${coGia ? ` ${giaChu}` : ""}`,
      pl ? `Khớp đầy đủ tiêu chí · ${pl.province}` : "Khớp đầy đủ tiêu chí",
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
  // 3b) NỚI ĐỊA GIỚI theo bậc: phường → quận → tỉnh.
  //     "Đất nền tại Hoà Quý" hết tin → "Đất nền tại Ngũ Hành Sơn" → "…tại Đà Nẵng".
  if (pl?.ward && pl.district) {
    them(`${phanLoai} tại ${pl.district}`, "Mở rộng ra cả quận/huyện",
      { ...pLoai, locations: [{ province: pl.province, district: pl.district }] });
  }
  if (pl) {
    them(`${phanLoai} tại ${pl.province}`, `Mở rộng ra toàn ${pl.province}`,
      { ...pLoai, locations: [{ province: pl.province }] });
  }
  // 4) Chỉ LOẠI HÌNH
  if (loai) them(`Tất cả ${loai.toLowerCase()}`, "Toàn quốc", pLoai);
  // 5) Chỉ KHU VỰC
  if (noi) them(`Bất động sản${phanNoi || ` tại ${noi}`}`, tenSau ? `Mọi loại hình · ${pl?.province}` : "Mọi loại hình", pNoi);
  // 6) Chỉ GIÁ
  if (coGia) them(`Bất động sản ${giaChu}`, "Mọi khu vực, mọi loại hình", pGia);

  // 7) KHÔNG bóc được tiêu chí nào (vd gõ tên dự án, tên đường): vẫn phải có
  //    bậc thang — nguyên cụm CHÍNH XÁC trước, rồi TƯƠNG ĐỐI, rồi TỪNG TỪ MỘT.
  if (ds.length === 0 && p.raw.trim()) {
    const cum = p.raw.trim();
    them(cum, "Khớp chính xác cả cụm", { keyword: cum });
    if (p.terms.length > 1) {
      them(p.highlight.slice(0, 3).join(" "), "Khớp tương đối", { keyword: p.highlight.slice(0, 3).join(" ") });
      for (const w of p.highlight.slice(0, 3)) them(w, "Chỉ 1 từ khoá", { keyword: w });
    }
  }

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
  cfg: {
    hay: (item: T) => string;
    // Chuỗi CHÍNH (tên dự án / tiêu đề bài) — khớp ở đây ăn điểm cao hơn nhiều
    // so với khớp ở phần mô tả. Không truyền → dùng luôn `hay`.
    ten?: (item: T) => string;
    truong?: TruongLoc<T>[];
  },
): { item: T; tier: 1 | 2 | 3; matched: string[]; score: number }[] {
  const parsed = parseQuery(q);
  const dung = (cfg.truong ?? []).filter((t) => t.chon);
  const coQ = q.trim().length > 0;
  const nquery = normalizeVi(q);
  const out: { item: T; tier: 1 | 2 | 3; matched: string[]; score: number }[] = [];

  for (const item of items) {
    const hay = normalizeVi(cfg.hay(item));
    const nTen = normalizeVi(cfg.ten ? cfg.ten(item) : cfg.hay(item));
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

    // ── CHẤM ĐIỂM (trước đây KHÔNG có → cùng tầng thì thứ tự về nguyên trạng,
    //    nên gõ "Căn hộ view biển tại Đà Nẵng" ra đủ thứ dự án không liên quan) ──
    // Thang điểm giống hệt bên tin BĐS: nguyên cụm > đủ mọi từ > tiêu chí > từ lẻ,
    // và khớp ở TÊN ăn điểm gấp nhiều lần khớp trong phần mô tả.
    let score = 0;
    if (coQ) {
      if (nTen.includes(nquery)) score += 100000;
      else if (hay.includes(nquery)) score += 60000;
      if (qDu) score += 20000;
      // Mỗi từ khoá: khớp ở TÊN = 800đ · chỉ khớp trong mô tả = 120đ
      for (const t of tuKhop) score += khopMo(nTen, t) ? 800 : 120;
      // Khớp LIỀN NHAU 2 từ (vd "view bien") — dấu hiệu đúng ý người tìm
      for (let i = 0; i + 1 < parsed.terms.length; i++) {
        if (hay.includes(`${parsed.terms[i]} ${parsed.terms[i + 1]}`)) score += 3000;
      }
      // Bóc được loại hình / khu vực / đặc điểm mà khớp → cộng đúng thứ tự ưu tiên
      if (parsed.types.some((t) => khopMo(hay, normalizeVi(t)))) score += 6000;
      if (parsed.places.some((p) => khopMo(hay, normalizeVi(p)))) score += 5000;
      score += parsed.features.filter((f) => khopMo(hay, normalizeVi(f))).length * 2000;
    }
    // mỗi trường lọc đạt — trường đứng TRƯỚC trong hàng trường (trái qua phải) nặng hơn mọi trường sau cộng lại và hơn phần từ khoá
    // (chủ dự án 01/11/2026: "các trường ưu tiên theo menu ở dưới, từ trái sang phải")
    score += dat.reduce((s, x) => s + 2 ** (dung.length - dung.indexOf(x)) * 1e6, 0);

    out.push({ item, tier, matched: tuKhop.length ? parsed.highlight : [], score });
  }

  // KHÔNG BAO GIỜ RỖNG: nới hết cỡ — giữ tin dính 3 ký tự đầu, cuối cùng lấy tất cả
  if (out.length === 0) {
    const goc = parsed.terms.map((t) => t.slice(0, 3)).filter(Boolean);
    const cham = items.map((item) => ({ item, n: goc.filter((g) => normalizeVi(cfg.hay(item)).includes(g)).length }));
    const co = cham.filter((c) => c.n > 0).sort((a, b) => b.n - a.n);
    for (const c of (co.length ? co : cham).slice(0, 24)) out.push({ item: c.item, tier: 3, matched: [], score: c.n });
  }

  out.sort((a, b) => a.tier - b.tier || b.score - a.score);
  return out;
}

// Nhãn từng tầng (đúng chữ trong tài liệu mục 4)
export const TIER_LABEL: Record<1 | 2 | 3, string> = {
  1: "🔥 Khớp hoàn hảo với tiêu chí của bạn",
  2: "Bất động sản tương tự", // anh 07/11/2026: bỏ chữ "gợi ý"
  // Chủ dự án 17/10/2026: tìm câu dài KHÔNG BAO GIỜ báo "không có kết quả" — dùng lại nhãn gợi ý của tầng 2
  3: "Bất động sản tương tự",
};
