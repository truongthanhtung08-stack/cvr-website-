"use client";

import { useEffect, useState } from "react";
import { asset } from "@/lib/asset";
import { videoEmbedUrl } from "@/lib/media";

// ════════════════════════════════════════════════════════════════════════════
// XEM VIDEO TOÀN MÀN HÌNH — BỐN VIỆC, KHÔNG HƠN:
//   mở · toàn màn hình · xoay · thoát
//
// Tự dựng chứ không mượn chế độ toàn màn hình của trình duyệt, vì mỗi trình
// duyệt vẽ một kiểu nút thoát, lại tự ẩn sau vài giây — khách tìm không ra thì
// thấy như bị nhốt. Ở đây nút Thoát và nút Xoay LUÔN nằm trên thanh trên cùng,
// không bao giờ tự ẩn, máy nào cũng như nhau.
//
// Bố cục: thanh nút ở TRÊN, video ở DƯỚI. Hai vùng tách bạch, không có lớp nào
// phủ lên video → thanh play/tua/âm lượng của trình phát bấm vẫn trúng.
// ════════════════════════════════════════════════════════════════════════════

export default function VideoToanManHinh({ url, onClose }: { url: string; onClose: () => void }) {
  const embed = videoEmbedUrl(url);
  const [xoay, setXoay] = useState(false);

  useEffect(() => {
    const cuonCu = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = cuonCu;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const nut =
    "flex h-11 items-center gap-2 rounded-full px-4 text-[15px] font-medium text-white active:bg-white/20";

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black">
      {/* THANH NÚT — luôn hiện, không tự ẩn */}
      <div className="flex shrink-0 items-center justify-between px-1 pt-[max(6px,env(safe-area-inset-top))]">
        <button type="button" onClick={onClose} className={nut} aria-label="Thoát">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Thoát
        </button>
        <button
          type="button"
          onClick={() => setXoay((v) => !v)}
          className={nut}
          aria-label={xoay ? "Xoay về dọc" : "Xoay ngang"}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 9a8 8 0 0113.6-4.6L20 7M20 15a8 8 0 01-13.6 4.6L4 17" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 4v3h-3M4 20v-3h3" />
          </svg>
          Xoay
        </button>
      </div>

      {/* VIDEO — không có gì phủ lên */}
      <div className="flex flex-1 items-center justify-center overflow-hidden">
        <div
          className="flex w-full items-center justify-center transition-transform duration-200"
          style={xoay ? { width: "100vh", height: "100vw", transform: "rotate(90deg)" } : undefined}
        >
          {embed ? (
            <div className="relative w-full pt-[56.25%]">
              <iframe
                src={`${embed}${embed.includes("?") ? "&" : "?"}autoplay=1`}
                title="Video"
                allow="accelerometer; autoplay; encrypted-media; gyroscope; fullscreen"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            </div>
          ) : (
            <video
              src={asset(url)}
              autoPlay
              controls
              playsInline
              controlsList="nodownload noplaybackrate nofullscreen"
              disablePictureInPicture
              className="max-h-full w-full object-contain"
            >
              Trình duyệt không hỗ trợ phát video.
            </video>
          )}
        </div>
      </div>
    </div>
  );
}
