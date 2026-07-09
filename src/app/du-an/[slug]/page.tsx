import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProjectGallery from "@/components/ProjectGallery";
import ListingList from "@/components/ListingList";
import LeadForm from "@/components/LeadForm";
import { projects, getProjectBySlug, buildProjectDetail, featuredListings, provinceOf, districtOf, segmentOf, pickRelated } from "@/lib/data";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = getProjectBySlug(slug);
  if (!p) return { title: "Không tìm thấy dự án | Coastal Land" };
  return {
    title: `${p.name} — ${p.priceFrom} | Coastal Land`,
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
  const province = provinceOf(p.location);
  // Dự án khác: ưu tiên cùng TỈNH (+2) và cùng LOẠI HÌNH (+1), luôn đủ 3.
  const others = pickRelated(
    projects.filter((x) => x.slug !== p.slug),
    (x) => (provinceOf(x.location) === province ? 2 : 0) + (x.type === p.type ? 1 : 0),
    3,
  );
  // Tin đăng mới nhất: trong TỈNH của dự án, xếp theo ưu tiên
  // CÙNG DỰ ÁN (tên dự án có trong tiêu đề, +100) → CÙNG KHU VỰC (cùng quận/huyện, +20)
  // → CÙNG PHÂN KHÚC (cùng loại hình, +5).
  const projSegment = segmentOf(p.type);
  const projDistrict = districtOf(p.location);
  const nearby = pickRelated(
    featuredListings.filter((x) => provinceOf(x.location) === province),
    (x) =>
      (x.title.includes(p.name) ? 100 : 0) +
      (districtOf(x.location) === projDistrict ? 20 : 0) +
      (segmentOf(x.type) !== "" && segmentOf(x.type) === projSegment ? 5 : 0),
    6,
  );
  const step = currentStep(p.status);

  return (
    <>
      <Header />
      <main className="flex-1 bg-white">
        <div className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
          <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-cvr-muted">
            <Link href="/" className="hover:text-cvr-ink">Trang chủ</Link>
            <span>/</span>
            <Link href="/du-an" className="hover:text-cvr-ink">Dự án</Link>
            <span>/</span>
            <span className="line-clamp-1 text-cvr-body">{p.name}</span>
          </nav>

          {/* Lưới ảnh tràn full width (kiểu Batdongsan) — 1 ảnh lớn trái + 4 ảnh nhỏ phải.
              KHÔNG ghi text nào lên ảnh (chỉ bộ đếm ảnh góc dưới phải). */}
          <ProjectGallery images={d.gallery} alt={p.name} />

          {/* Tên + địa chỉ dự án — full width, NGAY dưới lưới ảnh (rõ ràng, kiểu Batdongsan) */}
          <div className="mt-5">
            <h1 className="text-2xl font-semibold leading-tight tracking-tight text-cvr-ink sm:text-3xl">{p.name}</h1>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-cvr-muted">
              <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              {p.location}
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              {/* Mục lục — thanh điều hướng dính (nav-glass sáng) */}
              <div className="sticky top-[60px] z-30 -mx-1 overflow-x-auto border-b border-cvr-line bg-white/85 px-1 backdrop-blur-md">
                <div className="flex gap-1 whitespace-nowrap py-1">
                  {toc.map((t) => (
                    <a key={t.id} href={`#${t.id}`} className="rounded-lg px-3 py-2 text-sm font-medium text-cvr-muted transition hover:bg-black/5 hover:text-cvr-ink">
                      {t.label}
                    </a>
                  ))}
                </div>
              </div>

              {/* Tổng quan */}
              <section id="tong-quan" className="mt-8 scroll-mt-28 border-t border-cvr-line pt-6">
                <h2 className="mb-4 text-lg font-semibold tracking-tight text-cvr-ink sm:text-xl">Tổng quan dự án</h2>
                <div className="space-y-3 text-sm leading-relaxed text-cvr-body">
                  {d.overview.map((t, i) => <p key={i}>{t}</p>)}
                </div>
                <div className="mt-6 grid grid-cols-1 gap-x-8 sm:grid-cols-2">
                  {d.scale.map((s) => (
                    <div key={s.label} className="flex items-center justify-between border-b border-cvr-line/70 py-3 text-sm">
                      <span className="text-cvr-muted">{s.label}</span>
                      <span className="font-medium text-cvr-ink">{s.value}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Vị trí */}
              <section id="vi-tri" className="mt-8 scroll-mt-28 border-t border-cvr-line pt-6">
                <h2 className="mb-4 text-lg font-semibold tracking-tight text-cvr-ink sm:text-xl">Vị trí dự án</h2>
                <div className="overflow-hidden rounded-xl border border-cvr-line">
                  <iframe title="Bản đồ" src={`https://maps.google.com/maps?q=${encodeURIComponent(d.mapQuery)}&z=14&output=embed`} className="h-[320px] w-full grayscale-[0.3]" loading="lazy" />
                </div>
                <p className="mt-2 text-xs text-cvr-muted">{p.location}</p>
              </section>

              {/* Mặt bằng dự án */}
              <section id="mat-bang" className="mt-8 scroll-mt-28 border-t border-cvr-line pt-6">
                <h2 className="mb-4 text-lg font-semibold tracking-tight text-cvr-ink sm:text-xl">Mặt bằng dự án</h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {["Mặt bằng tổng thể", "Mặt bằng phân khu", "Mặt bằng căn / nền điển hình"].map((m) => (
                    <a key={m} href="#tai-tai-lieu" className="group flex items-center gap-3 rounded-xl border border-cvr-line bg-cvr-surface p-4 transition hover:border-cvr-ink/30 hover:bg-black/[0.06]">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white text-cvr-ink shadow-sm">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-6 4h6m2 4H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z" /></svg>
                      </span>
                      <span className="flex flex-col">
                        <span className="text-sm font-semibold text-cvr-ink">{m}</span>
                        <span className="text-xs text-cvr-muted transition group-hover:text-cvr-ink">Tải file PDF →</span>
                      </span>
                    </a>
                  ))}
                </div>
                <p className="mt-3 text-xs text-cvr-faint">Bấm để nhận file mặt bằng chi tiết và bảng hàng mới nhất từ Coastal Land.</p>
              </section>

              {/* Bảng giá & loại căn */}
              <section id="bang-gia" className="mt-8 scroll-mt-28 border-t border-cvr-line pt-6">
                <h2 className="mb-4 text-lg font-semibold tracking-tight text-cvr-ink sm:text-xl">Bảng giá & loại hình</h2>
                <div className="overflow-hidden rounded-xl border border-cvr-line">
                  <div className="grid grid-cols-3 bg-cvr-surface px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-cvr-muted">
                    <span>Loại căn</span><span>Diện tích</span><span className="text-right">Giá tham khảo</span>
                  </div>
                  {unitTypes.map((u, i) => (
                    <div key={u.name} className="grid grid-cols-3 items-center border-t border-cvr-line/70 px-4 py-3 text-sm">
                      <span className="font-medium text-cvr-ink">{u.name}</span>
                      <span className="text-cvr-body">{u.area}</span>
                      <span className="text-right text-cvr-ink">{i === 0 ? p.priceFrom : "Liên hệ"}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-cvr-faint">* Giá &amp; loại căn mang tính tham khảo — nhận bảng giá chính thức mới nhất.</p>
                  <a href="#tai-tai-lieu" className="rounded-lg bg-cvr-gold px-4 py-2 text-xs font-semibold text-cvr-ink transition hover:bg-cvr-gold-soft">Nhận bảng giá chi tiết →</a>
                </div>
              </section>

              {/* Tiến độ dự án */}
              <section id="tien-do" className="mt-8 scroll-mt-28 border-t border-cvr-line pt-6">
                <h2 className="mb-5 text-lg font-semibold tracking-tight text-cvr-ink sm:text-xl">Tiến độ dự án</h2>
                <div className="flex items-center justify-between gap-1">
                  {progressSteps.map((s, i) => (
                    <div key={s} className="flex flex-1 flex-col items-center text-center">
                      <div className="flex w-full items-center">
                        <span className={`h-0.5 flex-1 ${i === 0 ? "bg-transparent" : i <= step ? "bg-cvr-gold" : "bg-cvr-line"}`} />
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${i <= step ? "bg-cvr-gold text-cvr-ink" : "border border-cvr-line text-cvr-faint"}`}>{i + 1}</span>
                        <span className={`h-0.5 flex-1 ${i === progressSteps.length - 1 ? "bg-transparent" : i < step ? "bg-cvr-gold" : "bg-cvr-line"}`} />
                      </div>
                      <span className={`mt-2 text-[11px] leading-tight sm:text-xs ${i <= step ? "text-cvr-ink" : "text-cvr-faint"}`}>{s}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-sm text-cvr-muted">Trạng thái hiện tại: <span className="font-semibold text-cvr-ink">{p.status}</span> · Dự kiến bàn giao: {d.handover}</p>
              </section>

              {/* Tiện ích */}
              <section id="tien-ich" className="mt-8 scroll-mt-28 border-t border-cvr-line pt-6">
                <h2 className="mb-4 text-lg font-semibold tracking-tight text-cvr-ink sm:text-xl">Tiện ích dự án</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {d.amenities.map((a) => (
                    <span key={a} className="flex items-center gap-2 rounded-lg border border-cvr-line bg-cvr-surface px-3 py-2.5 text-xs text-cvr-body">
                      <svg className="h-4 w-4 shrink-0 text-cvr-ink" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      {a}
                    </span>
                  ))}
                </div>
              </section>

              {/* Tin đăng mới nhất — DẠNG LIST, ưu tiên cùng dự án → cùng khu vực → cùng phân khúc */}
              {nearby.length > 0 && (
                <section id="tin-moi" className="mt-8 scroll-mt-28 border-t border-cvr-line pt-6">
                  <h2 className="mb-4 text-lg font-semibold tracking-tight text-cvr-ink sm:text-xl">Tin đăng mới nhất tại {province}</h2>
                  <ListingList items={nearby} />
                </section>
              )}
            </div>

            {/* Cột phụ */}
            <aside className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                <div className="rounded-2xl border border-cvr-line bg-white p-5 shadow-lux">
                  <p className="text-xs text-cvr-muted">Giá bán từ</p>
                  <p className="text-2xl font-bold tracking-tight text-cvr-ink">{p.priceFrom}</p>
                  <p className="mt-1 text-xs text-cvr-muted">{p.type}</p>
                  <div className="mt-4 space-y-2.5">
                    <a href="tel:0905000111" className="flex items-center justify-center gap-2 rounded-lg bg-cvr-ink px-4 py-3 text-sm font-bold text-white transition hover:bg-cvr-ink/90">Gọi tư vấn dự án</a>
                  </div>
                  <p className="mt-3 text-center text-[11px] text-cvr-faint">{d.developer} · Bàn giao {d.handover}</p>
                </div>

                {/* Tải tài liệu & báo giá */}
                <div id="tai-tai-lieu" className="scroll-mt-28">
                  <h3 className="mb-1 text-center text-lg font-semibold tracking-tight text-cvr-ink">Tải tài liệu & báo giá</h3>
                  <p className="mb-3 text-center text-xs text-cvr-muted">Nhận brochure, mặt bằng, bảng giá & chính sách mới nhất</p>
                  <LeadForm cta="Đăng ký nhận tài liệu" topics={["Nhận brochure & mặt bằng", "Nhận bảng giá & chính sách", "Đặt lịch tham quan dự án", "Tư vấn vay ngân hàng"]} />
                </div>
              </div>
            </aside>
          </div>

          {others.length > 0 && (
            <div className="mt-14">
              <h2 className="text-xl font-semibold tracking-tight text-cvr-ink sm:text-2xl">Dự án khác</h2>
              <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
                {others.map((o) => (
                  <Link key={o.slug} href={`/du-an/${o.slug}`} className="card-lux group relative flex flex-col overflow-hidden rounded-2xl border border-cvr-line bg-white shadow-lux shadow-lux-hover hover:-translate-y-1.5 hover:border-cvr-gold/45">
                    <span className="card-sheen" aria-hidden />
                    <div className="relative aspect-[16/10] overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={o.image} alt={o.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-cvr-ink transition-colors group-hover:text-cvr-gold-ink">{o.name}</h3>
                      <p className="mt-1 text-xs text-cvr-muted">{o.location}</p>
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
