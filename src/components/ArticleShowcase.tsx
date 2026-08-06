"use client";

import Image from "next/image";
import Link from "next/link";
import ArticleBrowser from "@/components/ArticleBrowser";
import { useHomeSection } from "@/components/HomeExpand";
import type { Article } from "@/lib/data";

// ── KHỐI TIN TỨC DÙNG CHUNG ──────────────────────────────────────────────────
// Đúng cấu trúc chuẩn của mọi khối trên web:
//   · Mặc định: SLIDE 8 bài (điện thoại vuốt ngang · máy tính lưới 4 cột)
//   · Nút "Xem thêm" → danh sách theo trang + CỘT PHẢI (dùng lại ArticleBrowser
//     của trang /tin-tuc nên không lệch cấu trúc), nội dung phía trên ẩn đi.
//     KHÔNG có "Thu gọn".
export default function ArticleShowcase({
  articles,
  title,
  sectionKey = "tin-lien-quan",
  emptyNote = "Chưa có bài viết liên quan.",
}: {
  articles: Article[];
  title?: string;
  sectionKey?: string;
  emptyNote?: string;
}) {
  const { expanded, hidden, toggle } = useHomeSection(sectionKey);

  // Khối khác đang mở danh sách → khối này ẩn
  if (hidden) return null;

  if (articles.length === 0) {
    return (
      <div className={title ? "mt-14" : undefined}>
        {title && <h2 className="mb-5 text-xl font-semibold tracking-tight text-cvr-ink sm:text-2xl">{title}</h2>}
        <p className="rounded-xl border border-dashed border-cvr-line bg-cvr-surface px-4 py-8 text-center text-sm text-cvr-muted">
          {emptyNote}
        </p>
      </div>
    );
  }

  // Đã bấm "Xem thêm" → danh sách theo trang + cột phải "Bài viết được quan tâm"
  if (expanded) return <ArticleBrowser articles={articles} />;

  return (
    <div className={title ? "mt-14" : undefined}>
      {title && <h2 className="mb-5 text-xl font-semibold tracking-tight text-cvr-ink sm:text-2xl">{title}</h2>}

      {/* SLIDE 8 bài — điện thoại vuốt ngang (ló mép bài sau), máy tính lưới 4 cột */}
      <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
        {articles.slice(0, 8).map((a) => (
          <Link
            key={a.slug}
            href={`/tin-tuc/${a.slug}`}
            className="card-lux group relative flex w-[80%] shrink-0 snap-start flex-col overflow-hidden rounded-none bg-white shadow-lux shadow-lux-hover hover:-translate-y-1.5 sm:w-auto sm:border sm:border-cvr-line"
          >
            <span className="card-sheen" aria-hidden />
            <div className="relative aspect-[16/9] w-full overflow-hidden">
              <Image
                src={a.image}
                alt={a.title}
                fill
                sizes="(max-width: 640px) 80vw, 25vw"
                className="object-cover transition-transform duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
              />
            </div>
            <div className="flex flex-1 flex-col p-4">
              <h3 className="h-[3em] overflow-hidden font-semibold leading-[1.5] text-cvr-ink transition-colors group-hover:text-cvr-blue-ink">
                {a.title}
              </h3>
              <p className="mt-1.5 text-xs text-cvr-faint">{a.category} · {a.date}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Bấm là ra danh sách theo trang — không có "Thu gọn" */}
      <div className="mt-6 flex justify-center">
        <button
          type="button"
          onClick={toggle}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-cvr-line px-6 text-sm font-semibold text-cvr-ink transition hover:bg-cvr-surface active:bg-cvr-surface"
        >
          Xem thêm
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
