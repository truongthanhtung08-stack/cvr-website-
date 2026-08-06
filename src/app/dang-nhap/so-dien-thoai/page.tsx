"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/client";

// ============================================================================
// ĐĂNG NHẬP BẰNG SỐ ĐIỆN THOẠI (OTP)
// Supabase gửi mã 6 số qua SMS — cần bật Phone provider và cắm nhà mạng
// (Twilio / Vonage / eSMS…) trong Supabase → Authentication → Providers → Phone.
// Chưa cắm: nút vẫn chạy, hệ thống báo rõ đang thiếu cấu hình gì.
// ============================================================================
export default function PhoneLoginPage() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  // 0905… → +84905… (Supabase yêu cầu định dạng quốc tế)
  const e164 = (v: string) => {
    const d = v.replace(/\D/g, "");
    if (d.startsWith("84")) return `+${d}`;
    if (d.startsWith("0")) return `+84${d.slice(1)}`;
    return `+84${d}`;
  };

  async function sendOtp() {
    setLoading(true);
    setNotice("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({ phone: e164(phone) });
      if (error) {
        setNotice(
          /provider|not enabled|unsupported/i.test(error.message)
            ? "Đăng nhập bằng SMS chưa được bật. Cần cắm dịch vụ gửi tin nhắn trong Supabase."
            : error.message,
        );
      } else {
        setStep("otp");
        setNotice("Đã gửi mã xác thực. Vui lòng kiểm tra tin nhắn.");
      }
    } catch {
      setNotice("Không kết nối được hệ thống xác thực.");
    }
    setLoading(false);
  }

  async function verify() {
    setLoading(true);
    setNotice("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({ phone: e164(phone), token: otp, type: "sms" });
      if (error) setNotice("Mã xác thực không đúng hoặc đã hết hạn.");
      else window.location.href = "/tai-khoan";
    } catch {
      setNotice("Không kết nối được hệ thống xác thực.");
    }
    setLoading(false);
  }

  return (
    <>
      <Header />
      <main className="flex-1 bg-white">
        <div className="mx-auto max-w-md px-4 pb-20 pt-10 sm:px-6">
          <h1 className="text-2xl font-semibold tracking-tight text-cvr-ink">Đăng nhập bằng số điện thoại</h1>
          <p className="mt-1.5 text-sm text-cvr-muted">Nhận mã xác thực 6 số qua tin nhắn.</p>

          {notice && (
            <p className="mt-4 rounded-lg border border-cvr-blue/30 bg-cvr-blue/[0.08] px-3 py-2 text-sm text-cvr-blue-ink">
              {notice}
            </p>
          )}

          <div className="mt-5 space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-cvr-muted">Số điện thoại</span>
              <input
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09xx xxx xxx"
                disabled={step === "otp"}
                className="h-11 w-full rounded-lg border border-cvr-line px-3 text-sm text-cvr-ink outline-none focus:border-cvr-ink disabled:bg-cvr-surface"
              />
            </label>

            {step === "otp" && (
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-cvr-muted">Mã xác thực</span>
                <input
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="6 số"
                  className="h-11 w-full rounded-lg border border-cvr-line px-3 text-center text-lg tracking-[0.3em] text-cvr-ink outline-none focus:border-cvr-ink"
                />
              </label>
            )}

            <button
              type="button"
              onClick={step === "phone" ? sendOtp : verify}
              disabled={loading || (step === "phone" ? phone.replace(/\D/g, "").length < 9 : otp.length < 4)}
              className="h-12 w-full rounded-lg bg-cvr-ink text-sm font-bold text-white transition hover:bg-cvr-ink/90 disabled:opacity-40"
            >
              {loading ? "Đang xử lý…" : step === "phone" ? "Gửi mã xác thực" : "Xác nhận đăng nhập"}
            </button>

            {step === "otp" && (
              <button type="button" onClick={() => { setStep("phone"); setOtp(""); setNotice(""); }} className="w-full text-sm text-cvr-muted underline">
                Đổi số điện thoại
              </button>
            )}
          </div>

          <p className="mt-6 text-center text-sm text-cvr-muted">
            <Link href="/dang-nhap" className="font-medium text-cvr-blue-ink">← Quay lại các cách đăng nhập khác</Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
