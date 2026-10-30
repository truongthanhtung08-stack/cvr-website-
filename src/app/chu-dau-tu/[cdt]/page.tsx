import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumb from "@/components/Breadcrumb";
import ProjectsBrowser from "@/components/ProjectsBrowser";
import { ProjectListJsonLd } from "@/components/ListJsonLd";
import { getArticles, getProjects } from "@/lib/contentDb";
import { getListings } from "@/lib/listingsDb";
import { dongTraCuu } from "@/lib/traCuuDuAn";
import { HomeExpandProvider } from "@/components/HomeExpand";
import { NGUONG_INDEX_CDT, nhomChuDauTu } from "@/lib/chuDauTu";

// pSEO trục 11 — /chu-dau-tu/<tên>: danh sách dự án của một chủ đầu tư (kiểu Mã số thuế).
// Index khi có ≥ 2 dự án đã đăng (src/lib/chuDauTu.ts).

export async function generateStaticParams() {
  const projects = await getProjects().catch(() => []);
  return [...nhomChuDauTu(projects).entries()]
    .filter(([, g]) => g.duAn.length >= NGUONG_INDEX_CDT)
    .map(([cdt]) => ({ cdt }));
}

async function nhom(cdt: string) {
  const projects = await getProjects().catch(() => []);
  return nhomChuDauTu(projects).get(cdt) ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ cdt: string }> }): Promise<Metadata> {
  const { cdt } = await params;
  const g = await nhom(cdt);
  if (!g) return { title: "Không tìm thấy trang", robots: { index: false, follow: true } };
  const title = `Dự án của ${g.ten}`;
  const description = `Danh sách dự án bất động sản của ${g.ten}: vị trí, loại hình, tình trạng, quy mô và hình ảnh.`;
  return {
    title,
    description,
    alternates: { canonical: `/chu-dau-tu/${cdt}` },
    openGraph: { title, description, url: `/chu-dau-tu/${cdt}`, type: "website" },
    ...(g.duAn.length >= NGUONG_INDEX_CDT ? {} : { robots: { index: false, follow: true } }),
  };
}

export default async function ChuDauTuPage({ params }: { params: Promise<{ cdt: string }> }) {
  const { cdt } = await params;
  const [g, articles, listings, tatCa] = await Promise.all([nhom(cdt), getArticles(), getListings(), getProjects()]);
  if (!g) notFound();
  // CÙNG CẤU TRÚC trang Dự án (30/10/2026): Nổi bật = dự án nổi bật của chủ đầu tư; Tra cứu = mọi dự án của chủ đầu tư
  const slugCdt = new Set(g.duAn.map((x) => x.slug));
  const traCuu = dongTraCuu(listings, tatCa).filter((d) => slugCdt.has(d.slug));
  const heading = `Dự án của ${g.ten}`;
  return (
    <>
      <ProjectListJsonLd items={g.duAn} heading={heading} path={`/chu-dau-tu/${cdt}`} />
      <Header />
      <main className="flex-1 bg-white">
        <Breadcrumb items={[{ name: "Dự án", href: "/du-an" }, { name: g.ten, href: `/chu-dau-tu/${cdt}` }]} />
        <div className="mx-auto max-w-7xl px-4 pb-footer sm:px-6 lg:px-8">
          <h1 className="mb-4 mt-3 text-2xl font-semibold tracking-tight text-cvr-ink sm:text-3xl">{heading}</h1>
          <HomeExpandProvider>
            <ProjectsBrowser projects={g.duAn.filter((x) => !x.dangThe)} articles={articles} tieuDePhu traCuu={traCuu} />
          </HomeExpandProvider>
        </div>
      </main>
      <Footer />
    </>
  );
}
