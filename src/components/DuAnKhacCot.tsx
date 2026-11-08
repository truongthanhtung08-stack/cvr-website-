"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { anhNho } from "@/lib/asset";

// CỘT PHẢI TRANG DỰ ÁN — "Dự án cập nhật" (anh 08/11/2026: "cập nhật theo cấp VIP và theo thứ tự cập nhật dự án, có xem thêm"):
// xếp sẵn ở máy chủ theo CẤP (Diamond → Gold → Silver → Basic) rồi NGÀY CẬP NHẬT mới nhất; hiện 10, "Xem thêm" mỗi lần thêm 10.
export type DuAnGon = { slug: string; name: string; image: string; diaChi: string };

const BUOC = 10; // top 10, "Xem thêm" mỗi lần thêm 10 (anh 08/11/2026)

export default function DuAnKhacCot({ ds }: { ds: DuAnGon[] }) {
  const [so, setSo] = useState(BUOC);
  if (!ds.length) return null;
  return (
    <div className="hidden rounded-2xl border border-cvr-line bg-white p-4 lg:block lg:p-5">
      <p className="text-base font-semibold tracking-tight text-cvr-ink">Dự án cập nhật</p>
      <div className="mt-2 flex flex-col divide-y divide-cvr-line/70">
        {ds.slice(0, so).map((d) => (
          <Link key={d.slug} href={`/du-an/${d.slug}`} className="group flex items-center gap-3 py-3 last:pb-0">
            <span className="relative aspect-[1.618/1] w-20 shrink-0 overflow-hidden rounded-md bg-cvr-surface">
              {d.image && <Image src={anhNho(d.image)} alt={d.name} fill sizes="80px" className="object-cover" />}
            </span>
            <span className="min-w-0">
              <span className="line-clamp-2 text-sm font-medium leading-snug text-cvr-ink transition-colors group-hover:text-cvr-blue-ink">{d.name}</span>
              {d.diaChi && <span className="mt-0.5 line-clamp-1 block text-xs text-cvr-faint">{d.diaChi}</span>}
            </span>
          </Link>
        ))}
      </div>
      {so < ds.length && (
        // chữ "Xem thêm ⌄" như Batdongsan — không phải nút CTA có khung (anh 08/11/2026)
        <button type="button" onClick={() => setSo((n) => n + BUOC)} className="mt-2 flex items-center gap-1 px-1 py-1 text-sm font-medium text-cvr-muted transition-colors hover:text-cvr-ink">
          Xem thêm
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
        </button>
      )}
    </div>
  );
}
