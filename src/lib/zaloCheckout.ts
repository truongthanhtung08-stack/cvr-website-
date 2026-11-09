import { createHmac } from "crypto";

// ════════════════════════════════════════════════════════════════════════════
// ZALO MINI APP — CHECKOUT SDK (thanh toán bắt buộc qua Zalo trong Mini App)
// Tài liệu: docs.zaloplatforms.com/docs/MA/checkoutSdk (đọc 27/09/2026).
// Khoá: ZALO_CHECKOUT_KEY = "Private key" ở Mini App → Checkout SDK → Cấu hình chung.
// Chưa cắm khoá thì mọi đường thanh toán Zalo trả "chưa cấu hình" — không ảnh hưởng PayOS.
// ════════════════════════════════════════════════════════════════════════════

export const khoaCheckout = () => process.env.ZALO_CHECKOUT_KEY || "";
export const MINI_APP_ID = process.env.ZALO_MINI_APP_ID || "1268705237708475790";

export const hmac = (khoa: string, du: string) => createHmac("sha256", khoa).update(du).digest("hex");

// MAC của callback (ví điện tử): đúng THỨ TỰ tài liệu quy định, không xếp lại.
export type DuLieuCallback = {
  appId: string;
  orderId: string;
  transId: string;
  method?: string;
  amount: number;
  description: string;
  resultCode: number;
  message: string;
  extradata?: string;
};
export const macCallback = (khoa: string, d: DuLieuCallback) =>
  hmac(khoa, `appId=${d.appId}&amount=${d.amount}&description=${d.description}&orderId=${d.orderId}&message=${d.message}&resultCode=${d.resultCode}&transId=${d.transId}`);

// MAC của notify (khách chọn chuyển khoản ngân hàng / COD).
export const macNotify = (khoa: string, d: { appId: string; orderId: string; method: string }) =>
  hmac(khoa, `appId=${d.appId}&orderId=${d.orderId}&method=${d.method}`);

// ── CHUYỂN KHOẢN NGÂN HÀNG (Tích hợp tuỳ chỉnh, Beta — docs …/checkoutSdk/integration-process/custom/bank-transfer, đọc 09/11/2026) ──
// Mini App mở Checkout Popup với mã VietQR của PayOS → Zalo trả orderId. Tiền vào ví theo webhook PayOS như web; sau đó máy chủ
// BÁO trạng thái đơn cho Zalo (1 thành công · 0 đã hoàn tiền · -1 thất bại) — Zalo bắt buộc ghi nhận mọi giao dịch trong Mini App.
// orderId Zalo nằm trong ghi chú đơn payments: "… · zaloOrderId=<id>".
export const ghiChuZalo = (orderId: string) => ` · zaloOrderId=${orderId}`;
export const docOrderIdZalo = (note?: string | null) => note?.match(/zaloOrderId=(\S+)/)?.[1] ?? "";

export async function baoTrangThaiDonZalo(orderId: string, resultCode: 1 | 0 | -1): Promise<boolean> {
  const khoa = khoaCheckout();
  if (!khoa || !orderId) return false;
  const mac = hmac(khoa, `appId=${MINI_APP_ID}&orderId=${orderId}&resultCode=${resultCode}&privateKey=${khoa}`);
  try {
    const r = await fetch(`https://payment-mini.zalo.me/api/transaction/${MINI_APP_ID}/purchase-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appId: MINI_APP_ID, orderId, resultCode, mac }),
    });
    return r.ok;
  } catch {
    return false;
  }
}
