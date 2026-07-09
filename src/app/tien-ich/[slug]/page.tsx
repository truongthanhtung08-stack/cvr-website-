import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LeadForm from "@/components/LeadForm";
import { packages, getPackage, tiers, benefitRows } from "@/lib/packages";

export function generateStaticParams() {
  return packages.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = getPackage(slug);
  if (!p) return { title: "Không tìm thấy gói dịch vụ | Coastal Land" };
  return {
    title: `${p.title} | Coastal Land`,
    description: p.description,
  };
}

// Icon theo từng gói (nét mảnh, kiểu Apple)
function PkgGlyph({ icon }: { icon: string }) {
  const common = { className: "h-6 w-6", fill: "none", stroke: "currentColor", strokeWidth: 1.7, viewBox: "0 0 24 24" } as const;
  switch (icon) {
    case "post":
      return (<svg {...common}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>);
    case "boost":
      return (<svg {...common}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-6 6m6-6l6 6" /></svg>);
    case "project":
      return (<svg {...common}><path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01" /></svg>);
    case "pr":
      return (<svg {...common}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1 1 0 01-1.447.894L5 18H3a1 1 0 01-1-1v-4a1 1 0 011-1h2l4.553-2.276A1 1 0 0111 10.618M18 8a5 5 0 010 8" /></svg>);
    case "banner":
      return (<svg {...common}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5h18v10H3zM7 19h10" /></svg>);
    default:
      return (<svg {...common}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>);
  }
}

export default async function PackagePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getPackage(slug);
  if (!p) notFound();

  return (
    <>
      <Header />
      <main className="flex-1 bg-white">
        <div className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-5 flex flex-wrap items-center gap-1.5 text-xs text-cvr-muted">
            <Link href="/" className="hover:text-cvr-ink">Trang chủ</Link>
            <span>/</span>
            <span className="text-cvr-body">Tiện ích</span>
            <span>/</span>
            <span className="line-clamp-1 text-cvr-body">{p.label}</span>
          </nav>

          {/* Thanh chọn gói (giống Homedy) */}
          <div className="-mx-1 mb-8 overflow-x-auto">
            <div className="flex gap-2 whitespace-nowrap px-1">
              {packages.map((pkg) => {
                const active = pkg.slug === p.slug;
                return (
                  <Link
                    key={pkg.slug}
                    href={`/tien-ich/${pkg.slug}`}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                      active
                        ? "border-cvr-gold bg-cvr-gold text-cvr-ink"
                        : "border-cvr-line text-cvr-body hover:border-cvr-ink hover:text-cvr-ink"
                    }`}
                  >
                    {pkg.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Tiêu đề gói */}
          <header className="max-w-2xl">
            <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-cvr-surface text-cvr-ink ring-1 ring-inset ring-cvr-line">
              <PkgGlyph icon={p.icon} />
            </span>
            <h1 className="text-3xl font-semibold leading-tight tracking-tight text-cvr-ink sm:text-4xl">{p.title}</h1>
            <p className="mt-3 text-base leading-relaxed text-cvr-muted">{p.description}</p>
          </header>

          {/* Bảng giá 3 hạng CVR — PLACEHOLDER */}
          <section className="mt-12">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
              <h2 className="text-xl font-semibold tracking-tight text-cvr-ink sm:text-2xl">Bảng giá theo hạng</h2>
              <span className="rounded-full bg-cvr-surface px-3 py-1 text-xs font-medium text-cvr-muted ring-1 ring-inset ring-cvr-line">
                Bảng giá đang được cập nhật
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {tiers.map((t) => (
                <div
                  key={t.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-cvr-line bg-white shadow-lux"
                >
                  {/* Đầu cột — màu theo hạng */}
                  <div
                    className="px-5 py-4"
                    style={{ borderTop: `3px solid ${t.accent}` }}
                  >
                    <p className="text-lg font-bold" style={{ color: t.accent }}>{t.name}</p>
                    <p className="mt-0.5 text-xs text-cvr-muted">{t.tagline}</p>
                  </div>

                  {/* Các dòng quyền lợi (placeholder) */}
                  <div className="flex-1 divide-y divide-cvr-line/70 px-5">
                    {benefitRows.map((row) => (
                      <div key={row.label} className="flex items-center justify-between gap-3 py-3 text-sm">
                        <span className="text-cvr-muted">{row.label}</span>
                        <span className="text-right font-medium text-cvr-ink">{row.values[t.id]}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA cột */}
                  <div className="p-5">
                    <a
                      href="#lien-he"
                      className="block rounded-lg py-2.5 text-center text-sm font-semibold text-cvr-ink transition hover:opacity-90"
                      style={{ backgroundColor: t.accent }}
                    >
                      Nhận tư vấn {t.name}
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-4 text-xs text-cvr-faint">
              * Giá &amp; quyền lợi sẽ được cập nhật chính thức. Liên hệ Coastal Land để nhận bảng giá mới nhất.
            </p>
          </section>

          {/* Liên hệ tư vấn */}
          <section id="lien-he" className="mt-14 scroll-mt-28">
            <div className="mx-auto max-w-xl">
              <h2 className="text-center text-xl font-semibold tracking-tight text-cvr-ink sm:text-2xl">Đăng ký nhận bảng giá &amp; tư vấn</h2>
              <p className="mb-4 mt-1 text-center text-sm text-cvr-muted">Chuyên viên Coastal Land sẽ liên hệ tư vấn gói phù hợp nhất.</p>
              <LeadForm
                cta="Nhận tư vấn gói dịch vụ"
                topics={packages.map((pkg) => pkg.title)}
              />
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
