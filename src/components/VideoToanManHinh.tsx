"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { asset } from "@/lib/asset";
import { videoEmbedUrl } from "@/lib/media";

// ════════════════════════════════════════════════════════════════════════════
// XEM VIDEO — BỐN NÚT, KHÁCH TỰ QUYẾT, LÚC NÀO CŨNG THOÁT ĐƯỢC.
//
//   ✕ Đóng           — rời trình xem, về lại tin
//   ⟳ Xoay           — xoay ngang / dọc theo ý khách (KHÔNG tự ép)
//   ⛶ Toàn màn hình  — và bấm lại để thoát toàn màn hình
//
// Bản trước sai ở chỗ tự khoá xoay ngang bằng screen.orientation.lock() và phủ
// một lớp chặn hết cú chạm, nên khách bị bẻ ngang màn hình mà không thoát ra
// được (chủ dự án báo 11/9/2026). Nay web KHÔNG tự làm gì cả — mọi thứ do khách
// bấm.
//
// Xoay bằng CSS (xoay chính khung video 90°) chứ không gọi API khoá hướng: API
// đó iPhone không cho, Android thì chỉ chạy khi đang toàn màn hình, và nó bẻ cả
// màn hình máy. Xoay bằng CSS thì máy nào cũng chạy, và mọi nút nằm TRONG khung
// nên xoay theo luôn — khách cầm ngang vẫn đọc được chữ, vẫn bấm đúng chỗ.
//
// Ngoài nút còn ba lối thoát quen tay: vuốt xuống, phím Esc, nút Back của máy.
// ════════════════════════════════════════════════════════════════════════════

export default function VideoToanManHinh({ url, onClose }: { url: string; onClose: () => void }) {
  const embed = videoEmbedUrl(url);
  const [xoay, setXoay] = useState(false);
  const [dangFull, setDangFull] = useState(false);
  const [keoY, setKeoY] = useState(0);
  const batDau = useRef<number | null>(null);
  const boc = useRef<HTMLDivElement>(null);
  const theVideo = useRef<HTMLVideoElement>(null);

  const dongRef = useRef(onClose);
  useEffect(() => {
    dongRef.current = onClose;
  });

  useEffect(() => {
    const cuonCu = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dongRef.current();
    };
    document.addEventListener("keydown", onKey);

    const theoDoiFull = () => setDangFull(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", theoDoiFull);

    // Nút Back phải đóng video chứ không rời trang tin.
    history.pushState({ videoCVR: true }, "");
    const onPop = () => dongRef.current();
    window.addEventListener("popstate", onPop);

    return () => {
      document.body.style.overflow = cuonCu;
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", theoDoiFull);
      window.removeEventListener("popstate", onPop);
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
      if (history.state?.videoCVR) history.back();
    };
  }, []);

  const doiToanManHinh = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {});
      return;
    }
    // iPhone không cho phần tử thường vào toàn màn hình, nhưng thẻ <video> thì
    // có API riêng — dùng được thì dùng, không thì thôi (trình xem vốn đã chiếm
    // trọn màn hình rồi, không mất gì).
    const v = theVideo.current as unknown as { webkitEnterFullscreen?: () => void } | null;
    if (boc.current?.requestFullscreen) void boc.current.requestFullscreen().catch(() => {});
    else v?.webkitEnterFullscreen?.();
  }, []);

  const chamDau = (e: React.TouchEvent) => {
    batDau.current = e.touches[0].clientY;
  };
  const chamDi = (e: React.TouchEvent) => {
    if (batDau.current === null || xoay) return; // đang xoay thì vuốt dọc không còn đúng chiều
    const d = e.touches[0].clientY - batDau.current;
    if (d > 0) setKeoY(d);
  };
  const chamXong = () => {
    if (keoY > 90) onClose();
    batDau.current = null;
    setKeoY(0);
  };

  const nutCls =
    "flex h-11 items-center gap-2 rounded-full px-4 text-[15px] font-medium text-white active:bg-white/20";

  return (
    <div
      ref={boc}
      className="fixed inset-0 z-[100] overflow-hidden bg-black"
      style={{ opacity: keoY > 0 ? Math.max(0.45, 1 - keoY / 400) : 1 }}
      role="dialog"
      aria-modal="true"
      aria-label="Video của tin"
      onTouchStart={chamDau}
      onTouchMove={chamDi}
      onTouchEnd={chamXong}
    >
      {/* KHUNG XOAY — chứa cả nút lẫn video, nên xoay là xoay cả cụm. Khi xoay,
          bề ngang khung lấy theo chiều cao màn và ngược lại. */}
      <div
        className="absolute left-1/2 top-1/2 flex flex-col"
        style={{
          width: xoay ? "100vh" : "100vw",
          height: xoay ? "100vw" : "100vh",
          transform: `translate(-50%, -50%) rotate(${xoay ? 90 : 0}deg) translateY(${keoY > 0 ? Math.min(keoY, 160) : 0}px)`,
          // Đang vuốt thì khung phải bám ngón tay tức thì; thả ra mới chạy mượt
          // về chỗ cũ, và lúc xoay cũng vậy.
          transition: keoY > 0 ? undefined : "transform .25s ease",
        }}
      >
        {/* THANH NÚT — luôn nằm trên video, không bị trình phát che */}
        <div className="flex shrink-0 items-center justify-between px-1 pt-[max(6px,env(safe-area-inset-top))]">
          <button type="button" onClick={onClose} aria-label="Đóng video" className={nutCls}>
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Đóng
          </button>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setXoay((v) => !v)}
              aria-label={xoay ? "Xoay về màn dọc" : "Xoay ngang"}
              className={nutCls}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 9a8 8 0 0113.6-4.6L20 7M20 15a8 8 0 01-13.6 4.6L4 17" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 4v3h-3M4 20v-3h3" />
              </svg>
              Xoay
            </button>

            <button
              type="button"
              onClick={doiToanManHinh}
              aria-label={dangFull ? "Thoát toàn màn hình" : "Toàn màn hình"}
              className={nutCls}
            >
              {dangFull ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
                </svg>
              )}
              {dangFull ? "Thu nhỏ" : "Toàn màn"}
            </button>
          </div>
        </div>

        {/* Chạm vùng nền quanh video cũng đóng */}
        <div className="flex flex-1 items-center justify-center overflow-hidden" onClick={onClose}>
          <div className="w-full" onClick={(e) => e.stopPropagation()}>
            {embed ? (
              <div className="relative w-full pt-[56.25%]">
                <iframe
                  src={`${embed}${embed.includes("?") ? "&" : "?"}autoplay=1&playsinline=1`}
                  title="Video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full"
                />
              </div>
            ) : (
              <video
                ref={theVideo}
                src={asset(url)}
                autoPlay
                controls
                playsInline
                className="max-h-full w-full bg-black object-contain"
              >
                Trình duyệt không hỗ trợ phát video.
              </video>
            )}
          </div>
        </div>

        {!xoay && (
          <p className="shrink-0 pb-[max(8px,env(safe-area-inset-bottom))] text-center text-[12px] text-white/45">
            Vuốt xuống để đóng
          </p>
        )}
      </div>
    </div>
  );
}
