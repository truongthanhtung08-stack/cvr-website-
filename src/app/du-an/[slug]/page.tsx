import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProjectGallery from "@/components/ProjectGallery";
import ProjectNav from "@/components/ProjectNav";
import ProjectNearby from "@/components/ProjectNearby";
import FloorPlans from "@/components/FloorPlans";
import RelatedListingsTabs from "@/components/RelatedListingsTabs";
import LeadForm from "@/components/LeadForm";
import RichContent from "@/components/RichContent";
import VideoEmbed from "@/components/VideoEmbed";
import { provinceOf, districtOf, segmentOf, pickRelated } from "@/lib/data";
import { getProject, getProjects } from "@/lib/contentDb";
import { getListings } from "@/lib/listingsDb";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProject(slug);
  if (!p) return { title: "Không tìm thấy dự án | Coastal Land" };
  return {
    title: `${p.name} — ${p.priceFrom} | Coastal Land`,
    description: `Dự án ${p.name} tại ${p.location}. ${p.type}, ${p.status}. Tổng quan, vị trí, mặt bằng, tiện ích, tiến độ, bảng giá, chủ đầu tư và tin bán/cho thuê liên quan.`,
  };
}

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

// Chuẩn hoá website chủ đầu tư → có http để mở tab mới
function normalizeUrl(u: string): string {
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [p, projects, listings] = await Promise.all([getProject(slug), getProjects(), getListings()]);
  if (!p) notFound();

  const gallery = Array.from(
    new Set([...(p.photos ?? [p.image]), ...projects.filter((x) => x.slug !== p.slug).map((x) => x.image)]),
  ).slice(0, 8);

  const province = provinceOf(p.location);
  const handover = p.scale.find((s) => s.label.includes("Bàn giao"))?.value ?? p.status;
  const mapQuery = `${p.location}, Việt Nam`;
  const step = currentStep(p.status);

  const purposes = p.purposes?.length ? p.purposes : ["ban" as const];
  const floorPlans = p.floorPlans ?? [];
  const priceTable = p.priceTable ?? [];
  const places = p.places ?? [];
  const dev = p.developerInfo;

  // Giá hiển thị 1 dòng bảng giá: ẩn giá / bỏ trống → "Liên hệ"
  const rowPrice = (price: string) => (p.priceMode === "show" && price ? price : "Liên hệ");

  // Dự án khác — ưu tiên cùng tỉnh + cùng loại hình
  const others = pickRelated(
    projects.filter((x) => x.slug !== p.slug),
    (x) => (provinceOf(x.location) === province ? 2 : 0) + (x.type === p.type ? 1 : 0),
    3,
  );

  // Tin liên quan trong tỉnh — xếp theo cùng dự án → cùng khu vực → cùng phân khúc,
  // rồi tách theo Bán / Cho thuê cho tab tin liên quan.
  const projSegment = segmentOf(p.type);
  const projDistrict = districtOf(p.location);
  const score = (x: (typeof listings)[number]) =>
    (x.title.includes(p.name) ? 100 : 0) +
    (districtOf(x.location) === projDistrict ? 20 : 0) +
    (segmentOf(x.type) !== "" && segmentOf(x.type) === projSegment ? 5 : 0);
  const inProvince = listings.filter((x) => provinceOf(x.location) === province);
  const relBan = pickRelated(inProvince.filter((x) => (x.purpose ?? "ban") === "ban"), score, 6);
  const relThue = pickRelated(inProvince.filter((x) => (x.purpose ?? "ban") === "thue"), score, 6);
  const hasRelated = relBan.length > 0 || relThue.length > 0;

  // Menu — chỉ mục có nội dung (khớp id các <section>)
  const nav = [
    { id: "tong-quan", label: "Tổng quan" },
    ...(p.videos?.length ? [{ id: "video", label: "Video" }] : []),
    { id: "vi-tri", label: "Vị trí" },
    ...(floorPlans.length ? [{ id: "mat-bang", label: "Mặt bằng" }] : []),
    { id: "tien-ich", label: "Tiện ích" },
    { id: "tien-do", label: "Tiến độ" },
    { id: "bang-gia", label: "Bảng giá" },
    { id: "chu-dau-tu", label: "Chủ đầu tư" },
    ...(hasRelated ? [{ id: "tin-dang", label: "Tin bán / cho thuê" }] : []),
  ];

  return (
    <>
      <Header />
      <main className="flex-1 bg-white">
        <div className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">

          {/* Thư viện ảnh — bấm để xem lớn + zoom */}
          <ProjectGallery images={gallery} alt={p.name} />

          {/* Tiêu đề + địa chỉ — bố cục cân đối, rõ ràng */}
          <div className="mt-5">
            <div className="flex flex-wrap items-center gap-2">
              {purposes.includes("ban") && <PurposeChip>Bán</PurposeChip>}
              {purposes.includes("thue") && <PurposeChip>Cho thuê</PurposeChip>}
              <span className="rounded-full bg-cvr-surface px-3 py-1 text-xs font-medium text-cvr-body">{p.status}</span>
            </div>
            <h1 className="mt-2.5 text-2xl font-semibold leading-tight tracking-tight text-cvr-ink sm:text-3xl">{p.name}</h1>
            <p className="mt-2 flex items-start gap-1.5 text-sm text-cvr-muted">
              <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <span>{p.location}</span>
            </p>

            {/* Dải thông tin nhanh — cân đối, dễ đọc từng tiêu chí */}
            <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-cvr-line bg-cvr-line sm:grid-cols-4">
              <Fact label="Giá từ" value={p.priceFrom} accent />
              <Fact label="Loại hình" value={p.type} />
              <Fact label="Chủ đầu tư" value={p.developer} />
              <Fact label="Bàn giao" value={handover} />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              {/* Menu dính — sáng theo mục đang xem, bấm để cuộn mượt */}
              <ProjectNav items={nav} />

              {/* 1) Tổng quan */}
              <Section id="tong-quan" title="Tổng quan dự án">
                <div className="space-y-3 text-sm leading-relaxed text-cvr-body">
                  <RichContent paragraphs={p.overview} />
                </div>
                {p.scale.length > 0 && (
                  <div className="mt-6 grid grid-cols-1 gap-x-8 sm:grid-cols-2">
                    {p.scale.map((s) => (
                      <div key={s.label} className="flex items-center justify-between border-b border-cvr-line/70 py-3 text-sm">
                        <span className="text-cvr-muted">{s.label}</span>
                        <span className="font-medium text-cvr-ink">{s.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Section>

              {/* Video (nếu có) */}
              {p.videos && p.videos.length > 0 && (
                <Section id="video" title="Video dự án">
                  <div className="space-y-4">
                    {p.videos.map((v, i) => <VideoEmbed key={i} url={v} />)}
                  </div>
                </Section>
              )}

              {/* 2) Vị trí — bản đồ + tiện ích xung quanh + chỉ đường từ vị trí của bạn */}
              <Section id="vi-tri" title="Vị trí & tiện ích xung quanh">
                <ProjectNearby mapQuery={mapQuery} address={p.location} places={places} />
              </Section>

              {/* 3) Mặt bằng — ảnh từng tháp/tầng/loại căn, bấm để phóng to */}
              {floorPlans.length > 0 && (
                <Section id="mat-bang" title="Mặt bằng dự án">
                  <FloorPlans items={floorPlans} />
                </Section>
              )}

              {/* 4) Tiện ích dự án */}
              {p.amenities.length > 0 && (
                <Section id="tien-ich" title="Tiện ích dự án">
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                    {p.amenities.map((a) => (
                      <span key={a} className="flex items-start gap-2.5 rounded-xl border border-cvr-line bg-cvr-surface px-4 py-3 text-sm leading-snug text-cvr-body">
                        <svg className="mt-0.5 h-4 w-4 shrink-0 text-cvr-blue" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        <span className="min-w-0">{a}</span>
                      </span>
                    ))}
                  </div>
                </Section>
              )}

              {/* 5) Tiến độ dự án */}
              <Section id="tien-do" title="Tiến độ dự án">
                <div className="flex items-center justify-between gap-1">
                  {progressSteps.map((s, i) => (
                    <div key={s} className="flex flex-1 flex-col items-center text-center">
                      <div className="flex w-full items-center">
                        <span className={`h-0.5 flex-1 ${i === 0 ? "bg-transparent" : i <= step ? "bg-cvr-blue" : "bg-cvr-line"}`} />
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${i <= step ? "bg-cvr-blue text-white" : "border border-cvr-line text-cvr-faint"}`}>{i + 1}</span>
                        <span className={`h-0.5 flex-1 ${i === progressSteps.length - 1 ? "bg-transparent" : i < step ? "bg-cvr-blue" : "bg-cvr-line"}`} />
                      </div>
                      <span className={`mt-2 text-[11px] leading-tight sm:text-xs ${i <= step ? "text-cvr-ink" : "text-cvr-faint"}`}>{s}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-sm text-cvr-muted">Trạng thái hiện tại: <span className="font-semibold text-cvr-ink">{p.status}</span> · Dự kiến bàn giao: {handover}</p>
              </Section>

              {/* 6) Bảng giá — cấu trúc Loại căn – Diện tích – Hướng – Giá (ẩn/hiện giá) */}
              <Section id="bang-gia" title="Bảng giá & loại hình">
                {priceTable.length > 0 ? (
                  <div className="overflow-hidden rounded-xl border border-cvr-line">
                    <div className="grid grid-cols-[1.4fr_1fr_0.8fr_1fr] bg-cvr-surface px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-cvr-muted">
                      <span>Loại căn</span><span>Diện tích</span><span>Hướng</span><span className="text-right">Giá</span>
                    </div>
                    {priceTable.map((u, i) => (
                      <div key={i} className="grid grid-cols-[1.4fr_1fr_0.8fr_1fr] items-center border-t border-cvr-line/70 px-4 py-3 text-sm">
                        <span className="font-medium text-cvr-ink">{u.unit || "—"}</span>
                        <span className="text-cvr-body">{u.area || "—"}</span>
                        <span className="text-cvr-body">{u.direction || "—"}</span>
                        <span className={`text-right ${rowPrice(u.price) === "Liên hệ" ? "text-cvr-muted" : "font-semibold text-cvr-ink"}`}>{rowPrice(u.price)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-cvr-line bg-cvr-surface px-4 py-6 text-center">
                    <p className="text-sm text-cvr-body">Bảng giá &amp; loại căn đang được cập nhật.</p>
                  </div>
                )}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-cvr-faint">* Liên hệ để nhận bảng giá &amp; chính sách bán hàng mới nhất.</p>
                  <a href="#tai-tai-lieu" className="rounded-lg bg-cvr-blue px-4 py-2 text-xs font-semibold text-white transition hover:bg-cvr-blue-ink">Nhận bảng giá chi tiết →</a>
                </div>
              </Section>

              {/* 7) Chủ đầu tư */}
              <Section id="chu-dau-tu" title="Chủ đầu tư">
                <div className="flex items-start gap-4">
                  {dev?.logo ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={dev.logo} alt={p.developer} className="h-16 w-16 shrink-0 rounded-lg object-contain ring-1 ring-cvr-line" />
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-cvr-surface text-xl font-bold text-cvr-ink ring-1 ring-cvr-line">
                      {p.developer.trim()[0] ?? "C"}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold text-cvr-ink">{p.developer}</p>
                    {dev?.established && <p className="mt-0.5 text-sm text-cvr-muted">{dev.established}</p>}
                    {dev?.website && (
                      <a href={normalizeUrl(dev.website)} target="_blank" rel="noopener noreferrer" className="mt-0.5 inline-block text-sm font-medium text-cvr-blue-ink hover:text-cvr-blue">
                        {dev.website} ↗
                      </a>
                    )}
                  </div>
                </div>
                {dev?.desc && <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-cvr-body">{dev.desc}</p>}
              </Section>

              {/* 8) Tin bán / cho thuê liên quan */}
              {hasRelated && (
                <Section id="tin-dang" title={`Tin bán & cho thuê tại ${province}`}>
                  <RelatedListingsTabs ban={relBan} thue={relThue} />
                </Section>
              )}
            </div>

            {/* Cột phụ — giá & liên hệ (dính khi cuộn) */}
            <aside className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                <div className="rounded-2xl border border-cvr-line bg-white p-5 shadow-lux">
                  <p className="text-xs text-cvr-muted">Giá bán từ</p>
                  <p className="text-2xl font-bold tracking-tight text-cvr-ink">{p.priceFrom}</p>
                  <p className="mt-1 text-xs text-cvr-muted">{p.type}</p>
                  <div className="mt-4 space-y-2.5">
                    <a href="tel:0905000111" className="flex items-center justify-center gap-2 rounded-lg bg-cvr-ink px-4 py-3 text-sm font-bold text-white transition hover:bg-cvr-ink/90">Gọi tư vấn dự án</a>
                  </div>
                  <p className="mt-3 text-center text-[11px] text-cvr-faint">{p.developer} · Bàn giao {handover}</p>
                </div>

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
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold tracking-tight text-cvr-ink sm:text-2xl">Dự án liên quan</h2>
                <Link href="/du-an" className="shrink-0 text-sm font-medium text-cvr-muted transition-colors hover:text-cvr-ink">Xem thêm →</Link>
              </div>
              <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
                {others.map((o) => (
                  <Link key={o.slug} href={`/du-an/${o.slug}`} className="card-lux group relative flex flex-col overflow-hidden rounded-none border-0 bg-white shadow-lux shadow-lux-hover hover:-translate-y-1.5 hover:border-cvr-blue/45 sm:border sm:border-cvr-line">
                    <span className="card-sheen" aria-hidden />
                    <div className="relative aspect-[16/10] overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={o.image} alt={o.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-cvr-ink transition-colors group-hover:text-cvr-blue-ink">{o.name}</h3>
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

// Section chuẩn — có id để menu cuộn tới, tiêu đề nhất quán
function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-8 scroll-mt-28 border-t border-cvr-line pt-6">
      <h2 className="mb-4 text-lg font-semibold tracking-tight text-cvr-ink sm:text-xl">{title}</h2>
      {children}
    </section>
  );
}

function Fact({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-white px-4 py-3">
      <p className="text-[11px] uppercase tracking-wide text-cvr-faint">{label}</p>
      <p className={`mt-0.5 text-sm font-semibold leading-snug break-words ${accent ? "text-cvr-blue-ink" : "text-cvr-ink"}`} title={value}>{value}</p>
    </div>
  );
}

function PurposeChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-cvr-ink px-3 py-1 text-xs font-semibold text-white">{children}</span>
  );
}
