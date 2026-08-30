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

      {/* CÁI BẪY HAY GẶP: khách từng vào bằng Zalo/Google thì tài khoản KHÔNG có
          mật khẩu (Zalo còn không trả email, hệ thống cấp email kỹ thuật theo ID).
          Họ nhập email thật vào đây sẽ không nhận được thư nào và tưởng web hỏng.
          Nói trước ngay đầu trang, đừng để họ chờ thư vô ích. */}
      <div className="mt-4 rounded-lg border border-cvr-blue/30 bg-cvr-blue/[0.08] px-3 py-2.5 text-sm text-cvr-blue-ink">
        Bạn từng vào bằng <strong>Zalo</strong> hoặc <strong>Google</strong>? Tài khoản đó{" "}
        <strong>không có mật khẩu</strong> — quay lại{" "}
        <Link href="/dang-nhap" className="font-semibold underline">trang đăng nhập</Link>{" "}
        bấm đúng nút đó là vào ngay, không cần đặt lại gì.
      </div>

      {done ? (
        <div className="mt-4 rounded-lg border border-cvr-line bg-cvr-surface px-3 py-3 text-sm text-cvr-body">
          Nếu email tồn tại, liên kết đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư.
          <br />
          <span className="mt-1.5 block text-cvr-muted">
            Chờ vài phút không thấy thì xem thư mục <strong>Spam / Quảng cáo</strong>. Vẫn không có
            nghĩa là email này chưa từng đăng ký — thử vào bằng Zalo hoặc Google.
          </span>
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
