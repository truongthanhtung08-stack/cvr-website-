"use client";

import { useEffect, useRef, useState } from "react";
import { asset } from "@/lib/asset";
import { videoEmbedUrl, videoPosterUrl } from "@/lib/media";
import VideoToanManHinh from "@/components/VideoToanManHinh";

// ════════════════════════════════════════════════════════════════════════════
// VIDEO TRONG THƯ VIỆN ẢNH — PHÁT TẠI CHỖ, DÙNG NÚT GỐC CỦA TRÌNH PHÁT.
//
// Luồng chuẩn (chủ dự án chốt 11/9/2026):
//   bấm play → chạy ngay trong khung ảnh
//   bấm nút toàn màn hình của trình phát → phóng to
//   thoát toàn màn hình → thu về đúng khung ảnh, vẫn đang chạy
//
// TẤT CẢ ĐIỀU KHIỂN LÀ NÚT CỦA TRÌNH PHÁT: play, tua, âm lượng, TOÀN MÀN HÌNH.
// Web KHÔNG vẽ nút nào và KHÔNG đè bất cứ thứ gì lên khung video — đã thử vẽ
// thêm nút mấy lần, lần nào cũng thành ra chặn mất cú chạm của khách khiến nút
// gốc bấm không lên. Xoay: vào toàn màn hình rồi xoay máy, trình phát tự lo.
//
// XOAY: khách vào toàn màn hình rồi xoay máy — trình phát tự xoay theo. Web
// TUYỆT ĐỐI không khoá hướng màn hình như bản cũ từng làm.
//
// Đang xem thì thư viện NGƯNG tự chuyển slide (onHold), xem xong chạy tiếp.
// ════════════════════════════════════════════════════════════════════════════
export default function GallerySlideVideo({
  url,
  active,
  onHold,
  onTyLe,
  xemTruoc = false,
}: {
  url: string;
  active: boolean;                 // đang là slide hiện tại
  onHold?: (giu: boolean) => void; // đang xem / đang toàn màn hình → giữ slide, đừng tự chuyển
  /** Báo về tỉ lệ thật của video (rộng ÷ cao) để thư viện chỉnh khung cho vừa. */
  onTyLe?: (tyLe: number) => void;
  /** Chỉ làm ảnh bìa (ô nhỏ trong dãy chọn): bỏ thanh điều khiển, không bắt chạm. */
  xemTruoc?: boolean;
}) {
  const embed = videoEmbedUrl(url);
  const poster = videoPosterUrl(url);
  const ref = useRef<HTMLVideoElement>(null);
  const khungRef = useRef<HTMLIFrameElement>(null);
  const [posterSrc, setPosterSrc] = useState(poster?.hd ?? "");
  // Bấm nút phóng to → mở trình xem riêng của web (nút Thoát và Xoay luôn hiện).
  const [xemFull, setXemFull] = useState(false);
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
  const bao = () =>
    holdRef.current?.(playingRef.current || fullRef.current || dungVaoRef.current);

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
      // Dẹp bớt nút thừa trên thanh điều khiển: bỏ nút tải về và nút đổi tốc độ
      // phát, bỏ nút thu nhỏ góc màn. Còn lại đúng những nút khách cần — play,
      // tua, âm lượng, toàn màn hình.
      controlsList="nodownload noplaybackrate nofullscreen"
      disablePictureInPicture
      muted={xemTruoc}
      preload="metadata"
      // Biết video quay dọc hay ngang ngay khi tải xong phần mô tả, để thư viện
      // chỉnh khung cho vừa — khách quay bằng điện thoại là video dọc.
      onLoadedMetadata={(e) => {
        const v = e.currentTarget;
        if (v.videoWidth > 0 && v.videoHeight > 0) onTyLe?.(v.videoWidth / v.videoHeight);
      }}
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

  // Trong khung: thanh play/tua/âm lượng là của trình phát, nằm sát ĐÁY.
  // Nút phóng to của web đặt ở GÓC TRÊN PHẢI — hai bên không bao giờ chồng nhau.
  return (
    <div className={`absolute inset-0 bg-black ${xemTruoc ? "pointer-events-none" : ""}`}>
      {video}

      {!xemTruoc && active && (
        <button
          type="button"
          onClick={() => setXemFull(true)}
          aria-label="Xem toàn màn hình"
          className="absolute right-2 top-2 z-[6] flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm active:bg-black/75"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
          </svg>
        </button>
      )}

      {xemFull && <VideoToanManHinh url={url} onClose={() => setXemFull(false)} />}
    </div>
  );
}
