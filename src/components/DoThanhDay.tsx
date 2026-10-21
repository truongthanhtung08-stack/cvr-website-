"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// ĐO CHIỀU CAO THẬT CỦA THANH DÍNH ĐÁY (thanh tab · thanh Liên hệ trang tin) — chủ dự án 21/10/2026.
// Trình duyệt trong Zalo / Facebook tự phóng chữ theo cỡ chữ của điện thoại (CSS text-size-adjust
// không chặn được) → thanh đáy cao lên, che mất nội dung cuối trang nếu khoảng chừa là số cố định.
// Thanh nào gắn data-do-cao="<tên biến>" thì ghi chiều cao thật vào biến CSS --<tên biến> trên <html>;
// thanh ẩn (máy tính) = 0px. Chạy hoàn toàn trên máy khách, không gọi máy chủ → không tốn phí gói.
export default function DoThanhDay() {
  const pathname = usePathname();
  useEffect(() => {
    const els = [...document.querySelectorAll<HTMLElement>("[data-do-cao]")];
    if (!els.length) return;
    const ghi = () => {
      for (const el of els) {
        document.documentElement.style.setProperty(`--${el.dataset.doCao}`, `${Math.ceil(el.getBoundingClientRect().height)}px`);
      }
    };
    ghi();
    const ro = new ResizeObserver(ghi);
    els.forEach((el) => ro.observe(el));
    return () => {
      ro.disconnect();
      els.forEach((el) => document.documentElement.style.removeProperty(`--${el.dataset.doCao}`));
    };
  }, [pathname]);
  return null;
}
