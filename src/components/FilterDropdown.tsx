"use client";

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// Trạng thái mở DÙNG CHUNG cho cả nhóm dropdown: mỗi lúc chỉ 1 mục mở,
// bấm mục khác là chuyển ngay (mượt, chuẩn Homedy). Bọc nhóm bằng <FilterDropdownGroup>.
const DropdownGroupContext = createContext<{ openId: string | null; setOpenId: (id: string | null) => void } | null>(null);

export function FilterDropdownGroup({ children }: { children: React.ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null);
  return <DropdownGroupContext.Provider value={{ openId, setOpenId }}>{children}</DropdownGroupContext.Provider>;
}

// Nút lọc kiểu Homedy: bấm mở panel (render ra body bằng portal nên KHÔNG bao giờ
// bị section khác đè/cắt), tự đóng khi bấm ra ngoài / Esc / cuộn nhiều.
export default function FilterDropdown({
  label,
  id,
  summary,
  active,
  panelClassName = "w-72",
  className = "",
  align = "left",
  compact = false,
  field = false,
  children,
}: {
  label: string;
  id?: string; // định danh trong nhóm (mặc định = label)
  summary?: string;
  active?: boolean;
  panelClassName?: string;
  className?: string;
  align?: "left" | "right";
  compact?: boolean;
  // field = nút LỚN đứng cùng hàng ô tìm kiếm (dòng 1 kiểu Batdongsan): h-10, bo xl.
  field?: boolean;
  children: (api: { close: () => void }) => React.ReactNode;
}) {
  const groupId = id ?? label;
  const group = useContext(DropdownGroupContext);
  const [localOpen, setLocalOpen] = useState(false);
  const open = group ? group.openId === groupId : localOpen;
  const setOpen = useCallback(
    (v: boolean) => {
      if (group) group.setOpenId(v ? groupId : null);
      else setLocalOpen(v);
    },
    [group, groupId],
  );
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
        onClick={() => setOpen(!open)}
        className={`flex items-center justify-between gap-2 border text-sm outline-none transition ${
          compact
            ? `h-8 w-auto whitespace-nowrap rounded-full px-2.5 ${
                active
                  ? "border-white/40 bg-white/20 text-white"
                  : "border-white/15 bg-white/10 text-white/85 hover:border-white/35"
              }`
            : field
              ? `h-10 w-full shrink-0 rounded-xl px-4 font-medium sm:w-auto sm:whitespace-nowrap ${
                  active
                    ? "border-transparent bg-cvr-blue text-white"
                    : "border-transparent bg-cvr-surface text-cvr-ink hover:bg-black/[0.07]"
                }`
              : `h-10 w-full rounded-none px-3.5 lg:w-auto lg:whitespace-nowrap ${
                  active
                    ? "border-cvr-blue/60 bg-white font-medium text-cvr-blue-ink"
                    : "border-cvr-line bg-white text-cvr-body hover:border-cvr-ink/35 hover:text-cvr-ink"
                }`
        }`}
      >
        <span className="truncate">{active && summary ? summary : label}</span>
        <svg
          className={`h-4 w-4 shrink-0 transition-transform ${compact ? "text-white/60" : active ? "text-cvr-blue" : "text-cvr-faint"} ${open ? "rotate-180" : ""}`}
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
            className={`cvr-pop fixed z-[100] max-w-[calc(100vw-1rem)] overflow-y-auto rounded-none border border-cvr-line bg-white p-3 shadow-2xl shadow-black/15 ring-1 ring-inset ring-black/5 backdrop-blur-xl ${panelClassName}`}
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
    <div className="mt-3 flex items-center justify-between gap-2 border-t border-cvr-line pt-3">
      <button
        type="button"
        onClick={onReset}
        className="text-xs font-medium text-cvr-muted transition hover:text-cvr-ink"
      >
        Đặt lại
      </button>
      <button
        type="button"
        onClick={onApply}
        className="rounded-lg bg-cvr-blue px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-cvr-blue-ink"
      >
        Áp dụng
      </button>
    </div>
  );
}
