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
  const [loiPhat, setLoiPhat] = useState(false);
  // YOUTUBE: CHƯA BẤM THÌ CHƯA NẠP TRÌNH PHÁT.
  // Nạp iframe sẵn thì YouTube tự đắp lên khung một lớp nút của họ — nút chia sẻ,
  // nút xem sau, dải "Watch on YouTube" — rối mắt và dẫn khách rời trang mình
  // (chủ dự án báo 17/09/2026). Nay chỉ hiện ẢNH BÌA + một nút play duy nhất;
  // bấm mới nạp iframe kèm autoplay nên video chạy thẳng, không kịp hiện lớp đó.
  const [daBam, setDaBam] = useState(false);
  const laYoutube = !!embed && /youtube\.com/.test(embed);
  const [ytDung, setYtDung] = useState(false); // YouTube đang dừng (khách chạm dừng)
  const gocRef = useRef<HTMLDivElement>(null);
  // ── XEM LỚN = KHUNG PHỦ KÍN MÀN HÌNH CỦA WEB (chủ dự án 08/10/2026) ───────────
  // KHÔNG dùng chế độ toàn màn hình thật của trình duyệt: Android hiện dòng "To exit
  // full screen, drag from the top…" đè lên video mà web không tắt được (chủ dự án
  // chụp màn hình báo). Khung web phủ kín màn, cùng một trình phát đang chạy nên
  // video CHẠY TIẾP khi phóng to / xoay / thoát — chỉ dừng khi khách bấm dừng.
  // VIDEO NGANG → TỰ XOAY NGANG: màn đang dọc thì khung xoay 90° cho video ngang phủ
  // kín màn; khách tự xoay máy ngang thì bỏ xoay khung. Video dọc giữ dọc.
  // Ngang/dọc: video tải lên đọc từ chính tệp; YouTube hỏi /api/video-ngang.
  // Nút Xoay vẫn còn để khách xoay theo ý.
  const [lon, setLon] = useState(false);
  const [xoay, setXoay] = useState(false);
  const [ytNgang, setYtNgang] = useState(false);
  const maYt = laYoutube ? (url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/i)?.[1] ?? "") : "";
  useEffect(() => {
    if (!maYt || !active) return;
    let huy = false;
    fetch(`/api/video-ngang?id=${maYt}`)
      .then((r) => r.json())
      .then((d: { ngang?: boolean }) => !huy && setYtNgang(!!d.ngang))
      .catch(() => {});
    return () => {
      huy = true;
    };
  }, [maYt, active]);
  const laNgang = () => {
    if (embed) return ytNgang;
    const v = ref.current;
    return !!v && v.videoWidth > v.videoHeight;
  };
  const canXoay = () => laNgang() && window.innerHeight > window.innerWidth;
  const moLon = () => {
    setLon(true);
    setXoay(canXoay());
  };
  const thuNho = () => {
    // Đã ghi một bước lịch sử lúc phóng to → lùi lại đúng bước đó (popstate sẽ thu khung).
    if ((history.state as { xemLon?: boolean } | null)?.xemLon) history.back();
    else {
      setLon(false);
      setXoay(false);
    }
  };
  // LUÔN CÓ LỐI THOÁT: nút Back của điện thoại cũng thu khung về (không rời trang).
  useEffect(() => {
    if (!lon) return;
    history.pushState({ ...(history.state ?? {}), xemLon: true }, "");
    const quayLai = () => {
      setLon(false);
      setXoay(false);
    };
    window.addEventListener("popstate", quayLai);
    return () => window.removeEventListener("popstate", quayLai);
  }, [lon]);
  const doiXoay = () => setXoay((x) => !x);
  // BẤM PHÁT TRONG KHUNG ẢNH → KHUNG TỰ GIÃN THEO ĐÚNG HÌNH VIDEO (chủ dự án 08/10/2026):
  // video dọc thì khung cao lên thành khung dọc, video ngang giữ khung ngang. Rời slide
  // thì khung về như cũ. Báo tỉ lệ (rộng ÷ cao) cho thư viện; 0 = khung mặc định.
  useEffect(() => {
    if (!onTyLe) return;
    if (!active || !daBam) return onTyLe(0);
    if (embed) return onTyLe(ytNgang ? 16 / 9 : 9 / 16);
    const v = ref.current;
    if (v && v.videoWidth > 0) onTyLe(v.videoWidth / v.videoHeight);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, daBam, ytNgang]);
  // Khách tự xoay máy lúc đang xem lớn → khung theo chiều máy.
  useEffect(() => {
    if (!lon) return;
    const doiCo = () => setXoay(canXoay());
    window.addEventListener("resize", doiCo);
    const cuon = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("resize", doiCo);
      document.body.style.overflow = cuon;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lon]);
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
      setDaBam(false);
      setYtDung(false);
      setLon(false);
      setXoay(false);
    }
    holdRef.current?.(playingRef.current || fullRef.current || dungVaoRef.current);
  }, [active]);

  // Đang xem lớn thì giữ slide đứng yên (kể cả khi máy không vào toàn màn hình thật).
  useEffect(() => {
    fullRef.current = lon;
    holdRef.current?.(lon || playingRef.current || dungVaoRef.current);
  }, [lon]);

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
    //
    active && daBam ? (
      laYoutube ? (
        // YOUTUBE GỌN (chủ dự án 08/10/2026: khung YouTube "rất rối" — tên video,
        // logo kênh, CC, cài đặt, chia sẻ, chữ YouTube đè kín khung).
        // Tắt hết nút của YouTube (controls=0) và đặt MỘT LỚP CHẠM của web lên trên:
        // chạm = phát/dừng (gửi lệnh qua enablejsapi), góc trên phải = toàn màn hình.
        // Lớp này chặn luôn cú rê/chạm vào iframe nên YouTube không bật lớp nút của họ.
        <>
          <iframe
            ref={khungRef}
            src={`${embed}&autoplay=1&controls=0&disablekb=1&fs=0&enablejsapi=1`}
            title="Video"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            // KHÔNG kéo iframe cao hơn khung để giấu dải tên video: thử 08/10 thì video
            // quay dọc bị YouTube phóng to, mất phần trên dưới.
            className="pointer-events-none h-full w-full bg-black"
          />
          <button
            type="button"
            onClick={() => {
              const lenh = ytDung ? "playVideo" : "pauseVideo";
              khungRef.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func: lenh, args: [] }), "*");
              setYtDung(!ytDung);
            }}
            aria-label={ytDung ? "Phát video" : "Dừng video"}
            className="absolute inset-0 z-[5] flex items-center justify-center"
          >
            {ytDung && (
              <span className="flex h-[62px] w-[62px] items-center justify-center rounded-full bg-black/55 backdrop-blur-sm sm:h-[70px] sm:w-[70px]">
                <svg className="ml-1 h-7 w-7 text-white sm:h-8 sm:w-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            )}
          </button>
        </>
      ) : (
        <iframe
          ref={khungRef}
          src={`${embed}&autoplay=1`}
          title="Video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          // allowFullScreen: thiếu thuộc tính này thì nút toàn màn hình CỦA YOUTUBE
          // bấm không lên — khách tưởng web hỏng.
          allowFullScreen
          className="h-full w-full bg-black"
        />
      )
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
        {/* MỘT NÚT PLAY DUY NHẤT — bấm là nạp trình phát và chạy ngay. */}
        {!xemTruoc && (
          <button
            type="button"
            onClick={() => {
              setDaBam(true);
              dungVaoRef.current = true;
              bao();
            }}
            aria-label="Phát video"
            className="absolute inset-0 z-[5] flex items-center justify-center"
          >
            <span className="flex h-[62px] w-[62px] items-center justify-center rounded-full bg-black/55 backdrop-blur-sm transition active:scale-95 sm:h-[70px] sm:w-[70px]">
              <svg className="ml-1 h-7 w-7 text-white sm:h-8 sm:w-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </button>
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
      onPlay={() => {
        playingRef.current = true;
        setDaBam(true);
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
      // Máy này không giải mã nổi (thường là video iPhone quay ở chế độ "Hiệu
      // quả cao" — mã HEVC, Android không đọc được) → ĐỪNG để ô đen câm. Mở
      // thẳng bằng trình phát của máy, nó xem được.
      onError={() => setLoiPhat(true)}
      className="h-full w-full bg-black object-contain"
    >
      Trình duyệt không hỗ trợ phát video.
    </video>
  );

  // Trong khung: play · tua · âm lượng là thanh gốc của trình phát (video tải lên) hoặc
  // lớp chạm phát/dừng (YouTube). GÓC TRÊN PHẢI: nút phóng to / thu nhỏ — bấm một chỗ để
  // mở, bấm lại chính chỗ đó để thoát. Lúc phóng to có thêm nút Xoay ở góc trên trái
  // (bấm lại thì xoay về). Đổi chế độ xem KHÔNG dừng video.
  const coNut = !xemTruoc && !loiPhat && (!embed || (active && daBam));
  const nutTron = "flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm active:bg-black/80";
  return (
    <div ref={gocRef} className={`${lon ? "fixed inset-0 z-[200] overflow-hidden" : "absolute inset-0"} bg-black ${xemTruoc ? "pointer-events-none" : ""}`}>
      {/* XOAY: quay 90° quanh tâm màn để video ngang phủ kín màn dọc; bấm lại thì về. */}
      <div
        className="h-full w-full"
        style={
          lon && xoay
            ? { position: "absolute", left: "50%", top: "50%", width: "100dvh", height: "100dvw", transform: "translate(-50%, -50%) rotate(90deg)" }
            : undefined
        }
      >
        {video}
      </div>

      {coNut && lon && (
        <button type="button" onClick={doiXoay} aria-label={xoay ? "Xoay về" : "Xoay ngang"} className={`absolute left-2 top-2 z-[6] ${nutTron}`}>
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 9a8 8 0 0113.6-4.6L20 7M20 15a8 8 0 01-13.6 4.6L4 17" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 4v3h-3M4 20v-3h3" />
          </svg>
        </button>
      )}
      {coNut && (
        <button
          type="button"
          onClick={lon ? thuNho : moLon}
          aria-label={lon ? "Thoát toàn màn hình" : "Toàn màn hình"}
          className={
            lon
              ? "absolute right-2 top-2 z-[6] flex h-10 items-center gap-1.5 rounded-full bg-black/60 px-4 text-[14px] font-semibold text-white backdrop-blur-sm active:bg-black/80"
              : `absolute right-2 top-2 z-[6] ${nutTron}`
          }
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            {lon ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
            )}
          </svg>
          {lon && "Thoát"}
        </button>
      )}

      {loiPhat && !xemTruoc && (
        <a
          href={asset(url)}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black text-white"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90">
            <svg className="ml-1 h-7 w-7 text-black" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
          <span className="text-[13px] font-medium">Mở video</span>
        </a>
      )}
    </div>
  );
}
