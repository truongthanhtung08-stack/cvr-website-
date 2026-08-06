"use client";

import { createContext, useContext, useState } from "react";

// Trạng thái "đang mở danh sách tin đầy đủ" của trang chủ.
// Khi bật: phần tin đổi sang bố cục trang danh sách (list + cột phải), và
// TẤT CẢ các phần khác của trang chủ (Dự án, Khu vực, Tin tức, banner) ẩn đi —
// người xem tập trung vào danh sách, không phải cuộn qua nội dung khác.
type Ctx = { expanded: boolean; setExpanded: (v: boolean) => void };

const HomeExpandCtx = createContext<Ctx>({ expanded: false, setExpanded: () => {} });

export function useHomeExpand() {
  return useContext(HomeExpandCtx);
}

export function HomeExpandProvider({ children }: { children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  return <HomeExpandCtx.Provider value={{ expanded, setExpanded }}>{children}</HomeExpandCtx.Provider>;
}

// Bọc các phần trang chủ cần ẩn khi mở danh sách đầy đủ.
export function HomeCollapsible({ children }: { children: React.ReactNode }) {
  const { expanded } = useHomeExpand();
  return <div className={expanded ? "hidden" : undefined}>{children}</div>;
}
