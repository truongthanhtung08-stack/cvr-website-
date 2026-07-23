"use client";

import { useEffect, useState } from "react";

// Menu điều hướng DÍNH của trang dự án — tự sáng mục đang xem khi cuộn (scroll-spy),
// bấm để cuộn mượt tới đúng mục. Nhận danh sách {id, label} khớp id các <section>.
export default function ProjectNav({ items }: { items: { id: string; label: string }[] }) {
  const [active, setActive] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const sections = items
      .map((it) => document.getElementById(it.id))
      .filter((el): el is HTMLElement => el != null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      // Vùng nhận diện: dải ngang gần đầu trang (dưới header dính) → mục ở đầu = active
      { rootMargin: "-88px 0px -65% 0px", threshold: 0 },
    );
    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="sticky top-[56px] z-30 -mx-1 overflow-x-auto border-b border-cvr-line bg-white/90 px-1 backdrop-blur-md">
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
