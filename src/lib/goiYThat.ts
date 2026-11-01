import type { Listing } from "@/lib/data";
import { applyFilters, emptyFilters, normalizeVi, priceToTy, type Filters } from "@/lib/filters";
import { chuChuaHieu, parseQuery } from "@/lib/smartSearch";
import { cauThanhBoLoc } from "@/lib/locDanhSach";
import { THANH_PHO } from "@/lib/pseo";
import { docDacDiem, goiYTheoY, hrefGoiY, type DongGoiY, type MucTim } from "@/lib/goiYTheoY";
import type { DuAnTen } from "@/lib/duAnTen";

// ============================================================================
// GỢI Ý THEO DỮ LIỆU THẬT (chủ dự án 21/10/2026: "gợi ý theo dữ liệu web, chuẩn"; tìm câu vô lý thì gợi ý phải thực tế).
// Chạy ở MÁY CHỦ (đếm trên cả kho tin — chịu được 10.000 tin) qua /api/goi-y/that. Mỗi dòng gợi ý PHẢI có tin thật:
//   1. Câu khách nói khớp được tin → giữ nguyên câu (mục đích + loại + phòng ngủ + nơi + giá).
//   2. Không có tin → nới GIÁ về mức có tin gần nhất ("dưới 1 tỷ" → "dưới 4 tỷ"); vẫn không có → bỏ số phòng ngủ.
//   3. Nơi là THÀNH PHỐ (Quy Nhơn, Hội An…) hoặc phường trong thành phố → gợi ý các PHƯỜNG đang có tin, rồi cả tỉnh.
// Câu không hiểu được loại hay nơi nào (tên dự án…) → dùng gợi ý theo ý câu (goiYTheoY) như cũ.
// ============================================================================
const DONG_TU: Record<MucTim, string> = { ban: "Bán", thue: "Cho thuê" };
const boCap = (s: string) => s.replace(/^(Phường|Xã|Thị trấn|Đặc khu)\s+/i, "");

/** Mức giá "dưới X" tròn, vừa đủ chứa tin rẻ nhất: 3,45 tỷ → 4 tỷ · 0,62 tỷ (thuê 6,2 triệu) → 7 triệu */
function mucGiaThat(minTy: number): { ty: number; chu: string } {
  if (minTy >= 1) { const x = Math.floor(minTy) + 1; return { ty: x, chu: `dưới ${x} tỷ` }; }
  const tr = Math.floor(minTy * 1000) + 1;
  const len = tr <= 10 ? tr : Math.ceil(tr / 5) * 5;
  return { ty: len / 1000, chu: `dưới ${len} triệu` };
}

export function goiYThat(raw: string, mucDangDung: MucTim, tin: Listing[], dsDuAn: DuAnTen[]): DongGoiY[] {
  const p = parseQuery(raw);
  // Dòng theo ý câu (đã xét dự án, mục đích bán/thuê) — làm khung, rồi kiểm từng dòng với dữ liệu thật
  const khung = goiYTheoY(raw, mucDangDung, dsDuAn);
  const coTieuChi = p.types.length > 0 || !!p.place || p.places.length > 0;
  // Không hiểu được trường nào (goiYTheoY trả rỗng hoặc chỉ dòng dự án) → không dựng thêm dòng nào
  if (!coTieuChi || !khung.some((d) => !d.href.startsWith("/du-an/") && !/[?&]duan=/.test(d.href))) return khung;
  // Từ chưa hiểu ("sân vườn") giữ nguyên trong dòng gợi ý — chỉ khi có tin thật nhắc tới từ đó trong nội dung
  const chuaHieu = chuChuaHieu(raw);
  const cumLa = chuaHieu ? chuaHieu.split(", ").map((c) => normalizeVi(c)) : [];
  const coCumLa = (l: Listing) => {
    const nd = ` ${normalizeVi([l.title, l.desc, l.searchText].filter(Boolean).join(" ")).replace(/[^a-z0-9]+/g, " ")} `;
    return cumLa.every((c) => nd.includes(` ${c.replace(/[^a-z0-9]+/g, " ").trim()} `));
  };

  const nq = ` ${normalizeVi(raw).replace(/[^a-z0-9]+/g, " ")} `;
  const loai = p.types[0]?.toLowerCase() ?? (/ nha /.test(nq) && !/ nha dat /.test(nq) ? "nhà" : "");
  const dacDiem = docDacDiem(p.features, nq);
  // "trung tâm" đọc như nơi chốn: "Bán nhà tại trung tâm Đà Nẵng" (không phải "nhà trung tâm tại Đà Nẵng")
  const taiTT = p.features.includes("trung tâm") ? "trung tâm " : "";
  const cacMuc = [...new Set(khung.filter((d) => !d.href.startsWith("/du-an/") && d.muc !== "duan").map((d) => d.muc as MucTim))];
  const ds: DongGoiY[] = khung.filter((d) => d.href.startsWith("/du-an/") || /[?&]duan=/.test(d.href)); // dòng dự án giữ nguyên
  const them = (m: MucTim, nhan: string) => {
    if (!ds.some((x) => normalizeVi(x.nhan) === normalizeVi(nhan))) ds.push({ nhan, muc: m, href: hrefGoiY(m, nhan) });
  };
  let giuLa = false; // dòng đang dựng có giữ từ chưa hiểu không (chỉ khi có tin nhắc tới)
  // ĐỊA DANH CHUẨN (chủ dự án 01/11/2026): phường / xã luôn kèm tỉnh — "tại Sơn Trà, Đà Nẵng", "tại Bắc Nha Trang, Khánh Hòa"
  const tinhCau = p.place?.province ?? p.places[0] ?? "";
  const noiDu = (noi: string) => (noi && tinhCau && normalizeVi(noi) !== normalizeVi(tinhCau) ? `${noi}, ${tinhCau}` : noi);
  // LỌC THÊM trong câu (hướng · pháp lý · nội thất — cauThanhBoLoc đã đọc thành trường, 01/11/2026): dòng gợi ý ghi đúng các trường
  // còn giữ sau khi nới; trường đã bỏ (không có tin) thì không ghi
  const dacDiemCua = (f: Filters) => dacDiem.split(", ").filter((x) => x
    && (f.legal || !/^sổ (hồng|đỏ)$/.test(x)) && (f.furnishing || x !== "full nội thất"))
    // pháp lý, nội thất khác sổ / full nội thất: ghi đúng mục bộ lọc ("nội thất cơ bản", "hợp đồng mua bán")
    .concat(f.furnishing && f.furnishing !== "Đầy đủ nội thất" ? [f.furnishing.toLowerCase()] : [], f.legal && f.legal !== "Sổ đỏ / Sổ hồng" ? [f.legal.toLowerCase()] : [])
    .join(", ");
  const cau = (m: MucTim, f: Filters, noi: string, gia: string, coTT = true, loaiKhac = "") =>
    [DONG_TU[m], loaiKhac || loai || "nhà đất", f.beds ? `${f.beds} phòng ngủ` : "", [dacDiemCua(f), f.direction ? `hướng ${f.direction.toLowerCase()}` : "", giuLa ? chuaHieu : ""].filter(Boolean).join(", "), noi ? `tại ${coTT ? taiTT : ""}${noiDu(noi)}` : "", gia].filter(Boolean).join(" ");

  for (const m of cacMuc) {
    const tatCa = tin.filter((l) => !l.banSao && (l.purpose ?? "ban") === (m === "thue" ? "thue" : "ban"));
    // Có tin nhắc từ chưa hiểu → chỉ đếm trong các tin đó; không có tin nào → bỏ từ đó, gợi ý theo các trường đã hiểu
    const bl: Filters = { ...(cauThanhBoLoc({ ...emptyFilters(), keyword: raw }, m) ?? emptyFilters()), keyword: "" };
    // Tin nhắc từ chưa hiểu phải ĐÚNG loại + nơi khách nói (bỏ giá, phòng ngủ) — có tin nhắc "3 tỷ" ở nơi khác thì không tính, nếu
    // không gợi ý trống trơn (01/11/2026: "đất nền đà nẵng 3 tỷ" ra trống)
    const coLa = cumLa.length ? applyFilters(tatCa.filter(coCumLa), { ...bl, priceMin: null, priceMax: null, beds: 0 }) : [];
    giuLa = coLa.length > 0;
    const goc = giuLa ? coLa : tatCa;
    const dem = (f: Filters) => applyFilters(goc, f);
    const noiGoc = boCap(p.place?.ward ?? p.place?.district ?? p.place?.province ?? p.places[0] ?? "");
    const giaChu = bl.priceMax != null ? `dưới ${bl.priceMax >= 1 ? `${bl.priceMax} tỷ` : `${Math.round(bl.priceMax * 1000)} triệu`}` : "";

    // 1–2. Đúng câu; không có tin thì nới giá, rồi bỏ phòng ngủ
    const khongGia = { ...bl, priceMin: null, priceMax: null };
    // nới lần lượt: giá → phòng ngủ → các trường Lọc thêm
    const boLocThem = { ...khongGia, beds: 0, direction: "", legal: "", furnishing: "" };
    if (dem(bl).length) them(m, cau(m, bl, noiGoc, giaChu));
    else {
      // Lọc thêm bỏ TỪNG trường trước (trường nào không có tin thì bỏ trường đó), hết cách mới bỏ cả
      // Thứ tự nới theo độ quan trọng với người mua: giá → hướng → pháp lý → nội thất (bỏ dần, GIỮ phòng ngủ) → phòng ngủ → bỏ hết
      // (01/11/2026: gõ thêm "hướng đông nam" từng làm rơi mất "2 phòng ngủ" vì phòng ngủ bị bỏ trước)
      const thang: Filters[] = [khongGia];
      for (const k of ["direction", "legal", "furnishing"] as const) if (bl[k]) thang.push({ ...thang[thang.length - 1], [k]: "" });
      thang.push({ ...thang[thang.length - 1], beds: 0 }, boLocThem);
      const coTin = thang.find((x) => dem(x).length) ?? null;
      if (coTin) {
        const re = Math.min(...dem(coTin).map((l) => priceToTy(l.price) ?? Infinity));
        // NỚI GIÁ CHỈ LÊN (01/11/2026: "dưới 3 tỷ" từng ra "dưới 2 tỷ"): mức nới thấp hơn mức khách gõ → giữ đúng mức khách gõ
        const noi = Number.isFinite(re) ? mucGiaThat(re) : null;
        const gia = bl.priceMax != null || bl.priceMin != null ? (noi && (bl.priceMax == null || noi.ty > bl.priceMax) ? noi.chu : giaChu) : "";
        them(m, cau(m, coTin, noiGoc, gia));
      }
    }

    // 2b. CHƯA NÓI LOẠI HÌNH (gõ nơi chốn trơn: "Đà", "đà nẵng") → gợi ý theo LOẠI HÌNH đang có nhiều tin nhất ở đó, kiểu Google
    // ("Bán căn hộ tại Đà Nẵng", "Bán nhà riêng tại Đà Nẵng"…) — không bày phường với "nhà đất" na ná nhau (chủ dự án 01/11/2026, ảnh)
    if (!loai) {
      const theoLoai = new Map<string, number>();
      for (const l of dem(bl)) if (l.type) theoLoai.set(l.type, (theoLoai.get(l.type) ?? 0) + 1);
      for (const [lh] of [...theoLoai].sort((a, b) => b[1] - a[1]).slice(0, 3)) them(m, cau(m, bl, noiGoc, giaChu, true, lh.toLowerCase()));
      continue;
    }

    // 3. Phường đang có tin trong thành phố khách nói (hoặc thành phố chứa phường khách nói), rồi cả tỉnh
    const tinh = p.place?.province ?? p.places[0];
    const tp = THANH_PHO.find((t) => normalizeVi(t.tinh) === normalizeVi(tinh ?? "")
      && (normalizeVi(t.name) === normalizeVi(noiGoc) || t.phuong.some((x) => normalizeVi(boCap(x)) === normalizeVi(noiGoc))));
    const boNoi = { ...khongGia, beds: bl.beds, locations: [] as Filters["locations"] };
    if (tp && tinh) {
      const theoPhuong = tp.phuong
        .map((ph) => ({ ph, n: dem({ ...boNoi, locations: [{ province: tinh, ward: ph }] }).length }))
        .filter((x) => x.n > 0 && normalizeVi(boCap(x.ph)) !== normalizeVi(noiGoc))
        .sort((a, b) => b.n - a.n)
        .slice(0, 3);
      for (const x of theoPhuong) them(m, cau(m, boNoi, boCap(x.ph), ""));
    } else if (tinh && normalizeVi(tinh) === normalizeVi(noiGoc)) {
      // Gõ CẢ TỈNH ("căn hộ đà nẵng") → thêm các phường ĐANG CÓ NHIỀU TIN NHẤT của đúng loại đó (dữ liệu thật), kiểu Google
      // giữ ĐÚNG giá, phòng ngủ khách gõ (đếm theo bl); "trung tâm" là cả tỉnh — dòng phường không chêm chữ đó
      const theoPhuong = new Map<string, number>();
      for (const l of dem({ ...bl, locations: [{ province: tinh }] })) {
        const ph = boCap(l.location.split(",")[0]?.trim() ?? "");
        if (ph && normalizeVi(ph) !== normalizeVi(tinh) && !/\d/.test(ph)) theoPhuong.set(ph, (theoPhuong.get(ph) ?? 0) + 1);
      }
      for (const [ph] of [...theoPhuong].sort((a, b) => b[1] - a[1]).slice(0, 3)) them(m, cau(m, bl, ph, giaChu, false));
    }
    if (tinh && normalizeVi(tinh) !== normalizeVi(noiGoc) && dem({ ...boNoi, locations: [{ province: tinh }] }).length) {
      them(m, cau(m, boNoi, tinh, ""));
    }
  }
  return ds.slice(0, 6);
}
