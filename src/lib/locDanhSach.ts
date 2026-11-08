import type { Listing } from "@/lib/data";
import { sortListings, applyFilters, hasActiveFilters, emptyFilters, normalizeVi, matchType, dacDiemOptions, typeGroupsFor, type Filters, type SortKey } from "@/lib/filters";
import { smartFilter, smartSearch, parseQuery, coKhopTieuChi, chuChuaHieu } from "@/lib/smartSearch";
import { nhanDoiHienThi } from "@/lib/nhanDoiHienThi";
import { locTuCau } from "@/lib/locTuCau";
import { choCuCua } from "@/lib/locations";
import { tierRank } from "@/lib/packages";

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
  /** Số tin KHỚP ĐÚNG lựa chọn (không tính tin gợi ý tương tự) — nút "Xem … tin" của bảng lọc (01/11/2026) */
  khop?: number;
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
  // MỘT BỘ ĐỌC CÂU cho trang kết quả, ô tìm và trường lọc (locTuCau, 01/11/2026): trước đây trang kết quả dùng bộ tách riêng
  // (goiYNoiLong) — "nhà" trơn không thành loại Nhà, "nhà mặt tiền" không thành Nhà mặt phố → kết quả lệch với các trường đang hiện
  const c = locTuCau(kw, purpose);
  const coGi = c.locations.length || c.types.length || c.priceMin != null || c.priceMax != null || c.beds || c.areaMin != null || c.areaMax != null
    || c.direction || c.legal || c.furnishing || c.verified || c.broker || c.dacDiem?.length;
  if (!coGi) return null;
  const coGiaF = f.priceMin != null || f.priceMax != null;
  const coDtF = f.areaMin != null || f.areaMax != null;
  return {
    ...f,
    types: f.types.length ? f.types : c.types,
    locations: f.locations.length ? f.locations : c.locations,
    priceMin: coGiaF ? f.priceMin : c.priceMin,
    priceMax: coGiaF ? f.priceMax : c.priceMax,
    beds: f.beds || c.beds || 0,
    areaMin: coDtF ? f.areaMin : c.areaMin,
    areaMax: coDtF ? f.areaMax : c.areaMax,
    direction: f.direction || c.direction,
    legal: f.legal || c.legal,
    furnishing: f.furnishing || c.furnishing,
    verified: f.verified || c.verified,
    broker: f.broker || c.broker,
    dacDiem: f.dacDiem?.length ? f.dacDiem : c.dacDiem,
    // Chi tiết máy không làm trường lọc ("view biển", "gần trường"…) và TỪ chưa hiểu ("sân vườn", "nở hậu" — chủ dự án
    // 21/10/2026) giữ lại làm từ khoá dò nội dung tin, XẾP tin khớp lên đầu
    // "trung tâm" + nơi chốn là VỊ TRÍ: locDanhSach xếp tin tự ghi ở trung tâm lên trước (khớp trọn cụm) — không để bộ dò chữ
    // khớp lẻ "tâm"/"trung" đẩy tin không liên quan lên đầu
    keyword: [...parseQuery(kw).features.filter((x) => !dacDiemOptions.includes(x) && x !== "sổ hồng" && x !== "full nội thất"), chuChuaHieu(kw).replace(/,/g, "")].filter(Boolean).join(" "),
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
  /** tin cả hai mục — tra nơi của dự án khách gõ tên (mục này không có tin của dự án) */
  tinCaHaiMuc: Listing[] = items,
  /** false = không lọc theo mục: danh sách "Xem thêm" trang chủ gồm CẢ Mua bán lẫn Cho thuê, xếp chung theo cấp VIP (chủ dự án 03/11/2026) */
  theoMuc = true,
): KetQuaLoc & { ketQua: Listing[] } {
  // Câu có "giá rẻ" → trong cùng nhóm, tin rẻ đứng trước (cùng quy ước với trang sạch ?sapxep=gia-tang)
  // "giá rẻ" gõ trong câu HOẶC chọn ở Lọc thêm → cùng một phân khúc (luật 18/10/2026)
  const timRe = / gia re /.test(` ${normalizeVi(filters.keyword)} `) || !!filters.dacDiem?.includes("giá rẻ");
  if (sort === "moi" && timRe) sort = "gia-tang";
  // Câu có "trung tâm" (nhà đất bán trung tâm Đà Nẵng) → tin GẦN TÂM nơi khách nói đứng trước (chủ dự án 21/10/2026)
  const kwGoc = filters.keyword;
  const timTrungTam = !!kwGoc.trim() && parseQuery(kwGoc).features.includes("trung tâm");
  filters = cauThanhBoLoc(filters, purpose) ?? filters;
  // CÂU CHUNG CHUNG ("bất động sản", "nhà đất", "tìm nhà"): mọi chữ đều là chữ chung, không trường nào → như không gõ: ra đủ tin
  // của mục, không báo "chưa có sẵn" (01/11/2026)
  if (filters.keyword.trim() && !chuChuaHieu(filters.keyword) && !parseQuery(filters.keyword).features.length) filters = { ...filters, keyword: "" };
  // GÕ TÊN DỰ ÁN mà không gõ nơi ("sun ponte"): nơi của dự án (lấy từ tin của dự án, mục nào cũng được) là địa danh — mục này không có
  // tin của dự án thì gợi ý tin gần dự án nhất, không ra tin mới đăng lung tung (01/11/2026)
  if (filters.keyword.trim() && !filters.locations.length) {
    const nqK = ` ${normalizeVi(filters.keyword).replace(/[^a-z0-9]+/g, " ")} `;
    // cụm chữ chưa đọc thành trường nào (tên dự án) có trọn trong tên dự án / tiêu đề tin
    const cumTen = chuChuaHieu(filters.keyword).split(", ").map((c) => normalizeVi(c).replace(/[^a-z0-9]+/g, " ").trim()).filter((c) => c.split(" ").length >= 2);
    const cuaDuAn = tinCaHaiMuc.find((l) => {
      const ten = normalizeVi(l.projectName || (l.projectSlug ?? "").replace(/-/g, " ")).replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter(Boolean);
      if (ten.length >= 2 && nqK.includes(` ${ten.slice(0, 2).join(" ")} `)) return true;
      const tieuDe = ` ${normalizeVi(`${l.projectName ?? ""} ${l.title}`).replace(/[^a-z0-9]+/g, " ")} `;
      return cumTen.some((c) => tieuDe.includes(` ${c} `));
    });
    const noiDuAn = cuaDuAn ? parseQuery(cuaDuAn.location).place : null;
    if (noiDuAn) filters = { ...filters, locations: [{ province: noiDuAn.province, district: noiDuAn.district, ward: noiDuAn.ward }] };
  }
  // Nguồn theo đúng MỤC ĐÍCH + NHÂN ĐÔI HIỂN THỊ của CVR Diamond (nhanDoiHienThi.ts)
  const base = nhanDoiHienThi(theoMuc ? items.filter((l) => (l.purpose ?? "ban") === purpose) : items);
  // NỚI LỎNG THÔNG MINH: tin khớp đủ lên đầu (Tầng 1), thiếu tiêu chí phụ xuống Tầng 2/3
  const hits = smartFilter(base, { ...filters, keyword: "" });
  const coTuKhoa = filters.keyword.trim().length > 0;
  const search = smartSearch(hits.map((h) => h.item), filters.keyword);

  // Tin hết hạn: cùng mục đích + khớp ĐỦ bộ lọc (Tầng 1) và từ khoá — không nới lỏng.
  const gocHetHan = theoMuc ? hetHan.filter((l) => (l.purpose ?? "ban") === purpose) : hetHan;
  let ketQuaHetHan: Listing[] = [];
  if (gocHetHan.length) {
    const khop = smartFilter(gocHetHan, { ...filters, keyword: "" }).filter((h) => h.tier === 1).map((h) => h.item);
    // TIN LÀ TIN (anh 07/11/2026): tin hết hạn khớp đủ các TRƯỜNG (mục đích · loại hình · nơi…) là kết quả như tin còn hạn — không đòi
    // thêm chữ trong tin khớp từng chữ câu gõ ("nhà đất phan thiết" từng bỏ hết 21 tin Phan Thiết vì tiêu đề không có chữ "nhà đất").
    // Chỉ khi câu không đọc ra trường nào mới lọc theo chữ.
    const coTruong = hasActiveFilters({ ...filters, keyword: "" });
    ketQuaHetHan = coTuKhoa && !coTruong
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
  const dungLoaiCon = (l: Listing) => filters.types.length === 0 || filters.types.some((t) => matchType(l.type, t));
  // CÙNG CHA (anh 07/11/2026, cây loại hình cha – con): khách nói "đất nền" → tương tự gồm cả loại con khác của Đất (đất khác…), xếp sau
  // đúng loại con. Loại khác cha (nhà, căn hộ) vẫn không vào (chốt 21/10/2026)
  const loaiCungCha = new Set(typeGroupsFor(purpose).filter((g) => g.items.some((x) => filters.types.includes(x))).flatMap((g) => g.items));
  const dungLoai = (l: Listing) => dungLoaiCon(l) || [...loaiCungCha].some((t) => matchType(l.type, t));
  // phường HỆ MỚI không kèm quận → quận CŨ của nó theo bảng sáp nhập (Phường Hòa Xuân → Cẩm Lệ): tin cùng quận cũ là nơi gần nhất
  // gần nhất = quận cũ của phường cũ CÙNG TÊN (Phường Hòa Xuân → Hòa Xuân, Cẩm Lệ); không có phường cùng tên mới lấy mọi quận cũ đã gộp
  // vào (Hòa Xuân mới gộp cả Hòa Châu, Hòa Phước của Hòa Vang — lấy cả Hòa Vang thì Hòa Tiến xa lắc cũng thành "gần", 07/11/2026)
  const quanCuCua = sauChon.filter((x) => x.ward && !x.district).flatMap((x) => {
    const ds = choCuCua(x.province, x.ward!);
    const boCapP = (s: string) => normalizeVi(s.replace(/^(Phường|Xã|Thị trấn|Đặc khu)\s+/i, ""));
    const cungTen = ds.filter((c) => boCapP(c.phuong) === boCapP(x.ward!));
    return [...new Set((cungTen.length ? cungTen : ds).map((c) => `${c.tinh}|${c.quan}`))].map((k) => ({ province: k.split("|")[0], district: k.split("|")[1] }));
  });
  // XẾP THEO ĐÚNG 9 BẬC (chủ dự án 01/11/2026 — bảng ô search dùng chung, "kết quả sắp xếp theo dữ liệu, ưu tiên theo CHA – CON"):
  //   THEO THỨ TỰ CÁC TRƯỜNG DƯỚI Ô TÌM, TRÁI QUA PHẢI (chủ dự án 01/11/2026): mục đích = 3 tab · Toàn quốc: tỉnh/thành phố (bắt buộc) →
  //   quận/huyện, phường/xã · Loại BĐS (bắt buộc) · Giá · Diện tích · 6 chủ đầu tư, 7 dự án (tin ghi đúng dự án khách gõ) · 8 Lọc thêm: phòng ngủ → hướng → pháp lý → nội thất →
  //   tin xác thực → môi giới · 9 nội dung (đặc điểm, chữ khách gõ). Điểm mỗi bậc lớn hơn tổng các bậc sau nên bậc trên luôn thắng.
  const mot = (l: Listing, g: Partial<Filters>) => applyFilters([l], { ...emptyFilters(), ...g }).length > 0;
  const nqCau = ` ${normalizeVi(kwGoc).replace(/[^a-z0-9]+/g, " ")} `;
  // tin thuộc DỰ ÁN khách gõ: tên dự án của tin (gõ trọn, hoặc gõ đầu tên từ 2 chữ) có trong câu
  const dungDuAn = (l: Listing) => {
    const ten = normalizeVi(l.projectName || (l.projectSlug ?? "").replace(/-/g, " ")).replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter(Boolean);
    return ten.length >= 2 && nqCau.includes(` ${ten.slice(0, Math.min(ten.length, 2)).join(" ")} `);
  };
  const diemCon = (l: Listing) =>
    (filters.areaMin != null || filters.areaMax != null ? (mot(l, { areaMin: filters.areaMin, areaMax: filters.areaMax }) ? 512 : 0) : 0)
    + (coGia ? (mot(l, { priceMin: filters.priceMin, priceMax: filters.priceMax }) ? 1024 : 0) : 0)
    + (dungDuAn(l) ? 256 : 0)
    + (filters.beds ? (mot(l, { beds: filters.beds }) ? 128 : 0) : 0)
    + (filters.direction ? (mot(l, { direction: filters.direction }) ? 64 : 0) : 0)
    + (filters.legal ? (mot(l, { legal: filters.legal }) ? 32 : 0) : 0)
    + (filters.furnishing ? (mot(l, { furnishing: filters.furnishing }) ? 16 : 0) : 0)
    + (filters.verified ? (mot(l, { verified: true }) ? 8 : 0) : 0)
    + (filters.broker ? (mot(l, { broker: true }) ? 4 : 0) : 0)
    // đặc điểm chọn ở Lọc thêm (gần biển, view sông…) — tính điểm như các trường Lọc thêm khác (07/11/2026)
    + ((filters.dacDiem ?? []).some((d) => d !== "giá rẻ" && mot(l, { dacDiem: [d] })) ? 2 : 0)
    + (coDacDiem.has(l.id) ? 1 : 0);
  const diemGoiY = (l: Listing) => {
    const dungTinh = tinhChon.size === 0 || tinhChon.has(l.location.split(",").pop()?.trim() ?? "");
    const dungSau = sauChon.length > 0 && applyFilters([l], { ...emptyFilters(), locations: sauChon }).length > 0;
    // không có tin đúng PHƯỜNG thì tin cùng QUẬN/HUYỆN chứa phường đó ("hòa xuân" → Cẩm Lệ) đứng trước nơi khác trong tỉnh
    const quanChon = [...sauChon.filter((x) => x.ward && x.district).map((x) => ({ province: x.province, district: x.district })), ...quanCuCua];
    const dungQuan = quanChon.length > 0 && applyFilters([l], { ...emptyFilters(), locations: quanChon }).length > 0;
    // THỨ TỰ Ý KHÁCH (anh 07/11/2026: "1. loại hình, 2. ở đâu, 3. giá"): tỉnh (gợi ý đã chỉ trong tỉnh khách nói) → ĐÚNG LOẠI CON
    // ("đất nền" → tin đất nền trước tin đất khác) → phường → quận cũ chứa phường → loại cùng cha → các bậc con (giá, diện tích…)
    // THỨ TỰ (anh 08/11/2026: "không có dữ liệu thì sắp xếp theo Mục đích + loại hình + địa điểm + …"): đúng loại con → loại cùng cha → tỉnh
    // → phường → quận cũ chứa phường → các bậc con (giá, diện tích, Lọc thêm, nội dung)
    return (dungLoaiCon(l) ? 65536 : 0) + (dungLoai(l) ? 32768 : 0) + (dungTinh ? 16384 : 0) + (dungSau ? 8192 : 0) + (dungQuan ? 4096 : 0) + diemCon(l);
  };
  // GIÁ GẦN NHẤT TRƯỚC (anh 07/11/2026: "giá 3 tỷ" mà tin 6,8 tỷ đứng trên tin 3,2 tỷ): cùng mức khớp, tin có giá gần mức khách nói đứng trước
  const giaDich = coGia ? ((filters.priceMin ?? filters.priceMax!) + (filters.priceMax ?? filters.priceMin!)) / 2 : 0;
  const cachGia = (l: Listing) => (coGia && (l.priceVnd ?? 0) > 0 ? Math.abs((l.priceVnd ?? 0) - giaDich) : Number.MAX_SAFE_INTEGER);
  // GỢI Ý TƯƠNG TỰ THEO NỘI DUNG, KHÔNG THEO GẦN / XA (anh 07/11/2026: "gợi ý là tương tự = nội dung, ý định khách cần tìm"): sau các trường,
  // tin có NỘI DUNG khớp chữ khách gõ (tên nơi, dự án, mô tả — "hòa xuân" → tin dự án Nam Hòa Xuân) đứng trước; cùng mức giữ thứ tự cấp tin
  const chuKhach = [...sauChon.flatMap((x) => [x.ward, x.district]), ...chuChuaHieu(filters.keyword).split(",")]
    .filter((x): x is string => !!x)
    .map((x) => ` ${normalizeVi(x.replace(/^(Phường|Xã|Thị trấn|Đặc khu|Quận|Huyện|Thị xã|Thành phố)\s+/i, "")).replace(/[^a-z0-9]+/g, " ").trim()} `)
    .filter((x) => x.trim().length >= 3);
  const noiDung = (l: Listing) => {
    const nd = ` ${normalizeVi([l.title, l.desc, l.searchText, l.projectName].filter(Boolean).join(" ")).replace(/[^a-z0-9]+/g, " ")} `;
    return chuKhach.filter((c) => nd.includes(c)).length;
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
  const khopDuTT = timTrungTam
    ? khopDu0.map((l, i) => ({ l, i, m: mucTrungTam(l) })).sort((a, b) => b.m - a.m || a.i - b.i).map((x) => x.l)
    : khopDu0;
  // NHÀ TRỌ Ở MỤC MUA BÁN (anh 08/11/2026: "nhà trọ đà nẵng dưới 2 tỷ" = mua cả dãy trọ; "cứ đọc đúng loại hình là Nhà trọ"): Mua bán chưa
  // có loại "nhà trọ" riêng nên bộ lọc lấy nhóm Nhà — tin ghi nhà trọ / dãy trọ / phòng trọ đứng ĐẦU, các nhà khác xếp sau
  const timTro = purpose === "ban" && / (nha|day|phong) tro /.test(` ${normalizeVi(kwGoc).replace(/[^a-z0-9]+/g, " ")} `);
  const coTroTin = (l: Listing) => / (nha|day|phong) tro /.test(` ${normalizeVi([l.title, l.desc, l.searchText].filter(Boolean).join(" ")).replace(/[^a-z0-9]+/g, " ")} `);
  const khopDu = timTro ? [...khopDuTT.filter(coTroTin), ...khopDuTT.filter((l) => !coTroTin(l))] : khopDuTT;
  // KHÁCH ĐÃ NÓI LOẠI HÌNH → gợi ý CHỈ cùng loại hình, nới khu vực chứ không nới loại (chủ dự án 21/10/2026: "Villa biển gần
  // Hội An" không có tin thì gợi ý villa Đà Nẵng gần biển — không đưa condotel, nhà phố). Hết tin cùng loại thì nói là không có.
  // KHÁCH ĐÃ NÓI NƠI → gợi ý CHỈ trong tỉnh đó (chủ dự án 21/10/2026: "Villa biển gần Hội An" mà ra Huế, Lâm Đồng là vô nghĩa)
  const dungTinhChon = (l: Listing) => tinhChon.size === 0 || tinhChon.has(l.location.split(",").pop()?.trim() ?? "");
  const goiY = sortListings(hits.filter((h) => h.tier > 1 && coKhopTieuChi(h, filters) && dungLoai(h.item) && dungTinhChon(h.item)).map((h) => h.item), sort)
    .map((l, i) => ({ l, i, d: diemGoiY(l), nd: noiDung(l) }))
    // cùng mức khớp: tin NỘI DUNG tương tự đứng trước (không theo gần / xa — anh 07/11/2026)
    // THỨ TỰ Ý KHÁCH (anh 07/11/2026): 1 loại hình → 2 ở đâu (đã trong d) → 3 GIÁ: khách nói "giá rẻ" thì cùng mức, giá thấp trước (i = thứ tự giá tăng)
    .sort((a, b) => b.d - a.d || (timRe ? a.i - b.i : 0) || cachGia(a.l) - cachGia(b.l) || b.nd - a.nd || a.i - b.i)
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
  // THEO ĐỘ CHÍNH XÁC NHƯ GOOGLE (anh 07/11/2026: "search ra kết quả theo cấp độ chính xác, tới mới đến tương tự"): tin KHỚP ĐÚNG câu tìm
  // (còn hạn → đã hết hạn, nhãn "Hết hạn") đứng trước, rồi mới đến "Bất động sản tương tự". Trước đây tin hết hạn khớp đúng bị xếp sau cả
  // tin tương tự còn hạn ("bán nhà quy nhơn" → tin Pleiku đứng đầu, tin Quy Nhơn Nam hết hạn ở dưới).
  const khopDung = coTuKhoa ? [...chuTrong, ...khopDu.filter((l) => !daCo.has(l.id))] : khopDu;
  // Khách đã nói loại hình: tin khớp chữ ngoài bộ lọc đã nằm trong bảng gợi ý (xếp theo tỉnh + đặc điểm) — không chen trước
  const tuongTu = coTuKhoa ? [...(filters.types.length ? [] : chuNgoai), ...goiY.filter((l) => !daCo.has(l.id) || (filters.types.length > 0 && !dungLoc.has(l.id)))] : goiY;
  let ketQua = [...khopDung, ...ketQuaHetHan, ...tuongTu, ...goiYHetHan];
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
  // CÂU KHÔNG LIÊN QUAN ("ăn phở ngon"): chữ lạ không tin nào nhắc TRỌN cụm → cũng là không tìm thấy (khớp lẻ một chữ "ngon" không tính)
  const cumLaKq = coTuKhoa ? chuChuaHieu(filters.keyword).split(", ").map((c) => ` ${normalizeVi(c).replace(/[^a-z0-9]+/g, " ").trim()} `).filter((c) => c.trim()) : [];
  const coNoiDung = !cumLaKq.length || conHan.some((l) => { const nd = ` ${normalizeVi([l.title, l.desc, l.searchText].filter(Boolean).join(" ")).replace(/[^a-z0-9]+/g, " ")} `; return cumLaKq.every((c) => nd.includes(c)); });
  const khongHieu = coTuKhoa && !filters.types.length && !filters.locations.length && filters.priceMin == null && filters.priceMax == null
    && (!search.hits.some((h) => h.tier <= 2) || !coNoiDung);
  // CÂU GHI (chủ dự án 21/10/2026 duyệt mẫu): "Bất động sản bạn tìm chưa có sẵn. Gợi ý …:" — phần sau ghi đúng nhóm tin đang hiện
  const CHUA_CO = "Bất động sản bạn tìm chưa có sẵn.";
  // CÓ TIN KHỚP ĐƯỢC MỘT PHẦN (loại hình / nơi) → CHỈ XẾP THEO ĐỘ CHÍNH XÁC, KHÔNG GHI GÌ. Chỉ khi KHÔNG có dữ liệu nào khớp (câu không
  // hiểu, khác cả loại) mới ghi "Bất động sản tương tự" (anh 07/11/2026)
  const TUONG_TU = "Bất động sản tương tự";
  if (khongHieu) {
    // CẤM GỢI Ý BẬY (anh 08/11/2026): câu vô nghĩa, không nội dung, viết bậy → không đưa tin nào ra, chỉ báo chưa có
    duPhong = [];
    thongBao = CHUA_CO;
    ketQua = [];
  } else if (!ketQua.length) {
    // GỢI Ý khi không tin nào khớp hết: tin khớp được NHIỀU TRƯỜNG CÒN LẠI hơn đứng trước, theo thứ bậc giá → diện tích → phòng ngủ →
    // hướng → pháp lý → nội thất → đặc điểm (chủ dự án 01/11/2026).
    // TƯƠNG TỰ XẾP THEO Ý KHÁCH: mục đích → loại hình → các đặc điểm trong câu tìm (anh 08/11/2026: "bỏ chuyện gần với các tỉnh") — không xếp theo tỉnh gần
    const ganTruoc = (ds: Listing[]) => sortListings(ds, sort).map((l, i) => ({ l, i, k: diemGoiY(l), nd: noiDung(l) })).sort((a, b) => b.k - a.k || (timRe ? a.i - b.i : 0) || cachGia(a.l) - cachGia(b.l) || b.nd - a.nd || a.i - b.i).map((x) => x.l);
    if (filters.types.length) {
      const cungLoai = conHan.filter(dungLoai);
      if (cungLoai.length) {
        duPhong = ganTruoc(cungLoai).slice(0, TOI_DA_GOI_Y); // cùng loại ở nơi khác — vẫn là kết quả theo độ chính xác
      } else {
        // không có tin nào cùng loại → loại gần nghĩa: đây mới là "tương tự"
        const gn = loaiGanNghia(filters.types);
        duPhong = (gn.length ? ganTruoc(conHan.filter((l) => gn.some((g) => normalizeVi(l.type).includes(g)))) : []).slice(0, TOI_DA_GOI_Y);
        thongBao = duPhong.length ? TUONG_TU : CHUA_CO;
      }
    } else {
      duPhong = ganTruoc(conHan).slice(0, TOI_DA_GOI_Y); // chỉ nói nơi chốn mà nơi đó chưa có tin → nơi gần nhất, xếp theo độ chính xác
    }
    // CÓ TIN NỘI DUNG KHỚP chữ khách tìm (tên nơi, dự án — "hòa xuân" → tin dự án Nam Hòa Xuân) → đó là KẾT QUẢ theo mức độ khớp,
    // không báo "chưa có sẵn" (anh 07/11/2026: "có mà sao lại chưa có")
    if (duPhong.some((l) => noiDung(l) > 0)) thongBao = undefined;
    ketQua = duPhong;
  }
  // KHÔNG TIN NÀO KHỚP ĐỦ các trường khách nói (anh 07/11/2026: "nhà đất phan thiết" — Phan Thiết không có tin mà web ghi "12 bất động sản
  // phù hợp", bày tin Đà Nẵng) → nói thẳng chưa có, phần dưới là tương tự. Khách nói NƠI mà nơi đó không có tin thì luôn báo.
  const soKhop = (coTuKhoa ? chuTrong.length + khopDu.filter((l) => !daCo.has(l.id)).length : khopDu.length) + ketQuaHetHan.length;
  // CÓ TIN KHỚP ĐỦ 3 THỨ CHÍNH — mục đích (nguồn đã theo mục) · loại hình · địa điểm — thì không báo "chưa có sẵn", chỉ xếp theo độ khớp
  // (anh 08/11/2026: "có dữ liệu khớp mục đích · loại hình · địa điểm thì cứ hiện, xếp theo thứ tự độ khớp")
  const khop3 = (filters.types.length > 0 || filters.locations.length > 0) && conHan.some((l) => dungLoaiCon(l) && (filters.locations.length === 0 || applyFilters([l], { ...emptyFilters(), locations: filters.locations }).length > 0));
  if (!soKhop && !khop3 && ketQua.length && !thongBao && (filters.locations.length > 0 || !ketQua.some((l) => noiDung(l) > 0))) thongBao = `${CHUA_CO} ${TUONG_TU}`;
  // Không tin nào khớp đủ nhưng có tin cùng loại / nơi gần → vẫn là kết quả theo độ chính xác, không ghi gì (anh 07/11/2026)
  // Khách nói LOẠI HÌNH thì chỉ ra đúng loại đó (anh 07/11/2026: "đất thì chỉ tìm đất") — không thêm loại khác dù đúng nơi
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
  let laRe: ((l: Listing) => boolean) | null = null;
  if (timRe) {
    const gia = khopDu.map((l) => l.priceVnd ?? 0).filter((v) => v > 0).sort((a, b) => a - b);
    if (gia.length >= 3) {
      const nguong = gia[Math.ceil(gia.length / 3) - 1];
      const la = (l: Listing) => dungLoc.has(l.id) && (l.priceVnd ?? 0) > 0 && (l.priceVnd ?? 0) <= nguong;
      laRe = la;
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

  // BẬC KHỚP TRONG NHÓM ĐÚNG TRƯỜNG LỌC (chủ dự án 01/11/2026: "chính xác 100% → chính xác nhất → chính xác → tương đối → không có
  // dữ liệu = gợi ý logic"): mọi tin đã đúng các trường (khu vực, loại, giá, diện tích, lọc thêm) được cộng điểm theo các Ý MỀM của câu —
  // ở trung tâm (vị trí, 4) → thuộc phân khúc giá rẻ (giá, 2) → có đặc điểm hoặc chữ nội dung khách gõ (1). Tin khớp nhiều ý đứng trước, cùng điểm
  // giữ thứ tự cũ (cấp tin, mới đăng…). Gợi ý ngoài trường lọc vẫn đứng sau.
  // cùng thứ bậc: vị trí (ở trung tâm) → giá (phân khúc rẻ) → đặc điểm, chữ nội dung
  const diemY = (l: Listing) => (timTrungTam && mucTrungTam(l) > 0 ? 8 : 0) + (laRe?.(l) ? 4 : 0) + (dungDuAn(l) ? 2 : 0) + (coDacDiem.has(l.id) ? 1 : 0);
  if (timTrungTam || coTuKhoa || laRe || nqCau.trim()) {
    const dau = ketQua.map((l, i) => ({ l, i })).filter((x) => dungLoc.has(x.l.id));
    const xep = [...dau].sort((a, b) => diemY(b.l) - diemY(a.l) || a.i - b.i);
    const viTri = dau.map((x) => x.i);
    const moi = [...ketQua];
    viTri.forEach((p, k) => { moi[p] = xep[k].l; });
    ketQua = moi;
    // BẬC theo đúng điểm: tin khớp NHIỀU Ý NHẤT là khớp hoàn hảo (tầng 1), tin đúng trường nhưng thiếu ý mềm là tầng 2 — nhãn và thứ tự
    // luôn đi cùng nhau (trước đây tin rẻ mà xa trung tâm vẫn tầng 1, tin trung tâm không rẻ tầng 2 lại đứng trên)
    const caoNhat = Math.max(0, ...dau.map((x) => diemY(x.l)));
    if (caoNhat > 0) for (const x of dau) tierById.set(x.l.id, diemY(x.l) === caoNhat ? 1 : 2);
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
    khop: (coTuKhoa ? chuTrong.length + khopDu.filter((l) => !daCo.has(l.id)).length : khopDu.length) + ketQuaHetHan.length, // tin là tin: hết hạn khớp đủ cũng đếm
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
  { initialTypes, initialProvince, initialFilters, muc }: { initialTypes?: string[]; initialProvince?: string; initialFilters?: Partial<Filters>; muc?: "ban" | "thue" },
): Filters {
  // ĐỊA CHỈ CÓ CÂU (?q= — bấm gợi ý, gửi link): các trường đọc từ câu THẮNG mặc định của trang (01/11/2026: bấm "căn hộ sơn trà…" sang trang
  // /mua-ban/can-ho-chung-cu/da-nang mà khu vực vẫn là cả Đà Nẵng). Cùng bộ đọc với ô tìm (locTuCau); câu vẫn giữ làm từ khoá.
  if (muc && f.keyword.trim()) {
    const c = locTuCau(f.keyword, muc);
    if (c.locations.length && !f.locations.length) f.locations = c.locations;
    if (c.types.length && !f.types.length) f.types = c.types;
    if (f.priceMin == null && f.priceMax == null) { f.priceMin = c.priceMin; f.priceMax = c.priceMax; }
    if (!f.beds) f.beds = c.beds;
    f.direction ||= c.direction; f.legal ||= c.legal; f.furnishing ||= c.furnishing;
    if (!f.dacDiem?.length && c.dacDiem?.length) f.dacDiem = c.dacDiem;
  }
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
