// Câu gõ → các trường lọc. Tách khỏi TruongLocTrangChu để FilterBar (trang kết quả) dùng chung mà không
// nạp chéo hai component (FilterBar ↔ TruongLocTrangChu) — nạp chéo làm trang chủ không chạy được.
import { typeGroupsFor, normalizeVi, emptyFilters, dacDiemOptions, type Filters } from "@/lib/filters";
import { tenLoaiHinhMenu } from "@/lib/categories";
import { biDanhTinh, chuChuaHieu, docDienTich, docLocThem, parseQuery, suaChinhTa } from "@/lib/smartSearch";
import { phuongMoiCua, phuongMoiCuaQuan, newProvinceOf } from "@/lib/locations";
import { provincesOld, provincesNew } from "@/lib/diaDanhNguon";

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

/** ĐỌC LOẠI HÌNH THẲNG TỪ CÂY LOẠI HÌNH CHA – CON (anh 07/11/2026: "làm chuẩn cách đọc loại hình theo cha và con") — một nguồn
 *  typeGroupsFor + tên hiện trên menu (tenLoaiHinhMenu). Cụm DÀI NHẤT khớp trước: tên CHA → cả nhóm ("bđs nghỉ dưỡng"), tên CON → đúng
 *  loại con ("căn hộ dịch vụ", "villa"). Tên con trùng tên cha ("đất") → cha. "căn hộ" / "chung cư" là một nhu cầu → cả nhóm (luật cũ).
 *  Mục đang đứng trước, không có mới tra mục kia. Không khớp gì → [] (dùng cách đọc cũ theo từ đồng nghĩa). */
function loaiTheoCay(nq: string, mb: "ban" | "thue"): string[] {
  const k = (s: string) => normalizeVi(s).replace(/[^a-z0-9]+/g, " ").trim();
  for (const m of [mb, mb === "ban" ? "thue" : "ban"] as const) {
    // "căn hộ" / "chung cư" là MỘT nhu cầu → cả nhóm (luật đã chốt) — đặt TRƯỚC để thắng tên loại con cùng chữ
    const ten: { k: string; loai: string[] }[] = ["can ho", "chung cu"].map((x) => ({ k: x, loai: typeGroupsFor(m).find((g) => k(g.label) === "can ho chung cu")?.items ?? [] }));
    for (const g of typeGroupsFor(m)) {
      // nhóm "Khác": tên nhóm không phải loại hình khách gõ, nhưng mục con ("Bất động sản khác") vẫn đọc được (07/11/2026)
      if (g.label !== "Khác") ten.push({ k: k(g.label), loai: g.items });
      for (const t of g.items) {
        const cacTen = [t, tenLoaiHinhMenu(t, m), ...t.split("/"), ...tenLoaiHinhMenu(t, m).split(",")].map(k).filter((x) => x.length >= 3);
        for (const x of new Set(cacTen)) if (x !== k(g.label)) ten.push({ k: x, loai: [t] });
      }
    }
    ten.sort((a, b) => b.k.length - a.k.length);
    let con = ` ${nq.trim()} `;
    const ra: string[] = [];
    for (const x of ten) if (x.loai.length && con.includes(` ${x.k} `)) { ra.push(...x.loai); con = con.replace(` ${x.k} `, " # "); }
    if (ra.length) return [...new Set(ra)];
  }
  return [];
}

/** Câu gõ → các trường lọc (khu vực · loại hình · giá · phòng ngủ) — phần còn lại để ô tìm xử lý */
export function locTuCau(cauGo: string, mb: "ban" | "thue"): Filters {
  const f = emptyFilters();
  if (!cauGo.trim()) return f;
  // GÕ SAI CHÍNH TẢ → ĐỌC CÂU ĐÃ SỬA (07/11/2026, kiểu Google: "đât nên hoa xuân đag năng" đọc ra Đất nền · Hòa Xuân, Đà Nẵng). Một chỗ cho
  // mọi ô tìm, trường lọc, gợi ý — cùng bộ sửa với dòng "Đang hiển thị kết quả cho …"
  const cau = suaChinhTa(cauGo) ?? cauGo;
  const p = parseQuery(cau);
  // câu đã sửa có chữ có dấu lẫn không dấu ("bán nhà son tra") → bộ đọc nơi chốn có thể hụt; câu khách gõ đọc ra nơi thì lấy nơi đó
  // ĐỊA CHỈ: câu khách gõ đọc ra nơi SÂU HƠN (phường > quận > tỉnh) câu đã sửa → lấy theo câu khách gõ — bộ sửa chính tả không được làm mất
  // địa chỉ (anh 07/11/2026: "ban nha xa phu cat ha noi" từng bị sửa thành "phù cát" rồi mất phường)
  if (cau !== cauGo) {
    const g = parseQuery(cauGo);
    const sau = (x: typeof p.place) => (x ? (x.ward ? 3 : x.district ? 2 : 1) : 0);
    // chỉ lấy theo câu gốc khi CÙNG TỈNH với câu đã sửa (hoặc câu sửa không ra tỉnh nào) — "nha dan nang" sửa thành Đà Nẵng thì không lấy
    // xã Đăk Năng (Quảng Ngãi) của câu gốc
    const tinhSua = p.place?.province ?? p.places[0];
    const cungTinh = !tinhSua || g.place?.province === tinhSua;
    if ((g.place && cungTinh && sau(g.place) >= sau(p.place)) || (!p.place && !p.places.length)) { p.place = g.place; p.places = g.places.length ? g.places : p.places; }
  }
  const nq = ` ${normalizeVi(cau).replace(/[^a-z0-9]+/g, " ")} `;
  const pl = p.place;
  // PHƯỜNG ĐỌC THEO HỆ MỚI (07/11/2026: "bán đất nền hòa xuân" đọc thành Hòa Xuân, quận Cẩm Lệ (hệ cũ) → tin ghi "Phường Hòa Xuân, Đà Nẵng"
  // không còn chữ Cẩm Lệ nên lọt hết, báo "chưa có sẵn"). Phường cũ có trong bảng sáp nhập → quy về phường mới 2 cấp như cả web đang dùng.
  // ĐỊA CHỈ HAI CẤP: TỈNH / THÀNH PHỐ → PHƯỜNG / XÃ, CẢ HAI HỆ (anh 07/11/2026 — sửa từ gốc). Quận không phải cấp của bộ lọc:
  //   phường/xã hệ MỚI ("hòa xuân", "phường sơn trà")        → tỉnh mới → phường mới
  //   phường/xã hệ CŨ đã mất tên ("hòa quý", "an hải bắc")   → tỉnh → phường cũ đó (bộ lọc so phường cũ của tin)
  //   tên QUẬN cũ ("sơn trà", "quy nhơn", "cẩm lệ")          → phường mới CÙNG TÊN; không có → các phường mới thuộc quận đó
  //   tên cũ hơn ("hải châu 1") đã quy về phường mới ở bảng địa danh (smartSearch diaGioi)
  const moi = pl?.ward && pl.district ? phuongMoiCua(pl.province, pl.district, pl.ward) : null;
  const boCap = (x: string) => normalizeVi(x.replace(/^(Phường|Xã|Thị trấn|Đặc khu|Quận|Huyện|Thị xã|Thành phố)\s+/i, ""));
  const tinhCu = (quan: string) => provincesOld.find((t) => newProvinceOf(t.name) === pl!.province && t.districts.some((d) => boCap(d.name) === boCap(quan)))?.name ?? pl!.province;
  const phuongMoiTen = (ten: string) => provincesNew.find((t) => t.name === pl!.province)?.wards.find((w) => boCap(w) === boCap(ten));
  if (pl?.ward && pl.district) {
    // phường cũ: còn tên ở hệ mới → phường mới; mất tên → phường cũ (tỉnh → phường)
    // phường cũ đi với TỈNH MỚI (một tỉnh mới gộp nhiều tỉnh cũ — đoán tỉnh cũ dễ nhầm: "Mỹ Thủy, Quảng Trị" từng ra Quảng Bình)
    f.locations = moi && boCap(moi.phuong) === boCap(pl.ward) ? [{ province: moi.tinh, ward: moi.phuong }] : [{ province: pl.province, ward: pl.ward }];
  } else if (pl?.district) {
    // TÊN THÀNH PHỐ / QUẬN / HUYỆN CŨ = CẢ VÙNG ĐÓ (anh 07/11/2026: "phan thiết" phải ra mọi tin của TP Phan Thiết cũ — Mũi Né, Phú Thủy,
    // Tiến Thành… — trước đây chỉ lấy Phường Phan Thiết cùng tên nên lọc không ra tin nào). Không có trong bảng sáp nhập → phường cùng tên
    // MỘT NƠI = quận / thành phố cũ đó; bộ lọc chung (applyFilters) khớp mọi phường mới gộp từ nó. Không có trong bảng → phường cùng tên
    const ca = phuongMoiCuaQuan(tinhCu(pl.district), pl.district);
    const cungTen = phuongMoiTen(pl.district);
    f.locations = ca.length ? [{ province: pl.province, district: pl.district }] : cungTen ? [{ province: pl.province, ward: cungTen }] : [];
  } else if (pl?.ward) f.locations = [{ province: pl.province, ward: pl.ward }];
  else if (pl || p.places[0]) {
    // gõ TÊN TỈNH CŨ đã sáp nhập ("bình định", "quảng nam") → đúng tỉnh cũ đó, không nở ra cả tỉnh mới (Gia Lai, Đà Nẵng)
    const tinh = pl?.province ?? p.places[0];
    const cuGo = provincesOld.find((t) => newProvinceOf(t.name) === tinh && t.name !== tinh && nq.includes(` ${boCap(t.name)} `));
    f.locations = [{ province: cuGo?.name ?? tinh }];
  }
  // Loại CHỈ CÓ Ở MỤC KIA ("văn phòng", "mặt bằng" chỉ có ở Cho thuê) → tra cả mục kia; trước đây bị ép sang loại gần chữ nhất
  // ("mặt bằng" → Nhà mặt phố) — 01/11/2026
  const loaiCua = (t: string) => {
    const dung = (ds: string[]) => ds.some((x) => normalizeVi(x).includes(normalizeVi(t)));
    const a = loaiTuNhan(t, nq, mb);
    if (a.length && dung(a)) return a;
    const b = loaiTuNhan(t, nq, mb === "ban" ? "thue" : "ban");
    return dung(b) ? b : a;
  };
  // "NHÀ ĐẤT" / "BẤT ĐỘNG SẢN" / "BĐS" là cách nói CHUNG (mọi loại), không phải loại Nhà + Đất (anh 07/11/2026: "nha dat quy nhon" từng
  // thành Nhà +1, bỏ hết căn hộ… ở Quy Nhơn) — bỏ trước khi đọc loại hình, như parseQuery đã làm
  const nqLoai = nq.replace(/ bat dong san (?=(nghi duong|cong nghiep) )/g, " bds ").replace(/ nha trang /g, " ").replace(/ (nha dat|bat dong san|bds)(?= )(?! (nghi duong|cong nghiep|khac) )/g, " "); // "BĐS nghỉ dưỡng", "BĐS công nghiệp", "Bất động sản khác" là tên loại — giữ
  const theoCay = loaiTheoCay(nqLoai, mb);
  // cây chỉ khớp TÊN CHA ("nhà") mà câu nói rõ loại con bằng từ đồng nghĩa ("nhà mặt tiền" → Nhà mặt phố) → lấy loại con
  const conDongNghia = p.types.length ? [...new Set(p.types.flatMap(loaiCua))].filter((t) => theoCay.includes(t)) : [];
  // gõ ĐÚNG TÊN NHÓM CHA ("BĐS nghỉ dưỡng") → cả nhóm, không thu về một con theo từ đồng nghĩa (07/11/2026)
  const kc = (x: string) => ` ${normalizeVi(x).replace(/[^a-z0-9]+/g, " ").trim()} `;
  // "bất động sản" = "BĐS" ("bất động sản nghỉ dưỡng" là tên nhóm BĐS nghỉ dưỡng, từng ra Condotel — 07/11/2026)
  const nqCha = nq.replace(/ bat dong san (?=(nghi duong|cong nghiep) )/g, " bds ");
  const goCha = typeGroupsFor(mb).some((g) => g.label !== "Khác" && nqCha.includes(kc(g.label)) && g.items.every((x) => theoCay.includes(x)));
  if (theoCay.length) f.types = !goCha && conDongNghia.length && conDongNghia.length < theoCay.length ? conDongNghia : theoCay;
  else if (p.types.length) f.types = [...new Set(p.types.flatMap(loaiCua))];
  // "nha trang" (gõ không dấu) là nơi chốn, không phải "nhà"
  else if (/ nha /.test(nq.replace(/ nha trang /g, " ")) && !/ nha dat /.test(nq)) f.types = typeGroupsFor(mb).find((g) => g.label === "Nhà")?.items ?? [];
  // VILLA = BIỆT THỰ (anh 08/11/2026: "villa nha trang 2 phòng ngủ" chỉ ra 1 căn hộ condotel hết hạn — tin villa trên web ghi loại "Nhà biệt
  // thự / Liền kề", còn chữ "villa" đọc thành "Villa / Biệt thự biển" nhóm nghỉ dưỡng). Gõ villa hoặc biệt thự → lấy CẢ HAI loại
  const dsLoai = typeGroupsFor(mb).flatMap((g) => g.items);
  const laBietThu = (t: string) => /villa|biệt thự/i.test(t);
  if (f.types.some(laBietThu)) f.types = [...new Set([...f.types, ...dsLoai.filter(laBietThu)])];
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

/** CÂU ĐÃ HIỂU — dòng "Đang hiển thị kết quả cho …" CHUẨN GOOGLE (anh 07/11/2026: "làm đi"): GIỮ ĐÚNG THỨ TỰ CHỮ KHÁCH GÕ, chỉ sửa chữ
 *  sai và đặt dấu (bộ sửa chính tả dùng chung suaChinhTa); tên nơi web đã hiểu (theo bảng địa chỉ) viết hoa đúng tên. Không đảo chữ,
 *  không bỏ chữ ("chung cu hue gan trung tâm duoi 3 ty" → "chung cư Huế gần trung tâm dưới 3 tỷ").
 *  Trả null khi không có gì để sửa. */
export function cauDaHieu(raw: string, mb: "ban" | "thue"): string | null {
  const goc = raw.trim();
  if (!goc) return null;
  const sua = suaChinhTa(goc);
  if (!sua) return null;
  // CÂU CÓ CHỮ KHÔNG HIỂU (viết bậy, chữ lạ) → KHÔNG hiện dòng sửa (anh 08/11/2026: "không gợi ý được thì thôi, CẤM gợi ý bậy" — trước đây
  // "…sổ hồngke ca goi ý thay thê kh" bị "sửa" thành "kề", "thê" vô nghĩa, in đậm)
  if (chuChuaHieu(goc) || chuChuaHieu(sua)) return null;
  const f = locTuCau(goc, mb);
  const boCapTen = (x: string) => x.replace(/^(Phường|Xã|Thị trấn|Đặc khu|Quận|Huyện|Thị xã|Thành phố)\s+/i, "");
  const thoat = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  let cau = sua;
  const ten = [...new Set(f.locations.flatMap((l) => [l.ward, l.district, l.province]).filter((x): x is string => !!x).map(boCapTen))]
    .sort((a, b) => b.length - a.length);
  for (const t of ten) cau = cau.replace(new RegExp(`(^|\\s)${thoat(t.toLowerCase())}(?=[\\s,]|$)`, "u"), (_, a: string) => a + t);
  // gõ TÊN TỈNH VIẾT LIỀN / KHÔNG DẤU / VIẾT TẮT ("danang", "hcm") → viết lại đúng tên tỉnh (anh 08/11/2026: "nhà đất danang" phải hiện "nhà đất Đà Nẵng")
  for (const tinh of new Set(f.locations.map((l) => l.province))) {
    for (const k of biDanhTinh(tinh).filter((x) => x.length >= 3 && x !== "my khe")) cau = cau.replace(new RegExp(`(^|\\s)${thoat(k)}(?=[\\s,]|$)`, "iu"), (_, a: string) => a + tinh);
  }
  const so = (s: string) => s.normalize("NFC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  return so(cau) === so(goc) ? null : cau;
}
