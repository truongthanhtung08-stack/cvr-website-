"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { baoCachDangNhap } from "@/lib/useAuth";
import { chuanHoaSdt, laSdtVN } from "@/lib/phone";

// ============================================================================
// QUÊN MẬT KHẨU — MÃ 6 SỐ (chủ dự án chốt 11/09/2026)
//
// Trước đây gửi LIÊN KẾT đặt lại: khách phải rời trang, mở hộp thư, bấm vào một
// đường dẫn dài — nhiều người ngại bấm, và thư dạng đó hay rơi vào mục quảng cáo.
// Nay giống hệt bước đăng ký: nhận mã, gõ mã, đặt mật khẩu mới, đăng nhập luôn.
//
// NHẬN CẢ EMAIL LẪN SỐ ĐIỆN THOẠI trong cùng một ô:
//   · gõ email        → mã gửi qua email
//   · gõ số điện thoại → mã gửi qua Zalo
// Áp dụng cho MỌI tài khoản, kể cả tài khoản chủ dự án tạo hộ và tài khoản khách
// tự đăng ký. Rất nhiều môi giới chỉ có số điện thoại — bắt nhập email ở bước
// quên mật khẩu là khoá luôn đường vào của nhóm khách đông nhất.
// ============================================================================

export default function ForgotPasswordForm() {
  // 3 BƯỚC TÁCH RIÊNG (anh 26/11/2026: "quy trình rất không logic"): ① số điện thoại → ② mã (kiểm đúng NGAY) → ③ mật khẩu mới.
  // Trước đây bước 2 dồn mã + mật khẩu + nhập lại: mã sai cũng phải gõ xong mật khẩu mới biết.
  const [buoc, setBuoc] = useState<"email" | "ma" | "matkhau">("email");
  // MỘT Ô cho cả email lẫn số điện thoại — khách được đăng tin hộ nhiều người
  // chỉ có số điện thoại, bắt nhập email là khoá luôn đường vào của họ.
  const [dinhDanh, setDinhDanh] = useState("");
  const [kenh, setKenh] = useState<"email" | "zalo">("email");
  const [ma, setMa] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [loi, setLoi] = useState("");
  const [dangChay, setDangChay] = useState(false);

  const oCls =
    "mt-1 h-11 w-full rounded-lg border border-cvr-line px-4 text-[15px] text-cvr-ink outline-none transition placeholder:text-cvr-faint focus:border-cvr-ink";

  async function guiMa(e: React.FormEvent) {
    e.preventDefault();
    setLoi("");
    const v = dinhDanh.trim();
    // CHỈ SỐ ĐIỆN THOẠI (anh 26/11/2026: bỏ email — một số một tài khoản), mã gửi qua Zalo của số đó
    const laSo = laSdtVN(chuanHoaSdt(v));
    if (!laSo) return setLoi("Nhập đúng số điện thoại (10 số).");
    setDangChay(true);
    try {
      const r = await fetch("/api/xac-thuc/gui-ma", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          laSo
            ? { sdt: chuanHoaSdt(v), kenh: "zalo", viec: "quen-mat-khau" }
            : { email: v, kenh: "email", viec: "quen-mat-khau" },
        ),
      });
      const kq = await r.json();
      if (!kq.ok) return setLoi(kq.loi || "Không gửi được mã.");
      setKenh(kq.kenh === "zalo" ? "zalo" : "email");
      setBuoc("ma");
    } catch {
      setLoi("Không kết nối được máy chủ.");
    } finally {
      setDangChay(false);
    }
  }

  async function kiemMaNhap(e: React.FormEvent) {
    e.preventDefault();
    setLoi("");
    if (ma.trim().length !== 6) return setLoi("Mã gồm 6 chữ số.");
    setDangChay(true);
    try {
      const kq = await fetch("/api/xac-thuc/doi-mat-khau", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buoc: "kiem-ma", sdt: chuanHoaSdt(dinhDanh), ma: ma.trim() }),
      }).then((x) => x.json());
      if (!kq.ok) return setLoi(kq.loi || "Mã không đúng.");
      setBuoc("matkhau");
    } catch {
      setLoi("Không kết nối được máy chủ.");
    } finally {
      setDangChay(false);
    }
  }

  async function datLai(e: React.FormEvent) {
    e.preventDefault();
    setLoi("");
    if (ma.trim().length !== 6) return setLoi("Mã gồm 6 chữ số.");
    if (pw.length < 6) return setLoi("Mật khẩu cần ít nhất 6 ký tự.");
    if (pw !== pw2) return setLoi("Hai lần nhập mật khẩu chưa khớp nhau.");

    setDangChay(true);
    try {
      const r = await fetch("/api/xac-thuc/doi-mat-khau", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(kenh === "zalo" ? { sdt: chuanHoaSdt(dinhDanh) } : { email: dinhDanh.trim() }),
          ma: ma.trim(),
          matKhauMoi: pw,
        }),
      });
      const kq = await r.json();
      if (!kq.ok) { setDangChay(false); return setLoi(kq.loi || "Không đổi được mật khẩu."); }

      // Đổi xong ĐĂNG NHẬP LUÔN — không bắt gõ lại mật khẩu vừa đặt.
      const supabase = createClient();
      const so = chuanHoaSdt(dinhDanh);
      let { error } = kenh === "zalo"
        ? await supabase.auth.signInWithPassword({ phone: `+84${so.slice(1)}`, password: pw })
        : await supabase.auth.signInWithPassword({ email: kq.emailDangNhap || dinhDanh.trim(), password: pw } /* tài khoản đã gộp: vào tài khoản được giữ lại (doi-mat-khau trả emailDangNhap) */);
      // QUÊN MẬT KHẨU CHO MỌI CÁCH VÀO (chủ dự án 05/11/2026): số ghi trong hồ sơ tài khoản Gmail / Zalo / email (không phải số đăng
      // nhập của Supabase) → máy chủ dò đúng tài khoản giữ số rồi vào bằng mật khẩu vừa đặt — như trang đăng nhập số. Trước đây
      // đổi được mật khẩu nhưng không vào luôn, bị đẩy về /dang-nhap.
      if (error && kenh === "zalo") {
        const r2 = await fetch("/api/xac-thuc/dang-nhap-sdt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ buoc: "mat-khau", sdt: so, matKhau: pw }),
        }).then((x) => x.json()).catch(() => null);
        if (r2?.ok) {
          await supabase.auth.setSession({ access_token: r2.access_token, refresh_token: r2.refresh_token });
          error = null;
        }
      }
      if (!error) await baoCachDangNhap(kenh === "zalo" ? "sdt" : "email"); // tên + ảnh mặc định theo cách đăng nhập
      window.location.href = error ? "/dang-nhap" : "/tai-khoan";
    } catch {
      setDangChay(false);
      setLoi("Không kết nối được máy chủ.");
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-cvr-line bg-white p-6 shadow-lux sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight text-cvr-ink">Quên mật khẩu</h1>

      {buoc === "email" ? (
        <>
          <form onSubmit={guiMa} className="mt-5 space-y-4">
            <div>
              <label className="text-sm font-medium text-cvr-body">Số điện thoại</label>
              <input
                value={dinhDanh}
                onChange={(e) => setDinhDanh(e.target.value)}
                autoComplete="tel"
                inputMode="tel"
                placeholder="0905123456"
                className={oCls}
              />
            </div>
            {loi && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{loi}</p>}
            <button
              type="submit"
              disabled={dangChay}
              className="h-12 w-full rounded-lg bg-cvr-ink text-[15px] font-semibold text-white transition hover:bg-cvr-ink/90 disabled:opacity-60"
            >
              {dangChay ? "Đang gửi mã…" : "Nhận mã Zalo"}
            </button>
          </form>
        </>
      ) : buoc === "ma" ? (
        <>
          <p className="mt-1.5 text-sm leading-relaxed text-cvr-muted">
            Mã 6 số vừa gửi tới <strong className="font-semibold text-cvr-ink">Zalo {chuanHoaSdt(dinhDanh)}</strong>, hiệu lực 10 phút.
          </p>
          <form onSubmit={kiemMaNhap} className="mt-5 space-y-4">
            <input
              value={ma}
              onChange={(e) => setMa(e.target.value.replace(/D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              placeholder="______"
              className="h-14 w-full rounded-lg border border-cvr-line text-center text-2xl font-semibold tracking-[0.5em] text-cvr-ink outline-none focus:border-cvr-ink"
            />
            {loi && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{loi}</p>}
            <button
              type="submit"
              disabled={dangChay || ma.length !== 6}
              className="h-12 w-full rounded-lg bg-cvr-ink text-[15px] font-semibold text-white transition hover:bg-cvr-ink/90 disabled:opacity-60"
            >
              {dangChay ? "Đang kiểm mã…" : "Xác nhận mã"}
            </button>
            <button type="button" onClick={() => { setBuoc("email"); setMa(""); setLoi(""); }} className="w-full text-sm text-cvr-muted hover:text-cvr-ink">
              ← Nhập lại số điện thoại
            </button>
          </form>
        </>
      ) : (
        <>
          <form onSubmit={datLai} className="mt-5 space-y-4">
            <div>
              <label className="text-sm font-medium text-cvr-body">Mật khẩu mới</label>
              <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" autoFocus placeholder="Ít nhất 6 ký tự" className={oCls} />
            </div>
            <div>
              <label className="text-sm font-medium text-cvr-body">Nhập lại mật khẩu mới</label>
              <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" placeholder="Nhập lại mật khẩu mới" className={oCls} />
            </div>
            {loi && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{loi}</p>}
            <button
              type="submit"
              disabled={dangChay}
              className="h-12 w-full rounded-lg bg-cvr-ink text-[15px] font-semibold text-white transition hover:bg-cvr-ink/90 disabled:opacity-60"
            >
              {dangChay ? "Đang lưu…" : "Lưu mật khẩu và đăng nhập"}
            </button>
          </form>
        </>
      )}

      <p className="mt-5 text-center text-sm text-cvr-muted">
        <Link href="/dang-nhap" className="font-semibold text-cvr-ink hover:underline">Quay lại đăng nhập</Link>
      </p>
    </div>
  );
}
