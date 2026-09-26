// Bộ lọc — cùng các mức với web (src/lib/filters.ts). Sửa mức ở web thì sửa cả ở đây.
export type MucDich = "ban" | "thue";

export type BoLoc = {
  tinh?: string;
  khuVuc?: string; // địa danh gõ tự do (Quy Nhơn, Nha Trang…) — dò chuỗi con trong địa chỉ như web
  loai?: string; // nhãn loại hình
  gia?: string; // nhãn mức giá
  dienTich?: string; // nhãn mức diện tích
  sapXep: "moi" | "gia-tang" | "gia-giam" | "dt-giam";
};

export const BO_LOC_TRONG: BoLoc = { sapXep: "moi" };

// Loại hình: nhãn hiển thị + chuỗi khớp cột type (tin cũ ghi nhiều biến thể, vd "Đất nền / Đất").
type Loai = { nhan: string; khop: string };
const LOAI_BAN: Loai[] = [
  { nhan: "Căn hộ, chung cư", khop: "Căn hộ" },
  { nhan: "Nhà riêng", khop: "Nhà riêng" },
  { nhan: "Nhà mặt phố", khop: "Nhà mặt phố" },
  { nhan: "Biệt thự, liền kề", khop: "Biệt thự" },
  { nhan: "Shophouse, nhà phố thương mại", khop: "Nhà phố thương mại" },
  { nhan: "Đất nền", khop: "Đất nền" },
  { nhan: "Đất nông nghiệp", khop: "Đất nông nghiệp" },
  { nhan: "Villa, biệt thự biển", khop: "Villa" },
  { nhan: "Condotel", khop: "Condotel" },
  { nhan: "Kho, nhà xưởng", khop: "Kho" },
];
const LOAI_THUE: Loai[] = [
  { nhan: "Căn hộ, chung cư", khop: "Căn hộ" },
  { nhan: "Nhà riêng", khop: "Nhà riêng" },
  { nhan: "Nhà mặt phố", khop: "Nhà mặt phố" },
  { nhan: "Nhà phố thương mại", khop: "Nhà phố thương mại" },
  { nhan: "Biệt thự, liền kề", khop: "Biệt thự" },
  { nhan: "Nhà trọ, phòng trọ", khop: "trọ" },
  { nhan: "Văn phòng", khop: "Văn phòng" },
  { nhan: "Mặt bằng, cửa hàng", khop: "Mặt bằng" },
  { nhan: "Đất, nhà xưởng, kho bãi", khop: "Nhà xưởng" },
];
export const loaiTheo = (md: MucDich) => (md === "thue" ? LOAI_THUE : LOAI_BAN);

// Mức giá theo ĐỒNG (web tính theo tỷ; quy ra đồng để lọc thẳng cột price_vnd).
type Muc = { nhan: string; min: number; max: number | null };
const TY = 1e9;
const TR = 1e6;
const GIA_BAN: Muc[] = [
  { nhan: "Dưới 500 triệu", min: 0, max: 500 * TR },
  { nhan: "500 - 800 triệu", min: 500 * TR, max: 800 * TR },
  { nhan: "800 triệu - 1 tỷ", min: 800 * TR, max: TY },
  { nhan: "1 - 2 tỷ", min: TY, max: 2 * TY },
  { nhan: "2 - 3 tỷ", min: 2 * TY, max: 3 * TY },
  { nhan: "3 - 5 tỷ", min: 3 * TY, max: 5 * TY },
  { nhan: "5 - 7 tỷ", min: 5 * TY, max: 7 * TY },
  { nhan: "7 - 10 tỷ", min: 7 * TY, max: 10 * TY },
  { nhan: "10 - 20 tỷ", min: 10 * TY, max: 20 * TY },
  { nhan: "20 - 30 tỷ", min: 20 * TY, max: 30 * TY },
  { nhan: "Trên 30 tỷ", min: 30 * TY, max: null },
];
const GIA_THUE: Muc[] = [
  { nhan: "Dưới 3 triệu", min: 0, max: 3 * TR },
  { nhan: "3 - 5 triệu", min: 3 * TR, max: 5 * TR },
  { nhan: "5 - 10 triệu", min: 5 * TR, max: 10 * TR },
  { nhan: "10 - 20 triệu", min: 10 * TR, max: 20 * TR },
  { nhan: "20 - 40 triệu", min: 20 * TR, max: 40 * TR },
  { nhan: "40 - 70 triệu", min: 40 * TR, max: 70 * TR },
  { nhan: "70 - 100 triệu", min: 70 * TR, max: 100 * TR },
  { nhan: "Trên 100 triệu", min: 100 * TR, max: null },
];
export const giaTheo = (md: MucDich) => (md === "thue" ? GIA_THUE : GIA_BAN);

const DT_BAN: Muc[] = [
  { nhan: "Dưới 30 m²", min: 0, max: 30 },
  { nhan: "30 - 50 m²", min: 30, max: 50 },
  { nhan: "50 - 80 m²", min: 50, max: 80 },
  { nhan: "80 - 100 m²", min: 80, max: 100 },
  { nhan: "100 - 150 m²", min: 100, max: 150 },
  { nhan: "150 - 200 m²", min: 150, max: 200 },
  { nhan: "200 - 300 m²", min: 200, max: 300 },
  { nhan: "300 - 500 m²", min: 300, max: 500 },
  { nhan: "Trên 500 m²", min: 500, max: null },
];
const DT_THUE: Muc[] = [
  ...DT_BAN.slice(0, -1),
  { nhan: "500 - 1.000 m²", min: 500, max: 1000 },
  { nhan: "1.000 - 2.000 m²", min: 1000, max: 2000 },
  { nhan: "2.000 - 5.000 m²", min: 2000, max: 5000 },
  { nhan: "Trên 5.000 m²", min: 5000, max: null },
];
export const dtTheo = (md: MucDich) => (md === "thue" ? DT_THUE : DT_BAN);

export const SAP_XEP: { gt: BoLoc["sapXep"]; nhan: string }[] = [
  { gt: "moi", nhan: "Mới nhất" },
  { gt: "gia-tang", nhan: "Giá thấp đến cao" },
  { gt: "gia-giam", nhan: "Giá cao đến thấp" },
  { gt: "dt-giam", nhan: "Diện tích lớn nhất" },
];

// Bộ lọc → tham số PostgREST.
export function thamSo(md: MucDich, b: BoLoc): string {
  const q: string[] = [];
  if (b.tinh) q.push(`province=eq.${encodeURIComponent(b.tinh)}`);
  if (b.khuVuc) {
    const k = encodeURIComponent(b.khuVuc.replace(/[(),*]/g, " "));
    q.push(`or=(province.ilike.*${k}*,ward.ilike.*${k}*,district.ilike.*${k}*)`);
  }
  const loai = loaiTheo(md).find((l) => l.nhan === b.loai);
  if (loai) q.push(`type=ilike.*${encodeURIComponent(loai.khop)}*`);
  const gia = giaTheo(md).find((g) => g.nhan === b.gia);
  if (gia) {
    q.push(`price_vnd=gte.${gia.min}`);
    if (gia.max != null) q.push(`price_vnd=lt.${gia.max}`);
  }
  const dt = dtTheo(md).find((d) => d.nhan === b.dienTich);
  if (dt) {
    q.push(`area_m2=gte.${dt.min}`);
    if (dt.max != null) q.push(`area_m2=lt.${dt.max}`);
  }
  const thuTu = {
    moi: "bumped_at.desc.nullslast,published_at.desc.nullslast,created_at.desc",
    "gia-tang": "price_vnd.asc.nullslast",
    "gia-giam": "price_vnd.desc.nullslast",
    "dt-giam": "area_m2.desc.nullslast",
  }[b.sapXep];
  q.push(`order=${thuTu}`);
  return q.join("&");
}

export const soBoLocDangBat = (b: BoLoc) => [b.tinh, b.khuVuc, b.loai, b.gia, b.dienTich].filter(Boolean).length;
