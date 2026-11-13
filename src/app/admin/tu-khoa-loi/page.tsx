"use client";

import { useEffect, useState } from "react";

// ADMIN → TỪ KHOÁ LÕI (anh 09/11/2026): chỉnh HE-THONG-TU-KHOA.xlsx (sheet "Từ khoá lõi", cột "Lên web" = x) → lưu → tải lên đây
// → web tự đổi tiêu đề, H1, mô tả trang lõi + trang con, không cần Push. Luật đọc + luật an toàn: src/lib/tuKhoaLoiDoc.ts.
type KetQua = { doi: { trang: string; cu: string; moi: string }[]; giu: string[]; soDong: number };
type HienTai = KetQua & { tenTep?: string; capNhat?: string };
type DongTheoDoi = { trang: string; muc: "ban" | "thue"; tinh: string; tang: string; tuKhoa: string; soTin: number; duChuan: boolean; trongBang: boolean; daIndex: boolean; xin: string | null;
  longtail?: string; dacDiem?: string; nhom?: string; google?: number; coTrang?: boolean; ghiChu?: string };
type TheoDoi = { nguong: number; dong: DongTheoDoi[] };
const LOC = [
  ["chua-index", "Chưa index"], ["da-index", "Đã index"], ["thieu", "Chưa đủ tin"], ["mo-trang", "Cần mở trang"], ["tat-ca", "Tất cả"],
] as const;
type Loc = (typeof LOC)[number][0];
const ngayVn = (s: string) => s.split("-").reverse().slice(0, 2).join("/");

export default function TuKhoaLoiPage() {
  const [hienTai, setHienTai] = useState<HienTai | null>(null);
  const [td, setTd] = useState<TheoDoi | null>(null);
  const [loc, setLoc] = useState<Loc>("chua-index");
  const [muc, setMuc] = useState<"ban" | "thue">("ban");
  // MỘT BẢNG (13/11/2026): Lõi = trang lõi · Đặc điểm = dòng longtail của bảng (cùng sheet "Từ khoá lõi")
  const [tang, setTang] = useState<"loi" | "dd">("loi");
  const [tep, setTep] = useState<File | null>(null);
  const [xem, setXem] = useState<KetQua | null>(null);
  const [dangGui, setDangGui] = useState(false);
  const [bao, setBao] = useState<{ loi?: string; xong?: string } | null>(null);

  const napHienTai = () =>
    fetch("/api/admin/tu-khoa-loi").then((r) => r.json()).then((j) => { if (j.ok) { setHienTai(j.hienTai); setTd(j.theoDoi ?? null); } }).catch(() => {});
  useEffect(() => { napHienTai(); }, []);

  const gui = async (xemTruoc: boolean) => {
    if (!tep) return;
    setDangGui(true); setBao(null);
    const fd = new FormData();
    fd.append("tep", tep);
    try {
      const j = await (await fetch(`/api/admin/tu-khoa-loi${xemTruoc ? "?xemTruoc=1" : ""}`, { method: "POST", body: fd })).json();
      if (!j.ok) setBao({ loi: j.message ?? "Lỗi" });
      else if (xemTruoc) setXem(j);
      else { setXem(null); setTep(null); setBao({ xong: `Đã đưa lên web: đổi ${j.doi.length} trang, giữ ${j.giu.length} trang.` }); napHienTai(); }
    } catch {
      setBao({ loi: "Không gửi được tệp" });
    }
    setDangGui(false);
  };

  const Bang = ({ kq }: { kq: KetQua }) => (
    <div className="space-y-3 text-sm">
      <div>
        <div className="font-semibold text-cvr-ink">Đổi chữ lõi · {kq.doi.length} trang</div>
        <ul className="mt-1 space-y-1">
          {kq.doi.map((d) => (
            <li key={d.trang} className="text-cvr-body">
              <span className="text-cvr-muted">{d.trang}</span> · {d.cu} → <b>{d.moi}</b>
            </li>
          ))}
        </ul>
      </div>
      {kq.giu.length > 0 && (
        <div>
          <div className="font-semibold text-cvr-ink">Giữ nguyên · {kq.giu.length} trang</div>
          <ul className="mt-1 space-y-1 text-cvr-muted">{kq.giu.map((g) => <li key={g}>{g}</li>)}</ul>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-5xl space-y-4">
      <h1 className="text-xl font-semibold tracking-tight text-cvr-ink">Từ khoá lõi</h1>

      <div className="rounded-2xl border border-cvr-line bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-cvr-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-cvr-ink/90">
            Chọn tệp HE-THONG-TU-KHOA.xlsx
            <input type="file" accept=".xlsx" className="hidden"
              onChange={(e) => { setTep(e.target.files?.[0] ?? null); setXem(null); setBao(null); e.target.value = ""; }} />
          </label>
          {tep && <span className="text-sm text-cvr-body">{tep.name}</span>}
          {tep && !xem && (
            <button type="button" disabled={dangGui} onClick={() => gui(true)}
              className="rounded-lg border border-cvr-line px-4 py-2 text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink disabled:opacity-50">
              Xem trước
            </button>
          )}
          {xem && (
            <button type="button" disabled={dangGui} onClick={() => gui(false)}
              className="rounded-lg bg-cvr-blue px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50">
              Đưa lên web
            </button>
          )}
        </div>
        {bao?.loi && <p className="mt-3 text-sm font-medium text-red-600">{bao.loi}</p>}
        {bao?.xong && <p className="mt-3 text-sm font-medium text-emerald-700">{bao.xong}</p>}
        {xem && <div className="mt-4 border-t border-cvr-line pt-4"><Bang kq={xem} /></div>}
      </div>

      {td && (() => {
        const ds = td.dong.filter((d) => d.muc === muc && (tang === "dd" ? d.tang === "Đặc điểm" : d.tang !== "Đặc điểm"));
        // Một luật với Admin → Xin index: Đã index · Chưa index (đủ tin, chờ xin / đã xin) · Chưa đủ tin (chưa index, chưa xin được)
        const thuoc = (d: DongTheoDoi, l: Loc) =>
          l === "da-index" ? d.daIndex : l === "chua-index" ? !d.daIndex && d.duChuan : l === "mo-trang" ? d.tang === "Đặc điểm" && !d.coTrang && d.soTin >= td.nguong
            : l === "thieu" ? !d.daIndex && !d.duChuan && !(d.tang === "Đặc điểm" && !d.coTrang && d.soTin >= td.nguong) : true;
        const dem = (l: Loc) => ds.filter((d) => thuoc(d, l)).length;
        const hien = ds.filter((d) => thuoc(d, loc));
        return (
          <div className="rounded-2xl border border-cvr-line bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex rounded-full bg-cvr-surface p-1 text-sm">
                {([["loi", "Trang lõi"], ["dd", "Đặc điểm (longtail)"]] as const).map(([k, t]) => (
                  <button key={k} type="button" onClick={() => setTang(k)} className={`rounded-full px-4 py-1.5 font-medium ${tang === k ? "bg-cvr-ink text-white" : "text-cvr-muted"}`}>{t}</button>
                ))}
              </div>
              <div className="flex rounded-full bg-cvr-surface p-1 text-sm">
                {([["ban", "Mua bán"], ["thue", "Cho thuê"]] as const).map(([k, t]) => (
                  <button key={k} type="button" onClick={() => setMuc(k)} className={`rounded-full px-4 py-1.5 font-medium ${muc === k ? "bg-cvr-ink text-white" : "text-cvr-muted"}`}>{t}</button>
                ))}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {LOC.map(([k, t]) => (
                <button key={k} type="button" onClick={() => setLoc(k)}
                  className={`rounded-full px-3 py-1.5 text-[13px] font-medium ${loc === k ? "bg-cvr-ink text-white" : "border border-cvr-line text-cvr-body hover:border-cvr-ink"}`}>
                  {t} <span className={loc === k ? "text-white/70" : "text-cvr-faint"}>{dem(k)}</span>
                </button>
              ))}
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-cvr-line text-left text-xs text-cvr-muted">
                    <th className="py-2 pr-2">{tang === "dd" ? "Địa điểm" : "Tỉnh"}</th><th className="py-2 pr-2">{tang === "dd" ? "Longtail (lõi + đặc điểm)" : "Từ khoá lõi (tiêu đề trang)"}</th><th className="py-2 pr-2">{tang === "dd" ? "Nhóm · Google" : "Tầng"}</th>
                    <th className="py-2 pr-2 text-right">Tin</th><th className="py-2 pr-2">Đủ chuẩn</th><th className="py-2">Index</th>
                  </tr>
                </thead>
                <tbody>
                  {hien.map((d) => (
                    <tr key={d.trang} className="border-b border-cvr-line/60 align-top">
                      <td className="py-2 pr-2 text-cvr-body">{d.tinh}</td>
                      <td className="py-2 pr-2">
                        {d.trang ? <a href={d.trang} target="_blank" rel="noreferrer" className="font-medium text-cvr-ink hover:underline">{d.longtail || d.tuKhoa || d.trang}</a>
                          : <span className="font-medium text-cvr-ink">{d.longtail}</span>}
                        <div className="text-xs text-cvr-faint">{d.trang || "chưa có trang"}{d.tang === "Đặc điểm" ? ` · lõi ${d.tuKhoa}` : d.trongBang ? " · trong bảng" : ""}</div>
                      </td>
                      <td className="py-2 pr-2 text-cvr-muted">{d.tang === "Đặc điểm" ? <>{d.nhom}<div className="text-xs text-cvr-faint">Google {d.google ?? 0} câu</div></> : d.tang}</td>
                      <td className="py-2 pr-2 text-right tabular-nums">{d.soTin}</td>
                      <td className="py-2 pr-2">{d.duChuan ? <span className="text-emerald-700">✓ Đủ</span> : <span className="text-amber-700">Thiếu {Math.max(1, td.nguong - d.soTin)} tin</span>}</td>
                      <td className="py-2">
                        {d.tang === "Đặc điểm" && !d.coTrang ? <span className="font-medium text-amber-700">{d.soTin >= td.nguong ? "Cần mở trang" : "Chưa có trang"}</span>
                          : d.daIndex ? <span className="font-medium text-emerald-700">✓ Đã index</span>
                          : <span className="font-medium text-amber-700">Chưa index{d.xin ? <span className="font-normal text-cvr-muted"> · đã xin {ngayVn(d.xin)}</span> : null}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!hien.length && <p className="py-4 text-center text-sm text-cvr-muted">Không có trang nào.</p>}
            </div>
          </div>
        );
      })()}

      {hienTai && (
        <details className="rounded-2xl border border-cvr-line bg-white p-4 shadow-sm sm:p-5">
          <summary className="cursor-pointer text-sm text-cvr-muted">
            Bảng đang chạy trên web · {hienTai.tenTep ?? ""} · {hienTai.capNhat ? new Date(hienTai.capNhat).toLocaleString("vi-VN") : ""} · {hienTai.soDong} dòng (bấm xem trang đổi / giữ)
          </summary>
          <div className="mt-3"><Bang kq={hienTai} /></div>
        </details>
      )}
    </div>
  );
}
