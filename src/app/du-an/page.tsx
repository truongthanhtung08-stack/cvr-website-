import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BannerCarousel from "@/components/BannerCarousel";
import { projects } from "@/lib/data";
import { projectBanners } from "@/lib/banners";

export const metadata: Metadata = {
  title: "Dự án bất động sản Đà Nẵng, Huế & Miền Trung | Coastal Land",
  description: "Danh sách dự án căn hộ, khu đô thị, nghỉ dưỡng tại Miền Trung — tiến độ, giá bán và tiện ích đầy đủ.",
};

export default function DuAnPage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-white">
        <div className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 lg:px-8">
          <nav className="mb-3 flex items-center gap-1.5 text-xs text-cvr-muted">
            <Link href="/" className="hover:text-cvr-ink">Trang chủ</Link>
            <span>/</span>
            <span className="text-cvr-body">Dự án</span>
          </nav>

          {/* Banner quảng cáo dự án (carousel, không giới hạn slide) */}
          <BannerCarousel banners={projectBanners} />

          <h1 className="mt-8 font-serif text-2xl font-bold text-cvr-ink sm:text-3xl">Dự án nổi bật</h1>
          <p className="mt-1.5 text-sm text-cvr-muted">Các dự án căn hộ, khu đô thị và nghỉ dưỡng đáng chú ý tại Miền Trung.</p>

          <div className="mt-6 flex flex-col gap-4">
            {projects.map((p) => (
              <Link
                key={p.slug}
                href={`/du-an/${p.slug}`}
                className="group relative flex gap-3 overflow-hidden border border-cvr-line bg-white p-2.5 transition-shadow hover:border-cvr-gold/40 hover:shadow-md sm:gap-4 sm:p-3"
              >
                {/* Ảnh trái */}
                <div className="relative aspect-[4/3] w-32 shrink-0 overflow-hidden bg-cvr-surface sm:w-60 md:w-72">
                  <Image src={p.image} alt={p.name} fill sizes="(max-width:640px) 33vw, 288px" className="object-cover transition-transform duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]" />
                  <span className="absolute left-2 top-2 bg-cvr-gold px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-cvr-ink">{p.status}</span>
                </div>
                {/* Thông tin phải */}
                <div className="flex min-w-0 flex-1 flex-col py-1 pr-1">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="line-clamp-2 font-semibold leading-snug text-cvr-ink transition-colors group-hover:text-cvr-gold-ink sm:text-lg">{p.name}</h3>
                    <span className="shrink-0 text-base font-medium text-cvr-ink sm:text-xl">{p.priceFrom}</span>
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-xs text-cvr-muted">
                    <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <span className="truncate">{p.location}</span>
                  </p>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-cvr-muted">{p.type} · Chủ đầu tư {p.developer}. {p.overview[0]}</p>
                  <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-3">
                    {p.amenities.slice(0, 3).map((a) => (
                      <span key={a} className="border border-cvr-line bg-cvr-surface px-2 py-0.5 text-[11px] text-cvr-body">{a}</span>
                    ))}
                  </div>
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
