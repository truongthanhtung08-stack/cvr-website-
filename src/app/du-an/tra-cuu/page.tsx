import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ProjectListJsonLd } from "@/components/ListJsonLd";
import ProjectsBrowser from "@/components/ProjectsBrowser";
import KhuVucLinks from "@/components/KhuVucLinks";
import LienKetPseo from "@/components/LienKetPseo";
import { getProjects, getArticles } from "@/lib/contentDb";
import { demDuAnTheoTinh, nhomTraCuu } from "@/lib/traCuuDuAn";

// TRA CỨU DỰ ÁN TOÀN QUỐC kiểu Mã số thuế (chủ dự án 16/10/2026: tách khỏi trang Dự án nổi bật).
// Mọi dự án Cowork nạp hằng tuần: ô tìm tên / chủ đầu tư / địa chỉ + lọc khu vực, loại hình, tình trạng;
// bên dưới lối theo khu vực, chủ đầu tư, dự án mới cập nhật. Cấu trúc: docs/CAU-TRUC-MENU-DU-AN-TIEN-ICH.md.

export const metadata: Metadata = {
  alternates: { canonical: "/du-an/tra-cuu" },
  title: "Tra cứu dự án bất động sản",
  description: "Tra cứu dự án bất động sản: tên dự án, chủ đầu tư, vị trí, quy mô, tình trạng, hình ảnh — cập nhật hằng tuần.",
};

export default async function TraCuuDuAnPage() {
  const [projects, articles] = await Promise.all([getProjects(), getArticles()]);
  return (
    <>
      <ProjectListJsonLd items={projects} heading="Tra cứu dự án bất động sản" path="/du-an/tra-cuu" />
      <Header />
      <main className="flex-1 bg-white">
        <div className="mx-auto max-w-7xl px-4 pt-0 pb-footer sm:px-6 sm:pt-0 lg:px-8">
          <ProjectsBrowser projects={projects} articles={articles} tieuDe="Tra cứu dự án bất động sản" />
        </div>
        <KhuVucLinks base="/du-an" demTheoTinh={demDuAnTheoTinh(projects)} />
        <LienKetPseo nhom={nhomTraCuu(projects)} />
      </main>
      <Footer />
    </>
  );
}
