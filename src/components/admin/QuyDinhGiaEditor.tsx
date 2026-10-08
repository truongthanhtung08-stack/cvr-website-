"use client";

import { useEffect, useState } from "react";
import { Panel } from "@/components/Ui";
import { getTier, type TierId } from "@/lib/packages";
import { dienMa, type QuyDinhGia } from "@/lib/quyDinhGia";

// ============================================================================
// ADMIN — QUY ĐỊNH & QUYỀN LỢI GÓI (một nguồn duy nhất, chủ dự án chốt 25/09/2026)
// Mỗi ô: MỖI DÒNG MỘT Ý. Lưu là web đổi ngay (trang Bảng giá, Gói hội viên).
// ============================================================================

const HANG: TierId[] = ["diamond", "gold", "silver", "basic"];
const tachDong = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);

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

// MỘT ĐƯỜNG (08/10/2026): chỉ sửa bản nháp của trang Bảng giá — lên web khi bấm Công bố.
export default function QuyDinhGiaEditor({ value: qd, onChange: sua }: { value: QuyDinhGia; onChange: (q: QuyDinhGia) => void }) {
  const suaHang = (t: TierId, phan: "loiIch" | "hienThi", v: string[]) =>
    sua({ ...qd, quyenLoi: { ...qd.quyenLoi, [t]: { ...qd.quyenLoi[t], [phan]: v } } });

  return (
    <div className="space-y-4">
      {/* 01/10/2026: ba quyền lợi từng "ghi mà chưa làm" (nhân đôi hiển thị, chèn link,
          ưu tiên kiểm duyệt) ĐÃ LÀM THẬT — gỡ khung cảnh báo. Thêm quyền lợi mới ở đây thì
          PHẢI làm thật trên web trước, không ghi trước. */}
      <Panel title="Quyền lợi từng hạng tin" desc="Mã tự điền theo cơ chế đang chạy: {X} hệ số tiếp cận · {VI_TRI} vị trí hiển thị · {NHAN_DIEN} nhận diện thẻ tin · {SUAT_GHIM} số suất trên Trang chủ. Mỗi dòng một ý.">
        <div className="space-y-4">
          {HANG.map((t) => (
            <div key={t} className="rounded-xl border border-cvr-line p-3">
              <p className="mb-2 font-semibold" style={{ color: getTier(t).accent }}>{getTier(t).name}</p>
              <div className="grid gap-3 md:grid-cols-2">
                <ODong nhan="Lợi ích" value={qd.quyenLoi[t].loiIch} onChange={(v) => suaHang(t, "loiIch", v)} />
                <ODong nhan="Hiển thị" value={qd.quyenLoi[t].hienThi} onChange={(v) => suaHang(t, "hienThi", v)} />
              </div>
              <p className="mt-2 text-[11px] text-cvr-faint">Khách thấy: {qd.quyenLoi[t].loiIch.slice(0, 1).map((d) => dienMa(d, t)).join("")}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Quy định chung" desc="Hiện cuối trang Bảng giá. Mỗi dòng một điều.">
        <ODong nhan="" value={qd.quyDinhChung} onChange={(v) => sua({ ...qd, quyDinhChung: v })} rows={8} />
      </Panel>

      <Panel title="Điều kiện gói hội viên" desc="Hiện dưới các gói ở trang Bảng giá và trang Gói hội viên của khách. Mỗi dòng một điều.">
        <ODong nhan="" value={qd.dieuKienHoiVien} onChange={(v) => sua({ ...qd, dieuKienHoiVien: v })} rows={4} />
      </Panel>

    </div>
  );
}
