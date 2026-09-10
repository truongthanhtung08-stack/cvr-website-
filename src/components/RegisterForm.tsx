"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import SocialAuth from "@/components/SocialAuth";
import { useBilling } from "@/lib/useBilling";
import { freeNote, tenGoiMienPhi } from "@/lib/billing";
import { chuanHoaSdt, laSdtVN } from "@/lib/phone";

// ============================================================================
// ĐĂNG KÝ TÀI KHOẢN — QUY TRÌNH CHUẨN, CHỦ DỰ ÁN CHỐT 11/09/2026
//
// Ba bước, đúng thứ tự người dùng quen ở mọi trang lớn:
//   1. CHỌN CÁCH ĐĂNG KÝ  — Google (một chạm) · Email · Số điện thoại
//   2. NHẬP               — định danh + mật khẩu + XÁC MINH MẬT KHẨU
//   3. NHẬP MÃ            — mã 6 số gửi tới email, đúng mã là vào thẳng tài khoản
//
// Vì sao có bước MÃ mà không phải "mở hộp thư bấm liên kết":
// cách bấm liên kết trong mail trông y hệt luồng QUÊN MẬT KHẨU, chủ dự án đã bác
// vì không chuyên nghiệp và làm khách nghi ngờ. Mã 6 số nhập ngay tại trang là
// cách các sàn lớn dùng: nhanh, không rời trang, và vẫn chứng minh được hộp thư
// đúng là của khách.
//
// SỐ ĐIỆN THOẠI LÀ ĐỊNH DANH CHÍNH (chủ dự án chốt): rất nhiều môi giới không
// dùng email. Vì vậy đăng ký bằng SĐT KHÔNG bắt buộc email:
//   · có email  → nhận mã, xác thực thật, dùng được mọi thứ ngay.
//   · không có  → vẫn tạo được tài khoản và đăng nhập bằng SĐT + mật khẩu; chỉ
//     là số CHƯA XÁC MINH nên tin cũ phải qua Coastal Land duyệt. Khi Zalo ZNS
//     có số dư thì bật OTP Zalo cho nhóm này, giao diện không phải sửa.
//
// Google/Facebook KHÔNG bắt đặt mật khẩu (chủ dự án chốt): đã xác thực sẵn thì
// cho vào thẳng — ai muốn thêm đường đăng nhập bằng mật khẩu thì đặt trong
// Cài đặt tài khoản.
// ============================================================================

type Cach = "chon" | "email" | "sdt";

export default function RegisterForm({ uuDai }: { uuDai?: string }) {
  const [cach, setCach] = useState<Cach>("chon");

  // Bước nhập
  const [hoTen, setHoTen] = useState("");
  const [email, setEmail] = useState("");
  const [sdt, setSdt] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [hienPw, setHienPw] = useState(false);

  // Bước mã
  const [choMa, setChoMa] = useState(false);
  const [ma, setMa] = useState("");
  // NƠI NHẬN MÃ do khách chọn: email hay Zalo (số điện thoại).
  // Mặc định email khi có — nhanh, không phụ thuộc số dư ZNS. Ai quen nhận trong
  // Zalo thì bấm đổi, đúng yêu cầu của chủ dự án.
  const [kenh, setKenh] = useState<"email" | "zalo">("email");

  const [loi, setLoi] = useState("");
  const [dangChay, setDangChay] = useState(false);

  const { billing, loading: billingLoading } = useBilling();
  const dongUuDai =
    uuDai ?? (billingLoading || !billing.free.active ? "" : freeNote(billing.free, tenGoiMienPhi(billing)));

  // ── BƯỚC 1 → 2: kiểm tại chỗ rồi xin mã ───────────────────────────────────
  async function xinMa(e: React.FormEvent) {
    e.preventDefault();
    setLoi("");

    if (!hoTen.trim()) return setLoi("Vui lòng nhập họ và tên.");
    if (cach === "sdt" && !laSdtVN(chuanHoaSdt(sdt))) return setLoi("Số điện thoại chưa đúng (10 số, bắt đầu bằng 0).");
    if (cach === "email" && !email.trim()) return setLoi("Vui lòng nhập email.");
    if (pw.length < 6) return setLoi("Mật khẩu cần ít nhất 6 ký tự.");
    if (pw !== pw2) return setLoi("Hai lần nhập mật khẩu chưa khớp nhau.");

    // ĐĂNG KÝ BẰNG SỐ ĐIỆN THOẠI MÀ KHÔNG CÓ EMAIL → tạo tài khoản luôn.
    // Số điện thoại mới là định danh chính của khách (chủ dự án chốt): rất nhiều
    // môi giới không dùng email, bắt buộc email là chặn mất nhóm đông nhất.
    // Không có email thì chưa gửi mã được (Zalo ZNS đang kẹt số dư) — tài khoản
    // vẫn dùng được ngay, chỉ là SỐ CHƯA XÁC MINH nên tin cũ phải qua Coastal
    // Land duyệt trước khi chuyển về.
    // Không có email thì mã chỉ có thể đi qua Zalo.
    const kenhGui = email.trim() ? kenh : "zalo";

    setDangChay(true);
    try {
      const r = await fetch("/api/xac-thuc/gui-ma", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          sdt: chuanHoaSdt(sdt),
          kenh: kenhGui,
          viec: "dang-ky",
        }),
      });
      const kq = await r.json();

      if (kq.ok) {
        setKenh(kq.kenh === "zalo" ? "zalo" : "email");
        setChoMa(true);
        return;
      }

      // Zalo chưa gửi được (số dư ZBS = 0đ) mà khách KHÔNG có email → vẫn cho tạo
      // tài khoản, đừng chặn đường vào của nhóm khách đông nhất. Số để CHƯA XÁC
      // MINH, tin cũ chuyển sau khi Coastal Land đối chiếu.
      if (kq.khongGuiDuoc && !email.trim()) {
        await taoTaiKhoan("", "khong");
        return;
      }
      setLoi(kq.loi || "Không gửi được mã. Vui lòng thử lại.");
    } catch {
      setLoi("Không kết nối được máy chủ. Vui lòng thử lại.");
    } finally {
      setDangChay(false);
    }
  }

  // ── TẠO TÀI KHOẢN → ĐĂNG NHẬP LUÔN → VÀO THẲNG TÀI KHOẢN ─────────────────
  // Dùng chung cho hai đường: có email (kèm mã) và chỉ có số điện thoại (mã rỗng).
  async function taoTaiKhoan(maXacThuc: string, kenhMa: "email" | "zalo" | "khong" = kenh) {
    setDangChay(true);
    setLoi("");
    try {
      const soDT = chuanHoaSdt(sdt);
      const r = await fetch("/api/xac-thuc/dang-ky", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          sdt: soDT,
          hoTen: hoTen.trim(),
          matKhau: pw,
          ma: maXacThuc,
          kenh: kenhMa,
        }),
      });
      const kq = await r.json();
      if (!kq.ok) {
        setDangChay(false);
        return setLoi(kq.loi || "Không tạo được tài khoản.");
      }

      // Tạo xong ĐĂNG NHẬP LUÔN — không bắt khách gõ lại mật khẩu vừa đặt.
      const supabase = createClient();
      const { error } = email.trim()
        ? await supabase.auth.signInWithPassword({ email: email.trim(), password: pw })
        : await supabase.auth.signInWithPassword({ phone: `+84${soDT.slice(1)}`, password: pw });

      window.location.href = error ? "/dang-nhap" : "/tai-khoan";
    } catch {
      setDangChay(false);
      setLoi("Không kết nối được máy chủ. Vui lòng thử lại.");
    }
  }

  // ── BƯỚC 3: nhập mã → tạo tài khoản ──────────────────────────────────────
  async function xacNhan(e: React.FormEvent) {
    e.preventDefault();
    setLoi("");
    if (ma.trim().length !== 6) return setLoi("Mã gồm 6 chữ số.");
    await taoTaiKhoan(ma.trim());
  }

  const oCls =
    "mt-1 h-11 w-full rounded-lg border border-cvr-line px-4 text-[15px] text-cvr-ink outline-none transition placeholder:text-cvr-faint focus:border-cvr-ink";

  // ── MÀN CHỌN CÁCH ĐĂNG KÝ ────────────────────────────────────────────────
  if (cach === "chon") {
    return (
      <div className="w-full max-w-md rounded-2xl border border-cvr-line bg-white p-6 shadow-lux sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-cvr-ink">Tạo tài khoản</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-cvr-muted">
          {dongUuDai || "Đăng tin, quản lý tin và lưu bất động sản bạn quan tâm."}
        </p>

        <div className="mt-5">
          <SocialAuth />
        </div>

        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-cvr-line" />
          <span className="text-xs text-cvr-faint">hoặc</span>
          <span className="h-px flex-1 bg-cvr-line" />
        </div>

        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => setCach("email")}
            className="flex h-12 w-full items-center justify-center rounded-lg border border-cvr-line text-[15px] font-semibold text-cvr-ink transition hover:border-cvr-ink"
          >
            Đăng ký bằng email
          </button>
          <button
            type="button"
            onClick={() => setCach("sdt")}
            className="flex h-12 w-full items-center justify-center rounded-lg border border-cvr-line text-[15px] font-semibold text-cvr-ink transition hover:border-cvr-ink"
          >
            Đăng ký bằng số điện thoại
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-cvr-muted">
          Đã có tài khoản?{" "}
          <Link href="/dang-nhap" className="font-semibold text-cvr-ink hover:underline">Đăng nhập</Link>
        </p>
      </div>
    );
  }

  // ── MÀN NHẬP MÃ ──────────────────────────────────────────────────────────
  if (choMa) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-cvr-line bg-white p-6 shadow-lux sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-cvr-ink">Nhập mã xác thực</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-cvr-muted">
          Mã 6 số vừa gửi tới{" "}
          <strong className="font-semibold text-cvr-ink">
            {kenh === "zalo" ? `Zalo ${chuanHoaSdt(sdt)}` : email.trim()}
          </strong>
          . Mã có hiệu lực 10 phút.
        </p>

        <form onSubmit={xacNhan} className="mt-5">
          <input
            value={ma}
            onChange={(e) => setMa(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            placeholder="______"
            className="h-14 w-full rounded-lg border border-cvr-line text-center text-2xl font-semibold tracking-[0.5em] text-cvr-ink outline-none focus:border-cvr-ink"
          />
          {loi && <p className="mt-3 text-sm font-medium text-red-600">{loi}</p>}

          <button
            type="submit"
            disabled={dangChay}
            className="mt-4 h-12 w-full rounded-lg bg-cvr-ink text-[15px] font-semibold text-white transition hover:bg-cvr-ink/90 disabled:opacity-60"
          >
            {dangChay ? "Đang tạo tài khoản…" : "Xác nhận và vào tài khoản"}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between text-sm">
          <button type="button" onClick={() => { setChoMa(false); setMa(""); setLoi(""); }} className="text-cvr-muted hover:text-cvr-ink">
            ← Sửa thông tin
          </button>
          <button
            type="button"
            onClick={(e) => { setMa(""); xinMa(e as unknown as React.FormEvent); }}
            disabled={dangChay}
            className="font-medium text-cvr-ink hover:underline disabled:opacity-50"
          >
            Gửi lại mã
          </button>
        </div>
      </div>
    );
  }

  // ── MÀN NHẬP THÔNG TIN ───────────────────────────────────────────────────
  const laSdt = cach === "sdt";
  return (
    <div className="w-full max-w-md rounded-2xl border border-cvr-line bg-white p-6 shadow-lux sm:p-8">
      <button type="button" onClick={() => { setCach("chon"); setLoi(""); }} className="text-sm text-cvr-muted transition hover:text-cvr-ink">
        ← Chọn cách khác
      </button>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-cvr-ink">
        {laSdt ? "Đăng ký bằng số điện thoại" : "Đăng ký bằng email"}
      </h1>

      <form onSubmit={xinMa} className="mt-5 space-y-4">
        <div>
          <label className="text-sm font-medium text-cvr-body">Họ và tên</label>
          <input value={hoTen} onChange={(e) => setHoTen(e.target.value)} placeholder="Nguyễn Văn A" className={oCls} />
        </div>

        {/* Ô ĐỊNH DANH của cách đã chọn nằm TRƯỚC, đúng thứ tự chủ dự án yêu cầu */}
        {laSdt ? (
          <>
            <div>
              <label className="text-sm font-medium text-cvr-body">Số điện thoại</label>
              <input value={sdt} onChange={(e) => setSdt(e.target.value)} inputMode="tel" placeholder="0905123456" className={oCls} />
            </div>
            <div>
              <label className="text-sm font-medium text-cvr-body">Email — không bắt buộc</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} inputMode="email" placeholder="Có email thì nhận mã xác thực ngay" className={oCls} />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="text-sm font-medium text-cvr-body">Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} inputMode="email" placeholder="email@example.com" className={oCls} />
            </div>
            <div>
              <label className="text-sm font-medium text-cvr-body">Số điện thoại — không bắt buộc</label>
              <input value={sdt} onChange={(e) => setSdt(e.target.value)} inputMode="tel" placeholder="0905123456" className={oCls} />
            </div>
          </>
        )}

        <div>
          <label className="text-sm font-medium text-cvr-body">Mật khẩu</label>
          <div className="relative">
            <input
              type={hienPw ? "text" : "password"}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              autoComplete="new-password"
              placeholder="Ít nhất 6 ký tự"
              className={`${oCls} pr-16`}
            />
            <button type="button" onClick={() => setHienPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-cvr-muted hover:text-cvr-ink">
              {hienPw ? "Ẩn" : "Hiện"}
            </button>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-cvr-body">Xác minh mật khẩu</label>
          <input
            type={hienPw ? "text" : "password"}
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            autoComplete="new-password"
            placeholder="Nhập lại mật khẩu"
            className={oCls}
          />
          {pw2 && pw !== pw2 && <p className="mt-1 text-xs font-medium text-red-600">Hai lần nhập chưa khớp.</p>}
        </div>

        {/* NƠI NHẬN MÃ — chỉ hỏi khi khách có CẢ email lẫn số điện thoại.
            Chỉ có một thứ thì khỏi hỏi, tự gửi về đúng nơi đó. */}
        {email.trim() && chuanHoaSdt(sdt).length >= 10 && (
          <div>
            <span className="text-sm font-medium text-cvr-body">Nhận mã xác thực qua</span>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {([
                { id: "email" as const, nhan: "Email", phu: email.trim() },
                { id: "zalo" as const, nhan: "Zalo", phu: chuanHoaSdt(sdt) },
              ]).map((k) => (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => setKenh(k.id)}
                  className={`rounded-lg border px-3 py-2.5 text-left transition ${
                    kenh === k.id ? "border-cvr-ink bg-cvr-ink text-white" : "border-cvr-line text-cvr-body hover:border-cvr-ink"
                  }`}
                >
                  <span className="block text-sm font-semibold">{k.nhan}</span>
                  <span className={`block truncate text-xs ${kenh === k.id ? "text-white/75" : "text-cvr-faint"}`}>{k.phu}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {loi && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{loi}</p>}

        <button
          type="submit"
          disabled={dangChay}
          className="h-12 w-full rounded-lg bg-cvr-ink text-[15px] font-semibold text-white transition hover:bg-cvr-ink/90 disabled:opacity-60"
        >
          {dangChay ? "Đang gửi mã…" : "Tiếp tục"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-cvr-muted">
        Đã có tài khoản?{" "}
        <Link href="/dang-nhap" className="font-semibold text-cvr-ink hover:underline">Đăng nhập</Link>
      </p>
    </div>
  );
}
