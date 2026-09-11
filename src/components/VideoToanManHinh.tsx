"use client";

import { useEffect, useRef, useState } from "react";
import { asset } from "@/lib/asset";
import { videoEmbedUrl } from "@/lib/media";

// ════════════════════════════════════════════════════════════════════════════
// XEM VIDEO LỚN — ĐÚNG HAI NÚT, ĐÈ THẲNG LÊN VIDEO.
//
//   [Xoay]                                   [⛶ thu nhỏ]
//
// Bấm nút nào cũng đảo lại được: Xoay → xoay về, ⛶ → thoát. Nút ⛶ nằm ĐÚNG chỗ
// nút phóng to ở khung nhỏ, bấm một chỗ mở, bấm lại chỗ đó đóng.
//
// Video NGẮN (dưới 1 phút): hai nút nằm nguyên đó. Video DÀI: nút lùi đi sau vài
// giây cho khỏi che hình, chạm một cái là hiện lại. KHÔNG mượn chế độ toàn màn
// hình của trình duyệt — nút của nó tự ẩn theo kiểu riêng từng máy, khách tìm
// không ra lối thoát (chủ dự án báo 11/9/2026).
//
// Play · tua · âm lượng vẫn là thanh gốc của trình phát nằm sát đáy.
// ════════════════════════════════════════════════════════════════════════════

export default function VideoToanManHinh({
  url,
  onClose,
  batDau = 0,
}: {
  url: string;
  /** Đóng lại — trả về giây đang xem dở để khung nhỏ xem tiếp đúng chỗ. */
  onClose: (giayDangXem?: number) => void;
  /** Giây đang xem dở ở khung nhỏ — mở lớn là xem tiếp, không tua lại từ đầu. */
  batDau?: number;
}) {
  const embed = videoEmbedUrl(url);
  const [xoay, setXoay] = useState(false);
  const vRef = useRef<HTMLVideoElement>(null);
  // Đóng lại thì báo về đang xem tới giây nào — khung nhỏ tua đúng chỗ đó, khách
  // không phải dò lại từ đầu.
  const dong = () => onClose(vRef.current?.currentTime);

  // VIDEO NGẮN: hai nút nằm nguyên đó. VIDEO DÀI (hơn 1 phút): xem được vài giây
  // thì nút lùi đi cho khỏi che hình, CHẠM một cái là hiện lại ngay.
  const [hienNut, setHienNut] = useState(true);
  const [dai, setDai] = useState(0);
  const henRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const danhThuc = () => {
    setHienNut(true);
    if (henRef.current) clearTimeout(henRef.current);
    if (dai > 60) henRef.current = setTimeout(() => setHienNut(false), 3500);
  };

  useEffect(() => {
    if (dai <= 60) return; // video ngắn thì để yên, không ẩn
    henRef.current = setTimeout(() => setHienNut(false), 3500);
    return () => {
      if (henRef.current) clearTimeout(henRef.current);
    };
  }, [dai]);

  useEffect(() => {
    const cuonCu = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dong();
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
    <div className="fixed inset-0 z-[100] bg-black" onPointerDown={danhThuc}>
      {/* HAI NÚT ĐÈ THẲNG LÊN VIDEO, LUÔN HIỆN — không tự ẩn như nút của trình
          duyệt. Nút thu nhỏ đặt ĐÚNG GÓC TRÊN PHẢI, cùng chỗ với nút phóng to ở
          khung nhỏ: bấm một chỗ để mở, bấm lại chính chỗ đó để thoát. Nút Xoay
          bấm lại thì xoay về. Chỉ hai nút này, không hơn. */}
      <div
        className={`absolute inset-x-0 top-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent px-1 pb-8 pt-[max(6px,env(safe-area-inset-top))] transition-opacity duration-200 ${hienNut ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
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
        <button type="button" onClick={dong} className={nut} aria-label="Thoát toàn màn hình">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
          </svg>
        </button>
      </div>

      {/* VIDEO — lấp trọn màn. Khi xoay thì tách khỏi luồng và quay 90° quanh tâm
          màn, nhờ vậy video ngang phủ kín màn dọc. */}
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
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
              ref={vRef}
              src={asset(url)}
              autoPlay
              controls
              playsInline
              controlsList="nodownload noplaybackrate nofullscreen"
              disablePictureInPicture
              onLoadedMetadata={(e) => {
                if (batDau > 0) e.currentTarget.currentTime = batDau;
                setDai(e.currentTarget.duration || 0);
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
