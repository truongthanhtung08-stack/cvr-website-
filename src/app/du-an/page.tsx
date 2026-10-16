import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ProjectListJsonLd } from "@/components/ListJsonLd";
import Hero from "@/components/Hero";
import ProjectsBrowser from "@/components/ProjectsBrowser";
import { getProjects, getArticles } from "@/lib/contentDb";
import { getProjectBanners } from "@/lib/siteContent";

// DỰ ÁN NỔI BẬT (chủ dự án 16/10/2026): chỉ dự án có gói (Diamond / Gold / Silver).
// Tra cứu mọi dự án toàn quốc nằm ở /du-an/tra-cuu (docs/CAU-TRUC-MENU-DU-AN-TIEN-ICH.md).

export const metadata: Metadata = {
  alternates: { canonical: "/du-an" },
  title: "Dự án bất động sản nổi bật",
  description: "Dự án căn hộ, khu đô thị, nghỉ dưỡng nổi bật — vị trí, chủ đầu tư, tiến độ, giá bán và tiện ích.",
};

export default async function DuAnPage() {
  // Banner trang dự án: admin sửa được (siteContent) — chưa nhập → mặc định
  const [projects, articles, projBanners] = await Promise.all([
    getProjects(), getArticles(), getProjectBanners(),
  ]);
  const noiBat = projects.filter((p) => p.tier && p.tier !== "basic");
  return (
    <>
      <ProjectListJsonLd items={noiBat} heading="Dự án bất động sản nổi bật" path="/du-an" />
      <Header />
      <main className="flex-1 bg-white">
        <div className="mx-auto max-w-7xl px-4 pt-0 pb-footer sm:px-6 sm:pt-0 lg:px-8">
          {/* MOBILE: ô tìm lên TRÊN, banner nằm dưới (mẫu Batdongsan); nút lọc nằm
              trong trang tìm toàn màn hình. Banner KHOÁ THEO TỶ LỆ 2:1 (chữ nhật)
              thay cho chiều cao cứng → nhỏ gọn lại và tự cân theo mọi khổ máy
              (375px → 187px, máy to hơn thì cao theo, không bao giờ chiếm quá nửa màn).
              DESKTOP: banner trên, thanh lọc dưới — giữ nguyên 400px như cũ. */}
          <ProjectsBrowser
            projects={noiBat}
            articles={articles}
            hero={<Hero banners={projBanners} heightClass="aspect-[2/1] sm:aspect-auto sm:h-[400px]" search={false} />}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
