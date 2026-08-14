"use client";

import { useState } from "react";
import Link from "next/link";
import PagedArticleList from "@/components/PagedArticleList";
import Highlight from "@/components/Highlight";
import { searchAny, TIER_LABEL } from "@/lib/smartSearch";
import type { Article } from "@/lib/data";

// ── DANH SÁCH TIN TỨC 2 CỘT (dùng chung) ─────────────────────────────────────
// Trái: danh sách bài PHÂN TRANG · Phải: "Bài viết được quan tâm" (đánh số).
// Dùng ở trang /tin-tuc và ở khối Tin tức trang chủ khi bấm "Xem thêm" —
// hai chỗ dùng CHUNG component nên không bao giờ lệch cấu trúc.
export default function ArticleBrowser({ articles }: { articles: Article[] }) {
  // Ô TÌM cho mục Tin tức — dùng CHUNG lõi tìm kiếm với Mua bán / Cho thuê / Dự án:
  // bóc tách câu, khớp mờ (gõ thiếu dấu/sai chính tả vẫn ra), xếp 3 tầng và
  // KHÔNG BAO GIỜ trả về màn hình trống. Hiện trên cả PC và điện thoại.
  const [q, setQ] = useState("");
  const hits = searchAny(articles, q, {
    ten: (a) => a.title,                                   // khớp ở tiêu đề ăn điểm cao nhất
    hay: (a) => `${a.title} ${a.excerpt} ${a.category}`,
  });
  const ketQua = hits.map((h) => h.item);
  const termsBySlug = new Map(hits.map((h) => [h.item.slug, h.matched]));
  const tang = q.trim() && ketQua.length ? hits[0].tier : 1;

  if (articles.length === 0) return null;
  const [, ...rest] = ketQua;
  const danhSach = q.trim() ? ketQua : rest.length ? rest : articles;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      {/* Danh sách bài PHÂN TRANG */}
      <div className="lg:col-span-2">
        {/* Ô tìm — nút "Tìm" xanh nằm trong ô, có nút xoá (×) như các mục khác */}
        <div className="relative mb-4">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cvr-faint" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm bài viết theo tiêu đề, chủ đề…"
            aria-label="Tìm bài viết"
            className="h-11 w-full rounded-xl border border-cvr-line bg-white pl-9 pr-24 text-[15px] text-cvr-ink placeholder-cvr-faint outline-none transition focus:border-cvr-blue/60 sm:h-10"
          />
          {q.trim().length > 0 && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Xoá tìm kiếm"
              className="absolute right-[5.5rem] top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-cvr-faint transition hover:bg-black/5 hover:text-cvr-ink"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
          <span className="absolute right-1 top-1 bottom-1 flex items-center gap-1.5 rounded-lg bg-cvr-blue px-3 text-[13px] font-semibold text-white">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" /></svg>
            Tìm
          </span>
        </div>

        {/* Nhãn tầng kết quả — giống Mua bán / Cho thuê / Dự án */}
        {q.trim() && tang !== 1 && (
          <p className="mb-3 text-sm font-medium text-cvr-body">{TIER_LABEL[tang]}</p>
        )}

        <PagedArticleList articles={danhSach} />
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
