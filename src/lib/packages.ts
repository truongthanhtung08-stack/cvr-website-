// ===== GÓI DỊCH VỤ (menu "Tiện ích") — dữ liệu rời =====
// V.2: dựng KHUNG trang + menu. Bảng giá/quyền lợi để PLACEHOLDER "Đang cập nhật"
// — chờ chủ dự án cung cấp số liệu thật của CVR rồi điền vào `tierBenefits`.
// Sau này quản lý qua Admin/Supabase. Tham khảo cấu trúc: homedy.com/package.

// --- 3 HẠNG CVR — dùng CHUNG cho gói dịch vụ (V.2) và huy hiệu VIP trên thẻ tin (V.7) ---
export type TierId = "diamond" | "gold" | "silver";

export type Tier = {
  id: TierId;
  name: string; // "CVR Diamond"
  short: string; // nhãn ngắn trên huy hiệu thẻ tin: "Diamond"
  tagline: string; // mô tả ngắn
  accent: string; // màu nhấn của hạng (huy hiệu ảnh + viền trên thẻ)
  titleColor: string; // màu 2 dòng title (bản ĐẬM đủ tương phản WCAG); "" = màu chữ mặc định (silver)
};

// Thứ tự cao → thấp: Diamond > Gold > Silver
export const tiers: Tier[] = [
  { id: "diamond", name: "CVR Diamond", short: "Diamond", tagline: "Ưu tiên hiển thị cao nhất", accent: "#b89254", titleColor: "#8a6d2e" },
  { id: "gold", name: "CVR Gold", short: "Gold", tagline: "Hiển thị nổi bật", accent: "#c9a24a", titleColor: "#946f1f" },
  { id: "silver", name: "CVR Silver", short: "Silver", tagline: "Tiết kiệm, phổ thông", accent: "#9aa0a6", titleColor: "" },
];

// Map huy hiệu tin (VIP/Nổi bật/Mới) → hạng CVR để tô màu thẻ tin (V.7).
export function tierFromBadge(badge?: string): TierId {
  if (badge === "VIP") return "diamond";
  if (badge === "Nổi bật") return "gold";
  return "silver"; // "Mới" hoặc entry-tier
}

export function getTier(id: TierId): Tier {
  return tiers.find((t) => t.id === id) ?? tiers[tiers.length - 1];
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

// Bảng quyền lợi theo hạng — PLACEHOLDER. Khi có số liệu thật:
// điền value cho từng [tierId] tại đây (hoặc tách riêng theo từng gói nếu cần).
export type BenefitRow = {
  label: string; // tên quyền lợi / dòng bảng giá
  values: Record<TierId, string>; // giá trị theo hạng
};

const PENDING: Record<TierId, string> = {
  diamond: "Đang cập nhật",
  gold: "Đang cập nhật",
  silver: "Đang cập nhật",
};

// Khung các dòng quyền lợi mẫu (giá trị chờ điền). Dùng chung cho mọi gói ở bản khung.
export const benefitRows: BenefitRow[] = [
  { label: "Giá gói", values: { ...PENDING } },
  { label: "Thời hạn hiển thị", values: { ...PENDING } },
  { label: "Vị trí ưu tiên", values: { ...PENDING } },
  { label: "Số lượt đẩy tin", values: { ...PENDING } },
  { label: "Huy hiệu VIP", values: { ...PENDING } },
  { label: "Hỗ trợ chuyên viên", values: { ...PENDING } },
];
