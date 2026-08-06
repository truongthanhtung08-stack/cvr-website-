"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useHomeSection } from "@/components/HomeExpand";
import { asset } from "@/lib/asset";
import { HOME_AREAS_DEFAULT, areaImages, type AreaCard } from "@/lib/siteContent";

// Bố cục Homedy: gói gọn 2 HÀNG — ô ĐẦU là địa điểm LÕI 2×2, kèm 4 địa điểm nhỏ.
// Dữ liệu admin sửa được (getHomeAreas) — chưa nhập → mặc định trong code.
// Mỗi ô có thể có NHIỀU ảnh → tự chuyển ảnh (mờ dần), lệch nhịp giữa các ô.
export default function LocationGrid({ areas = HOME_AREAS_DEFAULT }: { areas?: AreaCard[] }) {
  const shown = areas.slice(0, 5); // [0] = địa điểm lõi (lớn) + 4 ô nhỏ
  const gridRef = useRef<HTMLDivElement>(null);
  const [running, setRunning] = useState(false);
  // Khối này KHÔNG có "Xem thêm" (theo yêu cầu) — chỉ ẩn đi khi khối khác đang mở.
  const { hidden } = useHomeSection("khu-vuc");

  // Chỉ chạy slide khi phần này đang hiện trong khung nhìn (tiết chế kiểu Apple).
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(([e]) => setRunning(e.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  if (hidden) return null;

  return (
    <section className="section-edge bg-white">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <h2 className="text-xl font-semibold text-cvr-ink sm:text-2xl">
          Bất động sản theo khu vực
        </h2>

        {/* Mosaic khu vực (ô lõi 2×2 + 4 ô nhỏ) — GIỮ NGUYÊN cấu trúc.
            MOBILE: TRÀN VIỀN sát mép màn hình (-mx-4) · DESKTOP: giữ như cũ. */}
        <div ref={gridRef} className="-mx-4 mt-4 grid grid-cols-2 gap-1 [grid-auto-rows:8rem] sm:mx-0 sm:mt-5 sm:grid-cols-4 sm:gap-4 sm:[grid-auto-rows:11rem]">
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
          className={`object-cover contrast-[1.04] saturate-[1.06] transition-[opacity,transform] duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.08] ${
            k === current ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      {/* Ảnh giữ nguyên độ nét & độ sáng gốc; chỉ dải chân ô tối dần để chữ nổi rõ.
          (Trước đây ảnh bị đẩy sáng brightness-110 nên chữ trắng chìm vào ảnh.) */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(to_top,rgba(0,0,0,0.72)_0%,rgba(0,0,0,0.42)_34%,rgba(0,0,0,0.12)_68%,rgba(0,0,0,0)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 p-3.5 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1 sm:p-5 [text-shadow:0_1px_3px_rgba(0,0,0,0.55)]">
        <h3 className={`font-semibold leading-tight tracking-[-0.01em] text-white ${big ? "text-xl sm:text-3xl" : "text-base sm:text-xl"}`}>
          {area.name}
        </h3>
        <p className={`mt-1 text-white/85 ${big ? "text-xs sm:text-sm" : "text-[11px] sm:text-xs"}`}>{area.count}</p>
      </div>
    </Link>
  );
}
