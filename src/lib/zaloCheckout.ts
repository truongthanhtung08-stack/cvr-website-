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

// MAC cho createOrder: xếp khoá theo thứ tự từ điển, object → JSON.stringify, nối "k=v&…".
export function macTaoDon(khoa: string, thamSo: Record<string, unknown>): string {
  const du = Object.keys(thamSo)
    .sort()
    .map((k) => `${k}=${typeof thamSo[k] === "object" ? JSON.stringify(thamSo[k]) : thamSo[k]}`)
    .join("&");
  return hmac(khoa, du);
}

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
