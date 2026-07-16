"use client";

import { useEffect, useState } from "react";

// Sidebar "Danh sách dịch vụ" cho trang Báo giá truyền thông (tham khảo Homedy).
// Tự tô sáng mục đang xem khi cuộn (IntersectionObserver — chỉ đổi màu, không reflow).
export default function PricingSidebar({
  items,
  hotline,
}: {
  items: { label: string; href: string }[];
  hotline: string;
}) {
  const [active, setActive] = useState(items[0]?.href ?? "");

  useEffect(() => {
    const sections = items
      .map((m) => document.querySelector(m.href))
      .filter((el): el is Element => !!el);
    if (!sections.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        // Lấy section đang hiện gần đỉnh viewport nhất
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(`#${visible[0].target.id}`);
      },
      { rootMargin: "-96px 0px -60% 0px", threshold: 0 }
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [items]);

  return (
    <aside className="lg:sticky lg:top-20 lg:self-start">
      <div className="overflow-hidden rounded-2xl border border-cvr-line bg-white shadow-lux">
        <p className="border-b border-cvr-line px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.18em] text-cvr-muted">
          Danh sách dịch vụ
        </p>
        <nav className="py-1.5">
          {items.map((m) => {
            const isActive = active === m.href;
            return (
              <a
                key={m.href}
                href={m.href}
                className={`relative block px-5 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "font-semibold text-cvr-ink"
                    : "font-medium text-cvr-body hover:text-cvr-ink"
                }`}
              >
                {/* Thanh nhấn vàng bên trái cho mục đang xem */}
                <span
                  className={`absolute bottom-1.5 left-0 top-1.5 w-[3px] rounded-r bg-cvr-gold transition-opacity ${
                    isActive ? "opacity-100" : "opacity-0"
                  }`}
                />
                {m.label}
              </a>
            );
          })}
        </nav>
      </div>

      {/* Hotline — nền đen luxury, CTA vàng */}
      <div className="mt-4 overflow-hidden rounded-2xl bg-gradient-to-br from-cvr-ink to-[#2b2b2e] p-5 text-center shadow-lux">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cvr-gold-soft">
          Hotline tư vấn
        </p>
        <a
          href={`tel:${hotline.replace(/\s/g, "")}`}
          className="mt-1.5 block text-2xl font-bold tracking-tight text-white"
        >
          {hotline}
        </a>
        <p className="mt-1 text-xs text-cvr-line">Hỗ trợ 8:00 – 21:00 hằng ngày</p>
        <a
          href="#lien-he"
          className="mt-4 block rounded-full bg-cvr-gold py-2.5 text-sm font-bold text-cvr-ink transition hover:bg-cvr-gold-soft"
        >
          Nhận tư vấn miễn phí
        </a>
      </div>
    </aside>
  );
}
