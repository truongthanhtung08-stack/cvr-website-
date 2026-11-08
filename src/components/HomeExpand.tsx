"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

// ── MỘT KIỂU DUY NHẤT CHO MỌI KHỐI CÓ NÚT "XEM THÊM" ─────────────────────────
// Mỗi khối (Tin · Dự án · Tin tức · BĐS tương tự · Tin liên quan…) có nút "Xem thêm".
// Bấm vào: khối đó đổi sang DANH SÁCH THEO TRANG (bắt đầu ở trang 1, màn hình về
// đầu trang), TẤT CẢ khối còn lại (kể cả Hero và banner) ẨN ĐI.
// Tại một thời điểm chỉ có ĐÚNG 1 khối được mở.
//
// ĐIỀU HƯỚNG (theo thanh điều hướng của điện thoại & máy tính):
//   · Mở danh sách = thêm MỘT bước vào lịch sử trình duyệt.
//   · Nút BACK (◁ điện thoại / ← máy tính) → đóng danh sách, quay lại đúng trạng
//     thái trước đó — KHÔNG văng ra khỏi trang.
//   · Nút FORWARD (→) → mở lại danh sách vừa đóng.
//   · Bấm LOGO / tab "Trang chủ" → về thẳng trang chủ trang 1 (nhả hết các bước
//     đã thêm, lịch sử sạch như chưa mở gì).
type Ctx = {
  openKey: string | null;
  openSection: (k: string) => void;
  closeAll: () => void;
};

const HomeExpandCtx = createContext<Ctx>({ openKey: null, openSection: () => {}, closeAll: () => {} });

// Header nằm NGOÀI Provider nên báo bằng sự kiện chung của cửa sổ.
export const HOME_RESET_EVENT = "cl-home-reset";

// Mỗi bước lịch sử do khối "Xem thêm" tạo ra mang dấu này để phân biệt với
// điều hướng thật (chuyển trang).
// clY: vị trí cuộn lúc bấm "Xem thêm" — BACK đóng danh sách thì về đúng chỗ đó, không văng lên đầu trang (30/10/2026)
// cvrKq: dấu "trang kết quả đi ra từ trang trước" (cùng dấu FilterBar dùng) — danh sách mở tại chỗ có ô tìm thì nút ‹ cạnh ô tìm tự hiện
// (anh 08/11/2026: "trang chủ bấm Xem thêm ở các mục ra danh sách — nút back đâu!")
type SectionHistoryState = { clSection?: string; clDepth?: number; clY?: number; cvrKq?: number };

export function HomeExpandProvider({ children }: { children: React.ReactNode }) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  // Số bước lịch sử đã thêm — để bấm logo là nhả đúng bấy nhiêu bước.
  const depthRef = useRef(0);
  const keyRef = useRef<string | null>(null);
  // KHỐI VỪA BẤM "Xem thêm" — Back đóng danh sách thì cuộn về ĐÚNG KHỐI ĐÓ (đầu khối), không theo số y cũ: nội dung trang chủ
  // dài ngắn khác lúc bấm (khối tin đã "+10" thu lại…) nên y cũ rơi lệch xuống gần cuối trang (đo 08/11/2026: bấm ở 7.003 → về 7.670).
  // Ghi chỗ chạm cuối cùng (pointerdown) vì Safari không đặt focus cho nút khi bấm.
  const chamRef = useRef<Element | null>(null);
  const neoRef = useRef<Element | null>(null);
  useEffect(() => {
    const ghi = (e: PointerEvent) => { chamRef.current = e.target as Element; };
    document.addEventListener("pointerdown", ghi, true);
    return () => document.removeEventListener("pointerdown", ghi, true);
  }, []);
  useEffect(() => { keyRef.current = openKey; }, [openKey]);

  // TẢI LẠI TRANG (F5): địa chỉ có ?muc=<khoá> → mở lại đúng khối đó,
  // không văng về trang đầu như trước.
  useEffect(() => {
    const key = new URLSearchParams(window.location.search).get("muc");
    if (key) {
      setOpenKey(key);
      depthRef.current = 1;
      // F5 ngay trên danh sách → giữ dấu để nút ‹ vẫn hiện
      window.history.replaceState({ ...(window.history.state ?? {}), clSection: key, clDepth: 1, cvrKq: 1 }, "");
    }
  }, []);

  // BACK / FORWARD của trình duyệt: trạng thái khối lấy thẳng từ lịch sử.
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const s = (e.state ?? {}) as SectionHistoryState;
      // Lùi trang KHÔNG đổi khối (vd đóng bảng nổi bằng nút Quay lại của điện thoại — useNutQuayLai) → đứng yên,
      // không kéo về đầu trang (22/10/2026).
      if ((s.clSection ?? null) === keyRef.current && (s.clDepth ?? 0) === depthRef.current) return;
      setOpenKey(s.clSection ?? null);
      depthRef.current = s.clDepth ?? 0;
      // Đóng danh sách → về đúng chỗ đã bấm "Xem thêm" (đợi trang vẽ lại các khối vừa hiện); mở lại → đầu danh sách
      const y = s.clSection ? 0 : (s.clY ?? 0);
      const neo = s.clSection ? null : neoRef.current;
      // Về đầu khối vừa bấm (trừ thanh dính: scroll-padding-top của trang), tức thì — không trượt êm kẻo thấy cả trang chạy qua
      const den = () => {
        if (neo && neo.isConnected) {
          const tren = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
          window.scrollTo({ top: Math.max(0, neo.getBoundingClientRect().top + window.scrollY - tren), behavior: "instant" });
          // Thanh dính khác (ô tìm trang chủ…) còn che tiêu đề khối → lùi thêm đúng phần bị che, chừa 12px
          const tieuDe = neo.querySelector("h2") ?? neo;
          const r = tieuDe.getBoundingClientRect();
          const tren2 = document.elementFromPoint(Math.min(40, window.innerWidth - 1), Math.max(0, r.top) + 2);
          if (tren2 && !neo.contains(tren2)) {
            let dinh: Element | null = tren2;
            while (dinh && dinh !== document.body && !/sticky|fixed/.test(getComputedStyle(dinh).position)) dinh = dinh.parentElement;
            const day = dinh && dinh !== document.body ? dinh.getBoundingClientRect().bottom : 0;
            if (day > r.top) window.scrollBy({ top: r.top - day - 12, behavior: "instant" });
          }
        } else window.scrollTo({ top: y, behavior: "instant" });
      };
      window.scrollTo({ top: 0, behavior: "instant" });
      if (neo || y) { requestAnimationFrame(den); window.setTimeout(den, 350); }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const closeAll = useCallback(() => {
    depthRef.current = 0;
    setOpenKey(null);
    // Xoá khoá khối khỏi địa chỉ, KHÔNG lùi lịch sử — vì nếu người dùng vừa F5
    // ngay trên danh sách thì lùi một bước sẽ văng khỏi trang.
    const url = new URL(window.location.href);
    url.searchParams.delete("muc");
    window.history.replaceState({}, "", url);
    window.scrollTo({ top: 0 });
  }, []);

  // THANH ĐIỀU HƯỚNG (menu đầu trang, thanh dưới điện thoại, menu con, mọi link) trỏ về CHÍNH TRANG ĐANG XEM khi một danh sách
  // "Xem thêm" đang mở (vd đang ở danh sách dự án mà bấm "Dự án" / "Tra cứu dự án") → đóng danh sách, trang về như lúc mới mở;
  // link có #mục thì tới đúng mục đó. Trước đây đường dẫn đổi mà danh sách vẫn nằm đó (30/10/2026).
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!keyRef.current || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank") return;
      const u = new URL(a.href, window.location.href);
      if (u.origin !== window.location.origin || u.pathname !== window.location.pathname || u.searchParams.get("muc")) return;
      closeAll();
      const muc = decodeURIComponent(u.hash.slice(1));
      if (muc) {
        const den = () => document.getElementById(muc)?.scrollIntoView({ block: "start" });
        requestAnimationFrame(() => requestAnimationFrame(den));
        window.setTimeout(den, 350);
      }
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [closeAll]);

  // Logo / tab "Trang chủ" khi đang ở trang chủ → về trang chủ trang 1
  useEffect(() => {
    window.addEventListener(HOME_RESET_EVENT, closeAll);
    return () => window.removeEventListener(HOME_RESET_EVENT, closeAll);
  }, [closeAll]);

  const openSection = useCallback((key: string) => {
    // Ghi vị trí đang đứng vào bước lịch sử hiện tại (giữ nguyên dữ liệu Next.js trong đó) trước khi thêm bước mới
    window.history.replaceState({ ...(window.history.state ?? {}), clY: window.scrollY }, "");
    neoRef.current = chamRef.current?.closest("section") ?? null;
    setOpenKey(key);
    depthRef.current += 1;
    const state: SectionHistoryState = { clSection: key, clDepth: depthRef.current, cvrKq: 1 };
    // Ghi khoá khối vào địa chỉ → bấm F5 vẫn giữ nguyên danh sách đang xem.
    const url = new URL(window.location.href);
    url.searchParams.set("muc", key);
    window.history.pushState(state, "", url);
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <HomeExpandCtx.Provider value={{ openKey, openSection, closeAll }}>
      {openKey && <ThanhVeKhoi khoa={openKey} />}
      {children}
    </HomeExpandCtx.Provider>
  );
}

// Dùng cho logo / tab "Trang chủ": đang ở trang chủ thì đưa trang về mặc định
// (đóng khối đang mở + cuộn lên đầu) thay vì đứng yên tại chỗ.
export function resetHomeIfOnHome() {
  if (typeof window === "undefined") return;
  if (window.location.pathname !== "/") return;
  window.dispatchEvent(new Event(HOME_RESET_EVENT));
}

// Dùng trong từng khối có nút "Xem thêm".
//   expanded = khối này đang mở · hidden = khối khác đang mở nên khối này ẩn
export function useHomeSection(key: string) {
  const { openKey, openSection, closeAll } = useContext(HomeExpandCtx);
  return {
    expanded: openKey === key,
    hidden: openKey !== null && openKey !== key,
    toggle: () => (openKey === key ? closeAll() : openSection(key)),
    close: closeAll,
  };
}

// Bọc các phần KHÔNG có nút "Xem thêm" (Hero, banner) — ẩn khi có khối nào đang mở.
// Ẩn khi MỘT khối cụ thể đang mở (vd Tìm kiếm phổ biến — từ khoá nhà đất — không đặt dưới danh sách Tin tức, 25/10/2026)
// classKhiMo: lớp dùng khi MỘT khối KHÁC đang mở (khối này thành khối cuối trang nên lề đáy khác).
export function AnKhiMo({ khoa, children, className, classKhiMo }: { khoa: string; children: React.ReactNode; className?: string; classKhiMo?: string }) {
  const { openKey } = useContext(HomeExpandCtx);
  return <div className={openKey === khoa ? "hidden" : openKey && classKhiMo !== undefined ? classKhiMo : className}>{children}</div>;
}

export function HomeCollapsible({ children, className }: { children: React.ReactNode; className?: string }) {
  const { openKey } = useContext(HomeExpandCtx);
  return <div className={openKey ? "hidden" : className}>{children}</div>;
}

// Cột chứa một khối "Xem thêm" nằm GIỮA trang (vd tin của dự án ngay sau Tổng quan — 22/10/2026):
// khi danh sách mở, cột giãn hết bề ngang (cột phụ bên cạnh đã ẩn) thay vì chừa khoảng trống.
export function CotKhiMo({ children, className, classKhiMo }: { children: React.ReactNode; className: string; classKhiMo: string }) {
  const { openKey } = useContext(HomeExpandCtx);
  return <div className={`${className} ${openKey ? classKhiMo : ""}`}>{children}</div>;
}

// NÚT ‹ CHO DANH SÁCH MỞ TẠI CHỖ KHÔNG CÓ Ô TÌM (vd Tin tức ở trang chủ) — một kiểu với thanh "‹ …" các trang (BackBar), chỉ điện thoại.
// Danh sách có ô tìm (FilterBar) đã có nút ‹ cạnh ô tìm (dấu cvrKq) → không vẽ thêm. Trang khác trang chủ đã có BackBar (Quay lại = lùi
// lịch sử = đóng danh sách) → không vẽ thêm. Bấm = lùi một bước lịch sử → khối đóng, về đúng chỗ đã bấm "Xem thêm" (onPop ở trên).
// Khối mở tại chỗ KHÔNG có ô tìm (danh sách có ô tìm đã có nút ‹ cạnh ô — không vẽ trùng). Thêm khối mới không có ô tìm → thêm vào đây.
const KHOI_KHONG_O_TIM: Record<string, string> = { "tin-tuc": "Tin tức" };
function ThanhVeKhoi({ khoa }: { khoa: string }) {
  const [hien, setHien] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- chỉ đọc đường dẫn sau khi dựng (trang chủ mới vẽ; trang khác đã có BackBar)
  useEffect(() => { setHien(window.location.pathname === "/" && khoa in KHOI_KHONG_O_TIM); }, [khoa]);
  if (!hien) return null;
  return (
    <div className="thanh-quay-lai sticky top-[calc(var(--hdr)+var(--at))] z-30 border-b border-cvr-line bg-white/95 backdrop-blur lg:hidden">
      <div className="flex items-center gap-2 px-4 py-[10px]">
        <button type="button" onClick={() => window.history.back()} aria-label="Quay lại"
          className="-ml-1 flex h-8 w-8 items-center justify-center rounded-full text-cvr-ink active:bg-cvr-surface">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <span className="truncate text-[15px] font-medium text-cvr-ink">{KHOI_KHONG_O_TIM[khoa]}</span>
      </div>
    </div>
  );
}
