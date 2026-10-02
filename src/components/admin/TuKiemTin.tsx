"use client";

import { useState } from "react";
import Link from "next/link";

// NÚT "TỰ KIỂM TIN" — rà toàn bộ tin theo luật đang chạy (API /api/admin/kiem-tin).
// Up tin xong bấm một lần: không có gì đỏ là mọi tin đang chạy đúng chương trình.
type Muc = { id: string; ma: string; tieuDe: string; loai: string; chiTiet: string };
type KetQua = { tongTin: number; choDuyet: number; loi: Muc[]; chuY: Muc[]; luc: string };

export default function TuKiemTin() {
  const [dang, setDang] = useState(false);
  const [kq, setKq] = useState<KetQua | null>(null);
  const [loiGoi, setLoiGoi] = useState("");

  async function kiem() {
    setDang(true);
    setLoiGoi("");
    try {
      const r = await fetch("/api/admin/kiem-tin", { cache: "no-store" });
      const j = await r.json();
      if (!j.ok) throw new Error(j.message || "Không kiểm được");
      setKq(j as KetQua);
    } catch (e) {
      setLoiGoi(String((e as Error).message));
    } finally {
      setDang(false);
    }
  }

  const ds = (m: Muc[], mau: string) => (
    <ul className="mt-2 divide-y divide-cvr-line rounded-xl border border-cvr-line bg-white">
      {m.map((x, i) => (
        <li key={`${x.id}-${x.loai}-${i}`} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-2.5 text-sm">
          <span className={`font-semibold ${mau}`}>{x.loai}</span>
          <Link href={`/admin/tin-dang/${x.id}`} className="font-mono text-xs text-cvr-blue hover:underline">{x.ma}</Link>
          <span className="min-w-0 flex-1 truncate text-cvr-body">{x.tieuDe}</span>
          <span className="w-full text-xs text-cvr-muted">{x.chiTiet}</span>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={kiem}
        disabled={dang}
        className="rounded-lg border border-cvr-line bg-white px-4 py-2 text-sm font-semibold text-cvr-ink transition hover:border-cvr-ink disabled:opacity-60"
      >
        {dang ? "Đang kiểm…" : "Tự kiểm tin"}
      </button>
      {loiGoi && <p className="mt-2 text-sm text-red-600">{loiGoi}</p>}
      {kq && (
        <div className="mt-3">
          <p className={`text-sm font-semibold ${kq.loi.length ? "text-red-600" : "text-green-700"}`}>
            {kq.loi.length
              ? `Có ${kq.loi.length} lỗi cần sửa`
              : `Tất cả ${kq.tongTin} tin đang hiển thị chạy đúng chương trình`}
            <span className="font-normal text-cvr-muted">
              {" "}· {kq.tongTin} tin đang hiển thị · {kq.choDuyet} chờ duyệt · kiểm lúc{" "}
              {new Date(kq.luc).toLocaleTimeString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}
            </span>
          </p>
          {kq.loi.length > 0 && ds(kq.loi, "text-red-600")}
          {kq.chuY.length > 0 && (
            <>
              <p className="mt-3 text-sm font-semibold text-amber-700">{kq.chuY.length} tin cần chú ý</p>
              {ds(kq.chuY, "text-amber-700")}
            </>
          )}
        </div>
      )}
    </div>
  );
}
