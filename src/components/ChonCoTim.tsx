"use client";

import { useEffect, useState } from "react";
import { timDiaDanh, type BietDanh } from "@/lib/timDiaDanh";

// Ô CHỌN CÓ Ô TÌM — Tỉnh/Thành · Quận/Huyện · Phường/Xã (chủ dự án 14–15/10/2026: danh sách
// quá dài, không ai kéo xuống để chọn được). Thẻ select gốc không chèn được ô tìm, nên bấm
// vào mở bảng riêng: ô tìm trên cùng (gõ không dấu vẫn ra), danh sách bên dưới.
// Dùng chung cho trang đăng tin của khách và trang admin.
// ⛔ Khai báo ở MỨC TỆP — đặt trong thân component khác thì gõ một ký tự là mất con trỏ.
export default function ChonCoTim({
  value,
  onChange,
  options,
  placeholder,
  timPlaceholder,
  disabled,
  className,
  bietDanh,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
  timPlaceholder: string;
  disabled?: boolean;
  className: string;
  /** Tên khác của từng mục (tên cũ, tên gọi quen) — gõ tên đó vẫn ra mục này. */
  bietDanh?: Record<string, BietDanh[]>;
}) {
  const [mo, setMo] = useState(false);
  const [q, setQ] = useState("");
  // Ô tìm ẨN mặc định (chủ dự án 15/10/2026): mở ra là danh sách để KÉO chọn — không bật bàn
  // phím che màn hình điện thoại. Muốn tìm thì bấm biểu tượng kính lúp mới hiện ô gõ.
  const [dangTim, setDangTim] = useState(false);
  useEffect(() => {
    if (!mo) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") dong(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [mo]);
  const tim = timDiaDanh(q, options, bietDanh);
  // Mục ĐANG CHỌN luôn nằm DÒNG ĐẦU khi mở lại (chưa gõ tìm) — khách thấy ngay mình đang chọn gì.
  const ds = !q.trim() && value && options.includes(value) ? [{ ten: value }, ...tim.filter((x) => x.ten !== value)] : tim;
  const dong = () => { setMo(false); setQ(""); setDangTim(false); };
  const chon = (v: string) => { onChange(v); dong(); };
  return (
    <>
      <button type="button" onClick={() => setMo(true)} disabled={disabled} className={className + " flex items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:opacity-45"}>
        <span className={`truncate ${value ? "" : "text-cvr-faint"}`}>{value || placeholder}</span>
        <svg className="h-4 w-4 shrink-0 text-cvr-muted" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
      </button>
      {mo && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/40 sm:items-center" onClick={dong}>
          <div className="flex max-h-[80vh] w-full flex-col rounded-t-2xl bg-white pb-[env(safe-area-inset-bottom)] shadow-lux sm:max-w-md sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 border-b border-cvr-line p-3">
              {dangTim ? (
                <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={timPlaceholder} className={className} />
              ) : (
                <span className="min-w-0 flex-1 truncate px-1 text-[15px] font-semibold text-cvr-ink">{placeholder}</span>
              )}
              <button
                type="button"
                aria-label={dangTim ? "Đóng ô tìm" : timPlaceholder}
                onClick={() => { if (dangTim) setQ(""); setDangTim(!dangTim); }}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-cvr-body transition hover:bg-cvr-surface"
              >
                {dangTim ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden><circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="M21 21l-4.3-4.3" /></svg>
                )}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain py-1">
              {ds.map(({ ten: o, boiTen }) => (
                <button key={o} type="button" onClick={() => chon(o)} className={`block w-full px-4 py-3 text-left text-[15px] transition hover:bg-cvr-surface ${o === value ? "font-semibold text-cvr-ink" : "text-cvr-body"}`}>
                  {o}
                  {boiTen && <span className="mt-0.5 block text-[12px] text-cvr-faint">{boiTen}</span>}
                </button>
              ))}
            </div>
            <button type="button" onClick={dong} className="border-t border-cvr-line py-3 text-sm font-semibold text-cvr-body">Đóng</button>
          </div>
        </div>
      )}
    </>
  );
}
