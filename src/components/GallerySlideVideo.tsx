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
  onLon,
  xemTruoc = false,
}: {
  url: string;
  active: boolean;                 // đang là slide hiện tại
  onHold?: (giu: boolean) => void; // đang xem / đang toàn màn hình → giữ slide, đừng tự chuyển
  /** Báo đang xem full — thư viện giữ khối chứa video hiện ra kể cả khi xoay máy. */
  onLon?: (lon: boolean) => void;
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
    vaoDoXoay.current = false;
    setLon(false);
    setXoay(false);
  };
  // Nút Back của điện thoại lúc đang xem full → thoát xem full (không rời trang).
  // Ghi một bước lịch sử khi vào full; thoát bằng nút thì tự lùi bước đó.
  const dangCoBuoc = useRef(false);
  useEffect(() => {
    onLon?.(lon);
    if (!lon) {
      if (dangCoBuoc.current) {
        dangCoBuoc.current = false;
        history.back();
      }
      return;
    }
    history.pushState(history.state, "");
    dangCoBuoc.current = true;
    const quayLai = () => {
      dangCoBuoc.current = false;
      setLon(false);
      setXoay(false);
    };
    window.addEventListener("popstate", quayLai);
    return () => window.removeEventListener("popstate", quayLai);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lon]);
  // Khách tự xoay máy lúc đang xem lớn → khung theo chiều máy.
  // ĐANG PHÁT TRONG KHUNG MÀ NGHIÊNG MÁY NGANG (máy bật Tự xoay) → TỰ VÀO XEM FULL, như
  // YouTube. Không làm vậy thì màn ngang rộng hơn 640px, web chuyển sang bố cục máy tính
  // và giấu luôn khung điện thoại đang phát → video biến mất (chủ dự án báo 08/10/2026).
  const vaoDoXoay = useRef(false);
  // THEO NÚT TỰ XOAY / KHOÁ XOAY CỦA ĐIỆN THOẠI (chủ dự án 08/10/2026):
  // · Vào full: video ngang + màn dọc → khung tự nằm ngang (máy khoá xoay vẫn xem ngang được).
  // · Máy đổi hướng thật (đang bật Tự xoay, hoặc khách bấm nút xoay của máy) → từ đó
  //   ĐI THEO MÁY hoàn toàn: máy ngang thì video ngang đầy màn, máy dọc thì video vừa
  //   màn dọc — không tự xoay khung nữa.
  useEffect(() => {
    if (!lon) return;
    let ngangCu = window.innerWidth > window.innerHeight;
    let theoMay = false;
    const doiCo = () => {
      const ngangMoi = window.innerWidth > window.innerHeight;
      if (ngangMoi !== ngangCu) theoMay = true;
      ngangCu = ngangMoi;
      // Vào full do NGHIÊNG MÁY NGANG → dựng máy dọc lại là tự thoát về khung (như YouTube).
      if (vaoDoXoay.current && !ngangMoi) {
        vaoDoXoay.current = false;
        setLon(false);
        setXoay(false);
        return;
      }
      setXoay(theoMay ? false : canXoay());
    };
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

  // ── THANH ĐIỀU KHIỂN CHUẨN (chủ dự án 08/10/2026) — chung cho video tải lên và YouTube:
  // chạm video → hiện nút; giữa: ▶ / ❚❚; dưới: thời gian · thanh tua · âm lượng ·
  // ⛶ phóng to (đang to thì ⤡ thu nhỏ). Đang chạy thì 3 giây sau tự ẩn.
  const [dangChay, setDangChay] = useState(false);
  const [giay, setGiay] = useState(0);
  const [tong, setTong] = useState(0);
  const [tatTieng, setTatTieng] = useState(false);
  const [hienNut, setHienNut] = useState(true);
  useEffect(() => {
    if (lon || !active || !dangChay || xemTruoc) return;
    if (!window.matchMedia("(pointer: coarse)").matches) return; // chỉ điện thoại / máy tính bảng
    let ngangCu = window.innerWidth > window.innerHeight;
    const doiCo = () => {
      const ngangMoi = window.innerWidth > window.innerHeight;
      if (ngangMoi && !ngangCu) {
        vaoDoXoay.current = true;
        setLon(true);
        setXoay(false);
      }
      ngangCu = ngangMoi;
    };
    window.addEventListener("resize", doiCo);
    return () => window.removeEventListener("resize", doiCo);
  }, [lon, active, dangChay, xemTruoc]);
  const lenhYt = (func: string, args: unknown[] = []) =>
    khungRef.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args }), "*");
  // YouTube báo trạng thái qua postMessage (sau khi gửi "listening").
  useEffect(() => {
    if (!laYoutube || !active || !daBam) return;
    const nghe = (e: MessageEvent) => {
      if (e.source !== khungRef.current?.contentWindow || typeof e.data !== "string") return;
      try {
        const d = JSON.parse(e.data) as { info?: { currentTime?: number; duration?: number; playerState?: number; muted?: boolean } };
        const i = d.info;
        if (!i) return;
        if (typeof i.currentTime === "number") setGiay(i.currentTime);
        if (typeof i.duration === "number" && i.duration > 0) setTong(i.duration);
        if (typeof i.muted === "boolean") setTatTieng(i.muted);
        if (typeof i.playerState === "number") {
          const chay = i.playerState === 1 || i.playerState === 3;
          setDangChay(chay);
          playingRef.current = chay;
          bao();
        }
      } catch {}
    };
    window.addEventListener("message", nghe);
    return () => window.removeEventListener("message", nghe);
  }, [laYoutube, active, daBam]);
  const phatDung = () => {
    const v = ref.current;
    if (!embed && v) return void (v.paused ? v.play().catch(() => {}) : v.pause());
    lenhYt(dangChay ? "pauseVideo" : "playVideo");
    setDangChay(!dangChay);
  };
  const tua = (s: number) => {
    const v = ref.current;
    if (!embed && v) v.currentTime = s;
    else lenhYt("seekTo", [s, true]);
    setGiay(s);
  };
  const doiTieng = () => {
    const v = ref.current;
    if (!embed && v) v.muted = !v.muted;
    else {
      lenhYt(tatTieng ? "unMute" : "mute");
      setTatTieng(!tatTieng);
    }
  };
  // Video đã tải xong phần mô tả trước khi trang kịp gắn sự kiện → đọc độ dài ngay.
  useEffect(() => {
    const v = ref.current;
    if (v && v.readyState >= 1 && v.duration) setTong(v.duration);
  }, []);
  useEffect(() => {
    if (!dangChay || !hienNut) return;
    const t = setTimeout(() => setHienNut(false), 3000);
    return () => clearTimeout(t);
  }, [dangChay, hienNut]);

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
        // chạm = hiện nút; ▶/❚❚ · tua · âm lượng · xem full gửi lệnh qua enablejsapi.
        // Lớp này chặn luôn cú rê/chạm vào iframe nên YouTube không bật lớp nút của họ.
        <iframe
          ref={khungRef}
          src={`${embed}&autoplay=1&controls=0&disablekb=1&fs=0&enablejsapi=1&origin=${typeof window === "undefined" ? "" : encodeURIComponent(window.location.origin)}`}
          title="Video"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          // Báo cho YouTube biết mình nghe trạng thái (giây, tổng, đang chạy, tắt tiếng).
          onLoad={() => khungRef.current?.contentWindow?.postMessage(JSON.stringify({ event: "listening", id: 1 }), "*")}
          className="pointer-events-none h-full w-full bg-black"
        />
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
      controls={false}
      disablePictureInPicture
      muted={xemTruoc}
      preload="metadata"
      onTimeUpdate={(e) => setGiay(e.currentTarget.currentTime)}
      onLoadedMetadata={(e) => setTong(e.currentTarget.duration || 0)}
      onVolumeChange={(e) => setTatTieng(e.currentTarget.muted)}
      onPlay={() => {
        playingRef.current = true;
        setDangChay(true);
        setDaBam(true);
        bao();
      }}
      onPause={() => {
        playingRef.current = false;
        setDangChay(false);
        bao();
      }}
      onEnded={() => {
        playingRef.current = false;
        setDangChay(false);
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

  const coNut = !xemTruoc && !loiPhat && (!embed || (active && daBam));
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
        {coNut && (
          <div
            className="absolute inset-0 z-[5]"
            onClick={() => {
              // Khách đã chạm vào video → thư viện đứng yên ở slide này.
              dungVaoRef.current = true;
              bao();
              setHienNut((h) => !h);
            }}
          >
            {(hienNut || !dangChay) && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    dungVaoRef.current = true;
                    bao();
                    phatDung();
                    setHienNut(true);
                  }}
                  aria-label={dangChay ? "Dừng video" : "Phát video"}
                  className="absolute left-1/2 top-1/2 flex h-[62px] w-[62px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm active:scale-95"
                >
                  <svg className={`h-7 w-7 ${dangChay ? "" : "ml-1"}`} fill="currentColor" viewBox="0 0 24 24">
                    {dangChay ? <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /> : <path d="M8 5v14l11-7z" />}
                  </svg>
                </button>
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-6 text-white"
                >
                  <span className="shrink-0 text-[12px] tabular-nums">{dongHo(giay)} / {dongHo(tong)}</span>
                  <input
                    type="range"
                    min={0}
                    max={tong || 0}
                    step={0.1}
                    value={Math.min(giay, tong || 0)}
                    onChange={(e) => tua(Number(e.target.value))}
                    aria-label="Tua video"
                    className="h-1 min-w-0 flex-1 cursor-pointer accent-white"
                  />
                  <button type="button" onClick={doiTieng} aria-label={tatTieng ? "Bật tiếng" : "Tắt tiếng"} className="flex h-9 w-9 shrink-0 items-center justify-center">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinejoin="round" d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
                      {tatTieng ? <path strokeLinecap="round" d="M16 9l5 6M21 9l-5 6" /> : <path strokeLinecap="round" d="M16 8.5a5 5 0 010 7M18.5 6a8.5 8.5 0 010 12" />}
                    </svg>
                  </button>
                  <button type="button" onClick={lon ? thuNho : moLon} aria-label={lon ? "Thoát xem full" : "Xem full"} className="flex h-9 w-9 shrink-0 items-center justify-center">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      {lon ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
                      )}
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
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

function dongHo(s: number): string {
  const t = Math.max(0, Math.floor(s || 0));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
}
