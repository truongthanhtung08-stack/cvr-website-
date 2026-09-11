"use client";

import { useEffect, useRef } from "react";
import { asset } from "@/lib/asset";
import { videoEmbedUrl } from "@/lib/media";

// Trình xem video toàn màn hình: video chiếm trọn màn, ✕ / nền / Esc để thoát,
// tự xin xoay ngang, khoá cuộn trang nền.
export default function VideoToanManHinh({ url, onClose }: { url: string; onClose: () => void }) {
  const embed = videoEmbedUrl(url);
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Khoá cuộn nền trong lúc xem
    const cuonCu = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Xin xoay ngang (Android cho, iPhone không — kệ, trình phát iOS tự xoay)
    try {
      const huong = (screen as unknown as { orientation?: { lock?: (o: string) => Promise<void>; unlock?: () => void } }).orientation;
      huong?.lock?.("landscape")?.catch(() => {});
    } catch { /* máy không cho khoá hướng — xem dọc vẫn được */ }

    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = cuonCu;
      document.removeEventListener("keydown", onKey);
      try {
        const huong = (screen as unknown as { orientation?: { unlock?: () => void } }).orientation;
        huong?.unlock?.();
      } catch { /* bỏ qua */ }
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Video của tin"
    >
      {/* Nút thoát — to, nằm trên cùng, chừa lề an toàn của máy có tai thỏ */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Đóng video"
        className="absolute right-3 top-[max(12px,env(safe-area-inset-top))] z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm active:bg-white/25"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Bấm vào chính video thì KHÔNG thoát — chỉ bấm ra nền mới thoát */}
      <div className="h-full w-full" onClick={(e) => e.stopPropagation()}>
        {embed ? (
          <iframe
            src={`${embed}${embed.includes("?") ? "&" : "?"}autoplay=1`}
            title="Video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            className="h-full w-full"
          />
        ) : (
          <video
            ref={ref}
            src={asset(url)}
            autoPlay
            controls
            playsInline
            className="h-full w-full bg-black object-contain"
          >
            Trình duyệt không hỗ trợ phát video.
          </video>
        )}
      </div>
    </div>
  );
}
