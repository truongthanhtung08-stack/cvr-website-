// Thêm tiền tố đường dẫn cho ảnh tĩnh (cần cho GitHub Pages có basePath).
// Khi build cho Pages: NEXT_PUBLIC_BASE_PATH = "/cvr-website-".
// Local/Vercel/Cloudflare: rỗng -> không đổi gì.
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// Ảnh tải lên Supabase Storage là URL tuyệt đối (http/https) hoặc data: — giữ nguyên,
// KHÔNG thêm basePath (chỉ ảnh tĩnh nội bộ /images/... mới cần tiền tố).
export const asset = (path: string) =>
  /^(https?:|data:|\/\/)/.test(path) ? path : `${BASE}${path}`;
