"use client";

import { useEffect, useRef, useState } from "react";
import { asset } from "@/lib/asset";
import { videoEmbedUrl, videoPosterUrl } from "@/lib/media";

// VIDEO NẰM TRONG THƯ VIỆN ẢNH — coi như MỘT TẤM HÌNH của tin:
//   · lấp đầy đúng khung ảnh (object-contain trên nền đen) → không bao giờ to quá khung
//   · KHÔNG tự chạy: hiện sẵn KHUNG HÌNH ĐẦU (preload="metadata" + "#t=0.1") nên
//     không còn ô trắng trống; khách bấm nút play mới chạy (có tiếng).
//   · Đang xem thì thư viện NGƯNG tự chuyển slide (onHold), xem xong chạy tiếp.
//
// TOÀN MÀN HÌNH = NÚT MẶC ĐỊNH CỦA TRÌNH PHÁT (chủ dự án chốt trong file yêu cầu).
// Trước đây web tự vẽ nút "Phóng to/Thu nhỏ" và CHẶN nút toàn màn hình của trình
// duyệt (controlsList="nofullscreen"). Làm vậy trông không chuyên nghiệp và khác
// hẳn thói quen của khách. Nay trả lại đúng bộ nút gốc: bấm toàn màn hình là
// trình phát của máy lo — thoát cũng bằng nút của nó, giống YouTube, giống mọi
// ứng dụng khác.
//
// XOAY MÀN HÌNH: web KHÔNG can thiệp. Khách xoay ngang thì video ngang, cầm dọc
// thì xem dọc — trình phát của máy lo. Đừng bao giờ khoá hướng màn hình.
export default function GallerySlideVideo({
  url,
  active,
  onHold,
  xemTruoc = false,
}: {
  url: string;
  active: boolean;                 // đang là slide hiện tại
  onHold?: (giu: boolean) => void; // đang xem / đang toàn màn hình → giữ slide, đừng tự chuyển
  // Chỉ làm ảnh bìa: bỏ thanh điều khiển, không bắt chạm (bấm cả khung sẽ mở
  // trình xem toàn màn hình — xem Gallery.tsx).
  xemTruoc?: boolean;
}) {
  const embed = videoEmbedUrl(url);
  const poster = videoPosterUrl(url);
  const ref = useRef<HTMLVideoElement>(null);
  const [chay, setChay] = useState(false); // đã bấm play (dùng cho YouTube/Vimeo)
  const [posterSrc, setPosterSrc] = useState(poster?.hd ?? "");
  const holdRef = useRef(onHold);
  const playingRef = useRef(false);
  const fullRef = useRef(false);

  useEffect(() => {
    holdRef.current = onHold;
  });
  const bao = () => holdRef.current?.(playingRef.current || fullRef.current);

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

  // TOÀN MÀN HÌNH: chỉ để giữ slide đứng yên trong lúc khách đang xem.
  //
  // KHÔNG khoá hướng màn hình. Bản trước gọi orientation.lock("landscape") nên
  // khách cầm dọc cũng bị bẻ ngang, xoay lại không được — rất khó chịu (chủ dự
  // án báo 11/9/2026). Xoay ngang hay dọc là quyền của người cầm điện thoại.
  useEffect(() => {
    const doiToanManHinh = () => {
      fullRef.current =
        !!document.fullscreenElement ||
        !!(document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement;
      bao();
    };

    document.addEventListener("fullscreenchange", doiToanManHinh);
    document.addEventListener("webkitfullscreenchange", doiToanManHinh);
    // iPhone: thẻ video bắn sự kiện riêng, không bắn fullscreenchange.
    const v = ref.current;
    v?.addEventListener("webkitbeginfullscreen", doiToanManHinh);
    v?.addEventListener("webkitendfullscreen", doiToanManHinh);
    return () => {
      document.removeEventListener("fullscreenchange", doiToanManHinh);
      document.removeEventListener("webkitfullscreenchange", doiToanManHinh);
      v?.removeEventListener("webkitbeginfullscreen", doiToanManHinh);
      v?.removeEventListener("webkitendfullscreen", doiToanManHinh);
    };
  }, []);

  // Gỡ khỏi trang → nhả quyền giữ slide.
  useEffect(() => () => holdRef.current?.(false), []);

  const video = embed ? (
    // YouTube/Vimeo — KHÔNG tự chạy (chủ dự án chốt 5/9). Slide video trôi qua như
    // một tấm ảnh: hiện KHUNG HÌNH THẬT + nút play, khách bấm mới phát (có tiếng).
    chay ? (
      <iframe
        src={`${embed}${embed.includes("?") ? "&" : "?"}autoplay=1`}
        title="Video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        // allowFullScreen: thiếu thuộc tính này thì nút toàn màn hình CỦA YOUTUBE
        // bấm không lên — khách tưởng web hỏng.
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
      controls={!xemTruoc}
      muted={xemTruoc}
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

  return <div className={`absolute inset-0 bg-black ${xemTruoc ? "pointer-events-none" : ""}`}>{video}</div>;
}
