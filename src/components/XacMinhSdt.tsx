"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// ============================================================================
// XÁC MINH SỐ ĐIỆN THOẠI CỦA TÀI KHOẢN — hiện ở đầu trang Đăng tin khi tài khoản
// (đăng ký bằng email / Google) chưa có số đã xác minh. Quy tắc chủ dự án chốt
// 27/09/2026: mọi tài khoản bắt buộc có số điện thoại, 1 số = 1 tài khoản.
// Hai bước ngay tại chỗ: nhập số → nhận mã Zalo → nhập mã. Xong là đăng tin tiếp.
// ============================================================================
// tuGui: mở ra là GỬI MÃ LUÔN (dùng trong hộp bật lên khi bấm Đăng tin) — khách chỉ việc nhập mã.
export default function XacMinhSdt({ soGoiY, onXong, tuGui, tieuDe = "Xác minh số điện thoại để đăng tin" }: { soGoiY?: string; onXong: (sdt: string, soTinGop: number) => void; tuGui?: boolean; tieuDe?: string }) {
  const [sdt, setSdt] = useState(soGoiY ?? "");
  const [ma, setMa] = useState("");
  const [daGui, setDaGui] = useState(false);
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState("");
  const daTuGui = useRef(false);
  useEffect(() => {
    if (tuGui && !daTuGui.current && sdt.replace(/\D/g, "").length >= 10) {
      daTuGui.current = true;
      goi("gui-ma");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tuGui]);

  async function goi(buoc: "gui-ma" | "xac-nhan") {
    setDang(true);
    setLoi("");
    try {
      const { data: { session } } = await createClient().auth.getSession();
      const r = await fetch("/api/xac-thuc/xac-minh-sdt", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token ?? ""}` },
        body: JSON.stringify({ buoc, sdt, ma }),
      });
      const j = await r.json();
      if (!j.ok) return setLoi(j.loi || "Chưa xác minh được. Vui lòng thử lại.");
      if (buoc === "gui-ma") setDaGui(true);
      else onXong(j.sdt, Number(j.soTinGop) || 0);
    } catch {
      setLoi("Không kết nối được hệ thống. Vui lòng thử lại.");
    } finally {
      setDang(false);
    }
  }

  const oCls = "h-11 w-full rounded-lg border border-cvr-line bg-white px-3 text-sm text-cvr-ink outline-none focus:border-cvr-ink";
  const nutCls = "h-11 shrink-0 rounded-lg bg-cvr-ink px-4 text-sm font-semibold text-white transition hover:bg-cvr-ink/90 disabled:opacity-60";

  return (
    <div className="rounded-xl border border-cvr-line bg-cvr-surface p-4 sm:p-5">
      <p className="text-[15px] font-semibold text-cvr-ink">{tieuDe}</p>
      {daGui && <p className="mt-1 text-sm text-cvr-muted">Mã 6 số vừa gửi tới Zalo của số này.</p>}
      <div className="mt-3 flex gap-2">
        <input
          value={sdt}
          onChange={(e) => { setSdt(e.target.value); setDaGui(false); setMa(""); }}
          inputMode="tel"
          placeholder="Số điện thoại của bạn"
          className={oCls}
        />
        <button type="button" onClick={() => goi("gui-ma")} disabled={dang || sdt.replace(/\D/g, "").length < 10} className={nutCls}>
          {daGui ? "Gửi lại" : "Nhận mã Zalo"}
        </button>
      </div>
      {daGui && (
        <div className="mt-2 flex gap-2">
          <input
            value={ma}
            onChange={(e) => setMa(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="Mã 6 số trong Zalo"
            className={`${oCls} tracking-widest`}
          />
          <button type="button" onClick={() => goi("xac-nhan")} disabled={dang || ma.length !== 6} className={nutCls}>
            Xác minh
          </button>
        </div>
      )}
      {loi && <p className="mt-2 text-sm font-medium text-red-600">{loi}</p>}
    </div>
  );
}
