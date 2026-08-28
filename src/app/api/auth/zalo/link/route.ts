import { NextResponse } from "next/server";
import {
  COOKIE_NEXT,
  COOKIE_STATE,
  COOKIE_VERIFIER,
  ZALO_PERMISSION_URL,
  taoChallenge,
  taoVerifier,
  zaloConfig,
} from "@/lib/zalo";

// ============================================================================
// LẤY SẴN ĐƯỜNG DẪN ZALO — để nút là MỘT CÚ BẤM THẲNG, không qua chuyển hướng
// ----------------------------------------------------------------------------
// VÌ SAO PHẢI CÓ ROUTE NÀY: người Việt đăng nhập Zalo bằng APP, không ai vào
// trình duyệt đăng nhập Zalo Web. Muốn bấm nút trên web mà mở được app Zalo thì
// điện thoại phải "bắt" được đường dẫn oauth.zaloapp.com và giao cho app.
//
// Nhưng Android/Chrome CỐ Ý KHÔNG giao link cho app khi đường dẫn đó đến từ một
// CHUỖI CHUYỂN HƯỚNG (đây là cách chặn trang lạ tự ý mở app người dùng). Cách cũ
// của mình đúng là chuỗi chuyển hướng: bấm nút → /api/auth/zalo → 307 → Zalo.
// Nên điện thoại luôn mở bằng trình duyệt, và Zalo đòi đăng nhập Zalo Web.
//
// Cách mới: dựng sẵn đường dẫn Zalo NGAY KHI MỞ TRANG (route này), rồi để nút là
// một thẻ liên kết bình thường. Khách chạm vào là chạm THẲNG vào oauth.zaloapp.com
// — có cú chạm của người thật, không qua chuyển hướng → điện thoại mới cho phép
// giao sang app Zalo.
//
// Không hứa chắc mở được app: còn tuỳ Zalo có đăng ký đường dẫn đó với hệ điều
// hành hay không. Nhưng đây là điều kiện CẦN — thiếu nó thì chắc chắn không bao giờ
// mở được app. Mở không được thì vẫn chạy y như cũ (ra trang Zalo trên trình duyệt).
//
// Cookie PKCE đặt luôn ở đây, sống 30 phút — khách mở trang rồi ngồi đọc một lúc
// mới bấm là chuyện bình thường, để 10 phút như route cũ thì hay hết hạn oan.
// ============================================================================
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const { appId, daCauHinh } = zaloConfig();

  if (!daCauHinh || !appId) {
    return NextResponse.json({ ok: false, lyDo: "zalo_chua_cau_hinh" }, { status: 503 });
  }

  const nextParam = searchParams.get("next");
  const next =
    nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
      ? nextParam
      : "/tai-khoan";

  const verifier = taoVerifier();
  const challenge = await taoChallenge(verifier);
  const state = taoVerifier();

  const url = new URL(ZALO_PERMISSION_URL);
  url.searchParams.set("app_id", appId);
  url.searchParams.set("redirect_uri", `${origin}/auth/zalo/callback`);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("state", state);

  const res = NextResponse.json({ ok: true, url: url.toString() });
  const chung = {
    httpOnly: true,
    secure: origin.startsWith("https"),
    sameSite: "lax" as const,
    path: "/",
    maxAge: 1800,
  };
  res.cookies.set(COOKIE_VERIFIER, verifier, chung);
  res.cookies.set(COOKIE_STATE, state, chung);
  res.cookies.set(COOKIE_NEXT, next, chung);
  return res;
}
