// ===== GÓI DỊCH VỤ (menu "Tiện ích") — dữ liệu rời =====
// V.2: dựng KHUNG trang + menu. Bảng giá/quyền lợi để PLACEHOLDER "Đang cập nhật"
// — chờ chủ dự án cung cấp số liệu thật của CVR rồi điền vào `tierBenefits`.
// Sau này quản lý qua Admin/Supabase. Tham khảo cấu trúc: homedy.com/package.

// --- 4 CẤP TIN CVR — theo bảng "Giá đăng tin + QC" (D:\Coastal Land\Bảng giá truyền thông) ---
// THANG NHẬN DIỆN KIM LOẠI (chốt 4/9/2026) — sang hơn, ĐỒNG NHẤT mọi nơi (trang chủ,
// Mua bán/Cho thuê, chi tiết). Nội dung theo cấp: Kim Cương 3 dòng · Vàng 2 · Bạc 1 · Thường 0.
// Mỗi cấp MỘT màu riêng ở HUY HIỆU + DẢI đỉnh thẻ để phân biệt bằng mắt.
// TIÊU ĐỀ để ĐEN hết (dễ đọc + sang, đúng hướng Apple) — KHÔNG tô màu chữ theo cấp.
//   Diamond (Kim Cương): ĐỎ — cao nhất.
//   Gold (Vàng): VÀNG.
//   Silver (Bạc): XANH.
//   Basic (tin thường): trơn, không huy hiệu/dải.
export type TierId = "diamond" | "gold" | "silver" | "basic";

export type Tier = {
  id: TierId;
  name: string; // "CVR Diamond"
  short: string; // nhãn ngắn trên huy hiệu thẻ tin: "Diamond"
  tagline: string; // mô tả ngắn
  accent: string; // màu NỀN huy hiệu cấp (trên ảnh)
  badgeText: string; // màu CHỮ trên huy hiệu (Kim Cương = vàng kim trên nền đen)
  bar: string; // dải nhấn mảnh trên đỉnh thẻ ("" = không có; hiện chỉ Kim Cương)
  titleColor: string; // màu tiêu đề tin (đủ tương phản WCAG trên nền trắng); "" = màu mặc định
  uppercase: boolean; // tiêu đề VIẾT HOA (chỉ Diamond & Gold)
  hot: boolean; // hiện icon HOT cạnh tiêu đề (các cấp VIP)
  rank: number; // thứ hạng sắp xếp: nhỏ = đứng trước
};

// Thứ tự cao → thấp: Diamond > Gold > Silver > Basic
export const tiers: Tier[] = [
  { id: "diamond", name: "CVR Diamond", short: "Diamond", tagline: "Ưu tiên hiển thị cao nhất — x20 lượt xem", accent: "#c1121f", badgeText: "#ffffff", bar: "#c1121f", titleColor: "", uppercase: true, hot: true, rank: 0 },
  { id: "gold", name: "CVR Gold", short: "Gold", tagline: "Hiển thị nổi bật — x10 lượt xem", accent: "#b8860b", badgeText: "#ffffff", bar: "#d9b84e", titleColor: "", uppercase: true, hot: true, rank: 1 },
  { id: "silver", name: "CVR Silver", short: "Silver", tagline: "Tiết kiệm hiệu quả — x5 lượt xem", accent: "#2f5d84", badgeText: "#ffffff", bar: "#7ea6c8", titleColor: "", uppercase: false, hot: true, rank: 2 },
  { id: "basic", name: "CVR Basic", short: "Basic", tagline: "Tin thường, chi phí thấp nhất", accent: "#9aa0a6", badgeText: "#ffffff", bar: "", titleColor: "", uppercase: false, hot: false, rank: 3 },
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
export type PkgKind = "service" | "tool";

export type Pkg = {
  slug: string;
  label: string; // nhãn trên menu Tiện ích
  title: string; // tiêu đề trang
  description: string; // mô tả ngắn dưới tiêu đề
  icon: PkgIcon; // key icon (vẽ trong component)
  kind: PkgKind;
};

export type PkgIcon = "post" | "boost" | "project" | "pr" | "banner";

export const packages: Pkg[] = [
  {
    slug: "goi-dang-tin",
    label: "Gói Đăng tin",
    title: "Gói Đăng tin",
    description: "Đăng tin bất động sản theo hạng CVR — hiển thị đúng đối tượng, tối ưu lượt xem.",
    icon: "post",
    kind: "service",
  },
  {
    slug: "goi-day-tin",
    label: "Gói Đẩy tin",
    title: "Gói Đẩy tin (Up tin)",
    description: "Đẩy tin lên đầu danh sách, làm mới thời gian đăng để luôn nằm trong tầm mắt người mua.",
    icon: "boost",
    kind: "service",
  },
  {
    slug: "goi-du-an",
    label: "Gói Dự án",
    title: "Gói Dự án",
    description: "Trang dự án riêng cho chủ đầu tư/đại lý — trình bày tổng thể, mặt bằng, tiến độ.",
    icon: "project",
    kind: "service",
  },
  {
    slug: "goi-bai-pr",
    label: "Gói bài PR",
    title: "Gói bài PR",
    description: "Bài viết truyền thông trên chuyên mục Tin tức — tăng độ tin cậy & nhận diện thương hiệu.",
    icon: "pr",
    kind: "service",
  },
  {
    slug: "goi-banner",
    label: "Gói Banner",
    title: "Gói Banner quảng cáo",
    description: "Vị trí banner nổi bật trên trang chủ và các trang danh sách — tiếp cận diện rộng.",
    icon: "banner",
    kind: "service",
  },
];

export const utilityTools: Pkg[] = [
  {
    slug: "so-sanh-nha-dat",
    label: "So sánh nhà đất",
    title: "So sánh nhà đất",
    description: "So sánh nhanh các tin bất động sản theo khu vực, giá và diện tích.",
    icon: "post",
    kind: "tool",
  },
  {
    slug: "gia-nha-dat",
    label: "Giá nhà đất",
    title: "Giá nhà đất",
    description: "Theo dõi và tra cứu xu hướng giá nhà đất theo khu vực.",
    icon: "boost",
    kind: "tool",
  },
  {
    slug: "bao-cao-thi-truong-bds",
    label: "Báo cáo thị trường BĐS",
    title: "Báo cáo thị trường BĐS",
    description: "Cập nhật tình hình thị trường bất động sản Miền Trung theo thời điểm.",
    icon: "project",
    kind: "tool",
  },
  {
    slug: "tinh-lai-suat-vay",
    label: "Tính lãi suất vay",
    title: "Tính lãi suất vay",
    description: "Công cụ tính toán lãi suất vay mua nhà, đầu tư và tài chính.",
    icon: "pr",
    kind: "tool",
  },
  {
    slug: "thu-vien-phap-luat",
    label: "Thư viện pháp luật",
    title: "Thư viện pháp luật",
    description: "Kho tư liệu pháp luật liên quan đến giao dịch bất động sản.",
    icon: "banner",
    kind: "tool",
  },
  {
    slug: "xem-phong-thuy",
    label: "Xem phong thủy",
    title: "Xem phong thủy",
    description: "Hướng dẫn xem phong thủy cho nhà ở và đất nền theo nguyên tắc cơ bản.",
    icon: "post",
    kind: "tool",
  },
];

export function getPackage(slug: string): Pkg | undefined {
  return [...packages, ...utilityTools].find((p) => p.slug === slug);
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
    label: "Nội dung trên thẻ tin",
    values: { diamond: "3 dòng mô tả", gold: "2 dòng", silver: "1 dòng", basic: "Không" },
  },
  {
    label: "Nhận diện thẻ tin",
    values: {
      diamond: "Kim Cương · dải vàng + huy hiệu đen chữ vàng kim · VIẾT HOA",
      gold: "Vàng · dải vàng + huy hiệu vàng · VIẾT HOA",
      silver: "Bạc · dải bạc + huy hiệu bạc · in đậm",
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
