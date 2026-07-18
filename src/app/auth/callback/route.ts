import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Điểm về sau khi đăng nhập Google (OAuth PKCE): đổi ?code= thành phiên đăng nhập
// (cookie) rồi đưa người dùng tới trang đích (?next=, mặc định /tai-khoan).
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Chỉ nhận đường dẫn nội bộ ("/...") — chặn chuyển hướng ra ngoài trang.
  const nextParam = searchParams.get("next");
  const next =
    nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : null;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Không có đích cụ thể → đưa về ĐÚNG NƠI theo vai trò:
      // admin → trang quản trị · khách → trang tài khoản.
      let dest = next;
      if (!dest) {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: profile } = user
          ? await supabase.from("profiles").select("role").eq("id", user.id).single()
          : { data: null };
        dest = profile?.role === "admin" ? "/admin" : "/tai-khoan";
      }
      return NextResponse.redirect(`${origin}${dest}`);
    }
  }

  return NextResponse.redirect(`${origin}/dang-nhap?error=oauth`);
}
