"use client";

import { useEffect, useState } from "react";
import { asset } from "@/lib/asset";
import { videoEmbedUrl } from "@/lib/media";

// ════════════════════════════════════════════════════════════════════════════
// XEM VIDEO LỚN — THANH NÚT LUÔN NẰM ĐÓ, KHÔNG TỰ ẨN.
//
// Chế độ toàn màn hình của trình duyệt giấu hết nút sau vài giây; video tin BĐS
// chỉ dài một hai phút nên chẳng có lý do gì phải giấu, mà giấu rồi khách tìm
// không ra nút xoay lẫn nút thoát (chủ dự án báo 11/9/2026). Ở đây web tự dựng:
//   [Thoát]                    [Xoay]
// hai nút này LUÔN hiện, máy nào cũng như nhau. Play · tua · âm lượng vẫn là
// thanh gốc của trình phát nằm sát đáy — không có gì đè lên nó.
// ════════════════════════════════════════════════════════════════════════════

export default function VideoToanManHinh({
  url,
  onClose,
  batDau = 0,
}: {
  url: string;
  onClose: () => void;
  /** Giây đang xem dở ở khung nhỏ — mở lớn là xem tiếp, không tua lại từ đầu. */
  batDau?: number;
}) {
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
      {/* THANH NÚT — luôn hiện, nằm trên video, z cao hơn */}
      <div className="relative z-10 flex shrink-0 items-center justify-between px-1 pt-[max(6px,env(safe-area-inset-top))]">
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

      {/* VIDEO — lấp đầy phần màn còn lại. Khi xoay thì tách khỏi luồng và quay
          90° quanh tâm màn, nhờ vậy video ngang phủ trọn màn dọc. */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden">
        <div
          className="flex h-full w-full items-center justify-center transition-transform duration-200"
          style={
            xoay
              ? {
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: "100vh",
                  height: "100vw",
                  transform: "translate(-50%, -50%) rotate(90deg)",
                }
              : undefined
          }
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
              onLoadedMetadata={(e) => {
                if (batDau > 0) e.currentTarget.currentTime = batDau;
              }}
              className="h-full w-full object-contain"
            >
              Trình duyệt không hỗ trợ phát video.
            </video>
          )}
        </div>
      </div>
    </div>
  );
}
