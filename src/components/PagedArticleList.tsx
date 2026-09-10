"use client";

import { useState } from "react";
import PhanTrang from "@/components/PhanTrang";
import Image from "next/image";
import Link from "next/link";
import type { Article } from "@/lib/data";

const PER_PAGE = 10; // 10 bài/trang (yêu cầu "Xem thêm → tin tức dạng trang")

// Danh sách bài viết PHÂN TRANG cho trang /tin-tuc — mỗi bài: ảnh trái · nội dung phải.
// Dùng chung markup với khối tin tức để đồng bộ giao diện.
export default function PagedArticleList({ articles }: { articles: Article[] }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(articles.length / PER_PAGE));
  const current = Math.min(page, totalPages);
  const items = articles.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  const go = (p: number) => { setPage(p); window.scrollTo({ top: 0 }); };

  return (
    <div>
      <div className="reveal is-visible cards-stagger divide-y divide-cvr-line/70">
        {items.map((a) => (
          <Link key={a.slug} href={`/tin-tuc/${a.slug}`} className="group flex flex-col gap-2.5 py-5 first:pt-0 sm:flex-row sm:gap-5">
            <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden rounded-none bg-cvr-surface sm:aspect-[16/10] sm:w-56 sm:rounded-xl">
              <Image src={a.image} alt={a.title} fill sizes="(max-width:640px) 100vw, 224px" className="object-cover transition-transform duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-center gap-2 text-xs text-cvr-muted">
                <span className="rounded-full bg-cvr-surface px-2.5 py-0.5 font-medium text-cvr-body">{a.category}</span>
                <span>{a.date}</span>
              </div>
              <h3 className="mt-2 clamp-2 min-h-[3em] font-semibold leading-[1.5] text-cvr-ink transition-colors group-hover:text-cvr-blue-ink sm:text-lg">
                {a.title}
              </h3>
              <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-cvr-muted">{a.excerpt}</p>
            </div>
          </Link>
        ))}
      </div>

      <PhanTrang hienTai={current} tong={totalPages} doiTrang={go} />
    </div>
  );
}
