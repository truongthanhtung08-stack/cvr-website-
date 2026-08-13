// Kiểu dữ liệu + nhãn tiếng Việt cho ADMIN NỘI DUNG (Tin tức + Dự án).
// Hàng thô của bảng `articles` / `projects` (supabase/migrations/0009_articles_projects.sql).

// 'pending' = KHÁCH HÀNG (Chủ đầu tư/phân phối) đã gửi dự án, CHỜ QUẢN TRỊ DUYỆT.
// Khác 'draft' (nháp của chính người tạo, chưa gửi đi đâu cả).
export type ContentStatus = "draft" | "pending" | "published";

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

// ── Dữ liệu cấu trúc mới của dự án (lưu trong cột JSONB `details`) ──────────────
export type ProjectPurpose = "ban" | "thue";
export type ProjectPriceRow = { unit: string; area: string; direction: string; price: string };
export type ProjectFloorPlan = { label: string; image: string; note: string };
export type ProjectPlace = { category: string; name: string; distance: string };
export type ProjectDeveloperInfo = { established?: string; website?: string; desc?: string; logo?: string };

// Cấp dự án (CVR-PJ) — quyết định thứ tự hiển thị slide dự án ở trang chủ,
// tương ứng bảng giá "Gói Dự án": Diamond > Gold > Silver > Basic.
export type ProjectTier = "diamond" | "gold" | "silver" | "basic";

// Thông tin liên hệ của dự án — admin nhập; KHÔNG nhập thì trang dự án
// không hiện khối liên hệ (không bịa số tổng đài).
export type ProjectContact = { name?: string; phone?: string; email?: string };

export type ProjectDetails = {
  tier?: ProjectTier;                     // cấp CVR-PJ (mặc định basic)
  addressDetail?: string;                 // ĐỊA CHỈ CỤ THỂ: số nhà, đường, khu — hiện trên trang dự án
  purposes?: ProjectPurpose[];            // Bán / Cho thuê
  priceMode?: "show" | "hidden";          // hiện giá cụ thể / ẩn giá (mặc định) → "Liên hệ"
  priceTable?: ProjectPriceRow[];         // Loại căn – Diện tích – Hướng – Giá
  floorPlans?: ProjectFloorPlan[];        // Mặt bằng từng tháp/tầng/loại căn
  places?: ProjectPlace[];                // Tiện ích xung quanh (có khoảng cách)
  developerInfo?: ProjectDeveloperInfo;   // Chủ đầu tư (thông tin mở rộng)
  contact?: ProjectContact;               // Liên hệ dự án (SĐT, email…)
};

// Nhãn cấp dự án cho form admin
export const projectTierOptions: { id: ProjectTier; label: string }[] = [
  { id: "diamond", label: "CVR-PJ Diamond" },
  { id: "gold", label: "CVR-PJ Gold" },
  { id: "silver", label: "CVR-PJ Silver" },
  { id: "basic", label: "Không xếp cấp (thường)" },
];

// Nhóm tiện ích xung quanh (đối chiếu Batdongsan) — cho form + biểu tượng
export const placeCategories = [
  "Sân bay",
  "Trường học",
  "Siêu thị",
  "Công viên",
  "Bệnh viện",
  "Nhà hàng",
  "Trung tâm thương mại",
  "Bến xe / Ga",
  "Bãi biển",
  "Khác",
];

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
  details: ProjectDetails | null;  // dữ liệu cấu trúc mới (cột JSONB)
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
// Tình trạng dự án — admin chọn trực tiếp, thanh "Tiến độ dự án" ở trang chi tiết
// tự nhảy theo (xem currentStep trong app/du-an/[slug]/page.tsx).
export const projectStatusOptions = [
  "Chưa mở bán",
  "Sắp mở bán",
  "Đang mở bán",
  "Đã hoàn thành",
  "Sắp bàn giao",
  "Đã bàn giao",
];

export function contentStatusLabel(s: ContentStatus): string {
  return s === "published" ? "Đã đăng" : s === "pending" ? "Chờ duyệt" : "Nháp";
}

export function contentStatusBadge(s: ContentStatus) {
  const cls =
    s === "published"
      ? "bg-green-50 text-green-700 ring-green-600/20"
      : s === "pending"
        ? "bg-amber-50 text-amber-700 ring-amber-600/20"
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
