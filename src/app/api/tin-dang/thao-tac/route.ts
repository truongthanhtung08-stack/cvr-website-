import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// ============================================================================
// THAO TÁC CỦA KHÁCH TRÊN TIN CỦA MÌNH (chuẩn Batdongsan, 03/10/2026)
//   · viec "ha"          — HẠ TIN: tin đang hiển thị → "Đã hạ" (status hidden, ha_boi
//                          'khach'). Ngừng hiển thị, giữ nguyên dữ liệu; sau này Đăng lại
//                          như tin hết hạn. Không hoàn tiền.
//   · viec "tu_dang_lai" — bật/tắt TỰ ĐĂNG LẠI: tới hạn máy tự gửi đăng lại đúng gói
//                          đang dùng (hetHanTin.ts). Ví thiếu → nhắn khách nạp, nạp đủ
//                          là tự gửi (up_cho).
// Ghi bằng khoá máy chủ: khách không tự sửa được trạng thái tin qua trình duyệt.
// ============================================================================
export async function POST(req: Request) {
  const ssr = await createClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return loi("Bạn cần đăng nhập.", 401);

  const b = (await req.json().catch(() => ({}))) as { id?: string; viec?: string; bat?: boolean };
  if (!b.id || (b.viec !== "ha" && b.viec !== "tu_dang_lai")) return loi("Thiếu tin hoặc thao tác.");

  const admin = createAdminClient();
  if (!admin) return loi("Máy chủ chưa cấu hình đủ.", 500);

  const { data: tin } = await admin.from("listings").select("id,owner_id,status,details").eq("id", b.id).maybeSingle();
  if (!tin) return loi("Không tìm thấy tin.", 404);
  if (tin.owner_id !== user.id) return loi("Tin này không phải của bạn.", 403);
  const chiTiet = (tin.details as Record<string, unknown> | null) ?? {};

  if (b.viec === "ha") {
    if (tin.status !== "approved") return loi("Chỉ hạ được tin đang hiển thị.");
    const { error } = await admin
      .from("listings")
      .update({ status: "hidden", bump_credits: 0, details: { ...chiTiet, ha_boi: "khach", ha_luc: new Date().toISOString() } })
      .eq("id", tin.id)
      .eq("status", "approved");
    if (error) return loi(error.message, 500);
    revalidateTag("listings", "max");
    return NextResponse.json({ ok: true });
  }

  // tu_dang_lai
  if (tin.status !== "approved" && tin.status !== "pending") return loi("Chỉ bật được cho tin đang hiển thị hoặc chờ duyệt.");
  const { error } = await admin
    .from("listings")
    .update({ details: { ...chiTiet, tu_dang_lai: Boolean(b.bat) } })
    .eq("id", tin.id);
  if (error) return loi(error.message, 500);
  return NextResponse.json({ ok: true, bat: Boolean(b.bat) });
}

function loi(message: string, status = 400) {
  return NextResponse.json({ ok: false, loi: message }, { status });
}
