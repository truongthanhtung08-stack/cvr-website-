// NẠP THƯ VIỆN SUPABASE KHI CẦN (tốc độ điện thoại, đo 21/10/2026): thư viện ~58 KB nén. Nhập thẳng createClient ở các thành
// phần có trên mọi trang (thanh trên, chân trang, đếm hiển thị) là bắt mọi khách tải nó ngay lúc mở trang, giành đường truyền
// với ảnh đầu trang. Các thành phần đó gọi hàm này — thư viện chỉ tải lúc thật sự dùng.
export async function napSupabase() {
  const { createClient } = await import("./client");
  return createClient();
}

/** Máy này đang có phiên đăng nhập (cookie "sb-…-auth-token" của @supabase/ssr). Không có = chưa đăng nhập, khỏi tải thư viện. */
export function coPhienDangNhap(): boolean {
  return typeof document !== "undefined" && /(^|;\s*)sb-[^=]*-auth-token(\.\d+)?=/.test(document.cookie); // không tính cookie "…-auth-token-code-verifier" (đăng nhập dở)
}

// GỌI THẲNG API SUPABASE KHÔNG CẦN THƯ VIỆN (tốc độ điện thoại, Lighthouse 22/10/2026): chân trang, đếm lượt xem, đếm hiển thị
// chạy ở MỌI lượt xem — dùng thư viện là bắt khách tải ~58 KB ngay sau khi trang hiện. Khách chưa đăng nhập gọi bằng khoá công
// khai (anon) — đúng quyền thư viện vẫn dùng khi chưa đăng nhập; đã đăng nhập thì nơi gọi dùng napSupabase() như cũ.
const URL_SB = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KHOA_SB = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Khoá mới dạng sb_publishable_… chỉ gửi ở "apikey" (không phải JWT — gửi kèm Authorization sẽ bị từ chối)
const dauSb = () => ({ apikey: KHOA_SB ?? "" });

/** Đọc bảng qua REST, vd docRest("site_content?select=data&key=eq.footer"). Lỗi → null. */
export async function docRest<T>(duongDan: string, options?: { cache?: RequestCache }): Promise<T | null> {
  if (!URL_SB || !KHOA_SB) return null;
  const r = await fetch(`${URL_SB}/rest/v1/${duongDan}`, { headers: dauSb(), cache: options?.cache });
  return r.ok ? ((await r.json()) as T) : null;
}

/** Gọi hàm RPC bằng khoá công khai. Trả true nếu thành công. */
export async function rpcRest(ten: string, thamSo: Record<string, unknown>): Promise<boolean> {
  if (!URL_SB || !KHOA_SB) return false;
  const r = await fetch(`${URL_SB}/rest/v1/rpc/${ten}`, {
    method: "POST",
    headers: { ...dauSb(), "Content-Type": "application/json" },
    body: JSON.stringify(thamSo),
    keepalive: true,
  });
  return r.ok;
}
