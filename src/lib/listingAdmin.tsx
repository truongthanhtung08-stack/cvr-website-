// Kiểu dữ liệu + nhãn tiếng Việt cho ADMIN TIN ĐĂNG (B3).
// Hàng thô của bảng `listings` (supabase/migrations/0002_listings.sql).

export type ListingTier = "diamond" | "gold" | "silver" | "basic";
export type ListingStatus = "pending" | "approved" | "rejected" | "hidden" | "expired";
export type ListingPurpose = "ban" | "thue";

export type ListingRow = {
  id: string;
  owner_id: string | null;
  purpose: ListingPurpose;
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
  lat: number | null;
  lng: number | null;
  images: string[];
  tier: ListingTier;
  tier_expires_at: string | null;
  status: ListingStatus;
  published_at: string | null;
  expires_at: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
};

export function purposeLabel(p: ListingPurpose): string {
  return p === "thue" ? "Cho thuê" : "Mua bán";
}

export function tierLabel(t: ListingTier): string {
  return { diamond: "Diamond", gold: "Gold", silver: "Silver", basic: "Thường" }[t];
}

// Huy hiệu hạng tin — màu đồng bộ 4 cấp CVR (packages.ts)
export function tierBadge(t: ListingTier) {
  const cls = {
    diamond: "bg-red-50 text-red-700 ring-red-600/20",
    gold: "bg-amber-50 text-amber-700 ring-amber-600/20",
    silver: "bg-blue-50 text-blue-700 ring-blue-600/20",
    basic: "bg-gray-100 text-gray-600 ring-gray-500/20",
  }[t];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}>
      {tierLabel(t)}
    </span>
  );
}

export function listingStatusLabel(s: ListingStatus): string {
  return {
    pending: "Chờ duyệt",
    approved: "Đang đăng",
    rejected: "Từ chối",
    hidden: "Đã ẩn",
    expired: "Hết hạn",
  }[s];
}

export function listingStatusBadge(s: ListingStatus) {
  const cls = {
    pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
    approved: "bg-green-50 text-green-700 ring-green-600/20",
    rejected: "bg-red-50 text-red-700 ring-red-600/20",
    hidden: "bg-gray-100 text-gray-600 ring-gray-500/20",
    expired: "bg-gray-100 text-gray-500 ring-gray-400/20",
  }[s];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}>
      {listingStatusLabel(s)}
    </span>
  );
}

// Giá hiển thị trong bảng admin: bán "7,2 tỷ" · thuê "18 triệu/th" · null "Thỏa thuận"
export function adminPriceText(v: number | null, purpose: ListingPurpose): string {
  if (v == null) return "Thỏa thuận";
  const num = (n: number) => n.toLocaleString("vi-VN", { maximumFractionDigits: 1 });
  if (purpose === "thue") return `${num(v / 1e6)} triệu/th`;
  return v >= 1e9 ? `${num(v / 1e9)} tỷ` : `${num(v / 1e6)} triệu`;
}
