import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { nguoiGoi, optionsMiniApp, postMiniApp } from "@/lib/goiTuMiniApp";
import { baoTrangThaiDonZalo, docOrderIdZalo, ghiChuZalo } from "@/lib/zaloCheckout";

// ============================================================================
// NẠP VÍ TRONG ZALO MINI APP — gắn orderId Zalo (Checkout Popup trả về) vào đơn PayOS, để webhook PayOS báo trạng thái đơn cho
// Zalo khi tiền về. Khách chuyển khoản nhanh hơn lượt gắn (đơn đã "paid") → báo Zalo ngay tại đây.
// ============================================================================
export const dynamic = "force-dynamic";

const tra = (ok: boolean, status = 200) => NextResponse.json({ ok }, { status });

export const OPTIONS = optionsMiniApp;
export const POST = postMiniApp(async (req) => {
  const admin = createAdminClient();
  const nguoi = await nguoiGoi(req);
  if (!admin || !nguoi) return tra(false, 401);

  const { maDon, orderId } = (await req.json().catch(() => ({}))) as { maDon?: string; orderId?: string };
  if (!maDon || !orderId || !/^[\w-]{1,64}$/.test(orderId)) return tra(false, 400);

  const { data: don } = await admin.from("payments").select("id,status,note").eq("order_code", maDon).eq("user_id", nguoi.id).maybeSingle();
  if (!don) return tra(false, 404);
  if (!docOrderIdZalo(don.note)) await admin.from("payments").update({ note: `${don.note ?? ""}${ghiChuZalo(orderId)}` }).eq("id", don.id);
  if (don.status === "paid") await baoTrangThaiDonZalo(orderId, 1);
  return tra(true);
});
