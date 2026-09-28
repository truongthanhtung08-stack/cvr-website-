"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/client";
import { dichSauDangNhap } from "@/lib/dieuHuong";

// ============================================================================
// ĐĂNG NHẬP BẰNG SỐ ĐIỆN THOẠI — chuẩn như các sàn lớn (chủ dự án chốt 28/09/2026):
// Đăng nhập là đăng nhập (số + mật khẩu + "Quên mật khẩu?"), Đăng ký là đăng ký
// (/dang-ky). Không hỏi "lần đầu hay lần sau", không luồng mã nằm lẫn ở đây.
// Đăng nhập không tốn tin nhắn; mã Zalo chỉ gửi khi đăng ký và khi quên mật khẩu.
// ============================================================================

export default function PhoneLoginPage() {
  const [phone, setPhone] = useState("");
  const [matKhau, setMatKhau] = useState("");
  const [hien, setHien] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [chuaCo, setChuaCo] = useState(false); // số chưa có tài khoản → mời đăng ký

  // 0905… → +84905… (Supabase yêu cầu định dạng quốc tế)
  const e164 = (v: string) => {
    const d = v.replace(/\D/g, "");
    if (d.startsWith("84")) return `+${d}`;
    if (d.startsWith("0")) return `+84${d.slice(1)}`;
    return `+84${d}`;
  };
  const soHopLe = phone.replace(/\D/g, "").length >= 10;

  async function dangNhap(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setNotice("");
    setChuaCo(false);
    try {
      const supabase = createClient();
      let { error } = await supabase.auth.signInWithPassword({ phone: e164(phone), password: matKhau });
      // Không khớp trực tiếp → có thể là tài khoản đăng ký bằng email/Google đã xác minh số
      // này. Máy chủ dò đúng tài khoản rồi đăng nhập bằng mật khẩu của nó.
      if (error && /invalid login credentials/i.test(error.message)) {
        const r = await fetch("/api/xac-thuc/dang-nhap-sdt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ buoc: "mat-khau", sdt: phone, matKhau }),
        }).then((x) => x.json()).catch(() => null);
        if (r?.ok) {
          await supabase.auth.setSession({ access_token: r.access_token, refresh_token: r.refresh_token });
          error = null;
        }
      }
      if (!error) {
        window.location.replace(dichSauDangNhap());
        return;
      }
      if (/invalid login credentials/i.test(error.message)) {
        // Sai vì CHƯA CÓ TÀI KHOẢN hay vì SAI MẬT KHẨU — nói đúng cái nào.
        const kq = await fetch("/api/xac-thuc/kiem-tai-khoan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sdt: phone }),
        }).then((x) => x.json()).catch(() => null);
        if (kq?.ok && !kq.coTaiKhoan) setChuaCo(true);
        else setNotice("Mật khẩu chưa đúng.");
      } else setNotice(error.message);
    } catch {
      setNotice("Không kết nối được hệ thống. Vui lòng thử lại.");
    }
    setLoading(false);
  }

  const oCls =
    "h-11 w-full rounded-lg border border-cvr-line px-3 text-sm text-cvr-ink outline-none transition focus:border-cvr-ink";

  return (
    <>
      <Header />
      <main className="flex-1 bg-white">
        <div className="mx-auto max-w-md px-4 pt-10 pb-footer sm:px-6">
          <h1 className="text-2xl font-semibold tracking-tight text-cvr-ink">Đăng nhập bằng số điện thoại</h1>

          {notice && (
            <p className="mt-4 rounded-lg border border-cvr-blue/30 bg-cvr-blue/[0.08] px-3 py-2 text-sm text-cvr-blue-ink">
              {notice}
            </p>
          )}
          {chuaCo && (
            <p className="mt-4 rounded-lg border border-cvr-blue/30 bg-cvr-blue/[0.08] px-3 py-2 text-sm text-cvr-blue-ink">
              Số này chưa có tài khoản.{" "}
              <Link href="/dang-ky?cach=sdt" className="font-semibold underline">Đăng ký</Link>
            </p>
          )}

          <form className="mt-5 space-y-3" onSubmit={dangNhap}>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-cvr-muted">Số điện thoại</span>
              <input
                inputMode="tel"
                autoComplete="username"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09xx xxx xxx"
                className={oCls}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-cvr-muted">Mật khẩu</span>
              <div className="relative">
                <input
                  type={hien ? "text" : "password"}
                  autoComplete="current-password"
                  value={matKhau}
                  onChange={(e) => setMatKhau(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  className={`${oCls} pr-14`}
                />
                <button
                  type="button"
                  onClick={() => setHien((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs text-cvr-muted hover:text-cvr-ink"
                >
                  {hien ? "Ẩn" : "Hiện"}
                </button>
              </div>
            </label>

            <div className="text-right text-sm">
              <Link href="/quen-mat-khau" className="text-cvr-body hover:text-cvr-ink">Quên mật khẩu?</Link>
            </div>

            <button
              type="submit"
              disabled={loading || !soHopLe || !matKhau}
              className="h-12 w-full rounded-lg bg-cvr-ink text-sm font-bold text-white transition hover:bg-cvr-ink/90 disabled:opacity-40"
            >
              {loading ? "Đang đăng nhập…" : "Đăng nhập"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-cvr-muted">
            Chưa có tài khoản?{" "}
            <Link href="/dang-ky?cach=sdt" className="font-semibold text-cvr-ink hover:underline">Đăng ký</Link>
          </p>
          <p className="mt-3 text-center text-sm">
            <Link href="/dang-nhap" className="text-cvr-muted hover:text-cvr-ink">← Cách đăng nhập khác</Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
