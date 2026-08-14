import Link from "next/link";

// ── ĐƯỜNG DẪN PHÂN CẤP (breadcrumb) ────────────────────────────────────────
// Hai việc cùng lúc:
//   1) Người dùng thấy mình đang ở đâu và quay lên cấp trên bằng 1 chạm.
//   2) Google đọc JSON-LD BreadcrumbList → hiện đường dẫn phân cấp NGAY DƯỚI
//      tiêu đề trong kết quả tìm kiếm thay vì URL trần (tăng tỷ lệ bấm rõ rệt).
// Mục cuối là trang hiện tại → không bấm được (chuẩn của Google).

export type Crumb = { name: string; href: string };

const SITE = "https://coastalland.vn";

function buildJsonLd(all: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: all.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: `${SITE}${c.href === "/" ? "" : c.href}`,
    })),
  };
}

// Chỉ JSON-LD, KHÔNG hiện gì trên màn hình — dùng cho các trang chi tiết đã
// duyệt bố cục (tin BĐS, dự án, bài viết): Google vẫn hiểu cây phân cấp mà
// giao diện không đổi một pixel nào.
export function BreadcrumbJsonLd({ items }: { items: Crumb[] }) {
  const all: Crumb[] = [{ name: "Trang chủ", href: "/" }, ...items];
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd(all)) }} />
  );
}

export default function Breadcrumb({ items }: { items: Crumb[] }) {
  const all: Crumb[] = [{ name: "Trang chủ", href: "/" }, ...items];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd(all)) }} />
      <nav aria-label="Đường dẫn" className="mx-auto max-w-7xl px-4 pt-3 sm:px-6 lg:px-8">
        <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] text-cvr-muted">
          {all.map((c, i) => {
            const last = i === all.length - 1;
            return (
              <li key={c.href} className="flex items-center gap-1.5">
                {last ? (
                  <span className="font-medium text-cvr-body" aria-current="page">{c.name}</span>
                ) : (
                  <>
                    <Link href={c.href} className="transition-colors hover:text-cvr-ink">{c.name}</Link>
                    <span aria-hidden className="text-cvr-faint">›</span>
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
