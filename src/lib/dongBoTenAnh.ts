import { createClient } from "@/lib/supabase/client";

// Đổi tên / ảnh tài khoản xong → tin của tài khoản đang hiện tên / ảnh cũ đổi theo (api/tai-khoan/dong-bo-ten-anh, 05/11/2026).
// Chạy ngầm, hỏng không chặn việc lưu.
export async function dongBoTenAnhTin(cu: { tenCu?: string | null; anhCu?: string | null }) {
  try {
    const token = (await createClient().auth.getSession()).data.session?.access_token;
    if (!token) return;
    await fetch("/api/tai-khoan/dong-bo-ten-anh", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token }, body: JSON.stringify(cu) });
  } catch { /* bỏ qua */ }
}
