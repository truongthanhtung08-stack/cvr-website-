"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [notice, setNotice] = useState("");

  return (
    <div className="w-full max-w-md rounded-2xl border border-cvr-line bg-white p-6 shadow-lux sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight text-cvr-ink">Đăng nhập</h1>
      <p className="mt-1.5 text-sm text-cvr-muted">Đăng nhập để quản lý tin đăng và tin đã lưu.</p>

      {notice && (
        <div className="mt-4 rounded-lg border border-cvr-gold/40 bg-cvr-gold/10 px-3 py-2.5 text-sm text-cvr-gold-ink">
          {notice}
        </div>
      )}

      <form
        className="mt-5 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setNotice("Hệ thống tài khoản đang được hoàn thiện — sẽ sớm hoạt động. Cảm ơn bạn!");
        }}
      >
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
          className="h-11 w-full rounded-lg bg-cvr-ink text-sm font-semibold text-white transition hover:bg-cvr-ink/90 active:scale-[0.99]"
        >
          Đăng nhập
        </button>
      </form>

      {/* Phân cách */}
      <div className="my-5 flex items-center gap-3 text-xs text-cvr-faint">
        <span className="h-px flex-1 bg-cvr-line" /> hoặc <span className="h-px flex-1 bg-cvr-line" />
      </div>

      {/* Đăng nhập mạng xã hội (giao diện) */}
      <div className="space-y-2.5">
        <SocialBtn label="Tiếp tục với Google" />
        <SocialBtn label="Tiếp tục với Facebook" />
        <SocialBtn label="Tiếp tục với Zalo" />
      </div>

      <p className="mt-6 text-center text-sm text-cvr-muted">
        Chưa có tài khoản?{" "}
        <Link href="/dang-ky" className="font-semibold text-cvr-ink hover:text-cvr-gold-ink">Đăng ký ngay</Link>
      </p>
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

function SocialBtn({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-cvr-line bg-white text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink"
    >
      {label}
    </button>
  );
}
