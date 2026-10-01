"use client";

import { useState } from "react";
import type { Plan } from "@/lib/billing";
import { vnd } from "@/lib/billing";
import { getTier, type TierId } from "@/lib/packages";
import { tachThue, THUE_SUAT_GTGT } from "@/lib/thue";

// ============================================================================
// BẢNG GIÁ GÓI TIN KIỂU BATDONGSAN (chốt 01/10/2026) — MỘT bảng dùng chung:
//   · trang Báo giá  → chỉ xem
//   · form đăng tin  → bấm ô nào là chọn đúng loại tin + số ngày đó
// Hàng = số ngày · Cột = loại tin (Thường → Bạc → Vàng → Kim cương) · ô không bán = "–".
// % giảm so với đơn giá/ngày của mốc ngắn nhất cùng loại tin. Nút gạt "Giá bao gồm VAT".
// Giá CHỈ từ admin (plans truyền vào = bảng giá theo mục đích của admin).
// ============================================================================

const THU_TU: TierId[] = ["basic", "silver", "gold", "diamond"];

// QUY ĐỊNH ĐI KÈM BẢNG GIÁ — ngắn, đúng cơ chế đang chạy (chốt 01/10/2026).
const QUY_DINH = [
  "Tin bắt đầu hiển thị khi được duyệt; số ngày tính từ lúc duyệt.",
  "Phí trừ vào ví lúc duyệt. Tin bị từ chối không trừ phí.",
  "Hết hạn, tin ngừng hiển thị. Bấm Đăng lại để hiển thị tiếp (duyệt như tin mới).",
  "Sửa tin không đổi gói, ngày đăng và thời hạn.",
];

export default function BangGiaGoiTin({
  plans,
  chon,
  onChon,
}: {
  plans: Plan[];
  chon?: { tier: TierId | ""; days: number };
  onChon?: (tier: TierId, days: number) => void;
}) {
  const [gomVat, setGomVat] = useState(true);
  const cot = THU_TU.map((id) => plans.find((p) => p.tierId === id)).filter((p): p is Plan => Boolean(p));
  const hang = [...new Set(cot.flatMap((p) => p.terms.map((t) => t.days)))].sort((a, b) => a - b);
  const hienGia = (gia: number) => (gomVat ? tachThue(gia).tongTra : gia);

  // Đơn giá/ngày của mốc NGẮN NHẤT có phí — mốc chuẩn để tính % giảm.
  const donGiaGoc = (p: Plan): number => {
    const t = [...p.terms].filter((x) => x.price > 0).sort((a, b) => a.days - b.days)[0];
    return t ? t.price / t.days : 0;
  };

  if (!cot.length) return null;

  return (
    <div>
      <div className="overflow-x-auto rounded-2xl border border-cvr-line bg-white shadow-lux">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="bg-cvr-surface">
              <th className="w-[96px] border-b border-cvr-line px-4 py-3.5 text-left font-semibold text-cvr-ink">Thời gian</th>
              {cot.map((p) => {
                const t = getTier(p.tierId);
                return (
                  <th key={p.tierId} className="border-b border-l border-cvr-line px-3 py-3.5 text-center">
                    <span
                      className="inline-block rounded-full px-3 py-1 text-xs font-semibold tracking-tight"
                      style={{ backgroundColor: t.accent, color: t.badgeText }}
                    >
                      {t.name}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {hang.map((ngay) => (
              <tr key={ngay} className="border-b border-cvr-line/70 last:border-0">
                <td className="px-4 py-3 font-semibold text-cvr-body">{ngay} ngày</td>
                {cot.map((p) => {
                  const term = p.terms.find((x) => x.days === ngay);
                  if (!term) {
                    return <td key={p.tierId} className="border-l border-cvr-line/70 px-3 py-3 text-center text-cvr-faint">–</td>;
                  }
                  const goc = donGiaGoc(p);
                  const giam = goc > 0 && term.price > 0 ? Math.round((1 - term.price / term.days / goc) * 100) : 0;
                  const dangChon = chon?.tier === p.tierId && chon.days === ngay;
                  const noiDung = (
                    <span className="flex flex-wrap items-center justify-center gap-1.5">
                      <span className="font-semibold tabular-nums text-cvr-ink">{term.price > 0 ? vnd(hienGia(term.price)) : "0 ₫"}</span>
                      {giam > 0 && (
                        <span className="rounded-full border border-red-300 px-1.5 py-px text-[11px] font-semibold text-red-700">−{giam}%</span>
                      )}
                    </span>
                  );
                  return (
                    <td key={p.tierId} className="border-l border-cvr-line/70 p-1.5 text-center">
                      {onChon ? (
                        <button
                          type="button"
                          onClick={() => onChon(p.tierId, ngay)}
                          aria-pressed={dangChon}
                          className={`w-full rounded-xl px-2 py-2.5 transition ${dangChon ? "bg-cvr-ink/[0.06] ring-2 ring-cvr-ink" : "hover:bg-cvr-surface"}`}
                        >
                          {noiDung}
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
      <label className="mt-3 inline-flex cursor-pointer select-none items-center gap-2.5 text-[13px] text-cvr-muted">
        <input type="checkbox" checked={gomVat} onChange={(e) => setGomVat(e.target.checked)} className="peer sr-only" />
        <span className="relative h-6 w-11 rounded-full bg-cvr-line transition peer-checked:bg-cvr-ink">
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${gomVat ? "left-[22px]" : "left-0.5"}`} />
        </span>
        Giá bao gồm {(THUE_SUAT_GTGT * 100).toFixed(0)}% VAT
      </label>
      <ul className="mt-3 space-y-1 text-[13px] leading-relaxed text-cvr-muted">
        {QUY_DINH.map((d) => <li key={d} className="flex gap-2"><span aria-hidden>·</span><span>{d}</span></li>)}
      </ul>
    </div>
  );
}
