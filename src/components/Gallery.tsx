"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

// Thư viện ảnh trang chi tiết BĐS — bố cục kiểu Homedy:
// 1 ảnh lớn bên trái + lưới 2×2 ảnh nhỏ bên phải. Bấm ảnh nào → mở xem lớn (lightbox).
// Lightbox: vuốt touchpad ngang · phím ←/→ · vuốt tay (mobile) · chuyển ảnh mượt.
export default function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [lb, setLb] = useState(-1); // chỉ số ảnh đang xem lớn; -1 = đóng
  const [fade, setFade] = useState(false); // hiệu ứng mờ khi đổi ảnh
  const open = (i: number) => setLb(i);
  const close = () => setLb(-1);

  // Đổi ảnh có hiệu ứng mờ nhẹ (mượt, không giật)
  const step = useCallback((dir: number) => {
    setFade(true);
    setLb((a) => (a + dir + images.length) % images.length);
    window.setTimeout(() => setFade(false), 120);
  }, [images.length]);
  const prev = useCallback(() => step(-1), [step]);
  const next = useCallback(() => step(1), [step]);

  // Phím ←/→ chuyển ảnh · Esc đóng
  useEffect(() => {
    if (lb < 0) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lb, prev, next]);

  // Vuốt NGANG bằng touchpad (wheel deltaX) → chuyển ảnh. Khoá 400ms/lần để 1 cú
  // vuốt = 1 ảnh (không lướt vèo nhiều ảnh). Chỉ nhận cử chỉ NGANG rõ rệt.
  const wheelLock = useRef(0);
  const onWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaX) < Math.abs(e.deltaY) || Math.abs(e.deltaX) < 12) return;
    const now = Date.now();
    if (now - wheelLock.current < 400) return;
    wheelLock.current = now;
    if (e.deltaX > 0) next(); else prev();
  };

  // Vuốt tay (màn hình cảm ứng)
  const touchX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 40) { if (dx < 0) next(); else prev(); }
    touchX.current = null;
  };

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

      {/* Lightbox — xem lớn: vuốt touchpad ngang · phím ←/→ · vuốt tay · nút ‹ › */}
      {lb >= 0 && (
        <div
          onClick={close}
          onWheel={onWheel}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          className="fixed inset-0 z-[70] flex items-center justify-center overscroll-contain bg-black/90 p-4 backdrop-blur-sm"
        >
          <button type="button" aria-label="Đóng" onClick={close} className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/10">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <div className="relative h-[82vh] w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <Image
              key={lb}
              src={images[lb]}
              alt={alt}
              fill
              sizes="100vw"
              className={`object-contain transition-opacity duration-150 ease-out ${fade ? "opacity-0" : "opacity-100"}`}
            />
            <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-md bg-white/10 px-3 py-1 text-sm text-white">{lb + 1} / {images.length} · vuốt để xem</span>
            {images.length > 1 && (
              <>
                <button type="button" onClick={prev} aria-label="Ảnh trước" className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/25">‹</button>
                <button type="button" onClick={next} aria-label="Ảnh sau" className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/25">›</button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
