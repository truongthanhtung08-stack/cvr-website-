"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { chuanHoaSdt, laSdtVN } from "@/lib/phone";

// ============================================================================
// QUÊN MẬT KHẨU — MÃ 6 SỐ (chủ dự án chốt 11/09/2026)
//
// Trước đây gửi LIÊN KẾT đặt lại: khách phải rời trang, mở hộp thư, bấm vào một
// đường dẫn dài — nhiều người ngại bấm, và thư dạng đó hay rơi vào mục quảng cáo.
// Nay giống hệt bước đăng ký: nhận mã, gõ mã, đặt mật khẩu mới, đăng nhập luôn.
//
// NHẬN CẢ EMAIL LẪN SỐ ĐIỆN THOẠI trong cùng một ô:
//   · gõ email        → mã gửi qua email
//   · gõ số điện thoại → mã gửi qua Zalo
// Áp dụng cho MỌI tài khoản, kể cả tài khoản chủ dự án tạo hộ và tài khoản khách
// tự đăng ký. Rất nhiều môi giới chỉ có số điện thoại — bắt nhập email ở bước
// quên mật khẩu là khoá luôn đường vào của nhóm khách đông nhất.
// ============================================================================

export default function ForgotPasswordForm() {
  const [buoc, setBuoc] = useState<"email" | "ma">("email");
  // MỘT Ô cho cả email lẫn số điện thoại — khách được đăng tin hộ nhiều người
  // chỉ có số điện thoại, bắt nhập email là khoá luôn đường vào của họ.
  const [dinhDanh, setDinhDanh] = useState("");
  const [kenh, setKenh] = useState<"email" | "zalo">("email");
  const [ma, setMa] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [loi, setLoi] = useState("");
  const [dangChay, setDangChay] = useState(false);

  const oCls =
    "mt-1 h-11 w-full rounded-lg border border-cvr-line px-4 text-[15px] text-cvr-ink outline-none transition placeholder:text-cvr-faint focus:border-cvr-ink";

  async function guiMa(e: React.FormEvent) {
    e.preventDefault();
    setLoi("");
    const v = dinhDanh.trim();
    if (!v) return setLoi("Nhập email hoặc số điện thoại của tài khoản.");
    const laSo = laSdtVN(chuanHoaSdt(v));
    if (!laSo && !v.includes("@")) return setLoi("Nhập đúng email hoặc số điện thoại (10 số).");
    setDangChay(true);
    try {
      const r = await fetch("/api/xac-thuc/gui-ma", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          laSo
            ? { sdt: chuanHoaSdt(v), kenh: "zalo", viec: "quen-mat-khau" }
            : { email: v, kenh: "email", viec: "quen-mat-khau" },
        ),
      });
      const kq = await r.json();
      if (!kq.ok) return setLoi(kq.loi || "Không gửi được mã.");
      setKenh(kq.kenh === "zalo" ? "zalo" : "email");
      setBuoc("ma");
    } catch {
      setLoi("Không kết nối được máy chủ.");
    } finally {
      setDangChay(false);
    }
  }

  async function datLai(e: React.FormEvent) {
    e.preventDefault();
    setLoi("");
    if (ma.trim().length !== 6) return setLoi("Mã gồm 6 chữ số.");
    if (pw.length < 6) return setLoi("Mật khẩu cần ít nhất 6 ký tự.");
    if (pw !== pw2) return setLoi("Hai lần nhập mật khẩu chưa khớp nhau.");

    setDangChay(true);
    try {
      const r = await fetch("/api/xac-thuc/doi-mat-khau", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(kenh === "zalo" ? { sdt: chuanHoaSdt(dinhDanh) } : { email: dinhDanh.trim() }),
          ma: ma.trim(),
          matKhauMoi: pw,
        }),
      });
      const kq = await r.json();
      if (!kq.ok) { setDangChay(false); return setLoi(kq.loi || "Không đổi được mật khẩu."); }

      // Đổi xong ĐĂNG NHẬP LUÔN — không bắt gõ lại mật khẩu vừa đặt.
      const supabase = createClient();
      const so = chuanHoaSdt(dinhDanh);
      const { error } = kenh === "zalo"
        ? await supabase.auth.signInWithPassword({ phone: `+84${so.slice(1)}`, password: pw })
        : await supabase.auth.signInWithPassword({ email: dinhDanh.trim(), password: pw });
      window.location.href = error ? "/dang-nhap" : "/tai-khoan";
    } catch {
      setDangChay(false);
      setLoi("Không kết nối được máy chủ.");
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-cvr-line bg-white p-6 shadow-lux sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight text-cvr-ink">Quên mật khẩu</h1>

      {buoc === "email" ? (
        <>
          <p className="mt-1.5 text-sm leading-relaxed text-cvr-muted">
            Nhập email hoặc số điện thoại của tài khoản, chúng tôi gửi mã 6 số để bạn đặt lại mật khẩu.
          </p>
          <form onSubmit={guiMa} className="mt-5 space-y-4">
            <div>
              <label className="text-sm font-medium text-cvr-body">Email hoặc số điện thoại</label>
              <input
                value={dinhDanh}
                onChange={(e) => setDinhDanh(e.target.value)}
                autoComplete="username"
                placeholder="email@example.com hoặc 0905123456"
                className={oCls}
              />
            </div>
            {loi && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{loi}</p>}
            <button
              type="submit"
              disabled={dangChay}
              className="h-12 w-full rounded-lg bg-cvr-ink text-[15px] font-semibold text-white transition hover:bg-cvr-ink/90 disabled:opacity-60"
            >
              {dangChay ? "Đang gửi mã…" : "Gửi mã"}
            </button>
          </form>
        </>
      ) : (
        <>
          <p className="mt-1.5 text-sm leading-relaxed text-cvr-muted">
            Mã 6 số vừa gửi tới{" "}
            <strong className="font-semibold text-cvr-ink">
              {kenh === "zalo" ? `Zalo ${chuanHoaSdt(dinhDanh)}` : dinhDanh.trim()}
            </strong>
            , hiệu lực 10 phút.
          </p>
          <form onSubmit={datLai} className="mt-5 space-y-4">
            <input
              value={ma}
              onChange={(e) => setMa(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              placeholder="______"
              className="h-14 w-full rounded-lg border border-cvr-line text-center text-2xl font-semibold tracking-[0.5em] text-cvr-ink outline-none focus:border-cvr-ink"
            />
            <div>
              <label className="text-sm font-medium text-cvr-body">Mật khẩu mới</label>
              <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" placeholder="Ít nhất 6 ký tự" className={oCls} />
            </div>
            <div>
              <label className="text-sm font-medium text-cvr-body">Xác minh mật khẩu</label>
              <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" placeholder="Nhập lại mật khẩu mới" className={oCls} />
            </div>
            {loi && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{loi}</p>}
            <button
              type="submit"
              disabled={dangChay}
              className="h-12 w-full rounded-lg bg-cvr-ink text-[15px] font-semibold text-white transition hover:bg-cvr-ink/90 disabled:opacity-60"
            >
              {dangChay ? "Đang đặt lại…" : "Đặt lại và đăng nhập"}
            </button>
            <button type="button" onClick={() => { setBuoc("email"); setMa(""); setLoi(""); }} className="w-full text-sm text-cvr-muted hover:text-cvr-ink">
              ← Nhập lại email / số điện thoại
            </button>
          </form>
        </>
      )}

      <p className="mt-5 text-center text-sm text-cvr-muted">
        <Link href="/dang-nhap" className="font-semibold text-cvr-ink hover:underline">Quay lại đăng nhập</Link>
      </p>
    </div>
  );
}
