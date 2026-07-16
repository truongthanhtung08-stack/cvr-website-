"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import PropertyCard from "@/components/PropertyCard";
import { featuredListings, type Listing } from "@/lib/data";
import { tierRank } from "@/lib/packages";
import { smoothScrollTo } from "@/lib/scroll";
import { useAutoSlide } from "@/lib/useAutoSlide";

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

// ── Cấu trúc MỖI SLIDE: 2 hàng × 4 tin, thẻ CÙNG KÍCH THƯỚC (variant "tier") ──
// Xếp theo cấp tin: Diamond → Gold → Silver → Basic (tierRank), cấp cao đứng trước.
// Phân biệt cấp bằng màu tiêu đề + số dòng mô tả + hiện thành viên (trong PropertyCard).
const PER_SLIDE = 8; // 2 hàng × 4 tin
const SLIDE_COUNT = 2; // chạy 2 slides

// items: tin từ Supabase (server truyền xuống) — không truyền thì dùng dữ liệu mẫu.
export default function FeaturedListings({ items = featuredListings }: { items?: Listing[] }) {
  const [activeTab, setActiveTab] = useState("Tất cả");
  const [slideIdx, setSlideIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  // Lọc theo tab → xếp theo cấp tin (cao trước) → chia 2 slides nối tiếp, mỗi slide 8 tin
  const activeMatch = typeTabs.find((t) => t.label === activeTab)?.match ?? (() => true);
  const sorted = items
    .filter((l) => activeMatch(l))
    .sort((a, b) => tierRank(a.badge) - tierRank(b.badge));
  const slides = Array.from({ length: SLIDE_COUNT }, (_, i) =>
    sorted.slice(i * PER_SLIDE, (i + 1) * PER_SLIDE)
  ).filter((items) => items.length > 0);

  // Cuộn tới slide i (mũi tên + chấm điều hướng).
  const goTo = (i: number) => {
    const el = trackRef.current;
    if (el) smoothScrollTo(el, i * el.clientWidth);
  };

  // Tự chạy: 10s/slide (8 tin/slide cần thời gian đọc) — chỉ khi section hiện
  // trong khung nhìn & không tương tác; đổi tab lọc thì về slide đầu.
  useAutoSlide(trackRef, slides.length, paused, 10000);
  const active = Math.min(slideIdx, slides.length - 1);

  return (
    <section className="section-edge bg-white">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">

        {/* Tiêu đề (link "Xem tất cả" đặt ở CUỐI phần) */}
        <h2 className="text-2xl font-semibold text-cvr-ink">
          Bất động sản dành cho bạn
        </h2>

        {/* Tabs loại hình */}
        <div className="mt-5 flex flex-wrap gap-2">
          {typeTabs.map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={() => { setActiveTab(t.label); setSlideIdx(0); trackRef.current?.scrollTo({ left: 0 }); }}
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

        {/* Slider 2 slides — mỗi slide 2 hàng × 4 tin, xếp theo cấp VIP */}
        {slides.length > 0 ? (
          <>
            {/* Track scroll-snap: tự chạy + chấm điều hướng + mũi tên (chuột)
                + vuốt ngang tự nhiên (touchpad 2 ngón / màn hình cảm ứng) */}
            <div className="relative mt-5">
              <div
                ref={trackRef}
                className="no-scrollbar flex snap-x snap-mandatory items-start overflow-x-auto overscroll-x-contain"
                onScroll={(e) =>
                  setSlideIdx(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))
                }
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
                onTouchStart={() => setPaused(true)}
              >
                {slides.map((items, i) => (
                  <div key={i} className="w-full shrink-0 snap-start">
                    {/* Mobile 1 tin/hàng (thẻ đủ rộng để đọc) · tablet 2 · desktop 4 */}
                  <div className="cards-stagger grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                      {items.map((item) => (
                        <PropertyCard key={item.id} item={item} variant="tier" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Mũi tên chuyển slide — chỉ desktop (mobile/touchpad vuốt tay) */}
              {slides.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Slide trước"
                    onClick={() => goTo((active - 1 + slides.length) % slides.length)}
                    className="absolute -left-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-cvr-line bg-white/90 text-cvr-ink shadow-lux backdrop-blur transition hover:bg-white sm:flex"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <button
                    type="button"
                    aria-label="Slide sau"
                    onClick={() => goTo((active + 1) % slides.length)}
                    className="absolute -right-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-cvr-line bg-white/90 text-cvr-ink shadow-lux backdrop-blur transition hover:bg-white sm:flex"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </button>
                </>
              )}
            </div>

            {/* Chấm chuyển slide (giữa) + Xem tất cả (phải) */}
            <div className="relative mt-6 flex items-center justify-center">
              {slides.length > 1 && (
                <div className="flex gap-2">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Slide ${i + 1}`}
                      onClick={() => goTo(i)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        i === active ? "w-6 bg-cvr-ink" : "w-2 bg-black/20 hover:bg-black/40"
                      }`}
                    />
                  ))}
                </div>
              )}
              <Link
                href="/mua-ban"
                className="absolute right-0 text-sm font-medium text-cvr-muted transition-colors hover:text-cvr-ink"
              >
                Xem tất cả →
              </Link>
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
