import Image from "next/image";
import Link from "next/link";
import { asset } from "@/lib/asset";
import { HOME_AD_DEFAULT, type HomeAdData } from "@/lib/siteContent";

// ===== 2 banner cuối trang chủ — chuẩn Apple, GỌN, KHUNG VUÔNG =====
// Tỷ lệ bám mẫu Apple: PC ~2.21:1 (aspect co giãn theo bề ngang), mobile giữ thẻ ngang 260px.
// Chữ 1 MÀU (không tách dòng vàng). Nút CTA 1 màu.
// Banner 01 (sáng #f5f5f7): ĐĂNG TIN — chữ trái · ảnh biển phải · nút đen.
// Banner 02 (tối #0b0b0d): APP — chữ trái + 1 nút CTA xanh · iPhone phải. KHÔNG QR, KHÔNG store buttons.

const DARK_BODY = "text-[#a1a1a6]";
const APPLE_BLUE = "bg-[#0071e3] hover:bg-[#0077ed]";

const ArrowRight = (
  <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

// ── Banner 01 — ĐĂNG TIN (sáng) ──
export function AdBannerSeller({ data = HOME_AD_DEFAULT.seller }: { data?: HomeAdData["seller"] }) {
  return (
    <section className="section-edge bg-white">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <div className="relative overflow-hidden bg-cvr-surface shadow-lux">

          {/* ===== MOBILE: nội dung TRÊN 1 hình nền · cao 260px ===== */}
          <div className="relative h-[260px] md:hidden">
            <Image
              src={asset(data.image)}
              alt="Bất động sản ven biển Duyên Hải Miền Trung"
              fill
              sizes="100vw"
              className="object-cover object-center"
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-cvr-surface via-cvr-surface/90 via-[55%] to-transparent"
              aria-hidden
            />
            <div className="absolute inset-x-0 bottom-0 px-5 pb-6">
              <h2 className="text-balance text-[20px] font-semibold leading-[1.14] tracking-tight text-cvr-ink">
                {data.titleLine1}
                <br />
                {data.titleLine2}
              </h2>
              <p className="mt-1.5 max-w-[34ch] text-[13px] leading-relaxed text-cvr-muted">
                {data.body}
              </p>
              <Link
                href={data.ctaHref}
                className="group mt-3.5 inline-flex min-h-[42px] w-fit items-center gap-2 rounded-full bg-cvr-ink px-5 py-2 text-[13px] font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-black"
              >
                {data.ctaLabel}
                {ArrowRight}
              </Link>
            </div>
          </div>

          {/* ===== DESKTOP: tỷ lệ 2.21:1 như mẫu 1 · chữ trái · ảnh phải ===== */}
          <div className="relative hidden md:block md:aspect-[1731/783]">
            <Image
              src={asset(data.image)}
              alt="Bất động sản ven biển Duyên Hải Miền Trung"
              fill
              sizes="1216px"
              className="object-cover object-[72%_center]"
            />
            <div
              className="absolute inset-0 bg-gradient-to-r from-cvr-surface from-[46%] via-cvr-surface/50 to-transparent"
              aria-hidden
            />
            <div className="absolute inset-0 flex max-w-[50%] flex-col justify-center px-10 lg:px-16">
              <h2 className="text-balance text-[26px] font-semibold leading-[1.12] tracking-tight text-cvr-ink lg:text-[34px]">
                {data.titleLine1}
                <br />
                {data.titleLine2}
              </h2>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-cvr-muted lg:text-[15px]">
                {data.body}
              </p>
              <Link
                href={data.ctaHref}
                className="group mt-6 inline-flex min-h-[46px] w-fit items-center gap-2 rounded-full bg-cvr-ink px-6 py-2.5 text-sm font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-black lg:text-[15px]"
              >
                {data.ctaLabel}
                {ArrowRight}
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

// ── Banner 02 — ỨNG DỤNG (tối, tối giản như mẫu 2) ──
export function AdBannerApp({ data = HOME_AD_DEFAULT.app }: { data?: HomeAdData["app"] }) {
  return (
    <section className="section-edge bg-white">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <div className="relative overflow-hidden bg-[#0b0b0d] shadow-lux">

          {/* ===== MOBILE: chữ + 1 nút CTA bên TRÁI · iPhone bên PHẢI · cao 260px ===== */}
          <div className="grid h-[260px] grid-cols-[1fr_auto] items-center overflow-hidden md:hidden">
            <div className="pl-5 pr-1">
              <h2 className="text-balance text-[20px] font-semibold leading-[1.15] tracking-tight text-white">
                {data.titleLine1}
                <br />
                {data.titleLine2}
              </h2>
              <a
                href={data.ctaHref}
                className={`group mt-4 inline-flex min-h-[42px] w-fit items-center gap-2 rounded-full px-5 py-2 text-[13px] font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 ${APPLE_BLUE}`}
              >
                {data.ctaLabel}
                {ArrowRight}
              </a>
            </div>
            <div className="flex h-full items-center justify-end">
              <Image
                src={asset(data.phones)}
                alt="Ứng dụng COASTAL LAND trên iPhone 17 Pro Max"
                width={807}
                height={859}
                sizes="55vw"
                priority
                className="h-auto w-[190px] max-w-none translate-x-3"
              />
            </div>
          </div>

          {/* ===== DESKTOP: tỷ lệ 2.22:1 như mẫu 2 · chữ trái + 1 nút CTA · iPhone phải ===== */}
          <div className="relative hidden md:block md:aspect-[1767/795]">
            {/* iPhone phải — cao gần kín khung, tràn nhẹ mép phải */}
            <div className="absolute inset-y-0 right-0 flex items-center pr-8 lg:pr-14">
              <Image
                src={asset(data.phones)}
                alt="Ứng dụng COASTAL LAND trên iPhone 17 Pro Max"
                width={807}
                height={859}
                sizes="360px"
                priority
                className="h-[86%] w-auto"
              />
            </div>
            {/* Chữ trái */}
            <div className="absolute inset-0 flex max-w-[55%] flex-col justify-center px-10 lg:px-16">
              <h2 className="text-balance text-[26px] font-semibold leading-[1.12] tracking-tight text-white lg:text-[34px]">
                {data.titleLine1}
                <br />
                {data.titleLine2}
              </h2>
              <p className={`mt-3 max-w-md text-sm leading-relaxed lg:text-[15px] ${DARK_BODY}`}>
                {data.body}
              </p>
              <a
                href={data.ctaHref}
                className={`group mt-6 inline-flex min-h-[46px] w-fit items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 lg:text-[15px] ${APPLE_BLUE}`}
              >
                {data.ctaLabel}
                {ArrowRight}
              </a>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
