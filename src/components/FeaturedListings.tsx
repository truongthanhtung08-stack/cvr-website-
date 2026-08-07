"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import PropertyCard from "@/components/PropertyCard";
import { featuredListings, type Listing } from "@/lib/data";
import ListingBrowser from "@/components/ListingBrowser";
import { useHomeSection } from "@/components/HomeExpand";
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
  // PC: bấm "Xem thêm" → đổi sang bố cục trang danh sách (list + cột phải),
  // đồng thời ẩn mọi phần khác của trang chủ (trạng thái dùng chung qua context).
  const { expanded, hidden, toggle } = useHomeSection("tin");

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

  // Bấm "Xem thêm" mở danh sách ĐÚNG mục đích của tab đang chọn (tab "Cho thuê"
  // → danh sách cho thuê).
  const expandPurpose: "ban" | "thue" = activeTab === "Cho thuê" ? "thue" : "ban";

  // Khối khác đang mở → khối này ẩn
  if (hidden) return null;

  // ── ĐÃ BẤM "XEM THÊM": trang chủ đổi sang ĐÚNG bố cục trang Mua bán —
  //    danh sách tin bên trái + cột phải (lọc theo giá, theo khu vực…) + phân trang.
  //    Dùng lại chính ListingBrowser của /mua-ban nên không lệch cấu trúc.
  //    KHÔNG bọc thêm khung px-4: ListingBrowser đã có khung max-w-7xl + lề ngang
  //    riêng — bọc nữa là lề bị cộng dồn, hẹp hơn trang /mua-ban.
  if (expanded) {
    return (
      <section className="section-edge bg-white">
        <ListingBrowser
          heading={expandPurpose === "thue" ? "Bất động sản cho thuê" : "Bất động sản mua bán"}
          purpose={expandPurpose}
          items={items}
        />
      </section>
    );
  }

  return (
    <section className="section-edge bg-white">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 sm:py-4 lg:px-8">

        {/* Tiêu đề — chiếm TRỌN dòng (không để nút ép xuống 2 dòng) */}
        <h2 className="text-xl font-semibold text-cvr-ink sm:text-2xl">
          Bất động sản dành cho bạn
        </h2>

        {/* Tabs loại hình — MOBILE: cuộn ngang ĐÚNG 1 dòng (không xuống hàng, không bị cắt) */}
        <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-0.5 sm:mx-0 sm:mt-5 sm:flex-wrap sm:overflow-visible sm:px-0">
          {typeTabs.map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={() => { setActiveTab(t.label); setSlideIdx(0); trackRef.current?.scrollTo({ left: 0 }); }}
              className={`shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] sm:py-2 ${
                activeTab === t.label
                  ? "bg-cvr-ink text-white shadow-lg shadow-black/10 sm:scale-105"
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
            {/* ── ĐIỆN THOẠI (< 640px): lướt ngang TỪNG THẺ lớn, ló mép thẻ sau —
                khách vuốt để xem hết tin. Thẻ cuối = "Xem tất cả". ── */}
            <div className="sm:hidden">
              <div className="no-scrollbar -mx-4 mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mt-5">
                {sorted.slice(0, SLIDE_COUNT * PER_SLIDE).map((item) => (
                  <div key={item.id} className="w-[90%] shrink-0 snap-start">
                    <PropertyCard item={item} variant="tier" />
                  </div>
                ))}
              </div>
              {/* Nút XEM THÊM (điện thoại) — CÙNG kích thước với mọi khối khác */}
              <div className="flex justify-center">
              <button
                type="button"
                onClick={toggle}
                className="mt-6 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-cvr-line px-6 text-sm font-semibold text-cvr-ink transition active:bg-cvr-surface"
              >
                Xem thêm
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </button>
              </div>
            </div>

            {/* ── TABLET / MÁY TÍNH (≥ 640px): GIỮ NGUYÊN slider 2 slide đã duyệt ── */}
            <div className={expanded ? "hidden" : "hidden sm:block"}>
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
            </div>
            </div>

            {/* Nút Xem thêm — CHỈ PC (điện thoại giữ nút "Xem thêm" → /tim-kiem) */}
            <div className="mt-6 hidden justify-center sm:flex">
              <button
                type="button"
                onClick={toggle}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-cvr-line px-6 text-sm font-semibold text-cvr-ink transition hover:bg-cvr-surface"
              >
                Xem thêm
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
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
