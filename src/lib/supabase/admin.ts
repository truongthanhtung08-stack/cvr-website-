import { createClient as createSupabase } from "@supabase/supabase-js";

// ============================================================================
// SUPABASE QUYỀN QUẢN TRỊ (service role) — CHỈ dùng ở phía MÁY CHỦ.
// ----------------------------------------------------------------------------
// Dùng cho những việc không có phiên đăng nhập của khách nhưng vẫn phải ghi dữ
// liệu, ví dụ: cổng thanh toán PayOS gọi ngược về web báo "đã nhận tiền" —
// lúc đó không có cookie của ai cả, mà vẫn phải cộng tiền vào ví đúng người.
//
// ⚠ KHOÁ NÀY BỎ QUA MỌI PHÂN QUYỀN (RLS). Tuyệt đối KHÔNG import vào component
// chạy trên trình duyệt. Chỉ dùng trong route handler / server action.
// Khoá đặt ở Vercel → Settings → Environment Variables: SUPABASE_SERVICE_ROLE_KEY
// ============================================================================
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null; // chưa cắm khoá → nơi gọi tự báo lỗi rõ ràng
  return createSupabase(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
