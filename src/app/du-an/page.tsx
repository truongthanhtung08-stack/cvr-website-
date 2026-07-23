import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import ProjectsBrowser from "@/components/ProjectsBrowser";
import { getProjects, getArticles } from "@/lib/contentDb";
import { getProjectBanners } from "@/lib/siteContent";

export const metadata: Metadata = {
  title: "Dự án bất động sản Đà Nẵng, Huế & Miền Trung | Coastal Land",
  description: "Danh sách dự án căn hộ, khu đô thị, nghỉ dưỡng tại Miền Trung — tiến độ, giá bán và tiện ích đầy đủ.",
};

export default async function DuAnPage() {
  // Dự án + bài viết từ Supabase (admin tự tạo) — chưa có nội dung thật → mẫu
  // Banner trang dự án: admin sửa được (siteContent) — chưa nhập → mặc định
  const [projects, articles, projBanners] = await Promise.all([
    getProjects(), getArticles(), getProjectBanners(),
  ]);
  return (
    <>
      <Header />
      <main className="flex-1 bg-white">
        {/* Banner dự án — khung GIỮ NGUYÊN; ảnh PHỦ KÍN khung (cover), KHÔNG hụt 2 bên. */}
        <Hero banners={projBanners} heightClass="h-[320px] sm:h-[400px]" search={false} />

        <div className="mx-auto max-w-7xl px-4 pb-20 pt-3 sm:px-6 lg:px-8">
          {/* Thanh lọc kiểu Batdongsan + tiêu đề + danh sách (bộ đếm nhảy theo bộ lọc) */}
          <ProjectsBrowser projects={projects} articles={articles} />
        </div>
      </main>
      <Footer />
    </>
  );
}
