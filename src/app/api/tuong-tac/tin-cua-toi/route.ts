import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Thích · bình luận trên TIN CỦA TÔI (trang Tài khoản → Khách hàng) — chỉ tên người tương tác,
// không lộ số điện thoại của họ (chủ dự án 10/10/2026).
export const dynamic = "force-dynamic";

export async function GET() {
  const ssr = await createClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const db = createAdminClient();
  if (!db) return NextResponse.json({ ok: false }, { status: 500 });
  const { data: tin } = await db.from("listings").select("id, title").eq("owner_id", user.id).limit(1000);
  const ids = (tin ?? []).map((x) => x.id as string);
  if (!ids.length) return NextResponse.json({ ok: true, ds: [] });
  const { data } = await db.from("tuong_tac_tin").select("listing_id, anh_so, loai, noi_dung, created_at, user_id").in("listing_id", ids).neq("user_id", user.id).order("created_at", { ascending: false }).limit(200);
  const nguoi = [...new Set((data ?? []).map((x) => x.user_id as string))];
  const { data: p } = nguoi.length ? await db.from("profiles").select("id, full_name").in("id", nguoi) : { data: [] };
  const ten = new Map((p ?? []).map((x) => [x.id as string, (x.full_name as string) || "Thành viên"]));
  const tieuDe = new Map((tin ?? []).map((x) => [x.id as string, x.title as string]));
  return NextResponse.json({
    ok: true,
    ds: (data ?? []).map((x) => ({ listingId: x.listing_id, tin: tieuDe.get(x.listing_id as string) ?? "", anhSo: x.anh_so, loai: x.loai, noiDung: x.noi_dung, luc: x.created_at, ten: ten.get(x.user_id as string) ?? "Thành viên" })),
  });
}
