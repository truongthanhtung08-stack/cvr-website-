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
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold text-cvr-ink">
          Bất động sản theo khu vực
        </h2>

        {/* 2 hàng gọn: Đà Nẵng ô lõi 2×2 (trái) + 4 ô (2×2 bên phải), cao đều nhau */}
        <div ref={gridRef} className="mt-5 grid grid-cols-2 gap-4 [grid-auto-rows:11rem] sm:grid-cols-4">
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

        {/* Xem tất cả khu vực — cuối phần, canh phải */}
        <div className="mt-5 flex justify-end">
          <Link href="/mua-ban" className="text-sm font-medium text-cvr-muted transition-colors hover:text-cvr-ink">
            Xem tất cả khu vực →
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
      className={`card-lux group relative overflow-hidden ring-1 ring-black/5 shadow-lux transition-transform hover:-translate-y-1.5 shadow-lux-hover hover:ring-cvr-blue/40 ${
        big ? "col-span-2 row-span-2" : ""
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
        {big && (
          <span className="mb-1.5 inline-block bg-cvr-gold px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-cvr-ink [text-shadow:none]">
            Địa điểm nổi bật
          </span>
        )}
        <h3 className={`font-bold text-white ${big ? "text-2xl sm:text-3xl" : "text-lg sm:text-xl"}`}>
          {area.name}
        </h3>
        <p className={`mt-1 text-white/90 ${big ? "text-sm" : "text-xs"}`}>{area.count}</p>
      </div>
    </Link>
  );
}
