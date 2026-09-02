"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import PhotoViewer from "@/components/PhotoViewer";
import PhotoList from "@/components/PhotoList";
import GallerySlideVideo from "@/components/GallerySlideVideo";

// Thư viện ảnh trang chi tiết BĐS — bố cục kiểu Homedy:
// 1 ảnh lớn bên trái + lưới 2×2 ảnh nhỏ bên phải.
// ĐIỆN THOẠI (kiểu Facebook): carousel 1 ảnh + nút "Xem tất cả N ảnh" → danh sách
// ảnh xếp dọc full bề ngang (cuộn tiếp ở cuối trang là thoát — xem PhotoList)
// → bấm 1 ảnh mở toàn màn hình (vuốt ngang đổi ảnh, vuốt xuống thoát, zoom
// không kéo ra ngoài khung) — xem PhotoViewer.
// VIDEO của tin nằm NGAY TRONG thư viện này, là slide đầu tiên — trượt qua lại
// như một tấm hình, tới lượt thì tự chạy (tắt tiếng).
export default function Gallery({
  images,
  videos = [],
  alt,
  listingId,
}: {
  images: string[];
  videos?: string[]; // video của tin — thành slide đầu trong thư viện
  alt: string;
  listingId?: string; // truyền vào để bộ xem ảnh có nút trái tim (lưu tin)
}) {
  const [lb, setLb] = useState(-1); // chỉ số ảnh đang xem lớn; -1 = đóng
  const [list, setList] = useState(false); // danh sách ảnh kiểu Facebook (điện thoại)
  const [bigIdx, setBigIdx] = useState(0); // slide LỚN đang hiện (tự chạy)
  const [paused, setPaused] = useState(false);
  const [hold, setHold] = useState(false); // đang phóng to video → tạm ngưng tự chuyển slide
  const open = (i: number) => setLb(i);
  const close = () => setLb(-1);

  // Danh sách slide = VIDEO trước, rồi tới ảnh. Bộ xem ảnh toàn màn hình vẫn chỉ
  // nhận ảnh nên phải trừ số video khi quy đổi chỉ số.
  const nVid = videos.length;
  const media = [
    ...videos.map((src) => ({ kind: "video" as const, src })),
    ...images.map((src) => ({ kind: "image" as const, src })),
  ];
  const imgIdx = (m: number) => m - nVid;

  // MOBILE: carousel vuốt 1 ảnh (kiểu Homedy) — theo dõi ảnh đang xem để đếm "Ảnh x/y".
  const [mCur, setMCur] = useState(0);
  const mTrack = useRef<HTMLDivElement>(null);
  const onMScroll = () => {
    const el = mTrack.current;
    if (el) setMCur(Math.round(el.scrollLeft / el.clientWidth));
  };

  // Slide lớn TỰ CHẠY qua tất cả ảnh (4s/slide, mờ nhẹ) — dừng khi rê chuột,
  // tôn trọng prefers-reduced-motion. Slide video chạy đúng nhịp mặc định như ảnh;
  // chỉ khi khách bấm PHÓNG TO video mới ngưng để không bị kéo đi giữa chừng.
  useEffect(() => {
    if (paused || hold || media.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => setBigIdx((i) => (i + 1) % media.length), 4000);
    return () => clearTimeout(t);
  }, [paused, hold, bigIdx, media.length]);

  if (media.length === 0) return null;

  // Ô nhỏ bên phải: 4 slide sau slide lớn
  const rightThumbs = media.slice(1, 5);
  const extra = media.length - 5; // số ảnh còn dư (hiện "+N" ở ô cuối)
  const bigIsVideo = bigIdx < nVid;
  const mIsVideo = mCur < nVid;

  return (
    <>
      {media.length === 1 ? (
        media[0].kind === "video" ? (
          <div className="relative aspect-[2/1] w-full overflow-hidden rounded-none border border-cvr-line">
            <GallerySlideVideo url={media[0].src} active />
          </div>
        ) : (
          <button type="button" onClick={() => open(0)} className="group relative block aspect-[2/1] w-full overflow-hidden rounded-none border border-cvr-line">
            <Image src={media[0].src} alt={alt} fill priority quality={90} sizes="(max-width:1024px) 100vw, 66vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
          </button>
        )
      ) : (
        <>
        {/* ── ĐIỆN THOẠI: carousel vuốt 1 ảnh, tỷ lệ 4:3 to rõ, đếm "Ảnh x/y" (kiểu Homedy) ── */}
        <div className="relative sm:hidden">
          <div
            ref={mTrack}
            onScroll={onMScroll}
            className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
          >
            {media.map((m, i) =>
              m.kind === "video" ? (
                <div
                  key={i}
                  className="relative aspect-[2/1] w-full shrink-0 snap-center overflow-hidden border border-cvr-line bg-black"
                >
                  <GallerySlideVideo url={m.src} active={i === mCur} />
                </div>
              ) : (
                <button
                  key={i}
                  type="button"
                  onClick={() => open(imgIdx(i))}
                  aria-label={`Ảnh ${imgIdx(i) + 1}`}
                  className="relative aspect-[2/1] w-full shrink-0 snap-center overflow-hidden border border-cvr-line bg-cvr-surface"
                >
                  <Image src={m.src} alt={`${alt} ${imgIdx(i) + 1}`} fill priority={i === nVid} quality={90} sizes="100vw" className="object-cover" />
                </button>
              ),
            )}
          </div>
          {/* Ở slide video thì đẩy các nhãn lên TRÊN để không đè thanh điều khiển video */}
          {/* Đếm ảnh — chữ cỡ đọc được (13px), nền tối rõ */}
          {!mIsVideo && (
            <span className="pointer-events-none absolute bottom-3 right-3 rounded-md bg-black/65 px-2.5 py-1 text-[13px] font-medium text-white backdrop-blur-sm">
              Ảnh {imgIdx(mCur) + 1}/{images.length}
            </span>
          )}
          {/* Chấm vị trí */}
          {!mIsVideo && (
            <span className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {media.slice(0, Math.min(media.length, 8)).map((_, i) => (
                <span key={i} className={`h-1.5 rounded-full transition-all ${i === mCur % 8 ? "w-4 bg-white" : "w-1.5 bg-white/55"}`} />
              ))}
            </span>
          )}

          {/* Xem tất cả ảnh — mở danh sách ảnh xếp dọc kiểu Facebook */}
          <button
            type="button"
            onClick={() => setList(true)}
            className={`absolute left-3 flex items-center gap-1.5 rounded-md bg-black/65 px-2.5 py-1 text-[13px] font-medium text-white backdrop-blur-sm active:bg-black/80 ${mIsVideo ? "top-3" : "bottom-3"}`}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h10" />
            </svg>
            Xem tất cả {images.length} ảnh
          </button>
        </div>

        {/* ── TABLET / MÁY TÍNH (≥ 640px): GIỮ NGUYÊN bố cục ảnh lớn + lưới 2×2 đã duyệt ── */}
        <div className="hidden gap-2 sm:grid sm:h-[340px] sm:grid-cols-4 sm:grid-rows-2">
          {/* Ô lớn — TỰ CHẠY slide qua các ảnh (và video), bấm ảnh để xem lớn */}
          <div
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            className="group relative col-span-2 aspect-[16/9] overflow-hidden rounded-none border border-cvr-line sm:row-span-2 sm:aspect-auto sm:h-full"
          >
            {bigIsVideo ? (
              <GallerySlideVideo url={media[bigIdx].src} active onHold={setHold} />
            ) : (
              <button type="button" onClick={() => open(imgIdx(bigIdx))} className="absolute inset-0 block h-full w-full">
                <Image key={bigIdx} src={media[bigIdx].src} alt={alt} fill priority quality={90} sizes="(max-width:1024px) 100vw, 50vw" className="object-cover animate-fadein" />
              </button>
            )}
            <span className={`pointer-events-none absolute left-3 rounded-md bg-black/60 px-2.5 py-1 text-xs text-white backdrop-blur-sm ${bigIsVideo ? "top-3" : "bottom-3"}`}>
              {bigIsVideo ? "Video" : `${imgIdx(bigIdx) + 1}/${images.length}`}
            </span>
            {/* Chấm chỉ vị trí slide — slide video thì ẩn, nhường góc phải cho nút Phóng to */}
            {!bigIsVideo && (
              <span className="pointer-events-none absolute bottom-3 right-3 flex gap-1">
                {media.slice(0, Math.min(media.length, 8)).map((_, i) => (
                  <span key={i} className={`h-1.5 rounded-full transition-all ${i === bigIdx % 8 ? "w-4 bg-white" : "w-1.5 bg-white/50"}`} />
                ))}
              </span>
            )}
          </div>

          {/* Lưới 2×2 ô nhỏ bên phải */}
          {rightThumbs.map((m, i) => {
            const idx = i + 1;
            const isLast = i === rightThumbs.length - 1 && extra > 0;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => (m.kind === "video" ? setBigIdx(idx) : open(imgIdx(idx)))}
                className="group relative aspect-square overflow-hidden rounded-none border border-cvr-line sm:aspect-auto sm:h-full"
              >
                {m.kind === "video" ? (
                  <span className="absolute inset-0 flex items-center justify-center bg-black">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90">
                      <svg className="ml-0.5 h-5 w-5 text-black" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                  </span>
                ) : (
                  <Image src={m.src} alt={`${alt} ${imgIdx(idx) + 1}`} fill sizes="(max-width:1024px) 50vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                )}
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
