"use client";

import { useEffect, useState } from "react";

// ADMIN → TỪ KHOÁ LÕI (anh 09/11/2026): chỉnh HE-THONG-TU-KHOA.xlsx (sheet "Từ khoá lõi", cột "Lên web" = x) → lưu → tải lên đây
// → web tự đổi tiêu đề, H1, mô tả trang lõi + trang con, không cần Push. Luật đọc + luật an toàn: src/lib/tuKhoaLoiDoc.ts.
type KetQua = { doi: { trang: string; cu: string; moi: string }[]; giu: string[]; soDong: number };
type HienTai = KetQua & { tenTep?: string; capNhat?: string };
type DongTheoDoi = { trang: string; muc: "ban" | "thue"; tinh: string; tang: string; tuKhoa: string; soTin: number; duChuan: boolean; trongBang: boolean; daIndex: boolean; xin: string | null;
  loTrinh?: string; tieuDeWeb?: string; longtail?: string; dacDiem?: string; nhom?: string; google?: number; coTrang?: boolean; chon?: boolean; noiToi?: boolean; thieu?: string[]; khuVuc?: string; loaiHinh?: string; loiGoc?: string; hang?: string; top?: boolean; lich?: string };
type TheoDoi = { nguong: number; dong: DongTheoDoi[] };
// MỘT BẢNG = ĐÚNG FILE (13/11/2026): lọc theo trạng thái thật trên web
// Anh 21/11/2026: "link nào đã index, link mở chưa index, top — để có kế hoạch index hằng ngày" + trang thiếu tin để giao Cowork.
// "Mở cho Google, chưa index" = danh sách xin index hằng ngày (trang đủ chuẩn, chưa xin). "Ít / không có tin" = giao Cowork lọc tin.
const LOC = [
  ["mo", "Chờ index"], ["da-index", "Đã index"], ["top", "Đang top"], ["it-tin", "Thiếu tin"], ["tat-ca", "Tất cả"],
] as const;
type Loc = (typeof LOC)[number][0];
const ngayVn = (s: string) => s.split("-").reverse().slice(0, 2).join("/");

export default function TuKhoaLoiPage() {
  const [hienTai, setHienTai] = useState<HienTai | null>(null);
  const [td, setTd] = useState<TheoDoi | null>(null);
  const [loc, setLoc] = useState<Loc>("mo");
  const [muc, setMuc] = useState<"ban" | "thue">("ban");
  const [tim, setTim] = useState("");
  const [kv, setKv] = useState(""); // 7 khu vực (cột A của file)
  const [lh, setLh] = useState(""); // nhóm loại hình (cột "Loại hình" của file)
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
      else { setXem(null); setTep(null); setBao({ xong: `Đã nạp tệp. Tiêu đề trang theo tệp: ${j.doi.length} trang · giữ tiêu đề cũ (đang top): ${j.giu.length} trang.` }); napHienTai(); }
    } catch {
      setBao({ loi: "Không gửi được tệp" });
    }
    setDangGui(false);
  };

  const Bang = ({ kq }: { kq: KetQua }) => (
    <div className="space-y-3 text-sm">
      <div>
        <div className="font-semibold text-cvr-ink">Tiêu đề trang theo tệp · {kq.doi.length} trang</div>
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
          <div className="font-semibold text-cvr-ink">Giữ tiêu đề cũ · {kq.giu.length} trang</div>
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
        // GỌN (anh 21/11/2026: "Admin rất lộn xộn — ngắn gọn, đơn giản"): MỘT DÒNG = MỘT TRANG; các câu cùng trỏ một trang
        // (Nhà đất / Bất động sản …, gần biển / ven biển) gộp chung dòng. Cột: Khu vực · Câu · Tin · Index · Hạng · Cần làm.
        const bo = (x: string) => x.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d");
        const goc = td.dong.filter((d) => d.trongBang && d.muc === muc && (!kv || d.khuVuc === kv || (!d.khuVuc && d.tinh === kv)) && (!lh || d.loaiHinh === lh) && (!tim || bo(`${d.tinh} ${d.longtail ?? ""} ${d.trang}`).includes(bo(tim))));
        const gom = new Map<string, DongTheoDoi & { cau: string[] }>();
        for (const d of goc) {
          const k = d.trang || `chua|${d.longtail}`;
          const c = gom.get(k);
          if (c) { if (d.longtail && !c.cau.includes(d.longtail)) c.cau.push(d.longtail); c.top ||= d.top; c.hang ||= d.hang; c.lich ||= d.lich; }
          else gom.set(k, { ...d, cau: d.longtail ? [d.longtail] : [] });
        }
        const ds = [...gom.values()];
        const thieuTin = (d: DongTheoDoi) => !d.trang || (d.thieu ?? []).some((t) => /thiếu \d+ tin/i.test(t));
        const thuoc = (d: DongTheoDoi, l: Loc) =>
          l === "mo" ? !!d.trang && !d.daIndex && !thieuTin(d) : l === "da-index" ? d.daIndex : l === "top" ? !!d.top : l === "it-tin" ? thieuTin(d) : true;
        const dem = (l: Loc) => ds.filter((d) => thuoc(d, l)).length;
        const hien = ds.filter((d) => thuoc(d, loc));
        const canLam = (d: DongTheoDoi) => {
          if (!d.trang) return `Thiếu tin (${d.soTin}/1) — giao Cowork`;
          const it = (d.thieu ?? []).find((t) => /thiếu \d+ tin/i.test(t));
          if (it) return `${it} — giao Cowork`;
          if (d.daIndex) return d.top ? "Giữ top" : "Tra hạng";
          if (d.xin) return `Đã xin ${ngayVn(d.xin)}, chờ Google`;
          if ((d.thieu ?? []).some((t) => /Trùng bộ tin/.test(t))) return "Trùng tin trang khác — không xin";
          return d.lich ? `Xin index ngày ${d.lich}` : "Xin index";
        };
        const nut = (on: boolean) => `rounded-full px-3 py-1.5 text-[13px] font-medium ${on ? "bg-cvr-ink text-white" : "border border-cvr-line text-cvr-body hover:border-cvr-ink"}`;
        return (
          <div className="rounded-2xl border border-cvr-line bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="mr-auto text-base font-semibold text-cvr-ink">Kế hoạch từ khoá</h2>
              <select value={kv} onChange={(e) => setKv(e.target.value)} className="rounded-full border border-cvr-line px-3 py-1.5 text-sm">
                <option value="">7 khu vực</option>
                {["Đà Nẵng", "Huế", "Khánh Hòa", "Lâm Đồng", "Gia Lai", "Quảng Ngãi", "Quảng Trị"].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <select value={lh} onChange={(e) => setLh(e.target.value)} className="rounded-full border border-cvr-line px-3 py-1.5 text-sm">
                <option value="">Mọi loại hình</option>
                {[...new Set(td.dong.filter((d) => d.trongBang).map((d) => d.loaiHinh ?? "").filter(Boolean))].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
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
              <input value={tim} onChange={(e) => setTim(e.target.value)} placeholder="Tìm câu, link…" className="ml-auto w-48 rounded-lg border border-cvr-line px-3 py-1.5 text-sm" />
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[860px] text-sm">
                <thead>
                  <tr className="border-b border-cvr-line text-left text-xs text-cvr-muted">
                    <th className="py-2 pr-2">Khu vực</th><th className="py-2 pr-2">Câu · trang</th><th className="py-2 pr-2 text-right">Tin</th>
                    <th className="py-2 pr-2">Index</th><th className="py-2 pr-2">Hạng</th><th className="py-2">Cần làm</th>
                  </tr>
                </thead>
                <tbody>
                  {hien.slice(0, 400).map((d) => (
                    <tr key={d.trang || d.longtail} className="border-b border-cvr-line/60 align-top">
                      <td className="py-2 pr-2 text-cvr-body">{d.khuVuc || d.tinh}</td>
                      <td className="py-2 pr-2">
                        {d.cau.map((c) => d.trang ? <a key={c} href={d.trang} target="_blank" rel="noreferrer" className="block font-medium text-cvr-blue hover:underline">{c}</a> : <div key={c} className="font-medium text-cvr-ink">{c}</div>)}
                        {d.trang ? <a href={d.trang} target="_blank" rel="noreferrer" className="text-xs text-cvr-muted hover:underline">https://coastalland.vn{d.trang}</a> : <span className="text-xs text-cvr-faint">chưa có trang</span>}
                      </td>
                      <td className="py-2 pr-2 text-right tabular-nums">{d.soTin}</td>
                      <td className="py-2 pr-2">{!d.trang ? <span className="text-cvr-faint">—</span> : d.daIndex ? <span className="font-medium text-emerald-700">Đã index</span> : <span className="font-medium text-amber-700">Chưa index</span>}</td>
                      <td className="py-2 pr-2 text-xs">{d.top ? <span className="font-semibold text-emerald-700">{d.hang}</span> : <span className="text-cvr-faint">{d.hang || "—"}</span>}</td>
                      <td className="py-2 text-xs text-cvr-body">{canLam(d)}</td>
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
            Lần nạp tệp gần nhất · {hienTai.capNhat ? new Date(hienTai.capNhat).toLocaleString("vi-VN") : ""} (bấm xem tiêu đề trang theo tệp)
          </summary>
          <div className="mt-3"><Bang kq={hienTai} /></div>
        </details>
      )}
    </div>
  );
}
