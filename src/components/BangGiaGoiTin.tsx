"use client";

import { useState } from "react";
import type { Plan } from "@/lib/billing";
import { vnd } from "@/lib/billing";
import { getTier, type TierId } from "@/lib/packages";
import { tachThue, THUE_SUAT_GTGT } from "@/lib/thue";
import { useQuyDinhGia } from "@/lib/useQuyDinhGia";

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
}: {
  plans: Plan[];
  chon?: { tier: TierId | ""; days: number };
  onChon?: (tier: TierId, days: number) => void;
  /** Bấm lại ô đang chọn → bỏ chọn gói (chủ dự án 10/10/2026) */
  onBoChon?: () => void;
}) {
  const [gomVat, setGomVat] = useState(true);
  // Quy định đi kèm: CHỈ bản admin đã duyệt — chưa duyệt thì không hiện.
  const qd = useQuyDinhGia();
  const QUY_DINH = qd.quyDinhGoiTin;
  // Bấm "Đặc điểm" dưới tên cấp → xem mô tả quyền lợi + hiển thị của cấp đó (chủ dự án 10/10/2026)
  const [xemDacDiem, setXemDacDiem] = useState<TierId | null>(null);
  const cot = THU_TU.map((id) => plans.find((p) => p.tierId === id)).filter((p): p is Plan => Boolean(p));
  const hang = [...new Set(cot.flatMap((p) => p.terms.map((t) => t.days)))].sort((a, b) => a - b);
  const hienGia = (gia: number) => (gomVat ? tachThue(gia).tongTra : gia);

  // Đơn giá/ngày của mốc NGẮN NHẤT có phí — mốc chuẩn để tính % giảm.
  const donGiaGoc = (p: Plan): number => {
    const t = [...p.terms].filter((x) => x.price > 0).sort((a, b) => a.days - b.days)[0];
    return t ? t.price / t.days : 0;
  };

  if (!cot.length) return null;

  // Chưa có bảng giá đã duyệt → không bày bảng rỗng.
  if (!hang.length) return null;
  return (
    <div>
      <div className="overflow-x-auto rounded-2xl border border-cvr-line bg-white shadow-lux">
        <table className="w-full min-w-[520px] border-collapse text-sm">
          <thead>
            <tr className="bg-cvr-surface">
              <th className="sticky left-0 z-10 w-[84px] whitespace-nowrap border-b border-cvr-line bg-cvr-surface px-3 py-3.5 text-left font-semibold text-cvr-ink sm:w-[96px] sm:px-4">Thời gian</th>
              {cot.map((p) => {
                const t = getTier(p.tierId);
                return (
                  <th key={p.tierId} className="border-b border-l border-cvr-line px-2 py-3.5 text-center sm:px-3">
                    <span
                      className="inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-tight sm:px-3 sm:text-xs"
                      style={{ backgroundColor: t.accent, color: t.badgeText }}
                    >
                      {t.name}
                    </span>
                    {/* Hệ số X dưới tên cấp + nút xem đặc điểm (chủ dự án 10/10/2026) */}
                    <span className="mt-1 block text-[11px] font-semibold tracking-wide text-cvr-muted">{t.heSoText}</span>
                    <button type="button" onClick={() => setXemDacDiem(p.tierId)} className="mt-0.5 text-[11px] font-semibold text-cvr-blue-ink underline-offset-2 hover:underline">
                      Đặc điểm
                    </button>
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
                  const goc = donGiaGoc(p);
                  const giam = goc > 0 && term.price > 0 ? Math.round((1 - term.price / term.days / goc) * 100) : 0;
                  const dangChon = chon?.tier === p.tierId && chon.days === ngay;
                  // Hệ số tiếp cận X luôn hiện dưới mỗi mức giá (chủ dự án 09/10/2026)
                  const noiDung = (
                    <span className="flex flex-col items-center gap-0.5">
                      <span className="flex flex-wrap items-center justify-center gap-1.5">
                        <span className="font-semibold tabular-nums text-cvr-ink">{term.price > 0 ? vnd(hienGia(term.price)) : "0 ₫"}</span>
                        {giam > 0 && (
                          <span className="rounded-full border border-red-300 px-1.5 py-px text-[11px] font-semibold text-red-700">−{giam}%</span>
                        )}
                      </span>
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
            <a href="/bao-gia-dang-tin#dac-diem" target="_blank" rel="noopener" className="mt-4 inline-flex text-[13px] font-semibold text-cvr-blue-ink">Xem bảng quyền lợi đầy đủ →</a>
          </div>
        </div>
      )}
      <label className="mt-3 inline-flex cursor-pointer select-none items-center gap-2.5 text-[13px] text-cvr-muted">
        <input type="checkbox" checked={gomVat} onChange={(e) => setGomVat(e.target.checked)} className="peer sr-only" />
        <span className="relative h-6 w-11 rounded-full bg-cvr-line transition peer-checked:bg-cvr-ink">
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${gomVat ? "left-[22px]" : "left-0.5"}`} />
        </span>
        Giá bao gồm {(THUE_SUAT_GTGT * 100).toFixed(0)}% VAT
      </label>
      {QUY_DINH.length > 0 && (
        <ul className="mt-3 space-y-1 text-[13px] leading-relaxed text-cvr-muted">
          {QUY_DINH.map((d) => <li key={d} className="flex gap-2"><span aria-hidden>·</span><span>{d}</span></li>)}
        </ul>
      )}
    </div>
  );
}
