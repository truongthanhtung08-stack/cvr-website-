"use client";

import { useEffect, useRef, useState } from "react";

type Msg = { from: "bot" | "user"; text: string };

const quickReplies = [
  "Tôi muốn tư vấn mua nhà",
  "Bảng giá đăng tin",
  "Ký gửi bán bất động sản",
  "Gặp chuyên viên Coastal Land",
];

// Trả lời tự động đơn giản (sẽ nối Claude API / Zalo OA sau)
function autoReply(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("giá") || t.includes("đăng tin"))
    return "Coastal Land có các gói đăng tin từ Tin thường đến VIP. Anh/chị để lại số điện thoại, chuyên viên sẽ gửi bảng báo giá chi tiết ngay ạ.";
  if (t.includes("mua") || t.includes("tư vấn"))
    return "Dạ, anh/chị quan tâm khu vực và loại hình nào (căn hộ, đất nền, nhà phố, villa…)? Em sẽ lọc các bất động sản phù hợp giúp mình.";
  if (t.includes("ký gửi") || t.includes("bán"))
    return "Coastal Land hỗ trợ ký gửi & rao bán bất động sản. Anh/chị cho em xin địa chỉ và mức giá mong muốn nhé.";
  if (t.includes("chuyên viên") || t.includes("gặp") || t.includes("gọi"))
    return "Em kết nối anh/chị với chuyên viên ngay. Hotline: 0905 xxx xxx — hoặc để lại số, bên em gọi lại trong 5 phút ạ.";
  return "Cảm ơn anh/chị đã nhắn tin cho Coastal Land. Anh/chị để lại số điện thoại hoặc nội dung cần hỗ trợ, chuyên viên sẽ phản hồi sớm nhất ạ.";
}

export default function Chatbox() {
  const [open, setOpen] = useState(false);
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
      {/* Nút mở chat */}
      <button
        type="button"
        aria-label="Mở chat trực tuyến"
        onClick={() => setOpen((v) => !v)}
        className={`fixed bottom-5 right-5 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-white text-cvr-ink shadow-xl shadow-black/40 transition-all duration-300 hover:scale-105 active:scale-95 ${
          open ? "rotate-90 opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        {/* Nhịp phát sáng thu hút */}
        <span className="absolute inset-0 animate-ping rounded-full bg-white/40" style={{ animationDuration: "2.5s" }} />
        <svg className="relative h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12a8 8 0 01-11.4 7.2L3 21l1.8-6.6A8 8 0 1121 12z" />
        </svg>
      </button>

      {/* Khung chat */}
      <div
        className={`fixed bottom-5 right-5 z-[60] flex w-[min(360px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-white/12 bg-cvr-charcoal shadow-2xl shadow-black/50 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          open ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none translate-y-4 scale-95 opacity-0"
        }`}
        style={{ height: "min(520px, calc(100vh - 2.5rem))" }}
      >
        {/* Tiêu đề */}
        <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-cvr-ink px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-bold text-cvr-ink">
              CVR
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-cvr-ink bg-green-400" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-white">Coastal Land</p>
              <p className="text-[11px] text-green-400">Đang trực tuyến</p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Đóng chat"
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/10 hover:text-white"
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
                className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                  m.from === "user"
                    ? "rounded-br-sm bg-white text-cvr-ink"
                    : "rounded-bl-sm bg-white/8 text-white/90"
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
                  className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/80 transition-colors hover:border-white/40 hover:bg-white/5 hover:text-white"
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
          className="flex items-center gap-2 border-t border-white/10 bg-cvr-ink px-3 py-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Nhập tin nhắn…"
            className="h-10 flex-1 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white placeholder-white/40 outline-none transition focus:border-white/40 focus:bg-white/10"
          />
          <button
            type="submit"
            aria-label="Gửi"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-cvr-ink transition-transform hover:scale-105 active:scale-95"
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

