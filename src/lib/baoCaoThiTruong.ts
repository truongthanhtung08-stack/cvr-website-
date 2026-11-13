// ĐIỂM TIN THỊ TRƯỜNG COASTAL LAND (anh 13/11/2026) — báo cáo QUÝ ĐÃ KẾT THÚC, theo KHU VỰC, số THỊ TRƯỜNG SƠ CẤP (nguồn cung từ chủ
// đầu tư) như bản tin DKRA. Số KHÔNG lấy từ tin trên web: Cowork lọc từ cơ sở số liệu DKRA (thiếu mới lấy Sở Xây dựng, chủ đầu tư…)
// vào bảng mẫu `SEO\MAU\bao-cao-thi-truong\MAU-BAO-CAO-THI-TRUONG.xlsx` → Admin → Điểm tin thị trường nạp tệp → trang tự lên số + biểu đồ.
// Yêu cầu Cowork: `SEO\YEU-CAU-COWORK-BAO-CAO-THI-TRUONG.md`. Cột của bảng = trường của các kiểu dưới đây (đổi cột phải đổi cả hai).
// Bố cục 3 chương như DKRA: 01 Kinh tế – Xã hội (chỉ số kinh tế · chính sách – pháp lý · hạ tầng giao thông) · 02 Diễn biến thị trường
// (6 phân khúc) · 03 Dự báo thị trường quý tới.

export type VungBaoCao = { id: string; ten: string; nut: string; phu: string; tinh: string[] };
// 3 VÙNG (anh 13/11/2026). Tên tỉnh cũ của nguồn (Quảng Nam, Bình Định, Phú Yên, Bình Thuận…) cũng nhận về đúng vùng.
export const VUNG_BAO_CAO: VungBaoCao[] = [
  // SỐ LIỆU THEO TỈNH THÀNH MỚI (anh 13/11/2026): tab + tiêu đề gọi theo tỉnh mới; tinh = tỉnh mới của vùng
  { id: "da-nang", ten: "Đà Nẵng – Huế – Quảng Trị – Quảng Ngãi", nut: "Đà Nẵng", phu: "Huế · Quảng Trị · Quảng Ngãi", tinh: ["Đà Nẵng", "Huế", "Quảng Trị", "Quảng Ngãi"] },
  { id: "quy-nhon", ten: "Gia Lai – Đắk Lắk", nut: "Gia Lai", phu: "Đắk Lắk", tinh: ["Gia Lai", "Đắk Lắk"] },
  { id: "nha-trang", ten: "Khánh Hòa – Lâm Đồng", nut: "Khánh Hòa", phu: "Lâm Đồng", tinh: ["Khánh Hòa", "Lâm Đồng"] },
];

// Phân khúc như DKRA — chỉ đúng các tên này (bảng mẫu cột phan_khuc)
export const PHAN_KHUC = ["Đất nền", "Căn hộ", "Nhà phố / Biệt thự", "Biệt thự nghỉ dưỡng", "Shophouse nghỉ dưỡng", "Condotel"] as const;
export type PhanKhuc = (typeof PHAN_KHUC)[number];
export const TEN_PHAN_KHUC: Record<PhanKhuc, string> = {
  "Đất nền": "Phân khúc Đất nền", "Căn hộ": "Phân khúc Căn hộ", "Nhà phố / Biệt thự": "Phân khúc Nhà phố / Biệt thự",
  "Biệt thự nghỉ dưỡng": "Bất động sản nghỉ dưỡng – Biệt thự nghỉ dưỡng", "Shophouse nghỉ dưỡng": "Bất động sản nghỉ dưỡng – Nhà phố / Shophouse nghỉ dưỡng",
  Condotel: "Bất động sản nghỉ dưỡng – Condotel",
};
export const DON_VI_SP: Record<PhanKhuc, string> = { "Đất nền": "nền", "Căn hộ": "căn", "Nhà phố / Biệt thự": "căn", "Biệt thự nghỉ dưỡng": "căn", "Shophouse nghỉ dưỡng": "căn", Condotel: "căn" };

// Tỉnh CŨ / thành phố nguồn hay dùng → tỉnh MỚI (bảng sáp nhập 2025, chỉ các tỉnh thuộc 3 vùng — khớp provinceMergers ở
// src/lib/locations.ts; không nhập bộ địa danh nặng vào trang báo cáo). Không có trong bảng → giữ nguyên.
const TINH_MOI: Record<string, string> = {
  "quang nam": "Đà Nẵng", "hoi an": "Đà Nẵng", "tam ky": "Đà Nẵng", "thua thien hue": "Huế", "quang binh": "Quảng Trị", "dong hoi": "Quảng Trị",
  "dong ha": "Quảng Trị", "kon tum": "Quảng Ngãi", "binh dinh": "Gia Lai", "quy nhon": "Gia Lai", "pleiku": "Gia Lai", "phu yen": "Đắk Lắk",
  "tuy hoa": "Đắk Lắk", "buon ma thuot": "Đắk Lắk", "ninh thuan": "Khánh Hòa", "nha trang": "Khánh Hòa", "cam ranh": "Khánh Hòa", "phan rang": "Khánh Hòa",
  "phan rang thap cham": "Khánh Hòa", "binh thuan": "Lâm Đồng", "phan thiet": "Lâm Đồng", "mui ne": "Lâm Đồng", "da lat": "Lâm Đồng", "bao loc": "Lâm Đồng", "dak nong": "Lâm Đồng",
};
export const tinhMoi = (t: string) => TINH_MOI[bo(t)] ?? t.trim();
const bo = (s: string) => (s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
export function vungCua(vung: string, tinh: string): string | null {
  const t = bo(tinhMoi(tinh)), v = bo(vung);
  const theoTinh = t ? VUNG_BAO_CAO.find((x) => x.tinh.some((n) => bo(n) === t)) : undefined;
  if (theoTinh) return theoTinh.id;
  return VUNG_BAO_CAO.find((x) => x.id === v.replace(/ /g, "-") || [x.nut, x.ten, ...x.tinh].some((n) => v.includes(bo(n))))?.id ?? null;
}
export function phanKhucChuan(s: string): PhanKhuc | null {
  const b = bo(s);
  if (/condotel|can ho khach san/.test(b)) return "Condotel";
  if (/(shophouse|nha pho).*nghi duong/.test(b)) return "Shophouse nghỉ dưỡng";
  if (/(biet thu|villa).*nghi duong|^villa/.test(b)) return "Biệt thự nghỉ dưỡng";
  if (/dat nen|^dat$/.test(b)) return "Đất nền";
  if (/can ho|chung cu/.test(b)) return "Căn hộ";
  if (/nha pho|biet thu|lien ke|shophouse/.test(b)) return "Nhà phố / Biệt thự";
  return null;
}
// "Q3/2026", "Q3-2026", "Quý 3/2026", "2026-Q3" → "2026-Q3" (xếp được); hiển thị bằng tenQuy → "Q3/2026"
export function quyChuan(s: string): string | null {
  const t = String(s ?? "");
  const a = t.match(/(?:q|quy|quý)\s*([1-4])\D+(\d{4})/i);
  if (a) return `${a[2]}-Q${a[1]}`;
  const b = t.match(/(\d{4})\D*q\s*([1-4])/i);
  return b ? `${b[1]}-Q${b[2]}` : null;
}
export const tenQuy = (q: string) => q.replace(/^(\d{4})-Q(\d)$/, "Q$2/$1");
export const quyTruoc = (q: string) => { const [y, n] = q.split("-Q").map(Number); return n === 1 ? `${y - 1}-Q4` : `${y}-Q${n - 1}`; };
export const quySau = (q: string) => { const [y, n] = q.split("-Q").map(Number); return n === 4 ? `${y + 1}-Q1` : `${y}-Q${n + 1}`; };

// ── DỮ LIỆU NẠP (đúng cột bảng mẫu) ─────────────────────────────────────────────
export type DongThiTruong = {
  vung: string; tinh: string; khuVuc: string; phanKhuc: PhanKhuc; quy: string;
  soDuAn?: number; nguonCung?: number; cungMoi?: number; tieuThu?: number; tyLe?: number;
  giaThap?: number; giaTB?: number; giaCao?: number; donViGia: string; bdSoCap?: number; bdThuCap?: number;
  nguon: string; link?: string; ngay?: string; ghiChu?: string;
};
export type ChiSoKinhTe = { vung: string; tinh: string; chiSo: string; ky: string; giaTri: string; donVi: string; caNuoc: string; soCungKy: string; nguon: string; link?: string };
export type VanBan = { vung: string; tinh: string; soHieu: string; ngay: string; coQuan: string; noiDung: string; hieuLuc: string; link?: string };
export type CongTrinh = { vung: string; tinh: string; ten: string; moc: string; ngay: string; von: string; noiDung: string; toaDo: string; anh: string; nguon: string; link?: string };
export type DuAnMoBan = {
  vung: string; tinh: string; khuVuc: string; phanKhuc: PhanKhuc; quy: string; ten: string; chuDauTu: string;
  soDangChao?: number; moBanMoi?: number; daBan?: number; giaThap?: number; giaTB?: number; giaCao?: number; donViGia: string;
  chinhSach: string; ngay: string; nguon: string; link?: string;
};
export type DuBao = { vung: string; phanKhuc: string; noiDung: string; nguon: string; link?: string };
export type BaoCaoNhap = {
  capNhat: string; quyBaoCao: string; // quý đang hiện trên web, vd "2026-Q3"
  thiTruong: DongThiTruong[]; kinhTe: ChiSoKinhTe[]; chinhSach: VanBan[]; haTang: CongTrinh[]; duAn: DuAnMoBan[]; duBao: DuBao[];
  nhanDinh?: Record<string, string[]>; // anh duyệt / sửa: khoá "<vùng>|<phân khúc>"; rỗng → web viết từ số
  pdf?: Record<string, string>; // khoá "<vùng>|<quý>" → đường dẫn tệp PDF
};

// ── ĐỌC BẢNG CỦA COWORK ─────────────────────────────────────────────────────────
export type KetQuaDoc = { bang: BaoCaoNhap; loi: string[]; dem: Record<string, number> };
const so = (v: string | undefined): number | undefined => {
  const t = String(v ?? "").trim().replace(/%$/, "").replace(/\s/g, "");
  if (!t) return undefined;
  // 1.547 / 1,547 (nghìn) · 4,5 / 4.5 (thập phân)
  const n = /^-?\d{1,3}([.,]\d{3})+$/.test(t) ? Number(t.replace(/[.,]/g, "")) : Number(t.replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
};
export function docBangBaoCao(sheet: (ten: string) => string[][] | null): KetQuaDoc {
  const loi: string[] = [];
  const doc = <T,>(ten: string, ham: (g: (c: string) => string, dong: number) => T | null): T[] => {
    const b = sheet(ten);
    if (!b) { loi.push(`Thiếu sheet "${ten}"`); return []; }
    const dau = (b[0] ?? []).map((h) => bo(h ?? "").replace(/ /g, "_"));
    const ra: T[] = [];
    b.slice(1).forEach((r, i) => {
      if (!r.some((c) => String(c ?? "").trim())) return;
      if (/^vi du/.test(bo(r[0] ?? ""))) return; // dòng VÍ DỤ của bảng mẫu
      const g = (c: string) => String(r[dau.indexOf(c)] ?? "").trim();
      const x = ham(g, i + 2);
      if (x) ra.push(x);
    });
    return ra;
  };
  const thiTruong = doc<DongThiTruong>("THI-TRUONG", (g, d) => {
    const pk = phanKhucChuan(g("phan_khuc")), q = quyChuan(g("quy")), v = vungCua(g("vung"), g("tinh"));
    if (!pk) { loi.push(`THI-TRUONG dòng ${d}: phân khúc "${g("phan_khuc")}" không đúng danh sách`); return null; }
    if (!q) { loi.push(`THI-TRUONG dòng ${d}: quý "${g("quy")}" không đọc được (ghi Q3/2026)`); return null; }
    if (!v) { loi.push(`THI-TRUONG dòng ${d}: tỉnh "${g("tinh")}" không thuộc 3 vùng`); return null; }
    if (!g("nguon")) loi.push(`THI-TRUONG dòng ${d}: thiếu nguồn`);
    return { vung: v, tinh: tinhMoi(g("tinh")), khuVuc: g("khu_vuc"), phanKhuc: pk, quy: q, soDuAn: so(g("so_du_an")), nguonCung: so(g("nguon_cung_so_cap")),
      cungMoi: so(g("nguon_cung_moi")), tieuThu: so(g("tieu_thu")), tyLe: so(g("ty_le_tieu_thu")), giaThap: so(g("gia_thap")), giaTB: so(g("gia_tb")),
      giaCao: so(g("gia_cao")), donViGia: g("don_vi_gia") || "triệu/m²", bdSoCap: so(g("bien_dong_so_cap")), bdThuCap: so(g("bien_dong_thu_cap")),
      nguon: g("nguon"), link: g("link"), ngay: g("ngay_cong_bo"), ghiChu: [g("ghi_chu"), bo(g("tinh")) !== bo(tinhMoi(g("tinh"))) ? `tỉnh cũ: ${g("tinh")}` : ""].filter(Boolean).join(" · ") };
  });
  const kinhTe = doc<ChiSoKinhTe>("KINH-TE", (g) => { const v = vungCua(g("vung"), g("tinh")); return v && g("chi_so") ? { vung: v, tinh: tinhMoi(g("tinh")), chiSo: g("chi_so"), ky: g("ky"), giaTri: g("gia_tri_tinh"), donVi: g("don_vi"), caNuoc: g("gia_tri_ca_nuoc"), soCungKy: g("so_cung_ky"), nguon: g("nguon"), link: g("link") } : null; });
  const chinhSach = doc<VanBan>("CHINH-SACH", (g) => { const v = vungCua(g("vung"), g("tinh")); return v && g("so_hieu") ? { vung: v, tinh: tinhMoi(g("tinh")), soHieu: g("so_hieu"), ngay: g("ngay_ban_hanh"), coQuan: g("co_quan"), noiDung: g("noi_dung"), hieuLuc: g("hieu_luc"), link: g("link") } : null; });
  const haTang = doc<CongTrinh>("HA-TANG", (g) => { const v = vungCua(g("vung"), g("tinh")); return v && g("cong_trinh") ? { vung: v, tinh: tinhMoi(g("tinh")), ten: g("cong_trinh"), moc: g("moc"), ngay: g("ngay"), von: g("von"), noiDung: g("noi_dung"), toaDo: g("toa_do"), anh: g("anh"), nguon: g("nguon"), link: g("link") } : null; });
  const duAn = doc<DuAnMoBan>("DU-AN-MO-BAN", (g, d) => {
    if (!g("du_an")) return null;
    const v = vungCua(g("vung"), g("tinh")), pk = phanKhucChuan(g("phan_khuc")), q = quyChuan(g("quy"));
    if (!v || !pk || !q) { loi.push(`DU-AN-MO-BAN dòng ${d}: thiếu / sai vùng, phân khúc hoặc quý`); return null; }
    return { vung: v, tinh: tinhMoi(g("tinh")), khuVuc: g("khu_vuc"), phanKhuc: pk, quy: q, ten: g("du_an"), chuDauTu: g("chu_dau_tu"), soDangChao: so(g("so_dang_chao")),
      moBanMoi: so(g("mo_ban_moi")), daBan: so(g("da_ban")), giaThap: so(g("gia_thap")), giaTB: so(g("gia_tb")), giaCao: so(g("gia_cao")), donViGia: g("don_vi_gia") || "triệu/m²",
      chinhSach: g("chinh_sach"), ngay: g("ngay"), nguon: g("nguon"), link: g("link") };
  });
  const duBao = doc<DuBao>("DU-BAO", (g) => { const v = vungCua(g("vung"), ""); return v && g("noi_dung") ? { vung: v, phanKhuc: g("phan_khuc"), noiDung: g("noi_dung"), nguon: g("nguon"), link: g("link") } : null; });
  const quys = [...new Set(thiTruong.map((x) => x.quy))].sort();
  return {
    bang: { capNhat: new Date().toISOString(), quyBaoCao: quys[quys.length - 1] ?? "", thiTruong, kinhTe, chinhSach, haTang, duAn, duBao },
    loi,
    dem: { "Thị trường": thiTruong.length, "Kinh tế": kinhTe.length, "Chính sách": chinhSach.length, "Hạ tầng": haTang.length, "Dự án mở bán": duAn.length, "Dự báo": duBao.length },
  };
}

// ── TÍNH CHỈ SỐ CHO TRANG ────────────────────────────────────────────────────────
export type SoQuy = { quy: string; nguonCung?: number; tieuThu?: number };
export type SoPhanKhuc = {
  phanKhuc: PhanKhuc; donVi: string; soDuAn?: number; nguonCung?: number; cungMoi?: number; tieuThu?: number; tyLe?: number;
  doiCung?: number; doiTieuThu?: number; giaTB?: number; donViGia: string; bdSoCap?: number; bdThuCap?: number;
  theoQuy: SoQuy[]; tyTrong: [string, number][]; giaKhuVuc: { kv: string; thap?: number; tb?: number; cao?: number }[];
  duAn: DuAnMoBan[]; nguon: string[];
};
export type SoVung = {
  vung: VungBaoCao; quy: string; phanKhuc: SoPhanKhuc[]; tongCung?: number; tongTieuThu?: number;
  kinhTe: ChiSoKinhTe[]; chinhSach: VanBan[]; haTang: CongTrinh[]; duBao: DuBao[]; pdf?: string; nhanDinh: Record<string, string[]>;
};

const cong = (a: (number | undefined)[]) => (a.some((x) => x != null) ? a.reduce<number>((s, x) => s + (x ?? 0), 0) : undefined);
// Tổng một chỉ số của vùng: mỗi tỉnh lấy dòng "cả tỉnh" (khu_vuc trống) nếu có, không thì cộng các dòng khu vực
function tongVung(d: DongThiTruong[], k: "soDuAn" | "nguonCung" | "cungMoi" | "tieuThu"): number | undefined {
  const theoTinh = new Map<string, DongThiTruong[]>();
  for (const x of d) theoTinh.set(bo(x.tinh), [...(theoTinh.get(bo(x.tinh)) ?? []), x]);
  return cong([...theoTinh.values()].map((ds) => { const ca = ds.find((x) => !x.khuVuc); return ca ? ca[k] : cong(ds.map((x) => x[k])); }));
}
const pt = (a?: number, b?: number) => (a != null && b ? ((a - b) / b) * 100 : undefined);

export function soLieuVung(vung: VungBaoCao, bang: BaoCaoNhap | null, quy: string): SoVung {
  const cua = (pk: PhanKhuc, q: string) => (bang?.thiTruong ?? []).filter((x) => x.vung === vung.id && x.phanKhuc === pk && x.quy === q);
  const phanKhuc: SoPhanKhuc[] = [];
  for (const pk of PHAN_KHUC) {
    const d = cua(pk, quy);
    if (!d.length) continue; // khu vực / phân khúc chưa đủ số → không hiện
    const dt = cua(pk, quyTruoc(quy));
    const nguonCung = tongVung(d, "nguonCung"), tieuThu = tongVung(d, "tieuThu");
    const ca = d.find((x) => !x.khuVuc) ?? d[0];
    let q = quy; const theoQuy: SoQuy[] = [];
    for (let i = 0; i < 5; i++) { const x = cua(pk, q); theoQuy.unshift({ quy: q, nguonCung: tongVung(x, "nguonCung"), tieuThu: tongVung(x, "tieuThu") }); q = quyTruoc(q); }
    const khu = d.filter((x) => x.khuVuc);
    const nhom = (khu.length ? khu.map((x) => [x.khuVuc, x.nguonCung ?? 0] as [string, number]) : d.map((x) => [x.tinh, x.nguonCung ?? 0] as [string, number]))
      .filter((x) => x[1] > 0).sort((a, b) => b[1] - a[1]);
    const tyTrong: [string, number][] = nhom.slice(0, 5);
    // Phần còn lại tính trên TỔNG nguồn cung của vùng (khu vực nguồn không ghi riêng cũng nằm trong tổng) — tỷ trọng đúng mẫu số
    const daTinh = tyTrong.reduce((s, x) => s + x[1], 0);
    const conLai = Math.max(nguonCung ?? 0, nhom.reduce((s, x) => s + x[1], 0)) - daTinh;
    if (conLai > 0) tyTrong.push(["Khu vực khác", conLai]);
    phanKhuc.push({
      phanKhuc: pk, donVi: DON_VI_SP[pk], soDuAn: tongVung(d, "soDuAn"), nguonCung, cungMoi: tongVung(d, "cungMoi"), tieuThu,
      tyLe: ca.tyLe ?? (nguonCung && tieuThu != null ? (tieuThu / nguonCung) * 100 : undefined),
      doiCung: pt(nguonCung, tongVung(dt, "nguonCung")), doiTieuThu: pt(tieuThu, tongVung(dt, "tieuThu")),
      giaTB: ca.giaTB, donViGia: ca.donViGia, bdSoCap: ca.bdSoCap, bdThuCap: ca.bdThuCap, theoQuy, tyTrong,
      giaKhuVuc: (khu.length ? khu : d).filter((x) => x.giaTB != null || x.giaCao != null).slice(0, 6).map((x) => ({ kv: x.khuVuc || x.tinh, thap: x.giaThap, tb: x.giaTB, cao: x.giaCao })),
      duAn: (bang?.duAn ?? []).filter((x) => x.vung === vung.id && x.phanKhuc === pk && x.quy === quy),
      nguon: [...new Set(d.map((x) => x.nguon).filter(Boolean))],
    });
  }
  const nhanDinh: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(bang?.nhanDinh ?? {})) if (k.startsWith(vung.id + "|")) nhanDinh[k.slice(vung.id.length + 1)] = v;
  return {
    vung, quy, phanKhuc, tongCung: cong(phanKhuc.map((p) => p.nguonCung)), tongTieuThu: cong(phanKhuc.map((p) => p.tieuThu)),
    kinhTe: (bang?.kinhTe ?? []).filter((x) => x.vung === vung.id), chinhSach: (bang?.chinhSach ?? []).filter((x) => x.vung === vung.id),
    haTang: (bang?.haTang ?? []).filter((x) => x.vung === vung.id), duBao: (bang?.duBao ?? []).filter((x) => x.vung === vung.id),
    pdf: bang?.pdf?.[`${vung.id}|${quy}`], nhanDinh,
  };
}

// Câu nhận định VIẾT TỪ SỐ (anh duyệt / sửa ở Admin trước khi đăng) — chỉ nói điều số cho thấy, không bình luận cảm tính
const vn = (n: number, d = 1) => n.toLocaleString("vi-VN", { maximumFractionDigits: d });
const doi = (v?: number) => (v == null ? "" : v > 0 ? `tăng ${vn(Math.abs(v))}%` : v < 0 ? `giảm ${vn(Math.abs(v))}%` : "đi ngang");
export function nhanDinhTuSo(p: SoPhanKhuc): string[] {
  const ra: string[] = [];
  if (p.nguonCung != null) ra.push(`Nguồn cung sơ cấp đạt ${vn(p.nguonCung, 0)} ${p.donVi}${p.soDuAn ? ` từ ${vn(p.soDuAn, 0)} dự án` : ""}${p.doiCung != null ? `, ${doi(p.doiCung)} so với quý trước` : ""}.`);
  if (p.tieuThu != null) ra.push(`Tiêu thụ sơ cấp ${vn(p.tieuThu, 0)} ${p.donVi}${p.doiTieuThu != null ? `, ${doi(p.doiTieuThu)} so với quý trước` : ""}${p.tyLe != null ? `; tỷ lệ tiêu thụ ${vn(p.tyLe)}%` : ""}.`);
  if (p.tyTrong.length > 1) { const t = p.tyTrong.reduce((s, x) => s + x[1], 0); ra.push(`${p.tyTrong[0][0]} dẫn đầu nguồn cung với ${vn((p.tyTrong[0][1] / t) * 100, 0)}% tổng nguồn cung sơ cấp.`); }
  if (p.bdSoCap != null) ra.push(`Mặt bằng giá sơ cấp ${doi(p.bdSoCap)} so với quý trước${p.giaTB != null ? `, trung bình ${vn(p.giaTB)} ${p.donViGia}` : ""}.`);
  if (p.bdThuCap != null) ra.push(`Giá thứ cấp ${doi(p.bdThuCap)} so với quý trước.`);
  return ra;
}

// Điểm nhấn quý (đầu báo cáo) — đọc là nắm thị trường vùng
export function diemNhan(v: SoVung): string[] {
  const ra: string[] = [];
  const co = v.phanKhuc.filter((p) => p.nguonCung != null);
  if (v.tongCung != null) ra.push(`Tổng nguồn cung sơ cấp ${vn(v.tongCung, 0)} sản phẩm${v.tongTieuThu != null ? `, tiêu thụ ${vn(v.tongTieuThu, 0)} sản phẩm (${vn((v.tongTieuThu / v.tongCung) * 100)}%)` : ""}.`);
  const lon = [...co].sort((a, b) => (b.nguonCung ?? 0) - (a.nguonCung ?? 0))[0];
  if (lon && v.tongCung) ra.push(`${TEN_PHAN_KHUC[lon.phanKhuc].replace(/^Phân khúc /, "")} chiếm ${vn(((lon.nguonCung ?? 0) / v.tongCung) * 100, 0)}% nguồn cung, lớn nhất thị trường.`);
  const tt = [...v.phanKhuc].filter((p) => p.tyLe != null).sort((a, b) => (b.tyLe ?? 0) - (a.tyLe ?? 0))[0];
  if (tt) ra.push(`${TEN_PHAN_KHUC[tt.phanKhuc].replace(/^Phân khúc /, "")} có tỷ lệ tiêu thụ cao nhất, ${vn(tt.tyLe ?? 0)}%.`);
  for (const p of v.phanKhuc) if (p.bdSoCap != null && (p.phanKhuc === "Đất nền" || p.phanKhuc === "Căn hộ")) ra.push(`Giá sơ cấp ${p.phanKhuc.toLowerCase()} ${doi(p.bdSoCap)} so với quý trước.`);
  return ra.slice(0, 5);
}

// DỰ BÁO QUÝ TỚI — KHUNG CHUẨN VIẾT TỪ SỐ (anh 13/11/2026: "tôi tự ghi ra dựa vào số liệu Cowork lọc, hoặc cấu trúc luôn một khung theo số
// liệu đã có, có số liệu là đưa ra nhận định theo chuẩn"). Web viết bản nháp từ xu hướng 3 quý gần nhất + dự án sắp mở bán; anh sửa /
// ghi đè ở Admin (sheet DU-BAO hoặc ô Dự báo) — bản anh ghi luôn được dùng thay bản nháp.
export function duBaoTuSo(p: SoPhanKhuc, sapMoBan: DuAnMoBan[]): string[] {
  const ra: string[] = [];
  const q = p.theoQuy.slice(-3);
  const xu = (k: "nguonCung" | "tieuThu") => {
    const a = q.map((x) => x[k]).filter((x): x is number => x != null);
    if (a.length < 2) return null;
    const d = pt(a[a.length - 1], a[0]) ?? 0;
    return d > 5 ? "tăng" : d < -5 ? "giảm" : "đi ngang";
  };
  const moi = sapMoBan.reduce((s, x) => s + (x.moBanMoi ?? x.soDangChao ?? 0), 0);
  if (sapMoBan.length) ra.push(`Nguồn cung mới dự kiến khoảng ${vn(moi, 0)} ${p.donVi} từ ${sapMoBan.length} dự án đã công bố mở bán.`);
  else { const c = xu("nguonCung"); if (c) ra.push(`Nguồn cung sơ cấp ${c === "đi ngang" ? "dự kiến đi ngang" : `dự kiến tiếp tục ${c}`} theo xu hướng ${q.length} quý gần nhất.`); }
  const t = xu("tieuThu");
  if (t) ra.push(`Sức cầu ${t === "đi ngang" ? "dự kiến ổn định" : t === "tăng" ? "dự kiến tiếp tục cải thiện" : "dự kiến chưa phục hồi"}, theo xu hướng tiêu thụ ${q.length} quý gần nhất.`);
  if (p.bdSoCap != null) ra.push(`Mặt bằng giá sơ cấp ${Math.abs(p.bdSoCap) < 2 ? "dự kiến ít biến động" : p.bdSoCap > 0 ? "dự kiến giữ đà tăng" : "dự kiến còn điều chỉnh"}.`);
  return ra;
}

// Quý VỪA KẾT THÚC (báo cáo chỉ làm quý đã xong — anh 13/11/2026), dạng "2026-Q3" — dùng khi Admin chưa nạp bảng
export function quyVuaXong(d = new Date()): string {
  const q = Math.floor(d.getMonth() / 3);
  return q === 0 ? `${d.getFullYear() - 1}-Q4` : `${d.getFullYear()}-Q${q}`;
}
