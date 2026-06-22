"use client";

import { useState } from "react";
import Image from "next/image";

export default function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  return (
    <>
      {/* Ảnh lớn */}
      <button
        type="button"
        onClick={() => setLightbox(true)}
        className="group relative block aspect-[16/9] max-h-[400px] w-full overflow-hidden rounded-2xl border border-white/10"
      >
        <Image src={images[active]} alt={alt} fill priority sizes="(max-width:1024px) 100vw, 66vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
        <span className="absolute bottom-3 right-3 rounded-md bg-black/60 px-2.5 py-1 text-xs text-white backdrop-blur-sm">
          {active + 1} / {images.length} · Bấm để phóng to
        </span>
      </button>

      {/* Thumbnail */}
      <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-6">
        {images.map((src, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActive(i)}
            className={`relative aspect-square overflow-hidden rounded-lg border transition ${
              i === active ? "border-white" : "border-white/10 opacity-70 hover:opacity-100"
            }`}
          >
            <Image src={src} alt={`${alt} ${i + 1}`} fill sizes="120px" className="object-cover" />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(false)}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
        >
          <button type="button" aria-label="Đóng" className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-lg text-white/80 hover:bg-white/10">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <div className="relative h-[80vh] w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <Image src={images[active]} alt={alt} fill sizes="100vw" className="object-contain" />
            <button type="button" onClick={() => setActive((a) => (a - 1 + images.length) % images.length)} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20">‹</button>
            <button type="button" onClick={() => setActive((a) => (a + 1) % images.length)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20">›</button>
          </div>
        </div>
      )}
    </>
  );
}
