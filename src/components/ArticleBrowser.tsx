"use client";

import { useDiaDanh } from "@/lib/useDiaDanh";
import Link from "next/link";
import PagedArticleList from "@/components/PagedArticleList";
import Highlight from "@/components/Highlight";
import { searchAny } from "@/lib/smartSearch";
import type { Article } from "@/lib/data";

// ── DANH SÁCH TIN TỨC 2 CỘT (dùng chung) ─────────────────────────────────────
// Trái: danh sách bài PHÂN TRANG · Phải: "Bài viết được quan tâm" (đánh số).
// Dùng ở trang /tin-tuc và ở khối Tin tức trang chủ khi bấm "Xem thêm" —
// hai chỗ dùng CHUNG component nên không bao giờ lệch cấu trúc.
export default function ArticleBrowser({ articles }: { articles: Article[] }) {
  useDiaDanh(); // địa danh nạp sau khi trang hiện — về tới thì vẽ lại (20/10/2026)
  // BỎ Ô TÌM BÀI VIẾT (chủ dự án 02/11/2026: "trang tin tức không cần bộ lọc, xoá đi") — danh sách giữ đúng thứ tự như khi ô trống
  const q = "";
  const hits = searchAny(articles, q, {
    ten: (a) => a.title,                                   // khớp ở tiêu đề ăn điểm cao nhất
    hay: (a) => `${a.title} ${a.excerpt} ${a.category}`,
  });
  const ketQua = hits.map((h) => h.item);
  const termsBySlug = new Map(hits.map((h) => [h.item.slug, h.matched]));

  if (articles.length === 0) return null;
  const [, ...rest] = ketQua;
  const danhSach = q.trim() ? ketQua : rest.length ? rest : articles;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      {/* Danh sách bài PHÂN TRANG */}
      <div className="lg:col-span-2">
        <PagedArticleList articles={danhSach} />
      </div>

      {/* Cột phải: bài viết được quan tâm — đánh số (kiểu Batdongsan) */}
      <aside className="lg:col-span-1">
        {/* Máy tính: khối bo 12px, không viền như khối lọc Mua bán (24/10/2026) */}
        <div className="sticky top-24 rounded-none border border-cvr-line bg-white p-5 shadow-lux lg:rounded-xl lg:border-0">
          <h2 className="text-sm font-semibold tracking-tight text-cvr-ink">Bài viết được quan tâm</h2>
          <div className="mt-1 flex flex-col divide-y divide-cvr-line/70">
            {articles.slice(0, 5).map((a, i) => (
              <Link key={a.slug} href={`/tin-tuc/${a.slug}`} className="group flex gap-3 py-3 last:pb-0">
                <span className="w-5 shrink-0 text-lg font-semibold leading-snug text-cvr-faint">{i + 1}</span>
                <span className="line-clamp-2 text-sm font-medium leading-snug text-cvr-ink transition-colors group-hover:text-cvr-blue-ink">
                  <Highlight text={a.title} terms={termsBySlug.get(a.slug) ?? []} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
