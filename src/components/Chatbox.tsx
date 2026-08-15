"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useCompare } from "@/lib/useCompare";

type Msg = { from: "bot" | "user"; text: string };

// Trang ĐÃ CÓ thanh hành động bám đáy trên điện thoại (Gọi · Zalo ở trang chi
// tiết) — nút chat nổi đúng vùng đó sẽ đè lên, nên ẩn hẳn trên mobile.
const TRANG_CO_THANH_DAY = ["/bat-dong-san/"];

// ĐÚNG 3 chức năng bên vận hành hỗ trợ (chủ dự án chốt 15/8/2026) + lối gặp người thật.
// KHÔNG thêm chủ đề nào nghe như môi giới/tư vấn mua hộ — xem autoReply bên dưới.
const quickReplies = [
  "Báo giá dịch vụ",
  "Hỗ trợ đăng tin mua bán, cho thuê",
  "Hỗ trợ kỹ thuật",
  "Gặp chuyên viên Coastal Land",
];

// Trả lời tự động (sẽ nối Claude API / Zalo OA sau).
// ⚠️ Coastal Land là CỔNG THÔNG TIN — bên vận hành CHỈ làm 3 việc: báo giá dịch
// vụ · hỗ trợ đăng tin mua bán/cho thuê · hỗ trợ kỹ thuật. Tuyệt đối không hứa
// tìm nhà hộ, tư vấn mua, ký gửi hay môi giới. Thứ tự if xếp từ CỤ THỂ → CHUNG.
function autoReply(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("kỹ thuật") || t.includes("lỗi") || t.includes("không đăng được") || t.includes("tài khoản") || t.includes("mật khẩu"))
    return "Dạ, bên em hỗ trợ kỹ thuật cho tài khoản và tin đăng. Anh/chị mô tả giúp em lỗi đang gặp (kèm ảnh chụp màn hình nếu có), hoặc gọi 0377 985 036 để được xử lý ngay ạ.";
  if (t.includes("báo giá") || t.includes("bảng giá") || t.includes("giá dịch vụ") || t.includes("gói"))
    return "Coastal Land có các gói đăng tin từ Tin thường đến VIP, gói đẩy tin và banner quảng bá. Anh/chị xem bảng giá tại coastalland.vn/bao-gia-dang-tin, hoặc để lại số điện thoại để chuyên viên gửi báo giá chi tiết ạ.";
  // Bắt cả "ký gửi" (người dùng hay gõ) nhưng trả lời ĐÚNG vai trò: hỗ trợ ĐĂNG TIN.
  if (t.includes("đăng tin") || t.includes("ký gửi") || t.includes("bán") || t.includes("cho thuê"))
    return "Bên em hỗ trợ anh/chị đăng tin mua bán, cho thuê lên Coastal Land để tiếp cận người mua. Anh/chị đăng trực tiếp tại coastalland.vn/dang-tin, hoặc để lại số điện thoại — chuyên viên sẽ hướng dẫn từng bước ạ.";
  if (t.includes("mua") || t.includes("tìm") || t.includes("tư vấn"))
    return "Người tìm mua dùng Coastal Land hoàn toàn miễn phí ạ. Anh/chị lọc theo khu vực, loại hình và mức giá ngay trên trang, rồi liên hệ trực tiếp người đăng tin. Cần hướng dẫn cách lọc thì em chỉ giúp mình nhé.";
  if (t.includes("chuyên viên") || t.includes("gặp") || t.includes("gọi"))
    return "Em kết nối anh/chị với chuyên viên ngay. Hotline · Zalo: 0377 985 036 — hoặc để lại số, bên em gọi lại trong 5 phút ạ.";
  return "Cảm ơn anh/chị đã nhắn tin cho Coastal Land. Bên em hỗ trợ: báo giá dịch vụ · đăng tin mua bán, cho thuê · hỗ trợ kỹ thuật. Anh/chị cần việc nào, hoặc để lại số điện thoại để chuyên viên gọi lại ạ.";
}

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
  const [open, setOpen] = useState(false);
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
    if (open) { setAnKhiCuon(false); return; }
    let truoc = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - truoc) < 8) return; // bỏ qua rung nhỏ, tránh nhấp nháy
      setAnKhiCuon(y > truoc && y > 220);
      truoc = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [open]);

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
      setOpen((v) => !v);
    }
  };

  // Khung chat mở cạnh nút — kẹp lại để luôn nằm trọn trong màn hình.
  const panelStyle = (() => {
    if (!pos || typeof window === "undefined") return undefined;
    const w = Math.min(360, window.innerWidth - 40);
    const h = Math.min(520, window.innerHeight - 40);
    return {
      right: Math.min(Math.max(pos.right, MARGIN), Math.max(MARGIN, window.innerWidth - w - MARGIN)),
      bottom: Math.min(Math.max(pos.bottom, MARGIN), Math.max(MARGIN, window.innerHeight - h - MARGIN)),
    } as React.CSSProperties;
  })();
  const [messages, setMessages] = useState<Msg[]>([
    {
      from: "bot",
      text: "Xin chào 👋 Coastal Land có thể giúp gì cho anh/chị? Chọn nhanh một chủ đề bên dưới hoặc nhập câu hỏi.",
    },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  function send(text: string) {
    const value = text.trim();
    if (!value) return;
    setMessages((m) => [...m, { from: "user", text: value }]);
    setInput("");
    setTimeout(() => {
      setMessages((m) => [...m, { from: "bot", text: autoReply(value) }]);
    }, 500);
  }

  return (
    <>
      {/* Nút mở chat — GIỮ + KÉO để dời chỗ, BẤM để mở */}
      <button
        type="button"
        aria-label="Mở chat trực tuyến (giữ và kéo để di chuyển)"
        onPointerDown={onBtnPointerDown}
        onPointerMove={onBtnPointerMove}
        onPointerUp={onBtnPointerUp}
        style={pos ? { right: pos.right, bottom: pos.bottom } : undefined}
        className={`float-above-tabbar fixed bottom-5 right-5 z-[60] ${anTrenMobile} h-12 w-12 touch-none select-none items-center justify-center rounded-full bg-cvr-blue text-white shadow-lg shadow-black/20 ring-1 ring-white/15 transition-[opacity,transform,background-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-cvr-blue-ink ${
          open
            ? "pointer-events-none scale-0 opacity-0"
            : anKhiCuon
              ? "max-lg:pointer-events-none max-lg:scale-0 max-lg:opacity-0"
              : "opacity-100"
        }`}
      >
        {/* Icon Tin nhắn kiểu iMessage — bong bóng đặc, đuôi góc dưới-trái */}
        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2.25c-5.385 0-9.75 3.24-9.75 7.5 0 2.68 1.72 5.03 4.32 6.4-.14.86-.5 1.9-1.2 2.86a.375.375 0 0 0 .35.6c1.7-.2 3.06-.78 4.02-1.35.73.16 1.5.24 2.26.24 5.385 0 9.75-3.24 9.75-7.5S17.385 2.25 12 2.25Z" />
        </svg>
      </button>

      {/* Khung chat — mở tại vị trí nút (đã kéo tới đâu thì mở ở đó, kẹp trong màn hình) */}
      <div
        className={`float-above-tabbar fixed bottom-5 right-5 z-[60] ${anTrenMobile} w-[min(360px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-none border border-cvr-line bg-white shadow-2xl shadow-black/15 transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          open ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none translate-y-4 scale-95 opacity-0"
        }`}
        // dvh: chiều cao THẬT của khung nhìn trên di động (100vh bị thanh địa chỉ ăn mất)
        style={{ height: "min(520px, calc(100dvh - var(--tabbar-h) - 2.5rem))", ...panelStyle }}
      >
        {/* Tiêu đề */}
        <div className="flex items-center justify-between gap-3 border-b border-cvr-line bg-white px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-cvr-ink text-sm font-bold text-white">
              CVR
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-cvr-ink">Coastal Land</p>
              <p className="text-[11px] text-green-600">Đang trực tuyến</p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Đóng chat"
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-cvr-muted transition-colors hover:bg-black/5 hover:text-cvr-ink"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nội dung tin nhắn */}
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-none px-3.5 py-2 text-sm leading-relaxed ${
                  m.from === "user"
                    ? "bg-cvr-blue text-white"
                    : "bg-cvr-surface text-cvr-body"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}

          {/* Gợi ý nhanh — chỉ hiện khi mới mở */}
          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {quickReplies.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => send(q)}
                  className="rounded-full border border-cvr-line px-3 py-1.5 text-xs text-cvr-body transition-colors hover:border-cvr-ink/40 hover:bg-black/5 hover:text-cvr-ink"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Ô nhập */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-center gap-2 border-t border-cvr-line bg-white px-3 py-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Nhập tin nhắn…"
            className="h-10 flex-1 rounded-lg border border-cvr-line bg-cvr-surface px-3 text-sm text-cvr-ink placeholder-cvr-faint outline-none transition focus:border-cvr-blue/50 focus:bg-white"
          />
          <button
            type="submit"
            aria-label="Gửi"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cvr-blue text-white transition-transform hover:bg-cvr-blue-ink hover:scale-105 active:scale-95"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </form>
      </div>
    </>
  );
}

