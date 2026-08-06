"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Pager from "@/components/Pager";
import { useHomeSection } from "@/components/HomeExpand";
import { asset } from "@/lib/asset";
import { HOME_AREAS_DEFAULT, areaImages, type AreaCard } from "@/lib/siteContent";

const PER_PAGE = 8;

// Hàng khu vực dạng LIST — điện thoại: ảnh TRÊN – chữ DƯỚI · PC: ảnh TRÁI – chữ PHẢI
function AreaRow({ area }: { area: AreaCard }) {
  return (
    <Link
      href={area.href}
      className="group flex flex-col gap-3 overflow-hidden border border-cvr-line bg-white p-2.5 shadow-lux shadow-lux-hover transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 sm:flex-row sm:gap-4 sm:p-3"
    >
      <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-xl bg-cvr-surface sm:aspect-[4/3] sm:w-[38%] sm:min-w-[240px] sm:max-w-[420px]">
        <Image src={asset(area.image)} alt={area.name} fill sizes="(max-width: 640px) 100vw, 38vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <h3 className="text-lg font-semibold leading-snug text-cvr-ink transition-colors group-hover:text-cvr-blue-ink">{area.name}</h3>
        <p className="mt-1.5 text-sm text-cvr-muted">{area.count}</p>
      </div>
    </Link>
  );
}

// Bố cục Homedy: gói gọn 2 HÀNG — ô ĐẦU là địa điểm LÕI 2×2, kèm 4 địa điểm nhỏ.
// Dữ liệu admin sửa được (getHomeAreas) — chưa nhập → mặc định trong code.
// Mỗi ô có thể có NHIỀU ảnh → tự chuyển ảnh (mờ dần), lệch nhịp giữa các ô.
export default function LocationGrid({ areas = HOME_AREAS_DEFAULT }: { areas?: AreaCard[] }) {
  const shown = areas.slice(0, 5); // [0] = địa điểm lõi (lớn) + 4 ô nhỏ
  const gridRef = useRef<HTMLDivElement>(null);
  const [running, setRunning] = useState(false);
  // Cùng cấu trúc mọi khối: "Xem thêm" → list theo trang, các khối khác ẩn
  const { expanded, hidden, toggle } = useHomeSection("khu-vuc");
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(areas.length / PER_PAGE));
  const current = Math.min(page, totalPages);
  const pageItems = areas.slice((current - 1) * PER_PAGE, current * PER_PAGE);

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
        <div ref={gridRef} className={`-mx-4 mt-4 grid grid-cols-2 gap-1 [grid-auto-rows:8rem] sm:mx-0 sm:mt-5 sm:grid-cols-4 sm:gap-4 sm:[grid-auto-rows:11rem] ${expanded ? "hidden" : ""}`}>
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

        {/* Bấm "Xem thêm" → xổ ra danh sách khu vực dạng list, 8 khu vực/trang */}
        {expanded && (
          <div className="mt-5">
            <div className="space-y-4">
              {pageItems.map((a) => <AreaRow key={a.name} area={a} />)}
            </div>
            <Pager page={current} totalPages={totalPages} onChange={setPage} />
          </div>
        )}

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => { toggle(); setPage(1); }}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-cvr-line px-6 text-sm font-semibold text-cvr-ink transition hover:bg-cvr-surface active:bg-cvr-surface"
          >
            {expanded ? "Thu gọn" : `Xem thêm (${areas.length} khu vực)`}
            <svg
              className={`h-4 w-4 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
              fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
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
