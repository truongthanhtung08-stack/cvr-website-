"use client";

import { useDiaDanh } from "@/lib/useDiaDanh";
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
  tuGhi,
  timNgay,
  xoaDuoc,
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
  /** Có lối "Khác — tự ghi": gõ tìm mà không có trong danh sách thì bấm dòng này lấy luôn chữ vừa gõ. */
  tuGhi?: (ten: string) => void;
  /** Kiểu Ô "TÊN DỰ ÁN" của Batdongsan/Homedy: bấm vào là GÕ NGAY (mở thẳng ô tìm, sẵn chữ đang có). */
  timNgay?: boolean;
  /** Có nút × để bỏ giá trị đang có. */
  xoaDuoc?: boolean;
}) {
  useDiaDanh(); // địa danh nạp sau khi trang hiện — về tới thì vẽ lại (20/10/2026)
  const [mo, setMo] = useState(false);
  const [q, setQ] = useState("");
  // Ô tìm ẨN mặc định (chủ dự án 15/10/2026): mở ra là danh sách để KÉO chọn — không bật bàn
  // phím che màn hình điện thoại. Muốn tìm thì bấm biểu tượng kính lúp mới hiện ô gõ.
  const [dangTim, setDangTim] = useState(false);
  const dong = () => { setMo(false); setQ(""); setDangTim(false); };
  useEffect(() => {
    if (!mo) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") dong(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [mo]);
  const tim = timDiaDanh(q, options, bietDanh);
  // MỤC ĐANG CHỌN luôn GHIM DÒNG ĐẦU, trước mặt khách — cả lúc đang gõ tìm (chủ dự án 15/10/2026:
  // "bấm vào search sẽ hiện ra mục đã chọn trước mặt khách, rồi muốn search cái nào thì search").
  const coChon = !!value && options.includes(value);
  const ds = coChon ? tim.filter((x) => x.ten !== value) : tim;
  const chon = (v: string) => { onChange(v); dong(); };
  // Gõ tên KHÔNG có trong danh sách → dòng "Khác — tự ghi: «tên»": có gợi ý thì đứng CUỐI (như
  // Batdongsan), không có gợi ý nào thì đứng ĐẦU.
  const coTuGhi = !!tuGhi && !!q.trim() && !options.some((o) => o.toLowerCase() === q.trim().toLowerCase());
  const moBang = () => {
    setMo(true);
    if (timNgay) { setDangTim(true); setQ(value && !options.includes(value) ? value : ""); }
  };
  // Enter / "Tìm" trên bàn phím: trùng tên trong danh sách thì chọn mục đó, không thì lấy chữ vừa gõ.
  const xongGo = () => {
    const t = q.trim();
    if (!tuGhi || !t) return;
    const trung = options.find((o) => o.toLowerCase() === t.toLowerCase());
    if (trung) chon(trung);
    else { tuGhi(t); dong(); }
  };
  return (
    <>
      <div className="relative">
        <button type="button" onClick={moBang} disabled={disabled} className={className + ` flex items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:opacity-45 ${xoaDuoc && value ? "pr-10" : ""}`}>
          <span className={`truncate ${value ? "" : "text-cvr-faint"}`}>{value || placeholder}</span>
          {!(xoaDuoc && value) && (timNgay
            ? <svg className="h-4 w-4 shrink-0 text-cvr-muted" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden><circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="M21 21l-4.3-4.3" /></svg>
            : <svg className="h-4 w-4 shrink-0 text-cvr-muted" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>)}
        </button>
        {xoaDuoc && value && !disabled && (
          <button type="button" aria-label="Bỏ" onClick={() => onChange("")} className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-cvr-muted transition hover:bg-cvr-line/60">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}
      </div>
      {mo && (
        // ĐANG GÕ TÌM trên điện thoại → bảng thành TOÀN MÀN HÌNH, ô gõ nằm trên cùng: bàn phím bật lên
        // không che ô gõ, kết quả hiện ngay dưới (trước đây bảng nằm đáy, bàn phím đẩy lệch — rất rối).
        <div className={`fixed inset-0 z-[90] flex justify-center bg-black/40 sm:items-center ${dangTim ? "items-stretch" : "items-end"}`} onClick={dong}>
          <div className={`flex w-full flex-col bg-white pb-[env(safe-area-inset-bottom)] shadow-lux sm:h-auto sm:max-h-[80vh] sm:max-w-md sm:rounded-2xl ${dangTim ? "h-[100dvh] pt-[env(safe-area-inset-top)]" : "max-h-[80vh] rounded-t-2xl"}`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 border-b border-cvr-line p-3">
              {/* THOÁT KHÔNG ĐỔI GÌ (chủ dự án 15/10/2026: "không chọn, không tự ghi thì thoát thế nào") —
                  nút quay lại luôn ở góc trên, bàn phím không che được như nút "Đóng" dưới đáy. */}
              <button type="button" aria-label="Quay lại" onClick={dong} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-cvr-ink transition hover:bg-cvr-surface">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </button>
              {dangTim ? (
                <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); xongGo(); } }} placeholder={timPlaceholder} className={className} enterKeyHint={tuGhi ? "done" : "search"} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} />
              ) : (
                <span className="min-w-0 flex-1 truncate px-1 text-[15px] font-semibold text-cvr-ink">{placeholder}</span>
              )}
              <button
                type="button"
                aria-label={dangTim ? "Đóng ô tìm" : timPlaceholder}
                onClick={() => { if (timNgay) { dong(); return; } if (dangTim) setQ(""); setDangTim(!dangTim); }}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-cvr-body transition hover:bg-cvr-surface"
              >
                {dangTim ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden><circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="M21 21l-4.3-4.3" /></svg>
                )}
              </button>
            </div>
            {/* MỤC KHÔNG BẮT BUỘC (16/10/2026): đã chọn mà muốn bỏ → dòng "Bỏ chọn" ngay đầu bảng */}
            {xoaDuoc && value && (
              <button type="button" onClick={() => chon("")} className="flex w-full items-center gap-2 border-b border-cvr-line px-4 py-3 text-left text-[15px] font-medium text-cvr-body transition hover:bg-cvr-surface">
                <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                Bỏ chọn
              </button>
            )}
            {coChon && (
              <button type="button" onClick={() => chon(value)} className="flex w-full items-center justify-between gap-3 border-b border-cvr-line bg-cvr-surface px-4 py-3 text-left text-[15px] font-semibold text-cvr-ink">
                <span className="min-w-0 truncate">{value}</span>
                <svg className="h-5 w-5 shrink-0 text-cvr-blue-ink" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </button>
            )}
            <div className="flex-1 overflow-y-auto overscroll-contain py-1">
              {ds.length === 0 && coTuGhi && (
                <button type="button" onClick={() => { tuGhi?.(q.trim()); dong(); }} className="block w-full px-4 py-3 text-left text-[15px] font-medium text-cvr-blue-ink transition hover:bg-cvr-surface">
                  Khác — tự ghi: «{q.trim()}»
                </button>
              )}
              {ds.map(({ ten: o, boiTen }) => (
                <button key={o} type="button" onClick={() => chon(o)} className="block w-full px-4 py-3 text-left text-[15px] text-cvr-body transition hover:bg-cvr-surface">
                  {o}
                  {boiTen && <span className="mt-0.5 block text-[12px] text-cvr-faint">{boiTen}</span>}
                </button>
              ))}
              {ds.length > 0 && coTuGhi && (
                <button type="button" onClick={() => { tuGhi?.(q.trim()); dong(); }} className="block w-full px-4 py-3 text-left text-[15px] font-medium text-cvr-blue-ink transition hover:bg-cvr-surface">
                  Khác — tự ghi: «{q.trim()}»
                </button>
              )}
            </div>
            <button type="button" onClick={dong} className="border-t border-cvr-line py-3 text-sm font-semibold text-cvr-body">Đóng</button>
          </div>
        </div>
      )}
    </>
  );
}
