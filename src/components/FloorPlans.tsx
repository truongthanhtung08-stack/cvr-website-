"use client";

import { useState } from "react";
import Lightbox from "@/components/Lightbox";

type FloorPlan = { label: string; image: string; note: string };

// Mặt bằng dự án — lưới ảnh mặt bằng theo tháp/tầng/loại căn, mỗi ảnh có chú thích.
// Bấm ảnh → mở Lightbox xem lớn + ZOOM (đọc rõ từng căn, kích thước phòng).
export default function FloorPlans({ items }: { items: FloorPlan[] }) {
  const [open, setOpen] = useState(-1);
  const images = items.map((f) => f.image);
  const captions = items.map((f) => [f.label, f.note].filter(Boolean).join(" · "));

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {items.map((f, i) => (
          <figure key={i} className="overflow-hidden rounded-xl border border-cvr-line bg-white">
            <button type="button" onClick={() => setOpen(i)} className="group relative block aspect-[4/3] w-full overflow-hidden bg-cvr-surface">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.image} alt={f.label || `Mặt bằng ${i + 1}`} loading="lazy" className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105" />
              <span className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-black/55 px-2 py-1 text-[11px] font-medium text-white">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 8v6m-3-3h6m4 0a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                Phóng to
              </span>
            </button>
            {(f.label || f.note) && (
              <figcaption className="border-t border-cvr-line px-3.5 py-2.5">
                {f.label && <p className="text-sm font-semibold text-cvr-ink">{f.label}</p>}
                {f.note && <p className="mt-0.5 text-xs text-cvr-muted">{f.note}</p>}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
      {open >= 0 && <Lightbox images={images} captions={captions} start={open} onClose={() => setOpen(-1)} />}
    </>
  );
}
