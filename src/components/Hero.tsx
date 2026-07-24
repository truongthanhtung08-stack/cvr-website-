"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { asset } from "@/lib/asset";
import HomeSearch from "@/components/HomeSearch";
import { homeBanners, type Banner } from "@/lib/banners";

const DURATION = 6000;

// Hero dùng chung: trang chủ (mặc định) + các trang con muốn banner cùng bố cục
// (bộ lọc sát trên canh giữa · chữ sát dưới canh trái).
type HeroProps = {
  banners?: Banner[]; // bộ banner chạy trong hero (mặc định: banner trang chủ)
  heightClass?: string; // chiều cao hero (gồm cả min-h; mặc định: gần full màn hình)
  search?: boolean; // hiện hộp bộ lọc trên banner (trang con đã có thanh lọc riêng → tắt)
  searchTab?: string; // tab bộ lọc chọn sẵn (vd "Dự án")
  fit?: "cover" | "contain"; // "cover" (mặc định): ảnh phủ kín, có cắt · "contain": ôm TRỌN ảnh, nền 2 bên lấp bằng ảnh mờ
};

export default function Hero({
  banners = homeBanners,
  // Khung LẤY ĐÚNG TỶ LỆ CỦA ẢNH ĐANG HIỆN (đo từ chính file ảnh admin up) →
  // ảnh hiện TRỌN VẸN, không cắt, không hở, không méo — kể cả khi các banner
  // trong slide có tỷ lệ khác nhau. KHÔNG đặt max-h (sẽ co chiều rộng gây hở).
  heightClass = "w-full",
  search = true,
  searchTab,
  fit = "cover",
}: HeroProps) {
  const contain = fit === "contain";
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [tick, setTick] = useState(0);
  const cur = banners[active];

  // Tỷ lệ THẬT của từng ảnh banner — đọc trực tiếp từ file admin đã up.
  // Khung Hero lấy đúng tỷ lệ ảnh đang hiện → ảnh luôn trọn vẹn, không cắt/hở.
  const [ratios, setRatios] = useState<Record<number, number>>({});
  const noteRatio = (i: number, el: HTMLImageElement) => {
    if (!el.naturalHeight) return;
    const rr = el.naturalWidth / el.naturalHeight;
    setRatios((p) => (p[i] ? p : { ...p, [i]: rr }));
  };
  const activeRatio = ratios[active];

  useEffect(() => {
    if (banners.length <= 1 || !playing) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const id = setTimeout(() => {
      setActive((i) => (i + 1) % banners.length);
      setTick((t) => t + 1);
    }, DURATION);
    return () => clearTimeout(id);
  }, [active, playing, banners.length]);

  // Kéo/vuốt bằng chuột hoặc chạm
  const startX = useRef<number | null>(null);
  const onDown = (e: React.PointerEvent) => { startX.current = e.clientX; };
  const onUp   = (e: React.PointerEvent) => {
    if (startX.current === null) return;
    const dx = e.clientX - startX.current;
    startX.current = null;
    if (Math.abs(dx) < 40) return;
    goTo(dx < 0
      ? (active + 1) % banners.length
      : (active - 1 + banners.length) % banners.length);
  };
  const goTo = (i: number) => { setActive(i); setTick((t) => t + 1); };

  // Vuốt NGANG bằng touchpad laptop (wheel deltaX) → chuyển slide. Chỉ nhận khi
  // cử chỉ NGANG rõ rệt (không cướp cuộn dọc); khoá 700ms để 1 lần vuốt = 1 slide.
  const wheelLock = useRef(false);
  const onWheel = (e: React.WheelEvent) => {
    if (banners.length <= 1) return;
    if (Math.abs(e.deltaX) < 24 || Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    if (wheelLock.current) return;
    wheelLock.current = true;
    goTo(e.deltaX > 0
      ? (active + 1) % banners.length
      : (active - 1 + banners.length) % banners.length);
    window.setTimeout(() => { wheelLock.current = false; }, 700);
  };

  return (
    <>
    {/* ── MOBILE: thanh tìm kiếm TÁCH RIÊNG trên nền trắng, đặt NGAY TRÊN Hero
        (mô hình Batdongsan) → Hero bên dưới là ảnh SẠCH, không bị ô lọc đè lên. ── */}
    {search && (
      <div className="bg-white px-4 py-1.5 sm:hidden">
        <HomeSearch defaultTab={searchTab} />
      </div>
    )}
    <section
      className={`relative isolate flex flex-col ${heightClass} select-none`}
      // KHUNG CỐ ĐỊNH 2:1 — KHÔNG đổi theo từng ảnh. (Đã thử cho khung ăn theo tỷ lệ
      // từng banner: trang bị NHẢY 142px mỗi lần chuyển slide → bỏ hẳn.)
      style={{ aspectRatio: "2 / 1" }}
      onPointerDown={onDown}
      onPointerUp={onUp}
      onWheel={onWheel}
    >
      {/* ── Ảnh nền ── */}
      <div className="absolute inset-0 -z-10 overflow-hidden bg-cvr-ink">
        {/* Chế độ contain: lớp nền = chính ảnh đang xem, phủ kín + làm mờ để lấp 2 bên
            (ôm TRỌN ảnh chính ở giữa mà không để dải trống) */}
        {contain && (
          <Image
            key={`bg-${cur.id}`}
            src={asset(cur.image)}
            alt=""
            aria-hidden
            fill
            quality={40}
            draggable={false}
            sizes="100vw"
            className="scale-110 object-cover blur-2xl"
          />
        )}
        {banners.map((b, i) => (
          <Image
            key={b.id}
            src={asset(b.image)}
            alt={b.title}
            fill
            priority={i === 0}
            // Tải NGAY cả các banner sau (AVIF ~60KB/ảnh) để biết TỶ LỆ THẬT của
            // từng ảnh ngay từ đầu → khung không phải đoán, chuyển slide không giật.
            loading={i === 0 ? undefined : "eager"}
            quality={100}
            draggable={false}
            sizes="100vw"
            onLoad={(e) => noteRatio(i, e.currentTarget)}
            className={`pointer-events-none transition-opacity duration-[1000ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
              contain ? "object-contain" : "object-cover"
            } ${i === active ? "opacity-100" : "opacity-0"}`}
          />
        ))}
        {/* Overlay TỐI THIỂU kiểu Apple: 2 dải mờ ở mép trên (bộ lọc/tab) + mép dưới (chữ)
            — phần giữa trong suốt hoàn toàn, giữ nguyên ánh sáng/màu ảnh gốc. */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      </div>

      {/* ── Link toàn banner (z-0, dưới mọi control) ── */}
      <Link
        href={cur.href ?? "#"}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={cur.title}
        className="absolute inset-0 z-0"
      />

      {/* ── Nút ‹ › hai bên ── */}
      {banners.length > 1 && (
        <>
          <SideNav dir="prev" onClick={() => goTo((active - 1 + banners.length) % banners.length)} />
          <SideNav dir="next" onClick={() => goTo((active + 1) % banners.length)} />

          {/* Dots + Play/Pause — góc dưới phải, thẳng hàng với search bar */}
          <div className="absolute bottom-3 right-4 z-20 flex items-center gap-2 sm:bottom-4 sm:right-5">
            {banners.map((b, i) => (
              <button
                key={b.id}
                type="button"
                aria-label={`Banner ${i + 1}`}
                onClick={() => goTo(i)}
                className="relative h-[3px] overflow-hidden rounded-full bg-white/30 transition-all duration-300"
                style={{ width: i === active ? 32 : 10 }}
              >
                {i === active && (
                  <span
                    key={tick}
                    className="absolute inset-y-0 left-0 rounded-full bg-white"
                    style={{
                      animation: playing
                        ? `banner-progress ${DURATION}ms linear forwards`
                        : "none",
                      width: playing ? undefined : "60%",
                    }}
                  />
                )}
              </button>
            ))}

            {/* Gap rõ hơn giữa dots và nút play */}
            <button
              type="button"
              aria-label={playing ? "Tạm dừng" : "Phát"}
              onClick={() => setPlaying((p) => !p)}
              className="ml-3 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition hover:bg-white/40"
            >
              {playing ? (
                <svg className="h-[10px] w-[10px]" viewBox="0 0 10 10" fill="currentColor">
                  <rect x="1.5" y="0.5" width="2.5" height="9" rx="0.8" />
                  <rect x="6" y="0.5" width="2.5" height="9" rx="0.8" />
                </svg>
              ) : (
                <svg className="h-[10px] w-[10px]" viewBox="0 0 10 10" fill="currentColor">
                  <path d="M2 1l7 4-7 4V1z" />
                </svg>
              )}
            </button>
          </div>
        </>
      )}

      {/* ── Layout kiểu Batdongsan: BỘ LỌC sát TRÊN · CHỮ tiêu đề sát DƯỚI (canh trái) ── */}
      <div className={`pointer-events-none relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pb-6 pt-4 sm:px-16 sm:pb-10 sm:pt-8 ${search ? "justify-end sm:justify-between" : "justify-end"}`}>

        {/* ── Bộ lọc — sát TRÊN, canh giữa ngang (kiểu Batdongsan).
            MOBILE: ẩn (đã có thanh tìm kiếm riêng phía trên Hero). ── */}
        {search && (
          <div className="pointer-events-auto mx-auto hidden w-full max-w-4xl sm:block">
            <HomeSearch defaultTab={searchTab} />
          </div>
        )}

        {/* Vùng chữ — sát DƯỚI, canh trái (spec V.6) */}
        {cur.showText !== false && (
            <div
              key={active}
              className="hero-sub max-w-3xl text-left"
            >
              {cur.status && (
                <span className="mb-2 inline-flex items-center rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white ring-1 ring-inset ring-white/25 backdrop-blur-sm">
                  {cur.status}
                </span>
              )}
              <h2 className="text-balance font-[family-name:var(--font-montserrat)] text-lg font-semibold leading-[1.2] tracking-tight text-white [text-shadow:0_2px_16px_rgba(0,0,0,0.6)] sm:text-2xl">
                {cur.title}
              </h2>
              {cur.subtitle && (
                <p className="mt-1 text-balance text-sm font-medium text-white/90 [text-shadow:0_1px_8px_rgba(0,0,0,0.55)] sm:text-base">
                  {cur.subtitle}
                </p>
              )}
              {cur.cta && cur.href && (
                <Link
                  href={cur.href}
                  className="pointer-events-auto mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold text-white ring-1 ring-inset ring-white/25 backdrop-blur-md transition-colors hover:bg-white/25"
                >
                  {cur.cta}
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              )}
            </div>
          )}
      </div>
    </section>
    </>
  );
}

function SideNav({ dir, onClick }: { dir: "prev" | "next"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === "prev" ? "Banner trước" : "Banner sau"}
      className={`absolute top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/35 text-white backdrop-blur-sm transition hover:border-white/70 hover:bg-black/55 sm:flex ${
        dir === "prev" ? "left-3" : "right-3"
      }`}
    >
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d={dir === "prev" ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
      </svg>
    </button>
  );
}
