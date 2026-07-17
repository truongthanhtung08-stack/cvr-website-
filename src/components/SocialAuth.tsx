"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Đăng nhập/đăng ký bằng mạng xã hội — dùng chung cho /dang-nhap và /dang-ky.
// Google: chạy thật qua Supabase OAuth (cần bật provider Google trong Supabase).
// Facebook/Zalo: hiện "Sắp có" — Facebook chờ app Meta duyệt, Zalo làm cùng OTP.
export default function SocialAuth() {
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  async function withGoogle() {
    setLoading(true);
    setNotice("");
    const next = new URLSearchParams(window.location.search).get("next") || "/tai-khoan";
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    // Thành công thì trình duyệt tự chuyển sang Google — chỉ còn lại trường hợp lỗi.
    if (error) {
      setLoading(false);
      setNotice(
        /provider is not enabled/i.test(error.message)
          ? "Đăng nhập Google chưa được bật trên hệ thống. Vui lòng dùng email hoặc thử lại sau."
          : "Không kết nối được Google. Vui lòng thử lại."
      );
    }
  }

  return (
    <div className="space-y-2.5">
      {notice && (
        <p className="rounded-lg border border-cvr-blue/30 bg-cvr-blue/[0.08] px-3 py-2 text-sm text-cvr-blue-ink">
          {notice}
        </p>
      )}

      <button
        type="button"
        onClick={withGoogle}
        disabled={loading}
        className="flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-cvr-line bg-white text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink disabled:opacity-60"
      >
        <GoogleIcon />
        {loading ? "Đang chuyển tới Google…" : "Tiếp tục với Google"}
      </button>

      <button
        type="button"
        disabled
        title="Sắp có"
        className="flex h-11 w-full cursor-not-allowed items-center justify-center gap-2.5 rounded-lg border border-cvr-line bg-cvr-surface text-sm font-medium text-cvr-faint"
      >
        <FacebookIcon />
        Tiếp tục với Facebook
        <span className="rounded-full bg-cvr-line/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">Sắp có</span>
      </button>

      <button
        type="button"
        disabled
        title="Sắp có"
        className="flex h-11 w-full cursor-not-allowed items-center justify-center gap-2.5 rounded-lg border border-cvr-line bg-cvr-surface text-sm font-medium text-cvr-faint"
      >
        <ZaloIcon />
        Tiếp tục với Zalo
        <span className="rounded-full bg-cvr-line/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">Sắp có</span>
      </button>
    </div>
  );
}

// Logo Google 4 màu chính thức
function GoogleIcon() {
  return (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.57 5.57 0 01-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0012 24z" />
      <path fill="#FBBC05" d="M5.27 14.29A7.19 7.19 0 014.9 12c0-.8.14-1.57.37-2.29V6.62H1.29a12 12 0 000 10.76l3.98-3.09z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="#9aa0a6" aria-hidden>
      <path d="M22 12a10 10 0 10-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0022 12z" />
    </svg>
  );
}

function ZaloIcon() {
  return (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="#9aa0a6" aria-hidden>
      <path d="M12 2.4c-5.46 0-9.9 3.66-9.9 8.18 0 2.6 1.47 4.92 3.76 6.43-.16.57-.52 1.72-.66 2.18-.17.55.2.55.42.45.29-.12 2.5-1.66 3.46-2.31.94.22 1.93.34 2.92.34 5.46 0 9.9-3.66 9.9-8.18S17.46 2.4 12 2.4z" />
    </svg>
  );
}
