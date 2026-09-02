"use client";

import { useEffect, useRef, useState } from "react";
import { asset } from "@/lib/asset";
import { videoEmbedUrl } from "@/lib/media";

// VIDEO NẰM TRONG THƯ VIỆN ẢNH — coi như MỘT TẤM HÌNH của tin:
//   · lấp đầy đúng khung ảnh (object-contain trên nền đen) → không bao giờ to quá khung
//   · KHÔNG tự chạy: hiện sẵn KHUNG HÌNH ĐẦU (preload="metadata" + "#t=0.1") nên
//     không còn ô trắng trống; khách bấm nút play mới chạy (có tiếng).
//   · Đang xem thì thư viện NGƯNG tự chuyển slide (onHold), xem xong chạy tiếp.
//   · PHÓNG TO ↔ THU NHỎ đi thành một cặp: nút của chính mình luôn hiện ở góc phải
//     trên, kể cả khi đang full màn hình (nút của trình duyệt tự ẩn, bấm phóng xong
//     không biết đường thu lại). Phím Esc vẫn thoát được như thường.
export default function GallerySlideVideo({
  url,
  active,
  onHold,
}: {
  url: string;
  active: boolean;                 // đang là slide hiện tại
  onHold?: (giu: boolean) => void; // đang xem / phóng to → giữ slide, đừng tự chuyển
}) {
  const embed = videoEmbedUrl(url);
  const wrapRef = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLVideoElement>(null);
  const [fs, setFs] = useState(false);       // đang phóng to toàn màn hình
  const [chay, setChay] = useState(false);   // đã bấm play (dùng cho YouTube/Vimeo)
  const holdRef = useRef(onHold);
  const playingRef = useRef(false);
  const fsRef = useRef(false);

  useEffect(() => {
    holdRef.current = onHold;
  });
  const bao = () => holdRef.current?.(playingRef.current || fsRef.current);

  // Rời slide → về lại trạng thái "chưa bấm play" (chỉnh state ngay trong lượt vẽ,
  // đúng cách React khuyên khi state phải theo prop).
  const [truoc, setTruoc] = useState(active);
  if (truoc !== active) {
    setTruoc(active);
    if (!active) setChay(false);
  }

  // Rời slide → dừng video, trả quyền tự chạy slide lại cho thư viện.
  useEffect(() => {
    if (active) return;
    const v = ref.current;
    if (v) {
      v.pause();
      v.currentTime = 0;
    }
    playingRef.current = false;
    bao();
  }, [active]);

  // Theo dõi phóng to / thu nhỏ để đổi nút và để thư viện ngừng chuyển slide.
  useEffect(() => {
    const onFs = () => {
      const el =
        document.fullscreenElement ??
        (document as unknown as { webkitFullscreenElement?: Element | null }).webkitFullscreenElement ??
        null;
      const on = !!el && (el === wrapRef.current || el === ref.current);
      fsRef.current = on;
      setFs(on);
      bao();
    };
    document.addEventListener("fullscreenchange", onFs);
    document.addEventListener("webkitfullscreenchange", onFs);
    return () => {
      document.removeEventListener("fullscreenchange", onFs);
      document.removeEventListener("webkitfullscreenchange", onFs);
      holdRef.current?.(false);
    };
  }, []);

  const phongTo = () => {
    const el = wrapRef.current as (HTMLDivElement & { webkitRequestFullscreen?: () => void }) | null;
    const fn = el && (el.requestFullscreen ?? el.webkitRequestFullscreen);
    if (fn && el) {
      fn.call(el);
      return;
    }
    // iPhone không cho phóng to cả khung → dùng trình phát của máy (đã có nút "Xong")
    const v = ref.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
    v?.webkitEnterFullscreen?.();
  };
  const thuNho = () => {
    const d = document as Document & { webkitExitFullscreen?: () => void };
    (d.exitFullscreen ?? d.webkitExitFullscreen)?.call(d);
  };

  return (
    <div
      ref={wrapRef}
      className="absolute inset-0 bg-black [&:fullscreen]:fixed [&:fullscreen]:h-screen [&:fullscreen]:w-screen"
    >
      {embed ? (
        // YouTube/Vimeo: bấm play mới nạp iframe → trang nhẹ, và không tự chạy.
        chay ? (
          <iframe
            src={`${embed}${embed.includes("?") ? "&" : "?"}autoplay=1&playsinline=1`}
            title="Video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full bg-black"
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setChay(true);
              playingRef.current = true;
              bao();
            }}
            aria-label="Phát video"
            className="flex h-full w-full items-center justify-center bg-black"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 transition hover:scale-105">
              <svg className="ml-1 h-7 w-7 text-black" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </button>
        )
      ) : (
        <video
          ref={ref}
          src={`${asset(url)}#t=0.1`}
          playsInline
          controls
          controlsList="nofullscreen"
          preload="metadata"
          onPlay={() => {
            playingRef.current = true;
            bao();
          }}
          onPause={() => {
            playingRef.current = false;
            bao();
          }}
          onEnded={() => {
            playingRef.current = false;
            bao();
          }}
          className="h-full w-full bg-black object-contain"
        >
          Trình duyệt không hỗ trợ phát video.
        </video>
      )}

      {/* Cặp nút PHÓNG TO ↔ THU NHỎ — luôn hiện, kể cả khi đang full màn hình */}
      <button
        type="button"
        onClick={fs ? thuNho : phongTo}
        className={`absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-md bg-black/70 font-medium text-white backdrop-blur-sm transition hover:bg-black/90 active:bg-black/90 ${
          fs ? "px-4 py-2.5 text-[15px] ring-1 ring-white/30" : "px-2.5 py-1.5 text-[13px]"
        }`}
      >
        {fs ? (
          <>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20v-5H4m11 5v-5h5M9 4v5H4m11-5v5h5" />
            </svg>
            Thu nhỏ
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 9V4h5M20 9V4h-5M4 15v5h5m11-5v5h-5" />
            </svg>
            Phóng to
          </>
        )}
      </button>
    </div>
  );
}
