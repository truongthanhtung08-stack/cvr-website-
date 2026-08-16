"use client";

import { useEffect, useState } from "react";

// ============================================================================
// NÚT "CÀI ỨNG DỤNG" — thay cho 2 nút App Store / Google Play khi chưa có app
// trên kho. Bấm vào là cài COASTAL LAND lên màn hình chính, mở ra chạy toàn
// màn hình (không thanh trình duyệt) — nhìn và dùng như app thật.
//
// Chrome/Edge (Android + máy tính): cài được bằng đúng một cú bấm.
// Safari trên iPhone: Apple không cho tự cài → mở bảng hướng dẫn 3 bước.
// Đã cài rồi → nút tự ẩn.
// ============================================================================

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function InstallAppButton({ compact = false }: { compact?: boolean }) {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(standalone);
    setIsIOS(/iphone|ipad|ipod/i.test(navigator.userAgent));

    const onPrompt = (e: Event) => {
      e.preventDefault(); // giữ lại để tự bật khi người dùng bấm nút của mình
      setPrompt(e as InstallPrompt);
    };
    const onInstalled = () => {
      setInstalled(true);
      setSheet(false);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // Khoá cuộn nền khi mở bảng hướng dẫn
  useEffect(() => {
    if (!sheet) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sheet]);

  if (installed) return null;

  async function onClick() {
    if (prompt) {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === "accepted") setInstalled(true);
      setPrompt(null);
      return;
    }
    setSheet(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        aria-label="Cài ứng dụng COASTAL LAND lên màn hình chính"
        // Cùng kiểu viên đen với 2 nút kho ứng dụng để khung banner không đổi.
        className={`flex items-center rounded-xl bg-cvr-ink text-white shadow-sm transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-black active:scale-[0.98] ${
          compact ? "min-h-[38px] w-full max-w-[190px] gap-2 px-3" : "min-h-[46px] w-[196px] gap-2.5 px-3.5 py-2"
        }`}
      >
        <DownloadIcon className={compact ? "h-[18px] w-[18px] shrink-0" : "h-6 w-6 shrink-0"} />
        {compact ? (
          <span className="min-w-0 flex-1 whitespace-nowrap text-left text-[12px] font-semibold">
            Cài ứng dụng
          </span>
        ) : (
          <span className="flex flex-col text-left leading-tight">
            <span className="text-[10px] text-white/65">Cài lên màn hình chính</span>
            <span className="text-[13px] font-semibold">Cài ứng dụng</span>
          </span>
        )}
      </button>

      {sheet && <HowToSheet isIOS={isIOS} onClose={() => setSheet(false)} />}
    </>
  );
}

// ── Bảng hướng dẫn cài — trượt lên từ đáy trên điện thoại, hộp giữa trên máy tính
function HowToSheet({ isIOS, onClose }: { isIOS: boolean; onClose: () => void }) {
  const steps = isIOS
    ? [
        <>
          Bấm nút <b>Chia sẻ</b> <ShareIcon /> ở thanh công cụ Safari
        </>,
        <>
          Kéo xuống, chọn <b>Thêm vào MH chính</b>
        </>,
        <>
          Bấm <b>Thêm</b> ở góc trên bên phải
        </>,
      ]
    : [
        <>
          Mở <b>menu ⋮</b> của trình duyệt (góc trên bên phải)
        </>,
        <>
          Chọn <b>Cài đặt ứng dụng</b> hoặc <b>Thêm vào màn hình chính</b>
        </>,
        <>
          Xác nhận <b>Cài đặt</b>
        </>,
      ];

  return (
    <div
      className="cvr-sheet-scrim fixed inset-0 z-[70] flex items-end justify-center bg-black/40 backdrop-blur-[2px] sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Hướng dẫn cài ứng dụng"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="cvr-sheet w-full max-w-md rounded-t-3xl bg-white px-6 pb-[calc(28px+env(safe-area-inset-bottom))] pt-6 shadow-2xl sm:rounded-3xl sm:pb-7"
      >
        <div className="mx-auto mb-5 h-1 w-9 rounded-full bg-cvr-ink/15 sm:hidden" aria-hidden />
        <h3 className="text-[19px] font-semibold tracking-[-0.02em] text-cvr-ink">
          Cài COASTAL LAND lên máy
        </h3>
        <p className="mt-1.5 text-[14px] leading-relaxed text-cvr-muted">
          {isIOS
            ? "Trên iPhone cần thêm thủ công một lần. Sau đó mở như app thật, không có thanh trình duyệt."
            : "Chỉ mất vài giây. Sau đó mở như app thật, không có thanh trình duyệt."}
        </p>

        <ol className="mt-5 space-y-3.5">
          {steps.map((s, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cvr-blue/10 text-[12px] font-bold text-cvr-blue-ink">
                {i + 1}
              </span>
              <span className="text-[14px] leading-6 text-cvr-ink">{s}</span>
            </li>
          ))}
        </ol>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 h-12 w-full rounded-full bg-cvr-ink text-[15px] font-semibold text-white transition active:scale-[0.98]"
        >
          Đã hiểu
        </button>
      </div>
    </div>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.5v11m0 0l-4-4m4 4l4-4M4.5 16.5v2a2 2 0 002 2h11a2 2 0 002-2v-2" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg className="inline h-[15px] w-[15px] -translate-y-px text-cvr-blue" fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15.5V3.5m0 0L8.5 7M12 3.5L15.5 7M5.5 11v8a1.5 1.5 0 001.5 1.5h10a1.5 1.5 0 001.5-1.5v-8" />
    </svg>
  );
}
