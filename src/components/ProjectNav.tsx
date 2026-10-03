"use client";

import { useEffect, useRef, useState } from "react";

// Menu điều hướng DÍNH của trang dự án — tự sáng mục đang xem khi cuộn (scroll-spy),
// bấm để cuộn mượt tới đúng mục. Nhận danh sách {id, label} khớp id các <section>.
export default function ProjectNav({ items }: { items: { id: string; label: string }[] }) {
  const [active, setActive] = useState(items[0]?.id ?? "");
  const thanh = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Mục đang xem = mục CUỐI CÙNG đã cuộn qua mép dưới thanh menu dính. Trước dùng
    // IntersectionObserver chỉ xét các mục VỪA đổi trạng thái → cuộn nhanh qua một mục
    // dài là kẹt sáng mục cũ (đang đọc Lịch sử giá mà vẫn sáng "Đặc điểm").
    // Tìm lại các mục MỖI LẦN tính: khối Lịch sử giá tải sau (stream) nên lúc gắn
    // menu nó chưa có trên trang — tìm một lần là bỏ sót nó vĩnh viễn.
    let raf = 0;
    const tinh = () => {
      raf = 0;
      const sections = items
        .map((it) => document.getElementById(it.id))
        .filter((el): el is HTMLElement => el != null);
      if (sections.length === 0) return;
      const mep = (thanh.current?.getBoundingClientRect().bottom ?? 0) + 24;
      let cur = sections[0].id;
      for (const el of sections) if (el.getBoundingClientRect().top <= mep) cur = el.id;
      // Cuộn chạm đáy trang: mục cuối (thường ngắn) không bao giờ lên tới mép → chọn luôn.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) cur = sections[sections.length - 1].id;
      setActive(cur);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(tinh); };
    tinh();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [items]);

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    // MOBILE: dính NGAY DƯỚI thanh "Quay lại" (header 60px + thanh back 53px = 113px)
    // — trước để 56px nên menu bị thanh back đè lên. PC: dính dưới header (60px).
    <div ref={thanh} className="sticky top-[113px] z-30 -mx-1 overflow-x-auto border-b border-cvr-line bg-white/95 px-1 backdrop-blur-md lg:top-[60px]">
      <div className="flex gap-1 whitespace-nowrap py-1">
        {items.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => scrollTo(t.id)}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              active === t.id
                ? "bg-cvr-ink text-white"
                : "text-cvr-muted hover:bg-black/5 hover:text-cvr-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
