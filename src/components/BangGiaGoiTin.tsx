"use client";

import { useState } from "react";
import type { Plan } from "@/lib/billing";
import { vnd } from "@/lib/billing";
import { getTier, type TierId } from "@/lib/packages";
import { tachThue, THUE_SUAT_GTGT } from "@/lib/thue";
import { useQuyDinhGia } from "@/lib/useQuyDinhGia";
import { useKhoaCuon } from "@/lib/khoaCuon";

// ============================================================================
// BẢNG GIÁ GÓI TIN KIỂU BATDONGSAN (chốt 01/10/2026) — MỘT bảng dùng chung:
//   · trang Báo giá  → chỉ xem
//   · form đăng tin  → bấm ô nào là chọn đúng loại tin + số ngày đó
// Hàng = số ngày · Cột = loại tin (Thường → Bạc → Vàng → Kim cương) · ô không bán = "–".
// % giảm so với đơn giá/ngày của mốc ngắn nhất cùng loại tin. Nút gạt "Giá bao gồm VAT".
// Giá CHỈ từ admin (plans truyền vào = bảng giá theo mục đích của admin).
// ============================================================================

const THU_TU: TierId[] = ["basic", "silver", "gold", "diamond"];

export default function BangGiaGoiTin({
  plans,
  chon,
  onChon,
  onBoChon,
  onXemBangQuyenLoi,
  trangBaoGia,
  dacDiem,
}: {
  plans: Plan[];
  chon?: { tier: TierId | ""; days: number };
  onChon?: (tier: TierId, days: number) => void;
  /** Bấm lại ô đang chọn → bỏ chọn gói (chủ dự án 10/10/2026) */
  onBoChon?: () => void;
  /** Đang ở trang đăng tin → mở bảng quyền lợi nổi tại chỗ thay vì sang tab mới (14/10/2026) */
  onXemBangQuyenLoi?: () => void;
  /** Trang Báo giá: bảng so sánh + quyền lợi nằm ngay dưới, quy định gom ở mục Quy định chung → không nút "Đặc điểm"
   *  từng cột, không lặp danh sách quy định dưới bảng (chủ dự án 22/10/2026: "nhiều câu trùng, sắp xếp không logic"). */
  trangBaoGia?: boolean;
  /** Trang Báo giá: đặc điểm từng loại tin (bảng quyền lợi admin) nằm NGAY TRONG bảng giá, dưới các dòng giá — một bảng
   *  xem giá và so sánh, không lặp hàng tên loại tin (chủ dự án 22/10/2026 tối: "nội dung đã có, cấu trúc lại giao diện"). */
  dacDiem?: { ten: string; giaTri: Partial<Record<TierId, string>> }[];
}) {
  const [moQuyDinh, setMoQuyDinh] = useState(false);
  // Cấp tin đang mở xem mốc ngày (điện thoại). Mặc định = cấp đang có gói chọn.
  const [capXemChon, setCapXem] = useState<TierId | "" | null>(null);
  // Quy định đi kèm: CHỈ bản admin đã duyệt — chưa duyệt thì không hiện.
  const qd = useQuyDinhGia();
  const QUY_DINH = qd.quyDinhGoiTin;
  // Bấm "Đặc điểm" dưới tên cấp → xem mô tả quyền lợi + hiển thị của cấp đó (chủ dự án 10/10/2026)
  const [xemDacDiem, setXemDacDiem] = useState<TierId | null>(null);
  useKhoaCuon(!!xemDacDiem, () => setXemDacDiem(null));
  const cot = THU_TU.map((id) => plans.find((p) => p.tierId === id)).filter((p): p is Plan => Boolean(p));
  const hang = [...new Set(cot.flatMap((p) => p.terms.map((t) => t.days)))].sort((a, b) => a - b);
  // GIÁ LUÔN LÀ SỐ KHÁCH TRẢ (đã gồm VAT) — bỏ nút gạt VAT và số −% dưới giá ở mọi nơi (chủ dự án 22/10/2026 tối: "con số
  // dưới −% có tác dụng gì"; báo giá rối) → một dòng "Giá đã gồm 8% VAT" dưới bảng.
  const hienGia = (gia: number) => tachThue(gia).tongTra;


  const capXem: TierId | "" = capXemChon ?? (chon?.tier || "");
  if (!cot.length) return null;

  // Chưa có bảng giá đã duyệt → không bày bảng rỗng.
  if (!hang.length) return null;
  return (
    <div>
      {/* ĐIỆN THOẠI + ĐANG CHỌN GÓI (chủ dự án 22/10/2026: "thứ nhất chọn theo gói; muốn so sánh có nút khác; chọn thì xem
          lại nhanh, đơn giản để cân nhắc" — trang Báo giá đã có đủ thông tin). Bước 1: mỗi cấp tin một hàng (tên · hệ số · giá TỪ …).
          Bước 2: chạm một cấp → các mốc số ngày + giá đủ mở ngay dưới hàng đó; chạm mốc là chọn, chạm lại là bỏ.
          So sánh quyền lợi: nút "So sánh các gói" ở đầu khối. Mọi số từ admin. Máy tính giữ bảng.
          TRANG BÁO GIÁ / chỉ xem (không onChon): KIỂU MA TRẬN cả điện thoại lẫn máy tính, cùng kiểu bảng đẩy tin (chủ dự án 22/10/2026
          tối: "phần báo giá, kiểu ma trận là kiểu đẹp nhất" — bỏ kiểu mỗi cấp một hàng ở trang Báo giá). */}
      {onChon && (
          <div className="space-y-2 sm:hidden">
            {/* MỖI CẤP MỘT HÀNG, MỐC NGÀY MỞ NGAY DƯỚI HÀNG ĐÓ (chủ dự án 22/10/2026: 4 ô ở trên mà các mốc chạy xuống dưới cùng
                thì dễ hiểu nhầm của cấp nào). Các mốc xếp lưới, thấy hết, không phải vuốt. */}
            {cot.map((p) => {
              const t = getTier(p.tierId);
              const coPhi = p.terms.map((x) => x.price);
              const thapNhat = coPhi.length ? Math.min(...coPhi) : 0;
              const dang = capXem === p.tierId;
              const daChon = chon?.tier === p.tierId;
              const terms = [...p.terms].sort((a, b) => a.days - b.days);
              return (
                <div key={p.tierId} className={`rounded-2xl border bg-white transition ${daChon ? "border-cvr-blue ring-1 ring-cvr-blue" : dang ? "border-cvr-ink/30" : "border-cvr-line"}`}>
                  <button
                    type="button"
                    aria-expanded={dang}
                    onClick={() => setCapXem(dang ? "" : p.tierId)}
                    className="flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-tight" style={{ backgroundColor: t.accent, color: t.badgeText }}>{t.name}</span>
                      <span className="whitespace-nowrap text-[12px] font-semibold text-cvr-muted">{t.heSoText}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      {daChon && <span className="text-[13px] font-bold text-cvr-blue-ink" aria-label="Đang chọn">✓</span>}
                      <span className="whitespace-nowrap text-[13px] font-semibold tabular-nums text-cvr-ink">
                        {thapNhat > 0 ? `từ ${vnd(hienGia(thapNhat))}` : "0 ₫"}
                      </span>
                      <svg className={`h-4 w-4 text-cvr-muted transition ${dang ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                    </span>
                  </button>
                  {dang && (
                    <div className="grid grid-cols-3 gap-1.5 px-2.5 pb-2.5">
                      {terms.map((term) => {
                        const dangChon = chon?.tier === p.tierId && chon.days === term.days;
                        return (
                          <button
                            key={term.days}
                            type="button"
                            disabled={!onChon}
                            aria-pressed={dangChon}
                            onClick={() => onChon && (dangChon && onBoChon ? onBoChon() : onChon(p.tierId, term.days))}
                            className={`min-w-0 rounded-xl border px-1 py-2 text-center transition disabled:cursor-default ${dangChon ? "border-cvr-blue bg-cvr-blue/[0.08] ring-1 ring-cvr-blue" : "border-cvr-line bg-white"}`}
                          >
                            <span className="block text-[12px] text-cvr-body">{term.days} ngày</span>
                            <span className="mt-0.5 block whitespace-nowrap text-[12.5px] font-semibold tabular-nums text-cvr-ink">{term.price > 0 ? vnd(hienGia(term.price)) : "0 ₫"}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
      )}
      <div className={`${onChon ? "hidden sm:block" : ""} overflow-x-auto rounded-2xl border border-cvr-line bg-white shadow-lux`}>
        <table className={`w-full border-collapse text-sm ${dacDiem?.length ? "min-w-[776px] sm:min-w-[640px]" : "min-w-[520px]"}`}>
          <thead>
            <tr className="bg-cvr-surface">
              <th className={`sticky left-0 z-10 border-b border-cvr-line bg-cvr-surface px-3 py-3.5 text-left font-semibold text-cvr-ink sm:px-4 ${dacDiem?.length ? "w-[136px] sm:w-[24%]" : "w-[84px] whitespace-nowrap sm:w-[96px]"}`}>Thời gian</th>
              {cot.map((p) => {
                const t = getTier(p.tierId);
                return (
                  <th key={p.tierId} className={`border-b border-l border-cvr-line px-2 py-3.5 text-center sm:px-3 ${dacDiem?.length ? "min-w-[160px] sm:w-[19%] sm:min-w-0" : ""}`}>
                    <span
                      className="inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-tight sm:px-3 sm:text-xs"
                      style={{ backgroundColor: t.accent, color: t.badgeText }}
                    >
                      {t.name}
                    </span>
                    {/* Hệ số X dưới tên cấp + nút xem đặc điểm (chủ dự án 10/10/2026) */}
                    {/* Có dòng "Hệ số tiếp cận" trong bảng thì không lặp hệ số dưới tên */}
                    {!dacDiem?.length && <span className="mt-1 block text-[11px] font-semibold tracking-wide text-cvr-muted">{t.heSoText}</span>}
                    {!onChon && !trangBaoGia && (
                    <button type="button" onClick={() => setXemDacDiem(p.tierId)} className="mt-0.5 text-[11px] font-semibold text-cvr-blue-ink underline-offset-2 hover:underline">
                      Đặc điểm
                    </button>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {hang.map((ngay) => (
              <tr key={ngay} className="border-b border-cvr-line/70 last:border-0">
                <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-3 py-3 font-semibold text-cvr-body sm:px-4">{ngay} ngày</td>
                {cot.map((p) => {
                  const term = p.terms.find((x) => x.days === ngay);
                  if (!term) {
                    return <td key={p.tierId} className="border-l border-cvr-line/70 px-3 py-3 text-center text-cvr-faint">–</td>;
                  }
                  const dangChon = chon?.tier === p.tierId && chon.days === ngay;
                  // Hệ số tiếp cận X luôn hiện dưới mỗi mức giá (chủ dự án 09/10/2026)
                  const noiDung = (
                    <span className="flex flex-col items-center gap-0.5">
                      <span className="font-semibold tabular-nums text-cvr-ink">{term.price > 0 ? vnd(hienGia(term.price)) : "0 ₫"}</span>
                    </span>
                  );
                  return (
                    <td key={p.tierId} className="border-l border-cvr-line/70 p-1.5 text-center">
                      {onChon ? (
                        <button
                          type="button"
                          onClick={() => (dangChon && onBoChon ? onBoChon() : onChon(p.tierId, ngay))}
                          aria-pressed={dangChon}
                          className={`w-full rounded-xl border px-2 py-2.5 transition ${dangChon ? "border-cvr-ink bg-cvr-ink/[0.06] ring-2 ring-cvr-ink" : "border-cvr-line hover:border-cvr-ink"}`}
                        >
                          {noiDung}
                          {/* Nút chọn rõ ràng (chủ dự án 09/10/2026) */}
                          <span className={`mt-1.5 inline-flex h-7 items-center rounded-md px-3 text-[12px] font-semibold ${dangChon ? "border border-cvr-ink bg-white text-cvr-ink" : "bg-cvr-blue text-white"}`}>
                            {dangChon ? "Bỏ chọn" : "Chọn"}
                          </span>
                        </button>
                      ) : (
                        <div className="px-2 py-2.5">{noiDung}</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {!!dacDiem?.length && (
              <>
                <tr className="border-y border-cvr-line bg-cvr-surface">
                  <td colSpan={cot.length + 1} className="px-3 py-2.5 sm:px-4">
                    <span className="sticky left-3 text-[13px] font-semibold text-cvr-ink">Đặc điểm hiển thị</span>
                  </td>
                </tr>
                {dacDiem.map((r) => (
                  <tr key={r.ten} className="border-b border-cvr-line/70 last:border-0">
                    <td className="sticky left-0 z-10 bg-white px-3 py-3 text-[13px] font-medium leading-snug text-cvr-body sm:px-4 sm:text-sm">{r.ten}</td>
                    {cot.map((p) => {
                      const v = r.giaTri[p.tierId] ?? "";
                      return (
                        <td key={p.tierId} className={`border-l border-cvr-line/70 px-2 py-3 text-center text-[13px] leading-snug sm:px-3 ${v === "✓" ? "font-semibold text-cvr-ink" : "text-cvr-muted"}`}>{v}</td>
                      );
                    })}
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>
      {xemDacDiem && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 sm:items-center" onClick={() => setXemDacDiem(null)}>
          <div className="max-h-[80dvh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[16px] font-semibold text-cvr-ink">{getTier(xemDacDiem).name} · {getTier(xemDacDiem).heSoText}</p>
              <button type="button" aria-label="Đóng" onClick={() => setXemDacDiem(null)} className="flex h-8 w-8 items-center justify-center rounded-full text-cvr-ink">✕</button>
            </div>
            {[...(qd.quyenLoi[xemDacDiem]?.loiIch ?? []), ...(qd.quyenLoi[xemDacDiem]?.hienThi ?? [])].length > 0 ? (
              <ul className="mt-3 space-y-2 text-[14px] leading-relaxed text-cvr-body">
                {[...(qd.quyenLoi[xemDacDiem]?.loiIch ?? []), ...(qd.quyenLoi[xemDacDiem]?.hienThi ?? [])].map((x) => (
                  <li key={x} className="flex gap-2"><span className="text-cvr-gold-ink">✓</span><span>{x}</span></li>
                ))}
              </ul>
            ) : null}
            {onXemBangQuyenLoi ? (
              <button type="button" onClick={() => { setXemDacDiem(null); onXemBangQuyenLoi(); }} className="mt-4 inline-flex text-[13px] font-semibold text-cvr-blue-ink">Xem bảng quyền lợi đầy đủ →</button>
            ) : (
              // Đang ở trang Báo giá → ở lại trang, mở bảng ngay bên dưới (trước đây mở thêm tab mới của chính trang này, tới nơi
              // bảng còn gập — chủ dự án 22/10/2026). Trang khác → mở trang Báo giá ở tab mới, bảng tự mở (MoMucTheoNeo).
              <a
                href="/bao-gia-dang-tin#dac-diem"
                target="_blank"
                rel="noopener"
                onClick={(e) => {
                  const bang = document.getElementById("dac-diem") as HTMLDetailsElement | null;
                  if (!bang) return;
                  e.preventDefault();
                  setXemDacDiem(null);
                  bang.open = true;
                  requestAnimationFrame(() => bang.scrollIntoView({ behavior: "smooth", block: "start" }));
                }}
                className="mt-4 inline-flex text-[13px] font-semibold text-cvr-blue-ink"
              >
                Xem bảng quyền lợi đầy đủ →
              </a>
            )}
          </div>
        </div>
      )}
      {/* ĐANG CHỌN GÓI (đăng tin, đăng lại — chủ dự án duyệt mẫu 22/10/2026): giá luôn là số khách trả (đã gồm VAT), không
          nút gạt; một dòng "Giá đã gồm 8% VAT · Quy định gói tin", bấm mới hiện quy định. Trang báo giá (chỉ xem) giữ nút gạt
          + quy định đủ như cũ. */}
      <p className="mt-3 text-[12.5px] text-cvr-muted">
        Giá đã gồm {(THUE_SUAT_GTGT * 100).toFixed(0)}% VAT
        {QUY_DINH.length > 0 && !trangBaoGia && (
          <>
            {" · "}
            <button type="button" onClick={() => setMoQuyDinh(!moQuyDinh)} aria-expanded={moQuyDinh} className="font-semibold text-cvr-blue-ink">
              Quy định gói tin
            </button>
          </>
        )}
      </p>
      {moQuyDinh && (
        <ul className="mt-2 space-y-1 text-[13px] leading-relaxed text-cvr-muted">
          {QUY_DINH.map((d) => <li key={d} className="flex gap-2"><span aria-hidden>·</span><span>{d}</span></li>)}
        </ul>
      )}
    </div>
  );
}
