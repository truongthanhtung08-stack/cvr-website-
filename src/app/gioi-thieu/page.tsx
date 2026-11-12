import type { Metadata } from "next";
import { BreadcrumbJsonLd } from "@/components/Breadcrumb";
import Image from "next/image";
import { preload } from "react-dom";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { asset } from "@/lib/asset";
import { getAbout } from "@/lib/siteContent";
import { layThuongHieu } from "@/lib/thuongHieu";
import { getListings, getListingsHetHan } from "@/lib/listingsDb";
import { getProjects } from "@/lib/contentDb";
import { PHAP_LY } from "@/lib/phapLy";

// TRANG GIỚI THIỆU = TRANG CHA CỦA THƯƠNG HIỆU (anh 12/11/2026: "phần giới thiệu rất sơ sài, làm lại CHUẨN", "phong cách đơn giản"):
// trả lời "Coastal Land là gì" (tiêu đề, H1, hỏi đáp) · web có gì (link 6 mục, số tin thật) · khu vực (7 tỉnh, kèm tên cũ khách còn gõ)
// · cách dùng cho người mua / người đăng tin · doanh nghiệp + kênh chính thức. Mã số thuế CHỈ ghi một lần trên web (chân trang) — không lặp ở đây.
const KHU_VUC = [
  { ten: "Đà Nẵng", cu: "Quảng Nam", slug: "da-nang" },
  { ten: "Huế", cu: "Thừa Thiên Huế", slug: "hue" },
  { ten: "Khánh Hòa", cu: "Nha Trang, Ninh Thuận", slug: "khanh-hoa" },
  { ten: "Gia Lai", cu: "Quy Nhơn, Bình Định", slug: "gia-lai" },
  { ten: "Lâm Đồng", cu: "Đà Lạt, Phan Thiết, Bình Thuận", slug: "lam-dong" },
  { ten: "Quảng Ngãi", cu: "Kon Tum", slug: "quang-ngai" },
  { ten: "Quảng Trị", cu: "Đông Hà, Quảng Bình", slug: "quang-tri" },
];

const TEN_KENH: [RegExp, string][] = [
  [/zalo\.me\/s\//, "Zalo Mini App"], [/zalo\.me/, "Zalo"], [/facebook\.com/, "Facebook"], [/youtube\.com/, "YouTube"],
  [/maps\.google|google\.com\/maps/, "Google Maps"], [/linkedin\.com/, "LinkedIn"],
];

export const metadata: Metadata = {
  alternates: { canonical: "/gioi-thieu" },
  title: "Coastal Land là gì? Cổng thông tin bất động sản trực tuyến",
  // 149 ký tự — Google hiển thị được khoảng 155. Bản cũ 188 ký tự bị cắt mất câu
  // cuối. Chữ "thực hiện giao dịch" cũng đã bỏ: Coastal Land là CỔNG THÔNG TIN,
  // không đứng ra môi giới hay giao dịch hộ ai.
  description:
    "Coastal Land (coastalland.vn) — cổng thông tin bất động sản trực tuyến, cổng đăng tin mua bán, cho thuê nhà đất. Nơi người bán đăng tin và người mua tìm đúng nhà đất.",
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
  if (!src) return null; // không có ảnh thật thì không hiện khung ảnh
  return (
    <div className={`relative aspect-[16/10] w-full overflow-hidden bg-cvr-surface lg:aspect-auto lg:h-full lg:min-h-[340px] ${className}`}>
      <Image src={asset(src)} alt={alt} fill sizes="(max-width:1024px) 100vw, 50vw" className="object-cover" />
    </div>
  );
}

export default async function GioiThieuPage() {
  // Nội dung admin sửa được (site_content key 'about') — chưa nhập → mặc định trong code.
  // Số tin = tin đang hiện + tin hết hạn (vẫn xem được trên web) — cùng cách đếm ô khu vực trang chủ (anh chốt 06/11/2026)
  const [about, th, dangHien, hetHan, duAn] = await Promise.all([getAbout(), layThuongHieu(), getListings().catch(() => []), getListingsHetHan().catch(() => []), getProjects().catch(() => [])]);
  const tin = [...dangHien, ...hetHan];
  const soBan = tin.filter((l) => (l.purpose ?? "ban") === "ban").length;
  const soThue = tin.filter((l) => l.purpose === "thue").length;
  const MUC = [
    { href: "/mua-ban", ten: "Mua bán nhà đất", so: soBan ? `${soBan.toLocaleString("vi-VN")} tin` : "" },
    { href: "/cho-thue", ten: "Cho thuê nhà đất", so: soThue ? `${soThue.toLocaleString("vi-VN")} tin` : "" },
    { href: "/du-an", ten: "Dự án", so: duAn.length ? `${duAn.length.toLocaleString("vi-VN")} dự án` : "" },
    { href: "/gia-nha-dat/da-nang", ten: "Giá nhà đất theo khu vực", so: "" },
    { href: "/tin-tuc", ten: "Tin tức thị trường", so: "" },
    { href: "/tien-ich/gia-nha-dat", ten: "Tiện ích", so: "" },
  ];
  const kenh = th.kenh.map((href) => ({ href, ten: TEN_KENH.find(([re]) => re.test(href))?.[1] ?? "" })).filter((k) => k.ten);
  // ẢNH ĐẦU TRANG TẢI TRƯỚC ĐÚNG KHỔ MÁY (cùng cách Hero trang chủ, 27/10/2026): trước đây hai ảnh (điện thoại + máy tính) đều
  // "priority" → điện thoại tải trước CẢ ảnh máy tính đang ẩn, giành đường truyền với ảnh đang hiện (LCP).
  // Cùng một tệp cho cả hai máy → tải trước MỘT lần, không kèm điều kiện (React gộp hai lệnh cùng địa chỉ, giữ lệnh đầu).
  if (about.heroImage) {
    const anhDt = asset(about.heroImageMobile || about.heroImage);
    const anhPc = asset(about.heroImage);
    if (anhDt === anhPc) preload(anhPc, { as: "image", fetchPriority: "high" });
    else {
      preload(anhDt, { as: "image", fetchPriority: "high", media: "(max-width: 639.98px)" });
      preload(anhPc, { as: "image", fetchPriority: "high", media: "(min-width: 640px)" });
    }
  }

  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "Giới thiệu", href: "/gioi-thieu" }]} />
      <Header />
      <main className="flex-1 bg-white">
        {/* ── Hero giới thiệu ──
             KHUNG THEO TỶ LỆ CỐ ĐỊNH (không dùng vh) để ảnh luôn hiện đúng phần
             mong muốn: PC 4:1 · điện thoại 16:10. (Đã hạ dần 3:1 → 16:5 → 7:2 → 4:1
             theo yêu cầu "hero PC quá to"; cao tối đa 330px.)
             → Ảnh cần chuẩn bị (KHUNG GIỮ NGUYÊN, chỉ khớp ảnh theo khung):
                MÁY TÍNH  4:1    → 4000×1000
                ĐIỆN THOẠI 16:10 → 1200×750
             KHÔNG chèn watermark/logo lên hero này — để ảnh sạch, thương hiệu đã có
             ở header ngay phía trên. */}
        {about.heroImage && (
        <section className="relative isolate pb-7 sm:pb-12">
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-cvr-ink sm:aspect-[4/1] sm:max-h-[330px]">
            {/* ĐIỆN THOẠI — ảnh riêng 16:10; chưa nhập thì dùng tạm ảnh máy tính */}
            <Image
              src={asset(about.heroImageMobile || about.heroImage)}
              alt="Coastal Land"
              fill
              loading="eager"
              fetchPriority="high"
              sizes="100vw"
              className="object-cover sm:hidden"
            />
            {/* MÁY TÍNH — ảnh 4:1 */}
            <Image
              src={asset(about.heroImage)}
              alt="Coastal Land"
              fill
              loading="eager"
              fetchPriority="high"
              sizes="100vw"
              className="hidden object-cover sm:block"
            />
          </div>
        </section>
        )}

        {/* ── Câu chuyện ── */}
        <section className={SECTION}>
          <div className={about.story.image ? SPLIT : ""}>
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

        {/* ── Coastal Land có gì — 6 mục, số tin thật ── */}
        <section className={SECTION_CARD}>
          <Title>Coastal Land có gì</Title>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            {MUC.map((m) => (
              <Link key={m.href} href={m.href} className="press rounded-2xl border border-cvr-line bg-white p-4 transition hover:border-cvr-ink sm:p-5">
                <span className="block text-[15px] font-semibold text-cvr-ink sm:text-base">{m.ten}</span>
                {m.so && <span className="mt-1 block text-[13px] text-cvr-muted">{m.so}</span>}
              </Link>
            ))}
          </div>
        </section>

        {/* ── Khu vực — 7 tỉnh, kèm tên khách còn gõ (tỉnh cũ, thành phố) ── */}
        <section className="bg-cvr-surface">
          <div className={SECTION_CARD}>
            <Title>Khu vực</Title>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              {KHU_VUC.map((k) => (
                <Link key={k.slug} href={`/mua-ban/${k.slug}`} className="press rounded-2xl border border-cvr-line bg-white p-4 transition hover:border-cvr-ink">
                  <span className="block text-[15px] font-semibold text-cvr-ink">Nhà đất {k.ten}</span>
                  <span className="mt-1 block text-[13px] leading-snug text-cvr-muted">{k.cu}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── Cách dùng: người mua / thuê · người đăng tin ── */}
        <section className={SECTION_CARD}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
            {[
              { ten: "Người mua, người thuê", y: ["Kết nối người bán và người mua", "Tin xác thực"], link: { href: "/mua-ban", nhan: "Xem tin" } },
              { ten: "Người đăng tin", y: ["Đăng nhập bằng số điện thoại, email, Google, Zalo", "Chọn gói theo bảng giá", "Tin được duyệt rồi lên web"], link: { href: "/bao-gia-dang-tin", nhan: "Báo giá" } },
            ].map((c) => (
              <div key={c.ten} className="rounded-2xl border border-cvr-line bg-white p-5 sm:p-6">
                <h3 className={CARD_TITLE}>{c.ten}</h3>
                <ul className="mt-3 space-y-2 text-[15px] leading-relaxed text-cvr-body">
                  {c.y.map((y) => (
                    <li key={y} className="flex gap-2.5"><span aria-hidden className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-cvr-ink" />{y}</li>
                  ))}
                </ul>
                <Link href={c.link.href} className="mt-4 inline-flex text-[15px] font-semibold text-cvr-blue-ink hover:underline">{c.link.nhan} ›</Link>
              </div>
            ))}
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

        {/* ── Khối "Thị trường" (ảnh + nút Xem dự án, Admin → Giới thiệu) — ĐÃ BỎ (anh 12/11/2026: "phần cuối bị thừa, bỏ đi"); lối vào Dự án
             đã có ở khối "Coastal Land có gì". Dữ liệu about.market vẫn còn trong Admin, chỉ không hiển thị. ── */}

        {/* ── Doanh nghiệp + kênh chính thức (một nguồn: phapLy.ts, sheet Thương hiệu). Địa chỉ, điện thoại, email ở chân trang — không lặp ── */}
        <section className={SECTION_CARD}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
            <div className="rounded-2xl border border-cvr-line bg-white p-5 sm:p-6">
              <h3 className={CARD_TITLE}>Thông tin doanh nghiệp</h3>
              <p className="mt-3 text-[15px] font-semibold text-cvr-ink">{PHAP_LY.tenCongTy}</p>
              <p className="mt-1 text-[15px] text-cvr-body">Thành lập {PHAP_LY.ngayCap}</p>
            </div>
            {kenh.length > 0 && (
              <div className="rounded-2xl border border-cvr-line bg-white p-5 sm:p-6">
                <h3 className={CARD_TITLE}>Kênh chính thức</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {kenh.map((k) => (
                    <a key={k.href} href={k.href} target="_blank" rel="noopener noreferrer" className="press rounded-full border border-cvr-line px-4 py-2 text-[14px] font-medium text-cvr-ink transition hover:border-cvr-ink">{k.ten}</a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Trang giới thiệu khai cho Google là trang "về" tổ chức (AboutPage → #to-chuc) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "AboutPage", "@id": "https://coastalland.vn/gioi-thieu", url: "https://coastalland.vn/gioi-thieu", name: `${th.ten} là gì? ${th.cau1}`, isPartOf: { "@id": "https://coastalland.vn/#website" }, about: { "@id": "https://coastalland.vn/#to-chuc" }, mainEntity: { "@id": "https://coastalland.vn/#to-chuc" } }) }}
        />

        {/* HỎI ĐÁP VỀ THƯƠNG HIỆU (GEO, anh 12/11/2026) — từ sheet "Thương hiệu" (dòng Hỏi đáp); bảng chưa có câu hỏi thì không hiện.
            Kèm dữ liệu FAQPage để Google + mọi AI trích đúng "Coastal Land là gì". */}
        {th.hoiDap.length > 0 && (
          <section>
            <div className={SECTION}>
              <Title>Hỏi đáp về {th.ten}</Title>
              <dl className="mt-6 divide-y divide-cvr-line">
                {th.hoiDap.map((h) => (
                  <div key={h.hoi} className="py-4">
                    <dt className="text-[16px] font-semibold text-cvr-ink">{h.hoi}</dt>
                    <dd className="mt-1.5 whitespace-pre-line text-[15px] leading-relaxed text-cvr-body">{h.dap}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", about: { "@id": "https://coastalland.vn/#to-chuc" }, mainEntity: th.hoiDap.map((h) => ({ "@type": "Question", name: h.hoi, acceptedAnswer: { "@type": "Answer", text: h.dap } })) }) }}
            />
          </section>
        )}

        {/* (bỏ khối nút cuối trang Đăng tin · Xem Bất động sản — anh 08/11/2026: "dòng cuối bỏ hết") */}
      </main>
      <Footer />
    </>
  );
}
