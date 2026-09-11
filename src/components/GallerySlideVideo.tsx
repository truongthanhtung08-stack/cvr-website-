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
// KHÔNG VẼ THÊM NÚT NÀO. Play, toàn màn hình, âm lượng, tua — tất cả là nút gốc
// của trình phát, khách đã quen tay ở YouTube và mọi ứng dụng khác. Web từng tự
// vẽ nút "Phóng to/Thu nhỏ", rồi cả một trình xem riêng có nút Đóng/Xoay — đều
// đã bỏ: tự vẽ thì vừa xấu vừa dễ kẹt, mà không thêm được gì.
//
// XOAY MÀN HÌNH: web KHÔNG can thiệp. Khách xoay ngang thì video ngang, cầm dọc
// thì xem dọc. Đừng bao giờ khoá hướng màn hình.
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
    // YouTube/Vimeo — KHÔNG vẽ thêm nút nào. Tới lượt slide này thì nạp thẳng
    // trình phát của họ: nút play, toàn màn hình, âm lượng đều là nút GỐC, khách
    // đã quen tay (chủ dự án chốt 11/9/2026). Slide chưa tới lượt thì chỉ hiện
    // khung hình chờ — không nạp iframe cho nhẹ trang.
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

  return <div className={`absolute inset-0 bg-black ${xemTruoc ? "pointer-events-none" : ""}`}>{video}</div>;
}
