"use client";

import { useRef } from "react";
import PropertyCard from "@/components/PropertyCard";
import type { Listing } from "@/lib/data";
import { smoothScrollTo } from "@/lib/scroll";

// Slider cuộn ngang cho phần "Bất động sản tương tự" — hiện HẾT số tin tương tự
// (không giới hạn), scroll-snap mượt + nút ‹ › điều hướng. Kiểu Apple/Batdongsan.
export default function ListingSlider({ items }: { items: Listing[] }) {
  const ref = useRef<HTMLDivElement>(null);

  const nudge = (dir: number) => {
    const el = ref.current;
    if (!el) return;
    // nhảy đúng 1 "trang" = trọn bề rộng khung nhìn (4 mục trên desktop).
    // Kẹp trong [0, max] để không cuộn hụt ở hai đầu.
    const max = el.scrollWidth - el.clientWidth;
    smoothScrollTo(el, Math.max(0, Math.min(max, el.scrollLeft + dir * el.clientWidth)));
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
            // KHÔNG kéo thẻ cao bằng thẻ cao nhất (bỏ luật 18/10/2026): thẻ cao đúng nội dung, cả PC lẫn điện thoại — hàng người đăng
            // nằm ngay dưới mô tả, không dư khoảng trắng khi dải có thẻ nhiều cấp (23/10/2026)
            // ⛔ KHÔNG giãn thẻ (bỏ sm:flex 24/10/2026 — chủ dự án: "cái thẻ không có khoảng trắng phía dưới")
            className="w-[80%] shrink-0 snap-start sm:w-[calc((100%-20px)/2)] lg:w-[calc((100%-60px)/4)]"
          >
            {/* THẺ ĐÃ CHỐT TRÊN PC (PropertyCard "tier") dùng cho CẢ điện thoại (chủ dự án 23/10/2026: "tôi chốt cái thẻ thế nào trên PC") */}
            <PropertyCard item={item} variant="tier" />
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
