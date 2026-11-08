import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PagedArticleList from "@/components/PagedArticleList";
import ShareButtons from "@/components/ShareButtons";
import { anhNho } from "@/lib/asset";
import { HomeExpandProvider, HomeCollapsible } from "@/components/HomeExpand";
import { articleContent } from "@/lib/data";
import { getArticle, getArticles } from "@/lib/contentDb";
import RichContent from "@/components/RichContent";
import { BreadcrumbJsonLd } from "@/components/Breadcrumb";
import { tieuDeGoogle } from "@/lib/thang";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const a = await getArticle(slug);
  if (!a) return { title: "Không tìm thấy", robots: { index: false, follow: true } };
  const desc = a.excerpt.slice(0, 160);
  return {
    title: tieuDeGoogle(a.title),
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
  // Tin tức khác: mọi bài còn lại, MỚI NHẤT Ở TRÊN (thứ tự getArticles)
  const pool = articles.filter((x) => x.slug !== a.slug);

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
            // Ngày ISO 8601 (Google không đọc được dạng 30/09/2026)
            datePublished: a.ngayDangIso ?? a.date,
            ...(a.ngaySuaIso ? { dateModified: a.ngaySuaIso } : {}),
            articleSection: a.category,
            inLanguage: "vi-VN",
            mainEntityOfPage: `https://coastalland.vn/tin-tuc/${a.slug}`,
            ...(a.image ? { image: [a.image] } : {}),
            author: { "@type": "Organization", name: "COASTAL LAND", url: "https://coastalland.vn/gioi-thieu" },
            publisher: { "@type": "Organization", name: "COASTAL LAND", logo: { "@type": "ImageObject", url: "https://coastalland.vn/logo/logo-horizontal-dark.svg" } },
          }),
        }}
      />
      <main className="flex-1 bg-white">
        <HomeExpandProvider>
        {/* HAI CỘT (anh 08/11/2026: "mở 1 tin cứ chia 2 cột, cột chính bên trái, cột bên phải bố trí như cũ", kiểu Batdongsan):
            trái = bài viết + Bài viết khác · phải = "Bài viết được quan tâm" đánh số, dính khi cuộn. Điện thoại một cột như cũ. */}
        <div className="mx-auto max-w-6xl px-4 pb-footer sm:px-8 lg:grid lg:grid-cols-3 lg:gap-12 lg:px-10">
        <div className="min-w-0 lg:col-span-2">
        {/* Nội dung bài — ẩn khi bấm "Xem thêm" ở mục tin liên quan bên dưới */}
        <HomeCollapsible>
        <article className="pt-6">{/* đáy bài = 0: khối Bài viết khác tự cách 56px (mt-14) như mọi khối trang tin */}

          <div className="flex items-center gap-2 text-xs text-cvr-muted">
            <span className="rounded-full bg-cvr-surface px-2.5 py-0.5 font-medium text-cvr-body">{a.category}</span>
          </div>
          <h1 className="mt-3 text-2xl font-semibold leading-tight tracking-tight text-cvr-ink sm:text-[2rem]">{a.title}</h1>

          {/* Dưới tiêu đề: thứ, ngày, giờ đăng (giờ Việt Nam) theo lối báo — không ghi tên; tên tác giả nằm cuối bài (chủ dự án 25/10/2026) */}
          <time dateTime={a.ngayDangIso} className="mt-3 block text-[13px] uppercase text-cvr-muted">{ngayGioDang(a.ngayDangIso) ?? a.date}</time>

          {/* Ảnh bìa: không viền; máy tính bo 12px như mọi khung ảnh (24/10/2026) */}
          <div className="relative mt-5 aspect-[16/9] overflow-hidden rounded-none sm:rounded-xl">
            <Image src={a.image} alt={a.title} fill priority sizes="(max-width:1024px) 100vw, 66vw" className="object-cover" />
          </div>

          <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-cvr-body">
            <RichContent paragraphs={content} title={a.title} />
          </div>

          {/* CUỐI MỌI bài: chỉ tên tác giả, chữ không logo, dẫn trang Giới thiệu (chủ dự án 25/10/2026) */}
          {/* DƯỚI CÙNG BÀI VIẾT: tên tác giả trái · nút chia sẻ phải (anh 08/11/2026) */}
          <div className="mt-6 flex items-center justify-between gap-3 border-t border-cvr-line/70 pt-4 sm:mt-8">
            <Link href="/gioi-thieu" className="text-[13px] font-semibold text-cvr-ink hover:text-cvr-blue-ink">Coastal Land</Link>
            <ShareButtons title={a.title} duongDan={`/tin-tuc/${a.slug}`} moLen nutCls="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cvr-line text-cvr-ink transition hover:border-cvr-ink" />
          </div>
        </article>
        </HomeCollapsible>

        {/* Tin liên quan — CÙNG CẤU TRÚC mọi khối: slide 8 bài → "Xem thêm" →
            danh sách theo trang (có cột phải), nội dung bài phía trên ẩn đi. */}
        {/* BÀI VIẾT KHÁC (anh 08/11/2026: "bài viết khác, bố trí như BĐS", "cứ bấm cuộn xuống xem, không chia trang"): bài mới nhất ở trên, danh sách ảnh trái · chữ phải,
            "Xem thêm" nối tiếp — cùng danh sách trang Tin tức */}
        {pool.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-5 text-xl font-semibold tracking-tight text-cvr-ink sm:text-2xl">Bài viết khác</h2>
          <PagedArticleList articles={pool} />
        </section>
        )}
        </div>
        {pool.length > 0 && (
        <aside className="hidden pt-6 lg:block">
          <div className="sticky top-24 rounded-xl bg-white p-5 shadow-lux">
            <h2 className="text-sm font-semibold tracking-tight text-cvr-ink">Bài viết được quan tâm</h2>
            <div className="mt-1 flex flex-col divide-y divide-cvr-line/70">
              {pool.slice(0, 5).map((x, i) => (
                <Link key={x.slug} href={`/tin-tuc/${x.slug}`} className="group flex items-center gap-3 py-3 last:pb-0">
                  <span className="w-4 shrink-0 text-lg font-semibold leading-snug text-cvr-faint">{i + 1}</span>
                  <span className="relative aspect-[1.618/1] w-20 shrink-0 overflow-hidden rounded-md bg-cvr-surface"><Image src={anhNho(x.image)} alt={x.title} fill sizes="80px" className="object-cover" /></span>
                  <span className="line-clamp-3 text-sm font-medium leading-snug text-cvr-ink transition-colors group-hover:text-cvr-blue-ink">{x.title}</span>
                </Link>
              ))}
            </div>
          </div>
        </aside>
        )}
        </div>
        </HomeExpandProvider>
      </main>
      <Footer />
    </>
  );
}

// "Chủ nhật, 06/09/2026, 16:43" theo giờ Việt Nam — dòng thời gian dưới tiêu đề bài
function ngayGioDang(iso?: string) {
  const d = iso ? new Date(iso) : null;
  if (!d || isNaN(d.getTime())) return null;
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", weekday: "long", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false })
      .formatToParts(d).map((x) => [x.type, x.value]),
  );
  return `${p.weekday}, ${p.day}/${p.month}/${p.year}, ${p.hour}:${p.minute}`;
}
