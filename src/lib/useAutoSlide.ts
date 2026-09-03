"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
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
  // ⚠️ MẶC ĐỊNH COI NHƯ ĐANG TRONG TẦM NHÌN.
  // Trước để mặc định false rồi chờ IntersectionObserver bật lên — máy nào bộ theo
  // dõi đó không kích hoạt (tab nền, trình duyệt trong ứng dụng, khung xem trước)
  // là slide đứng im vĩnh viễn mà không ai biết vì sao. Cho chạy trước, bộ theo dõi
  // chỉ có việc TẮT khi dải trôi khỏi màn hình.
  // Ngưỡng 0.15 chứ không phải 0.35: dải thẻ trên điện thoại cao gần bằng cả màn
  // hình, đòi lộ ra 35% mới chạy là nhiều lúc không bao giờ đạt.
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.15 });
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

// TẠM DỪNG KHI KHÁCH CHẠM — RỒI TỰ CHẠY LẠI.
//
// Bẫy đã mắc: chỉ có "chạm thì dừng" mà không có đường quay lại. Trên MÁY TÍNH
// còn có rê chuột ra (mouseleave) để chạy tiếp, chứ trên ĐIỆN THOẠI thì không có
// động tác "rời ngón" nào cả — khách chạm một cái là slide đứng im vĩnh viễn.
// Vì phần lớn khách xem bằng điện thoại nên lỗi này giết luôn tính năng.
//
// Cách làm: chạm thì dừng, im được vài giây không đụng nữa thì tự chạy tiếp.
export function useTamDung(nghi = 6000) {
  const [dung, setDung] = useState(false);
  const hen = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (hen.current) clearTimeout(hen.current); }, []);

  function chamVao() {
    setDung(true);
    if (hen.current) clearTimeout(hen.current);
    hen.current = setTimeout(() => setDung(false), nghi);
  }

  return { dung, chamVao, setDung };
}
