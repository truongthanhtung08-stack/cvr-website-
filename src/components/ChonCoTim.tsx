"use client";

import { useDiaDanh } from "@/lib/useDiaDanh";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { timDiaDanh, type BietDanh } from "@/lib/timDiaDanh";
import { useKhoaCuon, useNutQuayLai } from "@/lib/khoaCuon";
import { diTiepSauOChon } from "@/lib/oTiepTheo";

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
  khongTim,
  haiDong,
  nhom,
  nhanHien = (v: string) => v,
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
  /** Danh sách ngắn (Nhu cầu, Loại hình) → không có kính lúp (chủ dự án 22/10/2026: "có mấy loại thì tìm làm gì"). */
  khongTim?: boolean;
  /** Tên đã chọn dài (Tỉnh / Phường) → hiện tối đa 2 dòng thay vì cắt "…" (chủ dự án 23/10/2026: "chọn mà hiện hết tên lên"). */
  haiDong?: boolean;
  /** Danh sách theo NHÓM (Loại hình: Căn hộ · Nhà · Đất…, đúng bộ phân loại đã chốt ở lib/filters) → tên nhóm làm
   *  dòng tiêu đề, mục con nằm dưới; mục đang chọn có dấu ✓ ngay tại chỗ (22/10/2026). */
  nhom?: { label: string; items: string[] }[];
  /** Chữ hiện của một mục (giá trị lưu giữ nguyên) — VD loại hình "Đất nền / Đất nền dự án" hiện "Đất nền, đất nền dự án". */
  nhanHien?: (v: string) => string;
}) {
  useDiaDanh(); // địa danh nạp sau khi trang hiện — về tới thì vẽ lại (20/10/2026)
  const [mo, setMo] = useState(false);
  const laCham = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
  // MÁY TÍNH = XỔ NGAY DƯỚI Ô (chủ dự án 05/11/2026: "chuẩn PC"): danh sách bám đúng ô vừa bấm, rộng bằng ô. Danh sách là MỘT
  // PHẦN CỦA TRANG (đặt theo toạ độ trang, nằm DƯỚI thanh menu): khách lăn chuột thì trang cuộn, danh sách cuộn cùng ô; cuộn hết
  // danh sách lăn tiếp thì trang chạy tiếp; bấm ra ngoài là đóng. Không khoá cuộn, không giật.
  // Điện thoại (< 640px) giữ nguyên bảng trượt từ đáy, khoá trang nền — đã đúng chuẩn, không đổi.
  const [xo, setXo] = useState<{ top: number; left: number; width: number; maxH: number; len: boolean } | null>(null);
  useKhoaCuon(mo && !xo, () => dong());
  useNutQuayLai(mo && !!xo, () => dong());
  const bangRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!mo || !xo) return;
    const ngoai = (e: Event) => {
      const t = e.target as Node;
      if (!bangRef.current?.contains(t) && !nutRef.current?.contains(t)) dong();
    };
    // CHỈ ĐÓNG KHI ĐỔI BỀ NGANG (xoay máy, kéo cửa sổ). Bàn phím điện thoại bật lên chỉ đổi BỀ CAO — trước đây cũng đóng bảng nên
    // trên điện thoại chạm ô chọn là bảng mở rồi tự tắt, không chọn được gì (thử thật 05/11/2026).
    const ngangLuc = window.innerWidth;
    const dongNgay = () => { if (window.innerWidth !== ngangLuc) dong(); };
    document.addEventListener("mousedown", ngoai, true);
    window.addEventListener("resize", dongNgay);
    return () => {
      document.removeEventListener("mousedown", ngoai, true);
      window.removeEventListener("resize", dongNgay);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mo, xo]);
  const [q, setQ] = useState("");
  // Ô tìm ẨN mặc định (chủ dự án 15/10/2026): mở ra là danh sách để KÉO chọn — không bật bàn
  // phím che màn hình điện thoại. Muốn tìm thì bấm biểu tượng kính lúp mới hiện ô gõ.
  const [dangTim, setDangTim] = useState(false);
  const nutRef = useRef<HTMLButtonElement>(null);
  // Đóng bảng (chọn xong hoặc Quay lại) → bỏ dấu "mở bằng Tiếp"
  const dong = () => { setMo(false); setQ(""); setDangTim(false); if (nutRef.current) delete nutRef.current.dataset.tuTiep; };
  useEffect(() => {
    if (!mo) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") dong(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [mo]);
  // DANH SÁCH NGẮN (≤ 12 mục — Tình trạng nội thất, Hướng, Pháp lý…) tự KHÔNG có kính lúp, kéo chọn là đủ (chủ dự án 23/10/2026:
  // "nội thất có 3 mục, bố trí nút kính lúp vào làm gì"). Ô cần gõ để tự ghi (tuGhi) hoặc gõ ngay (timNgay) vẫn giữ ô tìm.
  const anTim = khongTim || (!tuGhi && !timNgay && options.length <= 12);
  const tim = timDiaDanh(q, options, bietDanh);
  // MỤC ĐANG CHỌN luôn GHIM DÒNG ĐẦU, trước mặt khách — cả lúc đang gõ tìm (chủ dự án 15/10/2026:
  // "bấm vào search sẽ hiện ra mục đã chọn trước mặt khách, rồi muốn search cái nào thì search").
  const coChon = !!value && options.includes(value);
  const ds = coChon ? tim.filter((x) => x.ten !== value) : tim;
  // Bảng mở bằng phím Tiếp (lib/oTiepTheo) → chọn xong đi tiếp tới ô sau, đúng trình tự (chủ dự án 23/10/2026)
  const chon = (v: string) => {
    const tuTiep = !!nutRef.current?.dataset.tuTiep;
    onChange(v);
    dong();
    if (tuTiep) requestAnimationFrame(() => { if (nutRef.current) diTiepSauOChon(nutRef.current); });
  };
  // Gõ tên KHÔNG có trong danh sách → dòng "Khác — tự ghi: «tên»": có gợi ý thì đứng CUỐI (như
  // Batdongsan), không có gợi ý nào thì đứng ĐẦU.
  const coTuGhi = !!tuGhi && !!q.trim() && !options.some((o) => o.toLowerCase() === q.trim().toLowerCase());
  const moBang = () => {
    if (mo && xo) return dong(); // bấm lại vào ô đang mở → đóng (như ô chọn chuẩn)
    const r = nutRef.current?.getBoundingClientRect();
    // ĐIỆN THOẠI (chạm hoặc < 640px) = BẢNG TRƯỢT TỪ ĐÁY như trước df72002 (05/11/2026 khuya): xổ tại chỗ trên điện thoại THẬT
    // không chọn được Tỉnh / Thành và mọi ô chọn (anh thử máy thật + web thật). Bảng trượt đáy phủ trên mọi lớp (z-90), khoá
    // trang nền — bản điện thoại đã chạy đúng trước đó. Máy tính giữ xổ ngay dưới ô.
    const laDienThoai = laCham || window.innerWidth < 640;
    if (r && !laDienThoai) {
      const width = Math.min(Math.max(r.width, 280), window.innerWidth - 16);
      const left = Math.max(8, Math.min(r.left, window.innerWidth - width - 8)) + window.scrollX;
      // Xổ XUỐNG (khách cuộn trang để xem hết); chỉ xổ LÊN khi sát cuối trang, phía dưới không còn chỗ để cuộn tới.
      const conDuoi = document.documentElement.scrollHeight - (r.bottom + window.scrollY) - 8;
      const len = conDuoi < 260 && r.top - 72 > conDuoi;
      setXo({ top: (len ? r.top - 4 : r.bottom + 4) + window.scrollY, left, width, maxH: 440, len }); // tới ~9 dòng hiện khít; dài hơn cuộn bên trong
    } else setXo(null);
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
        <button ref={nutRef} data-o-chon="" type="button" onClick={moBang} disabled={disabled} className={className + ` flex items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:opacity-45 ${xoaDuoc && value ? "pr-10" : ""}`}>
          <span className={`${haiDong ? "line-clamp-2 break-words py-1 leading-snug" : "truncate"} ${value ? "" : "text-cvr-faint"}`}>{value ? nhanHien(value) : placeholder}</span>
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
      {/* BẢNG VẼ RA NGOÀI CÙNG TRANG (portal, chủ dự án 05/11/2026 "bấm chọn, nó nhảy"): ô chọn nằm trong <label> (Field của
          form Admin) thì bảng vẽ bên trong label → bấm vào bảng, trình duyệt coi là bấm label, tự bấm lại nút mở bảng → bảng
          bật lại / nhảy. Vẽ thẳng vào <body> thì không còn nằm trong thẻ nào. */}
      {mo && createPortal(
        // ĐANG GÕ TÌM trên điện thoại → bảng thành TOÀN MÀN HÌNH, ô gõ nằm trên cùng: bàn phím bật lên
        // không che ô gõ, kết quả hiện ngay dưới (trước đây bảng nằm đáy, bàn phím đẩy lệch — rất rối).
        <div className={xo ? "absolute left-0 top-0 z-[44]" : `fixed inset-0 z-[90] flex justify-center bg-black/40 sm:items-center ${dangTim ? "items-stretch" : "items-end"}`} onClick={xo ? undefined : dong}>
          <div
            ref={bangRef}
            style={xo ? { position: "absolute", top: xo.top, left: xo.left, width: xo.width, maxHeight: xo.maxH, transform: xo.len ? "translateY(-100%)" : undefined } : undefined}
            className={xo ? "flex flex-col overflow-hidden rounded-xl border border-cvr-line bg-white shadow-lux" : `flex w-full flex-col bg-white pb-[env(safe-area-inset-bottom)] shadow-lux sm:h-auto sm:max-h-[80vh] sm:max-w-md sm:rounded-2xl ${dangTim ? "h-[100dvh] pt-[env(safe-area-inset-top)]" : "max-h-[80vh] rounded-t-2xl"}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* MÁY TÍNH (danh sách xổ dưới ô): GỌN như ô chọn chuẩn — không dòng tiêu đề "‹ Chọn…", không nút Đóng (đó là kiểu bảng
                điện thoại); bảng ngắn khít số dòng, bảng dài cuộn bên trong; danh sách cần tìm thì có ô tìm ở đầu (05/11/2026). */}
            {!(xo && anTim) && (
            <div className={xo ? "border-b border-cvr-line p-2" : "flex items-center gap-2 border-b border-cvr-line p-3"}>
              {/* THOÁT KHÔNG ĐỔI GÌ (chủ dự án 15/10/2026: "không chọn, không tự ghi thì thoát thế nào") —
                  nút quay lại luôn ở góc trên, bàn phím không che được như nút "Đóng" dưới đáy. */}
              {!xo && <button type="button" aria-label="Quay lại" onClick={dong} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-cvr-ink transition hover:bg-cvr-surface">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </button>}
              {dangTim || xo ? (
                // Điện thoại (chạm): KHÔNG tự bật ô gõ — mở ra là danh sách để kéo chọn, muốn tìm thì chạm ô gõ (chốt 15/10/2026)
                <input autoFocus={!xo || !laCham} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); xongGo(); } }} placeholder={timPlaceholder} className={className} enterKeyHint={tuGhi ? "done" : "search"} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} />
              ) : (
                <span className="min-w-0 flex-1 truncate px-1 text-[15px] font-semibold text-cvr-ink">{placeholder}</span>
              )}
              {!anTim && !xo && <button
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
              </button>}
            </div>
            )}
            {/* MỤC KHÔNG BẮT BUỘC (16/10/2026): đã chọn mà muốn bỏ → dòng "Bỏ chọn" ngay đầu bảng */}
            {xoaDuoc && value && (
              <button type="button" onClick={() => chon("")} className="flex w-full items-center gap-2 border-b border-cvr-line px-4 py-3 text-left text-[15px] font-medium text-cvr-body transition hover:bg-cvr-surface">
                <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                Bỏ chọn
              </button>
            )}
            {coChon && !nhom && (
              <button type="button" onClick={() => chon(value)} className="flex w-full items-center justify-between gap-3 border-b border-cvr-line bg-cvr-surface px-4 py-3 text-left text-[15px] font-semibold text-cvr-ink">
                <span className="min-w-0 truncate">{nhanHien(value)}</span>
                <svg className="h-5 w-5 shrink-0 text-cvr-blue-ink" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </button>
            )}
            {/* Máy tính: cuộn hết danh sách thì lăn tiếp là trang chạy tiếp (không chặn). Điện thoại: giữ trong bảng (trang nền đang khoá). */}
            <div className={`flex-1 overflow-y-auto py-1 ${xo ? "" : "overscroll-contain"}`}>
              {ds.length === 0 && coTuGhi && (
                <button type="button" onClick={() => { tuGhi?.(q.trim()); dong(); }} className="block w-full px-4 py-3 text-left text-[15px] font-medium text-cvr-blue-ink transition hover:bg-cvr-surface">
                  Khác — tự ghi: «{q.trim()}»
                </button>
              )}
              {nhom && !q.trim() ? nhom.map((g) => (
                <div key={g.label} className="pb-1">
                  <p className="px-4 pb-1 pt-3 text-[13px] font-semibold text-cvr-faint">{g.label}</p>
                  {g.items.map((o) => (
                    <button key={o} type="button" onClick={() => chon(o)} className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-[15px] transition hover:bg-cvr-surface ${o === value ? "font-semibold text-cvr-ink" : "text-cvr-body"}`}>
                      <span className="min-w-0 truncate">{nhanHien(o)}</span>
                      {o === value && <svg className="h-5 w-5 shrink-0 text-cvr-blue-ink" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    </button>
                  ))}
                </div>
              )) : ds.map(({ ten: o, boiTen }) => (
                <button key={o} type="button" onClick={() => chon(o)} className="block w-full px-4 py-3 text-left text-[15px] text-cvr-body transition hover:bg-cvr-surface">
                  {nhanHien(o)}
                  {boiTen && <span className="mt-0.5 block text-[12px] text-cvr-faint">{boiTen}</span>}
                </button>
              ))}
              {ds.length > 0 && coTuGhi && (
                <button type="button" onClick={() => { tuGhi?.(q.trim()); dong(); }} className="block w-full px-4 py-3 text-left text-[15px] font-medium text-cvr-blue-ink transition hover:bg-cvr-surface">
                  Khác — tự ghi: «{q.trim()}»
                </button>
              )}            </div>
            {!xo && <button type="button" onClick={dong} className="border-t border-cvr-line py-3 text-sm font-semibold text-cvr-body">Đóng</button>}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
