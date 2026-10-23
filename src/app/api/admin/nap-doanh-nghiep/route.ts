import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { napDoanhNghiep } from "@/lib/gomChuTin";
import type { DongDoanhNghiep } from "@/lib/hoSoDoanhNghiep";

// ============================================================================
// NẠP SHEET "DOANH NGHIỆP" (chủ dự án 23/10/2026) — trang Nhập hàng loạt gọi SAU gom-tin-dang-ho (tài khoản
// theo SĐT đã có). Khớp SĐT → vai trò "Công ty / Sàn" + điền hồ sơ còn trống. Chỉ admin. Chạy theo lần nạp,
// không định kỳ — không thêm chi phí.
// ============================================================================
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ssr = await createClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, loi: "Chưa đăng nhập." }, { status: 401 });
  const { data: me } = await ssr.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") return NextResponse.json({ ok: false, loi: "Chỉ quản trị viên." }, { status: 403 });
  const db = createAdminClient();
  if (!db) return NextResponse.json({ ok: false, loi: "Máy chủ chưa cấu hình đủ." }, { status: 500 });
  const { ds } = (await req.json()) as { ds: DongDoanhNghiep[] };
  return NextResponse.json({ ok: true, ...(await napDoanhNghiep(db, ds ?? [])) });
}
