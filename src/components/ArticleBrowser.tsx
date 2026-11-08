"use client";

import { useDiaDanh } from "@/lib/useDiaDanh";
import Image from "next/image";
import Link from "next/link";
import PagedArticleList from "@/components/PagedArticleList";
import { anhNho } from "@/lib/asset";
import { searchAny } from "@/lib/smartSearch";
import type { Article } from "@/lib/data";

// ── DANH SÁCH TIN TỨC 2 CỘT (dùng chung) ─────────────────────────────────────
// Trái: danh sách bài PHÂN TRANG · Phải: "Bài viết được quan tâm" (đánh số).
// Dùng ở trang /tin-tuc và ở khối Tin tức trang chủ khi bấm "Xem thêm" —
// hai chỗ dùng CHUNG component nên không bao giờ lệch cấu trúc.
export default function ArticleBrowser({ articles, boQua = 1, cotPhai = true }: { articles: Article[]; boQua?: number; cotPhai?: boolean }) {
  useDiaDanh(); // địa danh nạp sau khi trang hiện — về tới thì vẽ lại (20/10/2026)
  // BỎ Ô TÌM BÀI VIẾT (chủ dự án 02/11/2026: "trang tin tức không cần bộ lọc, xoá đi") — danh sách giữ đúng thứ tự như khi ô trống
  const q = "";
  const hits = searchAny(articles, q, {
    ten: (a) => a.title,                                   // khớp ở tiêu đề ăn điểm cao nhất
    hay: (a) => `${a.title} ${a.excerpt} ${a.category}`,
  });
  const ketQua = hits.map((h) => h.item);

  if (articles.length === 0) return null;
  const rest = ketQua.slice(boQua);
  const danhSach = q.trim() ? ketQua : rest.length ? rest : articles;

  // trang /tin-tuc tự dựng cột phải → cotPhai={false}; khối Tin tức trang chủ "Xem thêm" dùng 2 cột ở đây — cùng bố cục trang Tin tức (anh 08/11/2026)
  if (!cotPhai) return <PagedArticleList articles={danhSach} />;
  return (
    <div className="lg:grid lg:grid-cols-3 lg:gap-12">
      <div className="min-w-0 lg:col-span-2"><PagedArticleList articles={danhSach} /></div>
      <aside className="hidden lg:block">
        <div className="sticky top-24 rounded-xl bg-white p-5 shadow-lux">
          <h2 className="text-sm font-semibold tracking-tight text-cvr-ink">Bài viết được quan tâm</h2>
          <div className="mt-1 flex flex-col divide-y divide-cvr-line/70">
            {articles.slice(0, 5).map((a, i) => (
              <Link key={a.slug} href={`/tin-tuc/${a.slug}`} className="group flex items-center gap-3 py-3 last:pb-0">
                <span className="w-4 shrink-0 text-lg font-semibold leading-snug text-cvr-faint">{i + 1}</span>
                <span className="relative aspect-[1.618/1] w-20 shrink-0 overflow-hidden rounded-md bg-cvr-surface"><Image src={anhNho(a.image)} alt={a.title} fill sizes="80px" className="object-cover" /></span>
                <span className="line-clamp-3 text-sm font-medium leading-snug text-cvr-ink transition-colors group-hover:text-cvr-blue-ink">{a.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
