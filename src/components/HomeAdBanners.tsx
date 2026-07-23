import Image from "next/image";
import Link from "next/link";
import { asset } from "@/lib/asset";
import { HOME_AD_DEFAULT, type HomeAdData } from "@/lib/siteContent";

// ===== 2 banner quảng cáo cuối trang chủ — bám mẫu Banner Mẫu 6 =====
// (D:\Coastal Land\Lập trình website\Banner\Banner Mẫu 6.png + spec Re*.txt)
// Banner 01 (sáng): ảnh villa FULL khung — khoảng trắng của ảnh (trời/biển) hoà liền mạch
// với panel chữ qua gradient trắng, KHÔNG có ranh giới 2 khối. Chiều cao GỌN hợp nhịp trang.
// Banner 02 (tối #111): 3 khối như mẫu — iPhone · nội dung · [vạch dọc] QR + nút store,
// vệt sáng vàng mờ dưới trái. Chữ nền tối dùng MÀU ĐẶC (không opacity — khỏi xỉn).

const DARK_BODY = "text-[#a1a1a6]";
const DARK_FAINT = "text-[#86868b]";

const ArrowRight = (
  <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

// ── Banner 01 — ĐĂNG TIN: ảnh liền mạch, chữ trên vùng sáng bên trái ──
export function AdBannerSeller({ data = HOME_AD_DEFAULT.seller }: { data?: HomeAdData["seller"] }) {
  return (
    <section className="section-edge bg-white">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        {/* Khung GỌN (3.5:1) trên desktop — ảnh PHỦ KÍN khung (cover), không hụt 2 bên */}
        <div className="relative overflow-hidden rounded-none shadow-lux md:aspect-[7/2]">
          <Image
            src={asset(data.image)}
            alt="Villa ven biển Duyên Hải Miền Trung lúc hoàng hôn"
            fill
            sizes="(max-width: 1280px) 100vw, 1216px"
            className="object-cover"
          />
          {/* Gradient trắng từ trái — khoảng trắng liền mạch với ảnh để chữ đọc rõ */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/85 via-white/35 to-transparent" aria-hidden />

          {/* Nội dung — gọn, canh giữa dọc bên trái */}
          <div className="relative flex min-h-[240px] flex-col justify-center px-8 py-8 sm:px-12 md:absolute md:inset-y-0 md:min-h-0 lg:px-14">
            <h2 className="text-balance text-2xl font-semibold leading-[1.12] tracking-tight text-cvr-ink sm:text-3xl">
              {data.titleLine1}
              <br />
              <span className="text-cvr-gold-ink">{data.titleLine2}</span>
            </h2>
            <span className="mt-4 h-px w-12 bg-cvr-gold-ink/50" aria-hidden />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-cvr-body">
              {data.body}
            </p>
            <Link
              href={data.ctaHref}
              className="group mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-cvr-ink px-6 py-3 text-sm font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-black"
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

// ── Banner 02 — ỨNG DỤNG: 3 khối như mẫu (iPhone · nội dung · vạch dọc + QR/store) ──
export function AdBannerApp({ data = HOME_AD_DEFAULT.app }: { data?: HomeAdData["app"] }) {
  return (
    <section className="section-edge bg-white">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-none bg-[#0b0b0d] shadow-lux">
          {/* Vệt sáng vàng cong mờ — dưới trái (như mẫu) */}
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-cvr-gold/[0.14] blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -bottom-32 left-24 h-56 w-96 rotate-12 rounded-full bg-cvr-gold/[0.07] blur-3xl" aria-hidden />

          <div className="relative grid items-center gap-6 px-8 py-6 sm:px-12 md:grid-cols-[auto_1fr_auto] md:gap-8 lg:px-14">
            {/* iPhone thật (cắt từ Banner Mẫu 6) — 2 máy, app COASTAL LAND, trôi nổi nhẹ */}
            <div className="order-2 flex items-center justify-center md:order-1">
              <Image
                src={asset(data.phones)}
                alt="Ứng dụng COASTAL LAND trên iPhone"
                width={300}
                height={289}
                className="animate-float w-[220px] sm:w-[260px] [mask-image:radial-gradient(ellipse_75%_75%_at_50%_48%,black_62%,transparent_98%)]"
              />
            </div>

            {/* Nội dung — giữa */}
            <div className="order-1 min-w-0 md:order-2">
              <h2 className="text-balance text-2xl font-semibold leading-[1.12] tracking-tight text-white sm:text-3xl">
                {data.titleLine1}
                <br />
                <span className="text-cvr-gold-soft">{data.titleLine2}</span>
              </h2>
              <span className="mt-4 block h-px w-12 bg-cvr-gold-soft/40" aria-hidden />
              <p className={`mt-4 max-w-md text-sm leading-relaxed ${DARK_BODY}`}>
                {data.body}
              </p>
              <a
                href={data.ctaHref}
                className="group mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-cvr-gold px-6 py-3 text-sm font-semibold text-cvr-ink transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-cvr-gold-soft"
              >
                {data.ctaLabel}
                {ArrowRight}
              </a>
            </div>

            {/* QR + nút store — phải, có VẠCH DỌC mảnh phân cách (như mẫu) */}
            <div className="order-3 flex flex-col gap-3.5 md:border-l md:border-white/10 md:pl-10">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-white p-2">
                  <Image
                    src={asset(data.qr)}
                    alt="Quét mã QR để tải ứng dụng COASTAL LAND"
                    width={64}
                    height={64}
                    className="h-16 w-16"
                  />
                </div>
                <p className={`max-w-[6.5rem] text-xs leading-snug ${DARK_BODY}`}>Quét mã để tải ứng dụng</p>
              </div>
              <StoreButton store="apple" href={data.appleHref} />
              <StoreButton store="google" href={data.googleHref} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Nút tải App Store / Google Play — nền tối, viền mảnh (như mẫu)
function StoreButton({ store, href = "#" }: { store: "apple" | "google"; href?: string }) {
  return (
    <a
      href={href}
      className="flex items-center gap-2.5 rounded-xl border border-white/12 bg-white/[0.06] px-4 py-2 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-white/10"
    >
      {store === "apple" ? (
        <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M17.05 12.04c-.03-2.6 2.12-3.85 2.22-3.91-1.21-1.77-3.09-2.01-3.76-2.04-1.6-.16-3.12.94-3.93.94-.81 0-2.06-.92-3.39-.9-1.74.03-3.35 1.01-4.25 2.57-1.81 3.14-.46 7.78 1.3 10.32.86 1.24 1.89 2.64 3.23 2.59 1.3-.05 1.79-.84 3.36-.84 1.57 0 2.01.84 3.39.81 1.4-.02 2.29-1.27 3.15-2.52.99-1.44 1.4-2.84 1.42-2.91-.03-.01-2.72-1.04-2.75-4.13zM14.6 4.6c.72-.87 1.2-2.08 1.07-3.28-1.03.04-2.28.69-3.02 1.56-.66.77-1.24 2-1.08 3.18 1.15.09 2.33-.59 3.03-1.46z" /></svg>
      ) : (
        <svg className="h-6 w-6" viewBox="0 0 24 24"><path fill="#00d4ff" d="M3.6 2.4c-.3.3-.5.7-.5 1.2v16.8c0 .5.2.9.5 1.2l.1.1L13 12.1v-.2L3.7 2.3l-.1.1z" /><path fill="#ffce00" d="M16.3 15.4L13 12.1v-.2l3.3-3.3.1.1 3.9 2.2c1.1.6 1.1 1.7 0 2.3l-3.9 2.2-.1.1z" /><path fill="#ff3b30" d="M16.4 15.3L13 12 3.6 21.6c.4.4 1 .4 1.6.1l11.2-6.4" /><path fill="#00e676" d="M16.4 8.7L5.2 2.3c-.6-.3-1.2-.3-1.6.1L13 12l3.4-3.3z" /></svg>
      )}
      <span className="flex flex-col leading-tight">
        <span className={`text-[10px] ${DARK_FAINT}`}>{store === "apple" ? "Tải về trên" : "TẢI TRÊN"}</span>
        <span className="text-sm font-semibold text-white">{store === "apple" ? "App Store" : "Google Play"}</span>
      </span>
    </a>
  );
}

