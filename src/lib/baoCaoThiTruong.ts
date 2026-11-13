// ĐIỂM TIN THỊ TRƯỜNG COASTAL LAND (anh 13/11/2026) — báo cáo QUÝ ĐÃ KẾT THÚC, theo KHU VỰC, số THỊ TRƯỜNG SƠ CẤP (nguồn cung từ chủ
// đầu tư) như bản tin DKRA. Số KHÔNG lấy từ tin trên web: Cowork lọc từ cơ sở số liệu DKRA (thiếu mới lấy Sở Xây dựng, chủ đầu tư…)
// vào bảng mẫu `SEO\MAU\bao-cao-thi-truong\MAU-BAO-CAO-THI-TRUONG.xlsx` → Admin → Điểm tin thị trường nạp tệp → trang tự lên số + biểu đồ.
// Yêu cầu Cowork: `SEO\YEU-CAU-COWORK-BAO-CAO-THI-TRUONG.md`. Cột của bảng = trường của các kiểu dưới đây (đổi cột phải đổi cả hai).
// Bố cục 3 chương như DKRA: 01 Kinh tế – Xã hội (chỉ số kinh tế · chính sách – pháp lý · hạ tầng giao thông) · 02 Diễn biến thị trường
// (6 phân khúc) · 03 Dự báo thị trường quý tới.

export type VungBaoCao = { id: string; ten: string; nut: string; phu: string; tinh: string[] };
// 3 VÙNG (anh 13/11/2026). Tên tỉnh cũ của nguồn (Quảng Nam, Bình Định, Phú Yên, Bình Thuận…) cũng nhận về đúng vùng.
export const VUNG_BAO_CAO: VungBaoCao[] = [
  // 3 KHU VỰC GIỮ ĐÚNG TÊN ANH CHIA (tab + tiêu đề); SỐ LIỆU bên trong theo tỉnh thành mới (anh 13/11/2026) — tinh = tỉnh MỚI của khu vực
  { id: "da-nang", ten: "Đà Nẵng và phụ cận", nut: "Đà Nẵng", phu: "Huế · Quảng Trị · Quảng Ngãi", tinh: ["Đà Nẵng", "Huế", "Quảng Trị", "Quảng Ngãi"] },
  { id: "quy-nhon", ten: "Quy Nhơn – Gia Lai – Phú Yên", nut: "Quy Nhơn", phu: "Gia Lai · Phú Yên", tinh: ["Gia Lai", "Đắk Lắk"] },
  { id: "nha-trang", ten: "Nha Trang – Phan Thiết – Lâm Đồng", nut: "Nha Trang", phu: "Phan Thiết · Lâm Đồng", tinh: ["Khánh Hòa", "Lâm Đồng"] },
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
// "A", "hạng a", "Hạng A" → "Hạng A"; trống → undefined
export function hangChuan(s: string): string | undefined {
  const m = bo(s).match(/^(?:hang )?([abc])$/);
  return m ? `Hạng ${m[1].toUpperCase()}` : undefined;
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
  /** Hạng căn hộ "Hạng A" · "Hạng B" · "Hạng C" (chỉ Căn hộ). Trống = dòng tổng của phân khúc. */
  hang?: string;
  soDuAn?: number; nguonCung?: number; cungMoi?: number; tieuThu?: number; tyLe?: number;
  giaThap?: number; giaTB?: number; giaCao?: number; donViGia: string; bdSoCap?: number; bdThuCap?: number;
  /** % biến động nguồn cung / tiêu thụ ĐÚNG THEO NGUỒN (DKRA công bố) — có thì trang dùng số này thay số tự tính từ các quý (nguồn hay hiệu chỉnh số quý trước) */
  bdCung?: number; bdCungNam?: number; bdTieuThu?: number; bdTieuThuNam?: number;
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
    return { vung: v, tinh: tinhMoi(g("tinh")), khuVuc: g("khu_vuc"), phanKhuc: pk, quy: q, hang: hangChuan(g("hang")), soDuAn: so(g("so_du_an")), nguonCung: so(g("nguon_cung_so_cap")),
      cungMoi: so(g("nguon_cung_moi")), tieuThu: so(g("tieu_thu")), tyLe: so(g("ty_le_tieu_thu")), giaThap: so(g("gia_thap")), giaTB: so(g("gia_tb")),
      giaCao: so(g("gia_cao")), donViGia: g("don_vi_gia") || "triệu/m²", bdSoCap: so(g("bien_dong_so_cap")), bdThuCap: so(g("bien_dong_thu_cap")),
      bdCung: so(g("bien_dong_cung")), bdCungNam: so(g("bien_dong_cung_nam")), bdTieuThu: so(g("bien_dong_tieu_thu")), bdTieuThuNam: so(g("bien_dong_tieu_thu_nam")),
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
export type SoHang = { hang: string; nguonCung?: number; tieuThu?: number; tyLe?: number; giaTB?: number };
/** Giá THỨ CẤP lấy từ LỊCH SỬ GIÁ đã có trên web (cùng tỉnh của khu vực + loại hình, mua bán, cấp phường): mỗi phường một dãy. */
export type ThuCap = { kv: string; gia: number; thap?: number; cao?: number; doi?: number; doiNam?: number };
export type SoPhanKhuc = {
  phanKhuc: PhanKhuc; donVi: string; soDuAn?: number; nguonCung?: number; cungMoi?: number; tieuThu?: number; tyLe?: number;
  doiCung?: number; doiTieuThu?: number; giaTB?: number;
  /** So cùng kỳ năm trước (Y-o-Y) */
  doiCungNam?: number; doiTieuThuNam?: number; doiGiaNam?: number;
  theoHang: SoHang[]; thuCap: ThuCap[]; donViThuCap?: string; donViGia: string; bdSoCap?: number; bdThuCap?: number;
  theoQuy: SoQuy[]; tyTrong: [string, number][]; giaKhuVuc: { kv: string; thap?: number; tb?: number; cao?: number }[];
  duAn: DuAnMoBan[]; nguon: string[];
};
export type SoVung = {
  vung: VungBaoCao; quy: string; phanKhuc: SoPhanKhuc[]; tongCung?: number; tongTieuThu?: number; du: boolean;
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

// Phân khúc báo cáo ↔ loại hình của Lịch sử giá trên web (tên loại hình tin đăng, đã bỏ dấu)
const LOAI_LICH_SU: Record<PhanKhuc, string[]> = {
  "Đất nền": ["dat nen", "dat nen du an", "dat"], "Căn hộ": ["can ho", "chung cu"],
  "Nhà phố / Biệt thự": ["nha mat pho", "nha rieng", "biet thu lien ke", "biet thu", "nha pho"],
  "Biệt thự nghỉ dưỡng": ["villa biet thu bien"], "Shophouse nghỉ dưỡng": ["shophouse"], Condotel: ["condotel"],
};
// giá lưu theo ĐỒNG/m² (như Lịch sử giá) — báo cáo đổi ra triệu/m²
export type MocLichSu = { quy: string; giaM2: number; thap?: number; cao?: number };
export type DayLichSu = { tinh: string; khuVuc?: string; loaiHinh?: string; mucDich?: string; duAn?: string; duong?: string; moc: MocLichSu[] };
// Tháng "2026-08" → quý; mỗi quý lấy tháng muộn nhất (cùng cách veQuy của Lịch sử giá)
function mocTheoQuy(d: DayLichSu): Map<string, MocLichSu> {
  const m = new Map<string, MocLichSu & { _t: string }>();
  for (const x of d.moc) {
    if (!(x.giaM2 > 0)) continue;
    const t = x.quy.match(/^(\d{4})-(\d{2})$/), q = t ? `${t[1]}-Q${Math.ceil(Number(t[2]) / 3)}` : x.quy.toUpperCase();
    const cu = m.get(q);
    if (!cu || x.quy > cu._t) m.set(q, { ...x, quy: q, _t: x.quy });
  }
  return m;
}
const namTruoc = (q: string) => quyTruoc(quyTruoc(quyTruoc(quyTruoc(q))));

export function soLieuVung(vung: VungBaoCao, bang: BaoCaoNhap | null, quy: string, lichSu: DayLichSu[] = []): SoVung {
  // Dòng THEO HẠNG (Căn hộ hạng A/B/C) là dòng chi tiết — số tổng chỉ tính dòng không ghi hạng (không có dòng tổng thì cộng các hạng)
  const tatCa = (pk: PhanKhuc, q: string) => (bang?.thiTruong ?? []).filter((x) => x.vung === vung.id && x.phanKhuc === pk && x.quy === q);
  const cua = (pk: PhanKhuc, q: string) => { const d = tatCa(pk, q), t = d.filter((x) => !x.hang); return t.length ? t : d; };
  const phanKhuc: SoPhanKhuc[] = [];
  for (const pk of PHAN_KHUC) {
    const d = cua(pk, quy);
    if (!d.length) continue; // khu vực / phân khúc chưa đủ số → không hiện
    const dt = cua(pk, quyTruoc(quy)), dn = cua(pk, namTruoc(quy));
    const nguonCung = tongVung(d, "nguonCung"), tieuThu = tongVung(d, "tieuThu");
    const ca = d.find((x) => !x.khuVuc) ?? d[0];
    const caNam = dn.find((x) => !x.khuVuc) ?? dn[0];
    // Theo hạng (chỉ khi nguồn tách hạng)
    const dongHang = tatCa(pk, quy).filter((x) => x.hang);
    const theoHang: SoHang[] = [...new Set(dongHang.map((x) => x.hang!))].sort().map((h) => {
      const ds = dongHang.filter((x) => x.hang === h), c = tongVung(ds, "nguonCung"), t = tongVung(ds, "tieuThu"), g = ds.find((x) => !x.khuVuc) ?? ds[0];
      return { hang: h, nguonCung: c, tieuThu: t, tyLe: g.tyLe ?? (c && t != null ? (t / c) * 100 : undefined), giaTB: g.giaTB };
    });
    // Giá thứ cấp từ Lịch sử giá trên web: dãy mua bán cùng tỉnh của khu vực + loại hình của phân khúc, cấp phường (không lấy dãy dự án / đường)
    const loai = LOAI_LICH_SU[pk];
    const thuCap: ThuCap[] = lichSu
      .filter((x) => x.mucDich !== "thue" && !x.duAn && !x.duong && !!x.khuVuc && loai.includes(bo(x.loaiHinh ?? "")) && vung.tinh.some((t) => bo(t) === bo(tinhMoi(x.tinh))))
      .map((x): ThuCap | null => {
        const m = mocTheoQuy(x), n = m.get(quy);
        if (!n) return null;
        return { kv: x.khuVuc!, gia: n.giaM2 / 1e6, thap: n.thap && n.thap / 1e6, cao: n.cao && n.cao / 1e6, doi: pt(n.giaM2, m.get(quyTruoc(quy))?.giaM2), doiNam: pt(n.giaM2, m.get(namTruoc(quy))?.giaM2) };
      })
      .filter((x): x is ThuCap => !!x)
      // Một phường có nhiều dãy (vd Căn hộ + Chung cư) → gộp một dòng, lấy trung bình
      .reduce<ThuCap[][]>((g, x) => { const n = g.find((y) => bo(y[0].kv) === bo(x.kv)); if (n) n.push(x); else g.push([x]); return g; }, [])
      .map((ds) => { const tb = (k: "gia" | "thap" | "cao" | "doi" | "doiNam") => { const v = ds.map((x) => x[k]).filter((x): x is number => x != null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : undefined; };
        return { kv: ds[0].kv, gia: tb("gia")!, thap: tb("thap"), cao: tb("cao"), doi: tb("doi"), doiNam: tb("doiNam") }; })
      .sort((a, b) => b.gia - a.gia).slice(0, 6);
    const giua = (a: number[]) => { const z = [...a].sort((x, y) => x - y); return z.length ? z[Math.floor(z.length / 2)] : undefined; };
    let q = quy; const theoQuy: SoQuy[] = [];
    for (let i = 0; i < 5; i++) { const x = cua(pk, q); theoQuy.unshift({ quy: q, nguonCung: tongVung(x, "nguonCung"), tieuThu: tongVung(x, "tieuThu") }); q = quyTruoc(q); }
    while (theoQuy.length && theoQuy[0].nguonCung == null && theoQuy[0].tieuThu == null) theoQuy.shift(); // quý đầu chưa có số → không vẽ cột trống
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
      doiCung: ca.bdCung ?? pt(nguonCung, tongVung(dt, "nguonCung")), doiTieuThu: ca.bdTieuThu ?? pt(tieuThu, tongVung(dt, "tieuThu")),
      doiCungNam: ca.bdCungNam ?? pt(nguonCung, tongVung(dn, "nguonCung")), doiTieuThuNam: ca.bdTieuThuNam ?? pt(tieuThu, tongVung(dn, "tieuThu")), doiGiaNam: pt(ca.giaTB, caNam?.giaTB),
      theoHang, thuCap, donViThuCap: thuCap.length ? (pk === "Đất nền" ? "triệu/m² đất" : pk === "Căn hộ" || pk === "Condotel" ? "triệu/m² căn" : "triệu/m² sàn") : undefined,
      // Biến động giá thứ cấp: Cowork ghi theo nguồn thì dùng; trống → trung vị biến động các dãy Lịch sử giá trên web
      giaTB: ca.giaTB, donViGia: ca.donViGia, bdSoCap: ca.bdSoCap, bdThuCap: ca.bdThuCap ?? giua(thuCap.map((x) => x.doi).filter((x): x is number => x != null)), theoQuy, tyTrong,
      giaKhuVuc: (khu.length ? khu : d).filter((x) => x.giaTB != null || x.giaCao != null).slice(0, 6).map((x) => ({ kv: x.khuVuc || x.tinh, thap: x.giaThap, tb: x.giaTB, cao: x.giaCao })),
      duAn: (bang?.duAn ?? []).filter((x) => x.vung === vung.id && x.phanKhuc === pk && x.quy === quy),
      nguon: [...new Set(d.map((x) => x.nguon).filter(Boolean))],
    });
  }
  const nhanDinh: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(bang?.nhanDinh ?? {})) if (k.startsWith(vung.id + "|")) nhanDinh[k.slice(vung.id.length + 1)] = v;
  return {
    vung, quy, phanKhuc, tongCung: cong(phanKhuc.map((p) => p.nguonCung)), tongTieuThu: cong(phanKhuc.map((p) => p.tieuThu)),
    // KHU VỰC ĐỦ SỐ (anh 13/11/2026: "khu vực nào đủ thì hiển thị"): có nguồn cung + giá sơ cấp của Đất nền hoặc Căn hộ
    du: phanKhuc.some((p) => (p.phanKhuc === "Đất nền" || p.phanKhuc === "Căn hộ") && p.nguonCung != null && (p.giaTB != null || p.giaKhuVuc.length > 0)),
    kinhTe: (bang?.kinhTe ?? []).filter((x) => x.vung === vung.id), chinhSach: (bang?.chinhSach ?? []).filter((x) => x.vung === vung.id),
    haTang: (bang?.haTang ?? []).filter((x) => x.vung === vung.id), duBao: (bang?.duBao ?? []).filter((x) => x.vung === vung.id),
    pdf: bang?.pdf?.[`${vung.id}|${quy}`], nhanDinh,
  };
}

// NHẬN ĐỊNH THỊ TRƯỜNG — KHUNG CÂU CỐ ĐỊNH KIỂU DKRA (anh 13/11/2026: "nhận định những dòng cơ bản theo số liệu, theo câu chữ đã fix
// như DKRA"). Mỗi câu một khuôn, chỉ thay số; thiếu số nào thì bỏ câu đó. Anh sửa / ghi đè ở Admin trước khi đăng.
const vn = (n: number, d = 1) => n.toLocaleString("vi-VN", { maximumFractionDigits: d });
// Biến động: dưới 1% coi là "không có nhiều biến động" (cách DKRA ghi)
// Tăng từ 100% trở lên ghi "gấp N lần" (cách DKRA ghi, vd tiêu thụ gấp 12 lần quý trước)
const doi = (v?: number) => (v == null ? "" : Math.abs(v) < 1 ? "không có nhiều biến động" : v >= 100 ? `gấp ${vn(1 + v / 100, 1)} lần` : v > 0 ? `tăng khoảng ${vn(Math.abs(v), 0)}%` : `giảm khoảng ${vn(Math.abs(v), 0)}%`);
// Tỷ lệ dưới 1% giữ một số lẻ (0,6% — không làm tròn thành 1%)
const tl = (v: number) => vn(v, v < 1 ? 1 : 0);
export function nhanDinhTuSo(p: SoPhanKhuc): string[] {
  const ra: string[] = [];
  if (p.nguonCung != null)
    ra.push(`Nguồn cung sơ cấp ghi nhận ${vn(p.nguonCung, 0)} ${p.donVi}${p.soDuAn ? ` đến từ ${vn(p.soDuAn, 0)} dự án` : ""}${p.doiCung != null ? `, ${doi(p.doiCung)} so với quý trước` : ""}${p.doiCungNam != null ? ` và ${doi(p.doiCungNam)} so với cùng kỳ năm trước` : ""}${p.cungMoi != null && p.nguonCung ? `; nguồn cung mới chiếm khoảng ${vn((p.cungMoi / p.nguonCung) * 100, 0)}% tổng nguồn cung sơ cấp` : ""}.`);
  if (p.tieuThu === 0) ra.push("Không ghi nhận tiêu thụ sơ cấp trong quý.");
  else if (p.tieuThu != null)
    ra.push(`Lượng tiêu thụ đạt ${vn(p.tieuThu, 0)} ${p.donVi}${p.tyLe != null ? `, tương đương khoảng ${tl(p.tyLe)}% tổng nguồn cung sơ cấp` : ""}${p.doiTieuThu != null ? `, ${doi(p.doiTieuThu)} so với quý trước` : ""}${p.doiTieuThuNam != null ? ` và ${doi(p.doiTieuThuNam)} so với cùng kỳ năm trước` : ""}.`);
  const tongH = p.theoHang.reduce((s, x) => s + (x.nguonCung ?? 0), 0);
  const hl = [...p.theoHang].sort((a, b) => (b.nguonCung ?? 0) - (a.nguonCung ?? 0))[0];
  if (hl && tongH) ra.push(`Căn hộ ${hl.hang.replace("Hạng", "hạng")} chiếm tỷ trọng lớn nhất với khoảng ${vn(((hl.nguonCung ?? 0) / tongH) * 100, 0)}% nguồn cung sơ cấp${hl.giaTB != null ? `, giá bán trung bình khoảng ${vn(hl.giaTB)} ${p.donViGia}` : ""}.`);
  if (p.tyTrong.length > 1 && p.tyTrong[0][0] !== "Khu vực khác") { const t = p.tyTrong.reduce((s, x) => s + x[1], 0); ra.push(`${p.tyTrong[0][0]} dẫn đầu thị trường với tỷ trọng khoảng ${vn((p.tyTrong[0][1] / t) * 100, 0)}% tổng nguồn cung sơ cấp.`); }
  if (p.bdSoCap != null) ra.push(`Mặt bằng giá sơ cấp ${doi(p.bdSoCap)} so với quý trước${p.giaTB != null ? `, giá bán trung bình khoảng ${vn(p.giaTB)} ${p.donViGia}` : ""}.`);
  if (p.doiGiaNam != null) ra.push(`So với cùng kỳ năm trước, giá bán sơ cấp trung bình ${doi(p.doiGiaNam)}.`);
  if (p.bdThuCap != null) ra.push(`Mặt bằng giá thứ cấp ${doi(p.bdThuCap)} so với quý trước.`);
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

// ── MỘT LẦN LỌC, HAI CHỖ DÙNG (anh 13/11/2026: "Cowork lọc thì ra cả dữ liệu lịch sử giá và phần này") ─────────────────────
// Giá sơ cấp Cowork điền trong báo cáo (theo phường ở THI-TRUONG, theo dự án ở DU-AN-MO-BAN, đơn vị triệu/m²) đổi thành dòng
// đúng khuôn Lịch sử giá (cột của docBangChiSo ở src/lib/chiSoGia.ts) → Admin nạp báo cáo là Lịch sử giá được BỔ SUNG quý còn
// thiếu (không đè số đã có). Chỉ phân khúc tính được giá/m²: Đất nền (m² đất) · Căn hộ, Condotel (m² căn). Nhà phố, biệt thự,
// shophouse giá tỷ/căn → không đưa sang (Lịch sử giá nhà tính trên m² sàn).
const LOAI_SANG_LICH_SU: Partial<Record<PhanKhuc, [string, string]>> = { "Đất nền": ["Đất nền dự án", "dat"], "Căn hộ": ["Căn hộ", "can"], Condotel: ["Condotel", "can"] };
export const COT_LICH_SU = ["tinh", "khu_vuc", "loai_hinh", "muc_dich", "ky", "gia_m2_trieu", "nguon", "cap_nhat", "gia_thap_trieu", "gia_cao_trieu", "nguon_link", "mau_so", "du_an"];
export function bangLichSuTuBaoCao(bang: BaoCaoNhap): string[][] {
  const ra: string[][] = [COT_LICH_SU];
  const s = (n?: number) => (n == null ? "" : String(n).replace(".", ","));
  const theoM2 = (dv: string) => /m²|m2/i.test(dv) && !/tỷ|ty\b/i.test(dv);
  for (const x of bang.thiTruong) {
    const l = LOAI_SANG_LICH_SU[x.phanKhuc];
    if (!l || !x.khuVuc || x.hang || !theoM2(x.donViGia) || (x.giaTB == null && (x.giaThap == null || x.giaCao == null))) continue;
    ra.push([x.tinh, x.khuVuc, l[0], "ban", tenQuy(x.quy), s(x.giaTB), x.nguon || "Coastal Land", x.ngay ?? "", s(x.giaThap), s(x.giaCao), x.link ?? "", l[1], ""]);
  }
  for (const x of bang.duAn) {
    const l = LOAI_SANG_LICH_SU[x.phanKhuc];
    if (!l || !theoM2(x.donViGia) || (x.giaTB == null && (x.giaThap == null || x.giaCao == null))) continue;
    ra.push([x.tinh, x.khuVuc, l[0], "ban", tenQuy(x.quy), s(x.giaTB), x.nguon || "Coastal Land", x.ngay, s(x.giaThap), s(x.giaCao), x.link ?? "", l[1], x.ten]);
  }
  return ra;
}

// Toạ độ công trình hạ tầng (cột toa_do "16.05, 108.20") cho bản đồ; chỉ nhận toạ độ trong Việt Nam
export type DiemHaTang = { so: number; ten: string; lat: number; lng: number };
export function docToaDo(s: string): { lat: number; lng: number } | null {
  const m = String(s ?? "").match(/(-?\d+(?:\.\d+)?)\s*[,; ]\s*(-?\d+(?:\.\d+)?)/);
  if (!m) return null;
  const lat = Number(m[1]), lng = Number(m[2]);
  return lat > 5 && lat < 25 && lng > 100 && lng < 115 ? { lat, lng } : null;
}
