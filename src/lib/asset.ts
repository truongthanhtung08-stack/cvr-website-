// Thêm tiền tố đường dẫn cho ảnh tĩnh (cần cho GitHub Pages có basePath).
// Khi build cho Pages: NEXT_PUBLIC_BASE_PATH = "/cvr-website-".
// Local/Vercel/Cloudflare: rỗng -> không đổi gì.
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const asset = (path: string) => `${BASE}${path}`;
