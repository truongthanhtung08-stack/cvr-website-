"use client";

import { useEffect, useState } from "react";

// ADMIN → TỪ KHOÁ LÕI (anh 09/11/2026): chỉnh HE-THONG-TU-KHOA.xlsx (sheet "Từ khoá lõi", cột "Lên web" = x) → lưu → tải lên đây
// → web tự đổi tiêu đề, H1, mô tả trang lõi + trang con, không cần Push. Luật đọc + luật an toàn: src/lib/tuKhoaLoiDoc.ts.
type KetQua = { doi: { trang: string; cu: string; moi: string }[]; giu: string[]; soDong: number };
type HienTai = KetQua & { tenTep?: string; capNhat?: string };
type DongTheoDoi = { trang: string; muc: "ban" | "thue"; tinh: string; tang: string; tuKhoa: string; soTin: number; duChuan: boolean; trongBang: boolean; daIndex: boolean; xin: string | null;
  loTrinh?: string; tieuDeWeb?: string; longtail?: string; dacDiem?: string; nhom?: string; google?: number; coTrang?: boolean; chon?: boolean; noiToi?: boolean; thieu?: string[] };
type TheoDoi = { nguong: number; dong: DongTheoDoi[] };
// MỘT BẢNG = ĐÚNG FILE (13/11/2026): lọc theo trạng thái thật trên web
const LOC = [
  ["chua-index", "Chưa index (có trang)"], ["da-xin", "Đã xin, chờ Google"], ["da-index", "Đã index"], ["chua-trang", "Chưa có trang"],
  ["thieu-tin", "Thiếu tin"], ["chon", "Đã chọn (x)"], ["ngoai", "Ngoài bảng"], ["tat-ca", "Tất cả"],
] as const;
type Loc = (typeof LOC)[number][0];
const ngayVn = (s: string) => s.split("-").reverse().slice(0, 2).join("/");

export default function TuKhoaLoiPage() {
  const [hienTai, setHienTai] = useState<HienTai | null>(null);
  const [td, setTd] = useState<TheoDoi | null>(null);
  const [loc, setLoc] = useState<Loc>("chua-index");
  const [muc, setMuc] = useState<"ban" | "thue">("ban");
  const [lo, setLo] = useState<"" | "1" | "2">("");
  const [tim, setTim] = useState("");
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
        const bo = (x: string) => x.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d");
        const ds = td.dong.filter((d) => d.muc === muc && (!lo || (d.loTrinh ?? "").startsWith(lo)) && (!tim || bo(`${d.tinh} ${d.tuKhoa} ${d.longtail ?? ""} ${d.trang}`).includes(bo(tim))));
        const thuoc = (d: DongTheoDoi, l: Loc) =>
          l === "chua-index" ? !!d.trang && !d.daIndex && !d.xin : l === "da-xin" ? !!d.trang && !d.daIndex && !!d.xin : l === "da-index" ? d.daIndex
          : l === "chua-trang" ? !d.trang : l === "thieu-tin" ? (d.thieu ?? []).some((t) => /thiếu \d+ tin/i.test(t)) : l === "chon" ? !!d.chon
          : l === "ngoai" ? !d.trongBang : true;
        const dem = (l: Loc) => ds.filter((d) => thuoc(d, l)).length;
        const hien = ds.filter((d) => thuoc(d, loc));
        const nut = (on: boolean) => `rounded-full px-3 py-1.5 text-[13px] font-medium ${on ? "bg-cvr-ink text-white" : "border border-cvr-line text-cvr-body hover:border-cvr-ink"}`;
        return (
          <div className="rounded-2xl border border-cvr-line bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="mr-auto text-base font-semibold text-cvr-ink">Bảng từ khoá (đúng file) · trạng thái trên web</h2>
              <div className="flex rounded-full bg-cvr-surface p-1 text-sm">
                {([["", "Tất cả"], ["1", "CHA"], ["2", "CON"]] as const).map(([k, t]) => (
                  <button key={k} type="button" onClick={() => setLo(k)} className={`rounded-full px-3 py-1.5 font-medium ${lo === k ? "bg-cvr-ink text-white" : "text-cvr-muted"}`}>{t}</button>
                ))}
              </div>
              <div className="flex rounded-full bg-cvr-surface p-1 text-sm">
                {([["ban", "Mua bán"], ["thue", "Cho thuê"]] as const).map(([k, t]) => (
                  <button key={k} type="button" onClick={() => setMuc(k)} className={`rounded-full px-4 py-1.5 font-medium ${muc === k ? "bg-cvr-ink text-white" : "text-cvr-muted"}`}>{t}</button>
                ))}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {LOC.map(([k, t]) => (
                <button key={k} type="button" onClick={() => setLoc(k)} className={nut(loc === k)}>
                  {t} <span className={loc === k ? "text-white/70" : "text-cvr-faint"}>{dem(k)}</span>
                </button>
              ))}
              <input value={tim} onChange={(e) => setTim(e.target.value)} placeholder="Địa điểm, lõi, link…" className="ml-auto w-48 rounded-lg border border-cvr-line px-3 py-1.5 text-sm" />
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[1000px] text-sm">
                <thead>
                  <tr className="border-b border-cvr-line text-left text-xs text-cvr-muted">
                    <th className="py-2 pr-2">Lộ trình</th><th className="py-2 pr-2">Địa điểm</th><th className="py-2 pr-2">Longtail · link</th><th className="py-2 pr-2">Đặc điểm</th>
                    <th className="py-2 pr-2 text-right">Tin</th><th className="py-2 pr-2">Index</th><th className="py-2">Thiếu gì</th>
                  </tr>
                </thead>
                <tbody>
                  {hien.slice(0, 400).map((d, i) => (
                    <tr key={`${d.trang}|${d.longtail}|${i}`} className="border-b border-cvr-line/60 align-top">
                      <td className="py-2 pr-2 text-xs text-cvr-muted">{(d.loTrinh ?? "").replace(/^\d · /, "").split(":")[0]}<div className="text-cvr-faint">{d.tang}</div></td>
                      <td className="py-2 pr-2 text-cvr-body">{d.tinh}</td>
                      <td className="py-2 pr-2">
                        {d.trang ? <a href={d.trang} target="_blank" rel="noreferrer" className="font-medium text-cvr-ink hover:underline">{d.longtail || d.tuKhoa}</a>
                          : <span className="font-medium text-cvr-ink">{d.longtail || d.tuKhoa}</span>}
                        {d.chon && <span className="ml-1 rounded bg-cvr-ink px-1.5 text-[11px] font-semibold text-white">x</span>}
                        <div className="text-xs text-cvr-faint">{d.trang ? `coastalland.vn${d.trang}` : "chưa có trang"}{d.tieuDeWeb && d.tieuDeWeb !== d.longtail ? ` · tiêu đề web: ${d.tieuDeWeb}` : ""}</div>
                      </td>
                      <td className="py-2 pr-2 text-xs text-cvr-muted">{d.dacDiem || "—"}{d.nhom ? <div className="text-cvr-faint">{d.nhom}{d.google ? ` · Google ${d.google}` : ""}</div> : null}</td>
                      <td className="py-2 pr-2 text-right tabular-nums">{d.soTin}</td>
                      <td className="py-2 pr-2">
                        {!d.trang ? <span className="text-cvr-faint">—</span> : d.daIndex ? <span className="font-medium text-emerald-700">✓ Đã index</span>
                          : <span className="font-medium text-amber-700">Chưa index{d.xin ? <span className="font-normal text-cvr-muted"> · đã xin {ngayVn(d.xin)}</span> : null}</span>}
                      </td>
                      <td className="py-2 text-xs">
                        {d.thieu?.length ? <ul className="space-y-0.5 text-amber-800">{d.thieu.map((t) => <li key={t}>{t}</li>)}</ul> : <span className="text-emerald-700">Đủ</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!hien.length && <p className="py-4 text-center text-sm text-cvr-muted">Không có dòng nào.</p>}
              {hien.length > 400 && <p className="py-3 text-center text-xs text-cvr-muted">Đang hiện 400 / {hien.length} dòng — gõ ô tìm để thu hẹp.</p>}
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
