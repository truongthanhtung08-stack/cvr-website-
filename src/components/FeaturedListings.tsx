"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import PropertyCard from "@/components/PropertyCard";
import { featuredListings, type Listing } from "@/lib/data";

// ── Thứ tự ưu tiên badge ──────────────────────────────────────────────────────
const BADGE_RANK: Record<string, number> = { VIP: 0, "Nổi bật": 1, Mới: 2 };
function badgeScore(badge?: string) {
  return badge !== undefined ? (BADGE_RANK[badge] ?? 3) : 99;
}

// ── Tab nhanh: kết hợp MỤC ĐÍCH (bán/thuê) × LOẠI SẢN PHẨM ────────────────────
const isBan = (l: Listing) => (l.purpose ?? "ban") === "ban";
type TypeTab = { label: string; match: (l: Listing) => boolean };
const typeTabs: TypeTab[] = [
  { label: "Tất cả",        match: () => true },
  { label: "Bán đất",       match: (l) => isBan(l) && l.type.includes("Đất") },
  { label: "Bán nhà riêng", match: (l) => isBan(l) && (l.type.includes("Nhà") || l.type.includes("Villa") || l.type.includes("Biệt thự") || l.type.includes("Shophouse")) },
  { label: "Bán căn hộ",    match: (l) => isBan(l) && (l.type.includes("Căn hộ") || l.type.includes("Condotel")) },
  { label: "Cho thuê",      match: (l) => (l.purpose ?? "ban") === "thue" },
];

const PER_SLIDE = 8;  // 2 hàng × 4 cột mỗi slide
const MAX_SLIDES = 2; // trang chủ chỉ hiện đúng 2 slide (tối đa 16 tin)

export default function FeaturedListings() {
  const [activeTab, setActiveTab] = useState("Tất cả");
  const [slide, setSlide]         = useState(0);
  const trackRef                  = useRef<HTMLDivElement>(null);

  // Lọc + sắp xếp VIP trước, mới nhất sau
  const activeMatch = typeTabs.find((t) => t.label === activeTab)?.match ?? (() => true);
  const sorted = [...featuredListings]
    .filter((l) => activeMatch(l))
    .sort((a, b) => badgeScore(a.badge) - badgeScore(b.badge));

  // Chỉ lấy tối đa 16 tin (2 slide × 8), chia thành các slide 8 tin
  const capped = sorted.slice(0, PER_SLIDE * MAX_SLIDES);
  const slides: typeof sorted[] = [];
  for (let i = 0; i < capped.length; i += PER_SLIDE) {
    slides.push(capped.slice(i, i + PER_SLIDE));
  }
  const totalSlides = Math.max(slides.length, 1);
  const currentSlide = Math.min(slide, totalSlides - 1);
  const visibleItems = slides[currentSlide] ?? [];

  function goTo(idx: number) {
    setSlide(Math.max(0, Math.min(idx, totalSlides - 1)));
  }

  function handleTabChange(label: string) {
    setActiveTab(label);
    setSlide(0);
  }

  return (
    <section className="section-edge bg-white">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">

        {/* Tiêu đề (link "Xem tất cả" đặt ở CUỐI phần) */}
        <h2 className="font-serif text-2xl font-bold text-cvr-ink">
          Bất động sản dành cho bạn
        </h2>

        {/* Tabs loại hình */}
        <div className="mt-5 flex flex-wrap gap-2">
          {typeTabs.map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={() => handleTabChange(t.label)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                activeTab === t.label
                  ? "scale-105 bg-cvr-ink text-white shadow-lg shadow-black/10"
                  : "border border-black/15 text-cvr-body hover:border-black/40 hover:text-cvr-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Lưới tin */}
        {visibleItems.length > 0 ? (
          <>
            <div
              ref={trackRef}
              className="cards-stagger mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
            >
              {visibleItems.map((item) => (
                <PropertyCard key={item.id} item={item} />
              ))}
            </div>

            {/* Hàng cuối: nút chuyển slide (giữa) — "Xem tất cả" (phải), cùng 1 hàng */}
            <div className="mt-5 grid grid-cols-3 items-center">
              <span aria-hidden /> {/* spacer trái để nav nằm chính giữa */}

              {totalSlides > 1 ? (
                <div className="flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => goTo(currentSlide - 1)}
                    disabled={currentSlide === 0}
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
                        className={`h-2 rounded-full transition-all duration-300 ${i === currentSlide ? "w-6 bg-cvr-ink" : "w-2 bg-cvr-line hover:bg-cvr-muted"}`}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => goTo(currentSlide + 1)}
                    disabled={currentSlide === totalSlides - 1}
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
                <Link href="/mua-ban" className="text-sm font-medium text-cvr-muted transition-colors hover:text-cvr-ink">
                  Xem tất cả →
                </Link>
              </div>
            </div>
          </>
        ) : (
          <p className="mt-10 text-center text-cvr-muted">
            Đang cập nhật tin đăng theo loại hình này...
          </p>
        )}

      </div>
    </section>
  );
}
