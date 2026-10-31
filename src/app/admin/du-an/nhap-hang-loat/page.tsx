"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { docDuAnTuCsv, type DongDuAn } from "@/lib/csvDuAn";

// ============================================================================
// ADMIN — NẠP DỰ ÁN HÀNG LOẠT (Cowork, hằng tuần) → trạng thái CHỜ DUYỆT
//   B1. Tải tệp mẫu → mỗi dòng một dự án, có nguồn + ngày cập nhật
//   B2. Chọn tệp → kiểm từng dòng, báo dòng sai
//   B3. Bấm Nạp → dự án vào danh sách "Chờ duyệt"; chủ dự án duyệt mới lên web
// Dự án đã có (trùng đường dẫn) thì BỎ QUA, không ghi đè thông tin admin đã sửa.
// ============================================================================

export default function NapDuAnPage() {
  const [dong, setDong] = useState<DongDuAn[]>([]);
  const [tenTep, setTenTep] = useState("");
  const [dangNap, setDangNap] = useState(false);
  const [ketQua, setKetQua] = useState("");

  async function chonTep(f: File | undefined) {
    if (!f) return;
    setTenTep(f.name);
    setKetQua("");
    setDong(docDuAnTuCsv(await f.text()));
  }

  const hopLe = dong.filter((d) => d.payload);

  async function nap() {
    setDangNap(true);
    const supabase = createClient();
    const { data: daCo } = await supabase.from("projects").select("slug").in("slug", hopLe.map((d) => d.slug));
    const trung = new Set((daCo ?? []).map((r: { slug: string }) => r.slug));
    const moi = hopLe.filter((d) => !trung.has(d.slug));
    const { error } = moi.length ? await supabase.from("projects").insert(moi.map((d) => d.payload!)) : { error: null };
    setDangNap(false);
    setKetQua(
      error
        ? `Nạp thất bại: ${error.message}`
        : `Đã nạp ${moi.length} dự án vào "Chờ duyệt"${trung.size ? ` · bỏ qua ${trung.size} dự án đã có` : ""}.`,
    );
  }

  return (
    <div className="max-w-5xl">
      <Link href="/admin/du-an" className="text-sm text-cvr-muted hover:text-cvr-ink">← Dự án</Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-cvr-ink">Nạp dự án bằng tệp CSV</h1>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <a href="/mau-nhap-du-an.csv" download className="rounded-lg border border-cvr-line bg-white px-4 py-2 text-sm font-medium text-cvr-ink hover:border-cvr-ink">
          Tải tệp mẫu
        </a>
        <label className="cursor-pointer rounded-lg bg-cvr-ink px-4 py-2 text-sm font-semibold text-white hover:bg-cvr-ink/90">
          Chọn tệp CSV
          <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => chonTep(e.target.files?.[0])} />
        </label>
        {tenTep && <span className="text-sm text-cvr-muted">{tenTep}</span>}
      </div>

      {dong.length > 0 && (
        <>
          <div className="mt-5 overflow-hidden rounded-2xl border border-cvr-line bg-white shadow-lux">
            {dong.map((d) => (
              <div key={d.dong} className="flex flex-wrap items-center gap-3 border-b border-cvr-line/70 px-4 py-2.5 text-sm last:border-0">
                <span className="w-12 shrink-0 text-cvr-faint">#{d.dong}</span>
                <span className="min-w-0 flex-1 font-medium text-cvr-ink">{d.ten || "—"}</span>
                {d.loi.length ? (
                  <span className="text-red-600">{d.loi.join(" · ")}</span>
                ) : (
                  <span className="text-cvr-muted">/du-an/{d.slug}</span>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            disabled={dangNap || hopLe.length === 0}
            onClick={nap}
            className="mt-4 rounded-lg bg-cvr-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cvr-blue-ink disabled:opacity-50"
          >
            {dangNap ? "Đang nạp…" : `Nạp ${hopLe.length} dự án hợp lệ`}
          </button>
        </>
      )}
      {ketQua && <p className="mt-3 text-sm font-medium text-cvr-ink">{ketQua}</p>}
    </div>
  );
}
