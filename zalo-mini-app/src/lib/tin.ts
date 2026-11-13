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
  /** Bản kèm "Nhân đôi hiển thị" của tin CVR Diamond — không phải tin riêng (giống web). */
  banSao?: boolean;
  published_at: string | null;
  bumped_at: string | null;
  nguoi_dang: string | null; // tên người đăng — hiện ở đáy thẻ như web
  sdt?: string | null; // số liên hệ của tin — nút gọi trên thẻ to trang chủ (như web TheTinMobile, số ẩn đuôi tới khi bấm)
};

// Không lấy cả cột details (nặng) — chỉ lấy đúng tên người đăng.
const COT =
  "id,purpose,type,title,description,price_vnd,area_m2,beds,baths,ward,district,province,images,tier,tier_expires_at,published_at," +
  "bumped_at,nguoi_dang:details->contact->>name,sdt:details->contact->>phone";

async function rest(query: string): Promise<Tin[]> {
  // Y HỆT WEB (listingsDb conHan, 02/10/2026): tin đã duyệt mà QUA giờ hết hạn là ngừng
  // hiển thị ngay — không chờ cron mỗi giờ đổi status sang 'expired'.
  const conHan = query.includes("status=eq.approved")
    ? `&or=(tier_expires_at.is.null,tier_expires_at.gt.${new Date().toISOString()})`
    : "";
  const res = await fetch(`${URL_DB}/rest/v1/listings?${query}${conHan}`, {
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
  if (du.length) return { ds: nhanDoiHienThi(du.slice(0, 100)), lienQuan: false };
  const gan = diem.filter((d) => d.khop > 0).sort((a, b) => b.khop - a.khop).map((d) => d.t);
  return { ds: nhanDoiHienThi(gan.slice(0, 50)), lienQuan: true };
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
  tier?: string | null; // cấp VIP dự án (details.tier) — nhãn tình trạng trên ảnh chỉ cho Diamond · Gold · Silver như web (NhanTinhTrang)
};
const COT_DU_AN = "slug,name,ward,district,province,type,status_text,developer,price_from,images,amenities,overview,tier:details->>tier";
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
// Kết quả lọc XẾP THEO HẠNG như web: Diamond → Gold → Silver → Basic, cùng hạng giữ thứ tự
// thời gian (mới / vừa đẩy trước) + nhân đôi hiển thị tin Diamond.
export async function locTin(mucDich: "ban" | "thue", b: BoLoc, soLuong = 300) {
  const ds = await rest(`select=${COT}&status=eq.approved&purpose=eq.${mucDich}&${thamSo(mucDich, b)}&limit=${soLuong}`);
  return xepTheoHang(nhanDoiHienThi(ds));
}

// NHÂN ĐÔI HIỂN THỊ — quyền lợi CVR Diamond, Y HỆT WEB (src/lib/nhanDoiHienThi.ts): ở kết quả
// tìm kiếm, mỗi tin Diamond còn hạn hiện thêm một thẻ CVR Basic (cùng tin → đẩy/sửa/hết hạn cùng lúc).
export function nhanDoiHienThi(ds: Tin[]): Tin[] {
  const ra: Tin[] = [];
  for (const t of ds) {
    ra.push(t);
    if (hangHieuLuc(t) === "diamond") ra.push({ ...t, tier: "basic", tier_expires_at: null, banSao: true });
  }
  return ra;
}
export const xepTheoHang = (ds: Tin[]) =>
  ds.map((t, i) => ({ t, i })).sort((a, b) => THU_HANG[hangHieuLuc(a.t)] - THU_HANG[hangHieuLuc(b.t)] || a.i - b.i).map((x) => x.t);

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

// BẤT ĐỘNG SẢN NỔI BẬT trang chủ — như web (src/components/FeaturedListings.tsx, src/lib/tinNoiBat.ts): cả Mua bán lẫn Cho thuê,
// xếp theo cấp Diamond → Gold → Silver → Basic, cùng cấp giữ thứ tự mới nhất. Lấy đủ cho 5 tab × 16 tin (2 slide × 8).
export async function layTinNoiBat() {
  const ds = await rest(`select=${COT}&status=eq.approved&purpose=in.(ban,thue)&${THU_TU}&limit=120`);
  return ds
    .map((t, i) => ({ t, i }))
    .sort((a, b) => THU_HANG[hangHieuLuc(a.t)] - THU_HANG[hangHieuLuc(b.t)] || a.i - b.i)
    .map((x) => x.t);
}

// DỰ ÁN NỔI BẬT trang chủ — ĐÚNG luật web (src/lib/contentDb.ts getProjectsNoiBat + ProjectSlider sortProjectsByTier, 06/11/2026):
// bỏ hồ sơ Tra cứu (details.dangThe hoặc chưa có ảnh) · xếp theo cấp Diamond → Gold → Silver → thường, cùng cấp giữ thứ tự mới
// nhất · trang chủ lấy 8 dự án đầu, còn lại ở "Xem thêm".
const CAP_DU_AN: Record<string, number> = { diamond: 0, gold: 1, silver: 2, basic: 3 };
export async function layDuAnNoiBat(soLuong = 8) {
  const ds = await doc<DuAn & { details: { dangThe?: boolean; tier?: string } | null }>(
    "projects",
    `select=${COT_DU_AN},details&status=eq.published&order=published_at.desc.nullslast&limit=200`,
  );
  const coAnh = (d: DuAn) => (d.images ?? []).some((s) => s && !/youtu\.?be|\.mp4|\.webm|\.mov/i.test(s));
  return ds
    .filter((d) => !d.details?.dangThe && coAnh(d))
    .map((d, i) => ({ d, i, r: CAP_DU_AN[d.details?.tier ?? "basic"] ?? 3 }))
    .sort((a, b) => a.r - b.r || a.i - b.i)
    .slice(0, soLuong)
    .map((x) => x.d);
}

// TRANG DỰ ÁN — đúng thứ tự web (/du-an, chủ dự án 02/11/2026): Dự án nổi bật trước (theo cấp, cùng cấp mới nhất trước) → Tra cứu
// (hồ sơ dangThe hoặc chưa có ảnh) sau, xếp theo tên A-B-C. Chung luật với layDuAnNoiBat.
export async function layDuAnTrang() {
  const ds = await doc<DuAn & { details: { dangThe?: boolean; tier?: string } | null }>(
    "projects",
    `select=${COT_DU_AN},details&status=eq.published&order=published_at.desc.nullslast&limit=500`,
  );
  const coAnh = (d: DuAn) => (d.images ?? []).some((s) => s && !/youtu\.?be|\.mp4|\.webm|\.mov/i.test(s));
  const noiBat = ds.filter((d) => !d.details?.dangThe && coAnh(d))
    .map((d, i) => ({ d, i, r: CAP_DU_AN[d.details?.tier ?? "basic"] ?? 3 }))
    .sort((a, b) => a.r - b.r || a.i - b.i).map((x) => x.d);
  const traCuu = ds.filter((d) => d.details?.dangThe || !coAnh(d)).sort((a, b) => a.name.localeCompare(b.name, "vi"));
  return { noiBat, traCuu };
}


// ẢNH ĐẦU TRANG CHỦ — đúng ảnh web (site_content hero_home, Admin → Nội dung): ảnh điện thoại (imageMobile), thiếu thì ảnh PC.
export type AnhDau = { anh: string; tieuDe: string };
export async function layAnhDauTrang(): Promise<AnhDau[]> {
  const r = await doc<{ data: { slides?: { image?: string; imageMobile?: string; title?: string }[] } }>("site_content", "select=data&key=eq.hero_home&limit=1").catch(() => []);
  return (r[0]?.data?.slides ?? []).filter((x) => x?.image).map((x) => ({ anh: anh(x.imageMobile || x.image), tieuDe: x.title ?? "" }));
}

// Ô KHU VỰC TRANG CHỦ — đúng ô web (site_content home_areas): tên + ảnh chính, ô đầu to (LocationGrid).
export type OKhuVuc = { ten: string; anh: string; tinh: string };
// THỨ TỰ Ô như web (trang chủ, anh 13/11/2026): ô đầu (Đà Nẵng, ô lớn) giữ nguyên, các ô còn lại xếp theo số tin bán nhiều → ít.
// Số tin = tin bán đang hiện + hết hạn của CẢ TỈNH chứa khu vực (như web): thành phố → tỉnh mới theo bảng sáp nhập
// (src/lib/pseo.ts NGUON_THANH_PHO, tỉnh cũ → tỉnh mới). Đếm bằng count=exact (1 dòng/ô, không tải dữ liệu tin).
const TINH_CUA_THANH_PHO: Record<string, string> = {
  "Nha Trang": "Khánh Hòa", "Cam Ranh": "Khánh Hòa", "Phan Rang - Tháp Chàm": "Khánh Hòa", "Đà Lạt": "Lâm Đồng", "Bảo Lộc": "Lâm Đồng",
  "Phan Thiết": "Lâm Đồng", "Gia Nghĩa": "Lâm Đồng", "Quy Nhơn": "Gia Lai", "Pleiku": "Gia Lai", "Buôn Ma Thuột": "Đắk Lắk", "Tuy Hòa": "Đắk Lắk",
  "Hội An": "Đà Nẵng", "Tam Kỳ": "Đà Nẵng", "Đông Hà": "Quảng Trị", "Đồng Hới": "Quảng Trị",
};
async function demTinBan(tinh: string): Promise<number> {
  const res = await fetch(`${URL_DB}/rest/v1/listings?select=id&purpose=eq.ban&status=in.(approved,expired)&province=eq.${encodeURIComponent(tinh)}`, {
    headers: { apikey: KHOA, Authorization: `Bearer ${KHOA}`, Prefer: "count=exact", Range: "0-0" },
  }).catch(() => null);
  return Number(res?.headers.get("content-range")?.split("/")[1] ?? 0) || 0;
}
export async function layKhuVucTrangChu(): Promise<OKhuVuc[]> {
  const r = await doc<{ data: { items?: { name?: string; image?: string; href?: string }[] } }>("site_content", "select=data&key=eq.home_areas&limit=1").catch(() => []);
  const ds = (r[0]?.data?.items ?? []).filter((x) => x?.name && x.image).map((x) => {
    const tinh = decodeURIComponent(x.href?.match(/[?&]tinh=([^&]+)/)?.[1] ?? x.name!);
    return { ten: x.name!, anh: anh(x.image), tinh };
  });
  const so = await Promise.all(ds.map((k) => demTinBan(TINH_CUA_THANH_PHO[k.tinh] ?? k.tinh)));
  const kem = ds.map((k, i) => ({ k, so: so[i] }));
  return [kem[0], ...kem.slice(1).sort((a, b) => b.so - a.so)].filter(Boolean).map((x) => x.k);
}

// CHI TIẾT DỰ ÁN ĐỦ MỤC NHƯ WEB (src/app/du-an/[slug] + contentDb, 14/11/2026): bảng thông số (scale), mặt bằng, bảng giá, chủ đầu tư.
export type DuAnDu = DuAn & {
  scale: { label: string; value: string }[] | null;
  ct: {
    priceMode?: string; priceTable?: { unit?: string; area?: string; direction?: string; price?: string }[];
    floorPlans?: { label?: string; image?: string; note?: string }[]; developmentUnit?: string; mapPin?: string; ngayCapNhat?: string;
    developerInfo?: { logo?: string; established?: string; website?: string; desc?: string };
  } | null;
  updated_at: string | null;
};
export const layChiTietDuAn = async (slug: string) =>
  (await doc<DuAnDu>("projects", `select=${COT_DU_AN},scale,updated_at,ct:details&status=eq.published&slug=eq.${encodeURIComponent(slug)}&limit=1`))[0] ?? null;
// Tin thuộc dự án (details.project = mã dự án) — như mục "Tin thuộc dự án" của web
export const layTinDuAn = (slug: string) =>
  rest(`select=${COT}&status=eq.approved&details->>project=eq.${encodeURIComponent(slug)}&${THU_TU}&limit=20`);
