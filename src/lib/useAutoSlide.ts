"use client";

import { useEffect, useState, type RefObject } from "react";
import { smoothScrollTo } from "./scroll";

// Tự chạy slider scroll-snap — dùng chung cho mọi slider trang chủ.
// Chỉ chạy khi ĐỦ điều kiện (tiết chế kiểu Apple, không lãng phí hiệu năng):
//   • Section đang HIỆN trong khung nhìn (IntersectionObserver ≥ 35%)
//   • Tab trình duyệt đang mở (document.hidden = false)
//   • Người dùng không tương tác (paused: hover/chạm do component quản)
//   • Người dùng không tắt hoạt ảnh (prefers-reduced-motion)
// interval chọn theo MẬT ĐỘ nội dung slide: nhiều tin cần đọc → dừng lâu hơn.
export function useAutoSlide(
  ref: RefObject<HTMLDivElement | null>,
  slideCount: number,
  paused: boolean,
  interval: number,
) {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);

  useEffect(() => {
    if (paused || !inView || slideCount < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => {
      const el = ref.current;
      if (!el || document.hidden) return;
      const i = Math.round(el.scrollLeft / el.clientWidth);
      smoothScrollTo(el, ((i + 1) % slideCount) * el.clientWidth);
    }, interval);
    return () => clearInterval(t);
  }, [paused, inView, slideCount, interval, ref]);
}
