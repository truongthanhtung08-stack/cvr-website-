import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import ProjectsBrowser from "@/components/ProjectsBrowser";
import { projectBanners } from "@/lib/banners";

export const metadata: Metadata = {
  title: "Dự án bất động sản Đà Nẵng, Huế & Miền Trung | Coastal Land",
  description: "Danh sách dự án căn hộ, khu đô thị, nghỉ dưỡng tại Miền Trung — tiến độ, giá bán và tiện ích đầy đủ.",
};

export default function DuAnPage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-white">
        {/* Banner dự án — khung GIỮ NGUYÊN; ảnh PHỦ KÍN khung (cover), KHÔNG hụt 2 bên. */}
        <Hero banners={projectBanners} heightClass="h-[320px] sm:h-[400px]" search={false} />

        <div className="mx-auto max-w-7xl px-4 pb-20 pt-3 sm:px-6 lg:px-8">
          {/* Thanh lọc kiểu Batdongsan + tiêu đề + danh sách (bộ đếm nhảy theo bộ lọc) */}
          <ProjectsBrowser />
        </div>
      </main>
      <Footer />
    </>
  );
}
