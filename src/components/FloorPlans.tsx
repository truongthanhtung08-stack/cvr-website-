"use client";

import { useRef, useState } from "react";
import PhotoViewer from "@/components/PhotoViewer";
import { anhNho } from "@/lib/asset";

type FloorPlan = { label: string; image: string; note: string };

// Mặt bằng dự án — lưới ảnh mặt bằng theo tháp/tầng/loại căn, mỗi ảnh có chú thích.
// Bấm ảnh → xem toàn màn hình + ZOOM (đọc rõ từng căn, kích thước phòng).
// NHIỀU ẢNH → CHẠY SLIDE (chủ dự án 30/10/2026: "không để nối nhau thành cả trang dài lê thê"): máy tính 2 ảnh / lượt, điện thoại 1 ảnh
// (lộ mép ảnh kế), vuốt / mũi tên hai bên; 1–2 ảnh thì đứng yên.
export default function FloorPlans({ items }: { items: FloorPlan[] }) {
  const [open, setOpen] = useState(-1);
  const images = items.map((f) => f.image);
  const captions = items.map((f) => [f.label, f.note].filter(Boolean).join(" · "));
  const day = useRef<HTMLDivElement>(null);
  const truot = (huong: 1 | -1) => { const el = day.current; if (el) el.scrollBy({ left: huong * el.clientWidth, behavior: "smooth" }); };
  const nhieu = items.length > 2;

  return (
    <>
      <div className="relative">
      <div ref={day} className={nhieu ? "no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain" : "grid grid-cols-1 gap-4 sm:grid-cols-2"}>
        {items.map((f, i) => (
          <figure key={i} className={`overflow-hidden rounded-xl border border-cvr-line bg-white ${nhieu ? "w-[85%] shrink-0 snap-start sm:w-[calc(50%-8px)]" : ""}`}>
            <button type="button" onClick={() => setOpen(i)} className="group relative block aspect-[4/3] w-full overflow-hidden bg-cvr-surface">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {/* Ảnh khung = bản NHỎ 1280 px (khung ≤ 600 px); bấm "Phóng to" vẫn xem ảnh gốc. Ảnh gốc mặt bằng 350–380 KB/tấm: trên
                  mạng chậm Chrome tải sớm cả ảnh lazy trong ~2500 px dưới màn hình → tranh đường truyền ảnh đầu trang (31/10/2026) */}
              <img src={anhNho(f.image)} alt={f.label || `Mặt bằng ${i + 1}`} loading="lazy" className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105" />
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
      {nhieu && (
        <>
          <button type="button" aria-label="Ảnh trước" onClick={() => truot(-1)} className="absolute -left-3 top-[40%] z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-cvr-line bg-white/90 text-cvr-ink shadow-lux backdrop-blur transition hover:bg-white sm:flex">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button type="button" aria-label="Ảnh sau" onClick={() => truot(1)} className="absolute -right-3 top-[40%] z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-cvr-line bg-white/90 text-cvr-ink shadow-lux backdrop-blur transition hover:bg-white sm:flex">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </>
      )}
      </div>
      {open >= 0 && <PhotoViewer images={images} captions={captions} start={open} title="Mặt bằng" onClose={() => setOpen(-1)} />}
    </>
  );
}
