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
          {/* Hero: KHUNG = ĐÚNG TỶ LỆ ẢNH, mỗi slide có ẢNH RIÊNG cho từng loại máy
              (giống Hero trang chủ): MÁY TÍNH 3:1 · 1920×640 — ĐIỆN THOẠI 2,5:1 · 1200×480.
              Trước đây để chiều cao cố định (190px / 400px) nên khung co giãn theo màn hình,
              ảnh luôn bị cắt — nhất là trên điện thoại (khung ~2:1 mà ảnh 3:1, cụt hai bên). */}
          <ProjectsBrowser
            projects={projects}
            articles={articles}
            hero={
              <Hero
                banners={projBanners}
                heightClass="aspect-[5/2] sm:aspect-[3/1]"
                heightClassNoMobile="aspect-[3/1]"
                search={false}
              />
            }
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
