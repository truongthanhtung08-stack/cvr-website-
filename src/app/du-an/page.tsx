import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import ProjectsBrowser from "@/components/ProjectsBrowser";
import { getProjects, getArticles } from "@/lib/contentDb";
import { getProjectBanners } from "@/lib/siteContent";

export const metadata: Metadata = {
  alternates: { canonical: "/du-an" },
  title: "Dự án bất động sản Đà Nẵng, Huế & Miền Trung",
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
        <div className="mx-auto max-w-7xl px-4 pb-20 pt-0 sm:px-6 sm:pt-0 lg:px-8">
          {/* MOBILE: ô tìm + chip lọc lên TRÊN, banner nằm dưới (mẫu Batdongsan).
              DESKTOP: banner trên, thanh lọc dưới — như cũ. ProjectsBrowser tự xếp thứ tự. */}
          <ProjectsBrowser
            projects={projects}
            articles={articles}
            hero={<Hero banners={projBanners} heightClass="h-[190px] sm:h-[400px]" search={false} />}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
