import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { khoaCheckout, macTaoDon } from "@/lib/zaloCheckout";

// ============================================================================
// NẠP VÍ TRONG ZALO MINI APP — BƯỚC 1: tạo đơn + ký MAC (khoá bí mật CHỈ nằm ở máy chủ)
// Mini App gửi { soTien } kèm "Authorization: Bearer <phiên đăng nhập>" → ghi đơn "pending"
// vào sổ payments (cùng sổ với PayOS) → trả tham số đã ký để Mini App gọi CheckoutSDK.createOrder.
// Tiền chỉ vào ví khi Zalo báo về /api/thanh-toan/zalo-checkout/callback (đã kiểm MAC).
// ============================================================================
export const dynamic = "force-dynamic";

const TOI_THIEU = 10_000;
const TOI_DA = 50_000_000;

function choPhep(req: Request): Record<string, string> {
  const nguon = req.headers.get("origin") ?? "";
  const hopLe = /^https:\/\/([a-z0-9-]+\.)*(zdn\.vn|zalo\.me|zaloapp\.com|zaloplatforms\.com)$/i.test(nguon) || /^http:\/\/(localhost|192\.168\.\d+\.\d+):\d+$/.test(nguon);
  return hopLe
    ? { "Access-Control-Allow-Origin": nguon, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization", Vary: "Origin" }
    : {};
}
export function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: choPhep(req) });
}
export async function POST(req: Request) {
  const res = await xuLy(req);
  for (const [k, v] of Object.entries(choPhep(req))) res.headers.set(k, v);
  return res;
}

const loi = (loi: string, status = 400) => NextResponse.json({ ok: false, loi }, { status });

async function xuLy(req: Request) {
  const khoa = khoaCheckout();
  const admin = createAdminClient();
  if (!khoa || !admin) return loi("Thanh toán trong Zalo chưa được bật.", 503);

  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const nguoi = token ? (await admin.auth.getUser(token)).data.user : null;
  if (!nguoi) return loi("Bạn cần đăng nhập để nạp tiền.", 401);

  const { soTien } = (await req.json().catch(() => ({}))) as { soTien?: number };
  const amount = Math.round(Number(soTien));
  if (!Number.isFinite(amount) || amount < TOI_THIEU || amount > TOI_DA) return loi("Số tiền nạp từ 10.000 đ đến 50.000.000 đ.");

  // Mã đơn riêng cho Zalo (ZC…) — không đụng dãy mã số của PayOS.
  const maDon = `ZC${Date.now()}${Math.floor(Math.random() * 90 + 10)}`;
  const { error } = await admin.from("payments").insert({
    user_id: nguoi.id,
    user_email: nguoi.email ?? null,
    order_code: maDon,
    amount,
    kind: "topup",
    status: "pending",
    note: "Nạp ví qua Zalo Mini App (Checkout SDK).",
  });
  if (error) return loi("Không tạo được đơn nạp tiền.", 500);

  const thamSo = {
    amount,
    desc: `Nạp ví Coastal Land ${amount.toLocaleString("vi-VN")} đ`,
    item: [{ id: "nap-vi", amount }],
    extradata: JSON.stringify({ maDon }),
  };
  return NextResponse.json({ ok: true, maDon, ...thamSo, mac: macTaoDon(khoa, thamSo) });
}
