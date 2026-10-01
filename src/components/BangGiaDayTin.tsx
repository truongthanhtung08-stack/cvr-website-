"use client";

import { useState } from "react";
import { COT_UP, soLuotTuNhan, vnd, type UpRow } from "@/lib/billing";
import { getTier, type TierId } from "@/lib/packages";
import { tachThue, THUE_SUAT_GTGT } from "@/lib/thue";

// ============================================================================
// BẢNG GIÁ ĐẨY TIN — CÙNG KIỂU với BangGiaGoiTin (chuẩn Batdongsan, 01/10/2026).
// Dùng chung: trang Báo giá (chỉ xem, đủ 4 loại tin) và hộp "Mua gói đẩy" trong
// Tin đăng của tôi (chỉ cột của loại tin đó, bấm ô là chọn gói).
// Hàng = gói (Đẩy N lượt) · Cột = loại tin · % giảm so với đẩy lẻ · gạt "Giá bao gồm VAT".
// Giá CHỈ từ admin (rows = bảng đẩy tin đã công bố theo mục đích).
// ============================================================================

const THU_TU: TierId[] = ["basic", "silver", "gold", "diamond"];

// QUY ĐỊNH ĐI KÈM BẢNG GIÁ — ngắn, đúng cơ chế đang chạy (chốt 01/10/2026).
const QUY_DINH = [
  "Chỉ áp dụng cho tin đang hiển thị; ngày đăng và thời hạn giữ nguyên.",
  "Lượt đầu đẩy ngay khi mua, sau đó mỗi ngày 1 lượt lúc 8h sáng.",
  "Số lượt tối đa bằng số ngày tin còn hiển thị; tin hết hạn thì lượt còn lại hết theo.",
  "Mỗi tin dùng một gói một lúc.",
];

export default function BangGiaDayTin({
  rows,
  chiCap,
  chonLuot,
  onChon,
  toiDaLuot,
}: {
  rows: UpRow[];
  chiCap?: TierId;                       // chỉ hiện cột của một loại tin
  chonLuot?: number;
  onChon?: (soLuot: number) => void;
  toiDaLuot?: number;                    // gói vượt số lượt này thì khoá (quá thời hạn tin)
}) {
  const [gomVat, setGomVat] = useState(true);
  const cot = (chiCap ? [chiCap] : THU_TU).filter((t) => COT_UP.includes(t));
  const hienGia = (gia: number) => (gomVat ? tachThue(gia).tongTra : gia);
  if (!rows.length) return null;

  return (
    <div>
      <div className="overflow-x-auto rounded-2xl border border-cvr-line bg-white shadow-lux">
        <table className={`w-full border-collapse text-sm ${chiCap ? "" : "min-w-[520px]"}`}>
          <thead>
            <tr className="bg-cvr-surface">
              <th className="sticky left-0 z-10 whitespace-nowrap border-b border-cvr-line bg-cvr-surface px-3 py-3.5 text-left font-semibold text-cvr-ink sm:px-4">Gói đẩy</th>
              {cot.map((id) => {
                const t = getTier(id);
                return (
                  <th key={id} className="border-b border-l border-cvr-line px-2 py-3.5 text-center sm:px-3">
                    <span className="inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-tight sm:px-3 sm:text-xs" style={{ backgroundColor: t.accent, color: t.badgeText }}>
                      {t.name}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const soLuot = soLuotTuNhan(r.label);
              return (
                <tr key={r.label} className="border-b border-cvr-line/70 last:border-0">
                  <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-3 py-3 font-semibold text-cvr-body sm:px-4">{soLuot > 1 ? `${soLuot} lượt` : "1 lượt"}</td>
                  {cot.map((id) => {
                    const v = r.values[COT_UP.indexOf(id)];
                    if (!v || v.gia <= 0) {
                      return <td key={id} className="border-l border-cvr-line/70 px-3 py-3 text-center text-cvr-faint">–</td>;
                    }
                    const giam = v.giaGoc && v.giaGoc > v.gia ? Math.round((1 - v.gia / v.giaGoc) * 100) : 0;
                    const khoa = toiDaLuot != null && soLuot > toiDaLuot;
                    const dangChon = chonLuot === soLuot;
                    const noiDung = (
                      <span className="flex flex-col items-center gap-0.5">
                        <span className="flex flex-wrap items-center justify-center gap-1.5">
                          <span className="font-semibold tabular-nums text-cvr-ink">{vnd(hienGia(v.gia))}</span>
                          {giam > 0 && <span className="rounded-full border border-red-300 px-1.5 py-px text-[11px] font-semibold text-red-700">−{giam}%</span>}
                        </span>
                        {soLuot > 1 && <span className="text-[11px] tabular-nums text-cvr-muted">{vnd(Math.round(hienGia(v.gia) / soLuot))}/lượt</span>}
                      </span>
                    );
                    return (
                      <td key={id} className="border-l border-cvr-line/70 p-1.5 text-center">
                        {onChon ? (
                          <button
                            type="button"
                            disabled={khoa}
                            onClick={() => onChon(soLuot)}
                            aria-pressed={dangChon}
                            title={khoa ? "Vượt số ngày tin còn hiển thị" : undefined}
                            className={`w-full rounded-xl px-2 py-2.5 transition disabled:cursor-not-allowed disabled:opacity-40 ${dangChon ? "bg-cvr-ink/[0.06] ring-2 ring-cvr-ink" : "hover:bg-cvr-surface"}`}
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
              );
            })}
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
