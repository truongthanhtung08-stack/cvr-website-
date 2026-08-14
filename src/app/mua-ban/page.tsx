import { Suspense } from "react";
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ListingBrowser from "@/components/ListingBrowser";
import { getListings } from "@/lib/listingsDb";
import { getArticles } from "@/lib/contentDb";

export const metadata: Metadata = {
  alternates: { canonical: "/mua-ban" },
  title: "Nhà đất bán tại Đà Nẵng, Huế & Miền Trung",
  description: "Mua bán nhà đất, căn hộ, đất nền, villa, condotel tại Miền Trung — lọc theo Tỉnh/Quận/Huyện/Phường/Xã, loại hình và mức giá.",
};

export default async function MuaBanPage() {
  // B2: tin từ Supabase (fallback dữ liệu mẫu) + bài viết cho cột phải
  const [listings, articles] = await Promise.all([getListings(), getArticles()]);
  return (
    <>
      <Header />
      <main className="flex-1 bg-white">
        {/* Khung chờ: CHỈ cao bằng thanh lọc thật (không pt-32 như trước — đó chính là
            mảng trắng 128px nằm ngay dưới header lúc trang đang tải). */}
        <Suspense fallback={<div className="mx-auto h-[104px] max-w-7xl px-4 sm:px-6 lg:px-8" />}>
          <ListingBrowser purpose="ban" heading="Nhà đất bán" items={listings} articles={articles} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}

