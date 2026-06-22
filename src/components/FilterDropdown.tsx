"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// Nút lọc kiểu Homedy: bấm mở panel (render ra body bằng portal nên KHÔNG bao giờ
// bị section khác đè/cắt), tự đóng khi bấm ra ngoài / Esc / cuộn nhiều.
export default function FilterDropdown({
  label,
  summary,
  active,
  panelClassName = "w-72",
  className = "",
  align = "left",
  compact = false,
  children,
}: {
  label: string;
  summary?: string;
  active?: boolean;
  panelClassName?: string;
  className?: string;
  align?: "left" | "right";
  compact?: boolean;
  children: (api: { close: () => void }) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top?: number; bottom?: number; left?: number; right?: number; maxH?: number }>({ top: 0 });

  // Mở XUỐNG nếu đủ chỗ phía dưới, ngược lại mở LÊN — linh hoạt theo không gian trang.
  const reposition = useCallback(() => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const m = 8;
    const panelH = panelRef.current?.offsetHeight ?? 360;
    const spaceBelow = window.innerHeight - r.bottom;
    const spaceAbove = r.top;
    const openUp = spaceBelow < panelH + m && spaceAbove > spaceBelow;
    const avail = (openUp ? spaceAbove : spaceBelow) - m * 2;
    const maxH = Math.max(200, Math.min(avail, Math.round(window.innerHeight * 0.7)));
    const vert = openUp ? { bottom: Math.max(m, window.innerHeight - r.top + m) } : { top: r.bottom + m };
    const horiz =
      align === "right"
        ? { right: Math.max(8, window.innerWidth - r.right) }
        : { left: Math.max(8, Math.min(r.left, window.innerWidth - 8)) };
    setPos({ ...vert, ...horiz, maxH });
  }, [align]);

  useLayoutEffect(() => {
    if (open) reposition();
  }, [open, reposition]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [open, reposition]);

  return (
    <div className={`relative ${className}`}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex ${compact ? "h-10 w-auto max-w-[150px]" : "h-11 w-full"} items-center justify-between gap-2 rounded-lg border px-3 text-sm outline-none transition ${
          active
            ? "border-cl-gold/60 bg-white/10 text-white"
            : "border-white/10 bg-white/5 text-white/80 hover:border-white/30"
        }`}
      >
        <span className="truncate">{active && summary ? summary : label}</span>
        <svg
          className={`h-4 w-4 shrink-0 text-white/50 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open &&
        createPortal(
          <div
            ref={panelRef}
            style={{ top: pos.top, bottom: pos.bottom, left: pos.left, right: pos.right, maxHeight: pos.maxH }}
            className={`fixed z-[100] max-w-[calc(100vw-1rem)] overflow-y-auto rounded-xl border border-white/12 bg-cl-ink/95 p-3 shadow-2xl shadow-black/60 ring-1 ring-inset ring-white/10 backdrop-blur-xl ${panelClassName}`}
          >
            {children({ close: () => setOpen(false) })}
          </div>,
          document.body,
        )}
    </div>
  );
}

// Hàng nút "Đặt lại / Áp dụng" cuối mỗi panel
export function PanelActions({
  onReset,
  onApply,
}: {
  onReset: () => void;
  onApply: () => void;
}) {
  return (
    <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/10 pt-3">
      <button
        type="button"
        onClick={onReset}
        className="text-xs font-medium text-white/55 transition hover:text-white"
      >
        Đặt lại
      </button>
      <button
        type="button"
        onClick={onApply}
        className="rounded-lg bg-cl-gold px-4 py-1.5 text-xs font-semibold text-cl-ink transition hover:bg-cl-gold-soft"
      >
        Áp dụng
      </button>
    </div>
  );
}
