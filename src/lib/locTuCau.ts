// Câu gõ → các trường lọc. Tách khỏi TruongLocTrangChu để FilterBar (trang kết quả) dùng chung mà không
// nạp chéo hai component (FilterBar ↔ TruongLocTrangChu) — nạp chéo làm trang chủ không chạy được.
import { typeGroupsFor, normalizeVi, emptyFilters, dacDiemOptions, type Filters } from "@/lib/filters";
import { docDienTich, docLocThem, parseQuery } from "@/lib/smartSearch";
import { phuongMoiCua } from "@/lib/locations";

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
  // PHƯỜNG ĐỌC THEO HỆ MỚI (07/11/2026: "bán đất nền hòa xuân" đọc thành Hòa Xuân, quận Cẩm Lệ (hệ cũ) → tin ghi "Phường Hòa Xuân, Đà Nẵng"
  // không còn chữ Cẩm Lệ nên lọt hết, báo "chưa có sẵn"). Phường cũ có trong bảng sáp nhập → quy về phường mới 2 cấp như cả web đang dùng.
  const moi = pl?.ward && pl.district ? phuongMoiCua(pl.province, pl.district, pl.ward) : null;
  if (moi) f.locations = [{ province: moi.tinh, ward: moi.phuong }];
  else if (pl) f.locations = [{ province: pl.province, district: pl.district, ward: pl.ward }];
  else if (p.places[0]) f.locations = [{ province: p.places[0] }];
  // Loại CHỈ CÓ Ở MỤC KIA ("văn phòng", "mặt bằng" chỉ có ở Cho thuê) → tra cả mục kia; trước đây bị ép sang loại gần chữ nhất
  // ("mặt bằng" → Nhà mặt phố) — 01/11/2026
  const loaiCua = (t: string) => {
    const dung = (ds: string[]) => ds.some((x) => normalizeVi(x).includes(normalizeVi(t)));
    const a = loaiTuNhan(t, nq, mb);
    if (a.length && dung(a)) return a;
    const b = loaiTuNhan(t, nq, mb === "ban" ? "thue" : "ban");
    return dung(b) ? b : a;
  };
  if (p.types.length) f.types = [...new Set(p.types.flatMap(loaiCua))];
  // "nha trang" (gõ không dấu) là nơi chốn, không phải "nhà"
  else if (/ nha /.test(nq.replace(/ nha trang /g, " ")) && !/ nha dat /.test(nq)) f.types = typeGroupsFor(mb).find((g) => g.label === "Nhà")?.items ?? [];
  f.priceMin = p.priceMinTy;
  f.priceMax = p.priceMaxTy;
  if (p.beds) f.beds = Math.min(5, p.beds);
  // Lọc thêm (hướng · pháp lý · nội thất) — cùng bộ đọc với cauThanhBoLoc (01/11/2026)
  const lt = docLocThem(cau);
  f.direction = lt.direction; f.legal = lt.legal; f.furnishing = lt.furnishing;
  f.verified = lt.verified; f.broker = lt.broker; if (lt.tinhTrang) f.tinhTrang = lt.tinhTrang;
  // Đặc điểm (Lọc thêm): "view biển", "hẻm ô tô"… — cùng bảng DAC_DIEM
  const dd = p.features.filter((x) => dacDiemOptions.includes(x));
  if (dd.length) f.dacDiem = dd;
  const dt = docDienTich(cau);
  f.areaMin = dt.areaMin; f.areaMax = dt.areaMax;
  return f;
}

/** GỘP CÂU VÀO BỘ LỌC ĐANG CHỌN — một luật cho mọi ô tìm (01/11/2026: ô gõ và các trường là MỘT bộ lọc): trường nào câu nói tới thì
 *  câu thắng (gõ "phòng trọ Huế" khi đang lọc nhà Đà Nẵng → Huế, phòng trọ — luật 17/10/2026); trường câu không nhắc (diện tích, chủ đầu
 *  tư, tình trạng…) giữ nguyên lựa chọn của khách. Câu giữ làm từ khoá. */
export function gopCau(f0: Filters, cau: string, mb: "ban" | "thue"): Filters {
  // trường do CÂU TRƯỚC tự điền (không phải khách tự chọn) bỏ đi trước — "2 phòng ngủ" của câu cũ không dính sang câu mới
  const f = { ...f0 };
  if (f0.keyword.trim()) {
    const cu = locTuCau(f0.keyword, mb);
    const giong = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
    if (cu.locations.length && giong(f.locations, cu.locations)) f.locations = [];
    if (cu.types.length && giong(f.types, cu.types)) f.types = [];
    if ((cu.priceMin != null || cu.priceMax != null) && f.priceMin === cu.priceMin && f.priceMax === cu.priceMax) { f.priceMin = null; f.priceMax = null; }
    if (cu.beds && f.beds === cu.beds) f.beds = 0;
    if ((cu.areaMin != null || cu.areaMax != null) && f.areaMin === cu.areaMin && f.areaMax === cu.areaMax) { f.areaMin = null; f.areaMax = null; }
    if (cu.direction && f.direction === cu.direction) f.direction = "";
    if (cu.legal && f.legal === cu.legal) f.legal = "";
    if (cu.furnishing && f.furnishing === cu.furnishing) f.furnishing = "";
    if (cu.dacDiem?.length && giong(f.dacDiem, cu.dacDiem)) f.dacDiem = [];
  }
  const c = locTuCau(cau, mb);
  const coGia = c.priceMin != null || c.priceMax != null;
  return {
    ...f,
    keyword: cau,
    locations: c.locations.length ? c.locations : f.locations,
    types: c.types.length ? c.types : f.types,
    priceMin: coGia ? c.priceMin : f.priceMin,
    priceMax: coGia ? c.priceMax : f.priceMax,
    beds: c.beds || f.beds,
    areaMin: c.areaMin != null || c.areaMax != null ? c.areaMin : f.areaMin,
    areaMax: c.areaMin != null || c.areaMax != null ? c.areaMax : f.areaMax,
    direction: c.direction || f.direction,
    legal: c.legal || f.legal,
    furnishing: c.furnishing || f.furnishing,
    verified: c.verified || f.verified,
    broker: c.broker || f.broker,
    dacDiem: c.dacDiem?.length ? c.dacDiem : f.dacDiem,
    tinhTrang: c.tinhTrang || f.tinhTrang,
  };
}
