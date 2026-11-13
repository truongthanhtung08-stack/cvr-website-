"use client";

import { useEffect, useMemo, useState } from "react";
import BaoCaoThiTruong from "@/components/BaoCaoThiTruong";
import { PHAN_KHUC, VUNG_BAO_CAO, nhanDinhTuSo, soLieuVung, tenQuy, type BaoCaoNhap } from "@/lib/baoCaoThiTruong";

// ADMIN → ĐIỂM TIN THỊ TRƯỜNG (anh 13/11/2026): nạp bảng Cowork lọc (MAU-BAO-CAO-THI-TRUONG.xlsx) → xem trước CẢ báo cáo (có ô viền vàng
// chỗ còn thiếu) → Đưa lên web. Sau đó chọn quý đang hiện, dán đường dẫn PDF từng vùng, sửa câu nhận định (để trống = web viết từ số).
type KetQua = { ok: boolean; message?: string; bang: BaoCaoNhap; loi: string[]; dem: Record<string, number> };

export default function DiemTinThiTruongPage() {
  const [dangChay, setDangChay] = useState<BaoCaoNhap | null>(null);
  const [tep, setTep] = useState<File | null>(null);
  const [xem, setXem] = useState<KetQua | null>(null);
  const [bao, setBao] = useState<{ loi?: string; xong?: string } | null>(null);
  const [dangGui, setDangGui] = useState(false);
  const [pdf, setPdf] = useState<Record<string, string>>({});
  const [nd, setNd] = useState<Record<string, string>>({});

  // Nạp bản đang chạy một lần khi mở trang
  useEffect(() => {
    let huy = false;
    fetch("/api/admin/diem-tin-thi-truong").then((r) => r.json()).then((j) => { if (!huy && j?.ok) setDangChay(j.bang); }).catch(() => {});
    return () => { huy = true; };
  }, []);

  const gui = async (xemTruoc: boolean) => {
    if (!tep) return;
    setDangGui(true); setBao(null);
    const fd = new FormData();
    fd.append("tep", tep);
    try {
      const j: KetQua = await (await fetch(`/api/admin/diem-tin-thi-truong${xemTruoc ? "?xemTruoc=1" : ""}`, { method: "POST", body: fd })).json();
      if (!j.ok) setBao({ loi: j.message ?? "Lỗi" });
      else if (xemTruoc) setXem(j);
      else { setXem(null); setTep(null); setDangChay(j.bang); setBao({ xong: `Đã đưa lên web: ${j.dem["Thị trường"]} dòng số liệu thị trường.` }); }
    } catch { setBao({ loi: "Không gửi được tệp" }); }
    setDangGui(false);
  };

  const luu = async (body: object, xong: string) => {
    setDangGui(true); setBao(null);
    const j = await (await fetch("/api/admin/diem-tin-thi-truong", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })).json().catch(() => null);
    if (j?.ok) { setDangChay(j.bang); setBao({ xong }); } else setBao({ loi: j?.message ?? "Không lưu được" });
    setDangGui(false);
  };

  const bang = xem?.bang ?? dangChay;
  const quys = useMemo(() => [...new Set((bang?.thiTruong ?? []).map((x) => x.quy))].sort().reverse(), [bang]);
  const soVung = useMemo(() => (bang ? VUNG_BAO_CAO.map((v) => soLieuVung(v, bang, bang.quyBaoCao)) : []), [bang]);

  return (
    <div className="max-w-6xl space-y-4">
      <h1 className="text-xl font-semibold tracking-tight text-cvr-ink">Điểm tin thị trường</h1>

      <div className="rounded-2xl border border-cvr-line bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-cvr-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-cvr-ink/90">
            Chọn tệp MAU-BAO-CAO-THI-TRUONG.xlsx
            <input type="file" accept=".xlsx" className="hidden" onChange={(e) => { setTep(e.target.files?.[0] ?? null); setXem(null); setBao(null); e.target.value = ""; }} />
          </label>
          {tep && <span className="text-sm text-cvr-body">{tep.name}</span>}
          {tep && !xem && <button type="button" disabled={dangGui} onClick={() => gui(true)} className="rounded-lg border border-cvr-line px-4 py-2 text-sm font-medium text-cvr-body transition hover:border-cvr-ink disabled:opacity-50">Xem trước</button>}
          {xem && <button type="button" disabled={dangGui} onClick={() => gui(false)} className="rounded-lg bg-cvr-blue px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50">Đưa lên web</button>}
        </div>
        {bao?.loi && <p className="mt-3 text-sm font-medium text-red-600">{bao.loi}</p>}
        {bao?.xong && <p className="mt-3 text-sm font-medium text-emerald-700">{bao.xong}</p>}
        {xem && (
          <div className="mt-4 space-y-2 border-t border-cvr-line pt-4 text-sm">
            <p className="text-cvr-ink">{Object.entries(xem.dem).map(([k, v]) => `${k}: ${v}`).join(" · ")}</p>
            {xem.loi.length > 0 && <ul className="list-disc space-y-0.5 pl-5 text-red-700">{xem.loi.slice(0, 30).map((x) => <li key={x}>{x}</li>)}</ul>}
          </div>
        )}
        {!xem && dangChay && <p className="mt-3 text-sm text-cvr-muted">Đang chạy trên web: {tenQuy(dangChay.quyBaoCao)} · {dangChay.thiTruong.length} dòng số liệu thị trường · nạp lúc {new Date(dangChay.capNhat).toLocaleString("vi-VN")}</p>}
      </div>

      {dangChay && !xem && (
        <div className="rounded-2xl border border-cvr-line bg-white p-4 shadow-sm sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="font-semibold text-cvr-ink">Quý đang hiện trên web</span>
            <select value={dangChay.quyBaoCao} onChange={(e) => luu({ quyBaoCao: e.target.value }, `Đã đổi sang ${tenQuy(e.target.value)}`)} className="rounded-full border border-cvr-line px-3 py-1.5">
              {quys.map((q) => <option key={q} value={q}>{tenQuy(q)}</option>)}
            </select>
          </div>
          <div className="grid gap-2 text-sm">
            <span className="font-semibold text-cvr-ink">Tệp PDF tải về ({tenQuy(dangChay.quyBaoCao)})</span>
            {VUNG_BAO_CAO.map((v) => { const k = `${v.id}|${dangChay.quyBaoCao}`; return (
              <label key={k} className="grid gap-1 sm:grid-cols-[160px_1fr] sm:items-center">
                <span className="text-cvr-body">{v.nut}</span>
                <input value={pdf[k] ?? dangChay.pdf?.[k] ?? ""} onChange={(e) => setPdf({ ...pdf, [k]: e.target.value })} placeholder="https://… (đường dẫn tệp PDF)" className="h-9 rounded-lg border border-cvr-line px-3" />
              </label>); })}
            <button type="button" disabled={dangGui} onClick={() => luu({ pdf }, "Đã lưu đường dẫn PDF")} className="justify-self-start rounded-lg border border-cvr-line px-4 py-2 font-medium text-cvr-body hover:border-cvr-ink disabled:opacity-50">Lưu PDF</button>
          </div>
          <details className="text-sm">
            <summary className="cursor-pointer font-semibold text-cvr-ink">Nhận định thị trường (sửa trước khi đăng; để trống = web viết từ số)</summary>
            <div className="mt-3 grid gap-3">
              {soVung.flatMap((sv) => sv.phanKhuc.map((p) => { const k = `${sv.vung.id}|${p.phanKhuc}`; const mau = (dangChay.nhanDinh?.[k] ?? nhanDinhTuSo(p)).join("\n"); return (
                <label key={k} className="grid gap-1">
                  <span className="text-cvr-body">{sv.vung.nut} · {p.phanKhuc}</span>
                  <textarea rows={4} value={nd[k] ?? mau} onChange={(e) => setNd({ ...nd, [k]: e.target.value })} className="rounded-lg border border-cvr-line px-3 py-2 text-[15px] leading-relaxed" />
                </label>); }))}
              {soVung.some((s) => s.phanKhuc.length) && (
                <button type="button" disabled={dangGui} onClick={() => luu({ nhanDinh: Object.fromEntries(Object.entries(nd).map(([k, v]) => [k, v.split("\n").map((x) => x.trim()).filter(Boolean)])) }, "Đã lưu nhận định")}
                  className="justify-self-start rounded-lg bg-cvr-ink px-4 py-2 font-semibold text-white disabled:opacity-50">Lưu nhận định</button>
              )}
            </div>
          </details>
          <p className="text-xs text-cvr-muted">Phân khúc nhận: {PHAN_KHUC.join(" · ")}</p>
        </div>
      )}

      {bang && (
        <div className="rounded-2xl border border-cvr-line bg-white p-4 shadow-sm sm:p-6">
          <p className="mb-4 text-sm font-semibold text-cvr-muted">{xem ? "Xem trước (chưa đưa lên web)" : "Bản đang chạy trên web"} — ô viền vàng: chỗ còn thiếu số liệu, trang công khai tự ẩn</p>
          <BaoCaoThiTruong key={(xem ? "x" : "w") + bang.capNhat} vung={soVung} xemThu />
        </div>
      )}
    </div>
  );
}
