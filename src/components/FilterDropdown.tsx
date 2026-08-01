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

  // ĐIỆN THOẠI (< 640px): panel neo theo nút quá chật → đổi sang SHEET trượt từ đáy
  // đúng chuẩn iOS (nền mờ, thanh kéo, bo góc trên, né thanh Home). Desktop giữ nguyên.
  const [sheet, setSheet] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const sync = () => setSheet(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Khoá cuộn nền khi sheet đang mở (nếu không, cuộn trong sheet sẽ kéo cả trang)
  useEffect(() => {
    if (!open || !sheet) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open, sheet]);

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
    if (open && !sheet) reposition();
  }, [open, sheet, reposition]);

  useEffect(() => {
    if (!open || sheet) return;
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
  }, [open, sheet, reposition, setOpen]);

  // Sheet: đóng bằng phím Esc (bấm ra ngoài đã có lớp nền mờ xử lý)
  useEffect(() => {
    if (!open || !sheet) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, sheet, setOpen]);

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
              : // MOBILE: pill bo tròn mềm, nền xám nhạt (giống ô tìm) — hết ô vuông viền cứng.
                // DESKTOP (sm): giữ nguyên kiểu cũ (vuông, viền, nền trắng).
                `h-10 w-auto shrink-0 whitespace-nowrap rounded-full px-4 sm:rounded-none sm:px-3.5 ${
                  active
                    ? "border-cvr-blue bg-cvr-blue/10 font-medium text-cvr-blue-ink sm:border-cvr-blue/60 sm:bg-white"
                    : "border-black/10 bg-cvr-surface text-cvr-ink/80 hover:border-cvr-ink/35 hover:text-cvr-ink sm:border-cvr-line sm:bg-white sm:text-cvr-body"
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

      {open && sheet
        ? /* ── ĐIỆN THOẠI: sheet trượt từ đáy (chuẩn iOS) ── */
          createPortal(
            <div className="fixed inset-0 z-[100] sm:hidden">
              {/* Nền mờ — chạm để đóng */}
              <button
                type="button"
                aria-label="Đóng"
                onClick={() => setOpen(false)}
                className="cvr-sheet-scrim absolute inset-0 bg-black/40"
              />
              <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-label={label}
                className="cvr-sheet absolute inset-x-0 bottom-0 flex max-h-[86dvh] flex-col rounded-t-2xl bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_40px_rgba(0,0,0,0.22)]"
              >
                {/* Thanh kéo + tiêu đề — đúng cấu trúc sheet của iOS */}
                <div className="shrink-0 px-4 pb-2 pt-2.5">
                  <span className="mx-auto block h-[5px] w-9 rounded-full bg-black/20" aria-hidden />
                  <div className="mt-2.5 flex items-center justify-between gap-3">
                    <span className="text-[17px] font-semibold tracking-tight text-cvr-ink">{label}</span>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="-mr-1 flex h-9 w-9 items-center justify-center rounded-full text-cvr-muted active:bg-cvr-surface"
                      aria-label="Đóng"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                {/* Nội dung bộ lọc — cuộn riêng trong sheet */}
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
                  {children({ close: () => setOpen(false) })}
                </div>
              </div>
            </div>,
            document.body,
          )
        : open &&
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
