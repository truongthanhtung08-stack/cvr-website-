"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { asset } from "@/lib/asset";
import { HOME_AREAS_DEFAULT, areaImages, type AreaCard } from "@/lib/siteContent";

// Bố cục Homedy: gói gọn 2 HÀNG — ô ĐẦU là địa điểm LÕI 2×2, kèm 4 địa điểm nhỏ.
// Dữ liệu admin sửa được (getHomeAreas) — chưa nhập → mặc định trong code.
// Mỗi ô có thể có NHIỀU ảnh → tự chuyển ảnh (mờ dần), lệch nhịp giữa các ô.
export default function LocationGrid({ areas = HOME_AREAS_DEFAULT }: { areas?: AreaCard[] }) {
  const shown = areas.slice(0, 5); // [0] = địa điểm lõi (lớn) + 4 ô nhỏ
  const gridRef = useRef<HTMLDivElement>(null);
  const [running, setRunning] = useState(false);

  // Chỉ chạy slide khi phần này đang hiện trong khung nhìn (tiết chế kiểu Apple).
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(([e]) => setRunning(e.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section className="section-edge bg-white">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <h2 className="text-xl font-semibold text-cvr-ink sm:text-2xl">
          Bất động sản theo khu vực
        </h2>

        {/* MOBILE: lướt ngang từng ô khu vực — ẢNH TRÊN tràn viền · TÊN + số tin Ở DƯỚI */}
        <div className="no-scrollbar -mx-4 mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:hidden">
          {shown.map((area) => (
            <Link key={area.name} href={area.href} className="flex w-[58%] shrink-0 snap-start flex-col overflow-hidden rounded-none bg-white shadow-lux">
              <div className="relative aspect-[16/10] w-full overflow-hidden">
                <Image src={asset(areaImages(area)[0])} alt={area.name} fill sizes="58vw" className="object-cover brightness-105" />
              </div>
              <div className="p-3">
                <h3 className="font-bold text-cvr-ink">{area.name}</h3>
                <p className="mt-0.5 text-xs text-cvr-muted">{area.count}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* DESKTOP: GIỮ NGUYÊN mosaic ô lõi 2×2 đã duyệt (ẩn trên mobile) */}
        <div ref={gridRef} className="mt-4 hidden gap-4 [grid-auto-rows:11rem] sm:mt-5 sm:grid sm:grid-cols-4">
          {shown.map((area, i) => (
            <AreaTile
              key={area.name}
              area={area}
              big={i === 0}          // Đà Nẵng — địa điểm lõi
              running={running}
              delay={2000 + i * 1000} // chờ rồi mới đổi, lệch nhịp giữa các ô
            />
          ))}
        </div>

        {/* MOBILE: nút Xem thêm full-width — ĐỒNG BỘ với BĐS/Dự án/Tin tức */}
        <Link href="/mua-ban" className="mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full border border-cvr-line text-[15px] font-semibold text-cvr-ink transition active:bg-cvr-surface sm:hidden">
          Xem thêm khu vực
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        </Link>
        {/* DESKTOP: link góc phải (giữ nguyên) */}
        <div className="mt-4 hidden justify-end sm:flex">
          <Link href="/mua-ban" className="text-sm font-medium text-cvr-muted transition-colors hover:text-cvr-ink">
            Xem thêm →
          </Link>
        </div>
      </div>
    </section>
  );
}

function AreaTile({ area, big, running, delay }: { area: AreaCard; big: boolean; running: boolean; delay: number }) {
  const images = areaImages(area);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!running || images.length < 2) return;
    let timer: ReturnType<typeof setInterval>;
    const next = () => setCurrent((n) => (n + 1) % images.length);
    const start = setTimeout(() => {
      next();
      timer = setInterval(next, 5000);
    }, delay);
    return () => { clearTimeout(start); clearInterval(timer); };
  }, [running, images.length, delay]);

  return (
    <Link
      href={area.href}
      className={`card-lux group relative overflow-hidden shadow-lux transition-transform hover:-translate-y-1.5 shadow-lux-hover hover:ring-cvr-blue/40 sm:ring-1 sm:ring-black/5 ${
        big ? "col-span-2 row-span-1 sm:row-span-2" : ""
      }`}
    >
      <span className="card-sheen z-[3]" aria-hidden />
      {images.map((src, k) => (
        <Image
          key={src}
          src={asset(src)}
          alt={k === 0 ? area.name : ""}
          fill
          sizes={big ? "(max-width: 1024px) 100vw, 50vw" : "(max-width: 1024px) 50vw, 25vw"}
          className={`object-cover brightness-110 contrast-105 saturate-110 transition-[opacity,transform] duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.12] ${
            k === current ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      {/* Phủ tối chỉ ở DẢI HẸP sát chân ô (đủ đọc chữ) — thân ảnh giữ nguyên độ sáng gốc */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-[linear-gradient(to_top,rgba(0,0,0,0.55)_0%,rgba(0,0,0,0.18)_38%,rgba(0,0,0,0)_100%)]" />
      <div className="absolute bottom-0 left-0 p-5 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1 [text-shadow:0_1px_2px_rgba(0,0,0,0.6),0_2px_14px_rgba(0,0,0,0.5)]">
        <h3 className={`font-bold text-white ${big ? "text-2xl sm:text-3xl" : "text-lg sm:text-xl"}`}>
          {area.name}
        </h3>
        <p className={`mt-1 text-white/90 ${big ? "text-sm" : "text-xs"}`}>{area.count}</p>
      </div>
    </Link>
  );
}
