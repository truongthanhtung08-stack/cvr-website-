"use client";

import { COT_UP, soLuotTuNhan, vnd, type UpRow } from "@/lib/billing";
import { type TierId } from "@/lib/packages";
import NhanGoi from "@/components/NhanGoi";
import KhungCuonNgang from "@/components/KhungCuonNgang";
import { tachThue, THUE_SUAT_GTGT } from "@/lib/thue";
import { useQuyDinhGia } from "@/lib/useQuyDinhGia";

// ============================================================================
// BẢNG GIÁ ĐẨY TIN — CÙNG KIỂU với BangGiaGoiTin (chuẩn Batdongsan, 01/10/2026).
// Dùng chung: trang Báo giá (chỉ xem, đủ 4 loại tin) và hộp "Mua gói đẩy" trong
// Tin đăng của tôi (chỉ cột của loại tin đó, bấm ô là chọn gói).
// Hàng = gói (Đẩy N lượt) · Cột = loại tin · % giảm so với đẩy lẻ · gạt "Giá bao gồm VAT".
// Giá CHỈ từ admin (rows = bảng đẩy tin đã công bố theo mục đích).
// ============================================================================

const THU_TU: TierId[] = ["basic", "silver", "gold", "diamond"];

export default function BangGiaDayTin({
  rows,
  chiCap,
  chonLuot,
  onChon,
  toiDaLuot,
  trangBaoGia,
}: {
  rows: UpRow[];
  chiCap?: TierId;                       // chỉ hiện cột của một loại tin
  chonLuot?: number;
  onChon?: (soLuot: number) => void;
  toiDaLuot?: number;                    // gói vượt số lượt này thì khoá (quá thời hạn tin)
  trangBaoGia?: boolean;                 // trang Báo giá: quy định gom ở mục Quy định chung, không lặp dưới bảng (22/10/2026)
}) {
  // Quy định đi kèm: CHỈ bản admin đã duyệt — chưa duyệt thì không hiện.
  const QUY_DINH = useQuyDinhGia().quyDinhDayTin;
  const cot = (chiCap ? [chiCap] : THU_TU).filter((t) => COT_UP.includes(t));
  // Giá luôn là số khách trả (đã gồm VAT) — bỏ nút gạt VAT, số −% và giá mỗi lượt dưới giá (chủ dự án 22/10/2026 tối), như bảng gói tin
  const hienGia = (gia: number) => tachThue(gia).tongTra;
  if (!rows.length) return null;

  return (
    <div>
      <KhungCuonNgang khung="rounded-2xl border border-cvr-line bg-white shadow-lux">
        <table className={`w-full border-collapse text-sm ${chiCap ? "" : "min-w-[520px]"}`}>
          <thead>
            <tr className="bg-cvr-surface">
              <th className="sticky left-0 z-10 whitespace-nowrap border-b border-cvr-line bg-cvr-surface px-3 py-3.5 text-left font-semibold text-cvr-ink sm:px-4">Gói đẩy</th>
              {cot.map((id) => {
                return (
                  <th key={id} className="border-b border-l border-cvr-line px-2 py-3.5 text-center sm:px-3">
                    {/* Tên gói + hệ số X — cùng kiểu bảng giá gói tin (NhanGoi) */}
                    <NhanGoi id={id} />
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
                    const khoa = toiDaLuot != null && soLuot > toiDaLuot;
                    const dangChon = chonLuot === soLuot;
                    const noiDung = <span className="font-semibold tabular-nums text-cvr-ink">{vnd(hienGia(v.gia))}</span>;
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
      </KhungCuonNgang>
      <p className="mt-3 text-[12.5px] text-cvr-muted">Giá đã gồm {(THUE_SUAT_GTGT * 100).toFixed(0)}% VAT</p>
      {QUY_DINH.length > 0 && !trangBaoGia && (
        <ul className="mt-3 space-y-1 text-[13px] leading-relaxed text-cvr-muted">
          {QUY_DINH.map((d) => <li key={d} className="flex gap-2"><span aria-hidden>·</span><span>{d}</span></li>)}
        </ul>
      )}
    </div>
  );
}
