import React, { ReactNode, useEffect, useRef, useState } from "react";

// DẢI THẺ TRƯỢT NGANG — chép đúng cách web điện thoại (useAutoSlideThe trong src/lib/useAutoSlide.ts):
//   · thẻ rộng 90%, cách nhau 16px, dừng đúng MÉP THẺ (scroll-padding), không cắt đôi thẻ
//   · 5 giây sang ĐÚNG MỘT thẻ (tính theo chỉ số thẻ, không cộng dồn), hết dải thì về đầu
//   · khách chạm/vuốt → dừng, im 6 giây không chạm nữa thì tự chạy tiếp
//   · chỉ chạy khi dải đang trong tầm nhìn (mặc định coi như trong tầm — bài học của web)
export default function TruotNgang({ children }: { children: ReactNode }) {
  const khung = useRef<HTMLDivElement>(null);
  const [dung, setDung] = useState(false);
  const [trongTam, setTrongTam] = useState(true);
  const hen = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const el = khung.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setTrongTam(e.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => {
      io.disconnect();
      clearTimeout(hen.current);
    };
  }, []);

  useEffect(() => {
    if (dung || !trongTam) return;
    const t = setInterval(() => {
      const el = khung.current;
      const the = el?.firstElementChild as HTMLElement | null;
      if (!el || !the || document.hidden || el.children.length < 2) return;
      const buoc = the.offsetWidth + (parseFloat(getComputedStyle(el).columnGap) || 0);
      const i = Math.round(el.scrollLeft / buoc);
      const toi = (i + 1) * buoc >= el.scrollWidth - el.clientWidth + 4 ? 0 : (i + 1) * buoc;
      el.scrollTo({ left: toi, behavior: "smooth" });
    }, 5000);
    return () => clearInterval(t);
  }, [dung, trongTam]);

  const chamVao = () => {
    setDung(true);
    clearTimeout(hen.current);
    hen.current = setTimeout(() => setDung(false), 6000);
  };

  return (
    <div ref={khung} className="truot-ngang" onTouchStart={chamVao} onPointerDown={chamVao}>
      {children}
    </div>
  );
}
