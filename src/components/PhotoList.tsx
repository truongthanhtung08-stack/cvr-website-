"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { khoaCuon } from "@/lib/khoaCuon";
import { haptic } from "@/lib/haptic";

// ============================================================================
// DANH SÁCH ẢNH KIỂU FACEBOOK — dùng chung cho tin mua bán / cho thuê và dự án
// ----------------------------------------------------------------------------
// · Bấm "Xem tất cả N ảnh" → cả bộ ảnh xếp dọc full bề ngang, cuộn lên xuống.
// · Bấm 1 ảnh → mở ảnh đó toàn màn hình (PhotoViewer: vuốt ngang, zoom).
// · CUỘN TIẾP Ở CUỐI TRANG (hoặc kéo xuống ở đầu trang) → THOÁT, có hiệu ứng
//   trượt + mờ dần đúng kiểu Facebook. Nhận cả 3 cách: vuốt tay, lăn chuột /
//   touchpad, phím Esc.
// Chỉ chuyển động bằng transform/opacity → mượt, không giật trên điện thoại.
// ============================================================================

const NGUONG_THOAT = 88;   // kéo quá 88px ở mép → thoát
const HAM_KEO = 0.5;       // hãm tay: kéo 2 phần thì ảnh chạy 1 phần (cảm giác níu)
const NGUONG_LAN = 240;    // chuột/touchpad: lăn thêm quá mức này ở mép → thoát
const THOI_GIAN_THOAT = 240;

export default function PhotoList({
  images,
  title,
  onClose,
  onPick,
  nhanPhim = true,
}: {
  images: string[];
  title: string;
  onClose: () => void;
  onPick: (i: number) => void;
  nhanPhim?: boolean;   // tắt khi đang mở ảnh lớn đè lên → Esc chỉ đóng ảnh lớn
}) {
  const [keo, setKeo] = useState(0);      // độ lệch đang kéo (px; âm = trượt lên)
  const [thoat, setThoat] = useState(0);  // 0 = đang mở · 1/-1 = đang chạy hiệu ứng thoát
  const [muot, setMuot] = useState(true); // tắt hiệu ứng khi ảnh bám ngón tay
  const boc = useRef<HTMLDivElement>(null);
  const dong = useRef(onClose);
  useEffect(() => { dong.current = onClose; }, [onClose]);

  // Khoá cuộn trang nền (bộ đếm dùng chung với PhotoViewer — xem khoaCuon.ts)
  useEffect(khoaCuon, []);

  useEffect(() => {
    if (!nhanPhim) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, nhanPhim]);

  // ── CUỘN QUÁ MÉP ĐỂ THOÁT ────────────────────────────────────────────────
  useEffect(() => {
    const el = boc.current;
    if (!el) return;

    let y0 = 0;        // toạ độ ngón tay lúc đặt xuống
    let mep = 0;       // lúc đặt tay đang ở: 1 = đầu danh sách · -1 = cuối · 0 = giữa
    let lech = 0;      // độ lệch hiện tại (bản ref của state keo)
    let gom = 0;       // tổng lượng lăn chuột đã dồn ở mép
    let hetGio = 0;

    const oMep = () =>
      el.scrollTop <= 0 ? 1 : el.scrollTop + el.clientHeight >= el.scrollHeight - 1 ? -1 : 0;

    const dat = (v: number) => { lech = v; setKeo(v); };

    const chayThoat = (huong: number) => {
      haptic();
      setMuot(true);
      setThoat(huong);
      window.setTimeout(() => dong.current(), THOI_GIAN_THOAT);
    };

    const batDau = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      y0 = e.touches[0].clientY;
      mep = oMep();
      setMuot(false);
    };

    const keoTay = (e: TouchEvent) => {
      if (!mep || e.touches.length !== 1) return;
      const dy = e.touches[0].clientY - y0;
      // Chỉ nhận khi kéo RA NGOÀI mép: ở cuối thì kéo lên, ở đầu thì kéo xuống.
      // Kéo ngược lại là cuộn danh sách bình thường → trả ảnh về chỗ cũ.
      if (mep * dy <= 0) { if (lech) dat(0); return; }
      if (e.cancelable) e.preventDefault();
      dat(dy * HAM_KEO);
    };

    const nhaTay = () => {
      if (!lech) { setMuot(true); return; }
      setMuot(true);
      if (Math.abs(lech) > NGUONG_THOAT) chayThoat(lech > 0 ? 1 : -1);
      else dat(0);
      mep = 0;
    };

    // Máy tính / touchpad: đang ở mép mà lăn tiếp ra ngoài → dồn dần rồi thoát
    const lanChuot = (e: WheelEvent) => {
      const m = oMep();
      if (!m || m * e.deltaY >= 0) {
        gom = 0;
        if (lech) { setMuot(true); dat(0); }
        return;
      }
      gom += e.deltaY;
      if (Math.abs(gom) > NGUONG_LAN) { chayThoat(gom > 0 ? -1 : 1); return; }
      setMuot(false);
      dat(-gom * HAM_KEO);
      window.clearTimeout(hetGio);
      hetGio = window.setTimeout(() => { gom = 0; setMuot(true); dat(0); }, 180);
    };

    el.addEventListener("touchstart", batDau, { passive: true });
    el.addEventListener("touchmove", keoTay, { passive: false });
    el.addEventListener("touchend", nhaTay);
    el.addEventListener("touchcancel", nhaTay);
    el.addEventListener("wheel", lanChuot, { passive: true });
    return () => {
      el.removeEventListener("touchstart", batDau);
      el.removeEventListener("touchmove", keoTay);
      el.removeEventListener("touchend", nhaTay);
      el.removeEventListener("touchcancel", nhaTay);
      el.removeEventListener("wheel", lanChuot);
      window.clearTimeout(hetGio);
    };
  }, []);

  const doMo = Math.min(0.5, Math.abs(keo) / 520);   // kéo càng xa càng mờ
  const hieuUng = "transform 0.26s cubic-bezier(0.22,1,0.36,1), opacity 0.24s ease-out";

  return (
    <div className="fixed inset-0 z-[85]">
      <div
        ref={boc}
        className="h-full overflow-y-auto overscroll-contain bg-white"
        style={{
          transform: `translate3d(0, ${thoat ? thoat * 180 : keo}px, 0) scale(${thoat ? 0.96 : 1})`,
          opacity: thoat ? 0 : 1 - doMo,
          transition: muot || thoat ? hieuUng : "none",
          willChange: "transform",
        }}
      >
        <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-cvr-line bg-white/95 px-2 py-2.5 pt-[calc(0.625rem+env(safe-area-inset-top))] backdrop-blur">
          <button
            type="button"
            aria-label="Quay lại"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-cvr-ink active:bg-cvr-surface"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold text-cvr-ink">{title}</p>
            <p className="text-xs text-cvr-muted">{images.length} ảnh</p>
          </div>
        </div>

        <div className="space-y-2">
          {images.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onPick(i)}
              aria-label={`Xem ảnh ${i + 1}`}
              className="relative block w-full bg-cvr-surface"
            >
              {/* Ảnh đi qua bộ tối ưu (AVIF/WebP đúng bề rộng máy) + chỉ tải khi
                  cuộn tới → danh sách 13 ảnh vẫn mở nhanh, không giật. */}
              <Image
                src={src}
                alt={`${title} ${i + 1}`}
                width={1080}
                height={810}
                sizes="100vw"
                priority={i < 2}
                loading={i < 2 ? "eager" : "lazy"}
                className="h-auto w-full"
              />
              <span className="absolute bottom-2 right-2 rounded-md bg-black/65 px-2 py-0.5 text-xs font-medium text-white">
                {i + 1}/{images.length}
              </span>
            </button>
          ))}
        </div>

        {/* Hết ảnh — nhắc cử chỉ thoát (cuộn/vuốt thêm một nhịp là ra) */}
        <p className="py-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-center text-xs text-cvr-muted">
          Cuộn tiếp để thoát
        </p>
      </div>
    </div>
  );
}
