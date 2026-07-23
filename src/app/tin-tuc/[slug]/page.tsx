import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { articleContent, pickRelated } from "@/lib/data";
import { getArticle, getArticles } from "@/lib/contentDb";
import RichContent from "@/components/RichContent";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const a = await getArticle(slug);
  if (!a) return { title: "Không tìm thấy | Coastal Land" };
  return { title: `${a.title} | Coastal Land`, description: a.excerpt };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Bài viết từ Supabase (admin tự tạo) — không có trong DB → tìm bài mẫu
  const [a, articles] = await Promise.all([getArticle(slug), getArticles()]);
  if (!a) notFound();
  const content = articleContent(a);
  // Tin liên quan: ưu tiên CÙNG CHUYÊN MỤC (+1), còn lại lấp theo thứ tự mới nhất. Đủ 3.
  const related = pickRelated(
    articles.filter((x) => x.slug !== a.slug),
    (x) => (x.category === a.category ? 1 : 0),
    3,
  );

  return (
    <>
      <Header />
      <main className="flex-1 bg-white">
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
            <RichContent paragraphs={content} />
          </div>
        </article>

        {related.length > 0 && (
          <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
            <h2 className="mb-5 text-xl font-semibold tracking-tight text-cvr-ink sm:text-2xl">Tin liên quan</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              {related.map((r) => (
                <Link key={r.slug} href={`/tin-tuc/${r.slug}`} className="card-lux group relative flex flex-col overflow-hidden rounded-none border border-cvr-line bg-white shadow-lux shadow-lux-hover hover:-translate-y-1.5 hover:border-cvr-blue/45">
                  <span className="card-sheen" aria-hidden />
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <Image src={r.image} alt={r.title} fill sizes="(max-width:768px) 100vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="p-4">
                    <span className="text-xs text-cvr-muted">{r.date}</span>
                    <h3 className="mt-1 line-clamp-2 font-semibold leading-snug text-cvr-ink transition-colors group-hover:text-cvr-blue-ink">{r.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
