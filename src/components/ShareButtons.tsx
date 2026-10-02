"use client";

import { useEffect, useRef, useState } from "react";

// Nút CHIA SẺ tin — Zalo · Facebook · khay chia sẻ của máy · sao chép link.
// Ưu tiên MOBILE: bấm là hiện bảng chọn đủ lớn để chạm bằng ngón tay (44px),
// không dùng hover. Link chia sẻ lấy đúng địa chỉ trang đang xem.
export default function ShareButtons({ title }: { title: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [chepZalo, setChepZalo] = useState(false);
  const [url, setUrl] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);

  // Địa chỉ trang chỉ có ở trình duyệt (không có khi render phía máy chủ)
  useEffect(() => setUrl(window.location.href), []);

  // Chạm ra ngoài / bấm Esc → đóng bảng chọn
  useEffect(() => {
    if (!open) return;
    const ngoai = (e: MouseEvent | TouchEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", ngoai);
    document.addEventListener("touchstart", ngoai);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", ngoai);
      document.removeEventListener("touchstart", ngoai);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const enc = encodeURIComponent(url);

  // Máy có khay chia sẻ sẵn (điện thoại) → dùng luôn, khách chọn được MỌI ứng dụng
  // đang cài (Zalo, Messenger, Telegram, tin nhắn…) thay vì chỉ 2 lựa chọn.
  // Máy có khay chia sẻ sẵn không (điện thoại gần như luôn có).
  const coKhay = () => typeof navigator !== "undefined" && typeof navigator.share === "function";

  async function khayHeThong() {
    try {
      await navigator.share({ title, url });
      setOpen(false);
    } catch {
      /* khách bấm huỷ — không làm gì */
    }
  }

  async function chepLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* trình duyệt chặn clipboard — bỏ qua */
    }
  }

  // CHIA SẺ QUA ZALO — đúng cách bộ mã chính thức của Zalo (sp.zalo.me/plugins/sdk.js) làm:
  //   · Android → lệnh chia sẻ của máy gửi thẳng vào app Zalo
  //   · iPhone  → khung chia sẻ của app Zalo (zaloshareext://)
  //   · Máy tính → Zalo không có địa chỉ chia sẻ cho web (zalo.me/share/link cũ trả về
  //     trang "không tìm thấy") → chép sẵn link rồi mở Zalo Web để khách dán vào chat.
  async function quaZalo() {
    const ua = navigator.userAgent;
    if (/Android/i.test(ua)) {
      setOpen(false);
      window.location.href = `intent://zaloapp.com/#Intent;action=android.intent.action.SEND;type=text/plain;S.android.intent.extra.SUBJECT=;S.android.intent.extra.TEXT=${enc};B.hidePostFeed=false;B.backToSource=true;end`;
      return;
    }
    if (/iPhone|iPad|iPod/i.test(ua)) {
      setOpen(false);
      window.location.href = `zaloshareext://shareext?url=${enc}&type=8&version=1`;
      return;
    }
    // Chép TRƯỚC khi mở tab mới — trang mất focus thì trình duyệt chặn ghi clipboard.
    try {
      await navigator.clipboard.writeText(url);
      setChepZalo(true);
      setTimeout(() => setChepZalo(false), 3000);
    } catch {
      /* trình duyệt chặn clipboard — bỏ qua */
    }
    window.open("https://chat.zalo.me/", "_blank", "noopener,noreferrer");
  }

  const muc =
    "flex min-h-[44px] w-full items-center gap-3 px-4 text-sm font-medium text-cvr-body transition hover:bg-cvr-surface active:bg-cvr-surface";

  return (
    <div ref={boxRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => {
          // ĐIỆN THOẠI: bật thẳng khay chia sẻ của máy — trong đó có sẵn Zalo,
          // Messenger, Facebook, tin nhắn… và bấm vào là VÀO ĐÚNG APP kèm link.
          // Web không có quyền mở thẳng một app cụ thể kèm nội dung, nên đi qua
          // khay hệ thống là đường ngắn nhất tới đúng app khách muốn.
          // MÁY TÍNH (không có khay) mới mở danh sách Zalo · Facebook · Sao chép.
          if (coKhay()) { khayHeThong(); return; }
          setOpen((v) => !v);
        }}
        aria-expanded={open}
        aria-label="Chia sẻ tin này"
        className="inline-flex min-h-[36px] items-center justify-center gap-1.5 rounded-full border border-cvr-line bg-white px-3.5 text-[13px] font-semibold text-cvr-body transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:border-cvr-ink hover:text-cvr-ink"
      >
        <svg className="h-[17px] w-[17px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.7 10.7a3 3 0 100 2.6m0-2.6l6.6-3.4m-6.6 6l6.6 3.4M18 8a3 3 0 100-6 3 3 0 000 6zm0 14a3 3 0 100-6 3 3 0 000 6z" />
        </svg>
        Chia sẻ
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-30 w-60 overflow-hidden rounded-2xl border border-cvr-line bg-white py-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.16)]">
          <button type="button" onClick={quaZalo} className={muc}>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0068ff] text-[11px] font-bold text-white">Za</span>
            {chepZalo ? "Đã chép link — dán vào Zalo" : "Chia sẻ qua Zalo"}
          </button>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${enc}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className={muc}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1877f2] text-white">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.55-1.5h1.65V3.6c-.29-.04-1.27-.12-2.41-.12-2.38 0-4.01 1.45-4.01 4.12v2.3H7.6V13h2.68v8h3.22z" /></svg>
            </span>
            Chia sẻ qua Facebook
          </a>
          {typeof navigator !== "undefined" && "share" in navigator && (
            <button type="button" onClick={khayHeThong} className={muc}>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cvr-surface text-cvr-body ring-1 ring-cvr-line">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0-12L8 8m4-4l4 4M5 15v3a2 2 0 002 2h10a2 2 0 002-2v-3" /></svg>
              </span>
              Ứng dụng khác…
            </button>
          )}
          <button type="button" onClick={chepLink} className={muc}>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cvr-surface text-cvr-body ring-1 ring-cvr-line">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.8 10.2a4 4 0 010 5.6l-2.6 2.6a4 4 0 01-5.6-5.6l1.3-1.3m3.3-3.3l1.3-1.3a4 4 0 015.6 5.6l-2.6 2.6" /></svg>
            </span>
            {copied ? "Đã sao chép link" : "Sao chép link"}
          </button>
        </div>
      )}
    </div>
  );
}
