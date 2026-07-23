"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Lightbox xem ảnh toàn màn hình — ZOOM được (cuộn/nút +/−, bấm đúp), KÉO để di
// chuyển khi đã phóng to, VUỐT tay/touchpad để đổi ảnh, phím ←/→/Esc. Mượt.
// Dùng chung: thư viện ảnh dự án, mặt bằng, và mọi nơi cần xem ảnh lớn.
export default function Lightbox({
  images,
  start = 0,
  captions,
  onClose,
}: {
  images: string[];
  start?: number;
  captions?: string[];
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(start);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  const drag = useRef<{ x: number; y: number } | null>(null);
  const swipe = useRef<number | null>(null);
  const pinch = useRef<{ dist: number; scale: number } | null>(null);

  const reset = useCallback(() => { setScale(1); setPan({ x: 0, y: 0 }); }, []);
  const go = useCallback((dir: number) => { setIdx((i) => (i + dir + images.length) % images.length); reset(); }, [images.length, reset]);
  const zoomTo = useCallback((s: number) => {
    const ns = Math.min(4, Math.max(1, s));
    setScale(ns);
    if (ns === 1) setPan({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "+" || e.key === "=") zoomTo(scale + 0.5);
      else if (e.key === "-") zoomTo(scale - 0.5);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose, zoomTo, scale]);

  // Cuộn (touchpad/chuột) → zoom
  const onWheel = (e: React.WheelEvent) => zoomTo(scale - e.deltaY * 0.0025 * scale);

  // Kéo để di chuyển khi đã phóng to · vuốt để đổi ảnh khi chưa zoom
  const onPointerDown = (e: React.PointerEvent) => {
    if (scale > 1) { setDragging(true); drag.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }; }
    else swipe.current = e.clientX;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragging && drag.current) setPan({ x: e.clientX - drag.current.x, y: e.clientY - drag.current.y });
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (scale <= 1 && swipe.current != null) {
      const dx = e.clientX - swipe.current;
      if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
    }
    setDragging(false); drag.current = null; swipe.current = null;
  };

  // Chạm 2 ngón → pinch zoom
  const dist2 = (t: React.TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
  const onTouchStart = (e: React.TouchEvent) => { if (e.touches.length === 2) pinch.current = { dist: dist2(e.touches), scale }; };
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinch.current) zoomTo(pinch.current.scale * (dist2(e.touches) / pinch.current.dist));
  };
  const onTouchEnd = () => { pinch.current = null; };

  const caption = captions?.[idx];

  return (
    <div
      className="fixed inset-0 z-[80] flex select-none items-center justify-center overscroll-contain bg-black/92 backdrop-blur-sm"
      onClick={onClose}
      onWheel={onWheel}
    >
      {/* Đóng */}
      <button type="button" aria-label="Đóng" onClick={onClose} className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/10">
        <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>

      {/* Nút zoom */}
      <div className="absolute left-1/2 top-4 z-10 flex -translate-x-1/2 items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <button type="button" aria-label="Thu nhỏ" onClick={() => zoomTo(scale - 0.5)} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xl text-white transition hover:bg-white/25">−</button>
        <span className="min-w-[3rem] text-center text-sm text-white/90">{Math.round(scale * 100)}%</span>
        <button type="button" aria-label="Phóng to" onClick={() => zoomTo(scale + 0.5)} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xl text-white transition hover:bg-white/25">+</button>
      </div>

      {/* Ảnh */}
      <div
        className="relative flex h-full w-full items-center justify-center px-4 py-16"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onDoubleClick={() => zoomTo(scale > 1 ? 1 : 2.5)}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{ cursor: scale > 1 ? (dragging ? "grabbing" : "grab") : "auto", touchAction: "none" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[idx]}
          alt={caption ?? `Ảnh ${idx + 1}`}
          draggable={false}
          className="max-h-full max-w-full object-contain"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transition: dragging ? "none" : "transform 0.15s ease-out",
          }}
        />
      </div>

      {/* Điều hướng */}
      {images.length > 1 && (
        <>
          <button type="button" aria-label="Ảnh trước" onClick={(e) => { e.stopPropagation(); go(-1); }} className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/25">‹</button>
          <button type="button" aria-label="Ảnh sau" onClick={(e) => { e.stopPropagation(); go(1); }} className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/25">›</button>
        </>
      )}

      {/* Chú thích + bộ đếm */}
      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1" onClick={(e) => e.stopPropagation()}>
        {caption && <span className="max-w-[90vw] truncate rounded-md bg-black/50 px-3 py-1 text-sm text-white">{caption}</span>}
        <span className="rounded-md bg-white/10 px-3 py-1 text-xs text-white/90">{idx + 1} / {images.length} · cuộn/bấm đúp để zoom · vuốt để đổi ảnh</span>
      </div>
    </div>
  );
}
