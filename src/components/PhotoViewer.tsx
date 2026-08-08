"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSaved } from "@/lib/useSaved";
import { haptic } from "@/lib/haptic";

// ============================================================================
// BỘ XEM ẢNH KIỂU FACEBOOK — dùng chung cho MỌI mục có ảnh
// (tin mua bán / cho thuê, dự án, tin tức, mặt bằng…)
// ----------------------------------------------------------------------------
// Yêu cầu của chủ dự án (file 08.08.2026) và cách xử lý:
//   · Ảnh FULL SÁT VIỀN, không chừa lề đen hai bên  → fixed inset-0, không padding
//   · Vuốt trái/phải đổi ảnh, ảnh chạy theo tay      → track translateX bám ngón tay
//   · Hiện thứ tự ảnh (3/13)                         → thanh trên
//   · Tiêu đề + trái tim (lưu tin) + nút chia sẻ     → thanh trên
//   · Vuốt XUỐNG để thoát, có hiệu ứng như Facebook  → kéo xuống mờ dần + thu nhỏ
//   · ZOOM KHÔNG ĐƯỢC KÉO ẢNH RA NGOÀI KHUNG         → giới hạn pan theo mép ảnh
// Chỉ chuyển động bằng transform/opacity → mượt, không giật trên điện thoại.
// ============================================================================

const ZOOM_MAX = 4;
const NGUONG_DOI_ANH = 0.18;  // kéo ngang quá 18% bề rộng → sang ảnh khác
const NGUONG_THOAT = 110;     // kéo xuống quá 110px → đóng

export default function PhotoViewer({
  images,
  start = 0,
  title,
  captions,
  listingId,
  onClose,
}: {
  images: string[];
  start?: number;
  title?: string;
  captions?: string[];
  listingId?: string;   // có id → hiện trái tim lưu tin
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(start);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [keo, setKeo] = useState({ x: 0, y: 0 });   // đang kéo (chưa nhả tay)
  const [muot, setMuot] = useState(true);           // bật/tắt hiệu ứng khi bám tay
  const [hienNut, setHienNut] = useState(true);     // chạm nền → ẩn/hiện thanh nút
  const [dangDong, setDangDong] = useState(false);

  const khung = useRef<HTMLDivElement>(null);
  const anhRef = useRef<HTMLImageElement>(null);
  const cham = useRef<{ x: number; y: number; huong: "" | "ngang" | "doc" | "zoom" } | null>(null);
  const panDau = useRef({ x: 0, y: 0 });
  const pinch = useRef<{ d: number; scale: number } | null>(null);
  const lanCham = useRef(0);

  const { has, toggle } = useSaved();
  const daLuu = listingId ? has(listingId) : false;

  const veMacDinh = useCallback(() => { setScale(1); setPan({ x: 0, y: 0 }); }, []);
  const doiAnh = useCallback(
    (huong: number) => {
      setIdx((i) => Math.min(images.length - 1, Math.max(0, i + huong)));
      veMacDinh();
    },
    [images.length, veMacDinh],
  );

  // Giới hạn kéo ảnh: KHÔNG cho ảnh rời khỏi khung màn hình khi đã phóng to.
  // Tính theo kích thước THẬT của ảnh đang hiển thị, nên ảnh ngang/dọc đều đúng.
  const gioiHanPan = useCallback((p: { x: number; y: number }, s: number) => {
    const el = anhRef.current;
    if (!el) return { x: 0, y: 0 };
    const r = el.getBoundingClientRect();
    const rongGoc = r.width / (scale || 1);
    const caoGoc = r.height / (scale || 1);
    const duX = Math.max(0, (rongGoc * s - window.innerWidth) / 2);
    const duY = Math.max(0, (caoGoc * s - window.innerHeight) / 2);
    return {
      x: Math.min(duX, Math.max(-duX, p.x)),
      y: Math.min(duY, Math.max(-duY, p.y)),
    };
  }, [scale]);

  const datZoom = useCallback((s: number) => {
    const ns = Math.min(ZOOM_MAX, Math.max(1, s));
    setScale(ns);
    setPan((p) => (ns === 1 ? { x: 0, y: 0 } : gioiHanPan(p, ns)));
  }, [gioiHanPan]);

  // Phím tắt cho máy tính
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") doiAnh(-1);
      else if (e.key === "ArrowRight") doiAnh(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doiAnh, onClose]);

  // Khoá cuộn nền bằng position:fixed (KHÔNG dùng overflow:hidden — cách đó làm
  // hỏng position:sticky của header, đã từng gây lỗi menu bị ẩn).
  useEffect(() => {
    const y = window.scrollY;
    const b = document.body.style;
    b.position = "fixed";
    b.top = `-${y}px`;
    b.left = "0";
    b.right = "0";
    return () => {
      b.position = ""; b.top = ""; b.left = ""; b.right = "";
      window.scrollTo(0, y);
    };
  }, []);

  const dong = useCallback(() => {
    setDangDong(true);
    window.setTimeout(onClose, 180);
  }, [onClose]);

  // ── CỬ CHỈ ────────────────────────────────────────────────────────────────
  const khoangCach = (t: React.TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);

  function chamBatDau(e: React.TouchEvent) {
    setMuot(false);
    if (e.touches.length === 2) {
      pinch.current = { d: khoangCach(e.touches), scale };
      cham.current = { x: 0, y: 0, huong: "zoom" };
      return;
    }
    const t = e.touches[0];
    cham.current = { x: t.clientX, y: t.clientY, huong: "" };
    panDau.current = { ...pan };
  }

  function chamDiChuyen(e: React.TouchEvent) {
    // Hai ngón → phóng to/thu nhỏ
    if (e.touches.length === 2 && pinch.current) {
      datZoom(pinch.current.scale * (khoangCach(e.touches) / pinch.current.d));
      return;
    }
    const c = cham.current;
    if (!c || c.huong === "zoom") return;
    const t = e.touches[0];
    const dx = t.clientX - c.x;
    const dy = t.clientY - c.y;

    // ĐANG PHÓNG TO → một ngón là DI CHUYỂN ẢNH (có giới hạn mép)
    if (scale > 1) {
      setPan(gioiHanPan({ x: panDau.current.x + dx, y: panDau.current.y + dy }, scale));
      return;
    }

    // Chưa zoom: quyết định hướng ngay từ 10px đầu rồi giữ nguyên hướng đó
    if (!c.huong && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
      c.huong = Math.abs(dx) > Math.abs(dy) ? "ngang" : "doc";
    }
    if (c.huong === "ngang") {
      // Chặn kéo quá mép ở ảnh đầu/cuối (cảm giác "cứng" như Facebook)
      const mep = (idx === 0 && dx > 0) || (idx === images.length - 1 && dx < 0);
      setKeo({ x: mep ? dx * 0.25 : dx, y: 0 });
    } else if (c.huong === "doc") {
      setKeo({ x: 0, y: dy });
    }
  }

  function chamKetThuc() {
    const c = cham.current;
    setMuot(true);
    pinch.current = null;

    if (c?.huong === "ngang") {
      const nguong = window.innerWidth * NGUONG_DOI_ANH;
      if (keo.x < -nguong && idx < images.length - 1) doiAnh(1);
      else if (keo.x > nguong && idx > 0) doiAnh(-1);
    } else if (c?.huong === "doc") {
      // Vuốt XUỐNG (hoặc lên) đủ xa → thoát về trang tin
      if (Math.abs(keo.y) > NGUONG_THOAT) { haptic(); dong(); return; }
    }
    setKeo({ x: 0, y: 0 });
    cham.current = null;
  }

  // Chạm 1 lần = ẩn/hiện thanh nút · chạm 2 lần nhanh = phóng to/thu nhỏ
  function chamMan() {
    const now = Date.now();
    if (now - lanCham.current < 280) {
      datZoom(scale > 1 ? 1 : 2.5);
      lanCham.current = 0;
      return;
    }
    lanCham.current = now;
    window.setTimeout(() => {
      if (lanCham.current && Date.now() - lanCham.current >= 280) setHienNut((v) => !v);
    }, 290);
  }

  async function chiaSe() {
    haptic();
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: title ?? "Coastal Land", url });
      else {
        await navigator.clipboard.writeText(url);
        alert("Đã chép đường dẫn để bạn gửi cho người khác.");
      }
    } catch {
      /* khách bấm huỷ chia sẻ — không báo lỗi */
    }
  }

  // Mờ dần khi kéo xuống (giống Facebook)
  const doMo = Math.min(1, Math.abs(keo.y) / 400);
  const tyLeThoat = 1 - doMo * 0.2;

  return (
    <div
      className="fixed inset-0 z-[90] select-none overscroll-contain"
      style={{
        background: `rgba(0,0,0,${dangDong ? 0 : 1 - doMo * 0.75})`,
        transition: muot ? "background 0.2s ease-out" : "none",
      }}
    >
      {/* ── DẢI ẢNH: cả bộ nằm ngang, dịch theo ngón tay ── */}
      <div
        ref={khung}
        className="absolute inset-0 flex touch-none"
        onTouchStart={chamBatDau}
        onTouchMove={chamDiChuyen}
        onTouchEnd={chamKetThuc}
        onClick={chamMan}
        style={{
          transform: `translate3d(${-idx * 100}%, 0, 0) translate3d(${keo.x}px, ${keo.y}px, 0) scale(${dangDong ? 0.85 : tyLeThoat})`,
          opacity: dangDong ? 0 : 1,
          transition: muot ? "transform 0.28s cubic-bezier(0.22,1,0.36,1), opacity 0.2s ease-out" : "none",
        }}
      >
        {images.map((src, i) => (
          <div key={i} className="flex h-full w-full shrink-0 items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={i === idx ? anhRef : undefined}
              src={src}
              alt={captions?.[i] ?? `${title ?? "Ảnh"} ${i + 1}`}
              draggable={false}
              loading={Math.abs(i - idx) <= 1 ? "eager" : "lazy"}
              decoding="async"
              className="max-h-full max-w-full object-contain"
              style={
                i === idx
                  ? {
                      transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${scale})`,
                      transition: muot ? "transform 0.2s ease-out" : "none",
                    }
                  : undefined
              }
            />
          </div>
        ))}
      </div>

      {/* ── THANH TRÊN: quay lại · tiêu đề · số thứ tự · chia sẻ · trái tim ── */}
      <div
        className="absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/75 to-transparent pt-[env(safe-area-inset-top)] transition-opacity duration-200"
        style={{ opacity: hienNut && !dangDong ? 1 : 0, pointerEvents: hienNut ? "auto" : "none" }}
      >
        <div className="flex items-center gap-2 px-2 py-2.5">
          <button
            type="button"
            aria-label="Quay lại"
            onClick={(e) => { e.stopPropagation(); dong(); }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white active:bg-white/15"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="min-w-0 flex-1">
            {title && <p className="truncate text-[15px] font-semibold text-white">{title}</p>}
            <p className="text-xs text-white/75">{idx + 1} / {images.length}</p>
          </div>

          <button
            type="button"
            aria-label="Chia sẻ"
            onClick={(e) => { e.stopPropagation(); chiaSe(); }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white active:bg-white/15"
          >
            <svg className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 12v7a2 2 0 002 2h12a2 2 0 002-2v-7M16 6l-4-4-4 4M12 2v14" />
            </svg>
          </button>

          {listingId && (
            <button
              type="button"
              aria-label={daLuu ? "Bỏ lưu tin" : "Lưu tin"}
              onClick={(e) => { e.stopPropagation(); haptic(); toggle(listingId); }}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white active:bg-white/15"
            >
              <svg
                className={`h-[23px] w-[23px] transition-transform ${daLuu ? "scale-110 text-[#ff3b5c]" : ""}`}
                fill={daLuu ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth={1.9}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 20s-7-4.5-7-9.2A3.8 3.8 0 0 1 12 8a3.8 3.8 0 0 1 7 2.8C19 15.5 12 20 12 20z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── NÚT TRÁI/PHẢI: chỉ máy tính (điện thoại đã vuốt) ── */}
      {images.length > 1 && (
        <div className="hidden lg:block" style={{ opacity: hienNut ? 1 : 0 }}>
          {idx > 0 && (
            <button
              type="button"
              aria-label="Ảnh trước"
              onClick={(e) => { e.stopPropagation(); doiAnh(-1); }}
              className="absolute left-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-2xl text-white backdrop-blur transition hover:bg-white/30"
            >
              ‹
            </button>
          )}
          {idx < images.length - 1 && (
            <button
              type="button"
              aria-label="Ảnh sau"
              onClick={(e) => { e.stopPropagation(); doiAnh(1); }}
              className="absolute right-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-2xl text-white backdrop-blur transition hover:bg-white/30"
            >
              ›
            </button>
          )}
        </div>
      )}

      {/* ── CHÚ THÍCH ẢNH (nếu có) ── */}
      {captions?.[idx] && (
        <div
          className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/75 to-transparent px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-8 transition-opacity duration-200"
          style={{ opacity: hienNut && !dangDong ? 1 : 0 }}
        >
          <p className="text-center text-sm text-white">{captions[idx]}</p>
        </div>
      )}
    </div>
  );
}
