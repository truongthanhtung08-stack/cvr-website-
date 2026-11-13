import type { Metadata, ResolvingMetadata } from "next";

// ẢNH ĐẠI DIỆN KHI DÁN LIÊN KẾT /dang-tin lên Facebook, Zalo (anh chọn 14/11/2026, phiên Thiết kế làm; bản chữ to anh bỏ): ảnh
// "Đăng tin mua bán, cho thuê nhà đất" + nút Đăng tin. Chỉ trang này đổi ảnh. 5 mẫu, mỗi mẫu một liên kết:
// /dang-tin = mẫu 1 · /dang-tin?mau=2..5 = mẫu 2..5 (next.config rewrite sang trang dựng sẵn dang-tin/mau/[n] — không chạy
// máy chủ mỗi lượt xem; ?mau lạ ở lại mẫu 1). og:url mang ?mau=N để Facebook coi là liên kết riêng; canonical luôn /dang-tin.
// KHÔNG mô tả (anh chốt 14/11/2026: dưới ảnh chỉ 1 câu tiêu đề): bỏ meta description + og/twitter description, kể cả bản mặc định
// của layout. Trang đăng tin là biểu mẫu, không phải trang đích từ khoá — Google tự lấy đoạn chữ trên trang.

export async function metaDangTin(parent: ResolvingMetadata, mau = 1): Promise<Metadata> {
  const p = await parent;
  const anh = {
    url: mau === 1 ? "/images/anh-dai-dien-dang-tin.jpg" : `/images/anh-dai-dien-dang-tin-${mau}.jpg`,
    width: 1200,
    height: 630,
    alt: "Đăng tin mua bán, cho thuê nhà đất — COASTAL LAND",
  };
  return {
    alternates: { canonical: "/dang-tin" },
    title: "Đăng tin bất động sản",
    description: null,
    openGraph: { ...p.openGraph, url: mau === 1 ? "/dang-tin" : `/dang-tin?mau=${mau}`, description: undefined, images: [anh] },
    twitter: { ...p.twitter, description: undefined, images: [anh.url] },
  };
}
