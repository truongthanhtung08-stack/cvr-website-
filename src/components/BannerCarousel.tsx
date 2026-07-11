"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { asset } from "@/lib/asset";
import type { Banner } from "@/lib/banners";

const DURATION = 5500;

export default function BannerCarousel({
  banners,
  overlay = "caption",
  aspect = "aspect-[16/6] sm:aspect-[16/5]",
}: {
  banners: Banner[];
  overlay?: "caption" | "none";
  aspect?: string;
}) {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [tick, setTick] = useState(0); // reset animation khi đổi slide

  // auto-advance
  useEffect(() => {
    if (banners.length <= 1 || !playing) return;
    const id = setTimeout(() => {
      setActive((i) => (i + 1) % banners.length);
      setTick((t) => t + 1);
    }, DURATION);
    return () => clearTimeout(id);
  }, [active, playing, banners.length]);

  // swipe / touchpad
  const startX = useRef<number | null>(null);

  const onDown = (e: React.PointerEvent) => { startX.current = e.clientX; };
  const onUp = (e: React.PointerEvent) => {
    if (startX.current === null) return;
    const dx = e.clientX - startX.current;
    startX.current = null;
    if (Math.abs(dx) < 40) return;
    goTo(dx < 0
      ? (active + 1) % banners.length
      : (active - 1 + banners.length) % banners.length);
  };

  const goTo = (i: number) => { setActive(i); setTick((t) => t + 1); };

  if (banners.length === 0) return null;
  const cur = banners[active];

  return (
    <div
      className={`relative w-full overflow-hidden rounded-none border border-cvr-line/40 select-none cursor-grab ${aspect}`}
      onPointerDown={onDown}
      onPointerUp={onUp}
    >
      {/* ── Ảnh ── */}
      {banners.map((b, i) => (
        <Image
          key={b.id}
          src={asset(b.image)}
          alt={b.title}
          fill
          priority={i === 0}
          draggable={false}
          sizes="100vw"
          className={`pointer-events-none object-cover transition-opacity duration-700 ease-in-out ${
            i === active ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}

      {/* ── Gradient + Caption ── */}
      {overlay === "caption" && (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />
          <div key={active} className="hero-sub absolute inset-x-0 bottom-0 px-5 pb-14 sm:px-7 sm:pb-16 lg:px-9 pointer-events-none">
            <h2 className="font-serif text-xl font-semibold leading-tight text-white drop-shadow-lg sm:text-2xl lg:text-[1.9rem]">
              {cur.title}
            </h2>
            {cur.subtitle && (
              <p className="mt-1.5 flex items-center gap-1.5 text-sm text-white/85 sm:text-[15px]">
                <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="line-clamp-1">{cur.subtitle}</span>
              </p>
            )}
          </div>
        </>
      )}

      {/* ── Link toàn banner ── */}
      {cur.href && (
        <Link href={cur.href} aria-label={cur.title} className="absolute inset-0 z-[1]" />
      )}

      {/* ── Nút ‹ › ── */}
      {banners.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Trước"
            onClick={() => goTo((active - 1 + banners.length) % banners.length)}
            className="absolute left-3 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md transition hover:bg-black/55 hover:scale-110 sm:flex"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Sau"
            onClick={() => goTo((active + 1) % banners.length)}
            className="absolute right-3 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md transition hover:bg-black/55 hover:scale-110 sm:flex"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* ── Thanh điều khiển: dots + play/pause ── */}
          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 sm:bottom-4">
            {banners.map((b, i) => (
              <button
                key={b.id}
                type="button"
                aria-label={`Slide ${i + 1}`}
                onClick={() => goTo(i)}
                className="relative h-[3px] overflow-hidden rounded-full bg-white/35 transition-all duration-300"
                style={{ width: i === active ? 32 : 10 }}
              >
                {i === active && (
                  <span
                    key={tick}
                    className="absolute inset-y-0 left-0 rounded-full bg-white"
                    style={{
                      animation: playing ? `banner-progress ${DURATION}ms linear forwards` : "none",
                      width: playing ? undefined : "60%",
                    }}
                  />
                )}
              </button>
            ))}

            {/* Nút Play / Pause */}
            <button
              type="button"
              aria-label={playing ? "Tạm dừng" : "Phát"}
              onClick={() => setPlaying((p) => !p)}
              className="ml-1 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-white/25 text-white backdrop-blur-sm transition hover:bg-white/45"
            >
              {playing ? (
                <svg className="h-[10px] w-[10px]" viewBox="0 0 10 10" fill="currentColor">
                  <rect x="1.5" y="0.5" width="2.5" height="9" rx="0.8" />
                  <rect x="6" y="0.5" width="2.5" height="9" rx="0.8" />
                </svg>
              ) : (
                <svg className="h-[10px] w-[10px]" viewBox="0 0 10 10" fill="currentColor">
                  <path d="M2 1l7 4-7 4V1z" />
                </svg>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
