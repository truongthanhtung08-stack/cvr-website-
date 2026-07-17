import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Điểm về sau khi đăng nhập Google (OAuth PKCE): đổi ?code= thành phiên đăng nhập
// (cookie) rồi đưa người dùng tới trang đích (?next=, mặc định /tai-khoan).
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Chỉ nhận đường dẫn nội bộ ("/...") — chặn chuyển hướng ra ngoài trang.
  const nextParam = searchParams.get("next") ?? "/tai-khoan";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/tai-khoan";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/dang-nhap?error=oauth`);
}
