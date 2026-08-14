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
import { isVideoUrl } from "@/lib/media";
import { specForType, amenityGroups } from "@/lib/listingSpec";

// Thuộc tính linh hoạt lưu trong cột details (JSONB) — xem 0006_listing_details.sql
export type ListingDetailsJson = {
  specs?: Record<string, string>;
  interior?: string[];
  amenities?: string[];
  legal?: string;
  furnish?: string;
  direction?: string;
  addressDetail?: string;
  mapPin?: string; // toạ độ / link Google Maps admin ghim tay
  places?: { category: string; name: string; distance: string }[]; // tiện ích xung quanh
  contact?: { name?: string; phone?: string; email?: string; avatar?: string };
  project?: string; // SLUG dự án tin này thuộc về — dùng cho "Tin liên quan tại dự án"
};

// Hàng trong bảng `listings` (xem supabase/migrations/0002_listings.sql)
type Row = {
  id: string;
  purpose: "ban" | "thue" | "mua" | "can-thue";
  type: string;
  title: string;
  description: string | null;
  price_vnd: number | null;
  area_m2: number | null;
  built_area_m2: number | null;
  beds: number | null;
  baths: number | null;
  ward: string | null;
  district: string | null;
  province: string;
  images: string[];
  tier: "diamond" | "gold" | "silver" | "basic";
  details: ListingDetailsJson | null;
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
    // Ảnh đại diện = ẢNH đầu tiên (bỏ qua video nếu đứng trước)
    image: asset(r.images.find((s) => !isVideoUrl(s)) ?? PLACEHOLDER_IMAGE),
    // Số ẢNH thật (không tính video) → badge "📷 n" đúng thay vì cứng "1"
    imageCount: r.images.filter((s) => !isVideoUrl(s)).length,
    badge: TIER_BADGE[r.tier],
    purpose: r.purpose,
    // Tên người đăng thật (khách hàng) — thẻ tin hiện đúng tên này, không phải admin
    agentName: r.details?.contact?.name || undefined,
    ...(r.details?.contact?.avatar ? { agentAvatar: asset(r.details.contact.avatar) } : {}),
    ...(r.details?.project ? { projectSlug: r.details.project } : {}),
    ...(r.details?.mapPin ? { mapPin: r.details.mapPin } : {}),
    ...(r.description ? { desc: r.description } : {}),
  };
}

// Cột cho thẻ tin & danh sách — GỒM CẢ details để thẻ hiện đúng TÊN NGƯỜI ĐĂNG THẬT
// (details.contact.name — cột details đã có trên production từ migration 0006).
const COLS =
  "id,purpose,type,title,description,price_vnd,area_m2,built_area_m2,beds,baths,ward,district,province,images,tier,created_at,details";
const COLS_DETAIL = COLS;

// Gọi PostgREST trực tiếp bằng fetch để dùng cache Next (revalidate) —
// KHÔNG dùng client cookies ở đây vì tin đã duyệt là dữ liệu công khai.
async function rest(query: string): Promise<Row[] | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null; // chưa cấu hình env (worktree/CI) → fallback
  try {
    const res = await fetch(`${url}/rest/v1/listings?${query}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store", // LUÔN lấy dữ liệu mới — admin sửa gì web hiện NGAY
    });
    if (!res.ok) return null; // bảng chưa tạo (404) / lỗi khác → fallback
    return (await res.json()) as Row[];
  } catch {
    return null;
  }
}

// Tin MẪU seed từ lúc dev có id dạng SỐ ('1'..'33') — tin thật của khách là UUID.
// WEB PHẢI THẬT (18/7): loại tin mẫu khỏi mọi trang, kể cả khi chưa xoá trong DB
// (migration 0008 xoá hẳn; lớp lọc này đảm bảo ngay cả khi chưa chạy SQL).
const isSeedRow = (r: Row) => /^\d+$/.test(r.id);
// Tin THẬT của khách luôn có id dạng UUID; tin DEMO seed (0002) có id SỐ ('1'..'33').
// Dùng để chặn cả trang chi tiết /bat-dong-san/<số> mở ra tin demo.
const isSeedId = (id: string) => /^\d+$/.test(id);

// Toàn bộ tin ĐÃ DUYỆT (mới nhất trước — FE tự xếp hạng VIP bằng sortListings)
// TIN THẬT 100%: DB trả 0 tin thật → hiện trống thật (KHÔNG độn dữ liệu mẫu).
// Chỉ fallback mẫu khi Supabase LỖI/chưa cấu hình (rows=null) để web không trắng trang.
export async function getListings(): Promise<Listing[]> {
  const rows = await rest(`select=${COLS}&status=eq.approved&order=created_at.desc&limit=500`);
  if (!rows) return featuredListings; // lỗi kết nối/chưa cấu hình → fallback mẫu
  return rows.filter((r) => !isSeedRow(r)).map(rowToListing);
}

// Một tin theo id (trang chi tiết) — fallback tìm trong dữ liệu mẫu
export async function getListing(id: string): Promise<Listing | null> {
  if (isSeedId(id)) return null; // tin demo (id số) → coi như không tồn tại
  const rows = await rest(`select=${COLS}&id=eq.${encodeURIComponent(id)}&limit=1`);
  if (!rows || rows.length === 0) return getListingById(id) ?? null;
  return rowToListing(rows[0]);
}

// ── CHI TIẾT ĐẦY ĐỦ cho trang /bat-dong-san/[id] — DỮ LIỆU THẬT ─────────────
// Trả đúng những gì Admin đã nhập: TẤT CẢ ảnh, mô tả, đặc điểm, nội thất, tiện
// ích, pháp lý, người đăng. Phần trống → null/[] để trang ghi "Chưa cập nhật"
// (KHÔNG bịa như buildListingDetail cũ).
export type ListingSpecRow = { label: string; value: string };
export type ListingFull = {
  listing: Listing;            // giá/diện tích/vị trí/hạng… (thẻ dùng chung)
  images: string[];            // toàn bộ ảnh thật (đúng số lượng)
  videos: string[];            // video (tệp mp4 tải lên / link YouTube-Vimeo)
  builtArea: string | null;    // diện tích xây dựng
  descriptionParas: string[];  // mô tả (tách theo dòng)
  specs: ListingSpecRow[];     // đặc điểm đã nhập (bỏ mục trống)
  interior: string[];          // nội thất có sẵn
  amenityGroups: { group: string; items: { name: string; active: boolean }[] }[];
  legal: string | null;
  furnish: string | null;
  direction: string | null;
  addressDetail: string | null;
  contact: { name: string; phone: string; email: string; avatar: string | null } | null;
  mapQuery: string;            // chuỗi địa chỉ để nhúng bản đồ
  places: { category: string; name: string; distance: string }[]; // tiện ích quanh BĐS
};

function rowToDetail(r: Row): ListingFull {
  const d = r.details ?? {};
  // Tách ẢNH và VIDEO: thư viện ảnh chỉ nhận ảnh; video hiện ở mục Video riêng.
  const videos = r.images.filter(isVideoUrl);
  const imageOnly = r.images.filter((s) => !isVideoUrl(s));
  const imgs = imageOnly.length ? imageOnly : [PLACEHOLDER_IMAGE];
  const specDefs = specForType(r.type).fields;
  const specs = specDefs
    .map((f) => ({ label: f.label + (f.unit ? ` (${f.unit})` : ""), value: (d.specs?.[f.key] ?? "").trim() }))
    .filter((s) => s.value);
  const amenSet = new Set(d.amenities ?? []);
  const c = d.contact;
  return {
    listing: rowToListing(r),
    images: imgs.map(asset),
    videos,
    builtArea: r.built_area_m2 != null ? `${fmtNum(r.built_area_m2, 0)} m²` : null,
    descriptionParas: (r.description ?? "").split("\n").map((s) => s.trim()).filter(Boolean),
    specs,
    interior: d.interior ?? [],
    amenityGroups: amenityGroups.map((g) => ({
      group: g.group,
      items: g.items.map((name) => ({ name, active: amenSet.has(name) })),
    })),
    legal: d.legal || null,
    furnish: d.furnish || null,
    direction: d.direction || null,
    addressDetail: d.addressDetail || null,
    contact: c && (c.name || c.phone) ? { name: c.name ?? "", phone: c.phone ?? "", email: c.email ?? "", avatar: c.avatar ? asset(c.avatar) : null } : null,
    // Ưu tiên điểm admin GHIM (details.mapPin) → bản đồ trỏ ĐÚNG vị trí thật;
    // chưa ghim thì tìm theo Phường/Quận/Tỉnh như trước.
    places: d.places ?? [],
    mapQuery: d.mapPin?.trim() || [r.ward, r.district, r.province].filter(Boolean).join(", "),
  };
}

// Fallback khi DB chưa sẵn (worktree/CI) — dựng chi tiết tối giản từ dữ liệu mẫu.
function mockToDetail(m: Listing): ListingFull {
  return {
    listing: m,
    images: [m.image],
    videos: [],
    builtArea: null,
    descriptionParas: [],
    specs: [],
    interior: [],
    amenityGroups: amenityGroups.map((g) => ({ group: g.group, items: g.items.map((name) => ({ name, active: false })) })),
    legal: null, furnish: null, direction: null, addressDetail: null, contact: null,
    places: [],
    mapQuery: m.location,
  };
}

export async function getListingDetail(id: string): Promise<ListingFull | null> {
  if (isSeedId(id)) return null; // tin demo (id số) → trang chi tiết trả 404
  const q = `&id=eq.${encodeURIComponent(id)}&limit=1`;
  // Ưu tiên query CÓ details; nếu lỗi (cột details chưa tạo) → query cơ bản,
  // tin vẫn hiển thị (đặc điểm để trống) thay vì 404.
  let rows = await rest(`select=${COLS_DETAIL}${q}`);
  if (!rows) rows = await rest(`select=${COLS}${q}`);
  if (!rows) {
    const m = getListingById(id); // DB hoàn toàn không sẵn → dữ liệu mẫu
    return m ? mockToDetail(m) : null;
  }
  if (rows.length === 0) return null;
  return rowToDetail(rows[0]);
}
