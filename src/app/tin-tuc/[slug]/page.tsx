import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ArticleShowcase from "@/components/ArticleShowcase";
import { HomeExpandProvider, HomeCollapsible } from "@/components/HomeExpand";
import { articleContent, pickRelated } from "@/lib/data";
import { getArticle, getArticles } from "@/lib/contentDb";
import RichContent from "@/components/RichContent";
import { BreadcrumbJsonLd } from "@/components/Breadcrumb";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const a = await getArticle(slug);
  if (!a) return { title: "Không tìm thấy", robots: { index: false, follow: true } };
  const desc = a.excerpt.slice(0, 160);
  return {
    title: a.title,
    description: desc,
    alternates: { canonical: `/tin-tuc/${slug}` },
    // Bài viết → Google hiểu là bài báo, đủ điều kiện hiện trong Google Discover
    openGraph: {
      title: a.title,
      description: desc,
      url: `/tin-tuc/${slug}`,
      type: "article",
      publishedTime: a.date,
      section: a.category,
      ...(a.image ? { images: [{ url: a.image, alt: a.title }] } : {}),
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Bài viết từ Supabase (admin tự tạo) — không có trong DB → tìm bài mẫu
  const [a, articles] = await Promise.all([getArticle(slug), getArticles()]);
  if (!a) notFound();
  const content = articleContent(a);
  // Tin liên quan: ưu tiên CÙNG CHUYÊN MỤC (+1), còn lại theo thứ tự mới nhất.
  // Lấy HẾT: slide hiện 8 bài đầu, "Xem thêm" đổ ra danh sách theo trang.
  const pool = articles.filter((x) => x.slug !== a.slug);
  const related = pickRelated(pool, (x) => (x.category === a.category ? 1 : 0), pool.length);

  return (
    <>
      <Header />
      <BreadcrumbJsonLd items={[{ name: "Tin tức", href: "/tin-tuc" }, { name: a.title, href: `/tin-tuc/${a.slug}` }]} />
      {/* Google hiểu đây là bài báo → đủ điều kiện vào Google Discover / Tin tức */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: a.title,
            description: a.excerpt,
            datePublished: a.date,
            articleSection: a.category,
            inLanguage: "vi-VN",
            mainEntityOfPage: `https://coastalland.vn/tin-tuc/${a.slug}`,
            ...(a.image ? { image: [a.image] } : {}),
            author: { "@type": "Organization", name: "COASTAL LAND" },
            publisher: { "@type": "Organization", name: "COASTAL LAND", logo: { "@type": "ImageObject", url: "https://coastalland.vn/logo/logo-horizontal-dark.svg" } },
          }),
        }}
      />
      <main className="flex-1 bg-white">
        <HomeExpandProvider>
        {/* Nội dung bài — ẩn khi bấm "Xem thêm" ở mục tin liên quan bên dưới */}
        <HomeCollapsible>
        <article className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:px-6">

          <div className="flex items-center gap-2 text-xs text-cvr-muted">
            <span className="rounded-full bg-cvr-surface px-2.5 py-0.5 font-medium text-cvr-body">{a.category}</span>
            <span>{a.date}</span>
          </div>
          <h1 className="mt-3 text-2xl font-semibold leading-tight tracking-tight text-cvr-ink sm:text-[2rem]">{a.title}</h1>

          <div className="relative mt-5 aspect-[16/9] overflow-hidden rounded-none border border-cvr-line">
            <Image src={a.image} alt={a.title} fill priority sizes="(max-width:768px) 100vw, 768px" className="object-cover" />
          </div>

          <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-cvr-body">
            <RichContent paragraphs={content} title={a.title} />
          </div>
        </article>
        </HomeCollapsible>

        {/* Tin liên quan — CÙNG CẤU TRÚC mọi khối: slide 8 bài → "Xem thêm" →
            danh sách theo trang (có cột phải), nội dung bài phía trên ẩn đi. */}
        <div className="mx-auto max-w-7xl px-4 pb-footer sm:px-6 lg:px-8">
          <ArticleShowcase
            articles={related}
            title="Tin liên quan"
            sectionKey="tin-lien-quan"
            emptyNote="Chưa có bài viết liên quan."
          />
        </div>
        </HomeExpandProvider>
      </main>
      <Footer />
    </>
  );
}
