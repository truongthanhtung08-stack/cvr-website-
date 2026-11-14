import type { Metadata, ResolvingMetadata } from "next";

// ẢNH ĐẠI DIỆN KHI DÁN LIÊN KẾT /dang-tin lên Facebook, Zalo (anh chọn 14/11/2026, phiên Thiết kế làm; bản chữ to anh bỏ): ảnh
// "Đăng tin mua bán, cho thuê nhà đất" + nút Đăng tin. Chỉ trang này đổi ảnh. 5 mẫu, mỗi mẫu một liên kết:
// /dang-tin = mẫu 1 · /dang-tin?mau=2..5 = mẫu 2..5 (next.config rewrite sang trang dựng sẵn dang-tin/mau/[n] — không chạy
// máy chủ mỗi lượt xem; ?mau lạ ở lại mẫu 1). og:url /dang-tin-N (link gửi khách) để Facebook coi là liên kết riêng; canonical luôn /dang-tin.
// Chữ dưới ảnh (anh chốt 14/11/2026): dòng 1 "COASTAL LAND" (og/twitter title) · dòng 2 slogan (meta + og/twitter description —
// Zalo đọc meta description, Facebook đọc og:description). <title> cho Google giữ "Đăng tin bất động sản".
const TEN = "COASTAL LAND";
const SLOGAN = "Cổng thông tin bất động sản trực tuyến";

// so: số ảnh của link sạch /dang-tin-1..5 (anh 14/11/2026, next.config rewrite → dang-tin/mau/[n]); bỏ trống = trang /dang-tin (ảnh 1).
export async function metaDangTin(parent: ResolvingMetadata, so?: number): Promise<Metadata> {
  const p = await parent;
  const mau = so ?? 1;
  const anh = {
    url: mau === 1 ? "/images/anh-dai-dien-dang-tin.jpg" : `/images/anh-dai-dien-dang-tin-${mau}.jpg`,
    width: 1200,
    height: 630,
    alt: "Đăng tin mua bán, cho thuê nhà đất — COASTAL LAND",
  };
  return {
    alternates: { canonical: "/dang-tin" },
    title: "Đăng tin bất động sản",
    description: SLOGAN,
    openGraph: { ...p.openGraph, url: so ? `/dang-tin-${so}` : "/dang-tin", title: TEN, description: SLOGAN, images: [anh] },
    twitter: { ...p.twitter, title: TEN, description: SLOGAN, images: [anh.url] },
  };
}
