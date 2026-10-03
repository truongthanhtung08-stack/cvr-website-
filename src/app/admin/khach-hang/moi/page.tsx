"use client";

import { useState } from "react";
import Link from "next/link";

// Admin tạo tài khoản hộ khách — máy chủ gắn "tạo hộ" (0058); chính chủ vào bằng mã Zalo
// tới số của mình là tự gộp vào tài khoản này.
export default function NewCustomerPage() {
  const [hoTen, setHoTen] = useState("");
  const [sdt, setSdt] = useState("");
  const [email, setEmail] = useState("");
  const [dangGui, setDangGui] = useState(false);
  const [loi, setLoi] = useState("");
  const [xong, setXong] = useState(false);

  async function tao() {
    setLoi("");
    setDangGui(true);
    try {
      const r = await fetch("/api/admin/tao-khach-hang", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hoTen, sdt, email }),
      });
      const j = (await r.json().catch(() => ({}))) as { ok?: boolean; loi?: string };
      if (!r.ok || !j.ok) setLoi(j.loi || "Không tạo được tài khoản.");
      else setXong(true);
    } finally {
      setDangGui(false);
    }
  }

  const o = "h-11 w-full rounded-lg border border-cvr-line bg-white px-3 text-sm text-cvr-ink outline-none focus:border-cvr-ink";
  return (
    <div className="max-w-md">
      <Link href="/admin/khach-hang" className="text-sm text-cvr-muted hover:text-cvr-ink">← Khách hàng</Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-cvr-ink">Tạo khách hàng</h1>
      {xong ? (
        <div className="mt-5 rounded-2xl border border-cvr-line bg-white p-5 shadow-lux">
          <p className="text-sm text-cvr-ink">Đã tạo tài khoản cho {hoTen} · {sdt}.</p>
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={() => { setHoTen(""); setSdt(""); setEmail(""); setXong(false); }}
              className="h-10 rounded-lg bg-cvr-ink px-4 text-sm font-semibold text-white">Tạo tiếp</button>
            <Link href="/admin/khach-hang" className="flex h-10 items-center rounded-lg border border-cvr-line px-4 text-sm text-cvr-body">Về danh sách</Link>
          </div>
        </div>
      ) : (
        <div className="mt-5 space-y-3 rounded-2xl border border-cvr-line bg-white p-5 shadow-lux">
          <input value={hoTen} onChange={(e) => setHoTen(e.target.value)} placeholder="Họ tên" aria-label="Họ tên" className={o} />
          <input value={sdt} onChange={(e) => setSdt(e.target.value)} placeholder="Số điện thoại" aria-label="Số điện thoại" type="tel" className={o} />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (nếu có)" aria-label="Email" type="email" className={o} />
          {loi && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{loi}</p>}
          <button type="button" onClick={tao} disabled={dangGui || !hoTen.trim() || !sdt.trim()}
            className="h-11 w-full rounded-lg bg-cvr-ink text-sm font-semibold text-white disabled:opacity-50">
            {dangGui ? "Đang tạo…" : "Tạo tài khoản"}
          </button>
        </div>
      )}
    </div>
  );
}
