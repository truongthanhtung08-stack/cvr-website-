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

// ── BẢN ẢNH NHỎ — dùng cho THẺ, không dùng cho phần xem lớn ─────────────────
//
// VÌ SAO (đo thật 12/09/2026): trang chủ bắt khách tải **65 MB ảnh** một lượt
// xem (106 ảnh — mỗi thẻ tin tự chạy tới 6 tấm). Gói Supabase miễn phí cho 5 GB
// băng thông/tháng → chịu được đúng ~78 lượt, và tổ chức ĐÃ bị gắn cờ vượt hạn
// mức, doạ khoá dự án từ 08/10/2026.
//
// Cái vô lý: thẻ tin rộng chừng 400px mà đang tải ảnh 2000px. Nên có thêm một
// bản hẹp hơn nằm ở `nho/` ngay cạnh ảnh gốc; THẺ dùng bản này, còn thư viện
// ảnh và phần xem toàn màn hình vẫn dùng ẢNH GỐC nguyên độ nét.
//
// KHÔNG SỢ THIẾU: đường /anh/… nếu không thấy bản nhỏ thì tự trả ảnh gốc
// (xem src/app/anh/[...duong]/route.ts). Nên tin mới đăng chưa kịp tạo bản nhỏ
// vẫn hiện bình thường, không bao giờ vỡ ảnh.
//
// Ảnh của sàn khác (batdongsan…) không đi qua /anh/ nên hàm này bỏ qua, giữ nguyên.
export const anhNho = (duong: string) => {
  const m = /^(.*\/anh\/)([^/]+)\/(.+)$/.exec(duong || "");
  if (!m || m[3].startsWith("nho/")) return duong;
  return `${m[1]}${m[2]}/nho/${m[3]}`;
};
