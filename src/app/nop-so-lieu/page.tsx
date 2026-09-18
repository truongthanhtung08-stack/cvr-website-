"use client";

import { useRef, useState } from "react";

// ════════════════════════════════════════════════════════════════════════════
// CỬA NỘP SỐ LIỆU CHO NGƯỜI LÀM DỮ LIỆU THUÊ NGOÀI.
//
// Một trang duy nhất, không đăng nhập, không vào được chỗ nào khác: mở bằng mã
// do chủ dự án cấp, kéo tệp vào, máy kiểm rồi tự ghi lên website.
//
// Vì sao KHÔNG cấp tài khoản admin: người làm dữ liệu chỉ cần đúng một việc là
// nộp tệp giá. Cho họ vào admin là cho luôn tin đăng, khách hàng, ví tiền —
// đổi lấy tiện lợi bằng rủi ro không đáng.
// ════════════════════════════════════════════════════════════════════════════

type KetQua = {
  ok: boolean;
  loi?: string;
  nhan?: number;
  moc?: number;
  tongDay?: number;
  day?: string[];
  chan?: { day: string; ly: string }[];
  dongLoi?: { dong: number; ly: string }[];
};

export default function NopSoLieu() {
  const [ma, setMa] = useState("");
  const [dangGui, setDangGui] = useState(false);
  const [kq, setKq] = useState<KetQua | null>(null);
  const oTep = useRef<HTMLInputElement>(null);

  async function gui(e: React.FormEvent) {
    e.preventDefault();
    const tep = oTep.current?.files?.[0];
    if (!tep || !ma) return;

    setDangGui(true);
    setKq(null);
    const form = new FormData();
    form.set("ma", ma);
    form.set("tep", tep);
    try {
      const r = await fetch("/api/chi-so-gia/nop", { method: "POST", body: form });
      setKq(await r.json());
      if (oTep.current) oTep.current.value = "";
    } catch {
      setKq({ ok: false, loi: "Mạng lỗi, thử lại." });
    }
    setDangGui(false);
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-12 sm:py-16">
      <h1 className="text-[26px] font-bold tracking-tight text-cvr-ink">Nộp số liệu lịch sử giá</h1>
      <p className="mt-2 text-[14.5px] leading-relaxed text-cvr-muted">
        Chọn tệp Excel đã điền rồi bấm Nộp. Số hợp lệ lên website ngay, không cần chờ ai duyệt.
      </p>

      <form onSubmit={gui} className="mt-7 space-y-4 rounded-2xl bg-white p-5 shadow-lux ring-1 ring-cvr-line">
        <label className="block">
          <span className="text-[13px] font-semibold text-cvr-ink">Mã nộp</span>
          <input
            type="password"
            value={ma}
            onChange={(e) => setMa(e.target.value)}
            placeholder="Mã do Coastal Land cấp"
            className="mt-1.5 w-full rounded-xl border border-cvr-line px-3.5 py-2.5 text-[15px] outline-none focus:border-cvr-blue"
          />
        </label>

        <label className="block">
          <span className="text-[13px] font-semibold text-cvr-ink">Tệp số liệu</span>
          <input
            ref={oTep}
            type="file"
            accept=".xlsx,.csv"
            className="mt-1.5 w-full rounded-xl border border-cvr-line px-3.5 py-2.5 text-[14px] file:mr-3 file:rounded-lg file:border-0 file:bg-cvr-ink file:px-3 file:py-1.5 file:text-[13px] file:text-white"
          />
        </label>

        <button
          type="submit"
          disabled={dangGui || !ma}
          className="w-full rounded-xl bg-cvr-blue px-4 py-3 text-[15px] font-semibold text-white disabled:opacity-40"
        >
          {dangGui ? "Đang kiểm và nạp…" : "Nộp"}
        </button>
      </form>

      {kq && (
        <div
          className={`mt-5 rounded-2xl p-5 ring-1 ${
            kq.ok ? "bg-green-50 ring-green-200" : "bg-amber-50 ring-amber-200"
          }`}
        >
          {kq.ok ? (
            <>
              <p className="text-[15px] font-semibold text-green-900">
                Đã nạp {kq.nhan} dãy, {kq.moc} mốc giá — số đã lên website.
              </p>
              {!!kq.day?.length && (
                <ul className="mt-2.5 space-y-0.5 text-[13px] text-green-900">
                  {kq.day.slice(0, 12).map((d) => (
                    <li key={d}>· {d}</li>
                  ))}
                  {kq.day.length > 12 && <li>· … và {kq.day.length - 12} dãy nữa</li>}
                </ul>
              )}
            </>
          ) : (
            <p className="text-[15px] font-semibold text-amber-900">{kq.loi}</p>
          )}

          {!!kq.chan?.length && (
            <div className="mt-3.5 border-t border-amber-200 pt-3">
              <p className="text-[13.5px] font-semibold text-amber-900">
                {kq.chan.length} dãy bị giữ lại vì giá nhảy bất thường — kiểm lại rồi nộp lại dãy đó:
              </p>
              <ul className="mt-1.5 space-y-0.5 text-[13px] text-amber-900">
                {kq.chan.map((c) => (
                  <li key={c.day}>
                    · {c.day} — {c.ly}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!!kq.dongLoi?.length && (
            <div className="mt-3.5 border-t border-amber-200 pt-3">
              <p className="text-[13.5px] font-semibold text-amber-900">Dòng không đọc được:</p>
              <ul className="mt-1.5 space-y-0.5 text-[13px] text-amber-900">
                {kq.dongLoi.map((d) => (
                  <li key={d.dong}>
                    · Dòng {d.dong}: {d.ly}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <p className="mt-6 text-[12.5px] leading-relaxed text-cvr-faint">
        Nộp được nhiều lần. Dãy nào có trong tệp thì thay hẳn dãy đó, dãy cũ không nhắc tới vẫn giữ nguyên —
        nên gửi từng phần mỗi ngày, hoặc gửi lại một dãy để sửa, đều được.
      </p>
    </main>
  );
}
