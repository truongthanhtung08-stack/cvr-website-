// HỒ SƠ ỨNG DỤNG (PWA manifest) — trả về theo trình duyệt đang hỏi.
//
// ⛔ VÌ SAO KHÔNG ĐỂ TỆP TĨNH NỮA (12/09/2026):
// Cài web ra màn hình chính bằng Samsung Internet thì Android dựng một VỎ APP
// riêng. Trang chạy trong vỏ đó bị NUỐT MẤT khai báo loại tệp của ô chọn ảnh:
// bấm "Thư viện ảnh" hay "Thư mục" đều ra cùng một bảng Máy ảnh · Máy quay ·
// Files, không có Bộ sưu tập. Dấu hiệu nhận ra: bảng có cả MÁY QUAY PHIM — thứ
// chỉ được mời khi lời gọi là "tệp bất kỳ". Cùng trang đó mở trong tab trình
// duyệt thì ra lưới ảnh bình thường.
//
// Up ảnh là việc CHÍNH của trang đăng tin, nên với Samsung Internet ta bỏ kiểu
// vỏ app: biểu tượng ngoài màn hình chính mở thẳng bằng tab trình duyệt.
// iPhone và Chrome giữ nguyên kiểu app vì đang chạy đúng.
const HO_SO = {
  name: "COASTAL LAND — Bất động sản Duyên hải Miền Trung",
  short_name: "COASTAL LAND",
  description:
    "Sàn giao dịch bất động sản Đà Nẵng, Huế và Duyên hải Miền Trung. Tìm nhà đất, căn hộ, đất nền, villa biển.",
  lang: "vi",
  dir: "ltr",
  start_url: "/",
  scope: "/",
  display: "standalone",
  orientation: "portrait",
  background_color: "#ffffff",
  theme_color: "#161617",
  categories: ["business", "lifestyle", "shopping"],
  icons: [
    { src: "/icons/icon-192.png?v=2", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "/icons/icon-512.png?v=2", sizes: "512x512", type: "image/png", purpose: "any" },
    { src: "/icons/maskable-512.png?v=2", sizes: "512x512", type: "image/png", purpose: "maskable" },
  ],
  shortcuts: [
    { name: "Mua bán", short_name: "Mua bán", url: "/mua-ban", icons: [{ src: "/icons/icon-192.png?v=2", sizes: "192x192" }] },
    { name: "Cho thuê", short_name: "Cho thuê", url: "/cho-thue", icons: [{ src: "/icons/icon-192.png?v=2", sizes: "192x192" }] },
    { name: "Tin đã lưu", short_name: "Đã lưu", url: "/tin-luu", icons: [{ src: "/icons/icon-192.png?v=2", sizes: "192x192" }] },
    { name: "Đăng tin", short_name: "Đăng tin", url: "/dang-tin", icons: [{ src: "/icons/icon-192.png?v=2", sizes: "192x192" }] },
  ],
};

export async function GET(req: Request) {
  const ua = req.headers.get("user-agent") || "";
  const hoSo = /SamsungBrowser/i.test(ua) ? { ...HO_SO, display: "browser" } : HO_SO;
  return new Response(JSON.stringify(hoSo, null, 2), {
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
