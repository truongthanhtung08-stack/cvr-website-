"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { asset } from "@/lib/asset";
import HomeSearch from "@/components/HomeSearch";
import { homeBanners } from "@/lib/banners";

// Hero trang chủ: banner 16:6 (1600×600) chạy TRÀN VIỀN (object-cover, đúng tỷ lệ →
// không trống 2 bên, không cắt). Click BẤT CỨ ĐÂU trên hero → mở link banner.
// Bộ lọc chồng lên góc dưới-trái vẫn bấm được. Tỷ lệ đủ thấp để thấy mục dưới.
export default function Hero() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const banners = homeBanners;
  const cur = banners[active];

  useEffect(() => {
    if (banners.length <= 1 || paused) return;
    const id = setTimeout(() => setActive((i) => (i + 1) % banners.length), 6000);
    return () => clearTimeout(id);
  }, [active, paused, banners.length]);

  return (
    <section
      className="relative isolate flex min-h-[340px] flex-col sm:aspect-[1600/600]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Banner nền (carousel) — TRÀN VIỀN, không trống 2 bên */}
      <div className="absolute inset-0 -z-10 overflow-hidden bg-cl-ink">
        {banners.map((b, i) => (
          <Image
            key={b.id}
            src={asset(b.image)}
            alt={b.title}
            fill
            priority={i === 0}
            quality={92}
            sizes="100vw"
            className={`object-cover transition-opacity duration-[1000ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
              i === active ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
        {/* Phủ nhẹ: trên (header) → giữa rõ → dưới về nền (bộ lọc & nối section) */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-cl-ink" />
        <div className="absolute inset-0 bg-gradient-to-br from-black/45 via-transparent to-transparent" />
      </div>

      {/* Click BẤT CỨ ĐÂU trên hero → mở link banner ở TAB MỚI (nằm dưới phần điều khiển) */}
      <Link href={cur.href ?? "#"} target="_blank" rel="noopener noreferrer" aria-label={cur.title} className="absolute inset-0 z-0" />

      {/* Mũi tên chuyển banner — 2 bên giữa hero */}
      {banners.length > 1 && (
        <>
          <SideNav dir="prev" onClick={() => setActive((i) => (i - 1 + banners.length) % banners.length)} />
          <SideNav dir="next" onClick={() => setActive((i) => (i + 1) % banners.length)} />
        </>
      )}

      {/* Nội dung: caption cho click xuyên qua (ra link), chỉ BỘ LỌC bắt sự kiện */}
      <div className="pointer-events-none relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pb-9 pt-24 sm:px-6 lg:px-12">
        <div key={active} className="hero-sub mt-auto mb-5 max-w-2xl">
          <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-cl-gold/50 bg-black/30 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-cl-gold-soft backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-cl-gold" />
            Tài trợ
          </span>
          <h2 className="font-[family-name:var(--font-montserrat)] text-xl font-bold leading-[1.15] tracking-tight text-white [text-shadow:0_2px_14px_rgba(0,0,0,0.7)] sm:text-[1.75rem] lg:text-[2.1rem]">
            {cur.title}
          </h2>
          {cur.subtitle && (
            <p className="mt-1.5 max-w-xl text-sm text-white/90 [text-shadow:0_1px_8px_rgba(0,0,0,0.6)]">{cur.subtitle}</p>
          )}
        </div>

        {/* BỘ LỌC — thu gọn về TRÁI (không kéo full ngang), bật lại pointer-events */}
        <div className="pointer-events-auto max-w-4xl">
          <HomeSearch />
        </div>
      </div>

      {/* Chấm chỉ slide */}
      {banners.length > 1 && (
        <div className="absolute bottom-3 right-5 z-20 flex items-center gap-2">
          {banners.map((b, i) => (
            <button
              key={b.id}
              type="button"
              aria-label={`Banner ${i + 1}`}
              onClick={() => setActive(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === active ? "w-7 bg-cl-gold" : "w-3 bg-white/50 hover:bg-white/80"}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function SideNav({ dir, onClick }: { dir: "prev" | "next"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === "prev" ? "Banner trước" : "Banner sau"}
      className={`absolute top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/35 text-white backdrop-blur-sm transition hover:border-cl-gold/70 hover:bg-black/55 ${
        dir === "prev" ? "left-2 sm:left-4" : "right-2 sm:right-4"
      }`}
    >
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d={dir === "prev" ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
      </svg>
    </button>
  );
}
