"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSoMoiTrang } from "@/lib/useSoMoiTrang";
import type { Article } from "@/lib/data";


// Danh sách bài viết PHÂN TRANG cho trang /tin-tuc — mỗi bài: ảnh trái · nội dung phải.
// Dùng chung markup với khối tin tức để đồng bộ giao diện.
export default function PagedArticleList({ articles }: { articles: Article[] }) {
  const PER_PAGE = useSoMoiTrang(); // PC 20 · điện thoại 10 — quy định chung mọi danh sách (22/10/2026; trước 10)
  // TIN MỚI Ở TRÊN, "Xem thêm" nối thêm bài xuống dưới, cuộn tiếp — không chia số trang (anh 08/11/2026, kiểu Batdongsan)
  const [soLuot, setSoLuot] = useState(1);
  const items = articles.slice(0, soLuot * PER_PAGE);
  const conNua = items.length < articles.length;

  return (
    <div>
      <div className="reveal is-visible cards-stagger divide-y divide-cvr-line/70">
        {items.map((a) => (
          <Link key={a.slug} href={`/tin-tuc/${a.slug}`} className="group flex flex-col gap-2.5 py-5 first:pt-0 last:pb-0 sm:flex-row sm:gap-5">
            <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden rounded-none bg-cvr-surface sm:aspect-[1.618/1] sm:w-64 sm:rounded-xl lg:w-72">
              <Image src={a.image} alt={a.title} fill sizes="(max-width:640px) 100vw, 288px" className="object-cover transition-transform duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]" />
            </div>
            {/* MÁY TÍNH cân đối ảnh – chữ (anh 08/11/2026): ảnh TỈ LỆ VÀNG (1,618), chữ canh giữa theo chiều dọc, tóm tắt 3 dòng */}
            <div className="flex min-w-0 flex-1 flex-col sm:justify-center">
              {/* thứ tự chung mọi thẻ tin tức: tiêu đề → tóm tắt → mục · ngày (anh 08/11/2026) */}
              <h3 className="clamp-2 font-semibold leading-[1.5] text-cvr-ink transition-colors group-hover:text-cvr-blue-ink sm:text-lg lg:text-xl">
                {a.title}
              </h3>
              <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-cvr-muted sm:line-clamp-3">{a.excerpt}</p>
              <p className="mt-2 text-xs text-cvr-faint">{a.category} · {a.date}</p>
            </div>
          </Link>
        ))}
      </div>

      {conNua && (
        <div className="mt-6 flex justify-center">
          <button type="button" onClick={() => setSoLuot((n) => n + 1)} className="press rounded-full border border-cvr-line px-6 py-2.5 text-sm font-medium text-cvr-ink transition-colors hover:border-cvr-ink">
            Xem thêm
          </button>
        </div>
      )}
    </div>
  );
}
