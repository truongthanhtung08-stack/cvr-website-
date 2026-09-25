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
  // ── BA TRƯỜNG DƯỚI ĐÂY LÀ CƠ CHẾ, KHÔNG PHẢI TRANG TRÍ ───────────────────
  // Lấy đúng bảng "CẤP ĐỘ VIP · HỆ SỐ TIẾP CẬN · VỊ TRÍ HIỂN THỊ · ĐẶC ĐIỂM
  // TRỰC QUAN" trong tài liệu cơ chế hiển thị của chủ dự án. Mọi nơi nói về
  // quyền lợi gói (trang báo giá, form đăng tin, bảng so sánh) PHẢI đọc từ đây
  // — trước kia mỗi trang chép một kiểu nên web hứa x20/x10/x5 trong khi cơ
  // chế thật là X30/X15/X8.
  heSo: number; // hệ số tiếp cận: 30 · 15 · 8 · 1 (tin thường = cơ sở)
  heSoText: string; // dạng hiển thị cho khách: "X30" … "Cơ sở (1x)"
  viTri: string; // vị trí hiển thị theo bảng cơ chế
  nhanDien: string; // đặc điểm trực quan theo bảng cơ chế
};

// Thứ tự cao → thấp: Diamond > Gold > Silver > Basic
export const tiers: Tier[] = [
  {
    id: "diamond", name: "CVR Diamond", short: "Diamond",
    tagline: "Ưu tiên hiển thị cao nhất — hệ số tiếp cận X30",
    accent: "#c1121f", badgeText: "#ffffff", bar: "#c1121f", titleColor: "", uppercase: true, hot: true, rank: 0,
    heSo: 30, heSoText: "X30",
    viTri: "Đỉnh trang — từ vị trí số 1 đến hết hàng đầu tiên của kết quả tìm kiếm",
    nhanDien: "Dải nhấn đỉnh thẻ, huy hiệu độc quyền, tiêu đề VIẾT HOA, 3 dòng mô tả",
  },
  {
    id: "gold", name: "CVR Gold", short: "Gold",
    tagline: "Hiển thị nổi bật — hệ số tiếp cận X15",
    accent: "#b8860b", badgeText: "#ffffff", bar: "#d9b84e", titleColor: "", uppercase: true, hot: true, rank: 1,
    heSo: 15, heSoText: "X15",
    viTri: "Ngay dưới tầng Kim Cương, trong nửa trên màn hình đầu tiên",
    nhanDien: "Dải nhấn vàng, huy hiệu nhận diện, tiêu đề VIẾT HOA, 2 dòng mô tả",
  },
  {
    id: "silver", name: "CVR Silver", short: "Silver",
    tagline: "Tiết kiệm hiệu quả — hệ số tiếp cận X8",
    accent: "#2f5d84", badgeText: "#ffffff", bar: "#7ea6c8", titleColor: "", uppercase: false, hot: true, rank: 2,
    heSo: 8, heSoText: "X8",
    viTri: "Tiếp dưới nhóm Vàng, trước phân khúc tin thường",
    nhanDien: "Dải nhấn xanh, nhãn phân biệt, tiêu đề in đậm, 1 dòng mô tả",
  },
  {
    id: "basic", name: "CVR Basic", short: "Basic",
    tagline: "Tin thường — hiển thị theo thời gian đăng",
    accent: "#9aa0a6", badgeText: "#ffffff", bar: "", titleColor: "", uppercase: false, hot: false, rank: 3,
    heSo: 1, heSoText: "Cơ sở (1x)",
    viTri: "Dưới các tầng VIP, xếp thuần theo thời gian đăng",
    nhanDien: "Trình bày mặc định, không dải nhấn, không huy hiệu",
  },
];

// ── SUẤT GHIM ĐẦU TRANG (Position Pinning) ─────────────────────────────────
// Tài liệu cơ chế: "các vị trí index từ 1 đến N thuộc về nhóm VIP Kim Cương và
// Vàng; tin mới đăng dạng thường hoàn toàn không thể chen chân vào".
// Quy ra bố cục thật của web: lưới PC 4 thẻ một hàng →
//   · Kim Cương: 4 suất = trọn HÀNG ĐẦU TIÊN ("từ vị trí số 1 đến hết hàng đầu")
//   · Vàng:      4 suất kế = hàng thứ hai, vẫn trong nửa trên màn hình đầu
// Đây là suất ĐẢM BẢO, không phải mức trần: dư tin VIP thì vẫn đứng trước tiếp.
// Thiếu tin VIP thì lấp bằng cấp thấp hơn để trang không hở.
export const SUAT_GHIM = { diamond: 4, gold: 4 } as const;

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
    label: "Giá đất Nhà nước",
    title: "Tra cứu giá đất Nhà nước",
    description:
      "Giá đất theo quyết định của UBND tỉnh — căn cứ tính thuế trước bạ, phí công chứng và thuế thu nhập khi chuyển nhượng.",
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

// Lấy một thuộc tính CƠ CHẾ của cả 4 cấp thành một dòng bảng.
export function theoCap(lay: (t: Tier) => string): Record<TierId, string> {
  return {
    diamond: lay(getTier("diamond")),
    gold: lay(getTier("gold")),
    silver: lay(getTier("silver")),
    basic: lay(getTier("basic")),
  };
}

export const benefitRows: BenefitRow[] = [
  // GIÁ KHÔNG VIẾT Ở ĐÂY NỮA (bỏ 25/09/2026): 3 dòng "Đơn giá 1 tuần / Gói 2 tuần /
  // Gói 4 tuần" viết cứng 980.000 đ… đã lệch bảng giá thật. Trang /tien-ich đọc
  // giá từ billing (cùng nguồn trang Bảng giá) qua priceLinesFor.
  // BA DÒNG CƠ CHẾ — đọc thẳng từ `tiers` ở đầu file, KHÔNG chép tay lại.
  // Chép tay chính là lý do bảng này từng ghi "gấp 20 lần" và "huy hiệu đen chữ
  // vàng kim" trong khi cơ chế thật là X30 và huy hiệu đỏ.
  {
    label: "Hệ số tiếp cận",
    values: theoCap((t) => t.heSoText),
  },
  {
    label: "Vị trí hiển thị",
    values: theoCap((t) => t.viTri),
  },
  {
    label: "Nội dung trên thẻ tin",
    values: { diamond: "3 dòng mô tả", gold: "2 dòng", silver: "1 dòng", basic: "Không" },
  },
  {
    label: "Nhận diện thẻ tin",
    values: theoCap((t) => t.nhanDien),
  },
  // ĐẤT VÀNG — nói đúng cái web làm được, không hứa độc quyền.
  // Cơ chế: N suất đầu mỗi trang danh sách dành cho nhóm VIP (SUAT_GHIM bên
  // dưới) — hàng 1 Kim Cương, hàng 2 Vàng. Tin thường KHÔNG chen vào được.
  // Nhưng khi chưa đủ tin VIP, phần trống được lấp bằng cấp thấp hơn để trang
  // không bị hở — nên chữ phải là "đảm bảo suất", không phải "chỉ Diamond mới
  // được lên trang chủ" (điều đó không đúng với cái đang chạy).
  {
    label: "Suất đảm bảo trên Trang chủ",
    values: {
      diamond: `${SUAT_GHIM.diamond} suất hàng đầu`,
      gold: `${SUAT_GHIM.gold} suất kế tiếp`,
      silver: "Sau nhóm VIP",
      basic: "Sau cùng, theo thời gian",
    },
  },
  {
    label: "Box “Bất động sản nổi bật”",
    values: { diamond: "Ưu tiên 1", gold: "Ưu tiên 2", silver: "Khi còn chỗ", basic: "Khi còn chỗ" },
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
