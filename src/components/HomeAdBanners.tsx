import Image from "next/image";
import Link from "next/link";
import { asset } from "@/lib/asset";
import { HOME_AD_DEFAULT, type HomeAdData } from "@/lib/siteContent";

// ===== BANNER CUỐI TRANG CHỦ — GỘP 2 BANNER THÀNH 1 =====
// Theo mẫu "Demo 2" (file 10.08.2026): nền sáng "DT banner 1" · chữ + CTA bên TRÁI
// · iPhone bên PHẢI NGHIÊNG HƯỚNG VỀ PHÍA CHỮ · symbol logo trắng làm watermark.
// Ảnh nguồn: public/images/banner-app-bg.jpg (DT banner 1)
//          · public/images/app-phone-2026.png (mockup Final/3 — viền mỏng, ĐỘ NGHIÊNG
//            lớn hơn nên rộng hơn, lấp khoảng hở giữa chữ và máy trên bản PC).

const HEADING = "COASTAL LAND";
const TAGLINE = "Kết nối và tiếp cận khách hàng";

const ArrowRight = (
  <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <rect x="7" y="2.5" width="10" height="19" rx="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" d="M11 18.6h2" />
    </svg>
  );
}

// Khối "Tải ứng dụng" + 2 nút store — CHỈ dùng ở bản PC
// (mobile đã bỏ khối này theo yêu cầu, chỉ còn CTA + 2 nút tải app).
function AppBlock({ appleHref, googleHref }: { appleHref?: string; googleHref?: string }) {
  return (
    <div className="mt-7">
      <div className="mb-5 h-px w-full max-w-sm bg-cvr-ink/12" aria-hidden />
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/70 text-cvr-blue shadow-sm ring-1 ring-cvr-ink/5">
          <PhoneIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-[16px] font-semibold text-cvr-ink">Tải ứng dụng</p>
          <p className="text-[13px] text-cvr-muted">Khám phá bất động sản mọi lúc, mọi nơi</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <StoreButton store="apple" href={appleHref} />
        <StoreButton store="google" href={googleHref} />
      </div>
    </div>
  );
}

export function AdBannerAll({ data = HOME_AD_DEFAULT }: { data?: HomeAdData }) {
  const cta = data.seller;
  const app = data.app;

  return (
    <section className="section-edge bg-white">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <div className="relative -mx-4 overflow-hidden bg-[#dceaf6] shadow-lux sm:mx-0">

          {/* ── Nền chung (mẫu "DT banner 1") ── */}
          <Image
            src={asset("/images/banner-app-bg.jpg")}
            alt=""
            aria-hidden
            fill
            sizes="(max-width: 640px) 100vw, 1216px"
            className="object-cover object-[68%_center] md:object-[60%_center]"
          />

          {/* Symbol logo TRẮNG — watermark DUY NHẤT: to, giữa banner, dưới điện thoại.
              (Ảnh nền "Backgound.png" đã chọn loại sạch, không có watermark chìm sẵn) */}
          <Image
            src={asset("/logo/symbol-white.svg")}
            alt=""
            aria-hidden
            width={560}
            height={560}
            // CHÌM hẳn (opacity thấp) — để KHÔNG bị đọc thành logo thứ 2 bên cạnh
            // logo COASTAL LAND đang hiện trên màn hình điện thoại.
            className="pointer-events-none absolute left-[52%] top-1/2 h-[64%] w-auto -translate-x-1/2 -translate-y-1/2 opacity-[0.16] md:left-[56%] md:h-[86%] md:opacity-[0.18]"
          />

          {/* ═══ ĐIỆN THOẠI ═══
              Màn rộng (≥1280px) dùng 2 máy khoe 2 màn hình khác nhau (Dự án + Trang chủ)
              — lấp trọn khoảng giữa chữ và mép phải. Màn hẹp/mobile chỉ 1 máy cho gọn.
              Máy SAU vẽ trước để nằm dưới máy TRƯỚC. */}
          <Image
            src={asset("/images/app-phone-2026-b.png")}
            alt="Màn hình Dự án trên ứng dụng COASTAL LAND"
            width={681}
            height={1318}
            sizes="240px"
            // Chỉ hiện từ màn ≥1280px — hẹp hơn thì máy thứ 2 sẽ đè lên chữ.
            className="pointer-events-none absolute -bottom-[4%] right-[28.5%] hidden h-[104%] w-auto max-w-none xl:block"
          />
          <Image
            src={asset("/images/app-phone-2026.png")}
            alt="Ứng dụng COASTAL LAND trên iPhone"
            width={796}
            height={1387}
            sizes="(max-width: 768px) 44vw, 420px"
            priority
            // Máy cao trọn khung, chỉ khuyết nhẹ phần đáy — đúng kiểu mẫu Demo 2.
            // Đỉnh máy sát mép trên khung, chỉ khuyết phần đáy (bottom = 100% − chiều cao).
            // PC: 2 máy lùi vào trong (không dính mép banner) → chữ và máy đứng gần
            // nhau, không hở khoảng trống ở giữa.
            className="pointer-events-none absolute -bottom-[36%] right-[2%] h-[136%] w-auto max-w-none md:-bottom-[32%] md:right-[9%] md:h-[132%]"
          />

          {/* ═══ NỘI DUNG BÊN TRÁI ═══ */}
          {/* MOBILE — KHÔNG chữ tiêu đề, KHÔNG khối "Tải ứng dụng": điện thoại là
              tâm điểm (cao 128% khung), bên trái chỉ giữ CTA + 2 nút tải app. */}
          <div className="relative flex h-[230px] w-[50%] flex-col justify-center gap-2 px-3.5 md:hidden">
            <Link
              href={cta.ctaHref}
              className="inline-flex min-h-[42px] w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-cvr-blue px-3 text-[13px] font-semibold text-white shadow-[0_6px_18px_rgba(0,113,227,0.32)] transition-transform active:scale-[0.98]"
            >
              {cta.ctaLabel}
              {ArrowRight}
            </Link>
            {/* Màn hình nhỏ → logo + TÊN store, bỏ dòng "Tải về trên" cho gọn */}
            <StoreButton store="apple" href={app.appleHref} compact />
            <StoreButton store="google" href={app.googleHref} compact />
          </div>

          {/* DESKTOP */}
          <div className="relative hidden md:block md:h-[380px] lg:h-[430px]">
            {/* Chữ nằm trong CÙNG dải 1000px canh giữa với điện thoại → 2 phần cân,
                sát nhau, không hở khoảng trống giữa banner. */}
            <div className="mx-auto flex h-full max-w-[1000px] items-center px-6">
              <div className="w-full max-w-[460px]">
              <h2 className="text-[34px] font-semibold leading-[1.02] tracking-[-0.035em] text-cvr-ink lg:text-[44px]">
                {HEADING}
              </h2>
              <p className="mt-2 text-[15px] leading-snug text-cvr-muted lg:text-[18px]">{TAGLINE}</p>
              <Link
                href={cta.ctaHref}
                className="group mt-5 inline-flex min-h-[48px] w-fit items-center gap-2.5 whitespace-nowrap rounded-full bg-cvr-blue px-6 text-[14px] font-semibold text-white shadow-[0_10px_26px_rgba(0,113,227,0.32)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-cvr-blue-ink lg:text-[15px]"
              >
                {cta.ctaLabel}
                {ArrowRight}
              </Link>
              <AppBlock appleHref={app.appleHref} googleHref={app.googleHref} />
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

// Nút tải App Store / Google Play — viên đen kiểu badge chính thức (nền banner SÁNG)
function StoreButton({ store, href = "#", compact = false }: { store: "apple" | "google"; href?: string; compact?: boolean }) {
  const iconCls = compact ? "h-5 w-5 shrink-0" : "h-6 w-6";
  return (
    <a
      href={href}
      aria-label={store === "apple" ? "Tải trên App Store" : "Tải trên Google Play"}
      className={`flex items-center rounded-xl bg-cvr-ink text-white shadow-sm transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-black ${compact ? "min-h-[36px] w-full gap-2 px-3" : "min-h-[46px] gap-2.5 px-4 py-2"}`}
    >
      {store === "apple" ? (
        <svg className={`${iconCls} text-white`} fill="currentColor" viewBox="0 0 24 24"><path d="M17.05 12.04c-.03-2.6 2.12-3.85 2.22-3.91-1.21-1.77-3.09-2.01-3.76-2.04-1.6-.16-3.12.94-3.93.94-.81 0-2.06-.92-3.39-.9-1.74.03-3.35 1.01-4.25 2.57-1.81 3.14-.46 7.78 1.3 10.32.86 1.24 1.89 2.64 3.23 2.59 1.3-.05 1.79-.84 3.36-.84 1.57 0 2.01.84 3.39.81 1.4-.02 2.29-1.27 3.15-2.52.99-1.44 1.4-2.84 1.42-2.91-.03-.01-2.72-1.04-2.75-4.13zM14.6 4.6c.72-.87 1.2-2.08 1.07-3.28-1.03.04-2.28.69-3.02 1.56-.66.77-1.24 2-1.08 3.18 1.15.09 2.33-.59 3.03-1.46z" /></svg>
      ) : (
        <svg className={iconCls} viewBox="0 0 24 24"><path fill="#00d4ff" d="M3.6 2.4c-.3.3-.5.7-.5 1.2v16.8c0 .5.2.9.5 1.2l.1.1L13 12.1v-.2L3.7 2.3l-.1.1z" /><path fill="#ffce00" d="M16.3 15.4L13 12.1v-.2l3.3-3.3.1.1 3.9 2.2c1.1.6 1.1 1.7 0 2.3l-3.9 2.2-.1.1z" /><path fill="#ff3b30" d="M16.4 15.3L13 12 3.6 21.6c.4.4 1 .4 1.6.1l11.2-6.4" /><path fill="#00e676" d="M16.4 8.7L5.2 2.3c-.6-.3-1.2-.3-1.6.1L13 12l3.4-3.3z" /></svg>
      )}
      {/* Bản gọn (mobile): logo + tên store trên MỘT dòng, bỏ dòng "Tải về trên" */}
      {compact ? (
        <span className="whitespace-nowrap text-[12px] font-semibold text-white">
          {store === "apple" ? "App Store" : "Google Play"}
        </span>
      ) : (
        <span className="flex flex-col text-left leading-tight">
          <span className="text-[10px] text-white/65">Tải về trên</span>
          <span className="text-[13px] font-semibold text-white">{store === "apple" ? "App Store" : "Google Play"}</span>
        </span>
      )}
    </a>
  );
}
