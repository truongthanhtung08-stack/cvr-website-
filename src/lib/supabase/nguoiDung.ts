import type { SupabaseClient, User } from "@supabase/supabase-js";

// NGƯỜI ĐANG ĐĂNG NHẬP — ĐỌC PHIÊN CÓ SẴN, KHÔNG HỎI MẠNG (cách chuẩn Supabase SSR, 27/10/2026).
// Máy chủ đã kiểm + làm mới phiên ở middleware (auth.getUser() mỗi lượt mở trang của người có phiên, chặn /tai-khoan, /admin).
// Ở trình duyệt, auth.getUser() hỏi lại máy chủ Supabase mỗi lần VÀ giữ khoá của thư viện suốt lúc chờ → trang có 5 chỗ gọi là
// 5 vòng mạng nối đuôi trước khi dữ liệu hiện (khu Tài khoản chậm vì vậy). getSession() đọc phiên trong máy, token hết hạn thì
// thư viện tự làm mới. Quyền thật vẫn do máy chủ (RLS / RPC theo token) kiểm ở từng lệnh đọc/ghi.
export async function nguoiDungHienTai(sb: Pick<SupabaseClient, "auth">): Promise<User | null> {
  const { data: { session } } = await sb.auth.getSession();
  return session?.user ?? null;
}
