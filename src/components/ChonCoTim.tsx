"use client";

import { useEffect, useState } from "react";
import { normalizeVi } from "@/lib/filters";

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
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
  timPlaceholder: string;
  disabled?: boolean;
  className: string;
}) {
  const [mo, setMo] = useState(false);
  const [q, setQ] = useState("");
  useEffect(() => {
    if (!mo) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") setMo(false); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [mo]);
  const k = normalizeVi(q.trim());
  const ds = k ? options.filter((o) => normalizeVi(o).includes(k)) : options;
  const chon = (v: string) => { onChange(v); setMo(false); setQ(""); };
  return (
    <>
      <button type="button" onClick={() => setMo(true)} disabled={disabled} className={className + " flex items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:opacity-45"}>
        <span className={`truncate ${value ? "" : "text-cvr-faint"}`}>{value || placeholder}</span>
        <svg className="h-4 w-4 shrink-0 text-cvr-muted" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
      </button>
      {mo && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/40 sm:items-center" onClick={() => setMo(false)}>
          <div className="flex max-h-[80vh] w-full flex-col rounded-t-2xl bg-white pb-[env(safe-area-inset-bottom)] shadow-lux sm:max-w-md sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-cvr-line p-3">
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={timPlaceholder} className={className} />
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain py-1">
              {ds.map((o) => (
                <button key={o} type="button" onClick={() => chon(o)} className={`block w-full px-4 py-3 text-left text-[15px] transition hover:bg-cvr-surface ${o === value ? "font-semibold text-cvr-ink" : "text-cvr-body"}`}>
                  {o}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setMo(false)} className="border-t border-cvr-line py-3 text-sm font-semibold text-cvr-body">Đóng</button>
          </div>
        </div>
      )}
    </>
  );
}
