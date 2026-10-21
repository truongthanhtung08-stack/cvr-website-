"use client";

import { useDiaDanh } from "@/lib/useDiaDanh";
import { useState } from "react";
import type { ChiSoKhuVuc, OSanh } from "@/lib/chiSoGia";
import { vndM2, luiMotNam, coDuLichSuGia, soKyLienMach } from "@/lib/chiSoGia";

// ════════════════════════════════════════════════════════════════════════════
// LỊCH SỬ GIÁ KHU VỰC — bố cục theo Batdongsan (đo 03/10/2026):
//   chọn 1 năm / 2 năm → ba số (giá phổ biến · thay đổi 1 năm · so với đỉnh) →
//   biểu đồ ba đường (cao nhất · phổ biến · thấp nhất) → chú thích.
// Số liệu: CHỈ dãy của đúng khu vực + loại hình + mua bán/cho thuê của tin
// (chiSoChoTin). Chưa có đủ một năm để so cùng kỳ thì không hiện (coDuLichSuGia).
// Quy ước màu (19/09/2026): xanh lá = cao/tăng · đỏ = thấp/giảm · vàng = phổ biến.
// ════════════════════════════════════════════════════════════════════════════

// duong / dai / vienDai: xanh dương Coastal Land (Batdongsan dùng đỏ — mình khác màu, rõ trên nền trắng)
const MAU = { cao: "#0f8a5f", thap: "#dc2626", phoBien: "#c8a250", duong: "#1565c0", dai: "#1565c0", vienDai: "#7aa7e0" };

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

function soTruc(v: number, chia = 1_000_000): string {
  const n = v / chia;
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: n < 10 ? 1 : 0 }).format(n);
}

const phanTram = (x: number) => `${Math.abs(x).toFixed(1).replace(".", ",")}%`;

/** Dãy giá của MỘT mục đích (mua bán hoặc cho thuê) cho khối lịch sử giá. */
export type DayGiaTin = { chiSo: ChiSoKhuVuc | null; lanCan: OSanh[]; tieuDe: string };

// KHỐI LỊCH SỬ GIÁ (chủ dự án 21/10/2026): tiêu đề "Lịch sử giá bán/thuê <loại hình> tại <khu vực, dự án>" →
// "Nguồn: Coastal Land" → nút Mua bán · Cho thuê (cùng khu vực + loại hình) và mốc 1 · 2 · 3 · 5 năm.
export default function PriceHistory({
  ban,
  thue,
  macDinh,
  loaiHinh = "",
  giaTin = null,
  mauSo = "dat",
}: {
  /** Đơn vị chia của loại hình: đất ÷ m² đất · căn hộ ÷ m² căn (sàn) · nhà ÷ m² sàn — ghi rõ "sàn" trên khối */
  mauSo?: "dat" | "can" | "san";
  /** Giá của chính tin (bán: mỗi m² đúng luật loại hình · thuê: tiền mỗi tháng) — chấm "Giá tin hiện tại" ở tab cùng mục đích */
  giaTin?: number | null;
  ban: DayGiaTin | null;
  thue: DayGiaTin | null;
  /** Mục đích của tin — mở sẵn đúng tab này */
  macDinh: "ban" | "thue";
  /** Loại hình của tin (chữ thường) — ghi rõ trên bảng so sánh: "Giá bán đất nền phổ biến Q3/26" */
  loaiHinh?: string;
}) {
  const co = { ban: !!ban && coDuLichSuGia(ban.chiSo), thue: !!thue && coDuLichSuGia(thue.chiSo) };
  const [muc, setMuc] = useState<"ban" | "thue">(co[macDinh] ? macDinh : macDinh === "ban" ? "thue" : "ban");
  const day = muc === "ban" ? ban : thue;
  if (!day) return null;
  // BỐ CỤC (chủ dự án 21/10/2026 — chuẩn, gọn): tiêu đề · nguồn → MỘT khung trắng: thẻ Mua bán | Cho thuê (gạch chân) →
  // mốc năm → ô tóm tắt → số của kỳ đang chọn → biểu đồ → chú thích. Cỡ chữ: tiêu đề 19/22 · số lớn 22 · số phụ 17 ·
  // nhãn 13 · chú thích 12,5 — một thang chung, số dùng chữ số đều (tabular-nums) cho thẳng cột.
  const theMuc = (
    <div role="tablist" className="-mx-4 mb-4 flex border-b border-cvr-line px-4 sm:-mx-6 sm:px-6">
      {(["ban", "thue"] as const).map((m) => (
        <button
          key={m}
          type="button"
          role="tab"
          aria-selected={muc === m}
          onClick={() => setMuc(m)}
          className={`-mb-px border-b-2 px-1 pb-2.5 pt-0.5 text-[15px] font-semibold transition first:mr-6 ${muc === m ? "border-[#1565c0] text-cvr-ink" : "border-transparent text-cvr-muted hover:text-cvr-ink"}`}
        >
          {m === "ban" ? "Mua bán" : "Cho thuê"}
        </button>
      ))}
    </div>
  );
  return (
    <>
      <h2 className="text-[19px] font-semibold leading-snug tracking-tight text-cvr-ink sm:text-[22px]">{day.tieuDe}</h2>
      <p className="mb-4 mt-1 text-[12.5px] text-cvr-muted">Nguồn: Coastal Land</p>
      <div className="rounded-2xl bg-white p-4 ring-1 ring-cvr-line sm:p-6">
        {theMuc}
        {co[muc] ? (
          <KhoiGia key={muc} chiSo={day.chiSo} laThue={muc === "thue"} lanCan={day.lanCan} loaiHinh={loaiHinh} giaTin={muc === macDinh ? giaTin : null} san={mauSo !== "dat"} />
        ) : (
          // QUY ĐỊNH (chủ dự án 21/10/2026): đủ số liệu chính xác mới vẽ; chưa đủ thì vẫn hiện khối và ghi "sẽ cập nhật"
          <p className="rounded-xl bg-cvr-surface px-4 py-8 text-center text-[14px] text-cvr-muted">Dữ liệu sẽ được cập nhật.</p>
        )}
      </div>
    </>
  );
}

function KhoiGia({
  chiSo,
  laThue = false,
  lanCan = [],
  loaiHinh = "",
  giaTin = null,
  san = false,
}: {
  giaTin?: number | null;
  /** Căn hộ, nhà: giá mỗi m² SÀN (chủ dự án 21/10/2026) */
  san?: boolean;
  chiSo: ChiSoKhuVuc | null;
  laThue?: boolean;
  loaiHinh?: string;
  /** Bảng so sánh các phường/xã trong tỉnh (cùng quý với mốc mới nhất). */
  lanCan?: OSanh[];
}) {
  useDiaDanh(); // địa danh nạp sau khi trang hiện — về tới thì vẽ lại (20/10/2026)
  // Thống nhất giá mỗi m² theo loại hình, cả bán lẫn thuê (chủ dự án 21/10/2026).
  // Giá mỗi m² theo loại hình (21/10/2026): "50,4 triệu/m²" · căn hộ, nhà "… /m² sàn" · thuê thêm "/tháng"
  const gia = (v: number) => vndM2(v).replace("/m²", san ? "/m² sàn" : "/m²") + (laThue ? "/tháng" : "");
  // Trục dọc: bán tính triệu, thuê (vài chục nghìn/m²) tính nghìn
  const chiaTruc = laThue ? 1000 : 1e6;
  const caDay: Moc[] = (chiSo?.moc ?? []).filter((m) => m.giaM2 > 0);
  const theoThang = caDay.length > 0 && laThang(caDay[caDay.length - 1].quy);
  const moiNam = theoThang ? 12 : 4;
  // Chỉ vẽ phần LIỀN MẠCH tính ngược từ mốc mới nhất — không nối qua kỳ bị hổng.
  const lienMach = soKyLienMach(chiSo);
  // Mốc 1 / 2 / 3 / 5 năm (chủ dự án 21/10/2026) — luôn hiện đủ các nút; năm nào chưa đủ số liền mạch thì nút mờ, không bấm được.
  const duSo = (n: number) => lienMach >= moiNam * n + 1;
  const [soNam, setSoNam] = useState<1 | 2 | 3 | 5>(1);
  const [chon, setChon] = useState<number | null>(null); // kỳ đang xem trên biểu đồ (null = kỳ mới nhất)

  if (!coDuLichSuGia(chiSo)) return null;

  const moc = caDay.slice(-(moiNam * (duSo(soNam) ? soNam : 1) + 1));
  const cuoi = moc[moc.length - 1];
  const namTruoc = caDay.find((m) => m.quy === luiMotNam(cuoi.quy))!;
  const doiMotNam = ((cuoi.giaM2 - namTruoc.giaM2) / namTruoc.giaM2) * 100;
  const dinh = moc.reduce((a, b) => (b.giaM2 > a.giaM2 ? b : a), moc[0]);
  const soVoiDinh = ((cuoi.giaM2 - dinh.giaM2) / dinh.giaM2) * 100;
  const kyTen = theoThang ? "tháng" : "quý";

  // ── Biểu đồ (kiểu Batdongsan, màu Coastal Land — chủ dự án 21/10/2026): dải khoảng giá thấp nhất – cao nhất,
  // đường giá phổ biến có chấm từng kỳ; KÉO / CHẠM qua lại trên biểu đồ → vạch dọc + bảng số của kỳ đó.
  // Hai khổ: máy tính 720×300, điện thoại 360×240 (chữ trục đọc được).
  const coBien = moc.every((m) => (m.thap ?? 0) > 0 && (m.cao ?? 0) > 0);
  const tatCa = [...(coBien ? moc.flatMap((m) => [m.thap!, m.giaM2, m.cao!]) : moc.map((m) => m.giaM2)), ...(giaTin ? [giaTin] : [])];
  const minV = Math.min(...tatCa);
  const maxV = Math.max(...tatCa);
  const buoc = buocTron((maxV - minV) / 4 || maxV * 0.1 || 1);
  const day = Math.max(0, Math.floor(minV / buoc) * buoc);
  let tran = Math.ceil(maxV / buoc) * buoc;
  if (tran <= day) tran = day + buoc;
  const vach: number[] = [];
  for (let v = day; v <= tran + 1e-6; v += buoc) vach.push(v);
  const kyChon = chon != null && chon < moc.length ? chon : moc.length - 1;

  const bieuDo = (W: number, H: number, co: number, soNhan: number, className: string) => {
    const trai = co * 3.6;
    const phai = W - co * 1.2;
    const tren = co * 2.1;
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
    // Kéo / chạm → kỳ gần nhất theo trục ngang
    const chonTheo = (e: React.PointerEvent<SVGSVGElement>) => {
      const r = e.currentTarget.getBoundingClientRect();
      const vx = ((e.clientX - r.left) / r.width) * W;
      const i = Math.round(((vx - trai) / (phai - trai)) * (moc.length - 1));
      setChon(Math.min(moc.length - 1, Math.max(0, i)));
    };
    return (
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className={`mt-3 h-auto w-full cursor-crosshair touch-pan-y select-none ${className}`}
        role="img"
        aria-label="Biểu đồ lịch sử giá"
        onPointerDown={chonTheo}
        onPointerMove={(e) => { if (e.pointerType === "mouse" || e.buttons) chonTheo(e); }}
      >
        <text x={2} y={tren - co * 0.6} textAnchor="start" fontSize={co} fill="#86868b">{(laThue ? "nghìn" : "tr") + (san ? "/m² sàn" : "/m²") + (laThue ? "/tháng" : "")}</text>
        {vach.map((v) => (
          <g key={v}>
            <line x1={trai} x2={phai} y1={y(v)} y2={y(v)} stroke="#e8e8ed" strokeWidth={1} strokeDasharray="4 4" />
            <text x={trai - 6} y={y(v) + co * 0.35} textAnchor="end" fontSize={co} fill="#86868b">{soTruc(v, chiaTruc)}</text>
          </g>
        ))}
        {coBien && <path d={vung} fill={MAU.dai} fillOpacity={0.12} />}
        {coBien && <path d={duong((m) => m.cao!)} fill="none" stroke={MAU.vienDai} strokeWidth={co * 0.1} strokeLinejoin="round" />}
        {coBien && <path d={duong((m) => m.thap!)} fill="none" stroke={MAU.vienDai} strokeWidth={co * 0.1} strokeLinejoin="round" />}
        <path d={duong((m) => m.giaM2)} fill="none" stroke={MAU.duong} strokeWidth={co * 0.24} strokeLinejoin="round" strokeLinecap="round" />
        {moc.map((m, i) => (
          <circle key={m.quy} cx={x(i)} cy={y(m.giaM2)} r={co * (i === kyChon ? 0.42 : 0.26)} fill={i === kyChon ? "#fff" : MAU.duong} stroke={MAU.duong} strokeWidth={co * 0.18} />
        ))}
        {/* Vạch dọc của kỳ đang chọn — số của kỳ hiện ở ô ngay trên biểu đồ (không đè lên đường giá) */}
        <line x1={x(kyChon)} x2={x(kyChon)} y1={tren} y2={duoi} stroke="#1d1d1f" strokeWidth={1.2} strokeDasharray="4 3" />
        {/* Giá tin hiện tại — chấm đen ở kỳ mới nhất (như Batdongsan "Giá tin đang xem") */}
        {giaTin && <circle cx={x(moc.length - 1)} cy={y(giaTin)} r={co * 0.5} fill="#1d1d1f" stroke="#fff" strokeWidth={co * 0.15} />}
        {nhanX.map(({ i, m }) => (
          <text key={m.quy} x={x(i)} y={duoi + co * 1.9} textAnchor={i === 0 ? "start" : i === moc.length - 1 ? "end" : "middle"} fontSize={co} fill="#86868b">
            {nhanKy(m.quy)}
          </text>
        ))}
      </svg>
    );
  };

  const MuiTen = ({ tang }: { tang: boolean }) => (
    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[12px] font-bold leading-none text-white" style={{ backgroundColor: tang ? MAU.cao : MAU.thap }}>
      {tang ? "↑" : "↓"}
    </span>
  );
  const kc = moc[kyChon];

  return (
    <div className="tabular-nums">
      {/* MỐC NĂM — một hàng chia đều, nút đang chọn nền đậm; mốc chưa đủ số thì mờ, không bấm được */}
      <div className="grid grid-cols-4 gap-1 rounded-full sm:max-w-sm bg-cvr-surface p-1 text-[13px]">
        {([1, 2, 3, 5] as const).map((n) => (
          <button
            key={n}
            type="button"
            disabled={!duSo(n)}
            onClick={() => { setSoNam(n); setChon(null); }}
            className={`h-8 rounded-full font-medium transition disabled:cursor-not-allowed disabled:opacity-35 ${soNam === n ? "bg-cvr-ink text-white" : "text-cvr-body hover:text-cvr-ink"}`}
          >
            {n} năm
          </button>
        ))}
      </div>

      {/* Ô TÓM TẮT: giá phổ biến kỳ mới nhất · so với 1 năm trước · so với đỉnh */}
      <div className="mt-4 rounded-xl border border-cvr-line px-4 py-3.5">
        <p className="text-[13px] text-cvr-muted">{laThue ? "Giá thuê phổ biến" : "Giá bán phổ biến"}</p>
        <p className="mt-1 text-[22px] font-bold leading-tight tracking-tight text-cvr-ink sm:text-[24px]">
          {gia(cuoi.giaM2)} <span className="text-[15px] font-medium text-cvr-muted">({nhanKy(cuoi.quy)})</span>
        </p>
        <div className="mt-3 grid grid-cols-2 gap-4 border-t border-cvr-line pt-3">
          <div>
            <p className="flex items-center gap-1.5 text-[17px] font-bold leading-tight text-cvr-ink"><MuiTen tang={doiMotNam >= 0} />{phanTram(doiMotNam)}</p>
            <p className="mt-1 text-[12.5px] leading-snug text-cvr-muted">So với 1 năm trước<br />({nhanKy(namTruoc.quy)} – {nhanKy(cuoi.quy)})</p>
          </div>
          <div>
            {soVoiDinh >= 0 ? (
              <>
                <p className="flex items-center gap-1.5 text-[17px] font-bold leading-tight text-cvr-ink"><MuiTen tang />Cao nhất</p>
                <p className="mt-1 text-[12.5px] leading-snug text-cvr-muted">Trong {moc.length - 1} {kyTen} qua</p>
              </>
            ) : (
              <>
                <p className="flex items-center gap-1.5 text-[17px] font-bold leading-tight text-cvr-ink"><MuiTen tang={false} />{phanTram(soVoiDinh)}</p>
                <p className="mt-1 text-[12.5px] leading-snug text-cvr-muted">So với đỉnh vào {nhanKy(dinh.quy)}<br />({gia(dinh.giaM2)})</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* SỐ CỦA KỲ ĐANG CHỌN — kéo / chạm qua lại trên biểu đồ để đổi kỳ */}
      <div className="mt-4 border-l-2 border-[#1565c0] pl-3 text-[13px] leading-relaxed">
        <p className="font-semibold text-cvr-ink">Giá {nhanKy(kc.quy)}: {gia(kc.giaM2)}</p>
        {coBien && <p className="text-cvr-muted">Khoảng giá: {soTruc(kc.thap!, chiaTruc)} – {gia(kc.cao!)}</p>}
        {giaTin && <p className="text-cvr-muted">Giá theo tin hiện tại: {gia(giaTin)}</p>}
      </div>
      {bieuDo(760, 220, 12, 6, "hidden sm:block")}
      {bieuDo(360, 240, 12, 4, "sm:hidden")}

      {/* CHÚ THÍCH */}
      <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-[12.5px] text-cvr-body">
        <Chu mau={MAU.duong} ten="Giá phổ biến" day />
        {coBien && <Chu mau={MAU.vienDai} ten="Khoảng giá (tối thiểu – tối đa)" />}
        {giaTin && (
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-cvr-ink" />
            Giá theo tin hiện tại
          </span>
        )}
      </div>

      {/* SO SÁNH CÁC PHƯỜNG/XÃ TRONG TỈNH — như Batdongsan, theo hệ mới */}
      {lanCan.length > 1 && (
        <div className="mt-6 overflow-hidden rounded-xl ring-1 ring-cvr-line">
          <div className="bg-cvr-surface px-4 py-2.5">
            <p className="text-[13.5px] font-semibold text-cvr-ink">So sánh giá các phường/xã trong {chiSo?.tinh}</p>
            <p className="mt-0.5 text-[12.5px] text-cvr-muted">{laThue ? "Giá thuê" : "Giá bán"}{loaiHinh ? ` ${loaiHinh}` : ""} phổ biến {nhanKy(cuoi.quy)}</p>
          </div>
          {lanCan.map((o) => (
            <div key={o.ten} className="flex items-center justify-between gap-3 border-t border-cvr-line px-4 py-2.5 text-[13.5px]">
              <span className={`min-w-0 ${o.chinhNo ? "font-semibold text-cvr-ink" : "text-cvr-body"}`}>{o.ten}</span>
              <span className="shrink-0 text-right">
                <span className="block whitespace-nowrap font-medium text-cvr-ink">{gia(o.gia)}</span>
                {o.soMau != null && (
                  <span className="block whitespace-nowrap text-[12px] text-cvr-muted">
                    {o.soMau} tin {laThue ? "thuê" : "bán"}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
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
