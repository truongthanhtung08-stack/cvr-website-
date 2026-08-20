import { Suspense } from "react";
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ListingListJsonLd } from "@/components/ListJsonLd";
import ListingBrowser from "@/components/ListingBrowser";
import { getListings } from "@/lib/listingsDb";
import { getArticles } from "@/lib/contentDb";

export const metadata: Metadata = {
  alternates: { canonical: "/cho-thue" },
  title: "Nhà đất cho thuê tại Đà Nẵng, Huế & Miền Trung",
  description: "Cho thuê căn hộ, nhà phố, văn phòng, kho xưởng tại Miền Trung — lọc theo Tỉnh/Thành phố, Phường/Xã, loại hình và mức giá.",
};

export default async function ChoThuePage() {
  // B2: tin từ Supabase (fallback dữ liệu mẫu) + bài viết cho cột phải
  const [listings, articles] = await Promise.all([getListings(), getArticles()]);
  return (
    <>
      <ListingListJsonLd items={listings.filter((l) => (l.purpose ?? "ban") === "thue")} heading="Nhà đất cho thuê tại Đà Nẵng, Huế & Miền Trung" path="/cho-thue" />
      <Header />
      <main className="flex-1 bg-white">
        {/* Khung chờ: CHỈ cao bằng thanh lọc thật (không pt-32 như trước — đó chính là
            mảng trắng 128px nằm ngay dưới header lúc trang đang tải). */}
        <Suspense fallback={<div className="mx-auto h-[104px] max-w-7xl px-4 sm:px-6 lg:px-8" />}>
          <ListingBrowser purpose="thue" heading="Nhà đất cho thuê" items={listings} articles={articles} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}

