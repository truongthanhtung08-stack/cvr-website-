import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Middleware chạy trên Vercel (SSR) — làm mới session Supabase Auth cho mọi request
// và gác các vùng cần đăng nhập (/admin, /tai-khoan). KHÔNG chạy khi static export
// (GitHub Pages) — đây là một phần của B0: chuyển runtime sang Vercel.
// TIN ZALO TỰ ĐỘNG (ZBS) → MỞ MINI APP (anh 14/11/2026: "đường mạnh nhất là tin Zalo gửi tới khách"): 13 mẫu ZBS đã duyệt có nút
// mở các trang tài khoản của web (docs/MAU-ZBS-MOI.md). Khách bấm trong Zalo → chuyển sang Mini App Coastal Land đúng màn đó (Mini App
// tự vào tài khoản theo Zalo). CHỈ đúng cú bấm từ tin: trong Zalo (UA "Zalo"), GET, đúng đường, không tham số (trang thanh toán quay
// về /tai-khoan/nap-tien?ket-qua=… không bị chuyển), không phải chuyển trang trong web (RSC / Referer coastalland.vn) — khách đang
// dùng web trong Zalo vẫn ở web; khách đã đăng nhập web (cookie phiên) cũng ở web. /tai-khoan/tuong-tac Mini App chưa có màn tương ứng → giữ web.
const MINI_APP = "https://zalo.me/s/1268705237708475790";
const ZBS_SANG_MINI_APP: Record<string, string> = {
  "/tai-khoan/tin-dang": "/tin-cua-toi",
  "/tai-khoan/khach-hang": "/khach-hang",
  "/tai-khoan/nap-tien": "/nap-tien",
  "/tai-khoan/hoi-vien": "/hoi-vien",
};
function tuTinZalo(request: NextRequest): string | null {
  const dich = ZBS_SANG_MINI_APP[request.nextUrl.pathname];
  if (!dich || request.method !== "GET" || request.nextUrl.search) return null;
  if (!/Zalo/i.test(request.headers.get("user-agent") ?? "")) return null;
  if (request.headers.get("rsc") || request.headers.get("next-router-state-tree")) return null;
  if (/coastalland\.vn/i.test(request.headers.get("referer") ?? "")) return null;
  // Khách đã đăng nhập web trong trình duyệt của Zalo (có cookie phiên "sb-") → ở lại web, không đẩy sang Mini App (anh 14/11/2026)
  if (request.cookies.getAll().some((c) => c.name.startsWith("sb-"))) return null;
  return MINI_APP + dich;
}

export async function middleware(request: NextRequest) {
  const sangMiniApp = tuTinZalo(request);
  if (sangMiniApp) return NextResponse.redirect(sangMiniApp, 302);
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Chưa cấu hình Supabase (vd worktree chưa có .env.local) → bỏ qua, không chặn gì.
  if (!url || !anon) return response;

  // ── KHÁCH LẠ THÌ ĐỪNG HỎI SUPABASE "BẠN LÀ AI" ───────────────────────────
  // Middleware chạy trước MỌI trang. Trước đây lượt nào cũng gọi auth.getUser(),
  // tức mỗi lần ai đó mở trang chủ là web phải đi một vòng sang Supabase ở Tokyo
  // để hỏi danh tính — kể cả người chưa từng đăng nhập, chẳng có gì để hỏi.
  // Đo 12/09/2026: đó là phần lớn quãng 500–600 ms khách phải chờ trước khi
  // thấy trang, và khách lạ thì chiếm đa số lượt truy cập.
  //
  // Người ĐÃ đăng nhập luôn mang theo cookie tên bắt đầu "sb-". Không có cookie
  // đó, lại không vào vùng cần gác, thì cho đi thẳng: không có phiên nào để làm
  // mới, không có quyền nào để kiểm.
  // ⚠️ ĐỪNG bỏ nhánh getUser() bên dưới: người đã đăng nhập VẪN phải gọi để làm
  // mới token, bỏ là session hết hạn ngẫu nhiên giữa chừng.
  const path0 = request.nextUrl.pathname;
  const coPhien = request.cookies.getAll().some((c) => c.name.startsWith("sb-"));
  const vungCanGac = path0.startsWith("/admin") || path0.startsWith("/tai-khoan");
  if (!coPhien && !vungCanGac) return response;

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
