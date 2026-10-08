"use client";

import { useEffect, useState } from "react";
import { Panel } from "@/components/Ui";
import { getTier, type TierId } from "@/lib/packages";
import type { QuyDinhGia, DongQuyenLoi } from "@/lib/quyDinhGia";

// ============================================================================
// ADMIN — QUY ĐỊNH & QUYỀN LỢI GÓI (một nguồn duy nhất, chủ dự án chốt 25/09/2026)
// Mỗi ô: MỖI DÒNG MỘT Ý. Chỉ sửa bản nháp — lên web khi bấm Duyệt (09/10/2026:
// không duyệt = không hiển thị, code không có chữ mặc định nào).
// ============================================================================

const HANG: TierId[] = ["diamond", "gold", "silver", "basic"];
const tachDong = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);
const inputCls = "mt-1 w-full rounded-lg border border-cvr-line px-2.5 py-2 text-sm text-cvr-ink outline-none focus:border-cvr-ink";

function ODong({ nhan, value, onChange, rows = 4 }: { nhan: string; value: string[]; onChange: (v: string[]) => void; rows?: number }) {
  const [chu, setChu] = useState(value.join("\n"));
  useEffect(() => setChu(value.join("\n")), [value]);
  return (
    <label className="block text-xs text-cvr-muted">
      {nhan}
      <textarea rows={rows} value={chu} onChange={(e) => setChu(e.target.value)} onBlur={() => onChange(tachDong(chu))}
        className="mt-1 w-full rounded-lg border border-cvr-line px-2.5 py-2 text-sm leading-relaxed text-cvr-ink outline-none focus:border-cvr-ink" />
    </label>
  );
}

const dongTrong = (): DongQuyenLoi => ({ ten: "", giaTri: { diamond: "", gold: "", silver: "", basic: "" } });

export default function QuyDinhGiaEditor({ value: qd, onChange: sua }: { value: QuyDinhGia; onChange: (q: QuyDinhGia) => void }) {
  const suaHang = (t: TierId, phan: "loiIch" | "hienThi", v: string[]) =>
    sua({ ...qd, quyenLoi: { ...qd.quyenLoi, [t]: { ...qd.quyenLoi[t], [phan]: v } } });
  const suaBang = (i: number, d: DongQuyenLoi) => sua({ ...qd, bangQuyenLoi: qd.bangQuyenLoi.map((x, k) => (k === i ? d : x)) });

  return (
    <div className="space-y-4">
      <Panel title="Quyền lợi từng hạng tin">
        <div className="space-y-4">
          {HANG.map((t) => (
            <div key={t} className="rounded-xl border border-cvr-line p-3">
              <p className="mb-2 font-semibold" style={{ color: getTier(t).accent }}>{getTier(t).name}</p>
              <div className="grid gap-3 md:grid-cols-2">
                <ODong nhan="Lợi ích" value={qd.quyenLoi[t].loiIch} onChange={(v) => suaHang(t, "loiIch", v)} />
                <ODong nhan="Hiển thị" value={qd.quyenLoi[t].hienThi} onChange={(v) => suaHang(t, "hienThi", v)} />
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Bảng so sánh quyền lợi">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-left text-xs text-cvr-muted">
                <th className="py-1 pr-2 font-medium">Quyền lợi</th>
                {HANG.map((t) => <th key={t} className="py-1 pr-2 font-medium" style={{ color: getTier(t).accent }}>{getTier(t).name}</th>)}
                <th />
              </tr>
            </thead>
            <tbody>
              {qd.bangQuyenLoi.map((d, i) => (
                <tr key={i}>
                  <td className="py-1 pr-2"><input value={d.ten} onChange={(e) => suaBang(i, { ...d, ten: e.target.value })} className={inputCls} /></td>
                  {HANG.map((t) => (
                    <td key={t} className="py-1 pr-2">
                      <input value={d.giaTri[t]} onChange={(e) => suaBang(i, { ...d, giaTri: { ...d.giaTri, [t]: e.target.value } })} className={inputCls} />
                    </td>
                  ))}
                  <td className="py-1">
                    <button type="button" onClick={() => sua({ ...qd, bangQuyenLoi: qd.bangQuyenLoi.filter((_, k) => k !== i) })}
                      className="text-xs text-cvr-muted hover:text-red-600">Xoá</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button type="button" onClick={() => sua({ ...qd, bangQuyenLoi: [...qd.bangQuyenLoi, dongTrong()] })}
          className="mt-3 rounded-lg border border-dashed border-cvr-line px-4 py-2 text-sm font-semibold text-cvr-ink hover:border-cvr-ink">
          + Dòng
        </button>
      </Panel>

      <Panel title="Quy định gói tin">
        <ODong nhan="" value={qd.quyDinhGoiTin} onChange={(v) => sua({ ...qd, quyDinhGoiTin: v })} />
      </Panel>

      <Panel title="Quy định đẩy tin">
        <ODong nhan="" value={qd.quyDinhDayTin} onChange={(v) => sua({ ...qd, quyDinhDayTin: v })} />
      </Panel>

      <Panel title="Quyền lợi gói dự án">
        <div className="grid gap-3 md:grid-cols-3">
          {(["diamond", "gold", "silver"] as const).map((t) => (
            <ODong key={t} nhan={`CVR-PJ ${getTier(t).name.replace("CVR ", "")}`} value={qd.quyenLoiDuAn[t]}
              onChange={(v) => sua({ ...qd, quyenLoiDuAn: { ...qd.quyenLoiDuAn, [t]: v } })} />
          ))}
        </div>
      </Panel>

      <Panel title="Quy định banner">
        <ODong nhan="" value={qd.quyDinhBanner} onChange={(v) => sua({ ...qd, quyDinhBanner: v })} />
      </Panel>

      <Panel title="Quy định chung">
        <ODong nhan="" value={qd.quyDinhChung} onChange={(v) => sua({ ...qd, quyDinhChung: v })} rows={8} />
      </Panel>

      <Panel title="Điều kiện gói hội viên">
        <ODong nhan="" value={qd.dieuKienHoiVien} onChange={(v) => sua({ ...qd, dieuKienHoiVien: v })} rows={4} />
      </Panel>
    </div>
  );
}
