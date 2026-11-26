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
  // SỐ ĐĂNG NHẬP ĐÃ XÁC THỰC → GHI VÀO HỒ SƠ TÀI KHOẢN (anh 26/11/2026: "số đã xác thực khi đăng nhập sao không lưu vào tài khoản"):
  // số nằm ở phần đăng nhập (auth.phone) mà hồ sơ (profiles.phone — Cài đặt, đăng tin đọc ở đây) trống → ghi vào. Số đang là số chính
  // của tài khoản khác thì không đụng (không gộp — anh 12/11), Cài đặt / đăng tin vẫn đọc số đăng nhập (soCuaTaiKhoan).
  if (user.phone && user.phone_confirmed_at) {
    const so = `0${user.phone.replace(/^\+?84/, "")}`;
    const { data: hs } = await admin.from("profiles").select("phone").eq("id", user.id).maybeSingle();
    if (hs && !hs.phone) {
      const { count } = await admin.from("profiles").select("id", { count: "exact", head: true }).eq("phone", so).neq("id", user.id);
      if (!count) await admin.from("profiles").update({ phone: so, phone_verified: true }).eq("id", user.id);
    }
  }
  return NextResponse.json({ ok: true });
}
