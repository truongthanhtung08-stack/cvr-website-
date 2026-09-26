import type { Tin } from "./tin";

const so = (n: number, le = 1) => n.toLocaleString("vi-VN", { maximumFractionDigits: le });

// Cùng cách hiện giá với web: bán "3,2 tỷ" / "850 triệu" · thuê "18 triệu/tháng" · trống "Thỏa thuận".
export function gia(t: Tin): string {
  const v = t.price_vnd;
  if (v == null) return "Thỏa thuận";
  if (t.purpose === "thue" || t.purpose === "can-thue") return `${so(v / 1e6)} triệu/tháng`;
  return v >= 1e9 ? `${so(v / 1e9)} tỷ` : `${so(v / 1e6)} triệu`;
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
