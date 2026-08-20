"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/client";

// ============================================================================
// ĐĂNG NHẬP BẰNG SỐ ĐIỆN THOẠI — TIẾT KIỆM TIN NHẮN
//
// Cách làm (chủ dự án chốt 20/8/2026): CHỈ tốn tin nhắn ở lần đầu và khi quên
// mật khẩu. Bình thường khách đăng nhập bằng số + mật khẩu, không tốn đồng nào.
//
//   Lần đầu       : nhập số → nhận mã → xác thực → TỰ ĐẶT MẬT KHẨU   (1 tin)
//   Những lần sau : số điện thoại + mật khẩu → vào thẳng             (0 tin)
//   Quên mật khẩu : nhận mã → xác thực → đặt mật khẩu mới            (1 tin)
//
// So với gửi mã mỗi lần đăng nhập: 1.000 khách vào 20 lần/năm là 20.000 tin,
// cách này chỉ ~1.000 tin — rẻ hơn khoảng 20 lần.
//
// ⚠️ Vẫn cần cắm dịch vụ gửi SMS trong Supabase → Authentication → Providers →
// Phone. Ở Việt Nam phải là nhà cung cấp có brandname đã đăng ký (eSMS.vn,
// VietGuys…), không thì nhà mạng chặn tin. Chưa cắm thì màn hình tự báo rõ.
// ============================================================================

type Buoc = "matKhau" | "nhapSo" | "nhapMa" | "datMatKhau";

export default function PhoneLoginPage() {
  const [buoc, setBuoc] = useState<Buoc>("matKhau");
  const [phone, setPhone] = useState("");
  const [matKhau, setMatKhau] = useState("");
  const [otp, setOtp] = useState("");
  const [mkMoi, setMkMoi] = useState("");
  const [mkLai, setMkLai] = useState("");
  const [hien, setHien] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  // 0905… → +84905… (Supabase yêu cầu định dạng quốc tế)
  const e164 = (v: string) => {
    const d = v.replace(/\D/g, "");
    if (d.startsWith("84")) return `+${d}`;
    if (d.startsWith("0")) return `+84${d.slice(1)}`;
    return `+84${d}`;
  };

  const soHopLe = phone.replace(/\D/g, "").length >= 9;
  const loiSMS = (m: string) =>
    /provider|not enabled|unsupported|sms/i.test(m)
      ? "Đăng nhập bằng tin nhắn chưa được bật. Vui lòng dùng cách khác trong lúc chờ."
      : m;

  // ── Đăng nhập bằng số + mật khẩu (không tốn tin nhắn) ─────────────────────
  async function dangNhap() {
    setLoading(true);
    setNotice("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        phone: e164(phone),
        password: matKhau,
      });
      if (error) {
        setNotice(
          /invalid login credentials/i.test(error.message)
            ? "Số điện thoại hoặc mật khẩu chưa đúng. Chưa có mật khẩu thì bấm “Lần đầu dùng số này” bên dưới."
            : error.message,
        );
      } else {
        window.location.href = "/tai-khoan";
        return;
      }
    } catch {
      setNotice("Không kết nối được hệ thống. Vui lòng thử lại.");
    }
    setLoading(false);
  }

  // ── Gửi mã xác thực (tốn 1 tin nhắn) ──────────────────────────────────────
  async function guiMa() {
    setLoading(true);
    setNotice("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({ phone: e164(phone) });
      if (error) setNotice(loiSMS(error.message));
      else {
        setBuoc("nhapMa");
        setNotice("Đã gửi mã xác thực. Vui lòng kiểm tra tin nhắn.");
      }
    } catch {
      setNotice("Không kết nối được hệ thống. Vui lòng thử lại.");
    }
    setLoading(false);
  }

  // ── Xác thực mã → sang bước đặt mật khẩu ──────────────────────────────────
  async function xacThuc() {
    setLoading(true);
    setNotice("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({
        phone: e164(phone),
        token: otp,
        type: "sms",
      });
      if (error) setNotice("Mã xác thực không đúng hoặc đã hết hạn.");
      else {
        setBuoc("datMatKhau");
        setNotice("Xác thực thành công. Đặt mật khẩu để lần sau vào thẳng, không cần chờ tin nhắn.");
      }
    } catch {
      setNotice("Không kết nối được hệ thống. Vui lòng thử lại.");
    }
    setLoading(false);
  }

  // ── Đặt mật khẩu rồi vào trang tài khoản ──────────────────────────────────
  async function datMatKhau() {
    if (mkMoi.length < 6) return setNotice("Mật khẩu cần ít nhất 6 ký tự.");
    if (mkMoi !== mkLai) return setNotice("Hai ô mật khẩu chưa giống nhau.");
    setLoading(true);
    setNotice("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: mkMoi });
      if (error) setNotice(error.message);
      else {
        window.location.href = "/tai-khoan";
        return;
      }
    } catch {
      setNotice("Không kết nối được hệ thống. Vui lòng thử lại.");
    }
    setLoading(false);
  }

  const oCls =
    "h-11 w-full rounded-lg border border-cvr-line px-3 text-sm text-cvr-ink outline-none transition focus:border-cvr-ink disabled:bg-cvr-surface";

  return (
    <>
      <Header />
      <main className="flex-1 bg-white">
        <div className="mx-auto max-w-md px-4 pb-20 pt-10 sm:px-6">
          <h1 className="text-2xl font-semibold tracking-tight text-cvr-ink">Đăng nhập bằng số điện thoại</h1>

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
                disabled={buoc === "nhapMa" || buoc === "datMatKhau"}
                className={oCls}
              />
            </label>

            {/* ── Đăng nhập thường: số + mật khẩu ── */}
            {buoc === "matKhau" && (
              <>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-cvr-muted">Mật khẩu</span>
                  <div className="relative">
                    <input
                      type={hien ? "text" : "password"}
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

                <button
                  type="button"
                  onClick={dangNhap}
                  disabled={loading || !soHopLe || matKhau.length < 1}
                  className="h-12 w-full rounded-lg bg-cvr-ink text-sm font-bold text-white transition hover:bg-cvr-ink/90 disabled:opacity-40"
                >
                  {loading ? "Đang xử lý…" : "Đăng nhập"}
                </button>

                <button
                  type="button"
                  onClick={() => { setBuoc("nhapSo"); setNotice(""); }}
                  className="w-full py-1 text-sm text-cvr-blue-ink underline"
                >
                  Lần đầu dùng số này · Quên mật khẩu?
                </button>
              </>
            )}

            {/* ── Xin mã qua tin nhắn ── */}
            {buoc === "nhapSo" && (
              <>
                <button
                  type="button"
                  onClick={guiMa}
                  disabled={loading || !soHopLe}
                  className="h-12 w-full rounded-lg bg-cvr-ink text-sm font-bold text-white transition hover:bg-cvr-ink/90 disabled:opacity-40"
                >
                  {loading ? "Đang gửi…" : "Gửi mã xác thực"}
                </button>
                <button
                  type="button"
                  onClick={() => { setBuoc("matKhau"); setNotice(""); }}
                  className="w-full py-1 text-sm text-cvr-muted underline"
                >
                  Quay lại đăng nhập bằng mật khẩu
                </button>
              </>
            )}

            {/* ── Nhập mã 6 số ── */}
            {buoc === "nhapMa" && (
              <>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-cvr-muted">Mã xác thực</span>
                  <input
                    inputMode="numeric"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="6 số"
                    className={`${oCls} text-center text-lg tracking-[0.3em]`}
                  />
                </label>
                <button
                  type="button"
                  onClick={xacThuc}
                  disabled={loading || otp.length < 4}
                  className="h-12 w-full rounded-lg bg-cvr-ink text-sm font-bold text-white transition hover:bg-cvr-ink/90 disabled:opacity-40"
                >
                  {loading ? "Đang xác thực…" : "Xác nhận"}
                </button>
                <button
                  type="button"
                  onClick={() => { setBuoc("nhapSo"); setOtp(""); setNotice(""); }}
                  className="w-full py-1 text-sm text-cvr-muted underline"
                >
                  Đổi số điện thoại
                </button>
              </>
            )}

            {/* ── Đặt mật khẩu (lần đầu hoặc đổi mới) ── */}
            {buoc === "datMatKhau" && (
              <>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-cvr-muted">Mật khẩu mới</span>
                  <input
                    type={hien ? "text" : "password"}
                    value={mkMoi}
                    onChange={(e) => setMkMoi(e.target.value)}
                    placeholder="Ít nhất 6 ký tự"
                    className={oCls}
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-cvr-muted">Nhập lại mật khẩu</span>
                  <input
                    type={hien ? "text" : "password"}
                    value={mkLai}
                    onChange={(e) => setMkLai(e.target.value)}
                    placeholder="Nhập lại cho khớp"
                    className={oCls}
                  />
                </label>
                <button
                  type="button"
                  onClick={datMatKhau}
                  disabled={loading || mkMoi.length < 6}
                  className="h-12 w-full rounded-lg bg-cvr-ink text-sm font-bold text-white transition hover:bg-cvr-ink/90 disabled:opacity-40"
                >
                  {loading ? "Đang lưu…" : "Lưu mật khẩu và vào tài khoản"}
                </button>
              </>
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
