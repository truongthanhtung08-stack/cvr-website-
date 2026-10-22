"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import GallerySlideVideo from "@/components/GallerySlideVideo";
import MapPaneMo from "@/components/MapPaneMo";
import { anhToiUu } from "@/lib/anhToiUu";
import { khoaCuon, useNutQuayLai } from "@/lib/khoaCuon";
import { videoPosterUrl } from "@/lib/media";

// ============================================================================
// XEM ẢNH LỚN — BẢN MÁY TÍNH (chủ dự án 18/10/2026: "cách mở hiện tại là của Mobile, chuyển lại cho PC").
// Khung ảnh trong trang tin giữ mặc định; bấm vào thì mở bộ xem này:
//   · ảnh / video lớn ở giữa — VIDEO là slide ĐẦU như ảnh
//   · nút ‹ › hai bên LUÔN hiện (biết còn ảnh phía sau) · vuốt ngang touchpad · phím ← → · Esc đóng
//   · dải ảnh nhỏ bên dưới để chọn nhanh · nút ✕ đóng · bấm nền tối cũng đóng
//   · CỘT BẢN ĐỒ bên phải như Batdongsan (tên tin + địa chỉ + bản đồ) — nút "Vị trí" bật/tắt, ⤢ phóng to
// Điện thoại vẫn dùng PhotoViewer (vuốt, kéo xuống để thoát).
// ============================================================================

type Slide = { kind: "video" | "image"; src: string };

// Toàn màn hình: chuẩn + tiền tố webkit (Safari cũ)
type DocWebkit = Document & { webkitFullscreenElement?: Element | null; webkitExitFullscreen?: () => void };
const dangToan = () => !!(document.fullscreenElement || (document as DocWebkit).webkitFullscreenElement);
const thoatToan = () => {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  else if ((document as DocWebkit).webkitFullscreenElement) (document as DocWebkit).webkitExitFullscreen?.();
};

export default function XemAnhPC({ slides, start = 0, title, onClose, banDo }: { slides: Slide[]; start?: number; title?: string; onClose: () => void; banDo?: { diaChi: string; q: string } }) {
  const [idx, setIdx] = useState(start);
  const [moBanDo, setMoBanDo] = useState(true); // máy tính mở sẵn bản đồ như Batdongsan
  const [banDoTo, setBanDoTo] = useState(false);
  const n = slides.length;
  const doi = useCallback((b: number) => setIdx((i) => (i + b + n) % n), [n]);
  const dai = useRef<HTMLDivElement>(null);
  const khoa = useRef(0);
  // TOÀN MÀN HÌNH THẬT (chuẩn trình xem máy tính, chủ dự án 20/10/2026): mở là bật toàn màn hình của trình duyệt;
  // thoát = bấm lại nút ⤡ ở góc dưới phải, hoặc Esc (trình duyệt tự thoát → đóng bộ xem luôn).
  const goc0 = useRef<HTMLDivElement>(null);
  const dong = useRef(onClose);
  dong.current = onClose;
  useEffect(() => {
    const el = goc0.current as (HTMLDivElement & { webkitRequestFullscreen?: () => void }) | null;
    if (el?.requestFullscreen) el.requestFullscreen().catch(() => {});
    else el?.webkitRequestFullscreen?.(); // Safari cũ
    const doiTrangThai = () => { if (!dangToan()) dong.current(); };
    document.addEventListener("fullscreenchange", doiTrangThai);
    document.addEventListener("webkitfullscreenchange", doiTrangThai);
    // BẤM VÀO VIDEO (khung YouTube) làm phím Esc rơi vào trong video, trang không nhận được → Esc không thoát
    // (chủ dự án 20/10/2026). Video vẫn chạy; trả phím về trang ngay sau cú bấm để Esc / ← → luôn dùng được.
    const veTrang = () => setTimeout(() => {
      if (document.activeElement?.tagName === "IFRAME") { (document.activeElement as HTMLElement).blur(); window.focus(); }
    }, 0);
    window.addEventListener("blur", veTrang);
    return () => {
      document.removeEventListener("fullscreenchange", doiTrangThai);
      document.removeEventListener("webkitfullscreenchange", doiTrangThai);
      window.removeEventListener("blur", veTrang);
      thoatToan();
    };
  }, []);
  const thoat = () => { if (dangToan()) thoatToan(); else onClose(); };
  // PHÓNG TO ẢNH (chủ dự án 20/10/2026): bấm ảnh = phóng to 2,5 lần tại chỗ bấm, rê chuột để xem quanh, bấm lần nữa = thu về;
  // chụm 2 ngón trên touchpad (Ctrl + lăn) cũng phóng to / thu nhỏ. Đổi ảnh thì về cỡ thường.
  const [phong, setPhong] = useState(1);
  const [goc, setGoc] = useState({ x: 50, y: 50 });
  useEffect(() => { setPhong(1); }, [idx]);
  const viTri = (e: React.MouseEvent<HTMLImageElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 };
  };

  useEffect(khoaCuon, []);
  useNutQuayLai(true, onClose); // nút Quay lại điện thoại đóng lớp này, không rời trang (hàm chung, 22/10/2026)
  // Mở lên thì video đang chạy ở trang tin DỪNG — không để hai tiếng chồng nhau.
  useEffect(() => { window.dispatchEvent(new CustomEvent("cl-video-phat", { detail: "xem-anh" })); }, []);

  useEffect(() => {
    const phim = (e: KeyboardEvent) => {
      if (e.key === "Escape") thoat();
      else if (e.key === "ArrowLeft") doi(-1);
      else if (e.key === "ArrowRight") doi(1);
    };
    window.addEventListener("keydown", phim);
    return () => window.removeEventListener("keydown", phim);
  }, [doi, onClose]);

  // Ô nhỏ đang chọn luôn nằm trong tầm nhìn của dải ảnh nhỏ
  useEffect(() => {
    dai.current?.children[idx]?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [idx]);

  // Vuốt 2 ngón NGANG trên touchpad = đổi ảnh; một cú vuốt bắn nhiều sự kiện nên khoá 350ms
  const vuot = (e: React.WheelEvent) => {
    if (e.ctrlKey && slides[idx]?.kind === "image") {
      setPhong((p) => Math.min(4, Math.max(1, p - e.deltaY * 0.01)));
      return;
    }
    if (phong > 1) return;
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || Math.abs(e.deltaX) < 12) return;
    const gio = Date.now();
    if (gio - khoa.current < 350) return;
    khoa.current = gio;
    doi(e.deltaX > 0 ? 1 : -1);
  };

  const s = slides[idx];
  const nVid = slides.filter((x) => x.kind === "video").length;
  const nut = "absolute top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/30";

  return (
    <div ref={goc0} className="fixed inset-0 z-[90] flex bg-black/95" onClick={thoat}>
     <div className="flex min-w-0 flex-1 flex-col">
      {/* Thanh trên: tiêu đề · số thứ tự · đóng */}
      <div className="flex items-center gap-4 px-6 py-3 text-white" onClick={(e) => e.stopPropagation()}>
        <p className="min-w-0 flex-1 truncate text-[15px] font-semibold">{title}</p>
        <p className="shrink-0 text-[14px] text-white/75">
          {s.kind === "video" ? "Video" : `Ảnh ${idx - nVid + 1}/${n - nVid}`}
        </p>
        {banDo && (
          <button type="button" aria-pressed={moBanDo} onClick={() => setMoBanDo((v) => !v)} className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-cvr-blue px-3.5 text-[13px] font-semibold text-white">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden><path d="M12 21s-7-6.2-7-11.5A7 7 0 0112 2.5a7 7 0 017 7C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
            Vị trí
          </button>
        )}
        <button type="button" aria-label="Đóng" onClick={thoat} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-2xl hover:bg-white/15">✕</button>
      </div>

      {/* Khung lớn */}
      <div className="relative min-h-0 flex-1 overflow-hidden" onWheel={vuot}>
        <div className="absolute inset-0 flex items-center justify-center px-20 py-2">
          {s.kind === "video" ? (
            // Cỡ theo CHIỀU CAO khung (không theo chiều ngang) — màn thấp thì thanh điều khiển video (nút Xem full) không chui
            // xuống dưới dải ảnh nhỏ bị đè (chủ dự án 18/10/2026)
            <div className="relative aspect-video h-full max-h-full max-w-full" onClick={(e) => e.stopPropagation()}>
              <GallerySlideVideo key={idx} url={s.src} active />
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={idx} src={anhToiUu(s.src, 1920, 90)} alt={`${title ?? "Ảnh"} ${idx - nVid + 1}`}
              onClick={(e) => { e.stopPropagation(); setGoc(viTri(e)); setPhong((p) => (p > 1 ? 1 : 2.5)); }}
              onMouseMove={(e) => { if (phong > 1) setGoc(viTri(e)); }}
              style={{ transform: `scale(${phong})`, transformOrigin: `${goc.x}% ${goc.y}%` }}
              className={`max-h-full max-w-full animate-fadein object-contain transition-transform duration-200 ${phong > 1 ? "cursor-zoom-out" : "cursor-zoom-in"}`} />
          )}
        </div>
        {n > 1 && (
          <>
            <button type="button" aria-label="Ảnh trước" onClick={(e) => { e.stopPropagation(); doi(-1); }} className={`${nut} left-5`}>
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m15 19-7-7 7-7" /></svg>
            </button>
            <button type="button" aria-label="Ảnh sau" onClick={(e) => { e.stopPropagation(); doi(1); }} className={`${nut} right-5`}>
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" /></svg>
            </button>
          </>
        )}
        {/* Nút thoát toàn màn hình — CÙNG CHỖ nút mở ở trang tin (góc dưới phải) */}
        <button type="button" aria-label="Thoát toàn màn hình" title="Thoát toàn màn hình" onClick={(e) => { e.stopPropagation(); thoat(); }}
          className="absolute bottom-3 right-5 z-10 flex h-10 w-10 items-center justify-center rounded-md bg-white/15 text-white backdrop-blur transition hover:bg-white/30">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" /></svg>
        </button>
      </div>

      {/* Dải ảnh nhỏ — bấm để chọn */}
      {n > 1 && (
        <div ref={dai} className="no-scrollbar flex justify-start gap-2 overflow-x-auto px-6 py-3 [&>*:first-child]:ml-auto [&>*:last-child]:mr-auto" onClick={(e) => e.stopPropagation()}>
          {slides.map((x, i) => {
            const bia = x.kind === "video" ? videoPosterUrl(x.src)?.thuong : anhToiUu(x.src, 240, 70);
            return (
              <button key={i} type="button" aria-label={x.kind === "video" ? "Video" : `Ảnh ${i - nVid + 1}`} onClick={() => setIdx(i)}
                className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-md bg-white/10 transition ${i === idx ? "ring-2 ring-white" : "opacity-60 hover:opacity-100"}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {bia && <img src={bia} alt="" className="h-full w-full object-cover" />}
                {x.kind === "video" && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90"><svg className="ml-0.5 h-3.5 w-3.5 text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg></span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
     </div>
      {banDo && moBanDo && (
        <aside className={`flex shrink-0 flex-col bg-white ${banDoTo ? "w-[60%]" : "w-[380px]"}`} onClick={(e) => e.stopPropagation()}>
          <div className="relative border-b border-cvr-line px-5 py-4 pr-24">
            <div className="absolute right-4 top-4 flex gap-1.5">
              <button type="button" aria-label={banDoTo ? "Thu nhỏ bản đồ" : "Phóng to bản đồ"} onClick={() => setBanDoTo((v) => !v)} className="flex h-8 w-8 items-center justify-center rounded-full border border-cvr-line text-cvr-ink">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
                  {banDoTo ? <path strokeLinecap="round" strokeLinejoin="round" d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" /> : <path strokeLinecap="round" strokeLinejoin="round" d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />}
                </svg>
              </button>
              <button type="button" aria-label="Đóng bản đồ" onClick={() => { setMoBanDo(false); setBanDoTo(false); }} className="flex h-8 w-8 items-center justify-center rounded-full text-cvr-ink">✕</button>
            </div>
            {title && <p className="line-clamp-2 text-[15px] font-semibold leading-snug text-cvr-ink">{title}</p>}
            <p className="mt-1.5 text-[13px] text-cvr-muted">{banDo.diaChi}</p>
          </div>
          {/* Bản đồ nền mở (MapLibre) — khung nhúng Google bị chặn ở Việt Nam */}
          <div className="min-h-0 flex-1"><MapPaneMo query={banDo.q} cao="h-full w-full" /></div>
        </aside>
      )}
    </div>
  );
}
