"use client";

import { createContext, useContext, useEffect, useState } from "react";

// ── MỘT KIỂU DUY NHẤT CHO MỌI KHỐI TRANG CHỦ ─────────────────────────────────
// Mỗi khối (Tin · Dự án · Khu vực · Tin tức) có nút "Xem thêm".
// Bấm vào: khối đó đổi sang DANH SÁCH THEO TRANG, TẤT CẢ khối còn lại (kể cả Hero
// và banner) ẨN ĐI — không đổ dài xuống giữa trang. Bấm "Thu gọn" là về như cũ.
// Tại một thời điểm chỉ có ĐÚNG 1 khối được mở.
type Ctx = { openKey: string | null; setOpenKey: (k: string | null) => void };

const HomeExpandCtx = createContext<Ctx>({ openKey: null, setOpenKey: () => {} });

// Bấm LOGO (hoặc tab "Trang chủ") khi đang ở trang chủ → về trạng thái mặc định:
// đóng mọi khối đang mở, hiện lại đầy đủ trang. Header nằm ngoài Provider nên
// báo qua sự kiện chung của cửa sổ.
export const HOME_RESET_EVENT = "cl-home-reset";

export function HomeExpandProvider({ children }: { children: React.ReactNode }) {
  const [openKey, setOpenKey] = useState<string | null>(null);

  useEffect(() => {
    const reset = () => setOpenKey(null);
    window.addEventListener(HOME_RESET_EVENT, reset);
    return () => window.removeEventListener(HOME_RESET_EVENT, reset);
  }, []);

  return <HomeExpandCtx.Provider value={{ openKey, setOpenKey }}>{children}</HomeExpandCtx.Provider>;
}

// Dùng cho logo / tab "Trang chủ": đang ở trang chủ thì đưa trang về mặc định
// (đóng khối đang mở + cuộn lên đầu) thay vì đứng yên tại chỗ.
export function resetHomeIfOnHome() {
  if (typeof window === "undefined") return;
  if (window.location.pathname !== "/") return;
  window.dispatchEvent(new Event(HOME_RESET_EVENT));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Dùng trong từng khối có nút "Xem thêm".
//   expanded = khối này đang mở · hidden = khối khác đang mở nên khối này ẩn
export function useHomeSection(key: string) {
  const { openKey, setOpenKey } = useContext(HomeExpandCtx);
  return {
    expanded: openKey === key,
    hidden: openKey !== null && openKey !== key,
    toggle: () => setOpenKey(openKey === key ? null : key),
    close: () => setOpenKey(null),
  };
}

// Bọc các phần KHÔNG có nút "Xem thêm" (Hero, banner) — ẩn khi có khối nào đang mở.
export function HomeCollapsible({ children }: { children: React.ReactNode }) {
  const { openKey } = useContext(HomeExpandCtx);
  return <div className={openKey ? "hidden" : undefined}>{children}</div>;
}
