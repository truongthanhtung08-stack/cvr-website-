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

/** Đáy cố định của bảng trượt điện thoại — có giá trị = đang ở trong bảng trượt (el null: đáy chưa gắn xong); null = bảng nổi máy tính */
export const ChanBangContext = createContext<{ el: HTMLDivElement | null } | null>(null);

/** Ô GÕ CHỮ (không tính ô tick, nút) — bảng chọn biết khách đang gõ hay không */
const laOGo = (o: EventTarget | null) =>
  o instanceof HTMLTextAreaElement || (o instanceof HTMLInputElement && /^(text|search|number|tel|email|url)?$/.test(o.type));

// Nút lọc kiểu Homedy: bấm mở panel (render ra body bằng portal nên KHÔNG bao giờ
// bị section khác đè/cắt), tự đóng khi bấm ra ngoài / Esc / cuộn nhiều.
export default function FilterDropdown({
  label,
  tieuDe,
  giuCo = false,
  id,
  summary,
  active,
  panelClassName = "w-72",
  className = "",
  align = "left",
  compact = false,
  field = false,
  pill = false,
  seg = false,
  the = false,
  onMo,
  children,
}: {
  /** Báo mở / đóng bảng — trường CHỌN NHIỀU giữ bản nháp lựa chọn trong bảng, đóng mà không Áp dụng thì bỏ (07/11/2026) */
  onMo?: (mo: boolean) => void;
  label: string;
  /** Tiêu đề bảng chọn trên điện thoại khi khác chữ nút (nút "Toàn quốc" → bảng "Khu vực", 02/11/2026) */
  tieuDe?: string;
  /** Điện thoại: giữ nguyên cỡ, chỗ bảng kể cả khi gõ ô tìm trong bảng (không bung toàn màn hình) */
  giuCo?: boolean;
  id?: string; // định danh trong nhóm (mặc định = label)
  summary?: string;
  active?: boolean;
  panelClassName?: string;
  className?: string;
  align?: "left" | "right";
  compact?: boolean;
  // field = nút LỚN đứng cùng hàng ô tìm kiếm (dòng 1 kiểu Batdongsan): h-10, bo xl.
  field?: boolean;
  // pill = viên thuốc trắng cùng kiểu ô tìm trang chủ (chỉ bộ lọc trang chủ dùng)
  pill?: boolean;
  // seg = một ĐOẠN trong thanh tìm chia ô kiểu Airbnb (nhãn trên, giá trị dưới) — chỉ trang chủ dùng
  seg?: boolean;
  // the = THẺ gọn trong màn tìm điện thoại kiểu Airbnb (nhãn trái, giá trị phải) — chỉ trang chủ dùng
  the?: boolean;
  children: (api: { close: () => void }) => React.ReactNode;
}) {
  const groupId = id ?? label;
  const group = useContext(DropdownGroupContext);
  const [localOpen, setLocalOpen] = useState(false);
  const open = group ? group.openId === groupId : localOpen;
  // Phụ thuộc HÀM setOpenId (ổn định), không phụ thuộc cả object nhóm (đổi mỗi lần vẽ): setOpen đổi theo mỗi lần vẽ thì
  // bước lịch sử của bảng chọn bị dọn → tự "quay lại" → bảng vừa mở đã đóng (trang Dự án, chủ dự án 20/10/2026).
  const setOpenId = group?.setOpenId;
  const setOpen = useCallback(
    (v: boolean) => {
      if (setOpenId) setOpenId(v ? groupId : null);
      else setLocalOpen(v);
    },
    [setOpenId, groupId],
  );
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top?: number; left?: number; right?: number; w?: number; maxH?: number; len?: boolean; manTim?: boolean }>({ top: 0 });

  // ĐIỆN THOẠI (< 640px): panel neo theo nút quá chật → đổi sang SHEET trượt từ đáy
  // đúng chuẩn iOS (nền mờ, thanh kéo, bo góc trên, né thanh Home). Desktop giữ nguyên.
  const [sheet, setSheet] = useState(false);
  // ĐANG GÕ trong bảng (ô tìm tỉnh, dự án, giá…) trên điện thoại → bảng thành TOÀN MÀN HÌNH, ô gõ
  // lên trên cùng: bàn phím không đè lên bảng (chủ dự án 15/10/2026 — chuẩn chung mọi ô tìm).
  const [dangGo, setDangGo] = useState(false);
  const [chanBang, setChanBang] = useState<HTMLDivElement | null>(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ báo khi đổi mở / đóng
  useEffect(() => { onMo?.(open); }, [open]);
  // Đóng bảng khi ô gõ còn đang giữ con trỏ thì onBlur không kịp chạy → trả về dạng bảng trượt.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!open) setDangGo(false);
  }, [open]);
  // TRẢ VỀ BẢN GỐC (chủ dự án 02/11/2026: "phủ đầy màn hình chọn một cách rất xấu"): bảng trượt từ đáy như thường, CHỈ khi khách gõ vào
  // ô tìm trong bảng mới bung toàn màn hình (dangGo). Bỏ kiểu mở toàn màn hình ngay từ đầu cho bảng có ô gõ (coO, 01/11/2026).
  // giuCo (bảng Khu vực, 02/11/2026: "chọn nhảy xuống nhảy lên rất khó chịu"): gõ tìm cũng KHÔNG bung toàn màn hình — bảng đứng yên một chỗ
  const toanMan = dangGo && !giuCo;
  useEffect(() => {
    // ĐIỆN THOẠI GIỐNG MÁY TÍNH (chủ dự án 05/11/2026: "mobile cũng vậy thôi, không khác gì — chỉ khác là chạm tay cuộn"):
    // không còn bảng trượt từ đáy; mọi máy đều xổ ngay dưới trường lọc, vuốt trong bảng cuộn bảng, vuốt ngoài cuộn trang.
    const mq = window.matchMedia("(max-width: 639px)");
    const sync = () => setSheet(false);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // BẢNG KHÔNG NHẢY khi chọn (chủ dự án 20/10/2026): bảng neo ĐÁY nên nội dung đổi (vd. bấm tỉnh → danh sách phường) làm
  // mép trên nhảy lên xuống. Mở ra đo chiều cao một lần rồi GIỮ NGUYÊN — nội dung dài hơn thì cuộn bên trong bảng.
  useEffect(() => {
    if (!open || !sheet) return;
    const el = panelRef.current;
    if (!el) return;
    el.style.height = "";
    if (toanMan) return; // bảng có ô gõ / đang gõ: toàn màn hình theo lớp h-[100dvh], không giữ cỡ
    // Đo sau khi nội dung vẽ xong (2 khung hình). Danh sách DÀI (tỉnh, phường…) → giữ CAO HẾT MỨC (86% màn) để bấm vào
    // một tỉnh chuyển sang danh sách phường không làm mép bảng nhảy; danh sách NGẮN (giá, diện tích) → giữ đúng cỡ đo được.
    let id2 = 0;
    const id = requestAnimationFrame(() => {
      id2 = requestAnimationFrame(() => {
        const toiDa = window.innerHeight * 0.86;
        const tuNhien = Math.min(toiDa, el.scrollHeight);
        el.style.height = tuNhien > window.innerHeight * 0.6 ? `${Math.round(toiDa)}px` : `${el.offsetHeight}px`;
      });
    });
    return () => { cancelAnimationFrame(id); cancelAnimationFrame(id2); };
  }, [open, sheet, toanMan]);

  // GIỮ TRANG ĐỨNG YÊN khi bảng đang mở — KHÔNG tắt cuộn của trang (chủ dự án 02/11/2026: "tất cả các trường chọn đều bị xê dịch màn
  // hình"): tắt cuộn trang (body overflow hidden) làm thanh địa chỉ trình duyệt điện thoại hiện / ẩn → chiều cao màn hình đổi → cả trang
  // xê dịch lúc mở và lúc đóng bảng. Thay bằng: chặn kéo ở ngoài vùng cuộn của bảng (và trong vùng đó khi không có gì để cuộn), trang
  // phía sau không bị kéo theo mà màn hình không đổi cỡ.
  useEffect(() => {
    // Áp cả bảng XỔ DƯỚI TRƯỜNG trên máy cảm ứng (07/11/2026: từ 05/11 bảng đổi kiểu xổ, khối này chỉ còn gắn bảng trượt → vuốt trong bảng
    // là trang chạy theo). Máy tính (chuột) không cần.
    if (!open || (!sheet && !window.matchMedia("(pointer: coarse)").matches)) return;
    // Kéo QUÁ ĐẦU / QUÁ CUỐI danh sách cũng chặn (02/11/2026: "màn hình không được dịch khi kéo lên xuống") — trình duyệt không
    // hiểu overscroll-contain thì cú kéo dư chuyền ra trang phía sau
    let y0 = 0;
    const batDau = (e: TouchEvent) => { y0 = e.touches[0]?.clientY ?? 0; };
    const chan = (e: TouchEvent) => {
      const k = (e.target as Element | null)?.closest?.("[data-cuon-bang]") as HTMLElement | null;
      if (!k || k.scrollHeight <= k.clientHeight) { e.preventDefault(); return; }
      const dy = (e.touches[0]?.clientY ?? 0) - y0;
      if ((dy > 0 && k.scrollTop <= 0) || (dy < 0 && k.scrollTop + k.clientHeight >= k.scrollHeight - 1)) e.preventDefault();
    };
    document.addEventListener("touchstart", batDau, { passive: true });
    document.addEventListener("touchmove", chan, { passive: false });
    return () => { document.removeEventListener("touchstart", batDau); document.removeEventListener("touchmove", chan); };
  }, [open, sheet]);

  // BẢNG LỌC NẰM TRONG TRANG (chủ dự án 05/11/2026: "bấm chọn, list xuống, không giật — sửa từ mã gốc"): đặt theo TOẠ ĐỘ TRANG
  // ngay dưới trường lọc, cuộn CÙNG trang, nằm DƯỚI thanh menu (z thấp hơn header). Trước đây bảng dán cố định lên màn hình
  // rồi đuổi theo trường lọc → cuộn là đè lên menu, lệch khỏi trường lọc. Mở LÊN chỉ khi sát cuối trang (không còn chỗ cuộn).
  const reposition = useCallback(() => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const m = 8;
    const conDuoi = document.documentElement.scrollHeight - (r.bottom + window.scrollY) - m;
    const openUp = conDuoi < 260 && r.top - 72 > conDuoi;
    // BẢNG VỪA TRỌN MÀN HÌNH (anh 07/11/2026: "bấm chọn nó xê dịch"): cao tối đa = phần màn hình còn lại dưới trường lọc, trừ thanh dưới
    // điện thoại — nút Tìm ở đáy bảng luôn thấy, không phải kéo trang (trước: 70% màn hình → máy thấp đáy bảng lọt dưới mép, phải kéo trang)
    const thanh = document.querySelector('nav[aria-label="Điều hướng nhanh"]') as HTMLElement | null;
    const rThanh = thanh?.getBoundingClientRect();
    const caoThanh = rThanh && rThanh.height > 0 && getComputedStyle(thanh!).display !== "none" ? Math.max(0, window.innerHeight - rThanh.top) : 0; // thanh cố định ở đáy (đang ẩn khi cuộn thì vẫn tính chỗ của nó)
    const maxH = Math.max(220, Math.round(Math.min(window.innerHeight * 0.7, window.innerHeight - r.bottom - m - caoThanh - 8)));
    const vert = openUp ? { top: r.top + window.scrollY - m, len: true } : { top: r.bottom + window.scrollY + m };
    // Màn hẹp (điện thoại): bảng rộng gần hết màn, chừa 8px hai bên — không tràn ra ngoài
    const hep = window.innerWidth < 640;
    const horiz = hep
      ? { left: 8 + window.scrollX, w: window.innerWidth - 16 }
      : align === "right"
        ? { right: Math.max(8, document.documentElement.clientWidth - r.right - window.scrollX) }
        : { left: Math.max(8, Math.min(r.left, window.innerWidth - 8)) + window.scrollX };
    // trường nằm trong MÀN TÌM điện thoại (lớp z-80, trong khối lọc z-90) → bảng phải nằm TRÊN màn tìm, không thì mở mà không thấy (lỗi 22, 07/11/2026)
    setPos({ ...vert, ...horiz, maxH, manTim: !!el.closest("[data-man-tim]") });
  }, [align]);

  // MÁY TÍNH: bảng LUÔN mở XUỐNG (chủ dự án 01/11/2026: bảng bật ngược lên che đầu trang, chật không chọn được). Dưới trường lọc
  // không đủ chỗ thì cuộn trang đưa hàng lọc lên gần đầu màn hình trước, rồi mới đặt bảng — khuôn chung mọi trang.
  useLayoutEffect(() => {
    if (!open || sheet) return;
    // KHÔNG TỰ CUỘN TRANG khi mở (chủ dự án 05/11/2026: "bấm chọn, list xuống — không giật"): bảng xổ tại chỗ; khách cuộn
    // trang thì bảng bám theo trường lọc và tự cao thêm khi có thêm chỗ (reposition theo cuộn bên dưới).
    reposition();
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

    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", reposition);

    };
  }, [open, sheet, reposition, setOpen]);

  // ĐƯỜNG THOÁT ĐỦ (chủ dự án 17/10/2026: "có đường chọn cũng có đường thoát, kể cả chọn nhiều trường"): bảng chọn trên
  // điện thoại đóng bằng × · Xong · chạm nền mờ · Esc · và NÚT QUAY LẠI của điện thoại — quay lại chỉ đóng bảng chọn, khách
  // vẫn ở màn tìm (mở bảng là thêm một bước lịch sử; đóng bằng cách khác thì tự lùi lại bước đó).
  useEffect(() => {
    if (!open || !sheet) return;
    let daLui = false;
    try { history.pushState({ ...history.state, cvrLoc: 1 }, ""); } catch { /* bỏ qua */ }
    const onPop = () => { daLui = true; setOpen(false); };
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      if (!daLui && history.state?.cvrLoc) history.back();
    };
  }, [open, sheet, setOpen]);

  // Sheet: đóng bằng phím Esc (bấm ra ngoài đã có lớp nền mờ xử lý)
  useEffect(() => {
    if (!open || !sheet) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, sheet, setOpen]);

  return (
    <div className={`relative ${className}`}>
      {the ? (
        <button
          ref={btnRef}
          type="button"
          onClick={() => setOpen(!open)}
          className="flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl bg-white px-6 py-3 text-left shadow-[0_4px_16px_rgba(0,0,0,0.08)] outline-none transition active:scale-[0.99]"
        >
          <span className="shrink-0 text-[14px] font-medium text-cvr-muted">{label}</span>
          <span className="min-w-0 truncate text-[14px] font-medium text-cvr-ink">{active && summary ? summary : "Tất cả"}</span>
        </button>
      ) : seg ? (
        <button
          ref={btnRef}
          type="button"
          onClick={() => setOpen(!open)}
          className={`flex h-full w-full flex-col items-start justify-center rounded-full px-6 text-left outline-none transition ${open ? "bg-white shadow-[0_6px_20px_rgba(0,0,0,0.12)]" : "hover:bg-black/[0.04]"}`}
        >
          <span className="text-[13px] font-semibold text-cvr-ink">{label}</span>
          <span className={`max-w-full truncate text-[15px] ${active ? "text-cvr-ink" : "text-cvr-muted"}`}>{active && summary ? summary : "Tất cả"}</span>
        </button>
      ) : (
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center justify-between gap-2 border text-sm outline-none transition ${
          pill
            ? // điện thoại gọn hơn (chủ dự án 17/10/2026: "menu phía dưới nhỏ lại") · máy tính giữ nguyên
              `h-8 w-auto shrink-0 whitespace-nowrap rounded-full px-3 text-[13px] sm:h-10 sm:px-4 sm:text-sm ${
                active
                  ? "border-cvr-ink bg-cvr-ink/[0.04] font-medium text-cvr-ink"
                  : "border-cvr-line bg-white text-cvr-body hover:border-cvr-ink/40 hover:text-cvr-ink"
              }`
            : compact
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
                // ĐIỆN THOẠI GỌN LẠI (chủ dự án 18/10/2026: "chỉnh menu phía dưới thanh search nhỏ lại cho phù hợp") — h-8, chữ 13px
                `h-8 w-auto shrink-0 gap-1 whitespace-nowrap rounded-full px-3 text-[13px] sm:h-10 sm:w-full sm:gap-2 sm:rounded-none sm:px-3.5 sm:text-sm ${
                  active
                    ? "border-cvr-blue bg-cvr-blue/10 font-medium text-cvr-blue-ink sm:border-cvr-blue/60 sm:bg-white"
                    : "border-black/10 bg-white text-cvr-ink/80 hover:border-cvr-ink/35 hover:text-cvr-ink sm:border-cvr-line sm:text-cvr-body"
                }`
        }`}
      >
        <span className="truncate">{active && summary ? summary : label}</span>
        <svg
          className={`h-4 w-4 shrink-0 transition-transform ${compact ? "text-white/60" : pill ? (active ? "text-cvr-ink" : "text-cvr-faint") : active ? "text-cvr-blue" : "text-cvr-faint"} ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      )}

      {open && sheet
        ? /* ── ĐIỆN THOẠI: sheet trượt từ đáy (chuẩn iOS) ── */
          createPortal(
            <div className="fixed inset-0 z-[250] sm:hidden">
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
                onFocus={(e) => {
                  // CHỈ ô GÕ CHỮ mới đẩy bảng lên toàn màn hình — bấm ô tick (loại hình…) mà bung bảng là màn NHẢY (chủ dự án 20/10/2026)
                  if (laOGo(e.target)) setDangGo(true);
                }}
                // Con trỏ sang Ô TICK cũng là hết gõ (02/11/2026: tick trong bảng Khu vực lúc đang gõ thì bảng tưởng còn gõ — kẹt toàn
                // màn hình, mất nút Áp dụng · Đặt lại)
                onBlur={(e) => { if (!laOGo(e.relatedTarget)) setDangGo(false); }}
                // ĐANG GÕ Ô TÌM TRONG BẢNG → dấu cho CSS ẩn hàng nút dính đáy (globals.css) — không phụ thuộc đo bàn phím (01/11/2026)
                data-dang-go={dangGo ? "1" : undefined}
                className={`cvr-sheet absolute inset-x-0 flex flex-col bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_40px_rgba(0,0,0,0.22)] ${toanMan ? "top-0 h-[100dvh] pt-[env(safe-area-inset-top)]" : "bottom-0 max-h-[86dvh] rounded-t-2xl"}`}
              >
                {/* Thanh kéo + tiêu đề — đúng cấu trúc sheet của iOS */}
                <div className="shrink-0 px-4 pb-2 pt-2.5">
                  <span className="mx-auto block h-[5px] w-9 rounded-full bg-black/20" aria-hidden />
                  <div className="mt-2.5 flex items-center justify-between gap-3">
                    <span className="text-[17px] font-semibold tracking-tight text-cvr-ink">{tieuDe ?? label}</span>
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
                <ChanBangContext.Provider value={{ el: chanBang }}>
                  <div data-cuon-bang className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-4 pb-4">
                    {children({ close: () => setOpen(false) })}
                  </div>
                </ChanBangContext.Provider>
                {/* ĐÁY BẢNG CỐ ĐỊNH — hàng Đặt lại · Áp dụng (NutXem) vẽ vào đây, NGOÀI phần cuộn (chủ dự án 02/11/2026, ảnh Samsung
                    Internet: hàng nút "dính đáy" trong phần cuộn bị trôi lên giữa danh sách) */}
                <div ref={setChanBang} className="shrink-0 bg-white px-4" />
              </div>
            </div>,
            document.body,
          )
        : open &&
          createPortal(
            <div
              ref={panelRef}
              data-cuon-bang
              style={{ top: pos.top, left: pos.left, right: pos.right, width: pos.w, maxWidth: pos.w, maxHeight: pos.maxH, transform: pos.len ? "translateY(-100%)" : undefined, zIndex: pos.manTim ? 95 : undefined }}
              className={`${pos.len ? "" : "cvr-pop "}absolute z-[44] max-w-[calc(100vw-1rem)] overflow-y-auto overscroll-contain rounded-none border border-cvr-line bg-white p-3 shadow-2xl shadow-black/15 ring-1 ring-inset ring-black/5 backdrop-blur-xl ${panelClassName}`}
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
  chuNut = "Tìm",
  tatDatLai = false,
}: {
  onReset: () => void;
  onApply: () => void;
  chuNut?: string;
  /** chưa chọn gì → nút Đặt lại mờ, không bấm được (chuẩn chung: không có gì để đặt lại) */
  tatDatLai?: boolean;
}) {
  return (
    // THANH ĐÁY BẢNG LỌC (anh 07/11/2026): hai nút BẰNG CỠ NHAU (cao 32, rộng 92), cùng màu xanh — "↻ Đặt lại" viền, "Tìm" nền.
    // Một kiểu cho mọi bảng lọc.
    <div className="mt-3 flex items-center justify-end gap-5 border-t border-cvr-line pt-3">
      <button
        type="button"
        onClick={onReset}
        disabled={tatDatLai}
        className="flex h-8 w-[92px] disabled:cursor-default disabled:opacity-40 items-center justify-center gap-1 rounded-lg border border-cvr-blue text-[13px] font-semibold text-cvr-blue-ink transition hover:bg-cvr-blue/5 active:bg-cvr-blue/10"
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M5.6 15A7 7 0 0018 17.4M18.4 9A7 7 0 006 6.6" /></svg>
        Đặt lại
      </button>
      <button
        type="button"
        onClick={onApply}
        className="h-8 w-[92px] rounded-lg bg-cvr-blue text-[13px] font-semibold text-white transition hover:bg-cvr-blue-ink active:scale-[0.98]"
      >
        {chuNut}
      </button>
    </div>
  );
}
