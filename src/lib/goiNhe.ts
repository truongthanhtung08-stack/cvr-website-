import type { Listing } from "@/lib/data";
import type { Article } from "@/lib/data";

// ============================================================================
// GÓI NHẸ DỮ LIỆU GỬI XUỐNG TRÌNH DUYỆT — trang danh sách (SEO, chủ dự án 08/10/2026)
//
// Đo 08/10: HTML /mua-ban 798KB, trong đó 498KB là dữ liệu tin gửi kèm cho ListingBrowser
// (mọi ảnh của mọi tin, tin hết hạn của cả mục kia, cả bài viết). Trang nặng → điện thoại
// tải chậm và Google đọc được ít trang hơn mỗi lượt. Chỉ cắt phần CHẮC CHẮN không dùng:
//   · ảnh: thẻ tin chỉ chạy tối đa 6 tấm (AnhChay.tsx `slice(0, 6)`)
//   · tin hết hạn: ListingBrowser chỉ lấy đúng mục đích của trang
//   · bài viết cột phải: chỉ 5 bài, chỉ cần slug + title
// Giữ nguyên mô tả/searchText vì bộ tìm từ khoá cần.
// ============================================================================

export const TOI_DA_ANH_THE = 6;

export function goiNheTin(items: Listing[]): Listing[] {
  return items.map((l) => (l.images && l.images.length > TOI_DA_ANH_THE ? { ...l, images: l.images.slice(0, TOI_DA_ANH_THE) } : l));
}

export function goiNheHetHan(items: Listing[], purpose: "ban" | "thue"): Listing[] {
  return goiNheTin(items.filter((l) => (l.purpose ?? "ban") === purpose));
}

export function goiNheBaiViet(articles: Article[]): Article[] {
  return articles.slice(0, 5).map((a) => ({ slug: a.slug, title: a.title }) as Article);
}
