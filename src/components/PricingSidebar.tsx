"use client";

import { useEffect, useState } from "react";

// `href` có = tên nhóm bấm được (vd tên gói → cả gói), các mục con thụt vào dưới (22/10/2026)
export type SidebarGroup = { title: string; href?: string; items: { label: string; href: string }[] };

// Sidebar trang Báo giá — 2 PHẦN: "Danh sách dịch vụ" (neo trong trang) và
// "Công cụ tiện ích" (link sang trang tiện ích) nằm phía sau.
// Tự tô sáng mục đang xem khi cuộn (IntersectionObserver — chỉ đổi màu, không reflow).
export default function PricingSidebar({
  groups,
}: {
  groups: SidebarGroup[];
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
    <>
      {/* ĐIỆN THOẠI: KHÔNG còn dải nút mục (chủ dự án 22/10/2026 tối: "thanh menu này, khoảng cách, màu nút lộn xộn") — menu Báo giá
          trên đầu web đã có đủ các mục; trang đã gọn, cuộn là thấy. Máy tính giữ cột menu dọc. */}
      {/* ── MÁY TÍNH: giữ nguyên 2 khối menu dọc đã duyệt ── */}
      <aside className="hidden lg:sticky lg:top-20 lg:block lg:self-start">
      {/* 2 phần xếp dọc: Danh sách dịch vụ → Công cụ tiện ích.
          Kiểu Apple: khối bo 2xl, không đường kẻ giữa các mục, nền sáng khi rê chuột. */}
      {/* CÂY MỤC GIỐNG menu Báo giá trên đầu web (22/10/2026): tên gói (bấm ra cả gói) → mục con thụt vào. Nhóm không có href
          (trang khác dùng) giữ kiểu nhãn chữ nhỏ như cũ. */}
      <nav className="rounded-2xl border border-cvr-line bg-white p-2.5 shadow-lux">
        {groups.map((g, gi) => (
          <div key={g.title || "muc"} className={gi > 0 ? "mt-1.5 border-t border-cvr-line/70 pt-1.5" : ""}>
            {g.title && (g.href ? (
              <a href={g.href} className="block rounded-xl px-3.5 py-2 text-[14px] font-semibold leading-snug text-cvr-ink transition-colors hover:bg-cvr-surface">
                {g.title}
              </a>
            ) : (
              <p className="px-3.5 pb-2 pt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-cvr-faint">
                {g.title}
              </p>
            ))}
            {g.items.map((m) => {
              const isActive = active === m.href;
              return (
                <a
                  key={m.href}
                  href={m.href}
                  className={`relative block rounded-xl py-2 pr-3.5 text-[13.5px] leading-snug transition-colors ${g.href ? "pl-7" : "pl-3.5"} ${
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
          </div>
        ))}
      </nav>

      </aside>
    </>
  );
}
