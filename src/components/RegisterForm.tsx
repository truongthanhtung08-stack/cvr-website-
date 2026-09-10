"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import SocialAuth from "@/components/SocialAuth";
import { useBilling } from "@/lib/useBilling";
import { freeNote, tenGoiMienPhi } from "@/lib/billing";

function viError(msg: string): string {
  if (/already registered|already exists|user already/i.test(msg))
    return "Email này đã có tài khoản. Bạn hãy đăng nhập.";
  if (/password/i.test(msg) && /(6|weak|short)/i.test(msg))
    return "Mật khẩu quá ngắn — cần ít nhất 6 ký tự.";
  return msg || "Đăng ký không thành công, vui lòng thử lại.";
}

// uuDai: câu ưu đãi lấy sẵn từ MÁY CHỦ (trang đích quảng cáo truyền vào). Truyền
// vào thì câu hiện đúng ngay từ lần vẽ đầu; để trống thì tự đọc bằng useBilling
// như trang /dang-ky — nhưng lần vẽ đầu chưa có dữ liệu nên phải giấu đi, thà
// hiện chậm nửa giây còn hơn loé lên con số sai rồi mới nhảy sang số đúng.
export default function RegisterForm({ uuDai }: { uuDai?: string }) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [notice, setNotice] = useState("");
  const [done, setDone] = useState("");
  const [loading, setLoading] = useState(false);

  // Ưu đãi thành viên mới lấy từ cài đặt THẬT trong admin (/admin/gia-khuyen-mai)
  // — không viết cứng, để sửa số tin / số ngày là trang đăng ký đổi theo.
  const { billing, loading: billingLoading } = useBilling();
  const dongUuDai =
    uuDai ?? (billingLoading || !billing.free.active ? "" : freeNote(billing.free, tenGoiMienPhi(billing)));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNotice("");
    if (pw.length < 6) {
      setNotice("Mật khẩu cần ít nhất 6 ký tự.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: pw,
        options: {
          data: { full_name: fullName.trim(), phone: phone.trim() },
          emailRedirectTo:
            typeof window !== "undefined" ? `${window.location.origin}/dang-nhap` : undefined,
        },
      });
      if (error) {
        setNotice(viError(error.message));
        return;
      }
      // Có session ngay = Supabase tắt xác nhận email → vào thẳng tài khoản.
      if (data.session) {
        window.location.href = "/tai-khoan";
        return;
      }
      setDone(
        `Đã gửi email xác nhận tới ${email.trim()}. Vui lòng mở email và bấm liên kết để kích hoạt tài khoản, sau đó đăng nhập.`
      );
    } catch {
      setNotice("Hệ thống tài khoản chưa sẵn sàng. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="w-full max-w-md rounded-none border border-cvr-line bg-white p-6 text-center shadow-lux sm:p-8">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cvr-ink text-white">
          <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-cvr-ink">Đăng ký thành công!</h1>
        <p className="mt-2 text-sm leading-relaxed text-cvr-muted">{done}</p>
        <Link
          href="/dang-nhap"
          className="mt-5 inline-flex h-11 items-center justify-center rounded-lg bg-cvr-ink px-6 text-sm font-semibold text-white transition hover:bg-cvr-ink/90"
        >
          Tới trang đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-none border border-cvr-line bg-white p-6 shadow-lux sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight text-cvr-ink">Đăng ký tài khoản</h1>
      <p className="mt-1.5 text-sm text-cvr-muted">Tạo tài khoản để đăng tin, lưu tin và quản lý bất động sản.</p>

      {/* ── LÝ DO ĐĂNG KÝ ────────────────────────────────────────────────────
          Khách từ quảng cáo bấm vào là người LẠ — trước khi bắt họ điền 4 ô thì
          phải cho họ thấy được gì. Ưu đãi này đã có sẵn trong bảng giá admin
          nhưng trang đăng ký trước đây không hề nhắc → khách không có lý do để
          điền form. */}
      {dongUuDai && (
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-cvr-gold/35 bg-cvr-gold/[0.07] px-3.5 py-3">
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-cvr-gold-ink" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-sm font-medium leading-snug text-cvr-gold-ink">{dongUuDai}</p>
        </div>
      )}

      {notice && (
        <div className="mt-4 rounded-lg border border-cvr-blue/30 bg-cvr-blue/[0.08] px-3 py-2.5 text-sm text-cvr-blue-ink">
          {notice}
        </div>
      )}

      {/* ── ĐĂNG KÝ NHANH ĐẶT TRƯỚC FORM ─────────────────────────────────────
          Một cú bấm Google là xong, so với điền 4 ô rồi còn phải mở hộp thư bấm
          xác nhận. Ai ngại điền sẽ thoát ngay ở màn hình đầu — nên để đường
          nhanh lên trên, đường dài xuống dưới. */}
      <div className="mt-5">
        <SocialAuth />
      </div>

      <div className="my-5 flex items-center gap-3 text-xs text-cvr-faint">
        <span className="h-px flex-1 bg-cvr-line" /> hoặc đăng ký bằng email <span className="h-px flex-1 bg-cvr-line" />
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        <Field label="Họ và tên">
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Nguyễn Văn A"
            className={inputCls}
          />
        </Field>

        <Field label="Số điện thoại">
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="09xx xxx xxx"
            className={inputCls}
          />
        </Field>

        <Field label="Email">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@vidu.com"
            className={inputCls}
          />
        </Field>

        <Field label="Mật khẩu">
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              required
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Ít nhất 6 ký tự"
              className={inputCls + " pr-12"}
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

        <button
          type="submit"
          disabled={loading}
          className="h-11 w-full rounded-lg bg-cvr-ink text-sm font-semibold text-white transition hover:bg-cvr-ink/90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Đang tạo tài khoản…" : "Đăng ký"}
        </button>
      </form>

      <p className="mt-4 text-center text-xs leading-relaxed text-cvr-faint">
        Tạo tài khoản không mất phí. Số điện thoại chỉ dùng để liên hệ về tin đăng của bạn.
      </p>

      <p className="mt-5 text-center text-sm text-cvr-muted">
        Đã có tài khoản?{" "}
        <Link href="/dang-nhap" className="font-semibold text-cvr-blue-ink hover:text-cvr-blue">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}

const inputCls =
  "h-11 w-full rounded-lg border border-transparent bg-cvr-surface px-3 text-sm text-cvr-ink placeholder-cvr-faint outline-none transition focus:border-cvr-line focus:bg-white";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-cvr-body">{label}</span>
      {children}
    </label>
  );
}
