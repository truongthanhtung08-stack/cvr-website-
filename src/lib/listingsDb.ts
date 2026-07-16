// ============================================================================
// B2 — LỚP ĐỌC TIN TỪ SUPABASE (server-side, dùng trong Server Components)
// Đọc bảng `listings` qua PostgREST + cache Next (revalidate 60s) rồi MAP về
// đúng type `Listing` của FE — mọi component (PropertyCard, FilterBar, sort…)
// giữ nguyên, không phải sửa.
//
// FALLBACK AN TOÀN: bảng chưa tạo / Supabase lỗi / 0 tin → trả dữ liệu mẫu
// src/lib/data.ts như cũ. Web không bao giờ trắng trang vì DB.
// ============================================================================

import type { Listing } from "@/lib/data";
import { featuredListings, getListingById } from "@/lib/data";
import { asset } from "@/lib/asset";

// Hàng trong bảng `listings` (xem supabase/migrations/0002_listings.sql)
type Row = {
  id: string;
  purpose: "ban" | "thue";
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
  created_at: string;
};

// Hạng CVR → huy hiệu FE đang dùng (tierFromBadge trong packages.ts làm chiều ngược lại)
const TIER_BADGE: Record<Row["tier"], Listing["badge"]> = {
  diamond: "VIP",
  gold: "Nổi bật",
  silver: "Mới",
  basic: undefined,
};

// Ảnh đại diện khi tin chưa có ảnh (admin đăng nhanh chưa kịp upload)
const PLACEHOLDER_IMAGE = "/images/segments/canho1.jpg";

// Số kiểu VN: 7.2 → "7,2" · 1500 → "1.500"
function fmtNum(n: number, maxFrac = 1): string {
  return n.toLocaleString("vi-VN", { maximumFractionDigits: maxFrac });
}

// price_vnd → chuỗi giá FE: bán "33 tỷ"/"850 triệu" · thuê "18 triệu/tháng" · null "Thỏa thuận"
function fmtPrice(v: number | null, purpose: Row["purpose"]): string {
  if (v == null) return "Thỏa thuận";
  if (purpose === "thue") return `${fmtNum(v / 1e6)} triệu/tháng`;
  return v >= 1e9 ? `${fmtNum(v / 1e9)} tỷ` : `${fmtNum(v / 1e6)} triệu`;
}

function rowToListing(r: Row): Listing {
  const price = fmtPrice(r.price_vnd, r.purpose);
  // Đơn giá đất "42 tr/m²" — chỉ hiện cho loại Đất (khớp dữ liệu mẫu cũ)
  const perM2 =
    r.type.includes("Đất") && r.price_vnd != null && r.area_m2
      ? `${fmtNum(r.price_vnd / r.area_m2 / 1e6, 0)} tr/m²`
      : undefined;
  return {
    id: r.id,
    title: r.title,
    price,
    ...(perM2 ? { pricePerM2: perM2 } : {}),
    area: r.area_m2 != null ? `${fmtNum(r.area_m2, 0)} m²` : "—",
    ...(r.beds != null ? { beds: r.beds } : {}),
    ...(r.baths != null ? { baths: r.baths } : {}),
    location: [r.ward, r.district, r.province].filter(Boolean).join(", "),
    type: r.type,
    image: asset(r.images[0] ?? PLACEHOLDER_IMAGE),
    badge: TIER_BADGE[r.tier],
    purpose: r.purpose,
  };
}

const COLS =
  "id,purpose,type,title,description,price_vnd,area_m2,beds,baths,ward,district,province,images,tier,created_at";

// Gọi PostgREST trực tiếp bằng fetch để dùng cache Next (revalidate) —
// KHÔNG dùng client cookies ở đây vì tin đã duyệt là dữ liệu công khai.
async function rest(query: string): Promise<Row[] | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null; // chưa cấu hình env (worktree/CI) → fallback
  try {
    const res = await fetch(`${url}/rest/v1/listings?${query}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      next: { revalidate: 60 }, // admin sửa tin → web cập nhật trong ≤60s
    });
    if (!res.ok) return null; // bảng chưa tạo (404) / lỗi khác → fallback
    return (await res.json()) as Row[];
  } catch {
    return null;
  }
}

// Toàn bộ tin ĐÃ DUYỆT (mới nhất trước — FE tự xếp hạng VIP bằng sortListings)
export async function getListings(): Promise<Listing[]> {
  const rows = await rest(`select=${COLS}&status=eq.approved&order=created_at.desc&limit=500`);
  if (!rows || rows.length === 0) return featuredListings; // fallback dữ liệu mẫu
  return rows.map(rowToListing);
}

// Một tin theo id (trang chi tiết) — fallback tìm trong dữ liệu mẫu
export async function getListing(id: string): Promise<Listing | null> {
  const rows = await rest(`select=${COLS}&id=eq.${encodeURIComponent(id)}&limit=1`);
  if (!rows || rows.length === 0) return getListingById(id) ?? null;
  return rowToListing(rows[0]);
}
