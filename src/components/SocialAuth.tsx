"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// Đăng nhập/đăng ký bằng mạng xã hội — dùng chung cho /dang-nhap và /dang-ky.
// Google + Facebook: chạy thật qua Supabase OAuth (đã bật provider trong Supabase).
// Zalo: chưa có — Supabase không hỗ trợ sẵn, phải tự nối qua Zalo OA (cần ĐKKD).

// ⚠️ TẠM ẨN NÚT FACEBOOK (24/08/2026).
// Phía Supabase đã bật provider đúng, nhưng app Facebook 2187272691890819 CHƯA được
// Đăng (menu Đăng còn nhãn "Đã hủy đăng"). App chưa Đăng thì CHỈ người có vai trò
// trong app đăng nhập được — chủ dự án vào bình thường, khách ngoài thì hỏng.
// Đăng app đang kẹt ở Xác minh doanh nghiệp: hồ sơ nộp 19/08/2026 bị Meta từ chối
// ("chưa xác minh được... dựa trên thông tin bạn cung cấp") vì công ty mới cấp ĐKKD
// ngày 17/08/2026, chưa kịp có trong cơ sở dữ liệu Meta tra. Nộp lại khoảng 15/09.
//
// 👉 KHI APP ĐÃ ĐĂNG: đổi dòng dưới thành `true` là nút hiện lại. KHÔNG phải sửa gì khác.
const BAT_FACEBOOK = false;

// ⚠️ TẠM ẨN NÚT SỐ ĐIỆN THOẠI (24/08/2026).
// Supabase trả `phone: false` — provider Phone chưa bật, nên trang
// /dang-nhap/so-dien-thoai có đủ giao diện + signInWithOtp nhưng khách bấm vào sẽ
// KHÔNG BAO GIỜ nhận được mã. Chốt với chủ dự án: chưa đi đường Twilio vì SMS về VN
// ~1.300đ/tin và hay bị nhà mạng chặn nếu chưa đăng ký brandname. Dồn cho Zalo.
//
// 👉 KHI ĐÃ BẬT Phone provider + cắm SMS: đổi thành `true`.
const BAT_SO_DIEN_THOAI = false;

export default function SocialAuth() {
  const [notice, setNotice] = useState("");
  // Nút NÀO đang chờ thì CHỈ nút đó báo "Đang chuyển tới…". Trước đây dùng một cờ
  // chung nên bấm Zalo lại thấy nút Google đổi chữ → tưởng web đá sang Google.
  const [loading, setLoading] = useState<null | "google" | "facebook" | "zalo">(null);

  async function withGoogle() {
    setLoading("google");
    setNotice("");
    const next = new URLSearchParams(window.location.search).get("next") || "/tai-khoan";
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        // LUÔN hiện màn hình CHỌN TÀI KHOẢN Google (không tự vào gmail gần nhất)
        // — người có nhiều gmail (vd admin + khách) chọn đúng tài khoản mỗi lần.
        // Chủ dự án xác nhận 28/8: cho chọn tài khoản là bình thường, GIỮ NGUYÊN.
        queryParams: { prompt: "select_account" },
      },
    });
    // Thành công thì trình duyệt tự chuyển sang Google — chỉ còn lại trường hợp lỗi.
    if (error) {
      setLoading(null);
      setNotice(
        /provider is not enabled/i.test(error.message)
          ? "Đăng nhập Google chưa được bật trên hệ thống. Vui lòng dùng email hoặc thử lại sau."
          : "Không kết nối được Google. Vui lòng thử lại."
      );
    }
  }

  // Đăng nhập qua nhà cung cấp khác (Facebook…). Chưa bật provider trong Supabase
  // → báo rõ để chủ dự án biết cần cắm App ID / App Secret.
  async function withProvider(provider: "facebook") {
    setLoading(provider);
    setNotice("");
    const next = new URLSearchParams(window.location.search).get("next") || "/tai-khoan";
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        // LƯU Ý: Supabase LUÔN tự thêm `email` vào scope Facebook, không bỏ được từ đây.
        // Nếu Facebook báo "Invalid Scopes: email" thì phải sửa ở Facebook Developer
        // (thêm use case Facebook Login + quyền email), không phải sửa dòng này.
        scopes: "public_profile",
      },
    });
    if (error) {
      setLoading(null);
      setNotice(
        /provider is not enabled/i.test(error.message)
          ? "Đăng nhập Facebook chưa được bật. Cần App ID và App Secret của Facebook Developer."
          : "Không kết nối được Facebook. Vui lòng thử lại.",
      );
    }
  }

  // Zalo không nằm trong danh sách nhà cung cấp sẵn của Supabase → tự nối qua
  // route riêng /api/auth/zalo (OAuth v4 + PKCE, xử lý phía máy chủ).
  // Chưa cắm khoá trong Vercel thì route tự đá về đây kèm ?error=zalo_chua_cau_hinh.
  function withZalo() {
    setLoading("zalo");
    const next = new URLSearchParams(window.location.search).get("next") || "/tai-khoan";
    window.location.href = `/api/auth/zalo?next=${encodeURIComponent(next)}`;
  }

  return (
    <div className="space-y-2.5">
      {notice && (
        <p className="rounded-lg border border-cvr-blue/30 bg-cvr-blue/[0.08] px-3 py-2 text-sm text-cvr-blue-ink">
          {notice}
        </p>
      )}

      {/* ZALO ĐỨNG ĐẦU — gần như người mua nhà ở Việt Nam nào cũng sẵn Zalo trên
          máy, bấm một cái là vào thẳng (điện thoại mở app, máy tính quét QR).
          Google xuống dưới làm đường dự phòng. Viền đậm + chữ đậm để mắt rơi
          vào đây trước, KHÔNG đổi màu nền — giữ nguyên hệ nút trắng của trang. */}
      <button
        type="button"
        onClick={() => withZalo()}
        disabled={loading !== null}
        className="flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-cvr-ink bg-white text-sm font-semibold text-cvr-ink transition hover:bg-cvr-surface disabled:opacity-60"
      >
        <ZaloIcon />
        {loading === "zalo" ? "Đang chuyển tới Zalo…" : "Tiếp tục với Zalo"}
      </button>

      <button
        type="button"
        onClick={withGoogle}
        disabled={loading !== null}
        className="flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-cvr-line bg-white text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink disabled:opacity-60"
      >
        <GoogleIcon />
        {loading === "google" ? "Đang chuyển tới Google…" : "Tiếp tục với Google"}
      </button>

      {BAT_FACEBOOK && (
        <button
          type="button"
          onClick={() => withProvider("facebook")}
          disabled={loading !== null}
          className="flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-cvr-line bg-white text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink disabled:opacity-60"
        >
          <FacebookIcon />
          {loading === "facebook" ? "Đang chuyển tới Facebook…" : "Tiếp tục với Facebook"}
        </button>
      )}

      {BAT_SO_DIEN_THOAI && (
        <Link
          href="/dang-nhap/so-dien-thoai"
          className="flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-cvr-line bg-white text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink"
        >
          <PhoneIcon />
          Tiếp tục với số điện thoại
        </Link>
      )}
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

// Xanh Facebook chính thức — đổi từ xám sang xanh khi provider đã bật thật,
// để nút không còn trông như đang "sắp có".
function FacebookIcon() {
  return (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="#1877F2" aria-hidden>
      <path d="M22 12a10 10 0 10-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0022 12z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg className="h-[18px] w-[18px]" fill="none" stroke="#6e6e73" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h2.5a1 1 0 01.97.757l.9 3.6a1 1 0 01-.29.98l-1.5 1.4a14 14 0 006.68 6.68l1.4-1.5a1 1 0 01.98-.29l3.6.9a1 1 0 01.76.97V19a2 2 0 01-2 2A16 16 0 013 5z" />
    </svg>
  );
}

// Zalo KHÔNG phải hình bong bóng chat — nhận diện đúng của Zalo là ô bo góc màu
// xanh #0068FF với chữ "Zalo" trắng ở giữa. Vẽ giống hệt logo Zalo dưới Footer
// để cả web chỉ có MỘT hình Zalo duy nhất.
function ZaloIcon() {
  return (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" aria-hidden>
      <rect width="24" height="24" rx="6.5" fill="#0068FF" />
      <text
        x="12"
        y="15.6"
        textAnchor="middle"
        fill="#ffffff"
        fontSize="8.6"
        fontWeight="700"
        fontFamily="Helvetica, Arial, sans-serif"
        letterSpacing="-0.3"
      >
        Zalo
      </text>
    </svg>
  );
}
