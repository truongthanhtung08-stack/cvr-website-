// Kiểu dữ liệu + nhãn tiếng Việt cho ADMIN TIN ĐĂNG (B3).
// Hàng thô của bảng `listings` (supabase/migrations/0002_listings.sql).

export type ListingTier = "diamond" | "gold" | "silver" | "basic";
export type ListingStatus = "draft" | "pending" | "approved" | "rejected" | "hidden" | "expired";
export type ListingPurpose = "ban" | "thue" | "mua" | "can-thue";

// Thuộc tính linh hoạt lưu trong cột details (JSONB) — xem 0006_listing_details.sql
export type ListingDetails = {
  specs?: Record<string, string>;   // đặc điểm theo loại hình (key listingSpec)
  interior?: string[];              // nội thất có sẵn
  amenities?: string[];             // tiện ích
  legal?: string;                   // pháp lý
  furnish?: string;                 // mức nội thất
  direction?: string;               // hướng
  addressDetail?: string;           // địa chỉ cụ thể
  mapPin?: string;                  // toạ độ / link Google Maps admin ghim tay
  // Phường/xã CŨ — chỉ có khi một phường mới gộp nhiều phường cũ nên máy không
  // suy ngược ra được; người đăng (hoặc file nhập tin) chỉ đích danh. Nhờ nó mà
  // dòng "Địa chỉ hệ cũ" trên trang tin đủ 3 cấp. Xem ungVienPhuongCu().
  diaChiCu?: { phuong?: string; quan?: string; tinh?: string };
  // m² SÀN SUY RA từ nội dung tin ("nhà 3 tầng" × m² đất) — chỉ để THỐNG KÊ và
  // tính đơn giá (luôn kèm dấu ≈). KHÔNG ghi đè built_area_m2, vì ô "Diện tích
  // xây dựng" trên trang tin là số người đăng KHAI. Xem scripts/bu-dien-tich-xay-dung.mjs
  dtSanUocTinh?: number;
  dtSanNguon?: string;
  // Đơn giá mỗi m² do chính NGƯỜI BÁN niêm yết (đồng/m²) — có thì trang tin hiện,
  // không có thì thôi, web không tự chia tổng giá ra. Xem listingsDb.ts.
  donGiaBan?: number;
  places?: { category: string; name: string; distance: string }[]; // tiện ích xung quanh
  contact?: { name?: string; phone?: string; email?: string; avatar?: string }; // người đăng (avatar = ảnh đại diện)
  project?: string;                 // SLUG dự án tin này thuộc về ("" = không thuộc dự án nào)
  projectName?: string;             // TÊN dự án nguyên văn — dự án chưa được tạo trên web vẫn giữ được tên
  ly_do_tu_choi?: string;           // admin ghi khi từ chối — khách đọc để biết cần sửa gì
  tu_choi_luc?: string;             // thời điểm từ chối (ISO)
  plan?: { tier?: string; days?: number; giaBao?: number }; // gói khách CHỌN lúc đăng (chờ duyệt mới dùng tới)
};

export type ListingRow = {
  id: string;
  owner_id: string | null;
  purpose: ListingPurpose;
  type: string;
  title: string;
  description: string | null;
  price_vnd: number | null;
  area_m2: number | null;        // diện tích đất
  built_area_m2: number | null;  // diện tích xây dựng
  beds: number | null;
  baths: number | null;
  ward: string | null;
  district: string | null;
  province: string;
  lat: number | null;
  lng: number | null;
  images: string[];
  details: ListingDetails | null;
  tier: ListingTier;
  tier_expires_at: string | null;
  tier_yeu_cau?: ListingTier | null; // gói khách đăng ký (migration 0017) — dùng khi tin chưa duyệt
  tier_days?: number | null;         // thời hạn gói khách chọn: 7 · 15 · 30
  bumped_at?: string | null;         // lần đẩy tin gần nhất (0034) — không liên quan tới ngày đăng
  bump_credits?: number | null;     // kho lượt đẩy đã mua theo gói (0035)
  bump_auto?: boolean | null;       // tự đẩy vào khung giờ vàng
  bump_lich?: string | null;        // hang_ngay | cuoi_tuan
  status: ListingStatus;
  published_at: string | null;
  expires_at: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
};

export function purposeLabel(p: ListingPurpose): string {
  return { ban: "Mua bán", thue: "Cho thuê", mua: "Cần mua", "can-thue": "Cần thuê" }[p] ?? "Mua bán";
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

// ── GÓI ĐANG DÙNG CỦA MỘT TIN ───────────────────────────────────────────────
// Khách trả tiền theo CẤP × SỐ NGÀY nên phải thấy đúng cả hai, cộng với mốc
// đăng và mốc hết hạn. Trước đây trang "Tin đăng của tôi" không hiện gì cả:
// khách mua CVR Gold 15 ngày mà nhìn vào không biết mình đang ở gói nào, còn
// mấy ngày — đúng phần dính tiền lại là phần mù nhất.
//
// Tin ĐÃ DUYỆT đọc cột thật (`tier`, `tier_expires_at`); tin CHƯA DUYỆT đọc
// gói khách đăng ký (`tier_yeu_cau`/`details.plan`) vì cột thật chưa được ghi.
export type ThongTinGoi = {
  cap: ListingTier;      // cấp để vẽ huy hiệu
  tenGoi: string;        // "CVR Gold"
  soNgay: number | null; // 7 · 15 · 30 (null = không rõ)
  daDuyet: boolean;      // true = đang chạy gói thật, false = mới đăng ký
  hetHan: Date | null;   // mốc hết hạn hiển thị
  conLai: number | null; // số ngày còn lại (âm = đã hết hạn)
};

export function thongTinGoi(r: ListingRow): ThongTinGoi {
  const daDuyet = r.status === "approved";
  const capDangKy = (r.tier_yeu_cau ?? (r.details?.plan?.tier as ListingTier | undefined) ?? r.tier) as ListingTier;
  const cap = daDuyet ? r.tier : capDangKy;
  const hetHan = r.tier_expires_at ? new Date(r.tier_expires_at) : null;

  // Số ngày: ưu tiên con số khách đã chọn; không có thì suy ra từ hai mốc thật.
  let soNgay = r.tier_days ?? r.details?.plan?.days ?? null;
  if (soNgay == null && hetHan && r.published_at) {
    soNgay = Math.round((hetHan.getTime() - new Date(r.published_at).getTime()) / 86_400_000);
  }

  const conLai = hetHan ? Math.ceil((hetHan.getTime() - Date.now()) / 86_400_000) : null;
  return { cap, tenGoi: `CVR ${tierLabel(cap)}`, soNgay, daDuyet, hetHan, conLai };
}

// "17/09/2026" — mốc ngày cho khách đọc.
export function ngayGon(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("vi-VN");
}

export function listingStatusLabel(s: ListingStatus): string {
  return {
    draft: "Nháp",
    pending: "Chờ duyệt",
    approved: "Đang đăng",
    rejected: "Từ chối",
    hidden: "Đã ẩn",
    expired: "Hết hạn",
  }[s];
}

export function listingStatusBadge(s: ListingStatus) {
  const cls = {
    draft: "bg-slate-100 text-slate-600 ring-slate-500/20",
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
