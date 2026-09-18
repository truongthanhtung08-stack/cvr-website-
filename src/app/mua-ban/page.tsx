import { Suspense } from "react";
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ListingListJsonLd } from "@/components/ListJsonLd";
import ListingBrowser from "@/components/ListingBrowser";
import KhungChoDanhMuc from "@/components/KhungChoDanhMuc";
import { getListings } from "@/lib/listingsDb";
import { getArticles } from "@/lib/contentDb";

export const metadata: Metadata = {
  alternates: { canonical: "/mua-ban" },
  title: "Nhà đất bán tại Đà Nẵng, Huế & Miền Trung",
  description: "Mua bán nhà đất, căn hộ, đất nền, villa, condotel tại Miền Trung — lọc theo Tỉnh/Thành phố, Phường/Xã, loại hình và mức giá.",
};

export default async function MuaBanPage() {
  // B2: tin từ Supabase (fallback dữ liệu mẫu) + bài viết cho cột phải
  const [listings, articles] = await Promise.all([getListings(), getArticles()]);
  return (
    <>
      <ListingListJsonLd items={listings.filter((l) => (l.purpose ?? "ban") === "ban")} heading="Nhà đất bán tại Đà Nẵng, Huế & Miền Trung" path="/mua-ban" />
      <Header />
      <main className="flex-1 bg-white">
        {/* Khung chờ: CHỈ cao bằng thanh lọc thật (không pt-32 như trước — đó chính là
            mảng trắng 128px nằm ngay dưới header lúc trang đang tải).
            Khung chờ này kiêm luôn phần nội dung MÁY CHỦ dựng sẵn cho Google đọc —
            xem lý do đầy đủ trong KhungChoDanhMuc.tsx. */}
        <Suspense
          fallback={
            <KhungChoDanhMuc
              heading="Nhà đất bán tại Đà Nẵng, Huế & Miền Trung"
              moTa="Tin bán nhà riêng, căn hộ chung cư, đất nền, nhà mặt phố và biệt thự tại Đà Nẵng, Huế và các tỉnh Duyên hải Miền Trung. Lọc theo tỉnh, phường/xã, dự án, loại hình, khoảng giá và diện tích."
              items={listings.filter((l) => (l.purpose ?? "ban") === "ban")}
            />
          }
        >
          <ListingBrowser purpose="ban" heading="Nhà đất bán" items={listings} articles={articles} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}

