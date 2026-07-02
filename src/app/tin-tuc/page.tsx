import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { articles } from "@/lib/data";

export const metadata: Metadata = {
  title: "Tin tức bất động sản | Coastal Land",
  description: "Phân tích thị trường, cẩm nang pháp lý và kinh nghiệm đầu tư bất động sản tại Đà Nẵng, Huế và miền Trung.",
};

export default function TinTucPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 lg:px-8">
          <nav className="mb-3 flex items-center gap-1.5 text-xs text-white/40">
            <Link href="/" className="hover:text-white/70">Trang chủ</Link>
            <span>/</span>
            <span className="text-white/70">Tin tức</span>
          </nav>
          <h1 className="font-serif text-2xl font-bold text-white sm:text-3xl">Tin tức bất động sản</h1>
          <p className="mt-1.5 text-sm text-white/55">Phân tích thị trường, cẩm nang & kinh nghiệm đầu tư tại Duyên hải miền Trung.</p>

          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {articles.map((a) => (
              <Link
                key={a.slug}
                href={`/tin-tuc/${a.slug}`}
                className="card-lux group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] hover:-translate-y-2 hover:border-cvr-gold/40 hover:shadow-2xl hover:shadow-black/60"
              >
                <span className="card-sheen" aria-hidden />
                <div className="relative aspect-[16/9] overflow-hidden">
                  <Image src={a.image} alt={a.title} fill sizes="(max-width:768px) 100vw, 25vw" className="object-cover transition-transform duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.07]" />
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-center gap-2 text-xs text-white/50">
                    <span className="rounded bg-cvr-gold/15 px-2 py-0.5 font-medium text-cvr-gold-soft">{a.category}</span>
                    <span>{a.date}</span>
                  </div>
                  <h3 className="mt-2.5 line-clamp-2 font-bold leading-snug text-white group-hover:text-cvr-gold-soft">{a.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/60">{a.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

