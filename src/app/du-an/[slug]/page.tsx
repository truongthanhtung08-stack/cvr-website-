import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Gallery from "@/components/Gallery";
import PropertyCard from "@/components/PropertyCard";
import LeadForm from "@/components/LeadForm";
import { projects, getProjectBySlug, buildProjectDetail, featuredListings } from "@/lib/data";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = getProjectBySlug(slug);
  if (!p) return { title: "Không tìm thấy dự án | Central Land" };
  return {
    title: `${p.name} — ${p.priceFrom} | Central Land`,
    description: `Dự án ${p.name} tại ${p.location}. ${p.type}, ${p.status}. Mục lục: tổng quan, vị trí, mặt bằng, tiện ích và tin đăng mới nhất.`,
  };
}

const toc = [
  { id: "tong-quan", label: "Tổng quan" },
  { id: "vi-tri", label: "Vị trí" },
  { id: "mat-bang", label: "Mặt bằng" },
  { id: "bang-gia", label: "Bảng giá" },
  { id: "tien-do", label: "Tiến độ" },
  { id: "tien-ich", label: "Tiện ích" },
  { id: "thu-vien", label: "Thư viện" },
  { id: "tin-moi", label: "Tin đăng" },
];

// Loại căn mẫu (tham khảo) cho bảng giá
const unitTypes = [
  { name: "Căn 1 phòng ngủ", area: "45 – 55 m²" },
  { name: "Căn 2 phòng ngủ", area: "65 – 85 m²" },
  { name: "Căn 3 phòng ngủ", area: "95 – 125 m²" },
  { name: "Duplex / Penthouse", area: "150 – 220 m²" },
];

// Các mốc tiến độ
const progressSteps = ["Pháp lý & khởi công", "Thi công phần thô", "Hoàn thiện", "Bàn giao"];
function currentStep(status: string): number {
  const s = status.toLowerCase();
  if (s.includes("sắp mở")) return 0;
  if (s.includes("mở bán")) return 1;
  if (s.includes("sắp bàn giao")) return 2;
  if (s.includes("bàn giao") || s.includes("hoàn thiện")) return 3;
  return 1;
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getProjectBySlug(slug);
  if (!p) notFound();
  const d = buildProjectDetail(p);
  const others = projects.filter((x) => x.slug !== p.slug).slice(0, 3);
  const province = p.location.split(",").pop()?.trim() ?? "";
  const nearby = featuredListings.filter((x) => x.location.includes(province)).slice(0, 4);
  const step = currentStep(p.status);

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 lg:px-8">
          <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-white/40">
            <Link href="/" className="hover:text-white/70">Trang chủ</Link>
            <span>/</span>
            <Link href="/du-an" className="hover:text-white/70">Dự án</Link>
            <span>/</span>
            <span className="line-clamp-1 text-white/70">{p.name}</span>
          </nav>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Gallery images={d.gallery} alt={p.name} />

              <div className="mt-6">
                <span className="mb-2 inline-block rounded-md bg-white px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-cvr-ink">{p.status}</span>
                <h1 className="font-serif text-2xl font-bold leading-tight text-white sm:text-3xl">{p.name}</h1>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-white/60">
                  <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  {p.location}
                </p>
              </div>

              {/* Mục lục — thanh điều hướng dính */}
              <div className="sticky top-[60px] z-30 -mx-1 mt-5 overflow-x-auto border-b border-white/10 bg-cvr-ink/85 px-1 backdrop-blur-md">
                <div className="flex gap-1 whitespace-nowrap py-1">
                  {toc.map((t) => (
                    <a key={t.id} href={`#${t.id}`} className="rounded-lg px-3 py-2 text-sm font-medium text-white/65 transition hover:bg-white/10 hover:text-white">
                      {t.label}
                    </a>
                  ))}
                </div>
              </div>

              {/* Tổng quan */}
              <section id="tong-quan" className="mt-8 scroll-mt-28 border-t border-white/10 pt-6">
                <h2 className="mb-4 font-serif text-lg font-bold text-white sm:text-xl">Tổng quan dự án</h2>
                <div className="space-y-3 text-sm leading-relaxed text-white/75">
                  {d.overview.map((t, i) => <p key={i}>{t}</p>)}
                </div>
                <div className="mt-6 grid grid-cols-1 gap-x-8 sm:grid-cols-2">
                  {d.scale.map((s) => (
                    <div key={s.label} className="flex items-center justify-between border-b border-white/8 py-3 text-sm">
                      <span className="text-white/55">{s.label}</span>
                      <span className="font-medium text-white">{s.value}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Vị trí */}
              <section id="vi-tri" className="mt-8 scroll-mt-28 border-t border-white/10 pt-6">
                <h2 className="mb-4 font-serif text-lg font-bold text-white sm:text-xl">Vị trí dự án</h2>
                <div className="overflow-hidden rounded-xl border border-white/10">
                  <iframe title="Bản đồ" src={`https://maps.google.com/maps?q=${encodeURIComponent(d.mapQuery)}&z=14&output=embed`} className="h-[320px] w-full grayscale-[0.3]" loading="lazy" />
                </div>
                <p className="mt-2 text-xs text-white/50">{p.location}</p>
              </section>

              {/* Mặt bằng dự án */}
              <section id="mat-bang" className="mt-8 scroll-mt-28 border-t border-white/10 pt-6">
                <h2 className="mb-4 font-serif text-lg font-bold text-white sm:text-xl">Mặt bằng dự án</h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {["Mặt bằng tổng thể", "Mặt bằng phân khu", "Mặt bằng căn / nền điển hình"].map((m) => (
                    <a key={m} href="#tai-tai-lieu" className="group flex items-center gap-3 rounded-xl border border-white/12 bg-white/[0.04] p-4 transition hover:border-white/30 hover:bg-white/[0.07]">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-6 4h6m2 4H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z" /></svg>
                      </span>
                      <span className="flex flex-col">
                        <span className="text-sm font-semibold text-white">{m}</span>
                        <span className="text-xs text-white/55 transition group-hover:text-white/80">Tải file PDF →</span>
                      </span>
                    </a>
                  ))}
                </div>
                <p className="mt-3 text-xs text-white/45">Bấm để nhận file mặt bằng chi tiết và bảng hàng mới nhất từ Central Land.</p>
              </section>

              {/* Bảng giá & loại căn */}
              <section id="bang-gia" className="mt-8 scroll-mt-28 border-t border-white/10 pt-6">
                <h2 className="mb-4 font-serif text-lg font-bold text-white sm:text-xl">Bảng giá & loại hình</h2>
                <div className="overflow-hidden rounded-xl border border-white/10">
                  <div className="grid grid-cols-3 bg-white/[0.06] px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-white/60">
                    <span>Loại căn</span><span>Diện tích</span><span className="text-right">Giá tham khảo</span>
                  </div>
                  {unitTypes.map((u, i) => (
                    <div key={u.name} className="grid grid-cols-3 items-center border-t border-white/8 px-4 py-3 text-sm">
                      <span className="font-medium text-white">{u.name}</span>
                      <span className="text-white/70">{u.area}</span>
                      <span className="text-right text-white">{i === 0 ? p.priceFrom : "Liên hệ"}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-white/45">* Giá &amp; loại căn mang tính tham khảo — nhận bảng giá chính thức mới nhất.</p>
                  <a href="#tai-tai-lieu" className="rounded-lg bg-cvr-gold px-4 py-2 text-xs font-semibold text-cvr-ink transition hover:bg-cvr-gold-soft">Nhận bảng giá chi tiết →</a>
                </div>
              </section>

              {/* Tiến độ dự án */}
              <section id="tien-do" className="mt-8 scroll-mt-28 border-t border-white/10 pt-6">
                <h2 className="mb-5 font-serif text-lg font-bold text-white sm:text-xl">Tiến độ dự án</h2>
                <div className="flex items-center justify-between gap-1">
                  {progressSteps.map((s, i) => (
                    <div key={s} className="flex flex-1 flex-col items-center text-center">
                      <div className="flex w-full items-center">
                        <span className={`h-0.5 flex-1 ${i === 0 ? "bg-transparent" : i <= step ? "bg-cvr-gold" : "bg-white/15"}`} />
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${i <= step ? "bg-cvr-gold text-cvr-ink" : "border border-white/25 text-white/45"}`}>{i + 1}</span>
                        <span className={`h-0.5 flex-1 ${i === progressSteps.length - 1 ? "bg-transparent" : i < step ? "bg-cvr-gold" : "bg-white/15"}`} />
                      </div>
                      <span className={`mt-2 text-[11px] leading-tight sm:text-xs ${i <= step ? "text-white" : "text-white/45"}`}>{s}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-sm text-white/60">Trạng thái hiện tại: <span className="font-semibold text-white">{p.status}</span> · Dự kiến bàn giao: {d.handover}</p>
              </section>

              {/* Tiện ích */}
              <section id="tien-ich" className="mt-8 scroll-mt-28 border-t border-white/10 pt-6">
                <h2 className="mb-4 font-serif text-lg font-bold text-white sm:text-xl">Tiện ích dự án</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {d.amenities.map((a) => (
                    <span key={a} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-xs text-white/80">
                      <svg className="h-4 w-4 shrink-0 text-white" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      {a}
                    </span>
                  ))}
                </div>
              </section>

              {/* Thư viện hình ảnh dự án */}
              <section id="thu-vien" className="mt-8 scroll-mt-28 border-t border-white/10 pt-6">
                <h2 className="mb-4 font-serif text-lg font-bold text-white sm:text-xl">Thư viện hình ảnh</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {d.gallery.map((src, i) => (
                    <div key={i} className="relative aspect-[4/3] overflow-hidden rounded-xl border border-white/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`${p.name} ${i + 1}`} className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-white/45">Hình ảnh dự án (ảnh phối cảnh/thực tế). Liên hệ Central Land để nhận thêm hình ảnh & video.</p>
              </section>

              {/* Tin đăng mới nhất trong khu vực */}
              {nearby.length > 0 && (
                <section id="tin-moi" className="mt-8 scroll-mt-28 border-t border-white/10 pt-6">
                  <h2 className="mb-4 font-serif text-lg font-bold text-white sm:text-xl">Tin đăng mới nhất tại {province}</h2>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    {nearby.map((item) => <PropertyCard key={item.id} item={item} />)}
                  </div>
                </section>
              )}
            </div>

            {/* Cột phụ */}
            <aside className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                <div className="rounded-2xl border border-white/12 bg-white/[0.04] p-5">
                  <p className="text-xs text-white/50">Giá bán từ</p>
                  <p className="text-2xl font-extrabold text-white">{p.priceFrom}</p>
                  <p className="mt-1 text-xs text-white/55">{p.type}</p>
                  <div className="mt-4 space-y-2.5">
                    <a href="tel:0905000111" className="flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-bold text-cvr-ink transition hover:bg-white/90">Gọi tư vấn dự án</a>
                  </div>
                  <p className="mt-3 text-center text-[11px] text-white/40">{d.developer} · Bàn giao {d.handover}</p>
                </div>

                {/* Tải tài liệu & báo giá */}
                <div id="tai-tai-lieu" className="scroll-mt-28">
                  <h3 className="mb-1 text-center font-serif text-lg font-bold text-white">Tải tài liệu & báo giá</h3>
                  <p className="mb-3 text-center text-xs text-white/55">Nhận brochure, mặt bằng, bảng giá & chính sách mới nhất</p>
                  <LeadForm cta="Đăng ký nhận tài liệu" topics={["Nhận brochure & mặt bằng", "Nhận bảng giá & chính sách", "Đặt lịch tham quan dự án", "Tư vấn vay ngân hàng"]} />
                </div>
              </div>
            </aside>
          </div>

          {others.length > 0 && (
            <div className="mt-14">
              <h2 className="font-serif text-xl font-bold text-white sm:text-2xl">Dự án khác</h2>
              <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
                {others.map((o) => (
                  <Link key={o.slug} href={`/du-an/${o.slug}`} className="card-lux group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] hover:-translate-y-1.5 hover:border-white/30">
                    <span className="card-sheen" aria-hidden />
                    <div className="relative aspect-[16/10] overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={o.image} alt={o.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-white">{o.name}</h3>
                      <p className="mt-1 text-xs text-white/50">{o.location}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
