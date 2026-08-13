import { Suspense } from "react";
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ListingBrowser from "@/components/ListingBrowser";
import { getListings } from "@/lib/listingsDb";
import { getArticles } from "@/lib/contentDb";

export const metadata: Metadata = {
  title: "Nhà đất bán tại Đà Nẵng, Huế & Miền Trung | Coastal Land",
  description: "Mua bán nhà đất, căn hộ, đất nền, villa, condotel tại Miền Trung — lọc theo Tỉnh/Quận/Huyện/Phường/Xã, loại hình và mức giá.",
};

export default async function MuaBanPage() {
  // B2: tin từ Supabase (fallback dữ liệu mẫu) + bài viết cho cột phải
  const [listings, articles] = await Promise.all([getListings(), getArticles()]);
  return (
    <>
      <Header />
      <main className="flex-1 bg-white">
        <Suspense fallback={<div className="pt-32 text-center text-cvr-muted">Đang tải…</div>}>
          <ListingBrowser purpose="ban" heading="Nhà đất bán" items={listings} articles={articles} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}

