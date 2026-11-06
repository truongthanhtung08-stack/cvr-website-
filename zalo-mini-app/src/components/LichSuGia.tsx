import React, { useState } from "react";
import { useTai } from "../lib/useTai";

// LỊCH SỬ GIÁ — CÙNG SỐ khối Lịch sử giá trang tin web (06/11/2026 "dữ liệu lịch sử giá đâu"): web tính, Mini App chỉ vẽ.
// Nguồn: /api/lich-su-gia?id= (src/app/api/lich-su-gia/route.ts của web). Bố cục như web: tiêu đề · "Nguồn: Coastal Land" ·
// thẻ Mua bán | Cho thuê (mở sẵn đúng mục đích của tin) · chưa đủ số → "Dữ liệu sẽ được cập nhật." · đủ số → số kỳ mới nhất,
// thay đổi 1 năm, giá theo tin và đường giá phổ biến 1 năm.
// ⚠️ Trên Zalo chỉ chạy khi web đã có API này (anh nhắn "Push"); máy thử đọc web chạy ở cổng 3000.
const WEB = import.meta.env.DEV ? "http://localhost:3000" : "https://coastalland.vn";

type Day = { tieuDe: string; co: boolean; moc?: { nhan: string; giaM2: number; gia: string }[]; doiMotNam?: number | null; giaTin?: string | null };
type KetQua = { ok: boolean; macDinh: "ban" | "thue"; ban: Day; thue: Day };

export default function LichSuGia({ id }: { id: string }) {
  const { data } = useTai(async () => {
    const r = await fetch(`${WEB}/api/lich-su-gia?id=${encodeURIComponent(id)}`);
    return r.ok ? ((await r.json()) as KetQua) : null;
  }, [id], null);
  const [chon, setChon] = useState<"ban" | "thue" | null>(null);
  if (!data?.ok) return null;
  const muc = chon ?? data.macDinh;
  const day = data[muc];
  return (
    <section className="khoi-ct lich-su-gia">
      <h2 className="muc-tin">{day.tieuDe}</h2>
      <p className="lsg-nguon">Nguồn: Coastal Land</p>
      <div className="lsg-khung">
        <div className="lsg-the" role="tablist">
          {(["ban", "thue"] as const).map((m) => (
            <button key={m} role="tab" aria-selected={muc === m} className={muc === m ? "bat" : ""} onClick={() => setChon(m)}>
              {m === "ban" ? "Mua bán" : "Cho thuê"}
            </button>
          ))}
        </div>
        {day.co && day.moc?.length ? <Duong day={day} /> : <p className="lsg-trong">Dữ liệu sẽ được cập nhật.</p>}
      </div>
    </section>
  );
}

function Duong({ day }: { day: Day }) {
  const moc = day.moc!;
  const cuoi = moc[moc.length - 1];
  const W = 300, H = 140, T = 12, B = 118, L = 8, R = 292;
  const max = Math.max(...moc.map((m) => m.giaM2)) * 1.1;
  const x = (i: number) => L + (i * (R - L)) / Math.max(1, moc.length - 1);
  const y = (v: number) => B - (v / max) * (B - T);
  const d = moc.map((m, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(m.giaM2).toFixed(1)}`).join(" ");
  const doi = day.doiMotNam;
  return (
    <>
      <div className="lsg-so">
        <p><b>Giá {cuoi.nhan}: {cuoi.gia}</b></p>
        {doi != null && <p>Thay đổi 1 năm: <span style={{ color: doi >= 0 ? "#0f8a5f" : "#dc2626" }}>{doi >= 0 ? "▲" : "▼"} {Math.abs(doi).toFixed(1).replace(".", ",")}%</span></p>}
        {day.giaTin && <p>Giá theo tin: {day.giaTin}</p>}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="lsg-bieu-do" role="img" aria-label="Biểu đồ lịch sử giá">
        <path d={d} fill="none" stroke="#1565c0" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {moc.map((m, i) => <circle key={i} cx={x(i)} cy={y(m.giaM2)} r={3} fill="#1565c0" />)}
        <text x={L} y={H - 4} fontSize={11} fill="#86868b">{moc[0].nhan}</text>
        <text x={R} y={H - 4} fontSize={11} fill="#86868b" textAnchor="end">{cuoi.nhan}</text>
      </svg>
    </>
  );
}
