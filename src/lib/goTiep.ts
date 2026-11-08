import type { Listing } from "@/lib/data";
import { applyFilters, emptyFilters, normalizeVi, priceToTy, tenLoaiHinh, dacDiemOptions, coDacDiem } from "@/lib/filters";
import { LOAI_HINH, chuChuaHieu, docDienTich, docLocThem, parseQuery, tenTinhTrongCau } from "@/lib/smartSearch";
import { cauThanhBoLoc } from "@/lib/locDanhSach";
import { hrefGoiY, type DongGoiY } from "@/lib/goiYTheoY";
import { loaiCuaDuAn, thuHepDuAn, type DuAnLoc } from "@/lib/thuHepDuAn";
import { locTuCau } from "@/lib/locTuCau";
import { provincesNew, provincesOld } from "@/lib/diaDanhNguon";
import { newProvinceOf } from "@/lib/locations";

// ============================================================================
// GÕ TIẾP KIỂU GOOGLE — đoán CHỮ CUỐI khách đang gõ dở (chủ dự án 01/11/2026: gõ "Căn hộ đà nẵng dưới 2 tỷ gần trung tâm" từng chữ,
// bước nào gợi ý cũng phải chuẩn và logic). Trước đây chữ dở ("đà", "dư", "gầ") bị chép nguyên vào câu gợi ý ("Bán căn hộ dư tại Đà
// Nẵng") hoặc làm mất gợi ý ("đà nẵ" → trống). Nay:
//   · chữ cuối (có thể nhiều chữ: "đà nẵ") là ĐẦU của một cụm trong bộ từ của web → điền trọn cụm ("đà" → Đà Nẵng, Đà Lạt);
//   · số đứng cuối ("dưới 2") → "2 tỷ" / "2 triệu"; từ nối còn thiếu vế ("gần") → các cụm có sẵn ("gần biển", "gần trung tâm"…);
//   · không đoán được → bỏ chữ dở ngắn, không chép vào gợi ý.
// Bộ từ: loại hình (smartSearch), đặc điểm, mức giá, mục đích + ĐỊA DANH ĐANG CÓ TIN (nơi gọi truyền vào từ dữ liệu thật).
// Gõ có dấu thì so có dấu, gõ không dấu thì so không dấu (như khopTen). MỘT hàm cho mọi ô tìm.
// ============================================================================

const CUM_CO_DINH = [
  // mục đích
  "bán", "mua", "cho thuê", "thuê", "dự án",
  // loại hình hay gõ (nhãn loại hình thêm từ LOAI_HINH)
  "nhà", "đất", "căn hộ", "chung cư", "nhà phố", "biệt thự", "liền kề",
  // đặc điểm — XẾP THEO ĐỘ PHỔ BIẾN (gõ "gần" → gần biển, gần trung tâm… theo đúng thứ tự này)
  "mỹ khê", "gần biển", "gần trung tâm", "view biển", "trung tâm", "gần trường", "gần chợ", "gần sông", "view sông", "cao cấp", "mới xây",
  "full nội thất", "sổ hồng", "sổ đỏ", "hẻm ô tô", "mặt tiền", "giá rẻ", "phòng ngủ",
  // đơn vị giá — chữ trọn, không phải chữ dở
  "tỷ", "triệu",
  // hướng nhà — "hướng đông nam" là cụm trọn, chữ "nam" cuối không phải chữ gõ dở của "Nam Nha Trang" (01/11/2026)
  "hướng đông", "hướng tây", "hướng nam", "hướng bắc", "hướng đông nam", "hướng đông bắc", "hướng tây nam", "hướng tây bắc",
  // ĐỦ CÁC TRƯỜNG LỌC THÊM (01/11/2026: gõ dở "tin" từng ra "tĩnh") — pháp lý · nội thất · tin xác thực · môi giới · tình trạng dự án
  "hợp đồng mua bán", "đang chờ sổ", "nội thất cơ bản", "nhà trống", "tin xác thực", "môi giới", "chính chủ",
  "đang mở bán", "sắp mở bán", "đã bàn giao", "sang nhượng", "khoảng",
];
/** Từ nối cần vế sau — đứng cuối câu một mình thì chưa thành ý (bỏ khi dựng gợi ý) */
const NOI_CAN_VE = new Set(["duoi", "tren", "tu", "khoang", "gia", "tai", "o", "gan"]);

const thuong = (s: string) => s.normalize("NFC").toLowerCase();
const coDau = (s: string) => normalizeVi(s) !== s;

/** Bộ từ gõ tiếp: cụm cố định + nhãn loại hình + địa danh đang có tin */
export function boTuGoTiep(diaDanh: string[]): string[] {
  const ra = new Map<string, string>();
  // + TÊN ĐỦ 34 TỈNH MỚI, 63 TỈNH CŨ (sau địa danh có tin — nơi có tin vẫn điền trước): gõ dở "quang tr" → Quảng Trị (01/11/2026)
  for (const c of [...CUM_CO_DINH, ...LOAI_HINH.map(([nhan]) => nhan), ...diaDanh, ...provincesNew.map((p) => p.name), ...provincesOld.map((p) => p.name)]) {
    const k = thuong(c.trim());
    if (k && !ra.has(k)) ra.set(k, c.trim());
  }
  return [...ra.values()];
}

/** Câu đã điền trọn chữ cuối — tối đa `toiDa` cách hiểu, theo thứ tự nên gợi ý. Câu đã trọn (kết thúc bằng dấu cách) giữ nguyên. */
export function goTiep(raw: string, boTu: string[], toiDa = 3): string[] {
  if (!raw.trim()) return [];
  if (/\s$/.test(raw)) {
    // Gõ xong một chữ nhưng CHƯA TRỌN CỤM ("Đà ", "căn ", "sơn ") → điền tiếp chữ sau như Google ("Đà Nẵng", "căn hộ") — trước đây ra trống
    const tiep = goTiep(raw.trim(), boTu, toiDa).filter((c) => thuong(c).startsWith(thuong(raw.trim()) + " "));
    return tiep.length ? tiep : [boNoiCuoi(raw.trim())].filter(Boolean);
  }
  const tu = raw.trim().split(/\s+/);
  const cuoi = tu[tu.length - 1];
  const truoc = tu.slice(0, -1).join(" ");
  const noi = (s: string) => (truoc ? `${truoc} ${s}` : s);

  // Số đứng cuối ("dưới 2") → đơn vị giá
  // số nhỏ (1–6) còn có thể là số phòng ngủ ("nhà hải châu 3" → "… 3 phòng ngủ")
  if (/^\d+([.,]\d+)?$/.test(cuoi)) return [noi(`${cuoi} tỷ`), noi(`${cuoi} triệu`), ...(/^[1-6]$/.test(cuoi) && !NOI_CAN_VE.has(normalizeVi(tu[tu.length - 2] ?? "")) ? [noi(`${cuoi} phòng ngủ`)] : [])];

  // Thử cụm dài trước: 3 chữ cuối, 2 chữ cuối, 1 chữ cuối là ĐẦU của một cụm trong bộ từ
  for (let k = Math.min(3, tu.length); k >= 1; k--) {
    const duoi = thuong(tu.slice(-k).join(" "));
    const dau = tu.slice(0, -k).join(" ");
    const so = coDau(duoi) ? (c: string) => thuong(c) : (c: string) => normalizeVi(c);
    const khop = boTu
      .filter((c) => { const x = so(c); return x.startsWith(duoi) && (x.length === duoi.length || x.split(" ").length >= k); })
      // cụm trùng trọn ưu tiên, rồi GIỮ THỨ TỰ BỘ TỪ (độ phổ biến: đặc điểm theo danh sách, địa danh theo số tin)
      .sort((a, b) => (so(a) === duoi ? -1 : 0) - (so(b) === duoi ? -1 : 0));
    if (!khop.length) continue;
    // Gõ TRỌN một cụm ("căn hộ", "đà nẵng") → câu đã trọn, chỉ thêm các cụm dài hơn bắt đầu bằng nó ("gần" → gần biển…)
    const tron = khop.find((c) => so(c) === duoi);
    if (tron && !NOI_CAN_VE.has(normalizeVi(duoi))) return [raw.trim()];
    const ra = khop.filter((c) => so(c) !== duoi).slice(0, toiDa).map((c) => (dau ? `${dau} ${c}` : c));
    if (ra.length) return ra;
  }
  // Không đoán được: chữ dở ngắn (≤ 3 ký tự) bỏ đi; chữ dài giữ (có thể là từ khách muốn dò trong nội dung tin — "sân vườn")
  return [boNoiCuoi(cuoi.length <= 3 ? truoc : raw.trim())].filter(Boolean);
}

/** Bỏ từ nối còn thiếu vế ở cuối câu ("… dưới", "… gần") — chưa thành ý thì không đưa vào gợi ý */
function boNoiCuoi(cau: string): string {
  const tu = cau.split(/\s+/);
  while (tu.length && NOI_CAN_VE.has(normalizeVi(tu[tu.length - 1]))) tu.pop();
  return tu.join(" ");
}

/** Địa danh đang có tin — mỗi phần địa chỉ của tin (phường/xã bỏ chữ cấp, tỉnh/thành) */
export function diaDanhTuTin(diaChi: string[]): string[] {
  const dem = new Map<string, number>();
  for (const d of diaChi) for (const phan of d.split(",")) {
    const x = phan.trim().replace(/^(Phường|Xã|Thị trấn|Đặc khu|Quận|Huyện|Thị xã|Thành phố|TP\.?)\s+/i, "");
    if (x && !/\d/.test(x) && x.length <= 30) dem.set(x, (dem.get(x) ?? 0) + 1);
  }
  // nơi nhiều tin đứng trước (gõ "đà" → Đà Nẵng trước Đà Lạt nếu Đà Nẵng nhiều tin hơn)
  return [...dem.entries()].sort((a, b) => b[1] - a[1]).map(([x]) => x);
}

// ============================================================================
// GỢI Ý KIỂU GOOGLE — GIỮ NGUYÊN CHỮ KHÁCH GÕ, CHỈ ĐIỀN TIẾP (chủ dự án 01/11/2026: "gợi ý theo từng từ khách", "làm sao mà giỏi để đoán
// một từ ra một câu được"). Mỗi dòng = câu khách gõ (chữ cuối đã điền trọn) + phần tiếp theo lấy từ DỮ LIỆU THẬT, nhiều tin trước:
//   chưa có loại hình → các loại hình đang có tin ("đà nẵng" → "đà nẵng căn hộ") · có loại, chưa nơi → tỉnh/thành ("căn hộ" → "căn hộ đà
//   nẵng") · có tỉnh, chưa phường → phường/xã ("căn hộ đà nẵng" → "căn hộ đà nẵng sơn trà").
// Chữ không đọc được thành trường nào ("sân vườn") → điền tiếp theo NỘI DUNG TIN: các chữ đứng ngay sau cụm đó trong tiêu đề, mô tả tin.
// Bấm dòng nào → trang danh sách đọc lại cả câu (cauThanhBoLoc), lọc đúng trường.
// ============================================================================
const thuongVi = (s: string) => s.normalize("NFC").toLowerCase().replace(/\s+/g, " ").trim();
// tên là SỐ ("Quận 7", "Phường 12") thì giữ chữ cấp — "tại 7" không ai hiểu
const boCapNoi = (s: string) => { const x = s.trim().replace(/^(Phường|Xã|Thị trấn|Đặc khu|Quận|Huyện|Thị xã|Thành phố|TP\.?)\s+/i, ""); return /^\d+$/.test(x) ? s.trim() : x; };

/** Phần nối tiếp nhiều tin nhất cho một câu — trả về các cụm chữ (thường) đã xếp theo số tin */
function noiTiepTheoDuLieu(cau: string, md: "ban" | "thue", tin: Listing[]): string[] {
  const p = parseQuery(cau);
  const bl = cauThanhBoLoc({ ...emptyFilters(), keyword: cau }, md);
  const tap = applyFilters(tin.filter((l) => !l.banSao && (l.purpose ?? "ban") === md), { ...(bl ?? emptyFilters()), keyword: "" });
  const dem = new Map<string, number>();
  const cong = (k: string) => { if (k) dem.set(k, (dem.get(k) ?? 0) + 1); };
  const nq = ` ${normalizeVi(cau).replace(/[^a-z0-9]+/g, " ")} `;
  const daCo = (x: string) => nq.includes(` ${normalizeVi(x).replace(/[^a-z0-9]+/g, " ").trim()} `);
  const tinh = p.place?.province ?? p.places[0];
  // "nhà", "nhà đất" đã là loại hình chung — không nối thêm "nhà riêng" sau "nhà hẻm ô tô"
  const coNha = / nha /.test(nq);
  if (!p.types.length && !coNha) for (const l of tap) cong(thuongVi(tenLoaiHinh(l.type ?? ""))); // tên hiện, không dấu "/" (07/11/2026)
  else if (!tinh) for (const l of tap) cong(thuongVi(boCapNoi(l.location.split(",").pop() ?? "")));
  else if (!p.place?.ward && !p.place?.district) for (const l of tap) cong(thuongVi(boCapNoi(l.location.split(",")[0] ?? "")));
  // đủ loại + nơi, chưa nói giá → các mức giá đang có tin ("căn hộ 2 phòng ngủ sơn trà" → "… dưới 3 tỷ")
  else {
    // ĐỦ LOẠI + NƠI → nối tiếp như Google, đủ dòng (anh 07/11/2026: "chỉ có 1 dòng, CHẾT"): mức giá · đặc điểm · "giá rẻ" theo TIN THẬT.
    // Phường ít tin → lấy tin cả tỉnh cùng loại hình (nối tiếp vẫn đúng ý câu, bấm thì trang tìm theo độ chính xác rồi tương tự)
    const rong = tap.length >= 3 || !bl ? tap
      : applyFilters(tin.filter((l) => !l.banSao && (l.purpose ?? "ban") === md), { ...bl, keyword: "", locations: bl.locations.map((x) => ({ province: x.province })) });
    const ra: string[] = [];
    const coGia = p.priceMaxTy != null || p.priceMinTy != null || / (ty|trieu|tr) /.test(nq);
    if (!coGia) {
      const muc = md === "thue" ? [[0.003, "3 triệu"], [0.005, "5 triệu"], [0.01, "10 triệu"], [0.015, "15 triệu"], [0.02, "20 triệu"]] as const : [[2, "2 tỷ"], [3, "3 tỷ"], [5, "5 tỷ"], [10, "10 tỷ"]] as const;
      for (const [ty, chu] of muc) if (rong.some((l) => { const g = priceToTy(l.price); return g != null && g <= ty; })) ra.push(`dưới ${chu}`);
      // chưa có tin nào để đo → vẫn đưa các mức thường gặp (như nhánh "dưới / trên"; bấm thì trang tìm rồi ra tương tự)
      if (!rong.length) ra.push(...muc.slice(0, 3).map(([, chu]) => `dưới ${chu}`));
    }
    // đặc điểm (Lọc thêm) có tin — nhiều tin trước
    const dd = dacDiemOptions.filter((d) => !daCo(d) && !(bl?.dacDiem ?? []).includes(d))
      .map((d) => [d, rong.filter((l) => coDacDiem(l, d)).length] as const).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).map(([d]) => d);
    // xen kẽ giá – đặc điểm để mấy dòng đầu có cả hai
    const kq: string[] = [];
    for (let i = 0; i < Math.max(ra.length, dd.length); i++) { if (ra[i]) kq.push(ra[i]); if (dd[i]) kq.push(dd[i]); }
    if (!coGia && !/ re /.test(nq)) kq.push("giá rẻ");
    return kq;
  }
  return [...dem].filter(([k]) => k && !/\d/.test(k) && !daCo(k) && normalizeVi(k) !== normalizeVi(tinh ?? "")).sort((a, b) => b[1] - a[1]).map(([k]) => k);
}

const CHU_DEM = new Set(["gồm", "có", "và", "là", "của", "với", "cho", "được", "các", "những", "ở", "tại", "đã", "rất", "thì", "này", "đó", "nên", "để", "khi", "từ", "đến", "chỉ", "còn", "ra", "vào", "lên"]);

/** Chữ khách gõ không thành trường nào → các chữ hay đứng NGAY SAU cụm đó trong tiêu đề, mô tả tin (nhiều tin trước) */
function noiTiepTheoNoiDung(cau: string, md: "ban" | "thue", tin: Listing[]): string[] {
  const coDauCau = coDau(cau);
  const goc = (coDauCau ? thuongVi(cau).split(/[^\p{L}\p{N}]+/u).join(" ") : normalizeVi(cau).replace(/[^a-z0-9]+/g, " ")).trim();
  if (goc.length < 2) return [];
  const dem = new Map<string, number>();
  for (const l of tin) {
    if (l.banSao || (l.purpose ?? "ban") !== md) continue;
    const chu = [l.title, l.desc, l.searchText].filter(Boolean).join(" . ").normalize("NFC").split(/[^\p{L}\p{N}]+/u).filter(Boolean);
    const bo = chu.map((w) => (coDauCau ? thuong(w) : normalizeVi(w)));
    const n = goc.split(" ").length;
    const daGap = new Set<string>();
    for (let i = 0; i + n <= bo.length; i++) {
      // cụm khách gõ khớp (chữ cuối có thể đang gõ dở) → lấy 1–2 chữ ngay sau
      const doan = bo.slice(i, i + n).join(" ");
      if (!(doan === goc || (doan.startsWith(goc) && bo.slice(i, i + n - 1).join(" ") === goc.split(" ").slice(0, -1).join(" ")))) continue;
      // cụm khách gõ (chữ dở điền trọn theo tin) + MỘT chữ đứng sau; chính cụm đó cũng là một gợi ý
      const tron = thuongVi(chu.slice(i, i + n).join(" "));
      if (!daGap.has(tron)) { daGap.add(tron); dem.set(tron, (dem.get(tron) ?? 0) + 1); }
      // chữ nối, chữ đệm đứng sau ("nở hậu gồm") không phải cụm người ta tìm
      // chữ đứng sau là chữ đệm hoặc con số trơ ("nhà đang xây 3") → không phải cụm người ta tìm
      if (CHU_DEM.has(thuong(chu[i + n] ?? "")) || /\d/.test(chu[i + n] ?? "")) continue;
      const tiep = thuongVi(chu.slice(i, i + n + 1).join(" "));
      if (tiep && !/\d{3,}/.test(tiep) && !daGap.has(tiep)) { daGap.add(tiep); dem.set(tiep, (dem.get(tiep) ?? 0) + 1); }
    }
  }
  // cụm phải có ít nhất 2 tin nhắc tới — tránh chữ ngẫu nhiên của một tin
  return [...dem].filter(([k, n]) => n >= 2 && !/^\p{L}{1,2}$/u.test(k.split(" ").pop() ?? "")).sort((a, b) => b[1] - a[1]).map(([k]) => k);
}

/** ĐẶT DẤU chữ khách gõ không dấu THEO CỤM có trong bộ từ (loại hình, đặc điểm, địa danh…), cụm dài khớp trước: "chung cu gia re hue"
 *  → "chung cư giá rẻ huế", "gia lai" vẫn là "gia lai" của Gia Lai (không thành "giá lai"). Chữ đã có dấu giữ nguyên như khách gõ. */
export function datDau(cau: string, boTu: string[]): string {
  const bang = new Map<string, string>();
  // chữ nối hay gõ không dấu (đứng một mình) — đặt dấu theo cụm ở trên trước, không khớp cụm mới tới chữ lẻ
  for (const c of ["dưới", "trên", "tại", "gần", "giá", "rẻ", "từ", "đến", "ở", "mới", "đường", "phường", "xã"]) bang.set(normalizeVi(c), c);
  for (const c of [...CUM_CO_DINH, ...boTu]) { const k = normalizeVi(c).replace(/[^a-z0-9]+/g, " ").trim(); if (k && !bang.has(k)) bang.set(k, thuong(c.trim())); }
  const tu = cau.split(/\s+/).filter(Boolean);
  const ra: string[] = [];
  for (let i = 0; i < tu.length;) {
    let khop = 0;
    for (let k = Math.min(4, tu.length - i); k >= 1; k--) {
      const doan = tu.slice(i, i + k);
      if (doan.every((w) => coDau(w))) continue; // cả đoạn khách đã đặt dấu → giữ nguyên
      const co = bang.get(normalizeVi(doan.join(" ")).replace(/[^a-z0-9]+/g, " ").trim());
      const coTu = co?.split(" ") ?? [];
      // chữ khách ĐÃ đặt dấu phải trùng đúng chữ của cụm ("gia rẻ" → "giá rẻ"); lệch dấu thì không ghép (giữ ý khách)
      if (co && coTu.length === k && doan.every((w, j) => !coDau(w) || thuong(w) === coTu[j])) { ra.push(co); khop = k; break; }
    }
    if (!khop) { ra.push(tu[i]); khop = 1; }
    i += khop;
  }
  return ra.join(" ");
}

export function goiYGoTiep(raw: string, md: "ban" | "thue", tin: Listing[], boTu: string[], toiDa = 6, ds: DuAnLoc[] = []): DongGoiY[] {
  const ra: DongGoiY[] = [];
  // GỢI Ý CHUẨN GOOGLE (anh 07/11/2026): mọi dòng = ĐÚNG CHỮ, ĐÚNG THỨ TỰ khách gõ (đặt dấu nếu gõ không dấu) + phần nối tiếp —
  // không đảo thành "câu đã hiểu" ("chung cư tại huế giá rẻ"), không chêm "tại". Bộ lọc vẫn đọc ý câu thành trường khi tìm.
  const them = (nhan: string) => {
    const x = datDau(thuongVi(nhan), boTu);
    if (x && !ra.some((d) => normalizeVi(d.nhan) === normalizeVi(x))) ra.push({ nhan: x, muc: md, href: hrefGoiY(md, x) });
  };
  // CÂU ĐÃ HIỂU đứng đầu khi máy nhận ra từ 2 phần trở lên và câu ghép khác câu khách gõ (khách đã gõ xong chữ cuối)
  // chữ cuối là SỐ + ĐƠN VỊ đã trọn ("2pn", "70m2", "4 tỷ") cũng là câu đã gõ xong — không đợi dấu cách (01/11/2026)
  const soTron = /\d\s*(pn|m2|m²|tỷ|ty|triệu|trieu|tr)$/i.test(raw.trim()) && !chuChuaHieu(raw);
  const hieuCau = /\s$/.test(raw) || soTron || goTiep(raw, boTu)[0] === raw.trim() ? cauDaHieu(raw, md, ds) : null;
  void hieuCau; // không đưa "câu đã hiểu" (đảo thứ tự) lên đầu gợi ý nữa — chuẩn Google (07/11/2026)
  // "3 phòng trọ" không phải cách nói (số + phòng = phòng ngủ)
  const cacCau = goTiep(raw, boTu).map(thuongVi).filter((c) => c && !/\d+ phòng trọ$/.test(c));
  // chữ lạ ngắn ("sân") goTiep bỏ đi — vẫn giữ nguyên chữ khách gõ để dò trong nội dung tin
  const nguyen = thuongVi(raw);
  if (!cacCau.length || normalizeVi(cacCau[0]).split(" ").length < normalizeVi(nguyen).split(" ").length) cacCau.unshift(nguyen);
  const hieu = (c: string) => { const p = parseQuery(c); return p.types.length > 0 || !!p.place || p.places.length > 0 || p.priceMaxTy != null || p.priceMinTy != null || !!p.beds || p.features.length > 0 || !!p.purpose
    // "nhà", "nhà đất" trơn là loại hình chung (không có trong danh mục loại) — vẫn là chữ đã hiểu
    || / (nha|nha dat|bat dong san|bds) /.test(` ${normalizeVi(c).replace(/[^a-z0-9]+/g, " ")} `); };
  // câu chính (chữ cuối điền trọn) + phần nối tiếp theo dữ liệu; các cách điền chữ cuối khác ("đà" → đà lạt) mỗi cách một dòng
  const soTin = (c: string) => {
    const bl = cauThanhBoLoc({ ...emptyFilters(), keyword: c }, md);
    return bl ? applyFilters(tin.filter((l) => !l.banSao && (l.purpose ?? "ban") === md), { ...bl, keyword: "" }).length : 0;
  };
  // CHỮ CHỜ GIÁ ở cuối ("dưới", "trên", "khoảng", "giá") → các mức giá ĐANG CÓ TIN, không dò nội dung ("dưới chân" — 01/11/2026)
  const cuoi = normalizeVi(nguyen.split(" ").pop() ?? "");
  if (["duoi", "tren", "khoang", "gia"].includes(cuoi) && nguyen.split(" ").length > 1) {
    const muc = md === "thue" ? ["3 triệu", "5 triệu", "7 triệu", "10 triệu", "15 triệu", "20 triệu", "30 triệu", "50 triệu"] : ["1 tỷ", "2 tỷ", "3 tỷ", "5 tỷ", "7 tỷ", "10 tỷ", "15 tỷ", "20 tỷ", "30 tỷ"];
    const ds = muc.map((m) => `${nguyen} ${m}`).filter((c) => soTin(c) > 0);
    // tổ hợp chưa có tin ở mức nào → vẫn đưa các mức thường gặp (bấm thì trang nới dần như mọi lần tìm)
    const dung = ds.length ? ds : muc.slice(1, 5).map((m) => `${nguyen} ${m}`);
    for (const c of (cuoi === "tren" ? dung.reverse() : dung).slice(0, toiDa)) them(c);
    return ra;
  }
  // số đứng cuối ("dưới 4") → chỉ giữ đơn vị có tin thật (bán căn hộ không có "4 triệu")
  if (/^\d+([.,]\d+)?$/.test(cuoi)) {
    // đơn vị theo mục: bán → tỷ (triệu chỉ khi ≥ 100: "800 triệu"), thuê → triệu
    const dungDonVi = (c: string) => md === "thue" ? !/ tỷ$/.test(c) : !/ triệu$/.test(c) || Number(cuoi) >= 100;
    const hop = cacCau.filter(dungDonVi);
    const coTin = hop.filter((c) => soTin(c) > 0);
    cacCau.splice(0, cacCau.length, ...(coTin.length ? coTin : hop.length ? hop : cacCau));
  }
  // ĐỊA DANH ĐÃ TRỌN ở cuối câu ("hội an", "sơn trà") → câu đã trọn, không điền tiếp chữ cuối thành nơi khác ("hội an hải")
  const plN = parseQuery(nguyen).place;
  const tenN = plN ? normalizeVi(boCapNoi(plN.ward ?? plN.district ?? plN.province)) : "";
  const cuoiN = ` ${normalizeVi(nguyen).replace(/[^a-z0-9]+/g, " ").trim()}`;
  const tinhN = tenTinhTrongCau(normalizeVi(nguyen))?.[0]; // tên tỉnh cũ / mới ("long an") cũng là nơi đã trọn
  if ((tenN && cuoiN.endsWith(` ${tenN}`)) || (tinhN && cuoiN.endsWith(` ${tinhN}`))) cacCau.splice(0, cacCau.length, nguyen);
  const chinh = cacCau[0];
  // Phần chữ CHƯA ĐỌC được thành trường nào (cụm cuối của chuChuaHieu). Chỉ phần đó mới dò nội dung tin — các chữ đã đọc (loại, nơi,
  // giá…) không bao giờ bị chắp đuôi theo nội dung ("sơn trà trước", "cao cấp đông" — 01/11/2026)
  const cumLa = chuChuaHieu(chinh).split(", ").filter(Boolean);
  const laCuoi = cumLa[cumLa.length - 1] ?? "";
  const dau = chinh.split(" ");
  const nLa = laCuoi ? laCuoi.split(/\s+/).length : 0;
  const laOCuoi = !!laCuoi && normalizeVi(dau.slice(-nLa).join(" ")) === normalizeVi(laCuoi);
  // CÂU KHÔNG LIÊN QUAN ("ăn phở ngon", "thời tiết hôm nay"): chữ lạ chiếm từ nửa câu trở lên mà không tin nào nhắc tới → không gợi ý
  const soLa = cumLa.join(" ").split(/\s+/).filter(Boolean).length;
  if (!hieu(chinh) && soLa * 2 >= dau.length && !cumLa.some((c) => noiTiepTheoNoiDung(c, md, tin).length)
    && !timDuAnTrongCau(` ${normalizeVi(chinh).replace(/[^a-z0-9]+/g, " ")} `, ds)) return ra; // tên dự án gõ dở ("sun ponte") là hiểu
  if (laOCuoi && nLa === 1) {
    // chữ lạ đứng CUỐI, một chữ ("sân", "kiệt") → điền tiếp theo nội dung tin ("sân vườn", "kiệt ô tô"); không tin nào nhắc → giữ nguyên
    const nd = noiTiepTheoNoiDung(laCuoi, md, tin);
    for (const c of nd.slice(0, toiDa)) them([...dau.slice(0, dau.length - 1), c].join(" "));
    if (!nd.length && hieu(chinh)) them(chinh);
  } else if (hieu(chinh)) {
    // câu đã đọc được (chữ lạ, nếu có, là cụm trọn — vẫn dò trong nội dung khi tìm) → nối tiếp phần còn thiếu theo dữ liệu
    them(chinh);
    // mỗi dòng nối tiếp đọc lại thành CÂU ĐÃ HIỂU ("sơn trà" + căn hộ → "căn hộ tại sơn trà, đà nẵng")
    for (const k of noiTiepTheoDuLieu(chinh, md, tin).slice(0, toiDa)) them(`${chinh} ${k}`); // nối tiếp sau đúng câu khách gõ
  } else if (laCuoi) {
    const nd = noiTiepTheoNoiDung(laCuoi, md, tin);
    for (const c of nd.slice(0, toiDa)) them([...dau.slice(0, dau.length - nLa), c].join(" "));
    // tên dự án (gõ trọn hoặc gõ đầu tên) → giữ câu, trang danh sách tìm tin thuộc dự án đó
    if (!nd.length && timDuAnTrongCau(` ${normalizeVi(chinh).replace(/[^a-z0-9]+/g, " ")} `, ds)) them(chinh);
  }
  for (const c of cacCau.slice(1)) if (hieu(c)) them(c);
  return ra.slice(0, toiDa);
}

/** Ô DỰ ÁN — cùng cơ chế: giữ chữ khách gõ, điền tiếp theo DANH BẠ DỰ ÁN THẬT (loại hình theo cây loại hình → tỉnh/thành → phường/xã,
 *  nhiều dự án trước) + dự án / chủ đầu tư khớp tên phần chữ chưa đọc thành trường nào. Bấm dòng câu → trang Dự án đọc câu vào trường. */
export function goiYGoTiepDuAn(raw0: string, ds: DuAnLoc[], boTu: string[], toiDa = 6): DongGoiY[] {
  // DỰ ÁN KHÔNG LỌC THEO GIÁ, DIỆN TÍCH, PHÒNG NGỦ, HƯỚNG, PHÁP LÝ, NỘI THẤT (trường Dự án: khu vực · loại hình · chủ đầu tư · dự án ·
  // tình trạng) → bỏ các cụm đó khỏi câu trước khi gợi ý, kể cả số đang gõ dở ở cuối ("khoảng 15") — 01/11/2026
  const lt = docLocThem(raw0);
  // bỏ từng cụm Lọc thêm (trừ tình trạng) + diện tích theo CHỮ: so từng chữ đã bỏ dấu
  const chu = raw0.trim().split(/\s+/);
  const boDau = chu.map((w) => normalizeVi(w).replace(/[^a-z0-9]/g, ""));
  const bo = new Set<number>();
  for (const c of [...lt.cum.filter((x) => !/^(sap mo ban|dang mo ban|da ban giao|da hoan thanh)$/.test(x)), docDienTich(raw0).cum].filter(Boolean)) {
    const w = c.split(/\s+/).map((x) => x.replace(/[^a-z0-9]/g, ""));
    for (let i = 0; i + w.length <= boDau.length; i++) if (w.every((x, k) => boDau[i + k] === x)) { for (let k = 0; k < w.length; k++) bo.add(i + k); break; }
  }
  let raw = chu.filter((_, i) => !bo.has(i)).join(" ") + (/\s$/.test(raw0) ? " " : "");
  raw = raw
    .replace(/(^|\s)(dưới|trên|từ|khoảng|tầm|giá)?\s*\d+([.,]\d+)?\s*(tỷ|ty|triệu|trieu|tr)(\s*(\/|một|1|mỗi)?\s*tháng)?(?=\s|$)/gi, " ")
    .replace(/(^|\s)\d+\s*(pn|phòng ngủ|phong ngu)(?=\s|$)/gi, " ")
    .replace(/(^|\s)(dưới|trên|từ|khoảng|tầm|giá)?\s*\d+([.,]\d+)?\s*$/i, " ") // số đang gõ dở ở cuối
    .replace(/(^|\s)(dưới|trên|từ|khoảng|tầm|giá)\s*$/i, " ")
    .replace(/\s+/g, " ").replace(/^\s+/, "") + (/\s$/.test(raw0) ? " " : "");
  if (!raw.trim()) return [];
  const ra: DongGoiY[] = [];
  // CHUẨN GOOGLE như ô Mua bán / Cho thuê (07/11/2026): giữ đúng chữ, thứ tự khách gõ, đặt dấu theo cụm, nối tiếp phía sau
  const them = (nhan: string, href?: string) => {
    const x = href ? nhan : datDau(thuongVi(nhan), boTu);
    if (x && !ra.some((d) => normalizeVi(d.nhan) === normalizeVi(x))) ra.push({ nhan: x, muc: "duan", href: href ?? `/du-an?q=${encodeURIComponent(x)}` });
  };
  // số khách gõ giữ nguyên — dự án không lọc theo giá, không chắp "tỷ" / "triệu"; ĐỊA DANH đã trọn ở cuối câu ("hội an") cũng giữ
  const plR = parseQuery(raw).place;
  const tenR = plR ? normalizeVi(boCapNoi(plR.ward ?? plR.district ?? plR.province)) : "";
  const cuoiR = ` ${normalizeVi(raw).replace(/[^a-z0-9]+/g, " ").trim()}`;
  const tinhR = tenTinhTrongCau(normalizeVi(raw))?.[0];
  const tronNoi = (!!tenR && cuoiR.endsWith(` ${tenR}`)) || (!!tinhR && cuoiR.endsWith(` ${tinhR}`));
  // điền chữ cuối: bỏ cách điền ra trường Dự án không có ("đang" → "đang chờ sổ" là pháp lý; Dự án chỉ có tình trạng "đang mở bán")
  const khongPhaiDuAn = (c: string) => { const x = docLocThem(c); return !!(x.direction || x.legal || x.furnishing || x.verified || x.broker); };
  const dienTiep = goTiep(raw, boTu).filter((c) => !khongPhaiDuAn(c) || khongPhaiDuAn(raw));
  const chinh = thuongVi(/\d\s*$/.test(raw) || tronNoi ? raw : dienTiep[0] ?? raw);
  if (!chinh) return ra;
  // CÂU ĐÃ HIỂU đứng đầu (loại hình · dự án / chủ đầu tư · vị trí · tình trạng)
  const hieuCau = /\s$/.test(raw) || chinh === thuongVi(raw) ? cauDaHieu(raw, "duan", ds) : null;
  void hieuCau; // không đưa câu đảo thứ tự lên đầu (chuẩn Google, 07/11/2026)
  const boChuDuAn = chinh.replace(/(^|\s)dự\s+án(?=\s|$)/g, " ").trim();
  const p = parseQuery(boChuDuAn);
  const lf = locTuCauDuAn(boChuDuAn);
  const tap = thuHepDuAn(ds, { ...emptyFilters(), locations: lf.locations, types: lf.types }).tapDuAn;
  const la = chuChuaHieu(boChuDuAn); // các cụm chữ lạ, cách nhau dấu phẩy
  const coTruong = p.types.length > 0 || !!p.place || p.places.length > 0;
  // có chữ lạ (tên dự án, chủ đầu tư…) → chỉ giữ câu, không nối thêm loại · nơi sau nó ("… sun group an hải" — 01/11/2026)
  if (!la && (coTruong || !boChuDuAn)) {
    them(chinh);
    const dem = new Map<string, number>();
    const cong = (k: string) => { if (k) dem.set(k, (dem.get(k) ?? 0) + 1); };
    const tinh = p.place?.province ?? p.places[0];
    if (!p.types.length) for (const d of tap) loaiCuaDuAn(d.loaiHinh).forEach((o) => cong(thuongVi(tenLoaiHinh(o))));
    else if (!tinh) for (const d of tap) cong(thuongVi(d.tinh));
    // nối PHƯỜNG / XÃ của dự án (phần địa chỉ có chữ cấp), không lấy tên đường ("trục trần hưng đạo…" — 07/11/2026)
    else if (!p.place?.ward && !p.place?.district) for (const d of tap) cong(thuongVi(boCapNoi(d.diaChiTim.split(/[,·]/).map((x) => x.trim()).find((x) => /^(Phường|Xã|Thị trấn|Đặc khu)\s/i.test(x)) ?? "")));
    const nq = ` ${normalizeVi(chinh).replace(/[^a-z0-9]+/g, " ")} `;
    for (const [k] of [...dem].filter(([k]) => k && !/\d/.test(k) && !nq.includes(` ${normalizeVi(k)} `)).sort((a, b) => b[1] - a[1]).slice(0, toiDa))
      them(`${chinh} ${k}`); // nối tiếp sau đúng câu khách gõ (chuẩn Google)
    // đủ loại + nơi → các DỰ ÁN THẬT đúng loại, đúng nơi (bấm là mở trang dự án)
    if (p.types.length && tinh) for (const d of tap.slice(0, 3)) them(d.ten, `/du-an/${d.slug}`);
  }
  // dự án / chủ đầu tư khớp tên phần chữ chưa đọc thành trường nào ("sun" → Sun Galaxy…)
  // từng cụm chữ lạ, trong tập đúng loại · nơi trước, không có thì cả danh bạ
  for (const cum of la.split(/\s{2,}|,\s*/).map((x) => x.trim()).filter((x) => x.replace(/\s/g, "").length >= 2)) {
    const khop = thuHepDuAn(tap, emptyFilters()).goiY(cum, 3);
    for (const d of khop.length ? khop : thuHepDuAn(ds, emptyFilters()).goiY(cum, 3)) them(d.ten, `/du-an/${d.slug}`);
  }
  // có chữ lạ → dự án khớp tên đứng trước, rồi câu khách gõ (trùng tên dự án thì thôi)
  // chữ lạ không khớp dự án, chủ đầu tư nào ("abc", "con mèo") → không gợi ý gì
  // câu không liên quan (chữ lạ từ nửa câu trở lên, không khớp dự án nào — "ăn phở ngon") → không gợi ý
  const soLa = la.split(/[\s,]+/).filter(Boolean).length;
  if (la && (ra.length || (coTruong && soLa * 2 < chinh.split(" ").length))) them(chinh);
  return ra.slice(0, toiDa);
}

/** Câu → khu vực + loại hình cho bộ lọc Dự án (cùng bộ đọc locTuCau của Mua bán) */
function locTuCauDuAn(cau: string) {
  const f = locTuCau(cau, "ban");
  return { locations: f.locations, types: f.types };
}

// ============================================================================
// CÂU ĐÃ HIỂU — GHÉP MỌI PHẦN BỘ ĐỌC NHẬN RA THÀNH MỘT CÂU DÀI (chủ dự án 01/11/2026: "hiểu được mục đích · loại hình · vị trí · tên
// dự án · chủ đầu tư · các trường lọc thêm — kết nối các gợi ý hiểu được lại với nhau thành một cái dài"). Đứng ĐẦU danh sách gợi ý:
// khách thấy ngay máy hiểu câu mình ra sao; bấm là lọc đúng các trường đó. Thứ tự cố định:
//   mục đích · loại hình · dự án / chủ đầu tư · tại vị trí · diện tích · phòng ngủ · hướng · pháp lý · nội thất · đặc điểm · giá · chữ khác
// ============================================================================
/** Tên dự án trong câu — tên trọn, hoặc gõ ĐẦU tên từ 2 chữ trở lên ("sun ponte" → Sun Ponte Residence); phần đầu tên toàn chữ loại
 *  hình / nơi chốn ("căn hộ sơn trà") không phải tên dự án. nq: câu bỏ dấu, có cách hai đầu. Tên dài khớp trước. */
export function timDuAnTrongCau(nq: string, ds: DuAnLoc[]): { d: DuAnLoc; c: string } | undefined {
  const dauTen = (ten: string) => {
    const w = normalizeVi(ten).replace(/[^a-z0-9]+/g, " ").trim().split(" ");
    for (let k = w.length; k >= Math.min(2, w.length); k--) { const c = w.slice(0, k).join(" "); if (c.length >= 4 && nq.includes(` ${c} `) && chuChuaHieu(c)) return c; }
    return "";
  };
  return ds.map((d) => ({ d, c: dauTen(d.ten) })).filter((x) => x.c).sort((a, b) => b.c.length - a.c.length)[0];
}

/** giuChuLa = false: dòng "Đang hiển thị kết quả cho …" — bỏ chữ không hiểu (anh 08/11/2026: không gợi ý được thì thôi, CẤM gợi ý bậy) */
export function cauDaHieu(raw: string, md: "ban" | "thue" | "duan", ds: DuAnLoc[] = [], giuChuLa = true): { cau: string; soPhan: number } {
  const cau = thuongVi(raw);
  const p = parseQuery(cau);
  const nq = ` ${normalizeVi(cau).replace(/[^a-z0-9]+/g, " ")} `;
  const f = locTuCau(cau, md === "thue" ? "thue" : "ban");
  const phan: string[] = [];
  let so = 0;
  const them = (x: string | false | null | undefined) => { if (x) { phan.push(x); so++; } };
  // mục đích — chỉ khi khách nói
  // mục đích — chỉ ghi khi khách GÕ chữ mua / bán / thuê (đọc ra từ "triệu/tháng", "sang nhượng" thì tab đã chuyển, không chêm chữ)
  if (md !== "duan" && p.purpose && / (mua|ban|thue) /.test(nq.replace(/ (mo ban|ban giao|co ban|ban cong) /g, " "))) them(p.purpose === "thue" ? "cho thuê" : / mua /.test(nq) ? "mua" : "bán");
  if (md === "duan" && / du an /.test(nq)) them("dự án");
  // loại hình (cây cha–con) · "nhà" chung
  const nqL = nq.replace(/ nha trang /g, " "); // "nha trang" (gõ không dấu) là nơi chốn, không phải "nhà"
  const loai = p.types[0]?.toLowerCase() ?? (/ nha /.test(nqL) && !/ nha dat /.test(nqL) ? "nhà" : / nha dat /.test(nqL) ? "nhà đất" : "");
  them(loai);
  // gõ NƠI CHỐN mà chưa nói loại → đọc là "nhà đất tại …" (Dự án: "dự án tại …") — câu đọc tròn ý, không bắt đầu bằng "tại"
  if (!loai && f.locations.length && !phan.length) phan.push(md === "duan" ? "dự án" : "nhà đất");
  // THỨ TỰ CÁC TRƯỜNG (chủ dự án 01/11/2026): mục đích (tab) · loại hình · tại ĐỊA DANH · giá · diện tích · chủ đầu tư · dự án · Lọc thêm · nội dung
  // (loại hình đứng trước địa danh chỉ vì cách nói tiếng Việt: "bán căn hộ tại sơn trà")
  const khopDa = timDuAnTrongCau(nq, ds);
  const duAn = khopDa?.d;
  const cdt = ds.map((d) => d.chuDauTu).filter((c) => c && c.length >= 3).sort((a, b) => b.length - a.length).find((c) => nq.includes(` ${normalizeVi(c).replace(/[^a-z0-9]+/g, " ").trim()} `));
  // 2. địa danh — phường/xã kèm quận cũ (nếu khách nói) và tỉnh; tên tỉnh cũ ghi cả tỉnh mới: "tại quảng bình (nay quảng trị)"
  const l = f.locations[0];
  const tinhCu = l && !l.ward && !l.district ? provincesOld.find((x) => normalizeVi(x.name) !== normalizeVi(l.province) && newProvinceOf(x.name) === l.province && nq.includes(` ${normalizeVi(x.name)} `))?.name : undefined;
  // KHÔNG ghi "(nay …)" (anh 07/11/2026: "không cần nay là hay gì cả, làm chuẩn"): gõ tên tỉnh cũ → gợi ý ghi thẳng TÊN TỈNH HIỆN NAY
  void tinhCu;
  if (l) them(`tại ${[l.ward, l.district, l.province].filter(Boolean).map((x) => boCapNoi(x!)).filter((x, i, a) => a.indexOf(x) === i).join(", ")}`);
  if (md !== "duan") {
    // giá rồi diện tích — đúng thứ tự trường dưới ô tìm, trái qua phải (01/11/2026). Giá: một mức ("khoảng 3 tỷ", "10 triệu/tháng") · khoảng ("2 – 3 tỷ") · dưới · trên
    const chuGia = (ty: number) => (ty >= 1 ? `${Math.round(ty * 100) / 100} tỷ` : `${Math.round(ty * 1000)} triệu`);
    const motMuc = p.priceMinTy != null && p.priceMaxTy != null && Math.abs(p.priceMaxTy / p.priceMinTy - 1.15 / 0.85) < 0.01;
    them(motMuc ? `khoảng ${chuGia((p.priceMinTy! + p.priceMaxTy!) / 2)}${md === "thue" ? "/tháng" : ""}`
      : p.priceMinTy != null && p.priceMaxTy != null ? `${chuGia(p.priceMinTy)} – ${chuGia(p.priceMaxTy)}`
      : p.priceMaxTy != null ? `dưới ${chuGia(p.priceMaxTy)}` : p.priceMinTy != null ? `trên ${chuGia(p.priceMinTy)}` : "");
    them(f.areaMin != null && f.areaMax != null ? `khoảng ${Math.round(f.areaMax / 1.15)} m²` : f.areaMax != null ? `dưới ${f.areaMax} m²` : f.areaMin != null ? `trên ${f.areaMin} m²` : "");
    // "giá rẻ" khách gõ phải còn trong câu gợi ý (07/11/2026: "chung cu gia rẻ huế" → gợi ý mất "giá rẻ")
    them(/ gia re /.test(nq) ? "giá rẻ" : "");
  }
  // 6. chủ đầu tư · 7. dự án
  them(cdt && !(duAn && normalizeVi(duAn.chuDauTu || "") === normalizeVi(cdt)) ? `của ${cdt}` : "");
  them(duAn ? `dự án ${duAn.ten}` : "");
  // 8. Lọc thêm
  if (md !== "duan") {
    them(f.beds ? `${f.beds} phòng ngủ` : "");
    them(f.direction ? `hướng ${f.direction.toLowerCase()}` : "");
    them(f.legal ? (f.legal === "Sổ đỏ / Sổ hồng" ? (/ so do /.test(nq) ? "sổ đỏ" : "sổ hồng") : f.legal.toLowerCase()) : "");
    them(f.furnishing ? (f.furnishing === "Đầy đủ nội thất" ? "full nội thất" : f.furnishing.toLowerCase()) : "");
    them(f.verified ? "tin xác thực" : "");
    them(f.broker ? "môi giới chuyên nghiệp" : "");
    // 9. nội dung — đặc điểm
    for (const d of p.features.filter((x) => x !== "sổ hồng" && x !== "full nội thất")) them(d);
  } else them(f.tinhTrang ? f.tinhTrang.toLowerCase() : "");
  // chữ chưa đọc được thành trường nào (trừ tên dự án / chủ đầu tư đã nhận) giữ cuối — trang dò trong nội dung
  const daNhan = [khopDa?.c, cdt].filter((x): x is string => !!x);
  const la = chuChuaHieu(cau, daNhan);
  if (la && giuChuLa) phan.push(la.replace(/,/g, ""));
  return { cau: phan.join(" "), soPhan: so };
}

// ============================================================================
// CHỮ GÕ BẬY (chủ dự án 01/11/2026: "gõ xàm bậy, kiểu sCSASACGSAJBCJABCJD thì không gợi ý"): chữ không phải âm tiết tiếng Việt và
// không có trong dữ liệu web (tên dự án, chủ đầu tư, địa danh, chữ trong tin) → cả câu không gợi ý. Bộ chữ dựng một lần cho mỗi mảng tin.
// ============================================================================
const AM_TIET = /^(ngh|ng|gh|gi|kh|nh|ph|qu|th|tr|ch|[bcdghklmnprstvx])?(uye|uya|ieu|yeu|uoi|uou|oai|oay|oeo|uay|ai|ao|au|ay|eo|eu|ia|ie|iu|oa|oe|oi|oo|ua|ue|ui|uo|uu|uy|ye|ya|[aeiouy])(ch|ng|nh|[cmnpt])?$/;
const nhoTu = new WeakMap<Listing[], Set<string>>();
function boChuWeb(tin: Listing[], them: string[]): Set<string> {
  let s = nhoTu.get(tin);
  if (!s) {
    s = new Set<string>();
    for (const l of tin) for (const w of normalizeVi([l.title, l.desc, l.searchText, l.projectName].filter(Boolean).join(" ")).split(/[^a-z0-9]+/)) if (w) s.add(w);
    for (const [nhan, keys] of LOAI_HINH) for (const k of [nhan, ...keys]) for (const w of normalizeVi(k).split(/[^a-z0-9]+/)) if (w) s.add(w); // "officetel", "kiot"…
    nhoTu.set(tin, s);
  }
  for (const c of them) for (const w of normalizeVi(c).split(/[^a-z0-9]+/)) if (w) s.add(w);
  return s;
}
export function coChuRac(raw: string, tin: Listing[], them: string[]): boolean {
  const tu = normalizeVi(raw).split(/[^a-z0-9]+/).filter(Boolean);
  if (!tu.length) return false;
  const bo = boChuWeb(tin, them);
  const dangGo = !/\s$/.test(raw);
  return tu.some((w, i) => {
    if (/^\d/.test(w) || AM_TIET.test(w) || bo.has(w)) return false;
    // chữ cuối đang gõ dở: là đầu của một chữ trong dữ liệu web thì chưa phải bậy
    if (dangGo && i === tu.length - 1) { for (const x of bo) if (x.startsWith(w)) return false; }
    return true;
  });
}
