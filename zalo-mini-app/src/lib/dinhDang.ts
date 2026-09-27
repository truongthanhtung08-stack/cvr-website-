import type { Tin } from "./tin";

const so = (n: number, le = 1) => n.toLocaleString("vi-VN", { maximumFractionDigits: le });

// Cùng cách hiện giá với web: bán "3,2 tỷ" / "850 triệu" · thuê "18 triệu/tháng" · trống "Thỏa thuận".
export function gia(t: Tin): string {
  const v = t.price_vnd;
  if (v == null) return "Thỏa thuận";
  if (t.purpose === "thue" || t.purpose === "can-thue") return `${so(v / 1e6)} triệu/tháng`;
  return v >= 1e9 ? `${so(v / 1e9)} tỷ` : `${so(v / 1e6)} triệu`;
}

// "3 giờ trước" / "Làm mới hôm qua" — chép freshText + postedText của web (src/lib/data.ts).
function truoc(iso: string): string {
  const giay = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (Number.isNaN(giay)) return "";
  if (giay < 90) return "Vừa xong";
  const phut = Math.floor(giay / 60);
  if (phut < 60) return `${phut} phút trước`;
  const gio = Math.floor(phut / 60);
  if (gio < 24) return `${gio} giờ trước`;
  const ngay = Math.floor(giay / 86400);
  if (ngay === 1) return "Hôm qua";
  if (ngay < 30) return `${ngay} ngày trước`;
  return new Date(iso).toLocaleDateString("vi-VN");
}
export function luc(t: Tin): string {
  const p = t.published_at;
  const b = t.bumped_at;
  if (!b || (p && new Date(b).getTime() - new Date(p).getTime() < 120_000)) return p ? truoc(p) : "";
  return `Làm mới ${truoc(b).replace(/^Vừa xong$/, "vừa xong")}`;
}

export function dienTich(t: Tin): string | null {
  return t.area_m2 ? `${so(t.area_m2)} m²` : null;
}

export function diaChi(t: Tin): string {
  return [t.ward, t.district, t.province].filter(Boolean).join(", ");
}

// Cùng huy hiệu với web (TIER_BADGE trong src/lib/listingsDb.ts).
export const NHAN_HANG: Record<Tin["tier"], string | null> = {
  diamond: "VIP",
  gold: "Nổi bật",
  silver: "Mới",
  basic: null,
};

export const tien = (v: number) => (v === 0 ? "Không tính phí" : `${v.toLocaleString("vi-VN")} đ`);

export function ngay(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
}

export function diaChiDuAn(d: { ward: string | null; district: string | null; province: string | null }) {
  return [d.ward, d.district, d.province].filter(Boolean).join(", ");
}

// Đoạn nội dung ngắn cho thẻ tin: bỏ ký hiệu định dạng, bỏ phần lặp lại tiêu đề.
export function tomTatTin(t: Tin): string {
  let mo = (t.description ?? "").replace(/::\w+::|\*\*|!\[[^\]]*\]\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
  if (mo.toLowerCase().startsWith(t.title.toLowerCase().slice(0, 40))) mo = mo.slice(t.title.length).replace(/^[\s.,:;–—-]+/, "");
  return mo;
}
