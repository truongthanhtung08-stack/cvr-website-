import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// TRẠNG THÁI ĐƠN NẠP — trang mã QR trên coastalland.vn hỏi 3 giây/lần trong lúc khách đang quét (chỉ khi mở mã QR,
// tối đa 15 phút) → webhook PayOS ghi "paid" là trang tự chuyển. Chỉ trả đơn của chính người đang đăng nhập.
// Chi phí: 1 lệnh đọc Supabase mỗi lần, chỉ chạy khi có người đang mở mã QR — không đáng kể trong gói Vercel/Supabase.
export async function GET(req: Request) {
  const ma = new URL(req.url).searchParams.get("ma");
  if (!ma || !/^\d+$/.test(ma)) return NextResponse.json({ ok: false }, { status: 400 });
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  const admin = createAdminClient();
  if (!user || !admin) return NextResponse.json({ ok: false }, { status: 401 });
  const { data } = await admin.from("payments").select("status").eq("order_code", ma).eq("user_id", user.id).maybeSingle();
  return NextResponse.json({ ok: true, status: (data?.status as string | undefined) ?? "pending" });
}
