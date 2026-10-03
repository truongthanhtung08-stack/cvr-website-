"use client";

import { useState } from "react";
import type { ChiSoKhuVuc } from "@/lib/chiSoGia";
import { vndM2, luiMotNam, coDuLichSuGia, soKyLienMach } from "@/lib/chiSoGia";

// ════════════════════════════════════════════════════════════════════════════
// LỊCH SỬ GIÁ KHU VỰC — bố cục theo Batdongsan (đo 03/10/2026):
//   chọn 1 năm / 2 năm → ba số (giá phổ biến · thay đổi 1 năm · so với đỉnh) →
//   biểu đồ ba đường (cao nhất · phổ biến · thấp nhất) → chú thích.
// Số liệu: CHỈ dãy của đúng khu vực + loại hình + mua bán/cho thuê của tin
// (chiSoChoTin). Chưa có đủ một năm để so cùng kỳ thì không hiện (coDuLichSuGia).
// Quy ước màu (19/09/2026): xanh lá = cao/tăng · đỏ = thấp/giảm · vàng = phổ biến.
// ════════════════════════════════════════════════════════════════════════════

const MAU = { cao: "#0f8a5f", thap: "#dc2626", phoBien: "#c8a250" };

type Moc = { quy: string; giaM2: number; thap?: number; cao?: number };

const laThang = (q: string) => /^\d{4}-\d{2}$/.test(q);

/** "2026-09" → "T9/26" · "2025-Q1" → "Q1/25" */
function nhanKy(q: string): string {
  const thang = q.match(/^(\d{4})-(\d{2})$/);
  if (thang) return `T${Number(thang[2])}/${thang[1].slice(2)}`;
  const quy = q.match(/^(\d{4})-?Q([1-4])$/i);
  if (quy) return `Q${quy[2]}/${quy[1].slice(2)}`;
  return q;
}

function buocTron(tho: number): number {
  const mu = Math.pow(10, Math.floor(Math.log10(Math.max(tho, 1))));
  return (([1, 2, 2.5, 5, 10].find((h) => h * mu >= tho) ?? 10) as number) * mu;
}

function soTruc(v: number, laThue: boolean): string {
  const n = laThue ? v / 1_000 : v / 1_000_000;
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: n < 10 ? 1 : 0 }).format(n);
}

const phanTram = (x: number) => `${Math.abs(x).toFixed(1).replace(".", ",")}%`;

export default function PriceHistory({
  chiSo,
  laThue = false,
}: {
  chiSo: ChiSoKhuVuc | null;
  laThue?: boolean;
}) {
  const caDay: Moc[] = (chiSo?.moc ?? []).filter((m) => m.giaM2 > 0);
  const theoThang = caDay.length > 0 && laThang(caDay[caDay.length - 1].quy);
  const moiNam = theoThang ? 12 : 4;
  // Chỉ vẽ phần LIỀN MẠCH tính ngược từ mốc mới nhất — không nối qua kỳ bị hổng.
  const lienMach = soKyLienMach(chiSo);
  const co2Nam = lienMach >= moiNam * 2 + 1;
  const [soNam, setSoNam] = useState<1 | 2>(1);

  if (!coDuLichSuGia(chiSo)) return null;

  const moc = caDay.slice(-(moiNam * (co2Nam ? soNam : 1) + 1));
  const cuoi = moc[moc.length - 1];
  const namTruoc = caDay.find((m) => m.quy === luiMotNam(cuoi.quy))!;
  const doiMotNam = ((cuoi.giaM2 - namTruoc.giaM2) / namTruoc.giaM2) * 100;
  const dinh = moc.reduce((a, b) => (b.giaM2 > a.giaM2 ? b : a), moc[0]);
  const soVoiDinh = ((cuoi.giaM2 - dinh.giaM2) / dinh.giaM2) * 100;
  const kyTen = theoThang ? "tháng" : "quý";

  // ── Biểu đồ: HAI KHỔ — máy tính 720×300, điện thoại 360×240 (chữ trục đọc được) ──
  const coBien = moc.every((m) => (m.thap ?? 0) > 0 && (m.cao ?? 0) > 0);
  const tatCa = coBien ? moc.flatMap((m) => [m.thap!, m.giaM2, m.cao!]) : moc.map((m) => m.giaM2);
  const minV = Math.min(...tatCa);
  const maxV = Math.max(...tatCa);
  const buoc = buocTron((maxV - minV) / 4 || maxV * 0.1 || 1);
  const day = Math.max(0, Math.floor(minV / buoc) * buoc);
  let tran = Math.ceil(maxV / buoc) * buoc;
  if (tran <= day) tran = day + buoc;
  const vach: number[] = [];
  for (let v = day; v <= tran + 1e-6; v += buoc) vach.push(v);

  const bieuDo = (W: number, H: number, co: number, soNhan: number, className: string) => {
    const trai = co * 3.6;
    const phai = W - co * 1.2;
    const tren = co * 1.6;
    const duoi = H - co * 2.6;
    const x = (i: number) => trai + (i * (phai - trai)) / Math.max(1, moc.length - 1);
    const y = (v: number) => duoi - ((v - day) / (tran - day)) * (duoi - tren);
    const duong = (lay: (m: Moc) => number) => moc.map((m, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(lay(m)).toFixed(1)}`).join(" ");
    const vung = coBien
      ? `${duong((m) => m.cao!)} ${[...moc].reverse().map((m, i) => `L${x(moc.length - 1 - i).toFixed(1)} ${y(m.thap!).toFixed(1)}`).join(" ")} Z`
      : "";
    const cach = Math.max(1, Math.ceil((moc.length - 1) / (soNhan - 1)));
    const nhanX = moc.map((m, i) => ({ i, m })).filter(({ i }) => i % cach === 0 || i === moc.length - 1)
      .filter(({ i }, k, a) => !(k === a.length - 2 && moc.length - 1 - i < cach / 2));
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className={`mt-5 h-auto w-full ${className}`} role="img" aria-label="Biểu đồ lịch sử giá">
        <text x={trai - 6} y={tren - co * 0.6} textAnchor="end" fontSize={co} fill="#86868b">{laThue ? "nghìn/m²" : "tr/m²"}</text>
        {vach.map((v) => (
          <g key={v}>
            <line x1={trai} x2={phai} y1={y(v)} y2={y(v)} stroke="#e8e8ed" strokeWidth={1} />
            <text x={trai - 6} y={y(v) + co * 0.35} textAnchor="end" fontSize={co} fill="#86868b">{soTruc(v, laThue)}</text>
          </g>
        ))}
        {coBien && <path d={vung} fill={MAU.phoBien} fillOpacity={0.08} />}
        {coBien && <path d={duong((m) => m.cao!)} fill="none" stroke={MAU.cao} strokeWidth={co * 0.16} strokeLinejoin="round" />}
        {coBien && <path d={duong((m) => m.thap!)} fill="none" stroke={MAU.thap} strokeWidth={co * 0.16} strokeLinejoin="round" />}
        <path d={duong((m) => m.giaM2)} fill="none" stroke={MAU.phoBien} strokeWidth={co * 0.27} strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={x(moc.length - 1)} cy={y(cuoi.giaM2)} r={co * 0.38} fill="#fff" stroke={MAU.phoBien} strokeWidth={co * 0.22} />
        {nhanX.map(({ i, m }) => (
          <text key={m.quy} x={x(i)} y={duoi + co * 1.9} textAnchor={i === 0 ? "start" : i === moc.length - 1 ? "end" : "middle"} fontSize={co} fill="#86868b">
            {nhanKy(m.quy)}
          </text>
        ))}
      </svg>
    );
  };

  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-cvr-line sm:p-6">
      {co2Nam && (
        <div className="mb-4 flex justify-end">
          <div className="inline-flex rounded-lg bg-cvr-surface p-0.5 text-[13px]">
            {([1, 2] as const).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setSoNam(n)}
                className={`rounded-md px-3 py-1.5 font-medium transition ${soNam === n ? "bg-white text-cvr-ink shadow-sm" : "text-cvr-muted"}`}
              >
                {n} năm
              </button>
            ))}
          </div>
        </div>
      )}

      {/* BA SỐ */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-cvr-surface px-4 py-3">
          <p className="text-[22px] font-bold leading-tight tracking-tight text-cvr-ink">{vndM2(cuoi.giaM2, laThue)}</p>
          <p className="mt-1 text-[13px] text-cvr-muted">Giá phổ biến {nhanKy(cuoi.quy)}</p>
        </div>
        <div className="rounded-xl bg-cvr-surface px-4 py-3">
          <p className="text-[22px] font-bold leading-tight tracking-tight" style={{ color: doiMotNam >= 0 ? MAU.cao : MAU.thap }}>
            {doiMotNam >= 0 ? "▲" : "▼"} {phanTram(doiMotNam)}
          </p>
          <p className="mt-1 text-[13px] text-cvr-muted">
            {doiMotNam >= 0 ? "Tăng" : "Giảm"} trong 1 năm ({nhanKy(namTruoc.quy)} – {nhanKy(cuoi.quy)})
          </p>
        </div>
        <div className="rounded-xl bg-cvr-surface px-4 py-3">
          {soVoiDinh >= 0 ? (
            <>
              <p className="text-[22px] font-bold leading-tight tracking-tight text-cvr-ink">{vndM2(cuoi.giaM2, laThue)}</p>
              <p className="mt-1 text-[13px] text-cvr-muted">Cao nhất trong {moc.length - 1} {kyTen} qua</p>
            </>
          ) : (
            <>
              <p className="text-[22px] font-bold leading-tight tracking-tight" style={{ color: MAU.thap }}>▼ {phanTram(soVoiDinh)}</p>
              <p className="mt-1 text-[13px] text-cvr-muted">Thấp hơn đỉnh {vndM2(dinh.giaM2, laThue)} ({nhanKy(dinh.quy)})</p>
            </>
          )}
        </div>
      </div>

      {/* BIỂU ĐỒ */}
      {bieuDo(720, 300, 13, 6, "hidden sm:block")}
      {bieuDo(360, 250, 12, 4, "sm:hidden")}

      {/* CHÚ THÍCH */}
      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-cvr-body">
        {coBien && <Chu mau={MAU.cao} ten="Cao nhất" />}
        <Chu mau={MAU.phoBien} ten="Phổ biến" day />
        {coBien && <Chu mau={MAU.thap} ten="Thấp nhất" />}
      </div>
    </div>
  );
}

function Chu({ mau, ten, day }: { mau: string; ten: string; day?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`inline-block w-5 rounded-full ${day ? "h-[3px]" : "h-[2px]"}`} style={{ backgroundColor: mau }} />
      {ten}
    </span>
  );
}
