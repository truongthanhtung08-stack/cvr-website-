"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

// VẠCH XANH "ĐANG TÌM" CHUNG CẢ WEB (chủ dự án 21/10/2026: "áp dụng cho mọi cú bấm tìm kiếm để khách biết mình đang bấm
// tìm có hiệu lực và có kết quả"). Bật: sự kiện "cvr-tim" (bấm Tìm, Enter, chọn gợi ý, Áp dụng trường lọc, danh sách bắt đầu
// nạp kết quả). Tắt: "cvr-tim-xong" (kết quả đã hiện) — hiện ít nhất 0,6 giây cho khách kịp thấy; sang trang khác mà không
// trang nào báo đang nạp thì tắt; tối đa 8 giây. Thuần giao diện trên máy khách, không gọi máy chủ.
const IT_NHAT = 600;
const LAU_NHAT = 8000;

export function batDauTim() {
  window.dispatchEvent(new Event("cvr-tim"));
}
export function xongTim() {
  window.dispatchEvent(new Event("cvr-tim-xong"));
}

export default function VachTim() {
  const pathname = usePathname();
  const [chay, setChay] = useState(false);
  const luc = useRef(0);
  const hen = useRef<number | undefined>(undefined);

  useEffect(() => {
    const tat = (sau: number) => {
      window.clearTimeout(hen.current);
      hen.current = window.setTimeout(() => setChay(false), sau);
    };
    const bat = () => {
      luc.current = Date.now();
      setChay(true);
      tat(LAU_NHAT);
    };
    const xong = () => tat(Math.max(0, IT_NHAT - (Date.now() - luc.current)));
    window.addEventListener("cvr-tim", bat);
    window.addEventListener("cvr-tim-nap", bat); // danh sách đang nạp kết quả (ListingBrowser) — không kèm hiệu ứng "vừa tìm"
    window.addEventListener("cvr-tim-xong", xong);
    return () => {
      window.removeEventListener("cvr-tim", bat);
      window.removeEventListener("cvr-tim-nap", bat);
      window.removeEventListener("cvr-tim-xong", xong);
      window.clearTimeout(hen.current);
    };
  }, []);

  // Sang trang khác: trang có danh sách sẽ tự báo "cvr-tim-nap" (đang nạp) ngay khi hiện → giữ vạch; trang không có thì tắt sau 0,4 giây
  useEffect(() => {
    if (!luc.current) return;
    const batLuc = luc.current;
    const t = window.setTimeout(() => { if (luc.current === batLuc) window.dispatchEvent(new Event("cvr-tim-xong")); }, 400);
    return () => window.clearTimeout(t);
  }, [pathname]);

  return chay ? (
    <span aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[400] h-[3px] overflow-hidden">
      <span className="thanh-dang-tim block h-full bg-cvr-blue" />
    </span>
  ) : null;
}
