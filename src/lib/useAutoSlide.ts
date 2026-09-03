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

// Bản dành cho DẢI LƯỚT NGANG TỪNG THẺ (bố cục điện thoại): mỗi bước đi đúng MỘT
// thẻ chứ không phải trọn bề ngang khung. Dùng chung hook trên là lệch, vì thẻ ở
// điện thoại rộng 90% khung — nhích trọn khung là nhảy quá một thẻ, thẻ nào cũng
// bị cắt đôi.
//
// Vẫn giữ nguyên mấy chốt an toàn: chỉ chạy khi dải đang trong tầm nhìn, tab đang
// mở, khách không chạm vào, và máy không bật chế độ tắt hoạt ảnh. Chạm một cái là
// dừng hẳn — không giành tay khách đang lướt.
export function useAutoSlideThe(
  ref: RefObject<HTMLDivElement | null>,
  soThe: number,
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
    if (paused || !inView || soThe < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => {
      const el = ref.current;
      if (!el || document.hidden) return;
      const con = el.firstElementChild as HTMLElement | null;
      if (!con) return;
      // Bề rộng một bước = bề rộng thẻ + khoảng cách giữa hai thẻ
      const buoc = con.offsetWidth + (parseFloat(getComputedStyle(el).columnGap || "0") || 0);
      if (buoc < 40) return;
      const i = Math.round(el.scrollLeft / buoc);
      // Chạm cuối dải thì quay về đầu
      const toi = (i + 1) * buoc >= el.scrollWidth - el.clientWidth + 4 ? 0 : (i + 1) * buoc;
      smoothScrollTo(el, toi);
    }, interval);
    return () => clearInterval(t);
  }, [paused, inView, soThe, interval, ref]);
}
