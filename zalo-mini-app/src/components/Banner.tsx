import React, { useEffect, useRef, useState } from "react";
import { anh, type Slide } from "../lib/tin";

// Banner đầu trang — trượt ngang bằng ngón tay (scroll-snap), tự chuyển 5 giây/lần như web.
export default function Banner({ ds, bam }: { ds: Slide[]; bam: (s: Slide) => void }) {
  const khung = useRef<HTMLDivElement>(null);
  const [dang, setDang] = useState(0);

  useEffect(() => {
    if (ds.length < 2) return;
    const t = setInterval(() => {
      const k = khung.current;
      if (!k) return;
      const tiep = (Math.round(k.scrollLeft / k.clientWidth) + 1) % ds.length;
      k.scrollTo({ left: tiep * k.clientWidth, behavior: "smooth" });
    }, 5000);
    return () => clearInterval(t);
  }, [ds.length]);

  return (
    <div style={{ position: "relative" }}>
      <div
        ref={khung}
        className="banner-khung"
        onScroll={(e) => setDang(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
      >
        {ds.map((s) => (
          <div key={s.id} className="banner" onClick={() => bam(s)}>
            <img src={anh(s.image)} alt={s.title || "Coastal Land"} />
            {s.showText !== false && (s.title || s.status) && (
              <div className="banner-chu">
                {s.status && <span className="banner-nhan">{s.status}</span>}
                {s.title && <strong>{s.title}</strong>}
              </div>
            )}
          </div>
        ))}
      </div>
      {ds.length > 1 && (
        <div className="banner-cham">
          {ds.map((s, i) => <span key={s.id} className={i === dang ? "bat" : ""} />)}
        </div>
      )}
    </div>
  );
}
