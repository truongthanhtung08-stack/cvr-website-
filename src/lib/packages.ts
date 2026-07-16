// ===== GÓI DỊCH VỤ (menu "Tiện ích") — dữ liệu rời =====
// V.2: dựng KHUNG trang + menu. Bảng giá/quyền lợi để PLACEHOLDER "Đang cập nhật"
// — chờ chủ dự án cung cấp số liệu thật của CVR rồi điền vào `tierBenefits`.
// Sau này quản lý qua Admin/Supabase. Tham khảo cấu trúc: homedy.com/package.

// --- 4 CẤP TIN CVR — theo bảng "Gia đăng tin + QC" (D:\Coastal Land\Bảng giá truyền thông) ---
// Chuẩn hiển thị tham chiếu Batdongsan/Homedy:
//   Diamond (VIP Kim Cương): tiêu đề ĐỎ + VIẾT HOA + đậm + icon HOT đỏ — x20 lượt xem,
//     lên Trang chủ, box "BĐS nổi bật", nhân đôi hiển thị, kích thước tin rất lớn.
//   Gold (VIP Vàng): tiêu đề VÀNG + VIẾT HOA + đậm + icon HOT vàng — x10 lượt xem, box nổi bật.
//   Silver (VIP Bạc): tiêu đề XANH + đậm (không viết hoa) — x5 lượt xem, đứng trên tin thường.
//   Basic (tin thường): hiển thị mặc định, nằm dưới các tin cao cấp.
export type TierId = "diamond" | "gold" | "silver" | "basic";

export type Tier = {
  id: TierId;
  name: string; // "CVR Diamond"
  short: string; // nhãn ngắn trên huy hiệu thẻ tin: "Diamond"
  tagline: string; // mô tả ngắn
  accent: string; // màu nhấn của hạng (huy hiệu ảnh + icon HOT)
  titleColor: string; // màu tiêu đề tin (đủ tương phản WCAG trên nền trắng); "" = màu mặc định
  uppercase: boolean; // tiêu đề VIẾT HOA (chỉ Diamond & Gold)
  hot: boolean; // hiện icon HOT cạnh tiêu đề (các cấp VIP)
  rank: number; // thứ hạng sắp xếp: nhỏ = đứng trước
};

// Thứ tự cao → thấp: Diamond > Gold > Silver > Basic
export const tiers: Tier[] = [
  { id: "diamond", name: "CVR Diamond", short: "Diamond", tagline: "Ưu tiên hiển thị cao nhất — x20 lượt xem", accent: "#d7263d", titleColor: "#c41f30", uppercase: true, hot: true, rank: 0 },
  { id: "gold", name: "CVR Gold", short: "Gold", tagline: "Hiển thị nổi bật — x10 lượt xem", accent: "#c9a24a", titleColor: "#946f1f", uppercase: true, hot: true, rank: 1 },
  { id: "silver", name: "CVR Silver", short: "Silver", tagline: "Tiết kiệm hiệu quả — x5 lượt xem", accent: "#0071e3", titleColor: "#0066cc", uppercase: false, hot: true, rank: 2 },
  { id: "basic", name: "CVR Basic", short: "Basic", tagline: "Tin thường, chi phí thấp nhất", accent: "#9aa0a6", titleColor: "", uppercase: false, hot: false, rank: 3 },
];

// Map huy hiệu tin (VIP/Nổi bật/Mới) → cấp CVR để tô màu thẻ tin.
// (Dữ liệu mẫu dùng badge; khi có bảng listings thật (B2) sẽ dùng thẳng cột tier.)
export function tierFromBadge(badge?: string): TierId {
  if (badge === "VIP") return "diamond";
  if (badge === "Nổi bật") return "gold";
  if (badge === "Mới") return "silver";
  return "basic";
}

export function getTier(id: TierId): Tier {
  return tiers.find((t) => t.id === id) ?? tiers[tiers.length - 1];
}

// Thứ hạng để sắp xếp danh sách tin: Diamond → Gold → Silver → Basic.
export function tierRank(badge?: string): number {
  return getTier(tierFromBadge(badge)).rank;
}

// --- 5 GÓI DỊCH VỤ (đúng menu spec V.2) ---
export type Pkg = {
  slug: string;
  label: string; // nhãn trên menu Tiện ích
  title: string; // tiêu đề trang
  description: string; // mô tả ngắn dưới tiêu đề
  icon: PkgIcon; // key icon (vẽ trong component)
};

export type PkgIcon = "post" | "boost" | "project" | "pr" | "banner";

export const packages: Pkg[] = [
  {
    slug: "goi-dang-tin",
    label: "Gói Đăng tin",
    title: "Gói Đăng tin",
    description: "Đăng tin bất động sản theo hạng CVR — hiển thị đúng đối tượng, tối ưu lượt xem.",
    icon: "post",
  },
  {
    slug: "goi-day-tin",
    label: "Gói Đẩy tin",
    title: "Gói Đẩy tin (Up tin)",
    description: "Đẩy tin lên đầu danh sách, làm mới thời gian đăng để luôn nằm trong tầm mắt người mua.",
    icon: "boost",
  },
  {
    slug: "goi-du-an",
    label: "Gói Dự án",
    title: "Gói Dự án",
    description: "Trang dự án riêng cho chủ đầu tư/đại lý — trình bày tổng thể, mặt bằng, tiến độ.",
    icon: "project",
  },
  {
    slug: "goi-bai-pr",
    label: "Gói bài PR",
    title: "Gói bài PR",
    description: "Bài viết truyền thông trên chuyên mục Tin tức — tăng độ tin cậy & nhận diện thương hiệu.",
    icon: "pr",
  },
  {
    slug: "goi-banner",
    label: "Gói Banner",
    title: "Gói Banner quảng cáo",
    description: "Vị trí banner nổi bật trên trang chủ và các trang danh sách — tiếp cận diện rộng.",
    icon: "banner",
  },
];

export function getPackage(slug: string): Pkg | undefined {
  return packages.find((p) => p.slug === slug);
}

// Bảng giá & quyền lợi theo cấp tin — số liệu THẬT từ file "Gia đăng tin + QC"
// (D:\Coastal Land\Bảng giá truyền thông, cập nhật 15/7/2026).
export type BenefitRow = {
  label: string; // tên quyền lợi / dòng bảng giá
  values: Record<TierId, string>; // giá trị theo cấp
};

export const benefitRows: BenefitRow[] = [
  {
    label: "Đơn giá 1 tuần",
    values: { diamond: "980.000 đ", gold: "490.000 đ", silver: "170.000 đ", basic: "15.000 đ" },
  },
  {
    label: "Gói 2 tuần",
    values: { diamond: "1.700.000 đ (−15%)", gold: "800.000 đ (−20%)", silver: "300.000 đ (−15%)", basic: "20.000 đ" },
  },
  {
    label: "Gói 4 tuần",
    values: { diamond: "2.800.000 đ (−30%)", gold: "1.300.000 đ (−35%)", silver: "500.000 đ (−30%)", basic: "30.000 đ" },
  },
  {
    label: "Lượt xem so với tin thường",
    values: { diamond: "Gấp 20 lần", gold: "Gấp 10 lần", silver: "Gấp 5 lần", basic: "—" },
  },
  {
    label: "Kích thước tin đăng",
    values: { diamond: "Rất lớn", gold: "Lớn", silver: "Trung bình", basic: "Nhỏ nhất" },
  },
  {
    label: "Tiêu đề tin",
    values: {
      diamond: "Đỏ · VIẾT HOA · đậm · icon HOT",
      gold: "Vàng · VIẾT HOA · đậm · icon HOT",
      silver: "Xanh · đậm · icon HOT",
      basic: "Mặc định",
    },
  },
  {
    label: "Xuất hiện Trang chủ",
    values: { diamond: "✓", gold: "—", silver: "—", basic: "—" },
  },
  {
    label: "Box “Bất động sản nổi bật”",
    values: { diamond: "✓", gold: "✓", silver: "—", basic: "—" },
  },
  {
    label: "Ưu tiên hiển thị & duyệt sớm",
    values: { diamond: "✓", gold: "✓", silver: "✓", basic: "—" },
  },
  {
    label: "Không hiển thị quảng cáo ở trang tin",
    values: { diamond: "✓", gold: "✓", silver: "—", basic: "—" },
  },
  {
    label: "Nhân đôi hiển thị (tặng 1 tin thường)",
    values: { diamond: "✓", gold: "—", silver: "—", basic: "—" },
  },
  {
    label: "Chèn link dưới tin đăng",
    values: { diamond: "✓ (1 link)", gold: "—", silver: "—", basic: "—" },
  },
];
