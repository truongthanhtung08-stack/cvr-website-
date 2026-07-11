"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { projects } from "@/lib/data";

const PER_SLIDE = 4; // 1 hàng × 4 dự án mỗi slide (số slide KHÔNG giới hạn)

export default function ProjectsSection() {
  const [slide, setSlide] = useState(0);

  // Chia toàn bộ dự án thành các slide 4 tin (không cắt bớt)
  const slides: typeof projects[] = [];
  for (let i = 0; i < projects.length; i += PER_SLIDE) {
    slides.push(projects.slice(i, i + PER_SLIDE));
  }
  const totalSlides = Math.max(slides.length, 1);
  const current = Math.min(slide, totalSlides - 1);
  const visible = slides[current] ?? [];

  const goTo = (i: number) => setSlide(Math.max(0, Math.min(i, totalSlides - 1)));

  return (
    <section className="section-edge bg-cvr-surface">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold text-cvr-ink">
          Dự án nổi bật
        </h2>

        {/* 1 hàng × 4 dự án */}
        <div className="cards-stagger mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {visible.map((p) => (
            <Link
              key={p.name}
              href="/du-an"
              className="card-lux group relative flex flex-col overflow-hidden rounded-none border border-cvr-line bg-white shadow-lux hover:-translate-y-2 hover:border-cvr-blue/45 shadow-lux-hover"
            >
              <span className="card-sheen" aria-hidden />
              <div className="relative aspect-[4/3] overflow-hidden">
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

        {/* Hàng cuối: nút chuyển slide (giữa) — "Xem tất cả" (phải), cùng 1 hàng */}
        <div className="mt-5 grid grid-cols-3 items-center">
          <span aria-hidden /> {/* spacer trái để nav nằm chính giữa */}

          {totalSlides > 1 ? (
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => goTo(current - 1)}
                disabled={current === 0}
                aria-label="Slide trước"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-cvr-line bg-white text-cvr-body shadow-sm transition hover:border-cvr-ink hover:text-cvr-ink disabled:cursor-not-allowed disabled:opacity-30"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
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
              <button
                type="button"
                onClick={() => goTo(current + 1)}
                disabled={current === totalSlides - 1}
                aria-label="Slide tiếp"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-cvr-line bg-white text-cvr-body shadow-sm transition hover:border-cvr-ink hover:text-cvr-ink disabled:cursor-not-allowed disabled:opacity-30"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          ) : (
            <span aria-hidden />
          )}

          <div className="flex justify-end">
            <Link href="/du-an" className="text-sm font-medium text-cvr-muted transition-colors hover:text-cvr-ink">
              Xem tất cả →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
