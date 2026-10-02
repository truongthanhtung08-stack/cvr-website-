import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { kiemTin } from "@/lib/kiemTin";

// Nút "Tự kiểm tin" ở /admin/tin-dang — logic nằm ở src/lib/kiemTin.ts (dùng chung với báo cáo 8h sáng).
export const dynamic = "force-dynamic";

export async function GET() {
  const ssr = await createClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, message: "Chưa đăng nhập" }, { status: 401 });
  const { data: me } = await ssr.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") return NextResponse.json({ ok: false, message: "Chỉ quản trị viên" }, { status: 403 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ ok: false, message: "Thiếu SUPABASE_SERVICE_ROLE_KEY" }, { status: 500 });
  try {
    return NextResponse.json({ ok: true, ...(await kiemTin(admin)) });
  } catch (e) {
    return NextResponse.json({ ok: false, message: String((e as Error).message) }, { status: 500 });
  }
}
