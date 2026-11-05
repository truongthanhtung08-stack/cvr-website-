import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { taiKhoanGiu, moPhienTaiKhoan } from "@/lib/gopTaiKhoan";

// POST /api/xac-thuc/ve-tai-khoan-gop — tài khoản ĐÃ GỘP (app_metadata.gop_vao) vừa đăng nhập bằng cửa cũ → trả phiên
// của tài khoản giữ lại (lib/gopTaiKhoan). useAuth gọi khi thấy dấu gộp. Header: Authorization: Bearer <access_token>.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const admin = createAdminClient();
  if (!admin || !token) return NextResponse.json({ ok: false }, { status: 401 });
  const { data: u } = await admin.auth.getUser(token);
  const id = u?.user?.id;
  if (!id) return NextResponse.json({ ok: false }, { status: 401 });
  const giu = await taiKhoanGiu(admin, id);
  if (giu === id) return NextResponse.json({ ok: false, khongGop: true });
  const phien = await moPhienTaiKhoan(admin, giu);
  if (!phien) return NextResponse.json({ ok: false }, { status: 500 });
  return NextResponse.json({ ok: true, access_token: phien.access_token, refresh_token: phien.refresh_token });
}
