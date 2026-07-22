// Kiểu dữ liệu + nhãn tiếng Việt cho ADMIN NỘI DUNG (Tin tức + Dự án).
// Hàng thô của bảng `articles` / `projects` (supabase/migrations/0009_articles_projects.sql).

export type ContentStatus = "draft" | "published";

export type ArticleRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  category: string;
  content: string | null;   // mỗi đoạn 1 dòng
  image: string | null;
  status: ContentStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectScaleItem = { label: string; value: string };

export type ProjectRow = {
  id: string;
  slug: string;
  name: string;
  ward: string | null;
  district: string | null;
  province: string | null;
  price_from: string | null;
  type: string | null;
  status_text: string;
  developer: string | null;
  images: string[];
  scale: ProjectScaleItem[];
  amenities: string[];
  overview: string | null;  // mỗi đoạn 1 dòng
  status: ContentStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

// Chuyên mục bài viết (khớp dữ liệu mẫu hiện có trên web)
export const articleCategories = [
  "Phân tích thị trường",
  "Cẩm nang",
  "Đầu tư",
  "Tài chính",
  "Quy hoạch",
  "Dự án",
];

// Trạng thái bán hàng của dự án (huy hiệu trên thẻ dự án)
export const projectStatusOptions = ["Sắp mở bán", "Đang mở bán", "Sắp bàn giao", "Đã bàn giao"];

export function contentStatusLabel(s: ContentStatus): string {
  return s === "published" ? "Đã đăng" : "Nháp";
}

export function contentStatusBadge(s: ContentStatus) {
  const cls =
    s === "published"
      ? "bg-green-50 text-green-700 ring-green-600/20"
      : "bg-slate-100 text-slate-600 ring-slate-500/20";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}>
      {contentStatusLabel(s)}
    </span>
  );
}

// "Căn hộ view sông Hàn" → "can-ho-view-song-han" (slug URL không dấu)
export function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
