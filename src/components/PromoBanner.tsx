import Link from "next/link";

// ===== Mục quảng cáo CÔNG TY (V.8) — khuyến mãi · nạp tiền · đăng tin =====
// Đặt phía TRÊN mục tải App. Nội dung PLACEHOLDER — chủ dự án chỉnh text/CTA/href sau.
// Tự chứa (icon SVG, không cần ảnh) để không phụ thuộc asset.

type Promo = {
  tag: string;
  title: string;
  desc: string;
  cta: string;
  href: string;
  icon: "gift" | "wallet" | "post";
  featured?: boolean; // thẻ nổi bật (nền vàng)
};

const promos: Promo[] = [
  {
    tag: "Khuyến mãi",
    title: "Ưu đãi hấp dẫn cho gói VIP",
    desc: "Nâng hạng tin lên CVR Diamond / Gold với chương trình ưu đãi theo mùa.",
    cta: "Xem ưu đãi",
    href: "/tien-ich/goi-dang-tin",
    icon: "gift",
  },
  {
    tag: "Nạp tiền",
    title: "Nạp tài khoản — nhận thêm ưu đãi",
    desc: "Nạp càng nhiều, ưu đãi càng lớn. Chủ động ngân sách đăng tin cả tháng.",
    cta: "Nạp ngay",
    href: "/tien-ich/goi-dang-tin",
    icon: "wallet",
    featured: true,
  },
  {
    tag: "Đăng tin",
    title: "Đăng tin bán & cho thuê dễ dàng",
    desc: "Chỉ vài phút để đưa bất động sản của bạn đến đúng người mua tại Miền Trung.",
    cta: "Đăng tin ngay",
    href: "/dang-tin",
    icon: "post",
  },
];

function PromoGlyph({ icon }: { icon: Promo["icon"] }) {
  const common = { className: "h-6 w-6", fill: "none", stroke: "currentColor", strokeWidth: 1.8, viewBox: "0 0 24 24" } as const;
  switch (icon) {
    case "gift":
      return (<svg {...common}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zM5 12h14M5 12a2 2 0 01-2-2V9a1 1 0 011-1h16a1 1 0 011 1v1a2 2 0 01-2 2M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>);
    case "wallet":
      return (<svg {...common}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h.01M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /></svg>);
    case "post":
      return (<svg {...common}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>);
  }
}

export default function PromoBanner() {
  return (
    <section className="section-edge bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        {/* Tiêu đề mục */}
        <div className="mb-8 text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-cvr-gold-ink">Coastal Land</span>
          <h2 className="mt-2 text-balance font-serif text-2xl font-bold tracking-tight text-cvr-ink sm:text-3xl">
            Ưu đãi dành cho người bán &amp; môi giới
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-cvr-muted">
            Khuyến mãi gói VIP, nạp tiền nhận ưu đãi và đăng tin nhanh chóng — tất cả trong một nơi.
          </p>
        </div>

        {/* 3 thẻ ưu đãi */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {promos.map((p) => {
            const featured = p.featured;
            return (
              <div
                key={p.tag}
                className={`group flex flex-col rounded-3xl border p-6 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 ${
                  featured
                    ? "border-transparent bg-gradient-to-br from-cvr-gold to-cvr-gold-soft text-cvr-ink shadow-lux"
                    : "border-cvr-line bg-cvr-surface text-cvr-ink hover:border-cvr-gold/50 hover:shadow-lux"
                }`}
              >
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                    featured ? "bg-white/30 text-cvr-gold-ink" : "bg-white text-cvr-gold-ink ring-1 ring-inset ring-cvr-line"
                  }`}
                >
                  <PromoGlyph icon={p.icon} />
                </span>
                <span className={`mt-4 text-[11px] font-semibold uppercase tracking-[0.2em] ${featured ? "text-cvr-gold-ink" : "text-cvr-muted"}`}>
                  {p.tag}
                </span>
                <h3 className="mt-1 text-lg font-bold leading-snug">{p.title}</h3>
                <p className={`mt-2 flex-1 text-sm leading-relaxed ${featured ? "text-cvr-ink/80" : "text-cvr-muted"}`}>
                  {p.desc}
                </p>
                <Link
                  href={p.href}
                  className={`mt-5 inline-flex items-center gap-1.5 self-start rounded-full px-4 py-2 text-sm font-semibold transition ${
                    featured
                      ? "bg-cvr-ink text-white hover:bg-cvr-ink/90"
                      : "bg-cvr-ink text-white hover:bg-cvr-ink/90"
                  }`}
                >
                  {p.cta}
                  <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
