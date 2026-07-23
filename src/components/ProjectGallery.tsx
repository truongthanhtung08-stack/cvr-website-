"use client";

import { useState } from "react";
import Image from "next/image";
import Lightbox from "@/components/Lightbox";

// Lưới ảnh chi tiết dự án kiểu Batdongsan: 1 ảnh lớn trái + 4 ảnh nhỏ phải (2×2),
// bộ đếm ảnh góc dưới phải. Bấm ảnh bất kỳ → Lightbox xem lớn + ZOOM được.
type Props = {
  images: string[];
  alt: string;
};

export default function ProjectGallery({ images, alt }: Props) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const thumbs = images.slice(1, 5);
  const open = (i: number) => { setActive(i); setLightbox(true); };

  return (
    <>
      <div className="relative">
        <div className="grid h-[240px] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-none sm:h-[360px]">
          {/* Ảnh lớn — trái, chiếm 2 cột × 2 hàng (mobile: full) */}
          <button
            type="button"
            onClick={() => open(0)}
            className="group relative col-span-4 row-span-2 overflow-hidden bg-cvr-surface sm:col-span-2"
          >
            <Image src={images[0]} alt={alt} fill priority sizes="(max-width:640px) 100vw, 44vw" className="object-contain transition-transform duration-500 group-hover:scale-105" />
          </button>

          {/* 4 ảnh nhỏ — phải, lưới 2×2 (ẩn trên mobile) */}
          {thumbs.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => open(i + 1)}
              className="group relative hidden overflow-hidden bg-cvr-surface sm:block"
            >
              <Image src={src} alt={`${alt} ${i + 2}`} fill sizes="22vw" className="object-contain transition-transform duration-500 group-hover:scale-105" />
            </button>
          ))}
        </div>

        {/* Bộ đếm ảnh — góc dưới phải */}
        <button
          type="button"
          onClick={() => open(0)}
          className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-white/95 px-2.5 py-1.5 text-sm font-semibold text-cvr-ink shadow-md transition hover:bg-white"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M4 6h16a0 0 0 010 0v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a0 0 0 010 0z" />
            <circle cx="15" cy="9" r="1.3" fill="currentColor" stroke="none" />
          </svg>
          {images.length}
        </button>
      </div>

      {/* Lightbox — xem lớn + zoom được (cuộn/bấm đúp), vuốt đổi ảnh */}
      {lightbox && <Lightbox images={images} start={active} onClose={() => setLightbox(false)} />}
    </>
  );
}
