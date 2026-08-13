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

/* ════════════════════════════════════════════════════════════════════════════
   HỆ NHỊP CHUNG CỦA TRANG — sửa ở ĐÂY là cả trang đổi theo, không còn mỗi khối
   một kiểu (khoảng cách/cỡ chữ trước đây rời rạc trên cả PC lẫn điện thoại).

   · Chiều dọc mỗi khối : py-8 (điện thoại) → py-16 (máy tính)
     ⚠️ Chỗ 2 khối giáp nhau, khoảng trắng = py dưới + py trên. Để py-14 thì hở
     tới 112px trên điện thoại — nhìn rất rời rạc. py-8 → hở 64px, vừa mắt.
   · Lề ngang           : px-5 → px-6 → px-8, khung tối đa 7xl
   · Cụm tiêu đề        : eyebrow → tiêu đề → mô tả, cách nhau 10px / 16px
   · Thẻ                : p-6 (đt) → p-7 (máy tính), icon 48px bo 16px
   · Lưới 2 cột ảnh–chữ : gap 8 → 14 · Lưới thẻ: gap 5
   · Nút CTA            : viên thuốc, cao tối thiểu 48px
   ════════════════════════════════════════════════════════════════════════════ */
const SECTION = "mx-auto max-w-7xl px-5 py-7 sm:px-6 sm:py-12 lg:px-8";
// Khối mà nội dung là THẺ: thẻ đã có sẵn 24px đệm bên trong, nên khối phải bớt
// đệm lại — nếu để bằng khối thường thì chỗ giáp ranh bị cộng dồn thành ~100px
// trong khi chỗ khác chỉ 32px (đo thật trên máy: 32·101·89·89·75 → rất lệch).
const SECTION_CARD = "mx-auto max-w-7xl px-5 py-4 sm:px-6 sm:py-9 lg:px-8";
// items-stretch (KHÔNG dùng items-center): trước đây ảnh canh giữa theo chiều dọc
// nên khi cột chữ dài hơn ảnh sẽ hở 2 mảng trắng trên–dưới ảnh, nhìn rất rời rạc.
// Nay ảnh KÉO CAO BẰNG cột chữ → 2 cột thẳng hàng cả mép trên lẫn mép dưới.
const SPLIT = "grid grid-cols-1 items-stretch gap-5 lg:grid-cols-2 lg:gap-14";
const CARD = "border border-cvr-line bg-white p-6 shadow-lux sm:p-7";
const ICON_BOX = "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl";
// Hàng đầu thẻ: ICON và TIÊU ĐỀ NGANG HÀNG (không xếp trên–dưới nữa)
const HEAD_ROW = "flex items-center gap-3.5";
const CARD_TITLE = "min-w-0 text-lg font-semibold leading-snug tracking-tight text-cvr-ink";
const BTN_BLUE =
  "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-cvr-blue px-7 text-sm font-semibold text-white shadow-[0_10px_26px_rgba(0,113,227,0.28)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-cvr-blue-ink";
const BTN_LINE =
  "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-cvr-line bg-white px-7 text-sm font-semibold text-cvr-ink transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:border-cvr-ink";

// Cụm tiêu đề dùng chung cho MỌI khối → cỡ chữ và khoảng cách luôn giống nhau.
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[13px] font-semibold uppercase tracking-[0.2em] text-cvr-blue-ink">{children}</p>
  );
}
function Title({ as = "h2", children }: { as?: "h1" | "h2"; children: React.ReactNode }) {
  const Tag = as;
  return (
    <Tag className="mt-2.5 text-[26px] font-semibold leading-[1.15] tracking-tight text-cvr-ink sm:text-[34px]">
      {children}
    </Tag>
  );
}

// Icon "giá trị cốt lõi" giữ trong code, map theo thứ tự với values[] admin nhập.
const VALUE_ICONS = [
  "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  "M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a3 3 0 10-2.5-4.5",
];

// Khối ảnh (vuông cạnh kiểu Apple mới): điện thoại giữ tỷ lệ 16:10; máy tính KÉO
// CAO BẰNG cột chữ bên cạnh (tối thiểu 340px) để 2 cột luôn thẳng hàng.
function Figure({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`relative aspect-[16/10] w-full overflow-hidden bg-cvr-surface lg:aspect-auto lg:h-full lg:min-h-[340px] ${className}`}>
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
             mong muốn: PC 4:1 · điện thoại 16:10. (Đã hạ dần 3:1 → 16:5 → 7:2 → 4:1
             theo yêu cầu "hero PC quá to"; cao tối đa 330px.)
             → Ảnh cần chuẩn bị: TỶ LỆ 4:1, khuyến nghị 4000×1000 (tối thiểu 1920×480).
             KHÔNG chèn watermark/logo lên hero này — để ảnh sạch, thương hiệu đã có
             ở header ngay phía trên. */}
        <section className="relative isolate pb-7 sm:pb-12">
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-cvr-ink sm:aspect-[4/1] sm:max-h-[330px]">
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
        <section className={SECTION}>
          <div className={SPLIT}>
            <div>
              <Eyebrow>{about.story.eyebrow}</Eyebrow>
              <Title as="h1">{about.story.title}</Title>
              <div className="mt-4 space-y-3.5 text-[15px] leading-relaxed text-cvr-body sm:text-base">
                {about.story.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>
            <Figure src={about.story.image} alt="Văn phòng Coastal Land" />
          </div>
        </section>

        {/* ── Tầm nhìn & Sứ mệnh — mỗi thẻ một ICON cho chuyên nghiệp ── */}
        <section className="bg-cvr-surface">
          <div className={SECTION_CARD}>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className={CARD}>
                {/* ICON và TIÊU ĐỀ nằm NGANG HÀNG */}
                <div className={HEAD_ROW}>
                  <span className={`${ICON_BOX} bg-cvr-blue/10 text-cvr-blue-ink`}>
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
                      <circle cx="12" cy="12" r="3.2" />
                    </svg>
                  </span>
                  <h3 className={CARD_TITLE}>Tầm nhìn</h3>
                </div>
                <p className="mt-3.5 text-[15px] leading-relaxed text-cvr-body">{about.vision}</p>
              </div>
              <div className={CARD}>
                <div className={HEAD_ROW}>
                  <span className={`${ICON_BOX} bg-cvr-gold/10 text-cvr-gold-ink`}>
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="8.5" />
                      <circle cx="12" cy="12" r="4.6" />
                      <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
                    </svg>
                  </span>
                  <h3 className={CARD_TITLE}>Sứ mệnh</h3>
                </div>
                <p className="mt-3.5 text-[15px] leading-relaxed text-cvr-body">{about.mission}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Giá trị cốt lõi ── */}
        <section className={SECTION_CARD}>
          <div className="max-w-2xl">
            <Eyebrow>Giá trị cốt lõi</Eyebrow>
            <Title>Điều làm nên Coastal Land</Title>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {about.values.map((v, i) => (
              <div key={i} className={`${CARD} transition hover:-translate-y-1 hover:border-cvr-blue/40`}>
                <div className={HEAD_ROW}>
                  <span className={`${ICON_BOX} bg-cvr-blue/10 text-cvr-blue-ink`}>
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d={VALUE_ICONS[i % VALUE_ICONS.length]} />
                    </svg>
                  </span>
                  <h3 className={CARD_TITLE}>{v.title}</h3>
                </div>
                <p className="mt-3.5 text-[15px] leading-relaxed text-cvr-muted">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Số liệu: ĐÃ BỎ theo yêu cầu (file V3 10.08.2026).
             Dữ liệu stats/statsImage vẫn còn trong admin — chưa xoá, chỉ không hiển thị. ── */}

        {/* ── Thị trường Miền Trung ── */}
        <section className="bg-cvr-surface">
          <div className={SECTION}>
            <div className={SPLIT}>
              <Figure src={about.market.image} alt="Không gian ven biển Duyên hải Miền Trung" className="order-2 lg:order-1" />
              <div className="order-1 lg:order-2">
                <Eyebrow>{about.market.eyebrow}</Eyebrow>
                <Title>{about.market.title}</Title>
                <p className="mt-4 text-[15px] leading-relaxed text-cvr-body sm:text-base">{about.market.desc}</p>
                <Link href={about.market.ctaHref} className={`${BTN_BLUE} mt-6`}>
                  {about.market.ctaLabel}
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA cuối trang ── */}
        <section className="border-t border-cvr-line bg-white">
          <div className={`${SECTION} flex flex-col items-center text-center`}>
            <Title>{about.cta.title}</Title>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-cvr-muted sm:text-base">{about.cta.desc}</p>
            {/* Điện thoại: 2 nút TRÀN NGANG bằng nhau · Máy tính: nằm cạnh nhau canh giữa */}
            <div className="mt-7 flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
              <Link href={about.cta.primaryHref} className={BTN_BLUE}>{about.cta.primaryLabel}</Link>
              <Link href={about.cta.secondaryHref} className={BTN_LINE}>{about.cta.secondaryLabel}</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
