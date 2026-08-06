"use client";

import { useEffect, useState } from "react";

export type SidebarGroup = { title: string; items: { label: string; href: string }[] };

// Sidebar trang Báo giá — 2 PHẦN: "Danh sách dịch vụ" (neo trong trang) và
// "Công cụ tiện ích" (link sang trang tiện ích) nằm phía sau.
// Tự tô sáng mục đang xem khi cuộn (IntersectionObserver — chỉ đổi màu, không reflow).
export default function PricingSidebar({
  groups,
  hotline,
}: {
  groups: SidebarGroup[];
  hotline: string;
}) {
  const [active, setActive] = useState(groups[0]?.items[0]?.href ?? "");

  useEffect(() => {
    const sections = groups
      .flatMap((g) => g.items)
      // Chỉ theo dõi mục neo trong trang (#...) — link sang trang khác bỏ qua.
      .filter((m) => m.href.startsWith("#"))
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
  }, [groups]);

  return (
    <aside className="lg:sticky lg:top-20 lg:self-start">
      {/* 2 phần xếp dọc: Danh sách dịch vụ → Công cụ tiện ích.
          Kiểu Apple: khối bo 2xl, không đường kẻ giữa các mục, nền sáng khi rê chuột. */}
      <div className="space-y-4">
        {groups.map((g) => (
          <nav key={g.title} className="rounded-2xl border border-cvr-line bg-white p-2 shadow-lux">
            <p className="px-3.5 pb-1.5 pt-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-cvr-faint">
              {g.title}
            </p>
            {g.items.map((m) => {
              const isActive = active === m.href;
              return (
                <a
                  key={m.href}
                  href={m.href}
                  className={`relative block rounded-xl px-3.5 py-2.5 text-sm transition-colors ${
                    isActive
                      ? "bg-cvr-surface font-semibold text-cvr-ink"
                      : "font-medium text-cvr-body hover:bg-cvr-surface hover:text-cvr-ink"
                  }`}
                >
                  {/* Thanh nhấn vàng bên trái cho mục đang xem */}
                  <span
                    className={`absolute bottom-2 left-0 top-2 w-[3px] rounded-r bg-cvr-gold transition-opacity ${
                      isActive ? "opacity-100" : "opacity-0"
                    }`}
                  />
                  {m.label}
                </a>
              );
            })}
          </nav>
        ))}
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
          className="mt-4 block rounded-full bg-cvr-gold py-2.5 text-sm font-bold text-white transition hover:bg-cvr-gold-soft"
        >
          Nhận tư vấn miễn phí
        </a>
      </div>
    </aside>
  );
}
