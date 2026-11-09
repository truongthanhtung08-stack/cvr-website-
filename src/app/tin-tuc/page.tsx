import type { Metadata } from "next";
import { BreadcrumbJsonLd } from "@/components/Breadcrumb";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getArticles } from "@/lib/contentDb";
import ArticleBrowser from "@/components/ArticleBrowser";
import { anhNho } from "@/lib/asset";

export const metadata: Metadata = {
  alternates: { canonical: "/tin-tuc" },
  title: "Tin tức bất động sản",
  description: "Phân tích thị trường, cẩm nang pháp lý và kinh nghiệm đầu tư bất động sản.",
};

export default async function TinTucPage() {
  // Bài viết từ Supabase (admin tự tạo) — chưa có bài thật → bài mẫu
  const articles = await getArticles();
  const [featured, ...rest] = articles;
  const benPhai = rest.slice(0, 5);

  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "Tin tức", href: "/tin-tuc" }]} />
      <Header />
      <main className="flex-1 bg-white">
        <div className="mx-auto max-w-6xl px-4 pt-6 pb-footer sm:px-8 lg:px-10">
          <h1 className="text-center text-2xl font-semibold tracking-tight text-cvr-ink sm:text-4xl">Tin tức bất động sản</h1>
          <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-cvr-muted sm:text-[15px]">Phân tích thị trường, cẩm nang &amp; kinh nghiệm đầu tư tại Duyên hải miền Trung.</p>

          {/* Chưa có bài viết nào (admin chưa đăng) → trạng thái trống, không crash */}
          {articles.length === 0 && (
            <p className="mt-10 rounded-xl border border-dashed border-cvr-line px-4 py-16 text-center text-cvr-muted">
              Chưa có bài viết nào. Nội dung đang được cập nhật.
            </p>
          )}

          {/* HAI PHẦN như trang bài viết (anh 08/11/2026: "tab tin tức cũng có 2 phần"): TRÁI = bài chính (ảnh tỉ lệ vàng, chữ đè đáy ảnh)
              + danh sách bài, "Xem thêm" nối tiếp · PHẢI = "Bài viết được quan tâm" (ảnh nhỏ + tiêu đề), dính khi cuộn. Điện thoại một cột. */}
          {featured && (
          <div className="mt-6 sm:mt-8 lg:grid lg:grid-cols-3 lg:gap-12">
            <div className="min-w-0 lg:col-span-2">
              <Link href={`/tin-tuc/${featured.slug}`} className="group relative block aspect-[1.618/1] overflow-hidden bg-cvr-surface sm:rounded-xl">
                <Image src={featured.image} alt={featured.title} fill priority sizes="(max-width:1024px) 100vw, 66vw" className="object-cover transition-transform duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]" />
                <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
                  <h2 className="line-clamp-2 text-xl font-bold leading-snug text-white sm:text-2xl">{featured.title}</h2>
                  <p className="mt-2 hidden line-clamp-2 text-sm leading-relaxed text-white/85 sm:block">{featured.excerpt}</p>
                  <p className="mt-2 text-xs text-white/75">{featured.category} · {featured.date}</p>
                </div>
              </Link>
              <div className="mt-8"><ArticleBrowser articles={articles} boQua={1} cotPhai={false} /></div>
            </div>
            {benPhai.length > 0 && (
            <aside className="hidden lg:block">
              <div className="sticky top-24 rounded-xl bg-white p-5 shadow-lux">
                <h2 className="text-sm font-semibold tracking-tight text-cvr-ink">Bài viết được quan tâm</h2>
                <div className="mt-1 flex flex-col divide-y divide-cvr-line/70">
                  {benPhai.map((a, i) => (
                    <Link key={a.slug} href={`/tin-tuc/${a.slug}`} className="group flex items-center gap-3 py-3 last:pb-0">
                      <span className="w-4 shrink-0 text-lg font-semibold leading-snug text-cvr-faint">{i + 1}</span>
                      <span className="relative aspect-[1.618/1] w-20 shrink-0 overflow-hidden rounded-md bg-cvr-surface"><Image src={anhNho(a.image)} alt={a.title} fill sizes="80px" className="object-cover" /></span>
                      <span className="line-clamp-3 text-sm font-medium leading-snug text-cvr-ink transition-colors group-hover:text-cvr-blue-ink">{a.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
            )}
          </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
