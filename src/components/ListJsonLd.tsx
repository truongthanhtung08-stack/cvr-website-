import type { Listing, Project } from "@/lib/data";

const SITE = "https://coastalland.vn";

// ============================================================================
// DANH SÁCH CÓ CẤU TRÚC (ItemList) cho các trang /mua-ban · /cho-thue · /du-an
// ----------------------------------------------------------------------------
// Vì sao cần: với Google, trang danh sách chỉ là "một trang có nhiều chữ". Khai
// ItemList là nói rõ: đây là DANH MỤC gồm N bất động sản, thứ tự thế này, mỗi
// mục là một trang riêng. Nhờ đó Google:
//   · biết đường bò xuống từng tin (không phụ thuộc mỗi sitemap),
//   · hiểu trang này là trang danh mục — dạng trang nó ưu tiên cho truy vấn
//     kiểu "nhà đất Đà Nẵng", "cho thuê căn hộ Huế",
//   · có cơ hội hiện dạng kết quả danh sách kèm ảnh.
// Chỉ khai 20 mục đầu: đủ để Google hiểu cấu trúc, không phình HTML.
// ============================================================================

const tuyetDoi = (u?: string) => (!u ? undefined : u.startsWith("http") ? u : `${SITE}${u}`);

export function ListingListJsonLd({ items, heading, path }: { items: Listing[]; heading: string; path: string }) {
  if (items.length === 0) return null;
  const data = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: heading,
    numberOfItems: items.length,
    itemListOrder: "https://schema.org/ItemListOrderDescending",
    url: `${SITE}${path}`,
    itemListElement: items.slice(0, 20).map((l, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE}/bat-dong-san/${l.id}`,
      name: l.title,
      image: tuyetDoi(l.image),
    })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export function ProjectListJsonLd({ items, heading, path }: { items: Project[]; heading: string; path: string }) {
  if (items.length === 0) return null;
  const data = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: heading,
    numberOfItems: items.length,
    url: `${SITE}${path}`,
    itemListElement: items.slice(0, 20).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE}/du-an/${p.slug}`,
      name: p.name,
      image: tuyetDoi(p.image),
    })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
