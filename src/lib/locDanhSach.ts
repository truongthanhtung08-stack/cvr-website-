import type { Listing } from "@/lib/data";
import { sortListings, applyFilters, emptyFilters, normalizeVi, typeGroupsFor, matchType, type Filters, type SortKey } from "@/lib/filters";
import { smartFilter, smartSearch, goiYNoiLong, parseQuery, coKhopTieuChi, chuChuaHieu } from "@/lib/smartSearch";
import { nhanDoiHienThi } from "@/lib/nhanDoiHienThi";
import { tierRank } from "@/lib/packages";
import { coordOf, centerOfArea } from "@/lib/geo";
import { choCuCua } from "@/lib/locations";

// ============================================================================
// LỌC DANH SÁCH TIN — MỘT hàm cho cả máy chủ lẫn trình duyệt (#1b kế hoạch SEO, 17/10/2026)
// ----------------------------------------------------------------------------
// Trước đây trình duyệt tải TOÀN BỘ tin (124 tin = 451 KB; 10.000 tin ≈ 30 MB) rồi mới lọc.
// Giờ trang lớn gọi /api/danh-sach/<muc>/loc: máy chủ chạy đúng hàm này, chỉ gửi 10 tin của
// trang đang xem. Trang nhỏ (tin tương tự trong trang tin…) vẫn lọc ngay ở trình duyệt bằng
// chính hàm này — hai nơi một cách xếp, không lệch nhau.
// ============================================================================

// Số tin mỗi trang: PC 15 · điện thoại 10 — MỘT quy định chung ở lib/soMoiTrang (PC gửi moiTrang 15 trong chính lần gọi lọc
// lúc mở trang; máy chủ chỉ nhận 10 hoặc 15).
import { PER_PAGE, MOI_TRANG_PC, soTinMoiTrang } from "@/lib/soMoiTrang";
export { PER_PAGE, MOI_TRANG_PC, soTinMoiTrang };
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
  /** Khách tìm "giá rẻ": dòng giá · diện tích của RIÊNG phân khúc rẻ (thay dòng số liệu cả trang) */
  khoangRe?: string;
  /** Số tin theo tỉnh/thành (cột phải "theo khu vực") */
  khuVuc: [string, number][];
  /** Tỉnh máy hiểu được (từ bộ lọc hoặc từ câu khách gõ) — để đặt dòng "Gợi ý khác tại …" */
  tinhHieu: string[];
  /** Không có tin đúng nhu cầu: câu nói rõ ("Chưa có tin cho thuê kho xưởng.") — thay nhãn tầng */
  thongBao?: string;
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
    // Gõ đúng chữ chi tiết ("đất nền") → đúng loại đó; gõ trần ("đất") → cả nhóm.
    // "căn hộ" / "chung cư" / "căn hộ chung cư" là MỘT nhu cầu → cả nhóm Căn hộ (lỗi 17/10/2026: chỉ lấy "Chung cư", bỏ sót
    // tin ghi "Căn hộ" → báo không có tin khớp trong khi trang pSEO cùng ý vẫn đầy tin)
    const motNhuCau = nhan === "chung cu" || nhan === "can ho";
    types = g ? (!motNhuCau && nq.includes(nhan) && chiTiet.length ? chiTiet : g.items) : pt.types;
  }
  return {
    ...f,
    types: f.types.length ? f.types : types,
    locations: f.locations.length ? f.locations : pt.locations?.length ? pt.locations : f.locations,
    priceMin: f.priceMin != null || f.priceMax != null ? f.priceMin : pt.priceMin ?? null,
    priceMax: f.priceMin != null || f.priceMax != null ? f.priceMax : pt.priceMax ?? null,
    beds: f.beds || pt.beds || 0,
    // Chi tiết máy không làm trường lọc ("view biển", "gần trường"…) và TỪ chưa hiểu ("sân vườn", "nở hậu" — chủ dự án
    // 21/10/2026) giữ lại làm từ khoá dò nội dung tin, XẾP tin khớp lên đầu
    // "trung tâm" + nơi chốn là VỊ TRÍ: locDanhSach xếp tin tự ghi ở trung tâm lên trước (khớp trọn cụm) — không để bộ dò chữ
    // khớp lẻ "tâm"/"trung" đẩy tin không liên quan lên đầu
    keyword: [...parseQuery(kw).features.filter((x) => x !== "trung tâm" || !pt.locations?.length), chuChuaHieu(kw).replace(/,/g, "")].filter(Boolean).join(" "),
  };
}

// LOẠI GẦN NGHĨA (dùng được cho cùng việc) — chỉ dùng khi cả web chưa có tin đúng loại khách tìm (chủ dự án 21/10/2026).
// Khoá và giá trị là chữ bỏ dấu nằm trong tên loại của tin.
const LOAI_GAN_NGHIA: [string, string[]][] = [
  ["kho", ["mat bang", "cua hang", "dat"]],
  ["van phong", ["mat bang", "cua hang", "shophouse"]],
  ["cua hang", ["mat bang", "shophouse", "nha mat pho"]],
  ["mat bang", ["cua hang", "shophouse", "nha mat pho"]],
  ["shophouse", ["nha mat pho", "cua hang"]],
  ["nha mat pho", ["shophouse", "nha rieng"]],
  ["nha rieng", ["nha mat pho", "biet thu", "lien ke"]],
  ["biet thu", ["nha rieng", "nha mat pho"]],
  ["condotel", ["can ho"]],
  ["can ho", ["condotel"]],
  ["chung cu", ["condotel"]],
  ["dat nen", ["dat"]],
  ["dat", ["dat nen"]],
  ["tro", ["can ho"]],
  ["trang trai", ["dat"]],
];
function loaiGanNghia(types: string[]): string[] {
  const n = types.map((t) => normalizeVi(t));
  return [...new Set(LOAI_GAN_NGHIA.filter(([k]) => n.some((t) => t.includes(k))).flatMap(([, v]) => v))]
    .filter((g) => !n.some((t) => t.includes(g)));
}

export function locDanhSach(
  items: Listing[],
  hetHan: Listing[],
  purpose: "ban" | "thue",
  filters: Filters,
  sort: SortKey,
  page: number,
  moiTrang = PER_PAGE,
  // "Bất động sản đã xem" (23/10/2026): giữ MỌI tin khách đã xem — cả bán lẫn thuê, cả tin hết hạn (đã có cờ hetHan), không nhân đôi
  tatCa = false,
): KetQuaLoc & { ketQua: Listing[] } {
  // Câu có "giá rẻ" → trong cùng nhóm, tin rẻ đứng trước (cùng quy ước với trang sạch ?sapxep=gia-tang)
  const timRe = / gia re /.test(` ${normalizeVi(filters.keyword)} `);
  if (sort === "moi" && timRe) sort = "gia-tang";
  // Câu có "trung tâm" (nhà đất bán trung tâm Đà Nẵng) → tin GẦN TÂM nơi khách nói đứng trước (chủ dự án 21/10/2026)
  const kwGoc = filters.keyword;
  const timTrungTam = !!kwGoc.trim() && parseQuery(kwGoc).features.includes("trung tâm");
  filters = cauThanhBoLoc(filters, purpose) ?? filters;
  // Nguồn theo đúng MỤC ĐÍCH + NHÂN ĐÔI HIỂN THỊ của CVR Diamond (nhanDoiHienThi.ts)
  const base = tatCa ? items : nhanDoiHienThi(items.filter((l) => (l.purpose ?? "ban") === purpose));
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
  const khopDu0 = sortListings(hits.filter((h) => h.tier === 1).map((h) => h.item), sort);
  const tinhChon = new Set(filters.locations.map((x) => x.province));
  // THỨ TỰ ƯU TIÊN (chủ dự án 17/10/2026): đúng LOẠI NHÀ là nền → đúng PHƯỜNG/QUẬN → đúng GIÁ → đúng TỈNH
  // → tỉnh khác. VD đất Hòa Xuân > đất Đà Nẵng dưới 3 tỷ > đất Đà Nẵng khác > đất tỉnh khác > nhà Hòa Xuân.
  const sauChon = filters.locations.filter((x) => x.district || x.ward);
  const coGia = filters.priceMin != null || filters.priceMax != null;
  // Tin có ĐẶC ĐIỂM khách gõ (biển, sông…) — từ khoá còn lại sau khi đã tách câu thành bộ lọc
  const coDacDiem = new Set(coTuKhoa ? search.hits.filter((h) => h.tier <= 2).map((h) => h.item.id) : []); // khớp chặt, không tính khớp lỏng 1 chữ
  const dungLoai = (l: Listing) => filters.types.length === 0 || filters.types.some((t) => matchType(l.type, t));
  const diemGoiY = (l: Listing) => {
    const dungTinh = tinhChon.size === 0 || tinhChon.has(l.location.split(",").pop()?.trim() ?? "");
    const dungSau = sauChon.length > 0 && applyFilters([l], { ...emptyFilters(), locations: sauChon }).length > 0;
    const dungGia = !coGia || applyFilters([l], { ...emptyFilters(), priceMin: filters.priceMin, priceMax: filters.priceMax }).length > 0;
    return (dungLoai(l) ? 128 : 0) + (dungSau ? 64 : 0) + (dungTinh ? 48 : 0) + (coDacDiem.has(l.id) ? 40 : 0) + (dungGia ? 32 : 0);
  };
  // KHU VỰC LÂN CẬN (chủ dự án 21/10/2026: "Villa biển gần Hội An" → gợi ý nơi gần Hội An trước): tâm = nơi khách nói (phường/quận),
  // không có thì tâm tỉnh. Tin ghi phường MỚI → quy về quận/huyện CŨ (bảng sáp nhập) để lấy toạ độ, không khớp thì tâm tỉnh.
  const tamNoi = (loc: string): [number, number] | null => {
    const hit = centerOfArea(loc.split(",").slice(0, -1).join(",")) ;
    if (hit) return hit;
    const [phuong, tinh] = [loc.split(",")[0]?.trim() ?? "", loc.split(",").pop()?.trim() ?? ""];
    const quan = choCuCua(tinh, phuong)[0]?.quan;
    return (quan ? centerOfArea(quan) : null) ?? centerOfArea(tinh);
  };
  const noiChon = sauChon[0];
  const tam = noiChon ? tamNoi(`${noiChon.ward ?? noiChon.district ?? ""}, ${noiChon.province}`) : tinhChon.size === 1 ? coordOf([...tinhChon][0], "") : null;
  const khoangCach = (l: Listing) => {
    if (!tam) return 0;
    const [a, b] = tamNoi(l.location) ?? coordOf(l.location.split(",").pop()?.trim() ?? "", "");
    return (a - tam[0]) ** 2 + (b - tam[1]) ** 2;
  };
  // "TRUNG TÂM" THEO NGHĨA CỦA TỪ (chủ dự án 21/10/2026: không tự gán quận nào là trung tâm): trong các tin khớp đủ, tin TỰ GHI
  // là ở vị trí trung tâm ("trung tâm thành phố", "ngay trung tâm", "quận trung tâm"…) đứng trước. Khớp trọn cụm "trung tâm",
  // không khớp lẻ chữ "tâm"/"trung"; "trung tâm thương mại" là toà nhà, không phải vị trí → không tính.
  // "cách / gần / về / ra trung tâm" là Ở NGOÀI trung tâm → xếp sau tin ở ngay trung tâm, trước tin không nhắc tới.
  const mucTrungTam = (l: Listing) => {
    const nd = ` ${normalizeVi([l.title, l.desc, l.searchText].filter(Boolean).join(" ")).replace(/[^a-z0-9]+/g, " ")} `;
    const cum = [...nd.matchAll(/ (\w+) trung tam (?!thuong mai|hoi nghi|tiec cuoi|y te)/g)].map((m) => m[1]);
    if (!cum.length) return 0;
    return cum.some((t) => !["cach", "gan", "ve", "ra", "toi", "den", "vao", "sat"].includes(t)) ? 2 : 1;
  };
  const khopDu = timTrungTam
    ? khopDu0.map((l, i) => ({ l, i, m: mucTrungTam(l) })).sort((a, b) => b.m - a.m || a.i - b.i).map((x) => x.l)
    : khopDu0;
  // KHÁCH ĐÃ NÓI LOẠI HÌNH → gợi ý CHỈ cùng loại hình, nới khu vực chứ không nới loại (chủ dự án 21/10/2026: "Villa biển gần
  // Hội An" không có tin thì gợi ý villa Đà Nẵng gần biển — không đưa condotel, nhà phố). Hết tin cùng loại thì nói là không có.
  // KHÁCH ĐÃ NÓI NƠI → gợi ý CHỈ trong tỉnh đó (chủ dự án 21/10/2026: "Villa biển gần Hội An" mà ra Huế, Lâm Đồng là vô nghĩa)
  const dungTinhChon = (l: Listing) => tinhChon.size === 0 || tinhChon.has(l.location.split(",").pop()?.trim() ?? "");
  const goiY = sortListings(hits.filter((h) => h.tier > 1 && coKhopTieuChi(h, filters) && dungLoai(h.item) && dungTinhChon(h.item)).map((h) => h.item), sort)
    .map((l, i) => ({ l, i, d: diemGoiY(l), xa: khoangCach(l) }))
    // cùng mức khớp: nơi GẦN tỉnh khách chọn đứng trước (Quảng Trị → Huế, Đà Nẵng trước Khánh Hòa)
    .sort((a, b) => b.d - a.d || a.xa - b.xa || a.i - b.i)
    .slice(0, TOI_DA_GOI_Y)
    .map((x) => x.l);
  // TIN HẾT HẠN CŨNG GỢI Ý THEO CÙNG LUẬT (chủ dự án 21/10/2026: kho còn ít tin, "Villa biển gần Hội An" bỏ sót biệt thự Đà Nẵng
  // đã hết hạn): cùng loại hình, cùng tỉnh, có đặc điểm + gần nơi khách nói trước — đứng SAU mọi tin còn hạn, nhãn "Tin hết hạn".
  const daCoHetHan = new Set(ketQuaHetHan.map((l) => l.id));
  const ungHetHan = gocHetHan.length
    ? smartFilter(gocHetHan, { ...filters, keyword: "" }).filter((h) => h.tier > 1 && coKhopTieuChi(h, filters) && dungLoai(h.item) && dungTinhChon(h.item) && !daCoHetHan.has(h.item.id)).map((h) => h.item)
    : [];
  if (coTuKhoa && ungHetHan.length) for (const h of smartSearch(ungHetHan, filters.keyword).hits) if (h.tier <= 2) coDacDiem.add(h.item.id);
  // Xếp CUỐI, theo CẤP rồi NGÀY ĐĂNG mới trước (chủ dự án 21/10/2026) — không xếp theo độ gần như tin còn hạn
  const ngayDang = (l: Listing) => Date.parse(l.bumpedAt ?? l.postedAt ?? "") || 0;
  const goiYHetHan = [...ungHetHan]
    .sort((a, b) => tierRank(a.badge) - tierRank(b.badge) || ngayDang(b) - ngayDang(a))
    .slice(0, TOI_DA_GOI_Y);
  // LUÔN CÓ KẾT QUẢ, XẾP TẦNG (chủ dự án 17/10/2026: "100% chính xác → chính xác → tương đối → đúng vài trường → gợi ý
  // tương tự"): có từ khoá chi tiết thì tin khớp từ khoá lên đầu, rồi tới tin khớp đủ bộ lọc, rồi gợi ý — không vứt tin nào.
  // Tin khớp từ khoá NHƯNG nằm ngoài bộ lọc (tỉnh khác, loại khác) KHÔNG được đứng trên tin đúng nơi đúng loại — rà 18/10/2026:
  // "nhà kiệt ô tô Thanh Khê" ra nhà hẻm Quy Nhơn đầu trang. Thứ tự: khớp chữ + đúng bộ lọc → đúng bộ lọc → khớp chữ ngoài
  // bộ lọc → gợi ý tương tự.
  const dungLoc = new Set(khopDu.map((l) => l.id));
  const khopChu = search.hits.map((h) => h.item);
  const chuTrong = khopChu.filter((l) => dungLoc.has(l.id));
  const chuNgoai = khopChu.filter((l) => !dungLoc.has(l.id) && dungLoai(l) && dungTinhChon(l)); // khớp chữ mà khác loại khách nói → không đưa vào
  const daCo = new Set(khopChu.map((l) => l.id));
  let ketQua = [
    // Khách đã nói loại hình: tin khớp chữ ngoài bộ lọc đã nằm trong bảng gợi ý (xếp theo tỉnh + đặc điểm) — không chen trước
    ...(coTuKhoa ? [...chuTrong, ...khopDu.filter((l) => !daCo.has(l.id)), ...(filters.types.length ? [] : chuNgoai), ...goiY.filter((l) => !daCo.has(l.id) || (filters.types.length > 0 && !dungLoc.has(l.id)))] : [...khopDu, ...goiY]),
    ...ketQuaHetHan,
    ...goiYHetHan,
  ];
  // KHÔNG BAO GIỜ 0 KẾT QUẢ (chủ dự án 21/10/2026): mọi tầng trên đều trống thì nới dần, dừng ở bậc đầu có tin, vẫn bám nhu cầu:
  // ① khách nói loại hình → cùng loại ở MỌI nơi, nơi gần chỗ khách nói trước · ② khách nói nơi → mọi loại trong tỉnh đó ·
  // ③ còn lại (câu không hiểu, không chữ nào khớp) → tin mới nhất của mục, theo cấp rồi ngày đăng. Nhãn "Gợi ý tương tự" như cũ.
  // GỢI Ý VÔ LÝ LÀ TỆ NHẤT (chủ dự án 21/10/2026, chốt hai luật):
  //   · Không có tin cùng loại ở đâu cả → nói rõ "Chưa có tin …" rồi CHỈ gợi ý loại GẦN NGHĨA (LOAI_GAN_NGHIA), gần nơi khách nói trước;
  //     không có loại gần nghĩa thì chỉ còn câu nói rõ.
  //   · Câu không hiểu chữ nào ("abc xyz": không trường nào, không tin nào khớp chặt) → nói rõ không tìm thấy, rồi tin mới nhất
  //     theo cấp, ghi đúng là tin mới nhất — không gắn nhãn khớp.
  let duPhong: Listing[] = [];
  let thongBao: string | undefined;
  const conHan = base.filter((l) => !l.banSao);
  const theoCap = (ds: Listing[]) => [...ds].sort((a, b) => tierRank(a.badge) - tierRank(b.badge) || ngayDang(b) - ngayDang(a));
  const khongHieu = coTuKhoa && !filters.types.length && !filters.locations.length && filters.priceMin == null && filters.priceMax == null
    && !search.hits.some((h) => h.tier <= 2);
  // CÂU GHI (chủ dự án 21/10/2026 duyệt mẫu): "Bất động sản bạn tìm chưa có sẵn. Gợi ý …:" — phần sau ghi đúng nhóm tin đang hiện
  const CHUA_CO = "Bất động sản bạn tìm chưa có sẵn.";
  const noiNoi = noiChon ? (noiChon.ward ?? noiChon.district ?? noiChon.province).replace(/^(Phường|Xã|Thị trấn|Đặc khu|Quận|Huyện|Thành phố|Thị xã)\s+/i, "") : tinhChon.size === 1 ? [...tinhChon][0] : "";
  const tenLoai = (l: Listing) => l.type.split(/\s*[/,]\s*/)[0].toLowerCase().replace(/^(cho thuê|thuê|bán)\s+/, "");
  if (khongHieu) {
    duPhong = theoCap(conHan).slice(0, TOI_DA_GOI_Y);
    thongBao = `${CHUA_CO} Gợi ý tin mới đăng:`;
    ketQua = duPhong;
  } else if (!ketQua.length) {
    const ganTruoc = (ds: Listing[]) => sortListings(ds, sort).map((l, i) => ({ l, i, xa: khoangCach(l) })).sort((a, b) => a.xa - b.xa || a.i - b.i).map((x) => x.l);
    const gan = noiNoi ? ` gần ${noiNoi} nhất` : "";
    if (filters.types.length) {
      const cungLoai = conHan.filter(dungLoai);
      if (cungLoai.length) {
        duPhong = ganTruoc(cungLoai).slice(0, TOI_DA_GOI_Y); // cùng loại ở nơi khác
        thongBao = `${CHUA_CO} Gợi ý ${(parseQuery(kwGoc).types[0] ?? filters.types[0].split(/\s*[/,]\s*/)[0]).toLowerCase()}${gan}:`;
      } else {
        const gn = loaiGanNghia(filters.types);
        duPhong = (gn.length ? ganTruoc(conHan.filter((l) => gn.some((g) => normalizeVi(l.type).includes(g)))) : []).slice(0, TOI_DA_GOI_Y);
        const cacLoai = [...new Set(duPhong.map(tenLoai))].slice(0, 3).join(", ");
        thongBao = duPhong.length ? `${CHUA_CO} Gợi ý ${cacLoai}${gan}:` : CHUA_CO;
      }
    } else {
      duPhong = ganTruoc(conHan).slice(0, TOI_DA_GOI_Y); // chỉ nói nơi chốn mà nơi đó chưa có tin → nơi gần nhất
      thongBao = `${CHUA_CO} Gợi ý bất động sản${gan}:`;
    }
    ketQua = duPhong;
  } else if (!khopDu.length && !chuTrong.length && (filters.types.length || filters.locations.length)) {
    // Không tin nào khớp đúng, chỉ có gợi ý (cùng loại, nơi gần) → cùng câu ghi
    const loai = filters.types.length ? (parseQuery(kwGoc).types[0] ?? filters.types[0].split(/\s*[/,]\s*/)[0]).toLowerCase() : "bất động sản";
    thongBao = `${CHUA_CO} Gợi ý ${loai}${noiNoi ? ` gần ${noiNoi} nhất` : ""}:`;
  }
  const tierById = new Map(hits.map((h) => [h.item.id, h.tier]));
  for (const l of goiYHetHan) tierById.set(l.id, 3);
  for (const l of duPhong) tierById.set(l.id, 3);
  // Có TỪ KHOÁ: tầng hiển thị = tầng THẤP HƠN giữa khớp bộ lọc và khớp từ khoá (cùng cách trang /tim-kiem) — câu không hiểu
  // ("abc xyz") hay tin không có từ khách gõ không được gắn nhãn "khớp hoàn hảo"
  if (coTuKhoa) {
    const tangChu = new Map(search.hits.map((h) => [h.item.id, h.tier]));
    for (const l of ketQua) tierById.set(l.id, Math.max(tierById.get(l.id) ?? 1, tangChu.get(l.id) ?? 3) as 1 | 2 | 3);
  }
  const termsById = new Map(search.hits.map((h) => [h.item.id, h.matched]));

  // PHÂN KHÚC GIÁ RẺ (chủ dự án 18/10/2026: "giá rẻ thì phải biết phân khúc giá nào trong 1,4 – 33 tỷ là rẻ mới đưa lên"):
  // "rẻ" = 1/3 số tin GIÁ THẤP NHẤT trong các tin khớp đúng loại nhà + khu vực khách tìm. Tin rẻ lên đầu; tin đắt hơn xuống
  // dưới, xếp vào nhóm gợi ý. Dòng số liệu đổi thành khoảng giá/diện tích của riêng nhóm rẻ.
  let khoangRe: string | undefined;
  if (timRe) {
    const gia = khopDu.map((l) => l.priceVnd ?? 0).filter((v) => v > 0).sort((a, b) => a - b);
    if (gia.length >= 3) {
      const nguong = gia[Math.ceil(gia.length / 3) - 1];
      const la = (l: Listing) => dungLoc.has(l.id) && (l.priceVnd ?? 0) > 0 && (l.priceVnd ?? 0) <= nguong;
      ketQua = [...ketQua.filter(la), ...ketQua.filter((l) => !la(l))];
      for (const l of khopDu) if (!la(l)) tierById.set(l.id, 2);
      const giaRe = gia.filter((v) => v <= nguong);
      const dt = khopDu.filter(la).map((l) => l.areaM2 ?? 0).filter((v) => v > 0);
      const so = (x: number) => (Math.round(x * 10) / 10).toLocaleString("vi-VN", { maximumFractionDigits: 1 });
      const g = (v: number) => (v >= 1e9 ? `${so(v / 1e9)} tỷ` : `${so(v / 1e6)} triệu`);
      const [a, b] = [g(giaRe[0]), g(giaRe[giaRe.length - 1])];
      // cùng đơn vị thì ghi đơn vị một lần, đúng mẫu đã duyệt: "1,4 – 3,5 tỷ"
      const khoangGia = a === b ? a : a.split(" ")[1] === b.split(" ")[1] ? `${a.split(" ")[0]} – ${b}` : `${a} – ${b}`;
      khoangRe = `${purpose === "thue" ? "Giá thuê" : "Giá"}: ${khoangGia}${purpose === "thue" ? "/tháng" : ""}`
        + (dt.length ? ` · Diện tích: ${so(Math.min(...dt))} – ${so(Math.max(...dt))} m²` : "");
    }
  }

  // Đếm theo tỉnh: cùng bộ lọc đang chọn (loại hình, giá…), chỉ bỏ khu vực — lỗi 20/10/2026: "Bán condotel Đà Nẵng
  // theo khu vực" ghi Đà Nẵng (45) = mọi tin bán của tỉnh, trong khi trang chỉ có 3 tin condotel.
  const m = new Map<string, number>();
  for (const { item: l } of smartFilter(base, { ...filters, keyword: "", locations: [] }).filter((h) => h.tier === 1)) {
    if (l.banSao) continue; // bản kèm không phải tin riêng — không đếm
    const p = l.location.split(",").pop()?.trim() ?? "";
    if (p) m.set(p, (m.get(p) ?? 0) + 1);
  }

  const soTrang = Math.max(1, Math.ceil(ketQua.length / moiTrang));
  const trangHienTai = Math.min(Math.max(1, page), soTrang);
  const trang = ketQua.slice((trangHienTai - 1) * moiTrang, trangHienTai * moiTrang);
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
    khoangRe,
    thongBao,
  };
}

/** Bộ lọc khởi đầu của trang danh sách: lọc theo địa chỉ + mặc định của trang (loại hình danh mục, tỉnh, bộ lọc pSEO).
 *  Dùng chung: ListingBrowser (trình duyệt) và trang 1 máy chủ dựng sẵn (lib/ketQuaDau) — hai nơi một cách tính. */
export function boLocKhoiDau(
  f: Filters,
  { initialTypes, initialProvince, initialFilters }: { initialTypes?: string[]; initialProvince?: string; initialFilters?: Partial<Filters> },
): Filters {
  // Địa chỉ chưa chỉ định loại hình → lấy loại hình của danh mục đang xem
  if (initialTypes?.length && !f.types.length) f.types = [...initialTypes];
  // Trang khu vực: chưa chọn nơi nào → mặc định lọc đúng tỉnh của trang
  if (initialProvince && f.locations.length === 0) f.locations = [{ province: initialProvince }];
  if (initialFilters) {
    const g = initialFilters;
    if (g.locations?.length && f.locations.length === 0) f.locations = g.locations;
    if (g.types?.length && !f.types.length) f.types = [...g.types];
    if (g.priceMax != null && f.priceMax == null && f.priceMin == null) f.priceMax = g.priceMax;
    if (g.beds && !f.beds) f.beds = g.beds;
    if (g.direction && !f.direction) f.direction = g.direction;
    if (g.legal && !f.legal) f.legal = g.legal;
  }
  return f;
}

// Điểm bản đồ của một tin — chuyển sang src/lib/diemBanDo.ts (bản đồ nhiều tin dùng thẳng, không kéo cả tệp lọc này).
export { diemTuTin } from "@/lib/diemBanDo";
