import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Middleware chạy trên Vercel (SSR) — làm mới session Supabase Auth cho mọi request
// và gác các vùng cần đăng nhập (/admin, /tai-khoan). KHÔNG chạy khi static export
// (GitHub Pages) — đây là một phần của B0: chuyển runtime sang Vercel.
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Chưa cấu hình Supabase (vd worktree chưa có .env.local) → bỏ qua, không chặn gì.
  if (!url || !anon) return response;

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Bắt buộc gọi để làm mới token — nếu bỏ, session sẽ hết hạn ngẫu nhiên ở Server Components.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Gác vùng cần đăng nhập. Khi auth thật xong (B1), khách chưa đăng nhập vào /admin hay
  // /tai-khoan sẽ bị đưa về trang đăng nhập kèm ?next để quay lại sau khi đăng nhập.
  const path = request.nextUrl.pathname;
  const needsAuth = path.startsWith("/admin") || path.startsWith("/tai-khoan");
  if (needsAuth && !user) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/dang-nhap";
    redirect.searchParams.set("next", path);
    return NextResponse.redirect(redirect);
  }

  // Gác riêng /admin theo vai trò: chỉ profiles.role='admin' mới được vào.
  // (Đã đăng nhập nhưng không phải admin → đưa về trang chủ. Dữ liệu vẫn được RLS
  // bảo vệ thêm một lớp ở database.)
  if (path.startsWith("/admin") && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (!profile || profile.role !== "admin") {
      const home = request.nextUrl.clone();
      home.pathname = "/";
      return NextResponse.redirect(home);
    }
  }

  return response;
}

export const config = {
  // Bỏ qua asset tĩnh & ảnh để middleware không chạy thừa.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|logo|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
