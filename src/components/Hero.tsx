"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { asset } from "@/lib/asset";
import HomeSearch from "@/components/HomeSearch";
import { homeBanners } from "@/lib/banners";

const DURATION = 6000;

export default function Hero() {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [tick, setTick] = useState(0);
  const banners = homeBanners;
  const cur = banners[active];

  useEffect(() => {
    if (banners.length <= 1 || !playing) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const id = setTimeout(() => {
      setActive((i) => (i + 1) % banners.length);
      setTick((t) => t + 1);
    }, DURATION);
    return () => clearTimeout(id);
  }, [active, playing, banners.length]);

  // swipe / touchpad
  const startX = useRef<number | null>(null);
  const onDown = (e: React.PointerEvent) => { startX.current = e.clientX; };
  const onUp   = (e: React.PointerEvent) => {
    if (startX.current === null) return;
    const dx = e.clientX - startX.current;
    startX.current = null;
    if (Math.abs(dx) < 40) return;
    goTo(dx < 0
      ? (active + 1) % banners.length
      : (active - 1 + banners.length) % banners.length);
  };
  const goTo = (i: number) => { setActive(i); setTick((t) => t + 1); };

  return (
    <section
      className="relative isolate flex min-h-[340px] flex-col sm:h-[calc(100svh-120px)] select-none"
      onPointerDown={onDown}
      onPointerUp={onUp}
    >
      {/* ── Ảnh nền ── */}
      <div className="absolute inset-0 -z-10 overflow-hidden bg-cvr-ink">
        {banners.map((b, i) => (
          <Image
            key={b.id}
            src={asset(b.image)}
            alt={b.title}
            fill
            priority={i === 0}
            quality={100}
            draggable={false}
            sizes="100vw"
            className={`pointer-events-none object-cover transition-opacity duration-[1000ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
              i === active ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
        {/* Overlay giảm so với bản cũ — đủ để chữ đọc được, không làm tối ảnh */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/15 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      </div>

      {/* ── Link toàn banner (z-0, dưới mọi control) ── */}
      <Link
        href={cur.href ?? "#"}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={cur.title}
        className="absolute inset-0 z-0"
      />

      {/* ── Nút ‹ › hai bên ── */}
      {banners.length > 1 && (
        <>
          <SideNav dir="prev" onClick={() => goTo((active - 1 + banners.length) % banners.length)} />
          <SideNav dir="next" onClick={() => goTo((active + 1) % banners.length)} />

          {/* Dots + Play/Pause — góc dưới phải, thẳng hàng với search bar */}
          <div className="absolute bottom-3 right-4 z-20 flex items-center gap-2 sm:bottom-4 sm:right-5">
            {banners.map((b, i) => (
              <button
                key={b.id}
                type="button"
                aria-label={`Banner ${i + 1}`}
                onClick={() => goTo(i)}
                className="relative h-[3px] overflow-hidden rounded-full bg-white/30 transition-all duration-300"
                style={{ width: i === active ? 32 : 10 }}
              >
                {i === active && (
                  <span
                    key={tick}
                    className="absolute inset-y-0 left-0 rounded-full bg-white"
                    style={{
                      animation: playing
                        ? `banner-progress ${DURATION}ms linear forwards`
                        : "none",
                      width: playing ? undefined : "60%",
                    }}
                  />
                )}
              </button>
            ))}

            {/* Gap rõ hơn giữa dots và nút play */}
            <button
              type="button"
              aria-label={playing ? "Tạm dừng" : "Phát"}
              onClick={() => setPlaying((p) => !p)}
              className="ml-3 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition hover:bg-white/40"
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

      {/* ── Layout dọc: text → dots → search ── */}
      <div className="pointer-events-none relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pb-4 pt-16 sm:px-16">

        {/* Vùng chữ — co giãn lấp đầy khoảng trống còn lại */}
        <div className={`flex flex-1 ${cur.href?.startsWith("/du-an") ? "items-end pb-2" : "items-center"}`}>
          {cur.showText !== false && (
            <div
              key={active}
              className={`hero-sub max-w-3xl text-left ${cur.href?.startsWith("/du-an") ? "" : "sm:translate-y-6"}`}
            >
              {cur.status && (
                <span className="mb-2 inline-flex items-center rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white ring-1 ring-inset ring-white/25 backdrop-blur-sm">
                  {cur.status}
                </span>
              )}
              <h2 className="text-balance font-[family-name:var(--font-montserrat)] text-lg font-bold leading-[1.2] tracking-tight text-white [text-shadow:0_2px_16px_rgba(0,0,0,0.6)] sm:text-2xl">
                {cur.title}
              </h2>
              {cur.subtitle && (
                <p className="mt-1 text-balance text-sm font-medium text-white/90 [text-shadow:0_1px_8px_rgba(0,0,0,0.55)] sm:text-base">
                  {cur.subtitle}
                </p>
              )}
              {cur.cta && cur.href && (
                <Link
                  href={cur.href}
                  className="pointer-events-auto mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold text-white ring-1 ring-inset ring-white/25 backdrop-blur-md transition-colors hover:bg-white/25"
                >
                  {cur.cta}
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* ── Search bar ── */}
        <div className="pointer-events-auto mx-auto w-full max-w-4xl">
          <HomeSearch />
        </div>
      </div>
    </section>
  );
}

function SideNav({ dir, onClick }: { dir: "prev" | "next"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === "prev" ? "Banner trước" : "Banner sau"}
      className={`absolute top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/35 text-white backdrop-blur-sm transition hover:border-cvr-gold/70 hover:bg-black/55 sm:flex ${
        dir === "prev" ? "left-3" : "right-3"
      }`}
    >
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d={dir === "prev" ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
      </svg>
    </button>
  );
}
