"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { asset } from "@/lib/asset";
import type { Banner } from "@/lib/banners";

// Banner carousel quảng cáo — KHÔNG giới hạn slide, tự chạy + nút ‹ › + chấm.
// overlay = "caption": hiện 2 dòng Tên + Địa chỉ (kiểu batdongsan.com.vn).
// overlay = "none": chỉ ảnh (khi khách hàng up ảnh đã thiết kế sẵn chữ).
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
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (banners.length <= 1 || paused) return;
    const id = setTimeout(() => setActive((i) => (i + 1) % banners.length), 5500);
    return () => clearTimeout(id);
  }, [active, paused, banners.length]);

  if (banners.length === 0) return null;
  const cur = banners[active];

  return (
    <div
      className={`relative isolate w-full overflow-hidden rounded-2xl border border-white/10 ${aspect}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {banners.map((b, i) => (
        <Image
          key={b.id}
          src={asset(b.image)}
          alt={b.title}
          fill
          priority={i === 0}
          sizes="100vw"
          className={`object-cover transition-opacity duration-[900ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
            i === active ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}

      {/* 2 dòng: Tên + Địa chỉ (kiểu batdongsan) */}
      {overlay === "caption" && (
        <>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
          <div key={active} className="hero-sub pointer-events-none absolute inset-x-0 bottom-0 p-5 sm:p-7 lg:p-9">
            <h2 className="font-serif text-xl font-semibold leading-tight text-white drop-shadow-lg sm:text-2xl lg:text-[1.9rem]">
              {cur.title}
            </h2>
            {cur.subtitle && (
              <p className="mt-1.5 flex items-center gap-1.5 text-sm text-white/85 drop-shadow sm:text-[15px]">
                <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span className="line-clamp-1">{cur.subtitle}</span>
              </p>
            )}
          </div>
        </>
      )}

      {/* Cả banner là 1 liên kết */}
      {cur.href && <Link href={cur.href} aria-label={cur.title} className="absolute inset-0 z-[1]" />}

      {/* Điều hướng */}
      {banners.length > 1 && (
        <>
          <Nav dir="prev" onClick={() => setActive((i) => (i - 1 + banners.length) % banners.length)} />
          <Nav dir="next" onClick={() => setActive((i) => (i + 1) % banners.length)} />
          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2">
            {banners.map((b, i) => (
              <button
                key={b.id}
                type="button"
                aria-label={`Banner ${i + 1}`}
                onClick={() => setActive(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === active ? "w-7 bg-cl-gold" : "w-3 bg-white/60 hover:bg-white/90"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Nav({ dir, onClick }: { dir: "prev" | "next"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === "prev" ? "Trước" : "Sau"}
      className={`absolute top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/40 text-white backdrop-blur-sm transition hover:border-cl-gold/70 hover:bg-black/60 sm:flex ${
        dir === "prev" ? "left-3" : "right-3"
      }`}
    >
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d={dir === "prev" ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
      </svg>
    </button>
  );
}
