"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// ============================================================================
// KHỐI MẬT KHẨU TRONG CÀI ĐẶT — CHUẨN THẾ GIỚI (chủ dự án 05/11/2026):
//   · Vào bằng số / email → Đổi mật khẩu: hiện tại · mới · nhập lại; quên mật khẩu hiện tại → /quen-mat-khau.
//   · Vào bằng Gmail · Zalo · Facebook → không có mật khẩu Coastal Land, chỉ ghi đăng nhập bằng gì.
// Máy chủ quyết loại tài khoản (/api/xac-thuc/mat-khau-tk).
// ============================================================================

const TEN_MXH = { google: "Google", facebook: "Facebook", zalo: "Zalo" } as const;

export default function KhoiMatKhau() {
  const [mxh, setMxh] = useState<keyof typeof TEN_MXH | null | undefined>(undefined);
  const [cu, setCu] = useState("");
  const [moi, setMoi] = useState("");
  const [moi2, setMoi2] = useState("");
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState("");
  const [xong, setXong] = useState(false);

  const token = async () => (await createClient().auth.getSession()).data.session?.access_token ?? "";
  useEffect(() => {
    void (async () => {
      const r = await fetch("/api/xac-thuc/mat-khau-tk", { headers: { Authorization: `Bearer ${await token()}` } })
        .then((x) => x.json()).catch(() => null);
      setMxh(r?.ok ? r.mxh : null);
    })();
  }, []);

  async function luu(e: React.FormEvent) {
    e.preventDefault();
    setLoi(""); setXong(false);
    if (!cu) return setLoi("Nhập mật khẩu hiện tại.");
    if (moi.length < 6) return setLoi("Mật khẩu mới cần ít nhất 6 ký tự.");
    if (moi !== moi2) return setLoi("Hai lần nhập mật khẩu mới chưa khớp.");
    setDang(true);
    const r = await fetch("/api/xac-thuc/mat-khau-tk", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${await token()}` },
      body: JSON.stringify({ matKhauCu: cu, matKhauMoi: moi }),
    }).then((x) => x.json()).catch(() => ({ ok: false, loi: "Không kết nối được hệ thống." }));
    setDang(false);
    if (!r.ok) return setLoi(r.loi ?? "Chưa đổi được mật khẩu.");
    setXong(true); setCu(""); setMoi(""); setMoi2("");
  }

  const oCls = "mt-1 h-11 w-full rounded-lg border border-cvr-line px-3 text-sm text-cvr-ink outline-none transition focus:border-cvr-ink";
  return (
    <div className="rounded-2xl border border-cvr-line bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-base font-semibold text-cvr-ink">Mật khẩu</h2>
      {mxh === undefined ? null : mxh ? (
        <p className="mt-2 text-sm text-cvr-body">Bạn đăng nhập bằng {TEN_MXH[mxh]}.</p>
      ) : (
        <>
          {xong && <p className="mt-2 text-sm font-medium text-green-700">Đã đổi mật khẩu.</p>}
            <form onSubmit={luu} className="mt-3 max-w-sm space-y-3">
              <label className="block">
                <span className="text-sm font-medium text-cvr-body">Mật khẩu hiện tại</span>
                <input type="password" value={cu} onChange={(e) => setCu(e.target.value)} autoComplete="current-password" className={oCls} />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-cvr-body">Mật khẩu mới</span>
                <input type="password" value={moi} onChange={(e) => setMoi(e.target.value)} autoComplete="new-password" placeholder="Ít nhất 6 ký tự" className={oCls} />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-cvr-body">Nhập lại mật khẩu mới</span>
                <input type="password" value={moi2} onChange={(e) => setMoi2(e.target.value)} autoComplete="new-password" className={oCls} />
              </label>
              {loi && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{loi}</p>}
              <div className="flex items-center justify-between gap-3">
                <button type="submit" disabled={dang} className="rounded-lg bg-cvr-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cvr-ink/90 disabled:opacity-60">
                  {dang ? "Đang lưu…" : "Đổi mật khẩu"}
                </button>
                <Link href="/quen-mat-khau" className="text-sm text-cvr-body hover:text-cvr-ink">Quên mật khẩu?</Link>
              </div>
            </form>
        </>
      )}
    </div>
  );
}
