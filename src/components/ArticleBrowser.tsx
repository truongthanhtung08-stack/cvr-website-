import Link from "next/link";
import PagedArticleList from "@/components/PagedArticleList";
import type { Article } from "@/lib/data";

// ── DANH SÁCH TIN TỨC 2 CỘT (dùng chung) ─────────────────────────────────────
// Trái: danh sách bài PHÂN TRANG · Phải: "Bài viết được quan tâm" (đánh số).
// Dùng ở trang /tin-tuc và ở khối Tin tức trang chủ khi bấm "Xem thêm" —
// hai chỗ dùng CHUNG component nên không bao giờ lệch cấu trúc.
export default function ArticleBrowser({ articles }: { articles: Article[] }) {
  if (articles.length === 0) return null;
  const [, ...rest] = articles;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      {/* Danh sách bài PHÂN TRANG */}
      <div className="lg:col-span-2">
        <PagedArticleList articles={rest.length ? rest : articles} />
      </div>

      {/* Cột phải: bài viết được quan tâm — đánh số (kiểu Batdongsan) */}
      <aside className="lg:col-span-1">
        <div className="sticky top-24 rounded-none border border-cvr-line bg-white p-5 shadow-lux">
          <h2 className="text-sm font-semibold tracking-tight text-cvr-ink">Bài viết được quan tâm</h2>
          <div className="mt-1 flex flex-col divide-y divide-cvr-line/70">
            {articles.slice(0, 5).map((a, i) => (
              <Link key={a.slug} href={`/tin-tuc/${a.slug}`} className="group flex gap-3 py-3 last:pb-0">
                <span className="w-5 shrink-0 text-lg font-semibold leading-snug text-cvr-faint">{i + 1}</span>
                <span className="line-clamp-2 text-sm font-medium leading-snug text-cvr-ink transition-colors group-hover:text-cvr-blue-ink">
                  {a.title}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
