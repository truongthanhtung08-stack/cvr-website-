import React, { useEffect, useRef, useState } from "react";
import { Spinner, useNavigate } from "zmp-ui";
import TheTin from "./TheTin";
import { layTinNoiBat, type Tin } from "../lib/tin";
import { useTai } from "../lib/useTai";

// BẤT ĐỘNG SẢN NỔI BẬT — chép cấu trúc web (src/components/FeaturedListings.tsx + src/lib/tinNoiBat.ts typeTabs), chủ dự án 06/11/2026:
// "chạy slide, mỗi slide 8 tin, 2 slide, xếp theo cấp như web, có Xem thêm". Tab lọc như web · xếp Diamond → Gold → Silver → Basic ·
// 2 slide × 8 tin trên MỘT DÒNG · tự trượt từng thẻ 3,5 giây khi khối đang hiện và khách không chạm · Xem thêm mở danh sách đúng mục.
const laBan = (t: Tin) => t.purpose !== "thue";
const TAB: { nhan: string; khop: (t: Tin) => boolean; md: "ban" | "thue" }[] = [
  { nhan: "Tất cả", khop: () => true, md: "ban" },
  { nhan: "Bán đất", khop: (t) => laBan(t) && t.type.includes("Đất"), md: "ban" },
  { nhan: "Bán nhà riêng", khop: (t) => laBan(t) && /Nhà|Villa|Biệt thự|Shophouse/.test(t.type), md: "ban" },
  { nhan: "Bán căn hộ", khop: (t) => laBan(t) && /Căn hộ|Condotel/.test(t.type), md: "ban" },
  { nhan: "Cho thuê", khop: (t) => t.purpose === "thue", md: "thue" },
];
const MOI_SLIDE = 8;
const SO_SLIDE = 2;

export default function KhoiNoiBat() {
  const dieuHuong = useNavigate();
  const ds = useTai(() => layTinNoiBat(), [], [] as Tin[]);
  const [tab, setTab] = useState(0);
  const [dang, setDang] = useState(0);
  const ray = useRef<HTMLDivElement>(null);
  const cham = useRef(0);

  const loc = ds.data.filter(TAB[tab].khop);
  const slides = Array.from({ length: SO_SLIDE }, (_, i) => loc.slice(i * MOI_SLIDE, (i + 1) * MOI_SLIDE)).filter((s) => s.length);

  const buocThe = () => { const o = ray.current?.firstElementChild as HTMLElement | null; return o ? o.offsetWidth + 10 : 0; };
  const toi = (i: number) => ray.current?.scrollTo({ left: i * MOI_SLIDE * buocThe(), behavior: "smooth" });

  // Tự chạy 10 giây/slide như web — chỉ khi khối đang hiện, trang không ẩn, khách không chạm trong 10 giây.
  useEffect(() => {
    const el = ray.current;
    if (!el || slides.length < 2) return;
    let thay = false;
    const io = new IntersectionObserver(([e]) => { thay = e.intersectionRatio >= 0.4; }, { threshold: [0, 0.4, 1] });
    io.observe(el);
    const id = window.setInterval(() => {
      if (!thay || document.hidden || Date.now() - cham.current < 6000) return;
      const o = el.firstElementChild as HTMLElement | null;
      const w = o ? o.offsetWidth + 10 : el.clientWidth;
      const ke = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 ? 0 : el.scrollLeft + w;
      el.scrollTo({ left: ke, behavior: "smooth" });
    }, 3500);
    return () => { window.clearInterval(id); io.disconnect(); };
  }, [slides.length, tab]);

  return (
    <section className="khoi">
      <div className="khoi-dau">
        <h2 className="tieu-de-khoi">Bất động sản nổi bật</h2>
      </div>
      <div className="tab-noi-bat">
        {TAB.map((t, i) => (
          <button key={t.nhan} className={i === tab ? "bat" : ""} onClick={() => { setTab(i); setDang(0); ray.current?.scrollTo({ left: 0 }); }}>{t.nhan}</button>
        ))}
      </div>
      {ds.dangTai ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 16 }}><Spinner /></div>
      ) : (
        <>
          <div
            ref={ray}
            className="ray-slide"
            onTouchStart={() => { cham.current = Date.now(); }}
            onScroll={(e) => { const b = buocThe(); if (b) setDang(Math.min(slides.length - 1, Math.floor((e.currentTarget.scrollLeft + 1) / (b * MOI_SLIDE)))); }}
          >
            {/* MỘT DÒNG chạy slide (chủ dự án 06/11/2026: "để 1 dòng, chạy slide") — 16 tin = 2 slide × 8 nối nhau trên một hàng */}
            {slides.flat().map((t) => <div key={t.id} className="o-noi-bat"><TheTin tin={t} /></div>)}
          </div>
          {slides.length > 1 && (
            <div className="cham-slide">
              {slides.map((_, i) => <span key={i} className={i === dang ? "bat" : ""} onClick={() => toi(i)} />)}
            </div>
          )}
        </>
      )}
      <div className="hang-xem-them"><button className="btn-xemthem" onClick={() => dieuHuong(`/ds/${TAB[tab].md}`)}>Xem thêm<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" /></svg></button></div>
    </section>
  );
}
