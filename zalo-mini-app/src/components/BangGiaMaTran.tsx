import React from "react";
import { tien } from "../lib/dinhDang";

// ============================================================================
// BẢNG GIÁ GÓI TIN — MA TRẬN số ngày × hạng, Y HỆT WEB (src/components/BangGiaGoiTin.tsx).
// Dùng chung: trang Bảng giá (chỉ xem) và trang Đăng tin (bấm ô = chọn hạng + số ngày).
// Giá ĐÃ GỒM VAT 8% · nhãn % giảm so với đơn giá/ngày của mốc ngắn nhất · quy định đi kèm.
// ============================================================================
export type GoiBang = { tierId: string; name: string; terms: { days: number; price: number }[] };

const HANG = ["basic", "silver", "gold", "diamond"];
export const TEN_HANG: Record<string, string> = { basic: "CVR Basic", silver: "CVR Silver", gold: "CVR Gold", diamond: "CVR Diamond" };
export const MAU_HANG: Record<string, string> = { basic: "#9aa0a6", silver: "#2f5d84", gold: "#b8860b", diamond: "#c1121f" };
export const gomVat = (n: number) => n + Math.round(n * 0.08); // khớp tachThue của web
export const QD_TIN = [
  "Tin bắt đầu hiển thị khi được duyệt; số ngày tính từ lúc duyệt.",
  "Phí trừ vào ví lúc duyệt. Tin bị từ chối không trừ phí.",
  "Hết hạn, tin ngừng hiển thị. Bấm Đăng lại để hiển thị tiếp (duyệt như tin mới).",
  "Sửa tin không đổi gói, ngày đăng và thời hạn.",
];

export function NhanHang({ id }: { id: string }) {
  return <span className="nhan-bang" style={{ background: MAU_HANG[id] }}>{TEN_HANG[id] ?? id}</span>;
}
export function QuyDinh({ dong }: { dong: string[] }) {
  return <ul className="qd-bang">{dong.map((d) => <li key={d}>{d}</li>)}</ul>;
}

export default function BangGiaMaTran({
  plans,
  chon,
  onChon,
}: {
  plans: GoiBang[];
  chon?: { tier: string; days: number };
  onChon?: (tier: string, days: number) => void;
}) {
  const cot = HANG.map((id) => plans.find((p) => p.tierId === id)).filter((p): p is GoiBang => Boolean(p));
  const hang = [...new Set(cot.flatMap((p) => p.terms.map((t) => t.days)))].sort((a, b) => a - b);
  const donGiaGoc = (p: GoiBang) => {
    const t = [...p.terms].filter((x) => x.price > 0).sort((a, b) => a.days - b.days)[0];
    return t ? t.price / t.days : 0;
  };
  if (!cot.length) return null;
  return (
    <>
      <div className="cuon-bang">
        <table className="bang-mt">
          <thead><tr><th className="ghim">Thời gian</th>{cot.map((p) => <th key={p.tierId}><NhanHang id={p.tierId} /></th>)}</tr></thead>
          <tbody>
            {hang.map((ngay) => (
              <tr key={ngay}>
                <td className="ghim">{ngay} ngày</td>
                {cot.map((p) => {
                  const t = p.terms.find((x) => x.days === ngay);
                  if (!t) return <td key={p.tierId} className="trong">–</td>;
                  const goc = donGiaGoc(p);
                  const giam = goc > 0 && t.price > 0 ? Math.round((1 - t.price / t.days / goc) * 100) : 0;
                  const dangChon = chon?.tier === p.tierId && chon.days === ngay;
                  return (
                    <td
                      key={p.tierId}
                      className={`${onChon ? "o-chon" : ""} ${dangChon ? "dang-chon" : ""}`}
                      onClick={onChon ? () => onChon(p.tierId, ngay) : undefined}
                    >
                      <b>{t.price > 0 ? tien(gomVat(t.price)) : "0 đ"}</b>
                      {giam > 0 && <span className="giam">−{giam}%</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="chu-phu" style={{ fontSize: 12, padding: "6px 16px 0", margin: 0 }}>Giá đã gồm 8% VAT.</p>
      <QuyDinh dong={QD_TIN} />
    </>
  );
}
