import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { asset } from "@/lib/asset";
import { landings, getLandingBySlug } from "@/lib/landings";

export function generateStaticParams() {
  return landings.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const l = getLandingBySlug(slug);
  if (!l) return { title: "Không tìm thấy | Coastal Land" };
  return { title: `${l.title} | Coastal Land`, description: l.intro.slice(0, 160) };
}

export default async function LandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const l = getLandingBySlug(slug);
  if (!l) notFound();

  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero landing */}
        <section className="relative isolate flex min-h-[420px] items-end overflow-hidden">
          <Image src={asset(l.image)} alt={l.title} fill priority sizes="100vw" className="object-cover brightness-[0.7]" />
          <div className="absolute inset-0 bg-gradient-to-t from-cvr-ink via-cvr-ink/60 to-black/40" />
          <div className="relative mx-auto w-full max-w-5xl px-4 pb-10 pt-28 sm:px-6">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-cvr-gold sm:text-xs">{l.eyebrow}</p>
            <h1 className="max-w-3xl font-serif text-3xl font-semibold leading-tight text-white drop-shadow-md sm:text-4xl lg:text-5xl">{l.title}</h1>
            <p className="mt-3 text-base text-white/85 sm:text-lg">{l.subtitle}</p>
            <Link href={l.ctaHref} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-cvr-gold px-6 py-3 text-sm font-semibold text-cvr-ink transition hover:bg-cvr-gold-soft active:scale-95">
              {l.ctaLabel}
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          {/* Giới thiệu */}
          <p className="text-lg leading-relaxed text-white/80">{l.intro}</p>

          {/* Số liệu */}
          <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {l.stats.map((s) => (
              <div key={s.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center">
                <p className="font-serif text-2xl font-bold text-cvr-gold-soft sm:text-3xl">{s.value}</p>
                <p className="mt-1 text-xs text-white/60 sm:text-sm">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Khối nội dung */}
          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
            {l.blocks.map((b, i) => (
              <div key={b.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cvr-gold/15 font-serif text-lg font-bold text-cvr-gold-soft">{i + 1}</span>
                <h3 className="mt-4 font-semibold text-white">{b.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-white/65">{b.desc}</p>
              </div>
            ))}
          </div>

          {/* Thư viện ảnh */}
          {l.gallery?.length > 0 && (
            <div className="mt-12">
              <h2 className="mb-5 font-serif text-2xl font-bold text-white">Hình ảnh</h2>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {l.gallery.map((src, i) => (
                  <div key={i} className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/10">
                    <Image src={asset(src)} alt={`${l.title} ${i + 1}`} fill sizes="(max-width:768px) 50vw, 25vw" className="object-cover transition-transform duration-500 hover:scale-105" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA cuối */}
          <div className="mt-12 flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-gradient-to-br from-cvr-charcoal to-cvr-ink p-8 text-center sm:p-12">
            <h2 className="font-serif text-2xl font-bold text-white sm:text-3xl">Sẵn sàng bắt đầu cùng Coastal Land?</h2>
            <p className="max-w-xl text-sm text-white/65">Liên hệ đội ngũ của chúng tôi để được tư vấn miễn phí và nhận giải pháp phù hợp nhất.</p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
              <Link href={l.ctaHref} className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-cvr-ink transition hover:bg-white/90">{l.ctaLabel}</Link>
              <a href="tel:0905123456" className="rounded-lg border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">Hotline: 0905 123 456</a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
