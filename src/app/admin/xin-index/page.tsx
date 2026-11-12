"use client";

import { useEffect, useMemo, useState } from "react";

// ADMIN → XIN INDEX (anh 09/11/2026; hệ thống lại 12/11/2026: "page nào đã index, page nào chưa index — thống nhất").
// HAI trạng thái, một luật với Admin → Từ khoá lõi (src/lib/xinIndex.ts): ĐÃ INDEX · CHƯA INDEX ("đã xin dd/mm" chỉ là ghi chú).
// Gốc = danh sách trang đã index của Search Console, dán vào "Cập nhật từ Search Console". Mỗi ngày: tab "Chưa index", xin 10 trang
// trên cùng ở Search Console → Kiểm tra URL, bấm "Đã xin"; Kiểm tra URL báo đã có trên Google → bấm "Đã index".
type Trang = { duong: string; nhom: string; uuTien: boolean; soTin: number | null; duTin: boolean; daIndex: boolean; xin: string | null };
type Google = { ngay: string; soTrang: number } | null;
type Loc = "chua" | "da" | "thieu" | "tat-ca";

const SITE = "https://coastalland.vn";
const SEARCH_CONSOLE = "https://search.google.com/search-console?resource_id=https%3A%2F%2Fcoastalland.vn%2F";
const homNay = () => new Date().toISOString().slice(0, 10);
const ngayVN = (s: string) => s.split("-").reverse().join("/");
const LOC: [Loc, string][] = [["chua", "Chưa index"], ["da", "Đã index"], ["thieu", "Chưa đủ tin"], ["tat-ca", "Tất cả"]];
const thuoc = (t: Trang, l: Loc) => (l === "da" ? t.daIndex : l === "chua" ? !t.daIndex && t.duTin : l === "thieu" ? !t.daIndex && !t.duTin : true);

export default function XinIndexPage() {
  const [ds, setDs] = useState<Trang[] | null>(null);
  const [google, setGoogle] = useState<Google>(null);
  const [loi, setLoi] = useState<string>();
  const [loc, setLoc] = useState<Loc>("chua");
  const [nhom, setNhom] = useState("");
  const [vuaChep, setVuaChep] = useState("");
  const [moDan, setMoDan] = useState(false);
  const [dan, setDan] = useState("");
  const [ngayG, setNgayG] = useState(homNay());
  const [dangGui, setDangGui] = useState(false);

  const nap = () =>
    fetch("/api/admin/xin-index").then((r) => r.json())
      .then((j) => (j.ok ? (setDs(j.trang), setGoogle(j.google)) : setLoi(j.message ?? "Lỗi")))
      .catch(() => setLoi("Không tải được danh sách"));
  useEffect(() => { nap(); }, []);

  const gui = async (body: object) => {
    const j = await (await fetch("/api/admin/xin-index", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })).json().catch(() => null);
    if (!j?.ok) setLoi(j?.message ?? "Không lưu được");
    return j?.ok ? j : null;
  };
  const danhDau = async (duong: string, kq: "da-xin" | "da-co" | "bo") => {
    const j = await gui({ duong, kq });
    if (j) setDs((cu) => cu?.map((t) => (t.duong === duong ? { ...t, daIndex: j.daIndex, xin: j.xin } : t)) ?? null);
  };
  const capNhatGoogle = async () => {
    setDangGui(true); setLoi(undefined);
    const urls = dan.split(/\s+/).filter(Boolean);
    if (await gui({ google: { ngay: ngayG, urls } })) { setMoDan(false); setDan(""); await nap(); }
    setDangGui(false);
  };

  const chep = (duong: string) => {
    navigator.clipboard?.writeText(SITE + duong).catch(() => {});
    setVuaChep(duong);
  };

  const cacNhom = useMemo(() => [...new Set((ds ?? []).map((t) => t.nhom))], [ds]);
  const trongNhom = useMemo(() => (ds ?? []).filter((t) => !nhom || t.nhom === nhom), [ds, nhom]);
  // Chưa index: trang chưa xin lên trước (cần xin), đã xin xếp sau
  const hien = useMemo(() => {
    const h = trongNhom.filter((t) => thuoc(t, loc));
    return loc === "chua" ? [...h.filter((t) => !t.xin), ...h.filter((t) => t.xin)] : h;
  }, [trongNhom, loc]);
  const homNayDaXin = (ds ?? []).filter((t) => t.xin === homNay()).length;

  const nut = "rounded-lg border border-cvr-line px-2.5 py-1 text-xs font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink";

  return (
    <div className="max-w-6xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight text-cvr-ink">Xin index</h1>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-cvr-body">Hôm nay đã xin <b className="text-cvr-ink">{homNayDaXin}</b>/10</span>
          <a href={SEARCH_CONSOLE} target="_blank" rel="noreferrer" className="rounded-lg bg-cvr-ink px-4 py-2 font-semibold text-white transition hover:bg-cvr-ink/90">
            Mở Search Console ↗
          </a>
        </div>
      </div>

      <div className="rounded-2xl border border-cvr-line bg-white p-4 text-sm shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-cvr-body">
            Search Console: {google ? <><b className="text-cvr-ink">{google.soTrang}</b> trang đã index · cập nhật {ngayVN(google.ngay)}</> : "chưa cập nhật"}
          </span>
          <button type="button" className={nut} onClick={() => setMoDan((v) => !v)}>Cập nhật từ Search Console</button>
        </div>
        {moDan && (
          <div className="mt-3 space-y-2">
            <textarea value={dan} onChange={(e) => setDan(e.target.value)} rows={6} placeholder="https://coastalland.vn/…"
              className="w-full rounded-lg border border-cvr-line p-2 font-mono text-xs" />
            <div className="flex flex-wrap items-center gap-2">
              <input type="date" value={ngayG} onChange={(e) => setNgayG(e.target.value)} className="rounded-lg border border-cvr-line px-2 py-1 text-xs" />
              <button type="button" disabled={dangGui || !dan.trim()} onClick={capNhatGoogle}
                className="rounded-lg bg-cvr-ink px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">Lưu</button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {LOC.map(([k, ten]) => (
          <button key={k} type="button" onClick={() => setLoc(k)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${loc === k ? "bg-cvr-ink text-white" : "border border-cvr-line text-cvr-body hover:border-cvr-ink"}`}>
            {ten} · {trongNhom.filter((t) => thuoc(t, k)).length}
          </button>
        ))}
        <select value={nhom} onChange={(e) => setNhom(e.target.value)} className="ml-auto rounded-lg border border-cvr-line px-3 py-1.5 text-sm text-cvr-body">
          <option value="">Mọi loại trang</option>
          {cacNhom.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      {loi && <p className="text-sm font-medium text-red-600">{loi}</p>}
      {!ds && !loi && <p className="text-sm text-cvr-muted">Đang tải…</p>}

      {ds && (
        <div className="overflow-hidden rounded-2xl border border-cvr-line bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-cvr-surface text-left text-xs text-cvr-muted">
              <tr>
                <th className="px-3 py-2 font-medium">#</th>
                <th className="px-3 py-2 font-medium">Trang</th>
                <th className="px-3 py-2 font-medium">Loại trang</th>
                <th className="px-3 py-2 text-right font-medium">Số tin</th>
                <th className="px-3 py-2 font-medium">Index</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {hien.slice(0, 300).map((t, i) => (
                <tr key={t.duong} className="border-t border-cvr-line align-middle">
                  <td className="px-3 py-2 text-cvr-muted">{i + 1}</td>
                  <td className="px-3 py-2">
                    <a href={SITE + t.duong} target="_blank" rel="noreferrer" className="break-all text-cvr-ink hover:underline">{t.duong}</a>
                    {t.uuTien && <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-semibold text-amber-800">Cha</span>}
                  </td>
                  <td className="px-3 py-2 text-cvr-body">{t.nhom}</td>
                  <td className="px-3 py-2 text-right text-cvr-body">{t.soTin ?? ""}</td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {t.daIndex ? <span className="font-medium text-emerald-700">✓ Đã index</span>
                      : <span className="font-medium text-amber-700">Chưa index{t.xin && <span className="font-normal text-cvr-muted"> · đã xin {ngayVN(t.xin)}</span>}</span>}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button type="button" className={nut} onClick={() => chep(t.duong)}>{vuaChep === t.duong ? "Đã chép" : "Chép link"}</button>
                      {!t.daIndex && t.duTin && t.xin !== homNay() && <button type="button" className={nut} onClick={() => danhDau(t.duong, "da-xin")}>Đã xin</button>}
                      {!t.daIndex && <button type="button" className={nut} onClick={() => danhDau(t.duong, "da-co")}>Đã index</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {hien.length > 300 && <p className="border-t border-cvr-line px-3 py-2 text-xs text-cvr-muted">Hiện 300 / {hien.length} trang — chọn loại trang để xem phần còn lại.</p>}
        </div>
      )}
    </div>
  );
}
