import { Suspense } from "react";
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ListingListJsonLd } from "@/components/ListJsonLd";
import ListingBrowser from "@/components/ListingBrowser";
import KhungChoDanhMuc from "@/components/KhungChoDanhMuc";
import KhuVucLinks from "@/components/KhuVucLinks";
import { getListings } from "@/lib/listingsDb";
import { getArticles } from "@/lib/contentDb";

// Đếm tin theo tỉnh — cho khối "Cho thuê theo khu vực" ở cuối trang.
const tinhCua = (location: string) => location.split(",").pop()?.trim() ?? "";
function demTheoTinh(items: { location: string }[]): [string, number][] {
  const m = new Map<string, number>();
  for (const l of items) {
    const t = tinhCua(l.location);
    if (t) m.set(t, (m.get(t) ?? 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

export const metadata: Metadata = {
  alternates: { canonical: "/cho-thue" },
  title: "Nhà đất cho thuê tại Đà Nẵng, Huế & Miền Trung",
  description: "Cho thuê căn hộ, nhà phố, văn phòng, kho xưởng tại Miền Trung — lọc theo Tỉnh/Thành phố, Phường/Xã, loại hình và mức giá.",
};

export default async function ChoThuePage() {
  // B2: tin từ Supabase (fallback dữ liệu mẫu) + bài viết cho cột phải
  const [listings, articles] = await Promise.all([getListings(), getArticles()]);
  const tinThue = listings.filter((l) => (l.purpose ?? "ban") === "thue");
  return (
    <>
      <ListingListJsonLd items={tinThue} heading="Nhà đất cho thuê tại Đà Nẵng, Huế & Miền Trung" path="/cho-thue" />
      <Header />
      <main className="flex-1 bg-white">
        {/* Khung chờ: CHỈ cao bằng thanh lọc thật (không pt-32 như trước — đó chính là
            mảng trắng 128px nằm ngay dưới header lúc trang đang tải). */}
        <Suspense
          fallback={
            <KhungChoDanhMuc
              heading="Nhà đất cho thuê tại Đà Nẵng, Huế & Miền Trung"
              moTa="Tin cho thuê căn hộ, nhà nguyên căn, phòng trọ, văn phòng, mặt bằng kinh doanh và kho xưởng tại Đà Nẵng, Huế và các tỉnh Duyên hải Miền Trung. Lọc theo tỉnh, phường/xã, loại hình, khoảng giá và diện tích."
              items={tinThue}
            />
          }
        >
          <ListingBrowser purpose="thue" heading="Nhà đất cho thuê" items={listings} articles={articles} />
        </Suspense>
        {/* Đường bò tới trang khu vực cho thuê — cùng lý do như ở /mua-ban:
            trang /cho-thue/<tỉnh> chưa có liên kết nội bộ nào trỏ tới. */}
        <KhuVucLinks base="/cho-thue" demTheoTinh={demTheoTinh(tinThue)} />
      </main>
      <Footer />
    </>
  );
}

