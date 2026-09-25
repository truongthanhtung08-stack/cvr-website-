"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Panel } from "@/components/Ui";
import { getTier, type TierId } from "@/lib/packages";
import { dienMa, ghepQuyDinh, KHOA_QUY_DINH_GIA, type QuyDinhGia } from "@/lib/quyDinhGia";

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

export default function QuyDinhGiaEditor() {
  const [qd, setQd] = useState<QuyDinhGia | null>(null);
  const [daSua, setDaSua] = useState(false);
  const [dangLuu, setDangLuu] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    createClient().from("site_content").select("data").eq("key", KHOA_QUY_DINH_GIA).limit(1)
      .then(({ data }) => setQd(ghepQuyDinh(data?.[0]?.data as Partial<QuyDinhGia> | undefined)));
  }, []);

  if (!qd) return <p className="text-sm text-cvr-muted">Đang tải quy định…</p>;
  const sua = (next: QuyDinhGia) => { setQd(next); setDaSua(true); setMsg(null); };
  const suaHang = (t: TierId, phan: "loiIch" | "hienThi", v: string[]) =>
    sua({ ...qd, quyenLoi: { ...qd.quyenLoi, [t]: { ...qd.quyenLoi[t], [phan]: v } } });

  async function luu() {
    if (!qd) return;
    setDangLuu(true);
    const { error } = await createClient().from("site_content").upsert({ key: KHOA_QUY_DINH_GIA, data: qd });
    if (!error) await fetch("/api/lam-moi", { method: "POST", body: JSON.stringify({ the: "noi-dung" }) }).catch(() => {});
    setDangLuu(false);
    if (error) return setMsg({ ok: false, text: `Lưu thất bại: ${error.message}` });
    setDaSua(false);
    setMsg({ ok: true, text: "Đã lưu — trang Bảng giá và Gói hội viên đổi ngay." });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-semibold">Đang ghi trên web nhưng CHƯA làm thật (đo ngày 25/09/2026)</p>
        <ul className="mt-1 list-disc pl-5">
          <li>“Nhân đôi hiển thị” của CVR Diamond — web chưa tặng kèm tin thường, chưa đẩy kèm.</li>
          <li>“Chèn 1 link bất kỳ dưới tin đăng” — form đăng tin chưa có ô chèn link.</li>
          <li>“Ưu tiên kiểm duyệt trước” cho tin VIP — hàng chờ duyệt chưa xếp theo hạng.</li>
        </ul>
        <p className="mt-1">Sửa hoặc bỏ các dòng này trước khi thu tiền thật, hoặc giao làm thật rồi giữ.</p>
      </div>

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

      {msg && <p className={`rounded-lg px-4 py-2.5 text-sm ${msg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{msg.text}</p>}
      <div className="flex justify-end">
        <button type="button" onClick={luu} disabled={dangLuu}
          className="rounded-lg bg-cvr-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cvr-ink/90 disabled:opacity-60">
          {dangLuu ? "Đang lưu…" : daSua ? "Lưu quy định *" : "Lưu quy định"}
        </button>
      </div>
    </div>
  );
}
