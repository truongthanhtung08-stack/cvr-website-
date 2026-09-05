// Thêm tiền tố đường dẫn cho ảnh tĩnh (cần cho GitHub Pages có basePath).
// Khi build cho Pages: NEXT_PUBLIC_BASE_PATH = "/cvr-website-".
// Local/Vercel/Cloudflare: rỗng -> không đổi gì.
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// Ảnh trong kho Supabase → ĐỔI SANG ĐỊA CHỈ CỦA CHÍNH MÌNH (/anh/...).
// Lý do ở đầu file src/app/anh/[...duong]/route.ts: cho khách tải thẳng từ
// supabase.co thì máy nào bị nhà mạng/wifi chặn tên miền đó là ảnh trắng, mà đi
// qua bộ tối ưu của Vercel thì hết hạn mức gói free cũng trắng nốt.
const KHO_SUPABASE = /^https?:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\//i;

// Ảnh tải lên Supabase Storage là URL tuyệt đối (http/https) hoặc data: — giữ nguyên,
// KHÔNG thêm basePath (chỉ ảnh tĩnh nội bộ /images/... mới cần tiền tố).
export const asset = (path: string) => {
  if (KHO_SUPABASE.test(path)) return `${BASE}/anh/${path.replace(KHO_SUPABASE, "")}`;
  return /^(https?:|data:|\/\/)/.test(path) ? path : `${BASE}${path}`;
};
