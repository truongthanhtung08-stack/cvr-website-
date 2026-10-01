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
  bumped_at: string | null;
  nguoi_dang: string | null; // tên người đăng — hiện ở đáy thẻ như web
};

// Không lấy cả cột details (nặng) — chỉ lấy đúng tên người đăng.
const COT =
  "id,purpose,type,title,description,price_vnd,area_m2,beds,baths,ward,district,province,images,tier,tier_expires_at,published_at," +
  "bumped_at,nguoi_dang:details->contact->>name";

async function rest(query: string): Promise<Tin[]> {
  const res = await fetch(`${URL_DB}/rest/v1/listings?${query}`, {
    headers: { apikey: KHOA, Authorization: `Bearer ${KHOA}` },
  });
  if (!res.ok) throw new Error(`Không đọc được tin (${res.status})`);
  // Tin mẫu seed có id dạng số — web đã loại, Mini App cũng loại.
  return ((await res.json()) as Tin[]).filter((t) => !/^\d+$/.test(t.id));
}

const THU_TU = "order=bumped_at.desc.nullslast,published_at.desc.nullslast,created_at.desc";

// Bỏ dấu tiếng Việt — giống normalizeVi của web (src/lib/filters.ts): gõ "da nang" vẫn ra "Đà Nẵng".
export const boDau = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[đĐ]/g, "d").toLowerCase().replace(/\s+/g, " ").trim();

// Từ đệm khách hay gõ nhưng không giúp lọc ("bán nhà tại Đà Nẵng" → nha, da, nang).
const TU_DEM = new Set(["tai", "o", "khu", "vuc", "can", "mua", "ban", "cho", "thue", "gia", "re", "tim", "va", "gan"]);

// TÌM TIN — tách từng từ, bỏ dấu, dò trong tiêu đề · loại hình · địa chỉ · dự án · mô tả.
// Khớp ĐỦ mọi từ thì xếp trước; không tin nào khớp đủ thì trả tin khớp NHIỀU từ nhất
// kèm cờ lienQuan (web cũng vậy — không bao giờ để màn hình trống).
// Tin đang hiển thị chỉ vài trăm nên lọc ngay trên máy, không cần máy chủ tìm kiếm.
export async function timTin(tuKhoa: string, mucDich: "ban" | "thue"): Promise<{ ds: Tin[]; lienQuan: boolean }> {
  const ds = (await rest(
    `select=${COT},dc:details->>addressDetail,da:details->>projectName&status=eq.approved&purpose=eq.${mucDich}&${THU_TU}&limit=500`,
  )) as (Tin & { dc: string | null; da: string | null })[];
  const tu = boDau(tuKhoa).split(" ").filter((t) => t && !TU_DEM.has(t));
  if (!tu.length) return { ds: ds.slice(0, 50), lienQuan: false };

  const diem = ds.map((t) => {
    const chu = boDau([t.title, t.type, t.ward, t.district, t.province, t.dc, t.da, t.description?.slice(0, 400)].filter(Boolean).join(" "));
    return { t, khop: tu.filter((w) => chu.includes(w)).length };
  });
  const du = diem.filter((d) => d.khop === tu.length).map((d) => d.t);
  if (du.length) return { ds: du.slice(0, 100), lienQuan: false };
  const gan = diem.filter((d) => d.khop > 0).sort((a, b) => b.khop - a.khop).map((d) => d.t);
  return { ds: gan.slice(0, 50), lienQuan: true };
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

// ── Tin trang chủ theo mục đích: hạng CÒN HIỆU LỰC xếp trước (Diamond → Gold → Silver → thường),
// cùng hạng thì tin mới/vừa đẩy trước. Trang chủ chỉ có 2 khối song song: Bán · Cho thuê.
const THU_HANG: Record<Tin["tier"], number> = { diamond: 0, gold: 1, silver: 2, basic: 3 };
export async function layTinTrangChu(mucDich: "ban" | "thue", soLuong = 12) {
  const ds = await rest(`select=${COT}&status=eq.approved&purpose=eq.${mucDich}&${THU_TU}&limit=60`);
  return ds
    .map((t, i) => ({ t, i }))
    .sort((a, b) => THU_HANG[hangHieuLuc(a.t)] - THU_HANG[hangHieuLuc(b.t)] || a.i - b.i)
    .slice(0, soLuong)
    .map((x) => x.t);
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
export function locTin(mucDich: "ban" | "thue", b: BoLoc, soLuong = 300) {
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
  du_an: string | null;
  du_an_slug: string | null;
  dia_chi_cu: { phuong?: string; quan?: string; tinh?: string } | null;
  don_gia_ban: number | null;
  sdt: string | null; // SĐT người đăng — trong Mini App khách đã đăng nhập Zalo nên bấm là hiện (chủ dự án chốt 27/09)
  sdt_an: string | null;
  ghim: string | null; // toạ độ ghim trên bản đồ (nếu người đăng đã ghim)
  dia_chi_ct: string | null; // số nhà, tên đường // bản che "0981 234 •••" (chỉ che 3 số cuối) hiện trước khi bấm, như web
};
const COT_CHI_TIET =
  `${COT},built_area_m2,dac_diem:details->specs,phap_ly:details->>legal,huong:details->>direction,noi_that:details->>furnish,` +
  "tien_ich:details->amenities,noi_that_ds:details->interior,du_an:details->>projectName," +
  "du_an_slug:details->>project,dia_chi_cu:details->diaChiCu,don_gia_ban:details->donGiaBan,sdt_goc:details->contact->>phone," +
  "ghim:details->>mapPin,dia_chi_ct:details->>addressDetail";

export async function layTinChiTiet(id: string): Promise<TinChiTiet | null> {
  const r = (await rest(`select=${COT_CHI_TIET}&status=eq.approved&id=eq.${encodeURIComponent(id)}&limit=1`)) as (TinChiTiet & { sdt_goc?: string | null })[];
  const t = r[0];
  if (!t) return null;
  // Chuẩn hoá số người đăng: kho lưu số không kèm 0 đầu.
  let d = (t.sdt_goc ?? "").replace(/\D/g, "").replace(/^84/, "0");
  if (d && !d.startsWith("0")) d = `0${d}`; // kho lưu số không kèm 0 đầu
  const { sdt_goc: _bo, ...tin } = t;
  const coSo = d.length >= 9;
  return { ...tin, sdt: coSo ? d : null, sdt_an: coSo ? `${d.slice(0, 4)} ${d.slice(4, 7)} •••` : null }; // chỉ che 3 số cuối, như web
}

export async function layTinTuongTu(t: Tin, soLuong = 6) {
  const ds = await rest(
    `select=${COT}&status=eq.approved&purpose=eq.${t.purpose}&province=eq.${encodeURIComponent(t.province)}&id=neq.${t.id}&${THU_TU}&limit=${soLuong}`,
  );
  return ds;
}

// Nội dung footer do admin sửa trên web (/admin/noi-dung → bảng site_content, khoá "footer").
export type ChanTrang = { tagline?: string; description?: string; hotline?: string; email?: string; address?: string };
export async function layChanTrang(): Promise<ChanTrang> {
  const r = await doc<{ data: ChanTrang }>("site_content", "select=data&key=eq.footer&limit=1").catch(() => []);
  return r[0]?.data ?? {};
}
