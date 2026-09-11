"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import PhotoViewer from "@/components/PhotoViewer";
import PhotoList from "@/components/PhotoList";
import GallerySlideVideo from "@/components/GallerySlideVideo";
import VideoToanManHinh from "@/components/VideoToanManHinh";

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
  const [hold, setHold] = useState(false); // đang xem video → tạm ngưng tự chuyển slide
  // Video đang mở toàn màn hình (null = không mở).
  const [videoFull, setVideoFull] = useState<string | null>(null);

  // ── ĐIỀU KHIỂN SLIDE LỚN TRÊN MÁY TÍNH: TOUCHPAD · PHÍM · CHẠM ───────────
  // Trước đây ảnh lớn chỉ TỰ CHẠY, khách muốn xem lại tấm vừa trôi qua thì không
  // có cách nào ngoài ngồi đợi nó quay vòng. Nay:
  //   · vuốt hai ngón ngang trên touchpad (và chuột có bánh xe ngang)
  //   · phím ← → khi con trỏ đang ở khung ảnh
  //   · quẹt ngón tay (màn hình cảm ứng trên máy tính, máy 2-trong-1)
  // Một cú vuốt = MỘT tấm: có khoá thời gian 320ms, nếu không thì một cú vuốt
  // touchpad bắn ra hàng chục sự kiện và ảnh chạy vèo qua hết cả bộ.
  const lanCuoi = useRef(0);
  const keo = useRef<number | null>(null);
  const doiSlide = (buoc: number) => {
    const gio = Date.now();
    if (gio - lanCuoi.current < 320) return;
    lanCuoi.current = gio;
    setBigIdx((i) => (i + buoc + media.length) % media.length);
  };
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
  // Khách vừa vuốt/bấm → tạm ngưng tự chạy 8 giây rồi chạy tiếp.
  const [mCham, setMCham] = useState(false);
  const hetCham = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chamVao = () => {
    setMCham(true);
    if (hetCham.current) clearTimeout(hetCham.current);
    hetCham.current = setTimeout(() => setMCham(false), 8000);
  };
  useEffect(() => () => { if (hetCham.current) clearTimeout(hetCham.current); }, []);
  const mTrack = useRef<HTMLDivElement>(null);
  // Bấm ô nhỏ → nhảy thẳng tới slide đó.
  const nhayToi = (i: number) => {
    const el = mTrack.current;
    if (!el) return;
    chamVao(); // khách vừa chọn tay → tạm ngưng tự chạy, 8 giây sau chạy tiếp
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  const onMScroll = () => {
    const el = mTrack.current;
    if (el) setMCur(Math.round(el.scrollLeft / el.clientWidth));
  };

  // Ô nhỏ đang xem phải TỰ trôi vào giữa dãy. Không có cái này thì xem tới tấm
  // thứ 6 là ô đang chọn đã nằm ngoài màn, khách không biết mình đang ở đâu.
  const mThumbs = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const dai = mThumbs.current;
    const o = dai?.querySelector<HTMLElement>(`[data-o="${mCur}"]`);
    if (!dai || !o) return;
    const giua = o.offsetLeft - dai.clientWidth / 2 + o.clientWidth / 2;
    dai.scrollTo({ left: Math.max(0, giua), behavior: "smooth" });
  }, [mCur]);

  // ĐIỆN THOẠI cũng TỰ CHẠY slide 4s/slide như máy tính (video tính là một slide,
  // nó không tự phát nên vẫn trôi qua như ảnh). Ngưng khi: khách đang xem video /
  // phóng to, hoặc khách đã tự vuốt tay.
  useEffect(() => {
    if (hold || mCham || media.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => {
      const el = mTrack.current;
      if (!el || el.clientWidth === 0) return; // đang ở khổ máy tính → bỏ qua
      const ke = (Math.round(el.scrollLeft / el.clientWidth) + 1) % media.length;
      el.scrollTo({ left: ke * el.clientWidth, behavior: "smooth" });
    }, 4000);
    return () => clearTimeout(t);
  }, [hold, mCham, mCur, media.length]);

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

  // Huy hiệu nhỏ góc trái trên: tin này có bao nhiêu ẢNH và bao nhiêu VIDEO.
  const demMedia = (
    <span className="pointer-events-none absolute left-3 top-3 z-[5] flex items-center gap-2.5 rounded-md bg-black/65 px-2.5 py-1 text-[12px] font-semibold text-white backdrop-blur-sm">
      <span className="flex items-center gap-1">
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5h3l1.5-2h9L18 7.5h3v11H3v-11Z" />
          <circle cx="12" cy="12.5" r="3.2" />
        </svg>
        {images.length}
      </span>
      {nVid > 0 && (
        <span className="flex items-center gap-1">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <rect x="3" y="6" width="12" height="12" rx="2" />
            <path strokeLinecap="round" strokeLinejoin="round" d="m15 10.5 6-3v9l-6-3v-3Z" />
          </svg>
          {nVid}
        </span>
      )}
    </span>
  );

  return (
    <>
      {media.length === 1 ? (
        media[0].kind === "video" ? (
          <button
            type="button"
            onClick={() => setVideoFull(media[0].src)}
            aria-label="Xem video của tin"
            className="relative aspect-[2/1] w-full overflow-hidden rounded-none border border-cvr-line bg-black"
          >
            <GallerySlideVideo url={media[0].src} active={false} xemTruoc />
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lg">
                <svg className="ml-1 h-7 w-7 text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              </span>
            </span>
          </button>
        ) : (
          <button type="button" onClick={() => open(0)} className="group relative block aspect-[2/1] w-full overflow-hidden rounded-none border border-cvr-line">
            <Image src={media[0].src} alt={alt} fill priority quality={90} sizes="(max-width:1024px) 100vw, 66vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
          </button>
        )
      ) : (
        <>
        {/* ── ĐIỆN THOẠI: carousel vuốt 1 ảnh, tỷ lệ 4:3 to rõ, đếm "Ảnh x/y" (kiểu Homedy) ── */}
        <div className="sm:hidden">
          <div className="relative">
          <div
            ref={mTrack}
            onScroll={onMScroll}
            onTouchStart={chamVao}
            onPointerDown={chamVao}
            className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
          >
            {media.map((m, i) =>
              m.kind === "video" ? (
                <button
                  key={i}
                  type="button"
                  onClick={() => setVideoFull(m.src)}
                  aria-label="Xem video của tin"
                  className="relative aspect-[4/3] w-full shrink-0 snap-center overflow-hidden border border-cvr-line bg-black"
                >

                  <GallerySlideVideo url={m.src} active={false} xemTruoc />
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lg">
                      <svg className="ml-1 h-7 w-7 text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    </span>
                  </span>
                </button>
              ) : (
                <button
                  key={i}
                  type="button"
                  onClick={() => open(imgIdx(i))}
                  aria-label={`Ảnh ${imgIdx(i) + 1}`}
                  className="relative aspect-[4/3] w-full shrink-0 snap-center overflow-hidden border border-cvr-line bg-cvr-surface"
                >
                  <Image src={m.src} alt={`${alt} ${imgIdx(i) + 1}`} fill priority={i === nVid} quality={90} sizes="100vw" className="object-cover" />
                </button>
              ),
            )}
          </div>
          {/* ── LỚP ĐIỀU KHIỂN ĐÈ LÊN ĐÁY ẢNH ────────────────────────────────
              Ảnh giữ nguyên khổ 4:3 đã duyệt, nhưng dãy ô nhỏ + hai nhãn nằm ĐÈ
              lên đáy ảnh thay vì xếp bên dưới: không tốn thêm một pixel chiều
              cao nào, phần thông tin tin đăng nhờ đó lên cao hơn hẳn. */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/35 to-transparent pb-1.5 pt-8">
            <div className="mb-1.5 flex items-center justify-between px-2.5">
              <button
                type="button"
                onClick={() => setList(true)}
                className="pointer-events-auto flex items-center gap-1.5 text-[13px] font-medium text-white drop-shadow active:opacity-70"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h10" />
                </svg>
                Xem tất cả {images.length} ảnh
              </button>
              {!mIsVideo && (
                <span className="text-[13px] font-medium text-white drop-shadow">
                  {imgIdx(mCur) + 1}/{images.length}
                </span>
              )}
            </div>

            {/* DÃY Ô NHỎ — CUỘN NGANG, CÓ ĐỦ MỌI TẤM.
                Bản cũ chỉ hiện 4 ô rồi đè ô thứ tư thành "+N": ảnh thứ 5 trở đi
                không có cách nào chọn, dãy cũng không kéo được (chủ dự án báo
                11/9/2026). Nay dãy kéo ngang tự do, ô đang xem viền trắng và TỰ
                cuộn vào giữa tầm nhìn mỗi khi đổi ảnh. */}
            {media.length > 1 && (
              <div
                ref={mThumbs}
                className="no-scrollbar pointer-events-auto flex gap-1 overflow-x-auto overscroll-x-contain px-2"
              >
                {media.map((m, i) => (
                  <button
                    key={i}
                    type="button"
                    data-o={i}
                    onClick={() => nhayToi(i)}
                    aria-label={m.kind === "video" ? "Xem video" : `Xem ảnh ${imgIdx(i) + 1}`}
                    aria-current={i === mCur}
                    className={`relative h-9 w-12 shrink-0 overflow-hidden rounded bg-black/30 transition ${
                      i === mCur ? "ring-2 ring-white" : "opacity-55 ring-1 ring-white/40"
                    }`}
                  >
                    {m.kind === "video" ? (
                      <>
                        <GallerySlideVideo url={m.src} active={false} xemTruoc />
                        <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                          <svg className="ml-0.5 h-4 w-4 text-white drop-shadow" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                        </span>
                      </>
                    ) : (
                      <Image src={m.src} alt="" fill sizes="48px" className="object-cover" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          </div>
        </div>

        {/* ── TABLET / MÁY TÍNH (≥ 640px): GIỮ NGUYÊN bố cục ảnh lớn + lưới 2×2 đã duyệt ── */}
        <div className="hidden gap-2 sm:grid sm:h-[340px] sm:grid-cols-4 sm:grid-rows-2">
          {/* Ô lớn — TỰ CHẠY slide qua các ảnh (và video), bấm ảnh để xem lớn */}
          <div
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            // Vuốt ngang bằng touchpad. Chỉ nhận khi độ lệch NGANG lớn hơn dọc —
            // không thì cuộn trang bình thường cũng làm nhảy ảnh.
            onWheel={(e) => {
              if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 8) {
                doiSlide(e.deltaX > 0 ? 1 : -1);
              }
            }}
            // Quẹt ngón tay (màn hình cảm ứng trên máy tính / máy 2-trong-1)
            onPointerDown={(e) => { if (e.pointerType !== "mouse") keo.current = e.clientX; }}
            onPointerUp={(e) => {
              if (keo.current === null) return;
              const dx = e.clientX - keo.current;
              keo.current = null;
              if (Math.abs(dx) > 40) doiSlide(dx < 0 ? 1 : -1);
            }}
            // Phím ← → : khung ảnh phải nhận được tiêu điểm mới bắt được phím.
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") { e.preventDefault(); doiSlide(1); }
              if (e.key === "ArrowLeft") { e.preventDefault(); doiSlide(-1); }
            }}
            role="group"
            aria-label="Ảnh và video của tin — vuốt ngang hoặc dùng phím mũi tên"
            className="group relative col-span-2 aspect-[16/9] touch-pan-y overflow-hidden rounded-none border border-cvr-line outline-none sm:row-span-2 sm:aspect-auto sm:h-full"
          >
            {bigIsVideo ? (
              <GallerySlideVideo url={media[bigIdx].src} active onHold={setHold} />
            ) : (
              <button type="button" onClick={() => open(imgIdx(bigIdx))} className="absolute inset-0 block h-full w-full">
                <Image key={bigIdx} src={media[bigIdx].src} alt={alt} fill priority quality={90} sizes="(max-width:1024px) 100vw, 50vw" className="object-cover animate-fadein" />
              </button>
            )}
            {demMedia}
            {!bigIsVideo && (
              <span className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-black/60 px-2.5 py-1 text-xs text-white backdrop-blur-sm">
                {imgIdx(bigIdx) + 1}/{images.length}
              </span>
            )}
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
      {videoFull && <VideoToanManHinh url={videoFull} onClose={() => setVideoFull(null)} />}
    </>
  );
}
