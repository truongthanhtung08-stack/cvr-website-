"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/Ui";
import { ngayVN } from "@/lib/ngayVN";

// ════════════════════════════════════════════════════════════════════════════
// TÌM KIẾM ĐÃ LƯU (Smart Search mục 7 · 02/10/2026)
// Bộ lọc khách lưu bằng nút "Nhận tin mới" trên /mua-ban, /cho-thue (bảng tim_kiem_luu,
// 0055). 8h sáng mỗi ngày có tin mới khớp thì báo khách (/api/thong-bao/dinh-ky).
// Ở đây: mở lại đúng bộ lọc · xoá bộ lọc không cần nữa.
// ════════════════════════════════════════════════════════════════════════════
type Dong = { id: string; muc_dich: "ban" | "thue"; tham_so: string; ten: string; bao_luc: string | null; created_at: string };

export default function TimKiemDaLuu() {
  const [ds, setDs] = useState<Dong[] | null>(null);

  useEffect(() => {
    createClient()
      .from("tim_kiem_luu")
      .select("id,muc_dich,tham_so,ten,bao_luc,created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => setDs((data ?? []) as Dong[]));
  }, []);

  async function xoa(id: string) {
    const { error } = await createClient().from("tim_kiem_luu").delete().eq("id", id);
    if (!error) setDs((cu) => (cu ?? []).filter((d) => d.id !== id));
  }

  const link = (d: Dong) => `/${d.muc_dich === "ban" ? "mua-ban" : "cho-thue"}${d.tham_so ? `?${d.tham_so}` : ""}`;

  return (
    <div className="space-y-5">
      <PageHeader title="Tìm kiếm đã lưu" />
      {ds === null ? (
        <p className="text-sm text-cvr-muted">Đang tải…</p>
      ) : ds.length === 0 ? (
        <div className="rounded-2xl border border-cvr-line bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-cvr-muted">Chưa có tìm kiếm nào được lưu.</p>
          <Link href="/mua-ban" className="mt-4 inline-flex rounded-full bg-cvr-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cvr-blue-ink">
            Tìm nhà đất
          </Link>
        </div>
      ) : (
        <ul className="overflow-hidden rounded-2xl border border-cvr-line bg-white shadow-sm">
          {ds.map((d, i) => (
            <li key={d.id} className={`flex items-center gap-3 px-4 py-3.5 ${i > 0 ? "border-t border-cvr-line/70" : ""}`}>
              <Link href={link(d)} className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium text-cvr-ink">{d.ten}</p>
                <p className="mt-0.5 text-xs text-cvr-muted">
                  {d.muc_dich === "ban" ? "Mua bán" : "Cho thuê"} · Lưu {ngayVN(d.created_at)}
                  {d.bao_luc ? ` · Báo gần nhất ${ngayVN(d.bao_luc)}` : ""}
                </p>
              </Link>
              <button
                type="button"
                onClick={() => xoa(d.id)}
                className="shrink-0 rounded-lg border border-cvr-line px-3 py-1.5 text-xs font-medium text-cvr-body transition hover:border-red-500 hover:text-red-600"
              >
                Xoá
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
