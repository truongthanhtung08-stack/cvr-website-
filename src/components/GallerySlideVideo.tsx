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
  const bocRef = useRef<HTMLDivElement>(null);
  const [dangFull, setDangFull] = useState(false);
  const [xoay, setXoay] = useState(false);
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

  // TOÀN MÀN HÌNH + NÚT XOAY.
  //
  // Khách bấm nút toàn màn hình MẶC ĐỊNH của trình phát. Trình phát phóng to
  // đúng thẻ <video>, mà bên trong thẻ đó web không đặt được gì — nên không có
  // chỗ cho nút Xoay. Cách xử: ngay khi nó phóng to, web chuyển sang phóng to
  // CẢ KHUNG BỌC; thẻ video vẫn lấp đầy màn và giữ nguyên bộ nút của nó
  // (play · tua · âm lượng · thu nhỏ để thoát), còn web có chỗ đặt đúng MỘT nút
  // Xoay ở góc trên. Bấm Xoay → ngang, bấm lại → dọc. Thoát vẫn bằng nút thu
  // nhỏ của trình phát, và thoát thì tự trả về chiều dọc.
  useEffect(() => {
    const doiToanManHinh = () => {
      const el = document.fullscreenElement;

      // Trình phát vừa phóng to riêng thẻ video → nâng lên thành cả khung bọc.
      if (el && el === ref.current && bocRef.current) {
        void document
          .exitFullscreen()
          .then(() => bocRef.current?.requestFullscreen())
          .catch(() => {});
        return;
      }

      const co =
        !!el ||
        !!(document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement;
      fullRef.current = co;
      setDangFull(co);
      if (!co) setXoay(false); // thoát toàn màn hình → trả video về chiều dọc
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
      controlsList="nodownload noplaybackrate"
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

  // Trong khung: KHÔNG nút nào của web — bấm play xem tại chỗ, muốn to thì bấm
  // nút toàn màn hình mặc định của trình phát.
  // Khi đã toàn màn hình: thêm ĐÚNG MỘT nút Xoay ở góc trên, vì không trình phát
  // nào có sẵn nút này. Thoát vẫn là nút thu nhỏ của trình phát.
  return (
    <div
      ref={bocRef}
      className={`absolute inset-0 bg-black ${xemTruoc ? "pointer-events-none" : ""} ${
        dangFull ? "flex items-center justify-center" : ""
      }`}
    >
      <div
        className={dangFull ? "flex items-center justify-center transition-transform duration-200" : "h-full w-full"}
        style={xoay ? { width: "100vh", height: "100vw", transform: "rotate(90deg)" } : undefined}
      >
        {video}
      </div>

      {dangFull && (
        <button
          type="button"
          onClick={() => setXoay((v) => !v)}
          aria-label={xoay ? "Xoay về dọc" : "Xoay ngang"}
          className="absolute right-3 top-[max(12px,env(safe-area-inset-top))] z-[6] flex h-11 items-center gap-2 rounded-full bg-black/55 px-4 text-[15px] font-medium text-white backdrop-blur-sm active:bg-black/75"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 9a8 8 0 0113.6-4.6L20 7M20 15a8 8 0 01-13.6 4.6L4 17" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 4v3h-3M4 20v-3h3" />
          </svg>
          Xoay
        </button>
      )}
    </div>
  );
}
