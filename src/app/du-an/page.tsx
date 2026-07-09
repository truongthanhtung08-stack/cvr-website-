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
        {/* Banner dự án — ôm TRỌN ảnh (fit=contain): ảnh chính hiện đủ, không cắt;
            nền 2 bên lấp bằng chính ảnh làm mờ. Tỷ lệ banner ngang hợp lý. */}
        <Hero banners={projectBanners} heightClass="h-[340px] sm:h-[440px]" search={false} fit="contain" />

        <div className="mx-auto max-w-7xl px-4 pb-20 pt-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1.5 text-xs text-cvr-muted">
            <Link href="/" className="hover:text-cvr-ink">Trang chủ</Link>
            <span>/</span>
            <span className="text-cvr-body">Dự án</span>
          </nav>

          {/* Thanh lọc kiểu Batdongsan + tiêu đề + danh sách (bộ đếm nhảy theo bộ lọc) */}
          <ProjectsBrowser />
        </div>
      </main>
      <Footer />
    </>
  );
}
