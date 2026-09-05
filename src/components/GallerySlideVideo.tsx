"use client";

import { useEffect, useRef, useState } from "react";
import { asset } from "@/lib/asset";
import { videoEmbedUrl, videoPosterUrl } from "@/lib/media";
import { khoaCuon } from "@/lib/khoaCuon";

// VIDEO NẰM TRONG THƯ VIỆN ẢNH — coi như MỘT TẤM HÌNH của tin:
//   · lấp đầy đúng khung ảnh (object-contain trên nền đen) → không bao giờ to quá khung
//   · KHÔNG tự chạy: hiện sẵn KHUNG HÌNH ĐẦU (preload="metadata" + "#t=0.1") nên
//     không còn ô trắng trống; khách bấm nút play mới chạy (có tiếng).
//   · Đang xem thì thư viện NGƯNG tự chuyển slide (onHold), xem xong chạy tiếp.
//
// PHÓNG TO / THU NHỎ — LÀM BẰNG LỚP PHỦ CỦA CHÍNH WEB, KHÔNG dùng chế độ full màn
// hình của trình duyệt. Lý do: khi trình duyệt phóng to, nó phóng THẲNG THẺ VIDEO
// nên mọi nút mình vẽ đều bị nuốt mất, khách phóng lên rồi không có đường thu lại.
// Làm bằng lớp phủ thì nút "THU NHỎ" luôn nằm góc phải trên, không bao giờ tự ẩn,
// bấm ra vùng nền đen hoặc phím Esc cũng thu lại được.
export default function GallerySlideVideo({
  url,
  active,
  onHold,
}: {
  url: string;
  active: boolean;                 // đang là slide hiện tại
  onHold?: (giu: boolean) => void; // đang xem / đang phóng to → giữ slide, đừng tự chuyển
}) {
  const embed = videoEmbedUrl(url);
  const poster = videoPosterUrl(url);
  const ref = useRef<HTMLVideoElement>(null);
  const [to, setTo] = useState(false);     // đang phóng to (lớp phủ toàn màn hình)
  const [chay, setChay] = useState(false); // đã bấm play (dùng cho YouTube/Vimeo)
  const [posterSrc, setPosterSrc] = useState(poster?.hd ?? "");
  const holdRef = useRef(onHold);
  const playingRef = useRef(false);
  const toRef = useRef(false);

  useEffect(() => {
    holdRef.current = onHold;
  });
  const bao = () => holdRef.current?.(playingRef.current || toRef.current);
  const datTo = (v: boolean) => {
    toRef.current = v;
    setTo(v);
    bao();
  };

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

  // Đang phóng to: khoá cuộn trang nền + phím Esc để thu nhỏ.
  useEffect(() => {
    if (!to) return;
    const nha = khoaCuon();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") datTo(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      nha();
    };
  }, [to]);

  // Gỡ khỏi trang → nhả quyền giữ slide.
  useEffect(() => () => holdRef.current?.(false), []);

  const video = embed ? (
    // YouTube/Vimeo — KHÔNG tự chạy (chủ dự án chốt 5/9). Slide video trôi qua như
    // một tấm ảnh: hiện KHUNG HÌNH THẬT + nút play, khách bấm mới phát (có tiếng).
    chay ? (
      <>
        <iframe
          src={`${embed}${embed.includes("?") ? "&" : "?"}autoplay=1`}
          title="Video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          className="h-full w-full bg-black"
        />
      </>
    ) : (
      <button
        type="button"
        onClick={() => {
          setChay(true);
          playingRef.current = true;
          bao();
        }}
        aria-label="Phát video"
        className="relative flex h-full w-full items-center justify-center bg-black"
      >
        {/* KHUNG HÌNH CHỜ — không để ô đen trơn. Ảnh lấy thẳng từ YouTube nên không
            tốn dung lượng kho của mình; maxres thiếu thì lùi về hq. */}
        {poster && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={posterSrc}
            alt=""
            onError={() => setPosterSrc(poster.thuong)}
            className="absolute inset-0 h-full w-full object-contain"
          />
        )}
        <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg transition hover:scale-105">
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
  );

  // Nút PHÓNG TO ↔ THU NHỎ — một cặp, luôn ở góc phải trên, không bao giờ tự ẩn.
  const nut = (
    <button
      type="button"
      onClick={() => datTo(!to)}
      className={`absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-md bg-black/70 font-medium text-white ring-1 ring-white/25 backdrop-blur-sm transition hover:bg-black/90 active:bg-black/90 ${
        to ? "px-4 py-2.5 text-[15px]" : "px-2.5 py-1.5 text-[13px]"
      }`}
    >
      {to ? (
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
  );

  // Phóng to = đổi khung chứa từ "trong thư viện ảnh" thành "phủ kín màn hình".
  // Vẫn CÙNG một thẻ video (chỉ đổi lớp CSS) nên đang xem tới đâu giữ nguyên tới
  // đó, không bị tua lại từ đầu.
  return (
    <div className={to ? "fixed inset-0 z-[120] bg-black" : "absolute inset-0 bg-black"}>
      {video}
      {nut}
    </div>
  );
}
