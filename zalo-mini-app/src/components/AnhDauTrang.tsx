import React, { useEffect, useRef, useState } from "react";
import type { AnhDau } from "../lib/tin";

// ẢNH ĐẦU TRANG CHỦ — như web điện thoại (src/components/Hero.tsx): ảnh tràn bề ngang, tự chuyển, vạch chỉ ảnh đang xem.
// Tự chuyển 6 giây/ảnh chỉ khi khung đang hiện và khách không chạm (như khối nổi bật).
export default function AnhDauTrang({ ds }: { ds: AnhDau[] }) {
  const ray = useRef<HTMLDivElement>(null);
  const [dang, setDang] = useState(0);
  const cham = useRef(0);

  useEffect(() => {
    const el = ray.current;
    if (!el || ds.length < 2) return;
    let thay = false;
    const io = new IntersectionObserver(([e]) => { thay = e.intersectionRatio >= 0.5; }, { threshold: [0, 0.5, 1] });
    io.observe(el);
    const id = window.setInterval(() => {
      if (!thay || document.hidden || Date.now() - cham.current < 6000) return;
      const ke = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 ? 0 : el.scrollLeft + el.clientWidth;
      el.scrollTo({ left: ke, behavior: "smooth" });
    }, 6000);
    return () => { window.clearInterval(id); io.disconnect(); };
  }, [ds.length]);

  return (
    <div className="anh-dau">
      <div
        ref={ray}
        className="anh-dau-ray"
        onTouchStart={() => { cham.current = Date.now(); }}
        onScroll={(e) => setDang(Math.round(e.currentTarget.scrollLeft / Math.max(1, e.currentTarget.clientWidth)))}
      >
        {ds.map((a, i) => <img key={a.anh + i} src={a.anh} alt={a.tieuDe || "Coastal Land"} loading={i === 0 ? "eager" : "lazy"} />)}
      </div>
      {ds.length > 1 && <div className="anh-dau-vach">{ds.map((_, i) => <span key={i} className={i === dang ? "bat" : ""} />)}</div>}
    </div>
  );
}
