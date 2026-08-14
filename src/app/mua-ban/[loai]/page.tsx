import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ListingBrowser from "@/components/ListingBrowser";
import Breadcrumb from "@/components/Breadcrumb";
import { getListings } from "@/lib/listingsDb";
import { getArticles } from "@/lib/contentDb";
import { findCategory, saleCategories } from "@/lib/categories";

// TRANG DANH MỤC NHÀ ĐẤT BÁN — /mua-ban/<loai-hinh>
// Đây là nhóm từ khoá đáng giá nhất của sàn ("bán căn hộ chung cư Đà Nẵng"…).
// Trước đây các đường dẫn này trả 404 dù menu vẫn trỏ tới.

export function generateStaticParams() {
  return saleCategories.map((c) => ({ loai: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ loai: string }> }): Promise<Metadata> {
  const { loai } = await params;
  const c = findCategory(saleCategories, loai);
  if (!c) return { title: "Không tìm thấy danh mục", robots: { index: false, follow: true } };
  return {
    title: c.title,
    description: c.desc,
    alternates: { canonical: `/mua-ban/${c.slug}` },
    openGraph: { title: c.title, description: c.desc, url: `/mua-ban/${c.slug}`, type: "website" },
  };
}

export default async function DanhMucMuaBanPage({ params }: { params: Promise<{ loai: string }> }) {
  const { loai } = await params;
  const c = findCategory(saleCategories, loai);
  if (!c) notFound();

  const [listings, articles] = await Promise.all([getListings(), getArticles()]);

  return (
    <>
      <Header />
      <main className="flex-1 bg-white">
        <Breadcrumb
          items={[
            { name: "Nhà đất bán", href: "/mua-ban" },
            { name: c.label, href: `/mua-ban/${c.slug}` },
          ]}
        />
        <Suspense fallback={<div className="mx-auto h-[104px] max-w-7xl px-4 sm:px-6 lg:px-8" />}>
          <ListingBrowser
            purpose="ban"
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
