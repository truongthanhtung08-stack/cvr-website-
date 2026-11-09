import crypto from "crypto";

// TẠO ĐƠN PayOS — một hàm cho web (/api/thanh-toan/tao-don) và Zalo Mini App (/api/thanh-toan/zalo-checkout/tao-don).
// Khoá: PAYOS_CLIENT_ID · PAYOS_API_KEY · PAYOS_CHECKSUM_KEY (Vercel → Environment Variables).
const PAYOS_ENDPOINT = "https://api-merchant.payos.vn/v2/payment-requests";

export const khoaPayos = () => {
  const clientId = process.env.PAYOS_CLIENT_ID, apiKey = process.env.PAYOS_API_KEY, checksumKey = process.env.PAYOS_CHECKSUM_KEY;
  return clientId && apiKey && checksumKey ? { clientId, apiKey, checksumKey } : null;
};

// Mã đơn: số nguyên tăng dần theo thời gian (yêu cầu của PayOS)
export const maDonPayos = () => Number(String(Date.now()).slice(-10));

export type DonPayos = {
  orderCode: number;
  amount: number;
  description: string; // PayOS giới hạn 25 ký tự
  returnUrl: string;
  cancelUrl: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
};

/** Gửi đơn sang PayOS. Trả data PayOS (checkoutUrl, qrCode VietQR…) hoặc thông báo lỗi. */
export async function taoDonPayos(
  khoa: NonNullable<ReturnType<typeof khoaPayos>>,
  don: DonPayos,
): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; message: string; detail?: unknown }> {
  // Chữ ký theo đúng thứ tự PayOS quy định
  const raw = `amount=${don.amount}&cancelUrl=${don.cancelUrl}&description=${don.description}&orderCode=${don.orderCode}&returnUrl=${don.returnUrl}`;
  const signature = crypto.createHmac("sha256", khoa.checksumKey).update(raw).digest("hex");
  try {
    const res = await fetch(PAYOS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-client-id": khoa.clientId, "x-api-key": khoa.apiKey },
      body: JSON.stringify({ ...don, signature }),
    });
    const json = await res.json();
    if (json?.code !== "00" || !json?.data?.checkoutUrl) return { ok: false, message: json?.desc || "Cổng thanh toán từ chối đơn hàng.", detail: json };
    return { ok: true, data: json.data };
  } catch {
    return { ok: false, message: "Không kết nối được cổng thanh toán." };
  }
}

type Admin = NonNullable<ReturnType<typeof import("@/lib/supabase/admin").createAdminClient>>;
/** Tài khoản có số điện thoại chưa — nạp tiền bắt buộc có số (chủ dự án 05/11/2026: chỉ hỏi khi tài khoản KHÔNG CÓ số). */
export async function taiKhoanCoSo(admin: Admin, userId: string): Promise<boolean> {
  const [{ data: hs }, { data: u }] = await Promise.all([
    admin.from("profiles").select("phone,role").eq("id", userId).maybeSingle(),
    admin.auth.admin.getUserById(userId),
  ]);
  return !!String(hs?.phone ?? "").trim() || hs?.role === "admin" || !!u?.user?.phone || !!(u?.user?.user_metadata as Record<string, unknown> | undefined)?.sdt_lien_he;
}
