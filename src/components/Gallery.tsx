"use client";

import { useState } from "react";
import Image from "next/image";

// Thư viện ảnh trang chi tiết BĐS — bố cục kiểu Homedy:
// 1 ảnh lớn bên trái + lưới 2×2 ảnh nhỏ bên phải. Bấm ảnh nào → mở xem lớn (lightbox).
export default function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [lb, setLb] = useState(-1); // chỉ số ảnh đang xem lớn; -1 = đóng
  const open = (i: number) => setLb(i);
  const close = () => setLb(-1);
  const prev = () => setLb((a) => (a - 1 + images.length) % images.length);
  const next = () => setLb((a) => (a + 1) % images.length);

  if (images.length === 0) return null;

  // Ảnh nhỏ bên phải: 4 ảnh sau ảnh lớn
  const rightThumbs = images.slice(1, 5);
  const extra = images.length - 5; // số ảnh còn dư (hiện "+N" ở ô cuối)

  return (
    <>
      {images.length === 1 ? (
        <button type="button" onClick={() => open(0)} className="group relative block aspect-[16/9] w-full overflow-hidden rounded-none border border-cvr-line">
          <Image src={images[0]} alt={alt} fill priority sizes="(max-width:1024px) 100vw, 66vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-2 lg:h-[440px] lg:grid-cols-4 lg:grid-rows-2">
          {/* Ảnh lớn */}
          <button
            type="button"
            onClick={() => open(0)}
            className="group relative col-span-2 aspect-[16/10] overflow-hidden rounded-none border border-cvr-line lg:col-span-2 lg:row-span-2 lg:aspect-auto lg:h-full"
          >
            <Image src={images[0]} alt={alt} fill priority sizes="(max-width:1024px) 100vw, 50vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
            <span className="absolute bottom-3 left-3 rounded-md bg-black/60 px-2.5 py-1 text-xs text-white backdrop-blur-sm">
              {images.length} ảnh · Bấm để xem lớn
            </span>
          </button>

          {/* Lưới 2×2 ảnh nhỏ bên phải */}
          {rightThumbs.map((src, i) => {
            const idx = i + 1;
            const isLast = i === rightThumbs.length - 1 && extra > 0;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => open(idx)}
                className="group relative aspect-square overflow-hidden rounded-none border border-cvr-line lg:aspect-auto lg:h-full"
              >
                <Image src={src} alt={`${alt} ${idx + 1}`} fill sizes="(max-width:1024px) 50vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                {isLast && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-lg font-semibold text-white">
                    +{extra} ảnh
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Lightbox — xem lớn + chuyển ảnh */}
      {lb >= 0 && (
        <div onClick={close} className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
          <button type="button" aria-label="Đóng" className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-lg text-white/80 hover:bg-white/10">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <div className="relative h-[80vh] w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <Image src={images[lb]} alt={alt} fill sizes="100vw" className="object-contain" />
            <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-md bg-white/10 px-3 py-1 text-sm text-white">{lb + 1} / {images.length}</span>
            {images.length > 1 && (
              <>
                <button type="button" onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20">‹</button>
                <button type="button" onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20">›</button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
