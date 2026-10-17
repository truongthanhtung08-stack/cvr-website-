import type { Listing } from "@/lib/data";
import { findCategory, nhomPseo, rentCategories, saleCategories, type Category } from "@/lib/categories";
import { khuVucList, slugKhuVuc, timKhuVuc, type KhuVuc } from "@/lib/khuVuc";
import { normalizeVi, type Filters } from "@/lib/filters";
import { newProvinceOf, phuongMoiCuaQuan } from "@/lib/locations";

// ============================================================================
// PROGRAMMATIC SEO — Template 1 "Dynamic Listing" (docs/PHAN-TICH-PSEO-2-FILE.md)
// ----------------------------------------------------------------------------
// Mỗi trang = MỘT điều kiện lọc cố định trên tin thật:
//   trục 1  /mua-ban/<loại>/<tỉnh> · /mua-ban/<loại>/<tỉnh>/<phường> · /mua-ban/<tỉnh>/<phường>
//   trục 3  /cho-thue/… (tin thuê đã tính theo tháng — không thêm đuôi /theo-thang)
//   trục 4  /ban-nha-duong-<đường>-<tỉnh>
//   trục 6  /phong-thuy/huong-<hướng>/<loại>/<tỉnh> · /phong-thuy/huong-<hướng>/<tỉnh>
//   trục 7  /mua-ban/<loại>/<tỉnh>/so-do-so-hong · …/hop-dong-mua-ban · /mua-ban/<tỉnh>/nha-kiet-hem
//   trục 10 /mua-ban/<loại>/<tỉnh>/gia-duoi-2-ty (khách gõ "dưới X tỷ")
//   thêm    /mua-ban/<loại>/<tỉnh>/2-phong-ngu (khách gõ "căn hộ 2 phòng ngủ")
//
// CỔNG CHẤT LƯỢNG (chủ dự án chốt theo hai file pSEO, 15/10/2026):
//   ≥ NGUONG_INDEX tin CÒN HẠN khớp → index + sitemap + được link nội bộ.
//   Ít hơn → trang vẫn mở cho khách nhưng noindex, không vào sitemap.
//   Trang con trùng hệt trang cha (cùng đúng bấy nhiêu tin) → noindex, không tạo hai URL cùng ý định.
// KHÔNG in số tin, không in ngưỡng ra giao diện (chốt 11/09/2026).
// ============================================================================

export const NGUONG_INDEX = 3;

export type Muc = "ban" | "thue";

export { thangHienTai } from "@/lib/thang";
import { thangHienTai } from "@/lib/thang";

export const tinhCuaTin = (l: Listing) => l.location.split(",").pop()?.trim() ?? "";
export const phuongCuaTin = (l: Listing) => {
  const p = l.location.split(",").map((s) => s.trim());
  return p.length >= 2 ? p[0] : "";
};
const mucCuaTin = (l: Listing): Muc => ((l.purpose ?? "ban") === "thue" ? "thue" : "ban");
const cungTen = (a: string, b: string) => normalizeVi(a) === normalizeVi(b);

export const HUONG = ["Đông", "Tây", "Nam", "Bắc", "Đông Bắc", "Đông Nam", "Tây Bắc", "Tây Nam"];

// boLoc = đúng mục pháp lý trong bộ lọc của web (legalOptions) để trang mở sẵn bộ lọc
export type PhapLy = { slug: string; nhan: string; boLoc: string; khop: (s: string) => boolean };
export const PHAP_LY: PhapLy[] = [
  { slug: "so-do-so-hong", nhan: "sổ đỏ, sổ hồng", boLoc: "Sổ đỏ / Sổ hồng", khop: (s) => /sổ\s*(đỏ|hồng)/i.test(s) },
  { slug: "hop-dong-mua-ban", nhan: "hợp đồng mua bán", boLoc: "Hợp đồng mua bán", khop: (s) => /hợp đồng mua bán/i.test(s) },
];

// Điều kiện trang → bộ lọc mở sẵn của ListingBrowser. Đường / kiệt không có ô lọc riêng → null
// (trang đó nhận đúng danh sách tin khớp thay vì bộ lọc).
export function boLocCua(dk: DieuKien): Partial<Filters> | null {
  if (dk.duong || dk.kiet) return null;
  return {
    locations: dk.thanhPho
      ? dk.thanhPho.phuong.map((ward) => ({ province: dk.tinh.name, ward }))
      : [dk.phuong ? { province: dk.tinh.name, ward: dk.phuong } : { province: dk.tinh.name }],
    ...(dk.cat ? { types: dk.cat.types } : {}),
    ...(dk.giaDuoi ? { priceMax: dk.giaDuoi.max / 1e9 } : {}),
    ...(dk.phongNgu ? { beds: dk.phongNgu } : {}),
    ...(dk.huong ? { direction: dk.huong } : {}),
    ...(dk.phapLy ? { legal: dk.phapLy.boLoc } : {}),
  };
}

export type GiaDuoi = { slug: string; nhan: string; max: number };
const GIA_DUOI: Record<Muc, GiaDuoi[]> = {
  ban: [1, 2, 3, 5, 10].map((t) => ({ slug: `gia-duoi-${t}-ty`, nhan: `dưới ${t} tỷ`, max: t * 1e9 })),
  thue: [3, 5, 10, 20].map((t) => ({ slug: `gia-duoi-${t}-trieu`, nhan: `dưới ${t} triệu`, max: t * 1e6 })),
};

// Trục số phòng ngủ chỉ có nghĩa với căn hộ và nhà riêng
const CO_PHONG_NGU = ["can-ho-chung-cu", "nha-rieng", "nha"];
// 1–4 phòng ngủ, khớp ĐÚNG số (cùng luật với bộ lọc phòng ngủ của web)
const phongNguSlug = (n: number) => `${n}-phong-ngu`;
const phongNguNhan = (n: number) => `${n} phòng ngủ`;

export const KIET_SLUG = "nha-kiet-hem";

// TRỤC THÀNH PHỐ (#5 kế hoạch SEO, 17/10/2026): người tìm gõ tên THÀNH PHỐ LỚN ("bán nhà Nha Trang"
// 185 cụm, "đất Đà Lạt" 167, "căn hộ Quy Nhơn" 147), tên này gần như không đổi dù địa giới đổi
// (chủ dự án 17/10/2026: "lấy tên thành phố lớn làm từ khoá chính, bấm vào thì ra theo đơn vị hành
// chính mới/cũ"). Thành phố = thành phố thuộc tỉnh CŨ; tin khớp = mọi phường MỚI đã nhận đất của
// thành phố đó, theo BẢNG SÁP NHẬP CHÍNH THỨC (phuongMoiCuaQuan) — không dò theo tên, không đoán.
// Thêm thành phố: thêm một dòng { name, tinhCu }. Tên thành phố trùng tên tỉnh (Quảng Ngãi, Kon Tum…)
// không thêm — trang tỉnh đã mang đúng tên đó.
export type ThanhPho = { slug: string; name: string; tinh: string; phuong: string[] };
export const THANH_PHO: ThanhPho[] = [
  { name: "Nha Trang", tinhCu: "Khánh Hòa" },
  { name: "Cam Ranh", tinhCu: "Khánh Hòa" },
  { name: "Phan Rang - Tháp Chàm", tinhCu: "Ninh Thuận" },
  { name: "Đà Lạt", tinhCu: "Lâm Đồng" },
  { name: "Bảo Lộc", tinhCu: "Lâm Đồng" },
  { name: "Phan Thiết", tinhCu: "Bình Thuận" },
  { name: "Gia Nghĩa", tinhCu: "Đắk Nông" },
  { name: "Quy Nhơn", tinhCu: "Bình Định" },
  { name: "Pleiku", tinhCu: "Gia Lai" },
  { name: "Buôn Ma Thuột", tinhCu: "Đắk Lắk" },
  { name: "Tuy Hòa", tinhCu: "Phú Yên" },
  { name: "Hội An", tinhCu: "Quảng Nam" },
  { name: "Tam Kỳ", tinhCu: "Quảng Nam" },
  { name: "Đông Hà", tinhCu: "Quảng Trị" },
  { name: "Đồng Hới", tinhCu: "Quảng Bình" },
  { name: "Vinh", tinhCu: "Nghệ An" },
  { name: "Vũng Tàu", tinhCu: "Bà Rịa - Vũng Tàu" },
  { name: "Thủ Dầu Một", tinhCu: "Bình Dương" },
  { name: "Dĩ An", tinhCu: "Bình Dương" },
  { name: "Thuận An", tinhCu: "Bình Dương" },
  { name: "Biên Hòa", tinhCu: "Đồng Nai" },
  { name: "Thủ Đức", tinhCu: "Hồ Chí Minh" },
  { name: "Hạ Long", tinhCu: "Quảng Ninh" },
  { name: "Phú Quốc", tinhCu: "Kiên Giang" },
]
  .map(({ name, tinhCu }) => ({ name, slug: slugKhuVuc(name), tinh: newProvinceOf(tinhCu), phuong: phuongMoiCuaQuan(tinhCu, name) }))
  .filter((t) => t.phuong.length > 0);
const thanhPhoCuaPhuong = (tinh: string, phuong: string) =>
  THANH_PHO.find((t) => cungTen(t.tinh, tinh) && t.phuong.some((p) => cungTen(p, phuong)));
const timThanhPho = (tinh: KhuVuc, slug: string) => THANH_PHO.find((t) => t.slug === slug && cungTen(t.tinh, tinh.name));

export type DieuKien = {
  muc: Muc;
  tinh: KhuVuc;
  cat?: Category;
  phuong?: string;
  duong?: string;
  huong?: string;
  phapLy?: PhapLy;
  kiet?: boolean;
  phongNgu?: number;
  giaDuoi?: GiaDuoi;
  thanhPho?: ThanhPho;
};

// Danh mục menu + nhóm "Nhà" chỉ dùng cho trang pSEO
const danhMuc = (muc: Muc) => [...(muc === "thue" ? rentCategories : saleCategories), ...nhomPseo(muc)];
const tuKhoa = (c: Category) => c.tuKhoa ?? c.h1;
const goc = (muc: Muc) => (muc === "thue" ? "/cho-thue" : "/mua-ban");

export function khop(l: Listing, dk: DieuKien): boolean {
  if (mucCuaTin(l) !== dk.muc) return false;
  if (!cungTen(tinhCuaTin(l), dk.tinh.name)) return false;
  if (dk.cat && !dk.cat.types.includes(l.type)) return false;
  if (dk.phuong && !cungTen(phuongCuaTin(l), dk.phuong)) return false;
  if (dk.thanhPho && !dk.thanhPho.phuong.some((p) => cungTen(p, phuongCuaTin(l)))) return false;
  if (dk.duong && !(l.duong && cungTen(l.duong, dk.duong))) return false;
  if (dk.huong && !(l.huong && cungTen(l.huong, dk.huong))) return false;
  if (dk.phapLy && !(l.phapLy && dk.phapLy.khop(l.phapLy))) return false;
  if (dk.kiet && l.viTri !== "kiet") return false;
  if (dk.phongNgu && l.beds !== dk.phongNgu) return false;
  if (dk.giaDuoi && !(l.priceVnd != null && l.priceVnd > 0 && l.priceVnd <= dk.giaDuoi.max)) return false;
  return true;
}

export function duongDan(dk: DieuKien): string {
  if (dk.duong) return `/ban-nha-duong-${slugKhuVuc(dk.duong)}-${dk.tinh.slug}`;
  if (dk.huong) return `/phong-thuy/huong-${slugKhuVuc(dk.huong)}/${dk.cat ? `${dk.cat.slug}/` : ""}${dk.tinh.slug}`;
  const g = goc(dk.muc);
  if (dk.cat) {
    if (dk.thanhPho) return `${g}/${dk.cat.slug}/${dk.tinh.slug}/${dk.thanhPho.slug}`;
    const duoi = dk.phuong
      ? slugKhuVuc(dk.phuong)
      : dk.giaDuoi?.slug ?? dk.phapLy?.slug ?? (dk.phongNgu ? phongNguSlug(dk.phongNgu) : "");
    return `${g}/${dk.cat.slug}/${dk.tinh.slug}${duoi ? `/${duoi}` : ""}`;
  }
  if (dk.kiet) return `${g}/${dk.tinh.slug}/${KIET_SLUG}`;
  if (dk.thanhPho) return `${g}/${dk.tinh.slug}/${dk.thanhPho.slug}`;
  return `${g}/${dk.tinh.slug}${dk.phuong ? `/${slugKhuVuc(dk.phuong)}` : ""}`;
}

// Tiêu đề (không kèm tháng) — dùng làm H1 + <title> (nối thêm thangHienTai()).
export function tieuDe(dk: DieuKien): string {
  const noi = dk.thanhPho ? `${dk.thanhPho.name}, ${dk.tinh.name}` : dk.phuong ? `${dk.phuong}, ${dk.tinh.name}` : dk.tinh.name;
  if (dk.duong) return `Bán nhà đất đường ${dk.duong}, ${dk.tinh.name}`;
  if (dk.huong) return dk.cat ? `${tuKhoa(dk.cat)} hướng ${dk.huong} ${noi}` : `Bán nhà đất hướng ${dk.huong} ${noi}`;
  if (dk.cat) {
    return [
      tuKhoa(dk.cat),
      dk.phongNgu ? phongNguNhan(dk.phongNgu) : "",
      noi,
      dk.giaDuoi ? dk.giaDuoi.nhan : "",
      dk.phapLy ? `có ${dk.phapLy.nhan}` : "",
    ].filter(Boolean).join(" ");
  }
  if (dk.kiet) return `Bán nhà kiệt, hẻm ${noi}`;
  return dk.muc === "thue" ? `Cho thuê nhà đất ${noi}` : `Bán nhà đất ${noi}`;
}

export function moTa(dk: DieuKien): string {
  return `${tieuDe(dk)} — tin mới ${thangHienTai()}: giá, diện tích, vị trí, ảnh thật, liên hệ trực tiếp người đăng.`;
}

export type Crumb = { name: string; href: string };
export function duongDanPhanCap(dk: DieuKien): Crumb[] {
  const g = goc(dk.muc);
  const c: Crumb[] = [
    { name: dk.muc === "thue" ? "Nhà đất cho thuê" : "Nhà đất bán", href: g },
    { name: dk.tinh.name, href: `${g}/${dk.tinh.slug}` },
  ];
  if (dk.cat) c.push({ name: dk.cat.label, href: duongDan({ muc: dk.muc, tinh: dk.tinh, cat: dk.cat }) });
  const cuoi = dk.thanhPho?.name ?? dk.phuong ?? (dk.duong ? `Đường ${dk.duong}` : dk.huong ? `Hướng ${dk.huong}` : dk.giaDuoi ? viHoa(dk.giaDuoi.nhan)
    : dk.phapLy ? viHoa(dk.phapLy.nhan) : dk.phongNgu ? viHoa(phongNguNhan(dk.phongNgu)) : dk.kiet ? "Nhà kiệt, hẻm" : "");
  if (cuoi) c.push({ name: cuoi, href: duongDan(dk) });
  return c;
}
const viHoa = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// Trang CHA — để chặn trang con trùng hệt trang cha
export function cha(dk: DieuKien): DieuKien | null {
  const { muc, tinh, cat } = dk;
  if (dk.duong || dk.kiet) return { muc, tinh };
  if (dk.huong) return cat ? { muc, tinh, cat } : { muc, tinh };
  if (cat && (dk.phuong || dk.thanhPho || dk.giaDuoi || dk.phapLy || dk.phongNgu)) return { muc, tinh, cat };
  if (dk.phuong || dk.thanhPho || cat) return { muc, tinh };
  return null;
}

// ── GIẢI MÃ ĐƯỜNG DẪN → ĐIỀU KIỆN ───────────────────────────────────────────
// `tin` = tin còn hạn + hết hạn: tên phường/đường lấy từ chính dữ liệu, không có thì null (→ 404).
function timPhuong(tin: Listing[], tinh: KhuVuc, slug: string): string | null {
  for (const l of tin) {
    if (!cungTen(tinhCuaTin(l), tinh.name)) continue;
    const p = phuongCuaTin(l);
    if (p && slugKhuVuc(p) === slug) return p;
  }
  return null;
}

export function giaiMaDanhSach(muc: Muc, loai: string, rest: string[], tin: Listing[]): DieuKien | null {
  const cat = findCategory(danhMuc(muc), loai);
  if (cat) {
    if (rest.length < 1 || rest.length > 2) return null;
    const tinh = timKhuVuc(rest[0]);
    if (!tinh) return null;
    if (rest.length === 1) return { muc, tinh, cat };
    const s = rest[1];
    const gia = GIA_DUOI[muc].find((g) => g.slug === s);
    if (gia) return { muc, tinh, cat, giaDuoi: gia };
    const pl = muc === "ban" ? PHAP_LY.find((p) => p.slug === s) : undefined;
    if (pl) return { muc, tinh, cat, phapLy: pl };
    if (CO_PHONG_NGU.includes(cat.slug)) {
      for (const n of [1, 2, 3, 4]) if (phongNguSlug(n) === s) return { muc, tinh, cat, phongNgu: n };
    }
    const tp = timThanhPho(tinh, s);
    if (tp) return { muc, tinh, cat, thanhPho: tp };
    const phuong = timPhuong(tin, tinh, s);
    return phuong ? { muc, tinh, cat, phuong } : null;
  }
  const tinh = timKhuVuc(loai);
  if (!tinh || rest.length !== 1) return null;
  if (muc === "ban" && rest[0] === KIET_SLUG) return { muc, tinh, kiet: true };
  const tp = timThanhPho(tinh, rest[0]);
  if (tp) return { muc, tinh, thanhPho: tp };
  const phuong = timPhuong(tin, tinh, rest[0]);
  return phuong ? { muc, tinh, phuong } : null;
}

// /ban-nha-duong-<đường>-<tỉnh>
export function giaiMaDuong(slug: string, tin: Listing[]): DieuKien | null {
  if (!slug.startsWith("ban-nha-duong-")) return null;
  const phan = slug.slice("ban-nha-duong-".length);
  const tinh = khuVucList
    .filter((k) => phan.endsWith(`-${k.slug}`))
    .sort((a, b) => b.slug.length - a.slug.length)[0];
  if (!tinh) return null;
  const sDuong = phan.slice(0, -(tinh.slug.length + 1));
  const l = tin.find((x) => x.duong && slugKhuVuc(x.duong) === sDuong && cungTen(tinhCuaTin(x), tinh.name));
  return l?.duong ? { muc: "ban", tinh, duong: l.duong } : null;
}

// /phong-thuy/huong-<hướng>/<loại>/<tỉnh> · /phong-thuy/huong-<hướng>/<tỉnh>
export function giaiMaHuong(huongSlug: string, rest: string[]): DieuKien | null {
  const huong = HUONG.find((h) => `huong-${slugKhuVuc(h)}` === huongSlug);
  if (!huong) return null;
  if (rest.length === 1) {
    const tinh = timKhuVuc(rest[0]);
    return tinh ? { muc: "ban", tinh, huong } : null;
  }
  if (rest.length === 2) {
    const cat = findCategory(danhMuc("ban"), rest[0]);
    const tinh = timKhuVuc(rest[1]);
    return cat && tinh ? { muc: "ban", tinh, cat, huong } : null;
  }
  return null;
}

// ── LIỆT KÊ MỌI TRANG CÓ TIN (cho sitemap, liên kết nội bộ, dựng sẵn) ───────
export type TrangPseo = { dk: DieuKien; path: string; n: number; moiNhat: number; index: boolean; ids: Set<string> };

function cacDieuKienCuaTin(l: Listing): DieuKien[] {
  const muc = mucCuaTin(l);
  const tinh = khuVucList.find((k) => cungTen(k.name, tinhCuaTin(l)));
  if (!tinh) return [];
  const phuong = phuongCuaTin(l) || undefined;
  const ds: DieuKien[] = [{ muc, tinh }];
  if (phuong) ds.push({ muc, tinh, phuong });
  const thanhPho = phuong ? thanhPhoCuaPhuong(tinh.name, phuong) : undefined;
  if (thanhPho) ds.push({ muc, tinh, thanhPho });
  if (muc === "ban") {
    if (l.viTri === "kiet") ds.push({ muc, tinh, kiet: true });
    if (l.duong) ds.push({ muc, tinh, duong: l.duong });
    const huong = l.huong && HUONG.find((h) => cungTen(h, l.huong!));
    if (huong) ds.push({ muc, tinh, huong });
    for (const cat of danhMuc("ban").filter((c) => c.types.includes(l.type))) {
      if (huong) ds.push({ muc, tinh, cat, huong });
      const pl = l.phapLy && PHAP_LY.find((p) => p.khop(l.phapLy!));
      if (pl) ds.push({ muc, tinh, cat, phapLy: pl });
    }
  }
  for (const cat of danhMuc(muc).filter((c) => c.types.includes(l.type))) {
    ds.push({ muc, tinh, cat });
    if (phuong) ds.push({ muc, tinh, cat, phuong });
    if (thanhPho) ds.push({ muc, tinh, cat, thanhPho });
    for (const g of GIA_DUOI[muc]) if (l.priceVnd != null && l.priceVnd > 0 && l.priceVnd <= g.max) ds.push({ muc, tinh, cat, giaDuoi: g });
    if (CO_PHONG_NGU.includes(cat.slug) && l.beds && l.beds <= 4) ds.push({ muc, tinh, cat, phongNgu: l.beds });
  }
  return ds;
}

// TIN ĐẠT CHUẨN mới được tính vào cổng index (chủ dự án 15/10/2026: "không đạt thì không index";
// Google phạt nội dung rác, ảnh kém, trùng lặp): ≥ 3 ảnh thật + mô tả ≥ 100 ký tự. Tin chưa đạt vẫn
// hiện bình thường trong danh sách cho khách — chỉ không làm căn cứ để mở trang cho Google.
export const tinDatChuan = (l: Listing) => (l.imageCount ?? 0) >= 3 && (l.desc?.trim().length ?? 0) >= 100;

// TIN TRÙNG (đo 15/10/2026: 6 cặp đăng lặp) — cùng mô tả hoặc cùng tiêu đề + giá với một tin đăng
// TRƯỚC → trả về tin gốc. Bản sau trỏ canonical về bản gốc + không vào sitemap (MASTER mục 11);
// gỡ hẳn bản trùng là việc của admin/Cowork.
const chuanTrung = (s?: string) => normalizeVi(s ?? "").replace(/[^a-z0-9]+/g, " ").trim();
// Khoá so trùng của mỗi tin — tính MỘT lần (build dựng hàng trăm trang, mỗi trang so hàng trăm cặp;
// chuẩn hoá chữ lặp lại từng cặp từng làm trang dựng quá 60 giây — tốn Build CPU Vercel, 16/10/2026).
type KhoaTrung = { moTa: string; tieuDeGia: string; bds: string; t: number };
const khoaCache = new WeakMap<Listing, KhoaTrung>();
function khoaTrung(l: Listing): KhoaTrung {
  let k = khoaCache.get(l);
  if (!k) {
    k = {
      moTa: chuanTrung(l.desc).slice(0, 400),
      tieuDeGia: chuanTrung(l.title) + "|" + l.price,
      bds: l.maNguoi ? [l.maNguoi, l.type, l.priceVnd, l.areaM2, chuanTrung(phuongCuaTin(l))].join("|") : "",
      t: new Date(l.postedAt ?? 0).getTime(),
    };
    khoaCache.set(l, k);
  }
  return k;
}

export function banGocCua(l: Listing, tatCa: Listing[]): Listing | null {
  // Tình trạng hết hạn lấy theo danh sách đầy đủ (getListing một tin không gắn cờ hetHan)
  const hetHanL = (tatCa.find((x) => x.id === l.id) ?? l).hetHan;
  const kl = khoaTrung(l);
  for (const x of tatCa) {
    if (x.id === l.id) continue;
    const kx = khoaTrung(x);
    const trung = (kl.moTa.length >= 80 && kx.moTa === kl.moTa) || kx.tieuDeGia === kl.tieuDeGia || (!!kl.bds && kx.bds === kl.bds);
    if (!trung) continue;
    // Bản gốc: tin CÒN HẠN thắng tin hết hạn; cùng tình trạng thì tin đăng trước
    if (!!x.hetHan !== !!hetHanL) { if (!x.hetHan) return x; continue; }
    if (kx.t < kl.t || (kx.t === kl.t && x.id < l.id)) return x;
  }
  return null;
}

// tinConHan: chỉ tin còn hạn (getListings). Trả cả trang tỉnh gốc /mua-ban/<tỉnh> để làm mốc trang cha.
// Cùng một bộ tin (cùng mã + mốc đẩy) → dùng lại kết quả: một trang gọi hàm này nhiều lần
// (metadata, liên kết nội bộ, dựng sẵn), build gọi hàng trăm lần.
let nhoTrang: { khoa: string; kq: Map<string, TrangPseo> } | null = null;
export function tatCaTrang(tinConHan: Listing[]): Map<string, TrangPseo> {
  const khoa = tinConHan.map((l) => l.id + (l.bumpedAt ?? "")).join(",");
  if (nhoTrang?.khoa === khoa) return nhoTrang.kq;
  const m = tinhTatCaTrang(tinConHan);
  nhoTrang = { khoa, kq: m };
  return m;
}

function tinhTatCaTrang(tinConHan: Listing[]): Map<string, TrangPseo> {
  const m = new Map<string, TrangPseo>();
  for (const l of tinConHan) {
    if (l.banSao || !tinDatChuan(l) || banGocCua(l, tinConHan)) continue;
    const t = new Date(l.bumpedAt ?? l.postedAt ?? 0).getTime() || 0;
    for (const dk of cacDieuKienCuaTin(l)) {
      const path = duongDan(dk);
      const cu = m.get(path);
      if (cu) { cu.n++; cu.moiNhat = Math.max(cu.moiNhat, t); cu.ids.add(l.id); }
      else m.set(path, { dk, path, n: 1, moiNhat: t, index: false, ids: new Set([l.id]) });
    }
  }
  // CỔNG CHỐNG "SCALED CONTENT ABUSE" (Google, hướng dẫn AI Search 15/05/2026: tạo trang riêng cho
  // mọi biến thể truy vấn là vi phạm). Một trang con chỉ được index khi:
  //   ① ≥ NGUONG_INDEX tin còn hạn; ② KHÁC RÕ trang cha (≤ 80% số tin của cha);
  //   ③ không trùng ≥ 80% với trang anh em đã chọn (vd "dưới 3 tỷ" ≈ "dưới 5 tỷ" → giữ một);
  //   ④ không thuộc trục hướng nhà (gần như không ai tìm — 1/1.933 từ khoá gợi ý).
  // Trang tỉnh gốc (không cha) do route cũ lo — ở đây chỉ dùng làm mốc.
  const theoCha = new Map<string, TrangPseo[]>();
  for (const p of m.values()) {
    const c = cha(p.dk);
    if (!c || p.dk.huong || p.n < NGUONG_INDEX) continue;
    const pathCha = duongDan(c);
    const nCha = m.get(pathCha)?.n ?? 0;
    // Trang thành phố: người tìm gõ tên thành phố, không gõ tên tỉnh → giữ dù gần trùng trang tỉnh
    if (p.n > 0.8 * nCha && !p.dk.thanhPho) continue;
    (theoCha.get(pathCha) ?? theoCha.set(pathCha, []).get(pathCha)!).push(p);
  }
  const giong = (a: Set<string>, b: Set<string>) => {
    let chung = 0;
    for (const x of a) if (b.has(x)) chung++;
    return chung / (a.size + b.size - chung) >= 0.8;
  };
  for (const ds of theoCha.values()) {
    const chon: TrangPseo[] = [];
    // Cụ thể trước (ít tin hơn) — trang rộng hơn chỉ được giữ khi khác rõ các trang đã chọn
    for (const p of ds.sort((a, b) => a.n - b.n)) {
      if (chon.some((q) => giong(p.ids, q.ids))) continue;
      p.index = true;
      chon.push(p);
    }
  }
  // ⑤ TRÙNG GIỮA CÁC NHÁNH: hai danh mục bao nhau (vd "Đất" ⊃ "Đất nền dự án") cho ra cùng
  // một danh sách ở cùng tỉnh → chỉ giữ một trang (trang có nhiều tin hơn; bằng nhau thì danh
  // mục rộng hơn — "Bán đất…" là cụm nhiều người tìm hơn).
  const daIndex = [...m.values()]
    .filter((p) => p.index)
    .sort((a, b) => b.n - a.n || Number(!!b.dk.thanhPho) - Number(!!a.dk.thanhPho) || (b.dk.cat?.types.length ?? 0) - (a.dk.cat?.types.length ?? 0));
  const giu: TrangPseo[] = [];
  for (const p of daIndex) {
    if (giu.some((q) => q.dk.muc === p.dk.muc && q.dk.tinh.slug === p.dk.tinh.slug && giong(p.ids, q.ids))) p.index = false;
    else giu.push(p);
  }
  return m;
}

// Trang được Google lập chỉ mục — chỉ trang pSEO (bỏ trang tỉnh gốc)
export function trangIndex(tinConHan: Listing[]): TrangPseo[] {
  return [...tatCaTrang(tinConHan).values()].filter((p) => p.index);
}

// ── KHỐI LIÊN KẾT NỘI BỘ ─────────────────────────────────────────────────────
export type NhomLienKet = { tieuDe: string; links: { href: string; nhan: string; day?: string }[] }; // day: tên ĐẦY ĐỦ trang đích (khối kiểu Google)

export function lienKetCho(dk: DieuKien, tinConHan: Listing[]): NhomLienKet[] {
  const ds = trangIndex(tinConHan).filter((p) => p.dk.muc === dk.muc);
  const hien = duongDan(dk);
  const cungTinh = (p: TrangPseo) => p.dk.tinh.slug === dk.tinh.slug && p.path !== hien;
  const laLoai = (p: TrangPseo, cat?: Category) => (cat ? p.dk.cat?.slug === cat.slug : !p.dk.cat);
  const chiCo = (p: TrangPseo, k: keyof DieuKien) =>
    (["phuong", "duong", "huong", "phapLy", "kiet", "phongNgu", "giaDuoi", "thanhPho"] as (keyof DieuKien)[]).every((x) => (x === k ? p.dk[x] != null : p.dk[x] == null));
  const nhom: NhomLienKet[] = [];
  const them = (tenNhom: string, ps: TrangPseo[], nhan: (p: TrangPseo) => string) => {
    const links = ps.sort((a, b) => b.n - a.n).slice(0, tenNhom === "Tìm kiếm theo từ khoá" ? 12 : 24).map((p) => ({ href: p.path, nhan: nhan(p), day: tieuDe(p.dk) }));
    if (links.length) nhom.push({ tieuDe: tenNhom, links });
  };
  // KHỐI "TÌM KIẾM THEO TỪ KHOÁ" (học Batdongsan, 15/10/2026): chữ trên link chính là từ khoá dài
  // người tìm gõ — "Bán nhà riêng Đà Nẵng dưới 5 tỷ". Ưu tiên trang cùng loại hình với trang đang xem.
  them(
    "Tìm kiếm theo từ khoá",
    ds.filter((p) => cungTinh(p) && (!dk.cat || p.dk.cat?.slug === dk.cat.slug) && (p.dk.cat || p.dk.phuong || p.dk.duong || p.dk.kiet || p.dk.thanhPho)),
    (p) => tieuDe(p.dk),
  );
  them("Theo loại hình", ds.filter((p) => cungTinh(p) && p.dk.cat && !p.dk.phuong && !p.dk.thanhPho && !p.dk.giaDuoi && !p.dk.phapLy && !p.dk.phongNgu && !p.dk.huong), (p) => tieuDe(p.dk));
  them("Theo thành phố", ds.filter((p) => cungTinh(p) && laLoai(p, dk.cat) && chiCo(p, "thanhPho")), (p) => tieuDe(p.dk));
  them("Theo phường, xã", ds.filter((p) => cungTinh(p) && laLoai(p, dk.cat) && chiCo(p, "phuong")), (p) => p.dk.phuong!);
  if (dk.cat) {
    them("Theo mức giá", ds.filter((p) => cungTinh(p) && laLoai(p, dk.cat) && chiCo(p, "giaDuoi")), (p) => viHoa(p.dk.giaDuoi!.nhan));
    them("Theo số phòng ngủ", ds.filter((p) => cungTinh(p) && laLoai(p, dk.cat) && chiCo(p, "phongNgu")), (p) => viHoa(phongNguNhan(p.dk.phongNgu!)));
    them("Theo pháp lý", ds.filter((p) => cungTinh(p) && laLoai(p, dk.cat) && chiCo(p, "phapLy")), (p) => viHoa(p.dk.phapLy!.nhan));
  }
  them("Theo đường", ds.filter((p) => cungTinh(p) && chiCo(p, "duong")), (p) => `Đường ${p.dk.duong}`);
  them("Theo hướng nhà", ds.filter((p) => cungTinh(p) && laLoai(p, dk.cat) && chiCo(p, "huong")), (p) => `Hướng ${p.dk.huong}`);
  them("Nhà kiệt, hẻm", ds.filter((p) => cungTinh(p) && chiCo(p, "kiet")), () => `Nhà kiệt, hẻm ${dk.tinh.name}`);
  if (dk.cat) {
    them("Tỉnh, thành khác", ds.filter((p) => p.dk.tinh.slug !== dk.tinh.slug && laLoai(p, dk.cat) && !p.dk.phuong && !p.dk.thanhPho && !p.dk.giaDuoi && !p.dk.phapLy && !p.dk.phongNgu && !p.dk.huong), (p) => p.dk.tinh.name);
  }
  return nhom;
}

// Liên kết từ trang LOẠI HÌNH gốc (/mua-ban/nha-rieng) xuống các tỉnh
export function lienKetLoaiHinh(muc: Muc, cat: Category, tinConHan: Listing[]): NhomLienKet[] {
  const ds = trangIndex(tinConHan).filter((p) => p.dk.muc === muc && p.dk.cat?.slug === cat.slug && !p.dk.phuong && !p.dk.thanhPho && !p.dk.giaDuoi && !p.dk.phapLy && !p.dk.phongNgu && !p.dk.huong);
  const links = ds.sort((a, b) => b.n - a.n).map((p) => ({ href: p.path, nhan: tieuDe(p.dk) }));
  return links.length ? [{ tieuDe: "Theo tỉnh, thành", links }] : [];
}

// ── KHỐI SỐ LIỆU DƯỚI H1 (template 1 "Quick stats"; chủ dự án duyệt nguyên văn 16/10/2026) ──
// "Giá rao: 2,1 – 6,5 tỷ · Diện tích: 60 – 120 m² · Cập nhật 10/2026" — tính từ chính các tin
// đang hiện trên trang nên mỗi trang một số liệu riêng (khung chung, nội dung khác nhau).
// KHÔNG in số tin (chốt 11/09). Thiếu số liệu thì bỏ phần đó; không có gì thì trả "".
const soVi = (n: number) => (Math.round(n * 10) / 10).toLocaleString("vi-VN", { maximumFractionDigits: 1 });
const giaNgan = (vnd: number) => (vnd >= 1e9 ? `${soVi(vnd / 1e9)} tỷ` : `${soVi(vnd / 1e6)} triệu`);
function khoang(min: number, max: number, dinhDang: (n: number) => string): string {
  const a = dinhDang(min), b = dinhDang(max);
  if (a === b) return a;
  // "2,1 – 6,5 tỷ": cùng đơn vị thì chỉ ghi đơn vị một lần
  const da = a.split(" "), db = b.split(" ");
  return da.length === 2 && db.length === 2 && da[1] === db[1] ? `${da[0]} – ${b}` : `${a} – ${b}`;
}
export function soLieuTrang(tin: Listing[], muc: Muc): string {
  const thue = muc === "thue";
  const gia = tin.map((l) => l.priceVnd ?? 0).filter((v) => v > 0);
  const dt = tin.map((l) => l.areaM2 ?? 0).filter((v) => v > 0);
  const moiNhat = Math.max(0, ...tin.map((l) => new Date(l.bumpedAt ?? l.postedAt ?? 0).getTime() || 0));
  const phan: string[] = [];
  if (gia.length) phan.push(`${thue ? "Giá thuê" : "Giá rao"}: ${khoang(Math.min(...gia), Math.max(...gia), giaNgan)}${thue ? "/tháng" : ""}`);
  if (dt.length) phan.push(`Diện tích: ${khoang(Math.min(...dt), Math.max(...dt), (n) => `${soVi(n)} m²`)}`);
  // Chỉ tháng/năm (chủ dự án 17/10/2026: "bỏ ngày, chỉ ghi tháng và năm")
  if (moiNhat) {
    const [, thang, nam] = new Date(moiNhat).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric" }).split("/");
    phan.push(`Cập nhật ${thang}/${nam}`);
  }
  return phan.join(" · ");
}
