"use client";

import { useEffect, useMemo, useState } from "react";

// ADMIN → XIN INDEX (anh 09/11/2026): mọi trang web cho Google index (= sitemap), xếp theo thứ tự xin, đánh dấu trang đã xin /
// đã có trên Google. Mỗi ngày: mở tab "Chưa xin", xin 10 trang trên cùng ở Search Console → Kiểm tra URL, bấm "Đã xin".
type Ghi = { ngay: string; kq: "da-xin" | "da-co" };
type Trang = { duong: string; nhom: string; uuTien: boolean; soTin: number | null; ghi: Ghi | null };

const SITE = "https://coastalland.vn";
const SEARCH_CONSOLE = "https://search.google.com/search-console?resource_id=https%3A%2F%2Fcoastalland.vn%2F";
const homNay = () => new Date().toISOString().slice(0, 10);
const ngayVN = (s: string) => s.split("-").reverse().join("/");

export default function XinIndexPage() {
  const [ds, setDs] = useState<Trang[] | null>(null);
  const [loi, setLoi] = useState<string>();
  const [loc, setLoc] = useState<"chua" | "da-xin" | "da-co" | "tat-ca">("chua");
  const [nhom, setNhom] = useState("");
  const [vuaChep, setVuaChep] = useState("");

  useEffect(() => {
    fetch("/api/admin/xin-index").then((r) => r.json())
      .then((j) => (j.ok ? setDs(j.trang) : setLoi(j.message ?? "Lỗi")))
      .catch(() => setLoi("Không tải được danh sách"));
  }, []);

  const danhDau = async (duong: string, kq: "da-xin" | "da-co" | "bo") => {
    const j = await (await fetch("/api/admin/xin-index", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ duong, kq }) })).json().catch(() => null);
    if (!j?.ok) return setLoi(j?.message ?? "Không lưu được");
    setDs((cu) => cu?.map((t) => (t.duong === duong ? { ...t, ghi: j.ghi } : t)) ?? null);
  };

  const chep = (duong: string) => {
    navigator.clipboard?.writeText(SITE + duong).catch(() => {});
    setVuaChep(duong);
  };

  const cacNhom = useMemo(() => [...new Set((ds ?? []).map((t) => t.nhom))], [ds]);
  const hien = useMemo(() => (ds ?? []).filter((t) =>
    (!nhom || t.nhom === nhom) &&
    (loc === "tat-ca" || (loc === "chua" ? !t.ghi : t.ghi?.kq === loc))), [ds, loc, nhom]);
  const homNayDaXin = (ds ?? []).filter((t) => t.ghi?.kq === "da-xin" && t.ghi.ngay === homNay()).length;
  const dem = (k: typeof loc) => (ds ?? []).filter((t) => (k === "tat-ca" ? true : k === "chua" ? !t.ghi : t.ghi?.kq === k)).length;

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

      <div className="flex flex-wrap items-center gap-2">
        {([["chua", "Chưa xin"], ["da-xin", "Đã xin"], ["da-co", "Đã có trên Google"], ["tat-ca", "Tất cả"]] as const).map(([k, ten]) => (
          <button key={k} type="button" onClick={() => setLoc(k)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${loc === k ? "bg-cvr-ink text-white" : "border border-cvr-line text-cvr-body hover:border-cvr-ink"}`}>
            {ten} · {dem(k)}
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
                <th className="px-3 py-2 font-medium">Đã xin</th>
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
                  <td className="whitespace-nowrap px-3 py-2 text-cvr-body">
                    {t.ghi ? `${t.ghi.kq === "da-co" ? "Đã có" : "Đã xin"} ${ngayVN(t.ghi.ngay)}` : ""}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button type="button" className={nut} onClick={() => chep(t.duong)}>{vuaChep === t.duong ? "Đã chép" : "Chép link"}</button>
                      {t.ghi ? (
                        <button type="button" className={nut} onClick={() => danhDau(t.duong, "bo")}>Bỏ ghi</button>
                      ) : (
                        <>
                          <button type="button" className={nut} onClick={() => danhDau(t.duong, "da-xin")}>Đã xin</button>
                          <button type="button" className={nut} onClick={() => danhDau(t.duong, "da-co")}>Đã có</button>
                        </>
                      )}
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
