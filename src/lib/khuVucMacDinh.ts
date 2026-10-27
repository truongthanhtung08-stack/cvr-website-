// Ô khu vực trang chủ — kiểu + dữ liệu MẶC ĐỊNH (trước khi đọc admin). Tách khỏi siteContent (27/10/2026): LocationGrid
// chạy ở trình duyệt, nhập từ siteContent thì kéo theo billing, quyDinhGia… vào mã tải trang chủ. siteContent xuất lại y như cũ.
export type AreaCard = {
  name: string;
  count: string;      // dòng nhỏ dưới tên, vd "1.240 tin"
  image: string;      // ảnh CHÍNH (RAW), vd "/images/tin/1.jpg"
  images?: string[];  // ảnh chạy slide THÊM sau ảnh chính (không có → ô đứng yên)
  href: string;       // bấm ô → tới đâu
};

// Danh sách ảnh của một ô khu vực: ảnh chính đứng đầu, bỏ trùng và ô rỗng.
export function areaImages(a: AreaCard): string[] {
  return Array.from(new Set([a.image, ...(a.images ?? [])].filter(Boolean)));
}

export const HOME_AREAS_DEFAULT: AreaCard[] = [
  { name: "Đà Nẵng", count: "1.240 tin", image: "/images/tin/1.jpg", images: ["/images/tin/2.jpg", "/images/tin/3.jpg"], href: "/mua-ban?tinh=Đà Nẵng" },
  { name: "Huế", count: "586 tin", image: "/images/tin/13.jpg", images: ["/images/tin/14.jpg", "/images/tin/15.jpg"], href: "/mua-ban?tinh=Huế" },
  // Ô khu vực = ĐỊA DANH ĐIỂN HÌNH ai cũng biết (thành phố / tỉnh), không nhất
  // thiết là đơn vị hành chính. Dùng được ?tinh=<Địa danh> vì bộ lọc dò CHUỖI CON
  // trong địa chỉ tin: "Quy Nhơn" khớp cả "Phường Quy Nhơn Đông, Gia Lai" (hệ mới)
  // lẫn "TP. Quy Nhơn, Bình Định" (hệ cũ).
  // Địa danh TRÙNG TÊN giữa các tỉnh (VD: Hội An ở Đà Nẵng và Xã Hội An ở An Giang)
  // → CỐ Ý RA CẢ HAI (chủ dự án chốt 17/8): đúng tên địa danh là đủ, khách tự chọn.
  // Chỉ khi nào muốn bó vào ĐÚNG MỘT tỉnh mới ghim thêm: ?kv=Đà Nẵng//Hội An
  { name: "Quy Nhơn", count: "198 tin", image: "/images/tin/5.jpg", images: ["/images/tin/6.jpg", "/images/tin/7.jpg"], href: "/mua-ban?tinh=Quy Nhơn" },
  { name: "Nha Trang", count: "324 tin", image: "/images/tin/9.jpg", images: ["/images/tin/10.jpg", "/images/tin/11.jpg"], href: "/mua-ban?tinh=Nha Trang" },
  { name: "Quảng Ngãi", count: "256 tin", image: "/images/tin/20.jpg", images: ["/images/tin/21.jpg", "/images/tin/22.jpg"], href: "/mua-ban?tinh=Quảng Ngãi" },
];
