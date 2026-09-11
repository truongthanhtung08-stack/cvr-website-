"use client";

import { useEffect, useRef, useState } from "react";
import { asset } from "@/lib/asset";
import { videoEmbedUrl, videoPosterUrl } from "@/lib/media";

// ════════════════════════════════════════════════════════════════════════════
// VIDEO TRONG THƯ VIỆN ẢNH — PHÁT TẠI CHỖ, DÙNG NÚT GỐC CỦA TRÌNH PHÁT.
//
// Luồng chuẩn (chủ dự án chốt 11/9/2026):
//   bấm play → chạy ngay trong khung ảnh
//   bấm nút toàn màn hình của trình phát → phóng to
//   thoát toàn màn hình → thu về đúng khung ảnh, vẫn đang chạy
//
// PLAY, TUA, ÂM LƯỢNG: nút GỐC của trình phát, không vẽ lại — khách đã quen tay.
// TOÀN MÀN HÌNH + XOAY: web tự lo, đặt hai nút ở GÓC TRÊN PHẢI. Trình phát chỉ có
// nút toàn màn hình của riêng nó (nằm sát đáy, dễ lẫn với thanh điều khiển) và
// KHÔNG trình phát nào có nút xoay — nên hai nút này là cần, không phải vẽ thừa.
//
// XOAY LÀ TUỲ CHỌN CỦA KHÁCH: bấm nút thì video quay ngang, bấm lại thì về dọc.
// TUYỆT ĐỐI không tự khoá hướng màn hình của máy như bản cũ từng làm.
//
// Đang xem thì thư viện NGƯNG tự chuyển slide (onHold), xem xong chạy tiếp.
// ════════════════════════════════════════════════════════════════════════════
export default function GallerySlideVideo({
  url,
  active,
  onHold,
  xemTruoc = false,
}: {
  url: string;
  active: boolean;                 // đang là slide hiện tại
  onHold?: (giu: boolean) => void; // đang xem / đang toàn màn hình → giữ slide, đừng tự chuyển
  /** Chỉ làm ảnh bìa (ô nhỏ trong dãy chọn): bỏ thanh điều khiển, không bắt chạm. */
  xemTruoc?: boolean;
}) {
  const embed = videoEmbedUrl(url);
  const poster = videoPosterUrl(url);
  const ref = useRef<HTMLVideoElement>(null);
  const khungRef = useRef<HTMLIFrameElement>(null);
  const [posterSrc, setPosterSrc] = useState(poster?.hd ?? "");
  const holdRef = useRef(onHold);
  const playingRef = useRef(false);
  const fullRef = useRef(false);

  useEffect(() => {
    holdRef.current = onHold;
  });
  // KHÁCH ĐÃ ĐỘNG VÀO VIDEO THÌ SLIDE ĐỨNG YÊN, CHƯA ĐỘNG THÌ VẪN TRÔI.
  //
  // Đứng yên vĩnh viễn ở slide video cũng sai: khách mở tin ra, chưa muốn xem
  // video, mà thư viện không bao giờ trôi sang ảnh thì tưởng web đứng máy.
  // Nên: chưa bấm gì → slide trôi bình thường (chỉ chậm hơn một nhịp); đã bấm
  // play → giữ nguyên tới khi khách tự vuốt đi.
  const dungVaoRef = useRef(false);
  const bocRef = useRef<HTMLDivElement>(null);
  const [dangFull, setDangFull] = useState(false);
  const [xoay, setXoay] = useState(false);
  const bao = () =>
    holdRef.current?.(playingRef.current || fullRef.current || dungVaoRef.current);

  // TOÀN MÀN HÌNH + XOAY — hai việc trình phát KHÔNG làm được nên web phải lo:
  // trình phát chỉ có nút toàn màn hình của riêng nó (YouTube ở trong iframe, thẻ
  // video ở thanh dưới), và KHÔNG trình phát nào có nút xoay. Hai nút này đặt ở
  // GÓC TRÊN PHẢI, tránh xa thanh điều khiển nằm sát đáy.
  const doiFull = () => {
    const dangCo =
      !!document.fullscreenElement ||
      !!(document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement;
    if (dangCo) {
      void document.exitFullscreen?.().catch(() => {});
      return;
    }
    // iPhone không cho phần tử thường vào toàn màn hình, nhưng thẻ <video> có API
    // riêng — dùng được thì dùng.
    const v = ref.current as unknown as { webkitEnterFullscreen?: () => void } | null;
    if (bocRef.current?.requestFullscreen) void bocRef.current.requestFullscreen().catch(() => {});
    else v?.webkitEnterFullscreen?.();
  };

  // Xoay = xem ngang. Chưa toàn màn hình thì vào toàn màn hình trước, vì xoay
  // trong khung nhỏ 16:9 thì video thò ra ngoài, nhìn rất kỳ.
  const doiXoay = () => {
    if (!dangFull) {
      doiFull();
      setXoay(true);
      return;
    }
    setXoay((v) => !v);
  };

  // YouTube/Vimeo không báo cho mình biết khách đã bấm play hay chưa. Mẹo chuẩn:
  // khi khách chạm vào iframe, tiêu điểm nhảy vào chính iframe đó — bắt được là
  // biết khách đang xem.
  useEffect(() => {
    if (!embed || !active) return;
    const nhinTieuDiem = () => {
      if (document.activeElement === khungRef.current) {
        dungVaoRef.current = true;
        bao();
      }
    };
    window.addEventListener("blur", nhinTieuDiem);
    return () => window.removeEventListener("blur", nhinTieuDiem);
  }, [embed, active]);

  // Rời slide → dừng hẳn video tự đăng, trả quyền tự chạy lại cho thư viện.
  useEffect(() => {
    if (!active) {
      const v = ref.current;
      if (v) {
        v.pause();
        v.currentTime = 0;
      }
      playingRef.current = false;
      dungVaoRef.current = false;
    }
    holdRef.current?.(playingRef.current || fullRef.current || dungVaoRef.current);
  }, [active]);

  // TOÀN MÀN HÌNH: chỉ để giữ slide đứng yên trong lúc khách đang xem.
  //
  // KHÔNG khoá hướng màn hình. Bản trước gọi orientation.lock("landscape") nên
  // khách cầm dọc cũng bị bẻ ngang, xoay lại không được — rất khó chịu (chủ dự
  // án báo 11/9/2026). Xoay ngang hay dọc là quyền của người cầm điện thoại.
  useEffect(() => {
    const doiToanManHinh = () => {
      const co =
        !!document.fullscreenElement ||
        !!(document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement;
      fullRef.current = co;
      setDangFull(co);
      if (!co) setXoay(false); // thoát toàn màn hình thì trả video về chiều gốc
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
    // YouTube/Vimeo — tới lượt slide này thì nạp thẳng trình phát của họ để có
    // nút play, tua, âm lượng gốc. Slide chưa tới lượt thì chỉ hiện khung hình
    // chờ, không nạp iframe cho nhẹ trang.
    active ? (
      <iframe
        ref={khungRef}
        src={embed}
        title="Video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        // allowFullScreen: thiếu thuộc tính này thì nút toàn màn hình CỦA YOUTUBE
        // bấm không lên — khách tưởng web hỏng.
        allowFullScreen
        className="h-full w-full bg-black"
      />
    ) : (
      <div className="relative flex h-full w-full items-center justify-center bg-black">
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
      </div>
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

  const nutCls =
    "flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm active:bg-black/70";

  return (
    <div
      ref={bocRef}
      className={`absolute inset-0 flex items-center justify-center bg-black ${xemTruoc ? "pointer-events-none" : ""}`}
    >
      {/* Khi xoay: bề ngang khung lấy theo chiều cao màn và ngược lại, rồi quay
          90° — cách này chạy trên mọi máy, kể cả iPhone (nơi API khoá hướng màn
          hình không dùng được). */}
      <div
        className="relative h-full w-full transition-transform duration-200"
        style={xoay ? { width: "100vh", height: "100vw", transform: "rotate(90deg)" } : undefined}
      >
        {video}
      </div>

      {!xemTruoc && active && (
        <div className="absolute right-2 top-2 z-[6] flex gap-1.5">
          <button type="button" onClick={doiXoay} aria-label={xoay ? "Xoay về chiều dọc" : "Xoay ngang"} className={nutCls}>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 9a8 8 0 0113.6-4.6L20 7M20 15a8 8 0 01-13.6 4.6L4 17" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 4v3h-3M4 20v-3h3" />
            </svg>
          </button>
          <button
            type="button"
            onClick={doiFull}
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
          </button>
        </div>
      )}
    </div>
  );
}
