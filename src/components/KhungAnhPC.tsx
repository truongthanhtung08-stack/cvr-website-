"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import GallerySlideVideo from "@/components/GallerySlideVideo";
import dynamic from "next/dynamic";
// Bộ xem ảnh chỉ tải khi khách bấm mở (tốc độ điện thoại, đo 22/10/2026): trước đây nằm sẵn trong mã mọi trang có thẻ tin.
const XemAnhPC = dynamic(() => import("@/components/XemAnhPC"), { ssr: false });
import { videoPosterUrl } from "@/lib/media";

// ============================================================================
// KHUNG ẢNH TRANG TIN — BẢN MÁY TÍNH, kiểu Batdongsan (chủ dự án 18/10/2026).
// Nằm trong cột nội dung bên trái (khung liên hệ ở cột phải bên cạnh):
//   · MỘT khung slide lớn (nền tối, ảnh hiện TRỌN không cắt) — tự chạy 4s/ảnh, video 7s, rê chuột thì dừng
//   · VIDEO là slide đầu như ảnh · nút ‹ › luôn hiện · vuốt ngang touchpad · phím ← →
//   · nhãn "x video · y ảnh" + số thứ tự · dải ảnh nhỏ bên dưới, bấm để chọn
//   · bấm ảnh lớn → bộ xem lớn PC (XemAnhPC)
// Điện thoại vẫn dùng Gallery (đã chốt).
// ============================================================================

export default function KhungAnhPC({ images, videos = [], alt, banDo }: { images: string[]; videos?: string[]; alt: string; banDo?: { diaChi: string; q: string } }) {
  const media = [
    ...videos.map((src) => ({ kind: "video" as const, src })),
    ...images.map((src) => ({ kind: "image" as const, src })),
  ];
  const n = media.length;
  const nVid = videos.length;
  const [i, setI] = useState(0);
  const [dung, setDung] = useState(false); // rê chuột vào khung → dừng tự chạy
  const [giu, setGiu] = useState(false); // đang xem video → dừng tự chạy
  const [xem, setXem] = useState(-1);
  const khoa = useRef(0);
  const dai = useRef<HTMLDivElement>(null);
  const doi = (b: number) => setI((x) => (x + b + n) % n);

  const laVideo = media[i]?.kind === "video";
  useEffect(() => {
    if (dung || giu || xem >= 0 || n < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => setI((x) => (x + 1) % n), laVideo ? 7000 : 4000);
    return () => clearTimeout(t);
  }, [i, dung, giu, xem, n, laVideo]);

  // Ô nhỏ đang chọn luôn trong tầm nhìn — chỉ cuộn DỌC trong cột ảnh nhỏ, không kéo cả trang
  useEffect(() => {
    const el = dai.current?.children[i] as HTMLElement | undefined;
    const box = dai.current;
    if (el && box) box.scrollTo({ top: el.offsetTop - box.clientHeight / 2 + el.clientHeight / 2, behavior: "smooth" });
  }, [i]);

  if (n === 0) return null;
  const m = media[i];
  const vuot = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || Math.abs(e.deltaX) < 12) return;
    const gio = Date.now();
    if (gio - khoa.current < 350) return;
    khoa.current = gio;
    doi(e.deltaX > 0 ? 1 : -1);
  };
  const nut = "absolute top-1/2 z-[3] flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/70";

  return (
    <div className="mb-5 flex gap-2">
      {/* Khung TỶ LỆ VÀNG 1,618, ảnh LẤP ĐẦY khung, không dải đen hai bên; ảnh nhỏ thành CỘT DỌC bên phải → khung
          chính gọn lại (cột ~790: chính ~682×421 + cột ảnh nhỏ 100) — chủ dự án 20/10/2026 */}
      <div
        className="relative aspect-[1.618] min-w-0 flex-1 overflow-hidden rounded-xl bg-black outline-none"
        onMouseEnter={() => setDung(true)}
        onMouseLeave={() => setDung(false)}
        onWheel={vuot}
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "ArrowRight") doi(1); if (e.key === "ArrowLeft") doi(-1); }}
        role="group"
        aria-label="Ảnh và video của tin"
      >
        {m.kind === "video" ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative aspect-video h-full max-w-full">
              <GallerySlideVideo key={i} url={m.src} active onHold={setGiu} />
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setXem(nVid > 0 ? 0 : i)} className="absolute inset-0 block h-full w-full" aria-label="Xem ảnh lớn">
            <Image key={i} src={m.src} alt={`${alt} ${i - nVid + 1}`} fill priority={i === nVid} quality={90} sizes="800px" className="animate-fadein object-cover" />
          </button>
        )}
        {n > 1 && (
          <>
            <button type="button" aria-label="Ảnh trước" onClick={() => doi(-1)} className={`${nut} left-3`}>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m15 19-7-7 7-7" /></svg>
            </button>
            <button type="button" aria-label="Ảnh sau" onClick={() => doi(1)} className={`${nut} right-3`}>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" /></svg>
            </button>
          </>
        )}
        {/* Nút TOÀN MÀN HÌNH (biểu tượng ⤢, chuẩn trình xem máy tính): bấm = mở toàn màn hình thật; trong đó bấm lại
            đúng nút này (⤡) hoặc Esc = thoát. Bấm ảnh cũng mở. */}
        <button type="button" onClick={() => setXem(nVid > 0 ? 0 : i)} aria-label="Xem toàn màn hình" title="Toàn màn hình"
          className="absolute bottom-3 right-3 z-[3] flex h-9 w-9 items-center justify-center rounded-md bg-black/60 text-white backdrop-blur-sm transition hover:bg-black/80">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
        </button>
        {/* Ghi rõ số video, số ảnh của tin */}
        <span className="pointer-events-none absolute left-3 top-3 z-[3] rounded-md bg-black/65 px-2.5 py-1 text-[12px] font-semibold text-white">
          {nVid > 0 ? `${nVid} video · ` : ""}{images.length} ảnh
        </span>
        {m.kind === "image" && (
          <span className="pointer-events-none absolute bottom-3 left-3 z-[3] rounded-md bg-black/60 px-2.5 py-1 text-xs text-white">
            {i - nVid + 1}/{images.length}
          </span>
        )}
      </div>

      {/* Cột ảnh nhỏ bên phải, cao đúng bằng khung chính — video đầu, bấm để chọn */}
      {n > 1 && (
        <div className="relative w-[100px] shrink-0">
        <div ref={dai} className="no-scrollbar absolute inset-0 flex flex-col gap-2 overflow-y-auto">
          {media.map((x, k) => {
            const bia = x.kind === "video" ? videoPosterUrl(x.src)?.thuong : x.src;
            return (
              <button key={k} type="button" onClick={() => setI(k)} aria-label={x.kind === "video" ? "Video" : `Ảnh ${k - nVid + 1}`}
                className={`relative h-[62px] w-[100px] shrink-0 overflow-hidden rounded-md bg-black transition ${k === i ? "ring-2 ring-cvr-blue ring-offset-1" : "opacity-70 hover:opacity-100"}`}>
                {bia && <Image src={bia} alt={x.kind === "video" ? `${alt} - video` : `${alt} ${k - nVid + 1}`} fill sizes="100px" unoptimized={bia.startsWith("https://i.ytimg.com")} className="object-cover" />}
                {x.kind === "video" && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90"><svg className="ml-0.5 h-3.5 w-3.5 text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg></span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
        </div>
      )}

      {/* Bộ xem toàn màn hình: tin có video thì VIDEO HIỆN ĐẦU TIÊN (chủ dự án 20/10/2026), rồi tới ảnh */}
      {/* Mở thẳng trên body — không bị khung cha có transform nhốt lại */}
      {xem >= 0 && createPortal(<XemAnhPC slides={media} start={xem} title={alt} banDo={banDo} onClose={() => setXem(-1)} />, document.body)}
    </div>
  );
}
