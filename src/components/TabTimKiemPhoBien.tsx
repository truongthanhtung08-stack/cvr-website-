"use client";

import { useState } from "react";
import Link from "next/link";

export type TabLienKet = { ten: string; links: { href: string; nhan: string }[] };

// Phần bấm tab của khối "Tìm kiếm phổ biến" (TimKiemPhoBien.tsx). Tab không chọn chỉ ẨN bằng lớp
// `hidden` — link vẫn nằm trong HTML máy chủ cho Google đọc.
export default function TabTimKiemPhoBien({ tabs }: { tabs: TabLienKet[] }) {
  const [dang, setDang] = useState(0);
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <h2 className="text-2xl font-semibold tracking-tight text-cvr-ink sm:text-3xl">Tìm kiếm phổ biến</h2>
      <div role="tablist" className="no-scrollbar mt-5 flex gap-6 overflow-x-auto border-b border-cvr-line">
        {tabs.map((t, i) => (
          <button
            key={t.ten}
            type="button"
            role="tab"
            aria-selected={i === dang}
            onClick={() => setDang(i)}
            className={`-mb-px shrink-0 whitespace-nowrap border-b-2 pb-3 text-sm font-semibold transition-colors ${
              i === dang ? "border-cvr-ink text-cvr-ink" : "border-transparent text-cvr-muted hover:text-cvr-ink"
            }`}
          >
            {t.ten}
          </button>
        ))}
      </div>
      {tabs.map((t, i) => (
        <div key={t.ten} role="tabpanel" className={`mt-6 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-4 ${i === dang ? "" : "hidden"}`}>
          {t.links.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm leading-snug text-cvr-body transition-colors hover:text-cvr-ink hover:underline">
              {l.nhan}
            </Link>
          ))}
        </div>
      ))}
    </section>
  );
}
