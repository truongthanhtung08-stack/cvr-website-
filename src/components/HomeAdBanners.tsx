import Image from "next/image";
import Link from "next/link";
import { asset } from "@/lib/asset";
import { HOME_AD_DEFAULT, type HomeAdData } from "@/lib/siteContent";

// ===== 2 banner cuối trang chủ — chuẩn Apple, GỌN, KHUNG VUÔNG =====
// Nguyên tắc: một mặt nền liền mạch, chuyển màu mềm, KHÔNG chia đôi khô cứng.
// Banner 01 (sáng #f5f5f7): ĐĂNG TIN — ảnh biển tan mềm vào vùng chữ.
// Banner 02 (tối #0b0b0d): APP — cụm iPhone 17 Pro Max THẬT (ảnh nền trong suốt,
//   cắt từ "Mockup đt 6"), đặt SÁT nội dung. KHÔNG mask, KHÔNG hiệu ứng trôi.

const DARK_BODY = "text-[#a1a1a6]";
const DARK_FAINT = "text-[#86868b]";

const ArrowRight = (
  <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

// ── Banner 01 — ĐĂNG TIN ──
export function AdBannerSeller({ data = HOME_AD_DEFAULT.seller }: { data?: HomeAdData["seller"] }) {
  return (
    <section className="section-edge bg-white">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden bg-cvr-surface shadow-lux">
          <Image
            src={asset(data.image)}
            alt="Bất động sản ven biển Duyên Hải Miền Trung"
            fill
            sizes="(max-width: 768px) 100vw, 1216px"
            className="object-cover object-[72%_center]"
          />
          {/* Lớp phủ tan mềm — mobile phủ dọc · desktop phủ ngang. Không mép cứng. */}
          <div
            className="absolute inset-0 bg-gradient-to-t from-cvr-surface via-cvr-surface/85 to-cvr-surface/10 md:bg-gradient-to-r md:from-cvr-surface md:from-[46%] md:via-cvr-surface/50 md:to-transparent"
            aria-hidden
          />
          {/* Nội dung chiếm đúng NỬA khung — cân với nửa ảnh bên phải */}
          <div className="relative flex min-h-[270px] flex-col justify-end px-6 pb-8 pt-28 sm:px-10 md:min-h-[290px] md:max-w-[50%] md:justify-center md:py-10 lg:h-[320px] lg:px-14">
            <h2 className="text-balance text-[19px] font-semibold leading-[1.12] tracking-tight text-cvr-ink sm:text-[24px] lg:text-[29px]">
              {data.titleLine1}
              <br />
              <span className="text-cvr-gold-ink">{data.titleLine2}</span>
            </h2>
            <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-cvr-muted sm:text-sm">
              {data.body}
            </p>
            <Link
              href={data.ctaHref}
              className="group mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-cvr-ink px-5 py-2.5 text-[13px] font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-black sm:text-sm"
            >
              {data.ctaLabel}
              {ArrowRight}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Banner 02 — ỨNG DỤNG ──
export function AdBannerApp({ data = HOME_AD_DEFAULT.app }: { data?: HomeAdData["app"] }) {
  return (
    <section className="section-edge bg-white">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden bg-[#0b0b0d] shadow-lux">
          {/* Nội dung + cụm máy đi thành MỘT CẶP, canh giữa → sát nhau, cân hai bên */}
          {/* Lưới NỬA–NỬA: nội dung nửa trái · cụm máy nửa phải, gặp nhau giữa khung */}
          <div className="relative grid items-center px-6 pb-9 pt-9 sm:px-10 md:h-[290px] md:grid-cols-2 md:gap-8 md:px-10 md:py-0 lg:h-[320px] lg:gap-10 lg:px-14">
            {/* ĐẢO so với Banner 1: cụm máy nửa TRÁI · nội dung nửa PHẢI (nhịp xen kẽ) */}
            <div className="order-2 w-full md:order-2 md:w-auto md:max-w-[470px] md:justify-self-end">
              <h2 className="text-balance text-[19px] font-semibold leading-[1.12] tracking-tight text-white sm:text-[24px] lg:text-[29px]">
                {data.titleLine1}
                <br />
                <span className="text-cvr-gold-soft">{data.titleLine2}</span>
              </h2>
              <p className={`mt-3 max-w-md text-[13px] leading-relaxed sm:text-sm ${DARK_BODY}`}>
                {data.body}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2.5">
                <StoreButton store="apple" href={data.appleHref} />
                <StoreButton store="google" href={data.googleHref} />
              </div>
            </div>

            {/* Cụm iPhone 17 Pro Max THẬT — cao BẰNG khung banner (chạm mép trên–dưới).
                Nền ảnh trong suốt: KHÔNG mask, KHÔNG hiệu ứng, KHÔNG bọc Reveal. */}
            <div className="order-1 mb-7 flex min-w-0 justify-center md:order-1 md:mb-0 md:justify-start md:pl-8 lg:pl-12">
              <Image
                src={asset(data.phones)}
                alt="Ứng dụng COASTAL LAND trên iPhone 17 Pro Max"
                width={807}
                height={859}
                sizes="(max-width: 768px) 62vw, 300px"
                priority
                /* Chiều cao CỐ ĐỊNH, PHÓNG MAX trong khung (chừa 6px mỗi bên cho khỏi tràn) */
                className="h-auto w-[220px] max-w-full sm:w-[260px] md:h-[278px] md:w-auto lg:h-[308px]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Nút tải App Store / Google Play — nền tối, viền mảnh
function StoreButton({ store, href = "#" }: { store: "apple" | "google"; href?: string }) {
  return (
    <a
      href={href}
      className="flex items-center gap-2.5 rounded-xl border border-white/12 bg-white/[0.06] px-3.5 py-2 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-white/10"
    >
      {store === "apple" ? (
        <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M17.05 12.04c-.03-2.6 2.12-3.85 2.22-3.91-1.21-1.77-3.09-2.01-3.76-2.04-1.6-.16-3.12.94-3.93.94-.81 0-2.06-.92-3.39-.9-1.74.03-3.35 1.01-4.25 2.57-1.81 3.14-.46 7.78 1.3 10.32.86 1.24 1.89 2.64 3.23 2.59 1.3-.05 1.79-.84 3.36-.84 1.57 0 2.01.84 3.39.81 1.4-.02 2.29-1.27 3.15-2.52.99-1.44 1.4-2.84 1.42-2.91-.03-.01-2.72-1.04-2.75-4.13zM14.6 4.6c.72-.87 1.2-2.08 1.07-3.28-1.03.04-2.28.69-3.02 1.56-.66.77-1.24 2-1.08 3.18 1.15.09 2.33-.59 3.03-1.46z" /></svg>
      ) : (
        <svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="#00d4ff" d="M3.6 2.4c-.3.3-.5.7-.5 1.2v16.8c0 .5.2.9.5 1.2l.1.1L13 12.1v-.2L3.7 2.3l-.1.1z" /><path fill="#ffce00" d="M16.3 15.4L13 12.1v-.2l3.3-3.3.1.1 3.9 2.2c1.1.6 1.1 1.7 0 2.3l-3.9 2.2-.1.1z" /><path fill="#ff3b30" d="M16.4 15.3L13 12 3.6 21.6c.4.4 1 .4 1.6.1l11.2-6.4" /><path fill="#00e676" d="M16.4 8.7L5.2 2.3c-.6-.3-1.2-.3-1.6.1L13 12l3.4-3.3z" /></svg>
      )}
      <span className="flex flex-col leading-tight">
        <span className={`text-[9px] ${DARK_FAINT}`}>{store === "apple" ? "Tải về trên" : "TẢI TRÊN"}</span>
        <span className="text-[13px] font-semibold text-white">{store === "apple" ? "App Store" : "Google Play"}</span>
      </span>
    </a>
  );
}
