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

// BƯỚC 1 của đăng nhập Zalo: đẩy khách sang trang cho phép của Zalo.
// Sinh code_verifier (PKCE) + state chống giả mạo, cất tạm vào cookie httpOnly
// để bước callback đối chiếu lại.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const { appId, daCauHinh } = zaloConfig();

  // Chưa cắm khoá → quay về trang đăng nhập kèm lý do, KHÔNG để trang trắng.
  if (!daCauHinh || !appId) {
    return NextResponse.redirect(`${origin}/dang-nhap?error=zalo_chua_cau_hinh`);
  }

  // Chỉ nhận đường dẫn nội bộ — chặn chuyển hướng ra ngoài trang.
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

  const res = NextResponse.redirect(url.toString());
  const chung = {
    httpOnly: true,
    secure: origin.startsWith("https"),
    sameSite: "lax" as const,
    path: "/",
    maxAge: 600, // 10 phút là quá đủ cho một lần đăng nhập
  };
  res.cookies.set(COOKIE_VERIFIER, verifier, chung);
  res.cookies.set(COOKIE_STATE, state, chung);
  res.cookies.set(COOKIE_NEXT, next, chung);
  return res;
}
