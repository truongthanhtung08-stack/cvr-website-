"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useCompare } from "@/lib/useCompare";
// Nút Zalo trỏ về OA (có tick), không phải nick cá nhân — lý do xem lib/lienHe.ts
import { ZALO_OA_URL as ZALO_URL } from "@/lib/lienHe";

// ════════════════════════════════════════════════════════════════════════════
// NÚT CHAT NỔI — BẤM LÀ SANG THẲNG ZALO
//
// 20/8/2026: bỏ hẳn khung chat trả lời tự động (chủ dự án: "chatbot rất ngu và
// phiền"). GIỮ NGUYÊN giao diện nút như cũ — cùng vị trí, cùng màu, cùng icon,
// vẫn kéo–thả đổi chỗ được — chỉ đổi hành vi: bấm là mở Zalo của Coastal Land.
// Nhờ vậy khách nhắn thẳng cho người thật, không còn máy trả lời vòng vo.
// ════════════════════════════════════════════════════════════════════════════


// Trang ĐÃ CÓ thanh hành động bám đáy trên điện thoại (Gọi · Zalo ở trang chi
// tiết) — nút chat nổi đúng vùng đó sẽ đè lên, nên ẩn hẳn trên mobile.
const TRANG_CO_THANH_DAY = ["/bat-dong-san/"];

// Vị trí nút chat (khoảng cách tới mép PHẢI/DƯỚI màn hình). null = góc mặc định.
type ChatPos = { right: number; bottom: number };
const POS_KEY = "cl-chat-pos";
const BTN = 48; // đường kính nút (h-12)
const MARGIN = 8;

function clampBtn(p: ChatPos): ChatPos {
  return {
    right: Math.min(Math.max(p.right, MARGIN), Math.max(MARGIN, window.innerWidth - BTN - MARGIN)),
    bottom: Math.min(Math.max(p.bottom, MARGIN), Math.max(MARGIN, window.innerHeight - BTN - MARGIN)),
  };
}

export default function Chatbox() {
  const pathname = usePathname() || "/";
  const { count: soSanh } = useCompare();

  // ── ĐỠ VƯỚNG TRÊN ĐIỆN THOẠI ──────────────────────────────────────────────
  // (a) Ẩn nút khi màn hình đã có thanh bám đáy khác: thanh Gọi·Zalo ở trang chi
  //     tiết, hoặc thanh So sánh đang bật. Máy tính KHÔNG đổi (các thanh đó
  //     hoặc ẩn, hoặc nằm giữa màn hình nên không tranh chỗ với nút).
  const vuongMobile = TRANG_CO_THANH_DAY.some((p) => pathname.startsWith(p)) || soSanh > 0;

  // (b) Cuộn XUỐNG (đang đọc nội dung) → thu nút lại; cuộn LÊN → hiện lại.
  //     Chỉ áp cho mobile qua biến thể max-lg: bên dưới.
  const [anKhiCuon, setAnKhiCuon] = useState(false);
  useEffect(() => {
    let truoc = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - truoc) < 8) return; // bỏ qua rung nhỏ, tránh nhấp nháy
      setAnKhiCuon(y > truoc && y > 220);
      truoc = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const anTrenMobile = vuongMobile ? "hidden lg:flex" : "flex";
  // Nút chat KÉO–THẢ được để không che nội dung (yêu cầu 14/7). Vị trí lưu localStorage.
  const [pos, setPos] = useState<ChatPos | null>(null);
  const drag = useRef<{ startX: number; startY: number; base: ChatPos; moved: boolean } | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(POS_KEY);
      if (saved) setPos(clampBtn(JSON.parse(saved)));
    } catch { /* vị trí hỏng → dùng góc mặc định */ }
  }, []);

  const onBtnPointerDown = (e: React.PointerEvent) => {
    const base = pos ?? { right: 20, bottom: 20 };
    drag.current = { startX: e.clientX, startY: e.clientY, base, moved: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onBtnPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.startX;
    const dy = e.clientY - drag.current.startY;
    if (!drag.current.moved && Math.hypot(dx, dy) < 6) return; // chưa vượt ngưỡng → coi là bấm
    drag.current.moved = true;
    setPos(clampBtn({ right: drag.current.base.right - dx, bottom: drag.current.base.bottom - dy }));
  };
  const onBtnPointerUp = () => {
    if (!drag.current) return;
    const wasDrag = drag.current.moved;
    drag.current = null;
    if (wasDrag) {
      setPos((p) => {
        if (p) try { localStorage.setItem(POS_KEY, JSON.stringify(p)); } catch { /* bỏ qua */ }
        return p;
      });
    } else {
      // BẤM (không kéo) → mở Zalo ở tab mới
      window.open(ZALO_URL, "_blank", "noopener,noreferrer");
    }
  };

  return (
    /* Nút chat — GIỮ + KÉO để dời chỗ, BẤM để nhắn Zalo */
    <button
      type="button"
      aria-label="Nhắn tin cho Coastal Land qua Zalo (giữ và kéo để di chuyển)"
      onPointerDown={onBtnPointerDown}
      onPointerMove={onBtnPointerMove}
      onPointerUp={onBtnPointerUp}
      style={pos ? { right: pos.right, bottom: pos.bottom } : undefined}
      className={`float-above-tabbar fixed bottom-5 right-5 z-[60] ${anTrenMobile} h-12 w-12 touch-none select-none items-center justify-center rounded-full bg-cvr-blue text-white shadow-lg shadow-black/20 ring-1 ring-white/15 transition-[opacity,transform,background-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-cvr-blue-ink ${
        anKhiCuon
          ? "max-lg:pointer-events-none max-lg:scale-0 max-lg:opacity-0"
          : "opacity-100"
      }`}
    >
      {/* Icon Tin nhắn kiểu iMessage — bong bóng đặc, đuôi góc dưới-trái */}
      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2.25c-5.385 0-9.75 3.24-9.75 7.5 0 2.68 1.72 5.03 4.32 6.4-.14.86-.5 1.9-1.2 2.86a.375.375 0 0 0 .35.6c1.7-.2 3.06-.78 4.02-1.35.73.16 1.5.24 2.26.24 5.385 0 9.75-3.24 9.75-7.5S17.385 2.25 12 2.25Z" />
      </svg>
    </button>
  );
}
