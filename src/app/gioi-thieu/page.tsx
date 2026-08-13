import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { asset } from "@/lib/asset";
import { getAbout } from "@/lib/siteContent";

export const metadata: Metadata = {
  title: "Giới thiệu | Coastal Land",
  description:
    "Coastal Land (coastalland.vn) — nền tảng công nghệ và cổng thông tin Bất động sản trực tuyến hàng đầu tại Việt Nam. Hệ thống ưu việt giúp khách hàng kết nối và thực hiện giao dịch dễ dàng.",
};

// Icon "giá trị cốt lõi" giữ trong code, map theo thứ tự với values[] admin nhập.
const VALUE_ICONS = [
  "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  "M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a3 3 0 10-2.5-4.5",
];

// Khối ảnh có chú thích (dùng lại nhiều nơi) — vuông cạnh kiểu Apple mới.
function Figure({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-cvr-surface ${className}`}>
      <Image src={asset(src)} alt={alt} fill sizes="(max-width:1024px) 100vw, 50vw" className="object-cover" />
    </div>
  );
}

export default async function GioiThieuPage() {
  // Nội dung admin sửa được (site_content key 'about') — chưa nhập → mặc định trong code.
  const about = await getAbout();

  return (
    <>
      <Header />
      <main className="flex-1 bg-white">
        {/* ── Hero giới thiệu ──
             KHUNG THEO TỶ LỆ CỐ ĐỊNH (không dùng vh) để ảnh luôn hiện đúng phần
             mong muốn: PC 3:1 · điện thoại 16:10.
             → Ảnh cần chuẩn bị: TỶ LỆ 3:1, khuyến nghị 3000×1000 (tối thiểu 1920×640).
             Khung cũ (38vh, tối đa 400px) hoá ra ~4.8:1 nên cắt mất 2/3 ảnh 16:9,
             đường chân trời bị xén — nay 3:1 giữ được trọn dải biển. */}
        <section className="relative isolate">
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-cvr-ink sm:aspect-[3/1] sm:max-h-[560px]">
            <Image
              src={asset(about.heroImage)}
              alt="Không gian làm việc Coastal Land bên bờ biển Duyên hải Miền Trung"
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </div>
        </section>

        {/* ── Câu chuyện ── */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cvr-blue-ink">{about.story.eyebrow}</p>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-cvr-ink sm:text-3xl">
                {about.story.title}
              </h1>
              <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-cvr-body">
                {about.story.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>
            <Figure src={about.story.image} alt="Văn phòng Coastal Land" className="aspect-[16/10] w-full" />
          </div>
        </section>

        {/* ── Tầm nhìn & Sứ mệnh — có ICON cho chuyên nghiệp ── */}
        <section className="bg-cvr-surface">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
              <div className="border border-cvr-line bg-white p-6 shadow-lux sm:p-8">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cvr-blue/10 text-cvr-blue-ink">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
                    <circle cx="12" cy="12" r="3.2" />
                  </svg>
                </span>
                <h3 className="mt-4 text-lg font-semibold tracking-tight text-cvr-ink">Tầm nhìn</h3>
                <p className="mt-2.5 text-[15px] leading-relaxed text-cvr-body">
                  {about.vision}
                </p>
              </div>
              <div className="border border-cvr-line bg-white p-6 shadow-lux sm:p-8">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cvr-gold/10 text-cvr-gold-ink">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="8.5" />
                    <circle cx="12" cy="12" r="4.6" />
                    <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
                  </svg>
                </span>
                <h3 className="mt-4 text-lg font-semibold tracking-tight text-cvr-ink">Sứ mệnh</h3>
                <p className="mt-2.5 text-[15px] leading-relaxed text-cvr-body">
                  {about.mission}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Giá trị cốt lõi ── */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cvr-blue-ink">Giá trị cốt lõi</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-cvr-ink sm:text-3xl">
              Điều làm nên Coastal Land
            </h2>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {about.values.map((v, i) => (
              <div key={i} className="border border-cvr-line bg-white p-6 shadow-lux transition hover:-translate-y-1 hover:border-cvr-blue/40">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cvr-blue/10 text-cvr-blue-ink">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={VALUE_ICONS[i % VALUE_ICONS.length]} />
                  </svg>
                </span>
                <h3 className="mt-4 font-semibold text-cvr-ink">{v.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-cvr-muted">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Số liệu: ĐÃ BỎ theo yêu cầu (file V3 10.08.2026).
             Dữ liệu stats/statsImage vẫn còn trong admin — chưa xoá, chỉ không hiển thị. ── */}

        {/* ── Thị trường Miền Trung ── */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
            <Figure src={about.market.image} alt="Không gian ven biển Duyên hải Miền Trung" className="order-2 aspect-[16/10] w-full lg:order-1" />
            <div className="order-1 lg:order-2">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cvr-blue-ink">{about.market.eyebrow}</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-cvr-ink sm:text-3xl">
                {about.market.title}
              </h2>
              <p className="mt-5 text-[15px] leading-relaxed text-cvr-body">
                {about.market.desc}
              </p>
              <Link
                href={about.market.ctaHref}
                className="mt-6 inline-flex min-h-[48px] items-center gap-2 rounded-full bg-cvr-blue px-6 text-sm font-semibold text-white shadow-[0_10px_26px_rgba(0,113,227,0.28)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-cvr-blue-ink"
              >
                {about.market.ctaLabel}
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </Link>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="border-t border-cvr-line bg-cvr-surface">
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-14 text-center sm:gap-5 sm:px-6 sm:py-16 lg:px-8">
            <h2 className="max-w-2xl text-2xl font-semibold tracking-tight text-cvr-ink sm:text-3xl">
              {about.cta.title}
            </h2>
            <p className="max-w-xl text-[15px] text-cvr-muted">
              {about.cta.desc}
            </p>
            {/* CTA: viên thuốc, cao tối thiểu 48px cho dễ chạm trên điện thoại;
                mobile 2 nút TRÀN NGANG bằng nhau, PC nằm cạnh nhau canh giữa. */}
            <div className="mt-1 flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
              <Link
                href={about.cta.primaryHref}
                className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-cvr-blue px-7 text-sm font-semibold text-white shadow-[0_10px_26px_rgba(0,113,227,0.28)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-cvr-blue-ink"
              >
                {about.cta.primaryLabel}
              </Link>
              <Link
                href={about.cta.secondaryHref}
                className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-cvr-line bg-white px-7 text-sm font-semibold text-cvr-ink transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:border-cvr-ink"
              >
                {about.cta.secondaryLabel}
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
