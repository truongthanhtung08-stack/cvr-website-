// ════════════════════════════════════════════════════════════════════════════
// ĐĂNG NHẬP BẰNG ZALO — phần dùng chung
//
// Supabase KHÔNG hỗ trợ sẵn Zalo (chỉ có Google, Facebook…), nên phải tự nối:
//   1. /api/auth/zalo  → đẩy khách sang trang cho phép của Zalo (OAuth v4 + PKCE)
//   2. /auth/zalo/callback → đổi mã lấy thông tin khách, rồi tạo phiên Supabase
//
// Cần 3 biến môi trường (khai trong Vercel → Settings → Environment Variables):
//   ZALO_APP_ID               — ID ứng dụng (114204740698790237)
//   ZALO_APP_SECRET           — Khoá bí mật của ứng dụng (TUYỆT ĐỐI không đưa ra web)
//   SUPABASE_SERVICE_ROLE_KEY — khoá quản trị Supabase, để tạo tài khoản cho khách Zalo
//
// Thiếu biến nào thì nút Zalo tự báo "chưa cấu hình", KHÔNG làm hỏng Google/email.
// ════════════════════════════════════════════════════════════════════════════

export const ZALO_PERMISSION_URL = "https://oauth.zaloapp.com/v4/permission";
export const ZALO_TOKEN_URL = "https://oauth.zaloapp.com/v4/access_token";
export const ZALO_ME_URL = "https://graph.zalo.me/v2.0/me";

// Tên cookie tạm giữ giữa 2 bước (xoá ngay sau khi dùng)
export const COOKIE_VERIFIER = "zalo_cv";
export const COOKIE_STATE = "zalo_state";
export const COOKIE_NEXT = "zalo_next";

export function zaloConfig() {
  const appId = process.env.ZALO_APP_ID;
  const secret = process.env.ZALO_APP_SECRET;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const thieu = [
    !appId && "ZALO_APP_ID",
    !secret && "ZALO_APP_SECRET",
    !serviceKey && "SUPABASE_SERVICE_ROLE_KEY",
  ].filter(Boolean) as string[];
  return { appId, secret, serviceKey, thieu, daCauHinh: thieu.length === 0 };
}

// PKCE: tạo code_verifier ngẫu nhiên + code_challenge = base64url(SHA-256(verifier))
export function taoVerifier(): string {
  const b = new Uint8Array(32);
  crypto.getRandomValues(b);
  return base64url(b);
}

export async function taoChallenge(verifier: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return base64url(new Uint8Array(hash));
}

function base64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Email nội bộ đặt cho khách đăng nhập bằng Zalo. Zalo KHÔNG trả email thật, mà
// Supabase bắt buộc mỗi tài khoản có một email duy nhất → sinh email kỹ thuật theo
// ID Zalo. Khách không bao giờ thấy chuỗi này; muốn nhận thư thì tự bổ sung email
// thật trong phần Tài khoản.
export function emailKyThuat(zaloId: string): string {
  return `zalo_${zaloId}@users.coastalland.vn`;
}
