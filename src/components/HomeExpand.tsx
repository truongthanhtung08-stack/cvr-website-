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
type SectionHistoryState = { clSection?: string; clDepth?: number };

export function HomeExpandProvider({ children }: { children: React.ReactNode }) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  // Số bước lịch sử đã thêm — để bấm logo là nhả đúng bấy nhiêu bước.
  const depthRef = useRef(0);

  // BACK / FORWARD của trình duyệt: trạng thái khối lấy thẳng từ lịch sử.
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const s = (e.state ?? {}) as SectionHistoryState;
      setOpenKey(s.clSection ?? null);
      depthRef.current = s.clDepth ?? 0;
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const closeAll = useCallback(() => {
    const back = depthRef.current;
    depthRef.current = 0;
    setOpenKey(null);
    if (back > 0) window.history.go(-back); // nhả các bước đã thêm → lịch sử sạch
    window.scrollTo({ top: 0 });
  }, []);

  // Logo / tab "Trang chủ" khi đang ở trang chủ → về trang chủ trang 1
  useEffect(() => {
    window.addEventListener(HOME_RESET_EVENT, closeAll);
    return () => window.removeEventListener(HOME_RESET_EVENT, closeAll);
  }, [closeAll]);

  const openSection = useCallback((key: string) => {
    setOpenKey(key);
    depthRef.current += 1;
    const state: SectionHistoryState = { clSection: key, clDepth: depthRef.current };
    window.history.pushState(state, "");
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <HomeExpandCtx.Provider value={{ openKey, openSection, closeAll }}>{children}</HomeExpandCtx.Provider>
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
export function HomeCollapsible({ children }: { children: React.ReactNode }) {
  const { openKey } = useContext(HomeExpandCtx);
  return <div className={openKey ? "hidden" : undefined}>{children}</div>;
}
