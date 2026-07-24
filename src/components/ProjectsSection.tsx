"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/lib/data";
import { smoothScrollTo } from "@/lib/scroll";
import { useAutoSlide } from "@/lib/useAutoSlide";

const PER_SLIDE = 4; // 1 hàng × 4 dự án mỗi slide (số slide KHÔNG giới hạn)

// Dự án do trang cha truyền vào (đọc từ Supabase — admin đăng gì hiện nấy).
export default function ProjectsSection({ projects }: { projects: Project[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);

  // Chia toàn bộ dự án thành các slide 4 dự án (không cắt bớt)
  // (hooks phải gọi trước early-return — kiểm tra rỗng đặt ở dưới)
  const slides: typeof projects[] = [];
  for (let i = 0; i < projects.length; i += PER_SLIDE) {
    slides.push(projects.slice(i, i + PER_SLIDE));
  }
  const totalSlides = Math.max(slides.length, 1);
  const current = Math.min(slide, totalSlides - 1);

  const goTo = (i: number) => {
    const el = trackRef.current;
    const idx = (i + totalSlides) % totalSlides;
    if (el) smoothScrollTo(el, idx * el.clientWidth);
  };

  // Tự chạy: 7s/slide (4 thẻ dự án, ít chữ hơn tin BĐS) — chỉ khi section hiện
  // trong khung nhìn & không tương tác. Lệch nhịp 10s của "BĐS dành cho bạn"
  // để 2 slider không chuyển cùng lúc (đỡ rối mắt).
  useAutoSlide(trackRef, totalSlides, paused, 7000);

  if (projects.length === 0) return null;

  return (
    <section className="section-edge bg-cvr-surface">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <h2 className="text-xl font-semibold text-cvr-ink sm:text-2xl">
          Dự án nổi bật
        </h2>

        {/* Track scroll-snap: tự chạy + chấm/mũi tên + touchpad/mobile vuốt tự nhiên */}
        <div className="relative mt-4 sm:mt-5">
          <div
            ref={trackRef}
            className="no-scrollbar flex snap-x snap-mandatory items-start overflow-x-auto overscroll-x-contain"
            onScroll={(e) =>
              setSlide(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))
            }
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onTouchStart={() => setPaused(true)}
          >
            {slides.map((group, gi) => (
              <div key={gi} className="w-full shrink-0 snap-start">
                <div className="cards-stagger grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {group.map((p) => (
                    <Link
                      key={p.name}
                      href="/du-an"
                      className="card-lux group relative flex flex-col overflow-hidden rounded-none border border-cvr-line bg-white shadow-lux hover:-translate-y-2 hover:border-cvr-blue/45 shadow-lux-hover"
                    >
                      <span className="card-sheen" aria-hidden />
                      <div className="relative aspect-[16/10] overflow-hidden sm:aspect-[4/3]">
                        <Image
                          src={p.image}
                          alt={p.name}
                          fill
                          sizes="(max-width: 768px) 100vw, 25vw"
                          className="object-cover transition-transform duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.07]"
                        />
                        <span className="absolute left-3 top-3 bg-white/90 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-cvr-ink">
                          {p.status}
                        </span>
                      </div>
                      <div className="flex flex-1 flex-col p-4">
                        <h3 className="font-semibold leading-snug text-cvr-ink">{p.name}</h3>
                        <p className="mt-1 flex items-center gap-1 text-xs text-cvr-muted">
                          <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          {p.location}
                        </p>
                        <div className="mt-3 flex items-center justify-between border-t border-cvr-line pt-3">
                          <span className="text-xs text-cvr-muted">{p.type}</span>
                          <span className="text-sm font-semibold text-cvr-ink">{p.priceFrom}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Mũi tên chuyển slide — chỉ desktop (mobile/touchpad vuốt tay) */}
          {totalSlides > 1 && (
            <>
              <button
                type="button"
                aria-label="Slide trước"
                onClick={() => goTo(current - 1)}
                className="absolute -left-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-cvr-line bg-white/90 text-cvr-ink shadow-lux backdrop-blur transition hover:bg-white sm:flex"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button
                type="button"
                aria-label="Slide tiếp"
                onClick={() => goTo(current + 1)}
                className="absolute -right-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-cvr-line bg-white/90 text-cvr-ink shadow-lux backdrop-blur transition hover:bg-white sm:flex"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            </>
          )}
        </div>

        {/* Hàng cuối: chấm chuyển slide (giữa) — "Xem tất cả" (phải) */}
        <div className="relative mt-4 flex items-center justify-center sm:mt-6">
          {totalSlides > 1 && (
            <div className="flex gap-2">
              {Array.from({ length: totalSlides }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Slide ${i + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 ${i === current ? "w-6 bg-cvr-ink" : "w-2 bg-cvr-line hover:bg-cvr-muted"}`}
                />
              ))}
            </div>
          )}
          <Link href="/du-an" className="absolute right-0 text-sm font-medium text-cvr-muted transition-colors hover:text-cvr-ink">
            Xem tất cả →
          </Link>
        </div>
      </div>
    </section>
  );
}
