import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ProjectListJsonLd } from "@/components/ListJsonLd";
import Hero from "@/components/Hero";
import ProjectsBrowser from "@/components/ProjectsBrowser";
import KhuVucLinks from "@/components/KhuVucLinks";
import LienKetPseo from "@/components/LienKetPseo";
import { getProjects, getProjectsNoiBat, getArticles } from "@/lib/contentDb";
import { getListings } from "@/lib/listingsDb";
import { getProjectBanners } from "@/lib/siteContent";
import { demDuAnTheoTinh, dongTraCuu, nhomTraCuu } from "@/lib/traCuuDuAn";

// MỘT TRANG DỰ ÁN DUY NHẤT (chủ dự án 22/10/2026: hai trang "Dự án nổi bật" + "Tra cứu dự án" trùng nhau, bấm rắc rối,
// "không ai làm như vậy"). Nút Dự án ở menu trên và thanh dưới cùng đều về đây: MỌI dự án, dự án có gói
// (Diamond → Gold → Silver) đứng đầu, rồi các dự án khác. /du-an/tra-cuu tự chuyển về đây.
const HANG: Record<string, number> = { diamond: 0, gold: 1, silver: 2 };

export const metadata: Metadata = {
  alternates: { canonical: "/du-an" },
  title: "Dự án bất động sản",
  description: "Tra cứu dự án bất động sản: tên dự án, chủ đầu tư, vị trí, loại hình, tình trạng, hình ảnh — cập nhật hằng tuần.",
};

export default async function DuAnPage() {
  const [projects, articles, projBanners, tatCa, listings] = await Promise.all([
    getProjectsNoiBat(), getArticles(), getProjectBanners(), getProjects(), getListings(),
  ]);
  // Bấm menu Dự án là có cả hai phần (chủ dự án 29/10/2026): Tra cứu dự án (mọi dự án) + Dự án nổi bật
  const traCuu = dongTraCuu(listings, tatCa);
  const xep = [...projects].sort((a, b) => (HANG[a.tier ?? ""] ?? 9) - (HANG[b.tier ?? ""] ?? 9));
  return (
    <>
      <ProjectListJsonLd items={xep} heading="Dự án bất động sản" path="/du-an" />
      <Header />
      <main className="flex-1 bg-white">
        <div className="mx-auto max-w-7xl px-4 pt-0 pb-footer sm:px-6 sm:pt-0 lg:px-8">
          <ProjectsBrowser
            projects={xep}
            articles={articles}
            tieuDe="Dự án bất động sản"
            traCuu={traCuu}
            hero={<Hero banners={projBanners} heightClass="aspect-[2/1] sm:aspect-auto sm:h-[300px]" search={false} />}
          />
        </div>
        <KhuVucLinks base="/du-an" demTheoTinh={demDuAnTheoTinh(projects)} />
        <LienKetPseo nhom={nhomTraCuu(projects)} />
      </main>
      <Footer />
    </>
  );
}
