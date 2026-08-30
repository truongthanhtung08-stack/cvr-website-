"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import PhotoViewer from "@/components/PhotoViewer";
import PhotoList from "@/components/PhotoList";

// Thư viện ảnh trang chi tiết BĐS — bố cục kiểu Homedy:
// 1 ảnh lớn bên trái + lưới 2×2 ảnh nhỏ bên phải.
// ĐIỆN THOẠI (kiểu Facebook): carousel 1 ảnh + nút "Xem tất cả N ảnh" → danh sách
// ảnh xếp dọc full bề ngang (cuộn tiếp ở cuối trang là thoát — xem PhotoList)
// → bấm 1 ảnh mở toàn màn hình (vuốt ngang đổi ảnh, vuốt xuống thoát, zoom
// không kéo ra ngoài khung) — xem PhotoViewer.
export default function Gallery({
  images,
  alt,
  listingId,
}: {
  images: string[];
  alt: string;
  listingId?: string; // truyền vào để bộ xem ảnh có nút trái tim (lưu tin)
}) {
  const [lb, setLb] = useState(-1); // chỉ số ảnh đang xem lớn; -1 = đóng
  const [list, setList] = useState(false); // danh sách ảnh kiểu Facebook (điện thoại)
  const [bigIdx, setBigIdx] = useState(0); // ảnh LỚN đang hiện (tự chạy slide)
  const [paused, setPaused] = useState(false);
  const open = (i: number) => setLb(i);
  const close = () => setLb(-1);

  // MOBILE: carousel vuốt 1 ảnh (kiểu Homedy) — theo dõi ảnh đang xem để đếm "Ảnh x/y".
  const [mCur, setMCur] = useState(0);
  const mTrack = useRef<HTMLDivElement>(null);
  const onMScroll = () => {
    const el = mTrack.current;
    if (el) setMCur(Math.round(el.scrollLeft / el.clientWidth));
  };

  // Ảnh lớn TỰ CHẠY slide qua tất cả ảnh (4s/ảnh, mờ nhẹ) — dừng khi rê chuột,
  // tôn trọng prefers-reduced-motion. Người dùng vẫn bấm ảnh nhỏ để xem lớn.
  useEffect(() => {
    if (paused || images.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setBigIdx((i) => (i + 1) % images.length), 4000);
    return () => clearInterval(t);
  }, [paused, images.length]);

  if (images.length === 0) return null;

  // Ảnh nhỏ bên phải: 4 ảnh sau ảnh lớn
  const rightThumbs = images.slice(1, 5);
  const extra = images.length - 5; // số ảnh còn dư (hiện "+N" ở ô cuối)

  return (
    <>
      {images.length === 1 ? (
        <button type="button" onClick={() => open(0)} className="group relative block aspect-[2/1] w-full overflow-hidden rounded-none border border-cvr-line">
          <Image src={images[0]} alt={alt} fill priority quality={90} sizes="(max-width:1024px) 100vw, 66vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
        </button>
      ) : (
        <>
        {/* ── ĐIỆN THOẠI: carousel vuốt 1 ảnh, tỷ lệ 4:3 to rõ, đếm "Ảnh x/y" (kiểu Homedy) ── */}
        <div className="relative sm:hidden">
          <div
            ref={mTrack}
            onScroll={onMScroll}
            className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
          >
            {images.map((src, i) => (
              <button
                key={i}
                type="button"
                onClick={() => open(i)}
                aria-label={`Ảnh ${i + 1}`}
                className="relative aspect-[2/1] w-full shrink-0 snap-center overflow-hidden border border-cvr-line bg-cvr-surface"
              >
                <Image src={src} alt={`${alt} ${i + 1}`} fill priority={i === 0} quality={90} sizes="100vw" className="object-cover" />
              </button>
            ))}
          </div>
          {/* Đếm ảnh — chữ cỡ đọc được (13px), nền tối rõ */}
          <span className="pointer-events-none absolute bottom-3 right-3 rounded-md bg-black/65 px-2.5 py-1 text-[13px] font-medium text-white backdrop-blur-sm">
            Ảnh {mCur + 1}/{images.length}
          </span>
          {/* Chấm vị trí */}
          <span className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {images.slice(0, Math.min(images.length, 8)).map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i === mCur % 8 ? "w-4 bg-white" : "w-1.5 bg-white/55"}`} />
            ))}
          </span>

          {/* Xem tất cả ảnh — mở danh sách ảnh xếp dọc kiểu Facebook */}
          <button
            type="button"
            onClick={() => setList(true)}
            className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-md bg-black/65 px-2.5 py-1 text-[13px] font-medium text-white backdrop-blur-sm active:bg-black/80"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h10" />
            </svg>
            Xem tất cả {images.length} ảnh
          </button>
        </div>

        {/* ── TABLET / MÁY TÍNH (≥ 640px): GIỮ NGUYÊN bố cục ảnh lớn + lưới 2×2 đã duyệt ── */}
        <div className="hidden gap-2 sm:grid sm:h-[340px] sm:grid-cols-4 sm:grid-rows-2">
          {/* Ảnh lớn — TỰ CHẠY slide qua các ảnh, bấm để xem lớn */}
          <button
            type="button"
            onClick={() => open(bigIdx)}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            className="group relative col-span-2 aspect-[16/9] overflow-hidden rounded-none border border-cvr-line sm:row-span-2 sm:aspect-auto sm:h-full"
          >
            <Image key={bigIdx} src={images[bigIdx]} alt={alt} fill priority quality={90} sizes="(max-width:1024px) 100vw, 50vw" className="object-cover animate-fadein" />
            <span className="absolute bottom-3 left-3 rounded-md bg-black/60 px-2.5 py-1 text-xs text-white backdrop-blur-sm">
              {bigIdx + 1}/{images.length}
            </span>
            {/* Chấm chỉ vị trí ảnh đang chạy */}
            <span className="absolute bottom-3 right-3 flex gap-1">
              {images.slice(0, Math.min(images.length, 8)).map((_, i) => (
                <span key={i} className={`h-1.5 rounded-full transition-all ${i === bigIdx % 8 ? "w-4 bg-white" : "w-1.5 bg-white/50"}`} />
              ))}
            </span>
          </button>

          {/* Lưới 2×2 ảnh nhỏ bên phải */}
          {rightThumbs.map((src, i) => {
            const idx = i + 1;
            const isLast = i === rightThumbs.length - 1 && extra > 0;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => open(idx)}
                className="group relative aspect-square overflow-hidden rounded-none border border-cvr-line sm:aspect-auto sm:h-full"
              >
                <Image src={src} alt={`${alt} ${idx + 1}`} fill sizes="(max-width:1024px) 50vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                {isLast && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-lg font-semibold text-white">
                    +{extra} ảnh
                  </span>
                )}
              </button>
            );
          })}
        </div>
        </>
      )}

      {/* DANH SÁCH ẢNH KIỂU FACEBOOK (điện thoại) — mở từ nút "Xem tất cả N ảnh".
          Ảnh xếp dọc full bề ngang, cuộn tiếp ở cuối trang là thoát. */}
      {list && (
        <PhotoList images={images} title={alt} onPick={open} onClose={() => setList(false)} nhanPhim={lb < 0} />
      )}

      {/* Xem 1 ảnh toàn màn hình — vuốt trái/phải đổi ảnh, vuốt xuống thoát */}
      {lb >= 0 && (
        <PhotoViewer
          images={images}
          start={lb}
          title={alt}
          listingId={listingId}
          onClose={close}
        />
      )}
    </>
  );
}
