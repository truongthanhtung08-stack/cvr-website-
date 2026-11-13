import type { Metadata, ResolvingMetadata } from "next";

// ẢNH ĐẠI DIỆN KHI DÁN LIÊN KẾT /dang-tin lên Facebook, Zalo (anh chọn 14/11/2026, phiên Thiết kế làm): ảnh chữ to
// "Đăng tin mua bán, cho thuê nhà đất" + nút Đăng tin. Chỉ trang này đổi ảnh. 5 mẫu, mỗi mẫu một liên kết:
// /dang-tin = mẫu 1 · /dang-tin?mau=2..5 = mẫu 2..5 (next.config rewrite sang trang dựng sẵn dang-tin/mau/[n] — không chạy
// máy chủ mỗi lượt xem; ?mau lạ ở lại mẫu 1). og:url mang ?mau=N để Facebook coi là liên kết riêng; canonical luôn /dang-tin.
// Mô tả anh duyệt nguyên văn 14/11/2026 (Zalo hiện câu cũ dài dòng) — dùng chung cho Google, Facebook, Zalo.
const MO_TA = "Cổng đăng tin mua bán, cho thuê nhà đất";

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
    description: MO_TA,
    openGraph: { ...p.openGraph, url: mau === 1 ? "/dang-tin" : `/dang-tin?mau=${mau}`, description: MO_TA, images: [anh] },
    twitter: { ...p.twitter, description: MO_TA, images: [anh.url] },
  };
}
