"use client";

import { useState } from "react";
import { getTier } from "@/lib/packages";
import { vnd } from "@/lib/billing";
import { yeuCauNangCuaTin } from "@/lib/nangGoi";
import type { ListingRow } from "@/lib/listingAdmin";

// ============================================================================
// ADMIN — YÊU CẦU NÂNG GÓI CHỜ DUYỆT (chủ dự án chốt 01/11/2026)
// Tin vẫn hiện với gói cũ; tiền đang tạm giữ. Duyệt = trừ ví, đổi gói, hạn = ngày duyệt + số ngày gói mới.
// Từ chối = nhả tạm giữ, báo khách. Máy chủ: /api/admin/nang-goi.
// ============================================================================
export default function YeuCauNangGoi({ rows, onDoi }: { rows: ListingRow[]; onDoi: (r: ListingRow) => void }) {
  const [dang, setDang] = useState("");
  const ds = rows.filter((r) => yeuCauNangCuaTin(r));
  if (!ds.length) return null;

  async function xuLy(r: ListingRow, tuChoi: boolean) {
    let lyDo: string | null = null;
    if (tuChoi) {
      lyDo = window.prompt("Lý do từ chối yêu cầu nâng gói (khách nhận đúng dòng này):");
      if (lyDo === null) return;
    }
    setDang(r.id);
    const res = await fetch("/api/admin/nang-goi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: r.id, tuChoi, lyDo }),
    });
    const j = await res.json().catch(() => ({ ok: false, message: "Máy chủ không trả lời" }));
    setDang("");
    if (!j.ok) return window.alert(j.message ?? "Lỗi không rõ");
    if (j.boQua) window.alert(j.boQua);
    const yc = yeuCauNangCuaTin(r);
    const { nang_cho: _bo, ...details } = (r.details ?? {}) as Record<string, unknown>;
    void _bo;
    onDoi({
      ...r,
      details,
      ...(!tuChoi && yc && !j.boQua ? { tier: yc.tier, tier_expires_at: j.hetHan } : {}),
    } as ListingRow);
  }

  return (
    <div className="mt-5 rounded-xl border border-cvr-line bg-white p-4">
      <p className="text-sm font-semibold text-cvr-ink">Yêu cầu nâng gói chờ duyệt · {ds.length}</p>
      <ul className="mt-3 divide-y divide-cvr-line">
        {ds.map((r) => {
          const yc = yeuCauNangCuaTin(r)!;
          return (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-sm">
              <div className="min-w-0">
                <a href={`/bat-dong-san/${r.id}`} target="_blank" rel="noopener" className="font-medium text-cvr-ink hover:underline">{r.title}</a>
                <p className="mt-0.5 text-xs text-cvr-muted">
                  {getTier(r.tier).name} → <span style={{ color: getTier(yc.tier).accent }}>{getTier(yc.tier).name}</span> · {yc.days} ngày
                  {yc.khauTru ? ` · khấu trừ −${vnd(yc.khauTru)}` : ""} · tạm giữ {vnd(yc.tongTra)} · gửi{" "}
                  {new Date(yc.gui_luc).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}
                </p>
              </div>
              <div className="flex gap-2">
                <button type="button" disabled={dang === r.id} onClick={() => xuLy(r, false)}
                  className="rounded-lg bg-cvr-ink px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">Duyệt</button>
                <button type="button" disabled={dang === r.id} onClick={() => xuLy(r, true)}
                  className="rounded-lg border border-cvr-line px-3 py-1.5 text-xs font-semibold text-cvr-ink disabled:opacity-50">Từ chối</button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
