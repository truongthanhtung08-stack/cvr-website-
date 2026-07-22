import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getArticles } from "@/lib/contentDb";

export const metadata: Metadata = {
  title: "Tin tức bất động sản | Coastal Land",
  description: "Phân tích thị trường, cẩm nang pháp lý và kinh nghiệm đầu tư bất động sản tại Đà Nẵng, Huế và miền Trung.",
};

export default async function TinTucPage() {
  // Bài viết từ Supabase (admin tự tạo) — chưa có bài thật → bài mẫu
  const articles = await getArticles();
  const [featured, ...rest] = articles;

  return (
    <>
      <Header />
      <main className="flex-1 bg-white">
        <div className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold tracking-tight text-cvr-ink sm:text-3xl">Tin tức bất động sản</h1>
          <p className="mt-1.5 text-sm text-cvr-muted">Phân tích thị trường, cẩm nang &amp; kinh nghiệm đầu tư tại Duyên hải miền Trung.</p>

          {/* Bài nổi bật — ảnh trái · nội dung phải (kiểu Batdongsan) */}
          <Link
            href={`/tin-tuc/${featured.slug}`}
            className="card-lux group mt-6 flex flex-col overflow-hidden rounded-none border border-cvr-line bg-white shadow-lux shadow-lux-hover hover:-translate-y-1 sm:flex-row"
          >
            <span className="card-sheen" aria-hidden />
            <div className="relative aspect-[16/9] overflow-hidden sm:aspect-auto sm:w-1/2 sm:shrink-0">
              <Image src={featured.image} alt={featured.title} fill sizes="(max-width:640px) 100vw, 50vw" className="object-cover transition-transform duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]" />
            </div>
            <div className="flex flex-1 flex-col justify-center p-5 sm:p-8">
              <p className="flex items-center gap-2 text-xs text-cvr-muted">
                <span className="rounded-full bg-cvr-surface px-2.5 py-0.5 font-medium text-cvr-body">{featured.category}</span>
                <span>{featured.date}</span>
              </p>
              <h2 className="mt-3 line-clamp-2 text-xl font-semibold leading-snug text-cvr-ink transition-colors group-hover:text-cvr-blue-ink sm:text-2xl">
                {featured.title}
              </h2>
              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-cvr-muted">{featured.excerpt}</p>
              <span className="mt-4 text-sm font-medium text-cvr-muted transition-colors group-hover:text-cvr-ink">Đọc bài viết →</span>
            </div>
          </Link>

          {/* ── 2 cột kiểu Batdongsan: LIST bài viết (trái) + Bài viết được quan tâm (phải) ── */}
          <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Danh sách bài — hàng ngang: ảnh trái · nội dung phải, ngăn dòng kẻ */}
            <div className="divide-y divide-cvr-line/70 lg:col-span-2">
              {rest.map((a) => (
                <Link key={a.slug} href={`/tin-tuc/${a.slug}`} className="group flex gap-4 py-5 first:pt-0 sm:gap-5">
                  <div className="relative aspect-[16/10] w-36 shrink-0 overflow-hidden rounded-xl bg-cvr-surface sm:w-56">
                    <Image src={a.image} alt={a.title} fill sizes="(max-width:640px) 144px, 224px" className="object-cover transition-transform duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-center gap-2 text-xs text-cvr-muted">
                      <span className="rounded-full bg-cvr-surface px-2.5 py-0.5 font-medium text-cvr-body">{a.category}</span>
                      <span>{a.date}</span>
                    </div>
                    <h3 className="mt-2 line-clamp-2 font-semibold leading-snug text-cvr-ink transition-colors group-hover:text-cvr-blue-ink sm:text-lg">
                      {a.title}
                    </h3>
                    <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-cvr-muted">{a.excerpt}</p>
                  </div>
                </Link>
              ))}
            </div>

            {/* Sidebar: bài viết được quan tâm — đánh số (kiểu Batdongsan) */}
            <aside className="lg:col-span-1">
              <div className="sticky top-24 rounded-none border border-cvr-line bg-white p-5 shadow-lux">
                <h2 className="text-sm font-semibold tracking-tight text-cvr-ink">Bài viết được quan tâm</h2>
                <div className="mt-1 flex flex-col divide-y divide-cvr-line/70">
                  {articles.slice(0, 5).map((a, i) => (
                    <Link key={a.slug} href={`/tin-tuc/${a.slug}`} className="group flex gap-3 py-3 last:pb-0">
                      <span className="w-5 shrink-0 text-lg font-semibold leading-snug text-cvr-faint">{i + 1}</span>
                      <span className="line-clamp-2 text-sm font-medium leading-snug text-cvr-ink transition-colors group-hover:text-cvr-blue-ink">
                        {a.title}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
