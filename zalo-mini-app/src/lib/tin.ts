import { thamSo, type BoLoc } from "./boLoc";

// Đọc tin ĐÃ DUYỆT từ cùng Supabase với web (khoá công khai — chỉ đọc).
// Nghiệp vụ tính tiền / duyệt / Up / đẩy KHÔNG viết ở đây: sau này gọi đúng API của web.

const URL_DB = import.meta.env.VITE_SUPABASE_URL as string;
const KHOA = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const WEB = "https://coastalland.vn";

export type Tin = {
  id: string;
  purpose: "ban" | "thue" | "mua" | "can-thue";
  type: string;
  title: string;
  description: string | null;
  price_vnd: number | null;
  area_m2: number | null;
  beds: number | null;
  baths: number | null;
  ward: string | null;
  district: string | null;
  province: string;
  images: string[];
  tier: "diamond" | "gold" | "silver" | "basic";
  tier_expires_at: string | null;
  published_at: string | null;
};

// KHÔNG lấy cột details: trong đó có SĐT người đăng — số chỉ mở qua OTP như trên web.
const COT =
  "id,purpose,type,title,description,price_vnd,area_m2,beds,baths,ward,district,province,images,tier,tier_expires_at,published_at";

async function rest(query: string): Promise<Tin[]> {
  const res = await fetch(`${URL_DB}/rest/v1/listings?${query}`, {
    headers: { apikey: KHOA, Authorization: `Bearer ${KHOA}` },
  });
  if (!res.ok) throw new Error(`Không đọc được tin (${res.status})`);
  // Tin mẫu seed có id dạng số — web đã loại, Mini App cũng loại.
  return ((await res.json()) as Tin[]).filter((t) => !/^\d+$/.test(t.id));
}

const THU_TU = "order=bumped_at.desc.nullslast,published_at.desc.nullslast,created_at.desc";

export function layTinMoi(mucDich: "ban" | "thue", soLuong = 30) {
  const md = `eq.${mucDich}`;
  return rest(`select=${COT}&status=eq.approved&purpose=${md}&${THU_TU}&limit=${soLuong}`);
}

export function timTin(tuKhoa: string, mucDich: "ban" | "thue") {
  const md = `eq.${mucDich}`;
  const q = tuKhoa.trim().replace(/[(),*]/g, " ");
  const loc = q
    ? `&or=(title.ilike.*${encodeURIComponent(q)}*,province.ilike.*${encodeURIComponent(q)}*,ward.ilike.*${encodeURIComponent(q)}*,type.ilike.*${encodeURIComponent(q)}*)`
    : "";
  return rest(`select=${COT}&status=eq.approved&purpose=${md}${loc}&${THU_TU}&limit=50`);
}

export async function layTin(id: string): Promise<Tin | null> {
  const r = await rest(`select=${COT}&status=eq.approved&id=eq.${encodeURIComponent(id)}&limit=1`);
  return r[0] ?? null;
}

export function layNhieuTin(ids: string[]) {
  if (!ids.length) return Promise.resolve([] as Tin[]);
  return rest(`select=${COT}&status=eq.approved&id=in.(${ids.map(encodeURIComponent).join(",")})`);
}

// Ảnh trong kho Supabase → đi qua /anh/ của web (giống web — đỡ băng thông Supabase).
export function anh(url: string | undefined): string {
  if (!url) return `${WEB}/images/segments/canho1.jpg`;
  const m = url.match(/\/storage\/v1\/object\/public\/(.+)$/);
  if (m) return `${WEB}/anh/${m[1]}`;
  return url.startsWith("/") ? `${WEB}${url}` : url;
}

// Hạng hiệu lực: gói VIP quá hạn coi như tin thường ngay (giống web).
export function hangHieuLuc(t: Tin): Tin["tier"] {
  if (t.tier === "basic" || !t.tier_expires_at) return t.tier;
  return new Date(t.tier_expires_at).getTime() < Date.now() ? "basic" : t.tier;
}

// ── Tin VIP (hạng còn hiệu lực) ─────────────────────────────────────────────
export async function layTinVip(soLuong = 10) {
  const ds = await rest(`select=${COT}&status=eq.approved&tier=neq.basic&${THU_TU}&limit=${soLuong * 2}`);
  return ds.filter((t) => hangHieuLuc(t) !== "basic").slice(0, soLuong);
}

// ── Dự án · Tin tức · Bảng giá: cùng bảng với web, chỉ đọc bản đã công bố ────
async function doc<T>(bang: string, query: string): Promise<T[]> {
  const res = await fetch(`${URL_DB}/rest/v1/${bang}?${query}`, {
    headers: { apikey: KHOA, Authorization: `Bearer ${KHOA}` },
  });
  if (!res.ok) throw new Error(`Không đọc được ${bang} (${res.status})`);
  return res.json();
}

export type DuAn = {
  slug: string;
  name: string;
  ward: string | null;
  district: string | null;
  province: string | null;
  type: string | null;
  status_text: string | null;
  developer: string | null;
  price_from: number | null;
  images: string[];
  amenities: string[];
  overview: string | null;
};
const COT_DU_AN = "slug,name,ward,district,province,type,status_text,developer,price_from,images,amenities,overview";
export const layDuAn = (soLuong = 50) =>
  doc<DuAn>("projects", `select=${COT_DU_AN}&status=eq.published&order=published_at.desc.nullslast&limit=${soLuong}`);
export const layMotDuAn = async (slug: string) =>
  (await doc<DuAn>("projects", `select=${COT_DU_AN}&status=eq.published&slug=eq.${encodeURIComponent(slug)}&limit=1`))[0] ?? null;

export type BaiViet = { slug: string; title: string; excerpt: string | null; category: string | null; content: string | null; image: string | null; published_at: string | null };
const COT_BAI = "slug,title,excerpt,category,content,image,published_at";
export const layBaiViet = (soLuong = 30) =>
  doc<BaiViet>("articles", `select=${COT_BAI}&status=eq.published&order=published_at.desc.nullslast&limit=${soLuong}`);
export const layMotBaiViet = async (slug: string) =>
  (await doc<BaiViet>("articles", `select=${COT_BAI}&status=eq.published&slug=eq.${encodeURIComponent(slug)}&limit=1`))[0] ?? null;

// Bảng giá ĐÃ CÔNG BỐ (admin "Giá & quy định" → Công bố). Giá chưa gồm VAT.
export type GoiGia = { tierId: string; name: string; terms: { days: number; price: number }[] };
export type DongDay = { label: string; values: { gia: number; giaGoc?: number }[] };
export type GoiHoiVien = { id: string; ten: string; thoiHan: { thang: number; price: number }[]; voucher: { loai: string; giam: number; soLuong: number }[] };
export type ChinhSachMienPhi = { active: boolean; from?: string; to?: string; days: number; tierId: string; audience: string; quota: number };
export type BangGia = {
  free?: ChinhSachMienPhi;
  ban: { plans: GoiGia[]; up: DongDay[] };
  thue: { plans: GoiGia[]; up: DongDay[] };
  hoiVien: GoiHoiVien[];
};
export async function layBangGia(): Promise<BangGia | null> {
  const r = await doc<{ data: any }>("site_content", "select=data&key=eq.billing&limit=1");
  const d = r[0]?.data;
  if (!d?.congBo) return null;
  return { ban: d.congBo.ban, thue: d.congBo.thue, hoiVien: d.hoiVien ?? [], free: d.free };
}

// ── Lọc tin theo bộ lọc (giống trang danh sách trên web) ────────────────────
export function locTin(mucDich: "ban" | "thue", b: BoLoc, soLuong = 60) {
  return rest(`select=${COT}&status=eq.approved&purpose=eq.${mucDich}&${thamSo(mucDich, b)}&limit=${soLuong}`);
}

// Tỉnh/thành đang có tin (chỉ để hiện lựa chọn — không hiện số tin).
export async function layTinhCoTin(mucDich: "ban" | "thue"): Promise<string[]> {
  const r = (await rest(`select=province&status=eq.approved&purpose=eq.${mucDich}&limit=5000`)) as unknown as { province: string }[];
  return [...new Set(r.map((x) => x.province).filter(Boolean))].sort((a, b) => a.localeCompare(b, "vi"));
}

// ── Chi tiết đầy đủ một tin: chỉ lấy đúng các ô cần hiện từ cột details ─────
// (KHÔNG lấy SĐT người đăng — số chỉ mở qua /api/xem-so như web).
export type TinChiTiet = Tin & {
  built_area_m2: number | null;
  dac_diem: Record<string, string> | null;
  phap_ly: string | null;
  huong: string | null;
  noi_that: string | null;
  tien_ich: string[] | null;
  noi_that_ds: string[] | null;
  nguoi_dang: string | null;
  du_an: string | null;
  du_an_slug: string | null;
  dia_chi_cu: { phuong?: string; quan?: string; tinh?: string } | null;
  don_gia_ban: number | null;
  sdt_an: string | null; // SĐT người đăng đã che 3 số cuối ("0905 123 ***") — số đầy đủ chỉ mở qua /api/xem-so
};
const COT_CHI_TIET =
  `${COT},built_area_m2,dac_diem:details->specs,phap_ly:details->>legal,huong:details->>direction,noi_that:details->>furnish,` +
  "tien_ich:details->amenities,noi_that_ds:details->interior,nguoi_dang:details->contact->>name,du_an:details->>projectName," +
  "du_an_slug:details->>project,dia_chi_cu:details->diaChiCu,don_gia_ban:details->donGiaBan,sdt_goc:details->contact->>phone";

export async function layTinChiTiet(id: string): Promise<TinChiTiet | null> {
  const r = (await rest(`select=${COT_CHI_TIET}&status=eq.approved&id=eq.${encodeURIComponent(id)}&limit=1`)) as (TinChiTiet & { sdt_goc?: string | null })[];
  const t = r[0];
  if (!t) return null;
  // Che số ngay khi nhận về, không giữ số đầy đủ trong bộ nhớ trang (giống web: "0981 ••• •••").
  let d = (t.sdt_goc ?? "").replace(/\D/g, "").replace(/^84/, "0");
  if (d && !d.startsWith("0")) d = `0${d}`; // kho lưu số không kèm 0 đầu
  const { sdt_goc: _bo, ...tin } = t;
  return { ...tin, sdt_an: d.length >= 9 ? `${d.slice(0, 4)} ••• •••` : null };
}

export async function layTinTuongTu(t: Tin, soLuong = 6) {
  const ds = await rest(
    `select=${COT}&status=eq.approved&purpose=eq.${t.purpose}&province=eq.${encodeURIComponent(t.province)}&id=neq.${t.id}&${THU_TU}&limit=${soLuong}`,
  );
  return ds;
}

// ── Nội dung trang chủ do admin sửa ở /admin/noi-dung (cùng khoá với web) ────
export type Slide = { id: string; href?: string; image: string; title?: string; status?: string; subtitle?: string; showText?: boolean };
export type KhuVuc = { name: string; count?: string; image: string; href?: string };
async function khoiNoiDung<T>(khoa: string): Promise<T | null> {
  const r = await doc<{ data: T }>("site_content", `select=data&key=eq.${khoa}&limit=1`);
  return r[0]?.data ?? null;
}
export const layBanner = async () => (await khoiNoiDung<{ slides: Slide[] }>("hero_home"))?.slides?.filter((s) => s.image) ?? [];
export const layKhuVuc = async () => (await khoiNoiDung<{ items: KhuVuc[] }>("home_areas"))?.items?.filter((a) => a.name && a.image) ?? [];

// "Bất động sản dành cho bạn" — cùng 5 nút lọc nhanh như trang chủ web.
export const NHOM_DANH_CHO_BAN = [
  { nhan: "Tất cả" },
  { nhan: "Bán đất", md: "ban", khop: "Đất", loai: "Đất nền" },
  { nhan: "Bán nhà riêng", md: "ban", khop: "Nhà riêng", loai: "Nhà riêng" },
  { nhan: "Bán căn hộ", md: "ban", khop: "Căn hộ", loai: "Căn hộ, chung cư" },
  { nhan: "Cho thuê", md: "thue" },
] as const;
export function layTinDanhChoBan(nhom: (typeof NHOM_DANH_CHO_BAN)[number], soLuong = 10) {
  const q: string[] = [];
  if ("md" in nhom) q.push(`purpose=eq.${nhom.md}`);
  if ("khop" in nhom) q.push(`type=ilike.*${encodeURIComponent(nhom.khop)}*`);
  return rest(`select=${COT}&status=eq.approved&${q.join("&")}${q.length ? "&" : ""}${THU_TU}&limit=${soLuong}`);
}
