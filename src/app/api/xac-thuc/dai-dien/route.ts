import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { datDaiDien } from "@/lib/daiDien";

// Đăng nhập bằng mật khẩu chạy trên trình duyệt (email / số điện thoại) → báo về đây để đặt tên + ảnh
// mặc định theo cách vừa đăng nhập (một hàm chung datDaiDien). Gọi một lần sau mỗi lần đăng nhập.
export async function POST(req: Request) {
  const { cach } = (await req.json().catch(() => ({}))) as { cach?: string };
  if (cach !== "email" && cach !== "sdt") return NextResponse.json({ ok: false }, { status: 400 });
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  const admin = createAdminClient();
  if (!user || !admin) return NextResponse.json({ ok: false }, { status: 401 });
  await datDaiDien(admin, user.id, cach);
  return NextResponse.json({ ok: true });
}
