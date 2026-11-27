"use client";

import { useEffect, useMemo, useState } from "react";

// ADMIN → XIN INDEX — GỌN MỘT BẢNG (anh 27/11/2026: "Admin quá lộn xộn — lấy loại hình CHA theo bộ lọc; title trên Google TỔNG,
// nhóm vào trang TỔNG; ghi rõ trang, URL, index, lộ trình"). Mỗi dòng = khu vực + mục đích + loại cha = MỘT trang tổng; mọi loại con và
// đặc điểm của nhóm gom về trang này. Index: danh sách Search Console dán vào "Cập nhật từ Search Console" + nút "Đã xin" / "Đã index".
type Nhom = { khuVuc: string; muc: string; cha: string; duong: string; ten: string; loi: string; longtail: string[]; manh: boolean; daIndex: boolean; xin: string | null };
type Google = { ngay: string; soTrang: number } | null;

const SITE = "https://coastalland.vn";
const SEARCH_CONSOLE = "https://search.google.com/search-console?resource_id=https%3A%2F%2Fcoastalland.vn%2F";
const homNay = () => new Date().toISOString().slice(0, 10);
const ngayVN = (s: string) => s.split("-").reverse().slice(0, 2).join("/");
const MOI_NGAY = 10; // hạn mức xin index của Google mỗi ngày

export default function XinIndexPage() {
  const [ds, setDs] = useState<Nhom[] | null>(null);
  const [google, setGoogle] = useState<Google>(null);
  const [loi, setLoi] = useState<string>();
  const [vuaChep, setVuaChep] = useState("");
  const [moDan, setMoDan] = useState(false);
  const [dan, setDan] = useState("");
  const [dangGui, setDangGui] = useState(false);

  const nap = () =>
    fetch("/api/admin/xin-index").then((r) => r.json())
      .then((j) => (j.ok ? (setDs(j.nhomCha), setGoogle(j.google)) : setLoi(j.message ?? "Lỗi")))
      .catch(() => setLoi("Không tải được danh sách"));
  useEffect(() => { nap(); }, []);

  const gui = async (body: object) => {
    const j = await (await fetch("/api/admin/xin-index", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })).json().catch(() => null);
    if (!j?.ok) setLoi(j?.message ?? "Không lưu được");
    return j?.ok ? j : null;
  };
  const danhDau = async (duong: string, kq: "da-xin" | "da-co") => {
    const j = await gui({ duong, kq });
    if (j) setDs((cu) => cu?.map((t) => (t.duong === duong ? { ...t, daIndex: j.daIndex, xin: j.xin } : t)) ?? null);
  };
  const capNhatGoogle = async () => {
    setDangGui(true); setLoi(undefined);
    if (await gui({ google: { ngay: homNay(), urls: dan.split(/\s+/).filter(Boolean) } })) { setMoDan(false); setDan(""); await nap(); }
    setDangGui(false);
  };
  const chep = (duong: string) => { navigator.clipboard?.writeText(SITE + duong).catch(() => {}); setVuaChep(duong); };

  // LỘ TRÌNH: đã index → giữ, thêm tin · đã xin → chờ Google · chưa index → xin 10 trang/ngày từ hôm nay, 4 khu làm mạnh trước
  const loTrinh = useMemo(() => {
    const m = new Map<string, string>();
    const cho = (ds ?? []).filter((t) => !t.daIndex && !t.xin).sort((a, b) => Number(b.manh) - Number(a.manh));
    cho.forEach((t, i) => {
      const d = new Date(); d.setDate(d.getDate() + Math.floor(i / MOI_NGAY));
      m.set(t.duong, `Xin index ${ngayVN(d.toISOString().slice(0, 10))}`);
    });
    for (const t of ds ?? []) if (t.daIndex) m.set(t.duong, "Giữ — thêm tin mới mỗi tuần"); else if (t.xin) m.set(t.duong, `Đã xin ${ngayVN(t.xin)} — chờ Google`);
    return m;
  }, [ds]);
  const dem = (f: (t: Nhom) => boolean) => (ds ?? []).filter(f).length;
  const nut = "rounded-lg border border-cvr-line px-2.5 py-1 text-xs font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink";

  return (
    <div className="max-w-7xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight text-cvr-ink">Xin index — nhóm từ khoá theo loại cha</h1>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-cvr-body">Hôm nay đã xin <b className="text-cvr-ink">{dem((t) => t.xin === homNay())}</b>/{MOI_NGAY}</span>
          <a href={SEARCH_CONSOLE} target="_blank" rel="noreferrer" className="rounded-lg bg-cvr-ink px-4 py-2 font-semibold text-white transition hover:bg-cvr-ink/90">Mở Search Console ↗</a>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-cvr-line bg-white p-4 text-sm shadow-sm">
        <span className="text-cvr-body">
          <b className="text-cvr-ink">{dem(() => true)}</b> nhóm · <b className="text-emerald-700">{dem((t) => t.daIndex)}</b> đã index ·{" "}
          <b className="text-amber-700">{dem((t) => !t.daIndex)}</b> chưa index
          {google && <> · Search Console cập nhật {ngayVN(google.ngay)}</>}
        </span>
        <button type="button" className={nut} onClick={() => setMoDan((v) => !v)}>Cập nhật từ Search Console</button>
        {moDan && (
          <div className="w-full space-y-2">
            <textarea value={dan} onChange={(e) => setDan(e.target.value)} rows={5} placeholder="https://coastalland.vn/…" className="w-full rounded-lg border border-cvr-line p-2 font-mono text-xs" />
            <button type="button" disabled={dangGui || !dan.trim()} onClick={capNhatGoogle} className="rounded-lg bg-cvr-ink px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">Lưu</button>
          </div>
        )}
      </div>

      {loi && <p className="text-sm font-medium text-red-600">{loi}</p>}
      {!ds && !loi && <p className="text-sm text-cvr-muted">Đang tải…</p>}

      {ds && (
        <div className="overflow-x-auto rounded-2xl border border-cvr-line bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-cvr-surface text-left text-xs text-cvr-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Khu vực</th>
                <th className="px-3 py-2 font-medium">Mục đích</th>
                <th className="px-3 py-2 font-medium">Loại cha</th>
                <th className="px-3 py-2 font-medium">Câu lõi</th>
                <th className="px-3 py-2 font-medium">Câu longtail</th>
                <th className="px-3 py-2 font-medium">Title trên Google</th>
                <th className="px-3 py-2 font-medium">URL</th>
                <th className="px-3 py-2 font-medium">Index</th>
                <th className="px-3 py-2 font-medium">Lộ trình</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {ds.map((t) => (
                <tr key={t.duong} className="border-t border-cvr-line align-middle">
                  <td className="whitespace-nowrap px-3 py-2 text-cvr-ink">{t.khuVuc}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-cvr-body">{t.muc}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-cvr-body">{t.cha}</td>
                  <td className="whitespace-nowrap px-3 py-2 font-medium text-cvr-ink">{t.loi}</td>
                  <td className="min-w-[220px] px-3 py-2 text-xs text-cvr-body">
                    <details><summary className="cursor-pointer">{t.longtail.length} câu</summary><p className="mt-1 leading-relaxed">{t.longtail.join(" · ")}</p></details>
                  </td>
                  <td className="min-w-[280px] px-3 py-2"><a href={SITE + t.duong} target="_blank" rel="noreferrer" className="font-medium text-cvr-ink hover:underline">{t.ten}</a></td>
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-cvr-muted">{t.duong}</td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {t.daIndex ? <span className="font-medium text-emerald-700">Đã index</span> : <span className="font-medium text-amber-700">Chưa index</span>}
                  </td>
                  <td className="min-w-[150px] px-3 py-2 text-xs text-cvr-body">{loTrinh.get(t.duong)}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button type="button" className={nut} onClick={() => chep(t.duong)}>{vuaChep === t.duong ? "Đã chép" : "Chép link"}</button>
                      {!t.daIndex && t.xin !== homNay() && <button type="button" className={nut} onClick={() => danhDau(t.duong, "da-xin")}>Đã xin</button>}
                      {!t.daIndex && <button type="button" className={nut} onClick={() => danhDau(t.duong, "da-co")}>Đã index</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
