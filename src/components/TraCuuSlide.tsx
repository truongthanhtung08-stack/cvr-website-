"use client";

import { useRef, useState } from "react";
import type { DongTraCuu } from "@/lib/traCuuDuAn";
import { TheDuAnDoc } from "@/components/TraCuuDuAn";
import { smoothScrollTo } from "@/lib/scroll";
import { useAutoSlide, useAutoSlideThe, useTamDung } from "@/lib/useAutoSlide";

// TRA CỨU DỰ ÁN — CÙNG CÁCH HIỆN khối Dự án nổi bật (chủ dự án 30/10/2026): hàng trượt 8 thẻ + "Xem thêm" (ra cùng danh sách
// như trang chủ). Dùng ở trang Dự án (/du-an, trang theo tỉnh, loại hình, chủ đầu tư).

/** Hàng trượt 8 thẻ — cùng chuẩn slide Dự án nổi bật: máy tính 4 thẻ một slide, tự chạy 7 s, rê chuột dừng, mũi tên + chấm;
 *  điện thoại lướt từng thẻ, tự chạy 5 s, chạm dừng rồi chạy lại */
export function HangTraCuu({ ds }: { ds: DongTraCuu[] }) {
  const track = useRef<HTMLDivElement>(null);
  const diMob = useRef<HTMLDivElement>(null);
  const [slide, setSlide] = useState(0);
  const { dung, chamVao, setDung } = useTamDung(6000);
  const { dung: dungMob, chamVao: chamMob } = useTamDung(6000);
  const nhom: DongTraCuu[][] = [];
  for (let i = 0; i < ds.length; i += 4) nhom.push(ds.slice(i, i + 4));
  const n = Math.max(nhom.length, 1);
  const hienTai = Math.min(slide, n - 1);
  const den = (i: number) => {
    const el = track.current;
    if (el) smoothScrollTo(el, ((i + n) % n) * el.clientWidth);
  };
  useAutoSlide(track, n, dung, 7000);
  useAutoSlideThe(diMob, ds.length, dungMob, 5000);

  return (
    <>
      <div ref={diMob} onTouchStart={chamMob} className="no-scrollbar -mx-4 mt-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 sm:hidden">
        {ds.map((d) => (
          <div key={d.slug} className="w-[90%] shrink-0 snap-start"><TheDuAnDoc d={d} /></div>
        ))}
      </div>
      <div className="relative mt-5 hidden sm:block">
        <div
          ref={track}
          className="no-scrollbar flex snap-x snap-mandatory items-stretch overflow-x-auto overscroll-x-contain py-2"
          onScroll={(e) => setSlide(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
          onMouseEnter={() => setDung(true)}
          onMouseLeave={() => setDung(false)}
          onTouchStart={chamVao}
        >
          {nhom.map((g, gi) => (
            <div key={gi} className="w-full shrink-0 snap-start">
              <div className="grid h-full grid-cols-2 gap-5 lg:grid-cols-4">
                {g.map((d) => <div key={d.slug}><TheDuAnDoc d={d} /></div>)}
              </div>
            </div>
          ))}
        </div>
        {nhom.length > 1 && (
          <>
            <button type="button" aria-label="Slide trước" onClick={() => den(hienTai - 1)} className="absolute -left-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-cvr-line bg-white/90 text-cvr-ink shadow-lux backdrop-blur transition hover:bg-white sm:flex">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button type="button" aria-label="Slide tiếp" onClick={() => den(hienTai + 1)} className="absolute -right-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-cvr-line bg-white/90 text-cvr-ink shadow-lux backdrop-blur transition hover:bg-white sm:flex">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </>
        )}
      </div>
      {nhom.length > 1 && (
        <div className="mt-4 hidden justify-center gap-2 sm:flex">
          {nhom.map((_, i) => (
            <button key={i} type="button" onClick={() => den(i)} aria-label={`Slide ${i + 1}`} className={`h-2 rounded-full transition-all duration-300 ${i === hienTai ? "w-6 bg-cvr-ink" : "w-2 bg-cvr-line hover:bg-cvr-muted"}`} />
          ))}
        </div>
      )}
    </>
  );
}
