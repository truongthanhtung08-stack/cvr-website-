"use client";

import { useEffect, useRef } from "react";
import { asset } from "@/lib/asset";
import { videoEmbedUrl } from "@/lib/media";

// VIDEO NẰM TRONG THƯ VIỆN ẢNH — coi như MỘT TẤM HÌNH của tin:
//   · lấp đầy đúng khung ảnh (object-contain trên nền đen) → không bao giờ to quá khung
//   · tới lượt slide là TỰ CHẠY (tắt tiếng — trình duyệt chỉ cho tự chạy khi tắt tiếng)
//   · chưa tới lượt vẫn hiện HÌNH (khung hình đầu) nhờ preload="metadata" + "#t=0.1",
//     nên không còn ô trắng trống như trước.
export default function GallerySlideVideo({
  url,
  active,
  onEnded,
}: {
  url: string;
  active: boolean;   // đang là slide hiện tại → chạy; rời đi → dừng
  onEnded?: () => void; // hết video → sang ảnh kế (chỉ có với tệp tải lên)
}) {
  const embed = videoEmbedUrl(url);
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (active) {
      v.play().catch(() => {}); // bị chặn tự chạy → vẫn còn nút play, không sao
    } else {
      v.pause();
      v.currentTime = 0;
    }
  }, [active]);

  if (embed) {
    // YouTube/Vimeo: chỉ nạp iframe khi tới lượt để trang không nặng.
    const sep = embed.includes("?") ? "&" : "?";
    return active ? (
      <iframe
        src={`${embed}${sep}autoplay=1&mute=1&muted=1&playsinline=1`}
        title="Video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 h-full w-full bg-black"
      />
    ) : (
      <div className="absolute inset-0 flex items-center justify-center bg-black">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90">
          <svg className="ml-0.5 h-6 w-6 text-black" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </div>
    );
  }

  return (
    <video
      ref={ref}
      src={`${asset(url)}#t=0.1`}
      muted
      playsInline
      controls
      preload="metadata"
      onEnded={onEnded}
      className="absolute inset-0 h-full w-full bg-black object-contain"
    >
      Trình duyệt không hỗ trợ phát video.
    </video>
  );
}
