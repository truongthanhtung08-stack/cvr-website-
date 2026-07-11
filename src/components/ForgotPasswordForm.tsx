"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNotice("");
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo:
          typeof window !== "undefined" ? `${window.location.origin}/dang-nhap` : undefined,
      });
      if (error) {
        setNotice(error.message || "Không gửi được email, vui lòng thử lại.");
        return;
      }
      setDone(true);
    } catch {
      setNotice("Hệ thống tài khoản chưa sẵn sàng. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-none border border-cvr-line bg-white p-6 shadow-lux sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight text-cvr-ink">Quên mật khẩu</h1>
      <p className="mt-1.5 text-sm text-cvr-muted">
        Nhập email tài khoản, chúng tôi sẽ gửi liên kết đặt lại mật khẩu.
      </p>

      {done ? (
        <div className="mt-4 rounded-lg border border-cvr-line bg-cvr-surface px-3 py-3 text-sm text-cvr-body">
          Nếu email tồn tại, liên kết đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư.
        </div>
      ) : (
        <>
          {notice && (
            <div className="mt-4 rounded-lg border border-cvr-blue/30 bg-cvr-blue/[0.08] px-3 py-2.5 text-sm text-cvr-blue-ink">
              {notice}
            </div>
          )}
          <form className="mt-5 space-y-4" onSubmit={onSubmit}>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-cvr-body">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@vidu.com"
                className="h-11 w-full rounded-lg border border-transparent bg-cvr-surface px-3 text-sm text-cvr-ink placeholder-cvr-faint outline-none transition focus:border-cvr-line focus:bg-white"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-lg bg-cvr-ink text-sm font-semibold text-white transition hover:bg-cvr-ink/90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Đang gửi…" : "Gửi liên kết đặt lại"}
            </button>
          </form>
        </>
      )}

      <p className="mt-6 text-center text-sm text-cvr-muted">
        <Link href="/dang-nhap" className="font-semibold text-cvr-blue-ink hover:text-cvr-blue">
          ← Về trang đăng nhập
        </Link>
      </p>
    </div>
  );
}
