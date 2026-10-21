// NẠP THƯ VIỆN SUPABASE KHI CẦN (tốc độ điện thoại, đo 21/10/2026): thư viện ~58 KB nén. Nhập thẳng createClient ở các thành
// phần có trên mọi trang (thanh trên, chân trang, đếm hiển thị) là bắt mọi khách tải nó ngay lúc mở trang, giành đường truyền
// với ảnh đầu trang. Các thành phần đó gọi hàm này — thư viện chỉ tải lúc thật sự dùng.
export async function napSupabase() {
  const { createClient } = await import("./client");
  return createClient();
}

/** Máy này đang có phiên đăng nhập (cookie "sb-…-auth-token" của @supabase/ssr). Không có = chưa đăng nhập, khỏi tải thư viện. */
export function coPhienDangNhap(): boolean {
  return typeof document !== "undefined" && /(^|;\s*)sb-[^=]*-auth-token/.test(document.cookie);
}
