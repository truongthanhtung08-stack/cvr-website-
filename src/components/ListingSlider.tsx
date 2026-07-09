"use client";

import { useRef } from "react";
import PropertyCard from "@/components/PropertyCard";
import type { Listing } from "@/lib/data";

// Slider cuộn ngang cho phần "Bất động sản tương tự" — hiện HẾT số tin tương tự
// (không giới hạn), scroll-snap mượt + nút ‹ › điều hướng. Kiểu Apple/Batdongsan.
export default function ListingSlider({ items }: { items: Listing[] }) {
  const ref = useRef<HTMLDivElement>(null);

  const nudge = (dir: number) => {
    const el = ref.current;
    if (!el) return;
    // nhảy đúng 1 "trang" = trọn bề rộng khung nhìn (4 mục trên desktop)
    el.scrollBy({ left: dir * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="group relative">
      <div
        ref={ref}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => (
          <div
            key={item.id}
            className="w-[80%] shrink-0 snap-start sm:w-[calc((100%-20px)/2)] lg:w-[calc((100%-60px)/4)]"
          >
            <PropertyCard item={item} />
          </div>
        ))}
      </div>

      {/* Nút điều hướng — chỉ hiện khi có nhiều hơn số cột nhìn thấy (desktop) */}
      {items.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Xem tin trước"
            onClick={() => nudge(-1)}
            className="absolute -left-3 top-[30%] hidden h-10 w-10 items-center justify-center rounded-full border border-cvr-line bg-white text-cvr-body shadow-lux transition hover:border-cvr-ink hover:text-cvr-ink sm:flex"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button
            type="button"
            aria-label="Xem tin tiếp"
            onClick={() => nudge(1)}
            className="absolute -right-3 top-[30%] hidden h-10 w-10 items-center justify-center rounded-full border border-cvr-line bg-white text-cvr-body shadow-lux transition hover:border-cvr-ink hover:text-cvr-ink sm:flex"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </>
      )}
    </div>
  );
}
