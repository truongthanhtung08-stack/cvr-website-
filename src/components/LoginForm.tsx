"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import SocialAuth from "@/components/SocialAuth";

// Dịch vài lỗi Supabase thường gặp sang tiếng Việt.
function viError(msg: string): string {
  if (/invalid login credentials/i.test(msg)) return "Email hoặc mật khẩu không đúng.";
  if (/email not confirmed/i.test(msg)) return "Tài khoản chưa xác nhận email. Vui lòng kiểm tra hộp thư.";
  return msg || "Đăng nhập không thành công, vui lòng thử lại.";
}

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const searchParams = useSearchParams();
  // Đăng nhập mạng xã hội dở dang (huỷ/lỗi ở callback) → báo nhẹ, người dùng thử lại.
  const [notice, setNotice] = useState(() => {
    const e = searchParams.get("error") ?? "";
    if (e === "oauth") return "Đăng nhập Google chưa hoàn tất. Vui lòng thử lại hoặc dùng email.";
    if (e === "zalo_chua_cau_hinh")
      return "Đăng nhập Zalo chưa được kích hoạt. Vui lòng dùng Google hoặc email trong lúc chờ.";
    if (e.startsWith("zalo_"))
      return "Đăng nhập Zalo chưa hoàn tất. Vui lòng thử lại hoặc dùng cách khác.";
    return "";
  });
  const [loading, setLoading] = useState(false);
  // Email + mật khẩu ĐÓNG sẵn: đường chính là bấm một nút (Zalo/Google) là vào ngay.
  // Ai quen dùng email thì mở ra — không ép ai phải nhớ mật khẩu.
  const [moEmail, setMoEmail] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNotice("");
    if (!email.includes("@")) {
      setNotice("Hiện đăng nhập bằng email. Đăng nhập bằng số điện thoại (OTP) sẽ sớm có.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pw,
      });
      if (error) {
        setNotice(viError(error.message));
        return;
      }
      const next = new URLSearchParams(window.location.search).get("next");
      if (next) {
        window.location.href = next;
        return;
      }
      // Không có đích cụ thể → về đúng nơi theo vai trò: admin → /admin, khách → /tai-khoan
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = user
        ? await supabase.from("profiles").select("role").eq("id", user.id).single()
        : { data: null };
      window.location.href = profile?.role === "admin" ? "/admin" : "/tai-khoan";
    } catch {
      setNotice("Hệ thống tài khoản chưa sẵn sàng. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-none border border-cvr-line bg-white p-6 shadow-lux sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight text-cvr-ink">Đăng nhập</h1>
      <p className="mt-1.5 text-sm text-cvr-muted">Đăng nhập để quản lý tin đăng và tin đã lưu.</p>

      {notice && (
        <div className="mt-4 rounded-lg border border-cvr-blue/30 bg-cvr-blue/[0.08] px-3 py-2.5 text-sm text-cvr-blue-ink">
          {notice}
        </div>
      )}

      {/* ── ĐƯỜNG CHÍNH: một chạm là vào (Zalo · Google · Facebook · số điện thoại) ── */}
      <div className="mt-5">
        <SocialAuth />
      </div>

      {/* ── ĐƯỜNG PHỤ: email + mật khẩu, đóng sẵn cho gọn ── */}
      <div className="my-5 flex items-center gap-3 text-xs text-cvr-faint">
        <span className="h-px flex-1 bg-cvr-line" /> hoặc <span className="h-px flex-1 bg-cvr-line" />
      </div>

      {!moEmail && (
        <button
          type="button"
          onClick={() => setMoEmail(true)}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-cvr-line text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink"
        >
          Đăng nhập bằng email và mật khẩu
        </button>
      )}

      {moEmail && (
      <form className="space-y-4" onSubmit={onSubmit}>
        <Field label="Email hoặc số điện thoại">
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@vidu.com hoặc 09xx xxx xxx"
            className="h-11 w-full rounded-lg border border-transparent bg-cvr-surface px-3 text-sm text-cvr-ink placeholder-cvr-faint outline-none transition focus:border-cvr-line focus:bg-white"
          />
        </Field>

        <Field label="Mật khẩu">
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Nhập mật khẩu"
              className="h-11 w-full rounded-lg border border-transparent bg-cvr-surface pl-3 pr-12 text-sm text-cvr-ink placeholder-cvr-faint outline-none transition focus:border-cvr-line focus:bg-white"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs text-cvr-muted hover:text-cvr-ink"
            >
              {show ? "Ẩn" : "Hiện"}
            </button>
          </div>
        </Field>

        <div className="flex items-center justify-between text-sm">
          <label className="flex cursor-pointer items-center gap-2 text-cvr-body">
            <input type="checkbox" className="h-4 w-4 accent-cvr-ink" />
            Ghi nhớ đăng nhập
          </label>
          <Link href="/quen-mat-khau" className="text-cvr-body hover:text-cvr-ink">Quên mật khẩu?</Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="h-11 w-full rounded-lg bg-cvr-ink text-sm font-semibold text-white transition hover:bg-cvr-ink/90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Đang đăng nhập…" : "Đăng nhập"}
        </button>

        <p className="text-center text-sm text-cvr-muted">
          Chưa có tài khoản?{" "}
          <Link href="/dang-ky" className="font-semibold text-cvr-blue-ink hover:text-cvr-blue">Đăng ký bằng email</Link>
        </p>
      </form>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-cvr-body">{label}</span>
      {children}
    </label>
  );
}

