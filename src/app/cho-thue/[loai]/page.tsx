import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ListingBrowser from "@/components/ListingBrowser";
import Breadcrumb from "@/components/Breadcrumb";
import { getListings } from "@/lib/listingsDb";
import { getArticles } from "@/lib/contentDb";
import { findCategory, rentCategories } from "@/lib/categories";

// TRANG DANH MỤC NHÀ ĐẤT CHO THUÊ — /cho-thue/<loai-hinh>

export function generateStaticParams() {
  return rentCategories.map((c) => ({ loai: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ loai: string }> }): Promise<Metadata> {
  const { loai } = await params;
  const c = findCategory(rentCategories, loai);
  if (!c) return { title: "Không tìm thấy danh mục", robots: { index: false, follow: true } };
  return {
    title: c.title,
    description: c.desc,
    alternates: { canonical: `/cho-thue/${c.slug}` },
    openGraph: { title: c.title, description: c.desc, url: `/cho-thue/${c.slug}`, type: "website" },
  };
}

export default async function DanhMucChoThuePage({ params }: { params: Promise<{ loai: string }> }) {
  const { loai } = await params;
  const c = findCategory(rentCategories, loai);
  if (!c) notFound();

  const [listings, articles] = await Promise.all([getListings(), getArticles()]);

  return (
    <>
      <Header />
      <main className="flex-1 bg-white">
        <Breadcrumb
          items={[
            { name: "Nhà đất cho thuê", href: "/cho-thue" },
            { name: c.label, href: `/cho-thue/${c.slug}` },
          ]}
        />
        <Suspense fallback={<div className="mx-auto h-[104px] max-w-7xl px-4 sm:px-6 lg:px-8" />}>
          <ListingBrowser
            purpose="thue"
            heading={c.h1}
            items={listings}
            articles={articles}
            initialTypes={c.types}
          />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
