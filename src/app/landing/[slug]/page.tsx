import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { asset } from "@/lib/asset";
import { landings } from "@/lib/landings";
import { getLandingBySlug } from "@/lib/siteContent";
import LandingDisabledRedirect from "./LandingDisabledRedirect";

// ⏸️ TẠM ẨN LANDING PAGE (28.07): chưa có landing hoàn chỉnh → khoá cả route.
// Đặt về false để MỞ LẠI landing (và khôi phục href landing trong src/lib/banners.ts).
const LANDING_HIDDEN: boolean = true;

// Prerender các slug mặc định; slug do admin thêm mới vẫn render on-demand (dynamicParams mặc định true).
export function generateStaticParams() {
  return landings.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const l = await getLandingBySlug(slug);
  if (!l) return { title: "Không tìm thấy" };
  return { title: l.title, description: l.intro.slice(0, 140) };
}

export default async function LandingPage({ params }: { params: Promise<{ slug: string }> }) {
  // ⏸️ Landing đang tạm ẩn → chuyển hướng về /gioi-thieu (xem cờ LANDING_HIDDEN ở trên).
  if (LANDING_HIDDEN) return <LandingDisabledRedirect />;
  const { slug } = await params;
  const l = await getLandingBySlug(slug);
  if (!l) notFound();

  return (
    <>
      <Header />
      <main className="flex-1 bg-white">
        {/* Hero landing */}
        <section className="relative isolate flex min-h-[420px] items-end overflow-hidden">
          <Image src={asset(l.image)} alt={l.title} fill priority sizes="100vw" className="object-cover brightness-[0.7]" />
          <div className="absolute inset-0 bg-gradient-to-t from-cvr-ink via-cvr-ink/60 to-black/40" />
          <div className="relative mx-auto w-full max-w-5xl px-4 pb-10 pt-28 sm:px-6">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-cvr-gold sm:text-xs">{l.eyebrow}</p>
            <h1 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-white drop-shadow-md sm:text-4xl lg:text-5xl">{l.title}</h1>
            <p className="mt-3 text-base text-white/85 sm:text-lg">{l.subtitle}</p>
            <Link href={l.ctaHref} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-cvr-gold px-6 py-3 text-sm font-semibold text-white transition hover:bg-cvr-gold-soft active:scale-95">
              {l.ctaLabel}
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          {/* Giới thiệu */}
          <p className="text-lg leading-relaxed text-cvr-body">{l.intro}</p>

          {/* Số liệu */}
          <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {l.stats.map((s) => (
              <div key={s.label} className="rounded-none border border-cvr-line bg-white p-5 text-center shadow-lux">
                <p className="text-2xl font-semibold tracking-tight text-cvr-gold-ink sm:text-3xl">{s.value}</p>
                <p className="mt-1 text-xs text-cvr-muted sm:text-sm">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Khối nội dung */}
          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
            {l.blocks.map((b, i) => (
              <div key={b.title} className="rounded-none border border-cvr-line bg-white p-6 shadow-lux">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cvr-gold/15 text-lg font-bold text-cvr-gold-ink">{i + 1}</span>
                <h3 className="mt-4 font-semibold text-cvr-ink">{b.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-cvr-muted">{b.desc}</p>
              </div>
            ))}
          </div>

          {/* Thư viện ảnh */}
          {l.gallery?.length > 0 && (
            <div className="mt-12">
              <h2 className="mb-5 text-2xl font-semibold tracking-tight text-cvr-ink">Hình ảnh</h2>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {l.gallery.map((src, i) => (
                  <div key={i} className="relative aspect-[4/3] overflow-hidden rounded-none border border-cvr-line">
                    <Image src={asset(src)} alt={`${l.title} ${i + 1}`} fill sizes="(max-width:768px) 50vw, 25vw" className="object-cover transition-transform duration-500 hover:scale-105" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA cuối */}
          <div className="mt-12 flex flex-col items-center gap-4 rounded-none border border-cvr-line bg-cvr-surface p-8 text-center sm:p-12">
            <h2 className="text-2xl font-semibold tracking-tight text-cvr-ink sm:text-3xl">Sẵn sàng bắt đầu cùng Coastal Land?</h2>
            <p className="max-w-xl text-sm text-cvr-muted">Liên hệ đội ngũ của chúng tôi để được tư vấn miễn phí và nhận giải pháp phù hợp nhất.</p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
              <Link href={l.ctaHref} className="rounded-lg bg-cvr-ink px-6 py-3 text-sm font-semibold text-white transition hover:bg-cvr-body">{l.ctaLabel}</Link>
              <a href="tel:0905123456" className="rounded-lg border border-cvr-line bg-white px-6 py-3 text-sm font-semibold text-cvr-ink transition hover:bg-black/5">Hotline: 0905 123 456</a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
