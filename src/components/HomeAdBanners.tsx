import Image from "next/image";
import Link from "next/link";
import { asset } from "@/lib/asset";
import { HOME_AD_DEFAULT, type HomeAdData } from "@/lib/siteContent";

// ===== 2 banner cuối trang chủ — chuẩn Apple, GỌN, KHUNG VUÔNG =====
// PC: khung compact (h 300/340) · chữ trái · ảnh phải TRÀN khung (lấp khoảng trống).
// Chữ 1 MÀU (không tách dòng vàng). CTA không xuống dòng (whitespace-nowrap).
// Banner 01 (sáng): ĐĂNG TIN — nút đen. Banner 02 (tối #0b0b0d): APP — 2 nút store (iOS + Android), iPhone tràn.

const DARK_BODY = "text-[#a1a1a6]";
const DARK_FAINT = "text-[#86868b]";
const APPLE_BLUE = "bg-[#0071e3] hover:bg-[#0077ed]";

const ArrowRight = (
  <svg className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

// Lợi ích ngắn — chỉ hiện trên PC để lấp khoảng trống dọc (mobile chật, không dùng)
const SELLER_FEATURES = [
  "Đăng tin nhanh chỉ trong vài phút",
  "Kiểm duyệt & hiển thị ngay trong ngày",
  "Tiếp cận đúng khách mua tại Miền Trung",
];
const APP_FEATURES = [
  "Tìm kiếm & lọc bất động sản thông minh",
  "Lưu tin yêu thích & so sánh nhanh",
  "Nhận thông báo dự án, tin mới phù hợp",
];

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2.6} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

// ── Banner 01 — ĐĂNG TIN (sáng) ──
export function AdBannerSeller({ data = HOME_AD_DEFAULT.seller }: { data?: HomeAdData["seller"] }) {
  return (
    <section className="section-edge bg-white">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <div className="relative overflow-hidden bg-cvr-surface shadow-lux">

          {/* ===== MOBILE: nội dung TRÊN 1 hình nền · cao 210px ===== */}
          <div className="relative h-[210px] md:hidden">
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
            <div className="absolute inset-x-0 bottom-0 px-5 pb-5">
              <h2 className="text-balance text-[17px] font-semibold leading-[1.15] tracking-tight text-cvr-ink">
                {data.titleLine1}
                <br />
                {data.titleLine2}
              </h2>
              <p className="mt-1 max-w-[34ch] text-[12px] leading-relaxed text-cvr-muted">
                {data.body}
              </p>
              <Link
                href={data.ctaHref}
                className="group mt-2.5 inline-flex min-h-[38px] w-fit items-center gap-1.5 whitespace-nowrap rounded-full bg-cvr-ink px-4 py-1.5 text-[12px] font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-black"
              >
                {data.ctaLabel}
                {ArrowRight}
              </Link>
            </div>
          </div>

          {/* ===== DESKTOP: khung compact · chữ trái · ảnh phải ===== */}
          <div className="relative hidden md:block md:h-[300px] lg:h-[340px]">
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
              <h2 className="text-balance text-[21px] font-semibold leading-[1.12] tracking-tight text-cvr-ink lg:text-[26px]">
                {data.titleLine1}
                <br />
                {data.titleLine2}
              </h2>
              <p className="mt-2.5 max-w-sm text-[13px] leading-relaxed text-cvr-muted lg:text-sm">
                {data.body}
              </p>
              <ul className="mt-4 space-y-2">
                {SELLER_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-[13px] font-medium text-cvr-ink/80 lg:text-sm">
                    <CheckIcon className="h-4 w-4 shrink-0 text-cvr-gold-ink" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={data.ctaHref}
                className="group mt-5 inline-flex min-h-[42px] w-fit items-center gap-1.5 whitespace-nowrap rounded-full bg-cvr-ink px-5 py-2.5 text-[13px] font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-black lg:text-sm"
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

// ── Banner 02 — ỨNG DỤNG (tối) ──
export function AdBannerApp({ data = HOME_AD_DEFAULT.app }: { data?: HomeAdData["app"] }) {
  return (
    <section className="section-edge bg-white">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <div className="relative overflow-hidden bg-[#0b0b0d] shadow-lux">

          {/* ===== MOBILE: chữ + 1 nút CTA bên TRÁI · iPhone TRÀN mép phải/đáy · cao 210px ===== */}
          <div className="grid h-[210px] grid-cols-[1fr_auto] items-center overflow-hidden md:hidden">
            <div className="min-w-0 pl-5 pr-1">
              <h2 className="text-balance text-[17px] font-semibold leading-[1.15] tracking-tight text-white">
                {data.titleLine1}
                <br />
                {data.titleLine2}
              </h2>
              <a
                href={data.ctaHref}
                className={`group mt-3 inline-flex min-h-[38px] w-fit items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-1.5 text-[12px] font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 ${APPLE_BLUE}`}
              >
                {data.ctaLabel}
                {ArrowRight}
              </a>
            </div>
            <div className="relative h-full">
              <Image
                src={asset(data.phones)}
                alt="Ứng dụng COASTAL LAND trên iPhone 17 Pro Max"
                width={807}
                height={859}
                sizes="60vw"
                priority
                className="absolute bottom-0 right-0 h-auto w-[215px] max-w-none translate-x-5 translate-y-3"
              />
            </div>
          </div>

          {/* ===== DESKTOP: chữ trái + 2 CTA store · iPhone TRÀN trên/dưới, sát mép phải ===== */}
          <div className="relative hidden md:block md:h-[300px] lg:h-[340px]">
            {/* iPhone phóng to, tràn trên–dưới khung (card overflow-hidden cắt phần thừa) */}
            <Image
              src={asset(data.phones)}
              alt="Ứng dụng COASTAL LAND trên iPhone 17 Pro Max"
              width={807}
              height={859}
              sizes="480px"
              priority
              className="absolute right-0 top-1/2 w-auto max-w-none -translate-y-1/2 translate-x-[3%] md:h-[120%] lg:h-[126%]"
            />
            {/* Chữ trái */}
            <div className="absolute inset-0 flex max-w-[58%] flex-col justify-center px-10 lg:px-16">
              <h2 className="text-balance text-[21px] font-semibold leading-[1.12] tracking-tight text-white lg:text-[26px]">
                {data.titleLine1}
                <br />
                {data.titleLine2}
              </h2>
              <p className={`mt-2.5 max-w-md text-[13px] leading-relaxed lg:text-sm ${DARK_BODY}`}>
                {data.body}
              </p>
              <ul className="mt-4 space-y-2">
                {APP_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-[13px] font-medium text-white/75 lg:text-sm">
                    <CheckIcon className="h-4 w-4 shrink-0 text-cvr-gold-soft" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <StoreButton store="apple" href={data.appleHref} />
                <StoreButton store="google" href={data.googleHref} />
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

// Nút tải App Store / Google Play — nền tối, viền mảnh (Apple style)
function StoreButton({ store, href = "#" }: { store: "apple" | "google"; href?: string }) {
  return (
    <a
      href={href}
      className="flex min-h-[44px] items-center gap-2.5 rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-white/[0.12]"
    >
      {store === "apple" ? (
        <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M17.05 12.04c-.03-2.6 2.12-3.85 2.22-3.91-1.21-1.77-3.09-2.01-3.76-2.04-1.6-.16-3.12.94-3.93.94-.81 0-2.06-.92-3.39-.9-1.74.03-3.35 1.01-4.25 2.57-1.81 3.14-.46 7.78 1.3 10.32.86 1.24 1.89 2.64 3.23 2.59 1.3-.05 1.79-.84 3.36-.84 1.57 0 2.01.84 3.39.81 1.4-.02 2.29-1.27 3.15-2.52.99-1.44 1.4-2.84 1.42-2.91-.03-.01-2.72-1.04-2.75-4.13zM14.6 4.6c.72-.87 1.2-2.08 1.07-3.28-1.03.04-2.28.69-3.02 1.56-.66.77-1.24 2-1.08 3.18 1.15.09 2.33-.59 3.03-1.46z" /></svg>
      ) : (
        <svg className="h-6 w-6" viewBox="0 0 24 24"><path fill="#00d4ff" d="M3.6 2.4c-.3.3-.5.7-.5 1.2v16.8c0 .5.2.9.5 1.2l.1.1L13 12.1v-.2L3.7 2.3l-.1.1z" /><path fill="#ffce00" d="M16.3 15.4L13 12.1v-.2l3.3-3.3.1.1 3.9 2.2c1.1.6 1.1 1.7 0 2.3l-3.9 2.2-.1.1z" /><path fill="#ff3b30" d="M16.4 15.3L13 12 3.6 21.6c.4.4 1 .4 1.6.1l11.2-6.4" /><path fill="#00e676" d="M16.4 8.7L5.2 2.3c-.6-.3-1.2-.3-1.6.1L13 12l3.4-3.3z" /></svg>
      )}
      <span className="flex flex-col leading-tight text-left">
        <span className={`text-[10px] ${DARK_FAINT}`}>Tải về trên</span>
        <span className="text-[13px] font-semibold text-white">{store === "apple" ? "App Store" : "Google Play"}</span>
      </span>
    </a>
  );
}
