import { Suspense } from "react";
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ListingBrowser from "@/components/ListingBrowser";

export const metadata: Metadata = {
  title: "Nhà đất bán tại Đà Nẵng, Huế & Miền Trung | Coastal Land",
  description: "Mua bán nhà đất, căn hộ, đất nền, villa, condotel tại Miền Trung — lọc theo Tỉnh/Quận/Huyện/Phường/Xã, loại hình và mức giá.",
};

export default function MuaBanPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Suspense fallback={<div className="pt-32 text-center text-white/50">Đang tải…</div>}>
          <ListingBrowser heading="Nhà đất bán" subheading="Mua bán bất động sản tại Đà Nẵng, Huế và Miền Trung — minh bạch, trực tiếp, kiểm chứng thực địa." />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}

