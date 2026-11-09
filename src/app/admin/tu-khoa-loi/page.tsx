"use client";

import { useEffect, useState } from "react";

// ADMIN → TỪ KHOÁ LÕI (anh 09/11/2026): chỉnh HE-THONG-TU-KHOA.xlsx (sheet "Từ khoá lõi", cột "Lên web" = x) → lưu → tải lên đây
// → web tự đổi tiêu đề, H1, mô tả trang lõi + trang con, không cần Push. Luật đọc + luật an toàn: src/lib/tuKhoaLoiDoc.ts.
type KetQua = { doi: { trang: string; cu: string; moi: string }[]; giu: string[]; soDong: number };
type HienTai = KetQua & { tenTep?: string; capNhat?: string };

export default function TuKhoaLoiPage() {
  const [hienTai, setHienTai] = useState<HienTai | null>(null);
  const [tep, setTep] = useState<File | null>(null);
  const [xem, setXem] = useState<KetQua | null>(null);
  const [dangGui, setDangGui] = useState(false);
  const [bao, setBao] = useState<{ loi?: string; xong?: string } | null>(null);

  const napHienTai = () =>
    fetch("/api/admin/tu-khoa-loi").then((r) => r.json()).then((j) => j.ok && setHienTai(j.hienTai)).catch(() => {});
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

      {hienTai && (
        <div className="rounded-2xl border border-cvr-line bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-3 text-sm text-cvr-muted">
            Đang chạy trên web · {hienTai.tenTep ?? ""} · {hienTai.capNhat ? new Date(hienTai.capNhat).toLocaleString("vi-VN") : ""} · {hienTai.soDong} dòng
          </div>
          <Bang kq={hienTai} />
        </div>
      )}
    </div>
  );
}
