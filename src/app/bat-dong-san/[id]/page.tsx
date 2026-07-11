import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Gallery from "@/components/Gallery";
import ListingSlider from "@/components/ListingSlider";
import RecordView from "@/components/RecordView";
import PriceHistory from "@/components/PriceHistory";
import { featuredListings, getListingById, buildListingDetail, provinceOf, pickRelated } from "@/lib/data";
import { tierFromBadge, getTier } from "@/lib/packages";

// Bắt buộc cho static export (GitHub Pages): liệt kê mọi id
export function generateStaticParams() {
  return featuredListings.map((l) => ({ id: l.id }));
}

// Chuyển chuỗi giá VN ("33 tỷ", "7,2 tỷ", "15 triệu") → số VNĐ cho Schema. Không parse được → null.
function parseVnd(s: string): number | null {
  const t = s.toLowerCase().replace(/\./g, "").replace(",", ".");
  const num = parseFloat(t);
  if (Number.isNaN(num)) return null;
  if (t.includes("tỷ")) return Math.round(num * 1e9);
  if (t.includes("triệu") || t.includes("tr")) return Math.round(num * 1e6);
  return null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const l = getListingById(id);
  if (!l) return { title: "Không tìm thấy | Coastal Land" };
  return {
    title: `${l.title} — ${l.price} | Coastal Land`,
    description: `${l.title} tại ${l.location}. Diện tích ${l.area}, giá ${l.price}. Xem hình ảnh, vị trí và thông tin chi tiết tại Coastal Land.`,
  };
}

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const l = getListingById(id);
  if (!l) notFound();
  const d = buildListingDetail(l);
  // Hạng CVR của tin (đồng bộ với thẻ tin V.7). Không có huy hiệu → tin thường.
  const tier = l.badge ? getTier(tierFromBadge(l.badge)) : null;
  const phoneTel = d.agent.phone.replace(/\s/g, "");

  // Schema.org RealEstateListing (IV.2) — dữ liệu chuẩn cho Google.
  const priceVnd = parseVnd(l.price);
  const areaNum = parseFloat(l.area.replace(",", "."));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: l.title,
    description: `${l.title} tại ${l.location}. Diện tích ${l.area}, giá ${l.price}.`,
    image: d.gallery,
    datePosted: d.postedDate,
    address: { "@type": "PostalAddress", addressLocality: l.location, addressCountry: "VN" },
    ...(Number.isNaN(areaNum) ? {} : { floorSize: { "@type": "QuantitativeValue", value: areaNum, unitCode: "MTK" } }),
    ...(priceVnd == null ? {} : { offers: { "@type": "Offer", priceCurrency: "VND", price: priceVnd, availability: "https://schema.org/InStock" } }),
  };

  // Mục đích tin → breadcrumb + tin liên quan cùng mục đích (bán/thuê)
  const purpose = l.purpose ?? "ban";
  const purposeHref = purpose === "thue" ? "/cho-thue" : "/mua-ban";
  const purposeLabel = purpose === "thue" ? "Nhà đất cho thuê" : "Nhà đất bán";

  // Tin tương tự: BẮT BUỘC cùng MỤC ĐÍCH (bán↔bán, thuê↔thuê), sắp theo độ liên quan
  // — cùng TỈNH (+2) và cùng LOẠI HÌNH (+1). Hiện HẾT (không giới hạn) để chạy slider.
  const curProvince = provinceOf(l.location);
  const samePurpose = featuredListings.filter((x) => x.id !== l.id && (x.purpose ?? "ban") === purpose);
  const relatedFill = pickRelated(
    samePurpose,
    (x) => (provinceOf(x.location) === curProvince ? 2 : 0) + (x.type === l.type ? 1 : 0),
    samePurpose.length,
  );

  return (
    <>
      <Header />
      <RecordView id={l.id} />
      {/* Schema.org RealEstateListing — dữ liệu chuẩn cho Google (IV.2) */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="flex-1 bg-white">
        <div className="mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-20">
          {/* Breadcrumb */}
          <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-cvr-muted">
            <Link href="/" className="hover:text-cvr-ink">Trang chủ</Link>
            <span>/</span>
            <Link href={purposeHref} className="hover:text-cvr-ink">{purposeLabel}</Link>
            <span>/</span>
            <span className="line-clamp-1 text-cvr-body">{l.title}</span>
          </nav>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Cột chính */}
            <div className="lg:col-span-2">
              <Gallery images={d.gallery} alt={l.title} />

              {/* Tiêu đề + giá */}
              <div className="mt-6">
                {tier ? (
                  <span className="mb-2 inline-block rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-cvr-ink" style={{ backgroundColor: tier.accent }}>
                    {tier.name}
                  </span>
                ) : (
                  <span className="mb-2 inline-block rounded bg-cvr-surface px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-cvr-muted ring-1 ring-cvr-line">
                    Tin thường
                  </span>
                )}
                <h1 className="text-2xl font-semibold leading-tight tracking-tight text-cvr-ink sm:text-3xl">{l.title}</h1>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-cvr-muted">
                  <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  {l.location}
                </p>
                <div className="mt-4 flex flex-wrap items-end gap-x-8 gap-y-3 rounded-xl border border-cvr-line bg-cvr-surface p-4">
                  <Stat label="Mức giá" value={l.price} big accent />
                  <Stat label="Diện tích" value={l.area} big />
                  {l.pricePerM2 && <Stat label="Giá / m²" value={l.pricePerM2} />}
                  {l.beds && <Stat label="Phòng ngủ" value={`${l.beds}`} />}
                  {l.baths && <Stat label="Phòng tắm" value={`${l.baths}`} />}
                </div>
              </div>

              {/* Mô tả — Homedy đặt "Thông tin mô tả" ngay sau phần đầu */}
              <Section title="Thông tin mô tả">
                <div className="space-y-3 text-sm leading-relaxed text-cvr-body">
                  {d.description.map((p, i) => <p key={i}>{p}</p>)}
                </div>
              </Section>

              {/* Đặc điểm bất động sản — sau phần mô tả (giống Homedy) */}
              <Section title="Đặc điểm bất động sản">
                <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
                  <Row label="Loại hình" value={l.type} />
                  {d.specs.map((f) => <Row key={f.label} label={f.label} value={f.value} />)}
                  <Row label="Tình trạng pháp lý" value={d.legal} />
                  <Row label="Tình trạng nội thất" value={d.furnish} />
                </div>
              </Section>

              {/* Nội thất */}
              {d.interior.length > 0 && (
                <Section title="Nội thất bàn giao">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {d.interior.map((a) => (
                      <span key={a} className="flex items-center gap-2 rounded-lg border border-cvr-line bg-cvr-surface px-3 py-2.5 text-xs text-cvr-body">
                        <svg className="h-4 w-4 shrink-0 text-cvr-gold-ink" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        {a}
                      </span>
                    ))}
                  </div>
                </Section>
              )}

              {/* Tiện ích */}
              <Section title="Tiện ích">
                <div className="space-y-5">
                  {d.amenityGroups.map((g) => {
                    const active = g.items.filter((it) => it.active);
                    if (active.length === 0) return null;
                    return (
                      <div key={g.group}>
                        <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-cvr-faint">{g.group}</p>
                        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                          {active.map((it) => (
                            <span key={it.name} className="flex items-center gap-2 rounded-lg border border-cvr-line bg-cvr-surface px-3 py-2.5 text-xs text-cvr-body">
                              <svg className="h-4 w-4 shrink-0 text-cvr-gold-ink" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                              {it.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Section>

              {/* Lịch sử giá (minh hoạ) — chỉ khi có giá dạng số */}
              {priceVnd != null && (
                <Section title="Lịch sử giá">
                  <PriceHistory price={priceVnd} />
                </Section>
              )}

              {/* Vị trí */}
              <Section title="Vị trí trên bản đồ">
                <div className="overflow-hidden rounded-xl border border-cvr-line">
                  <iframe
                    title="Bản đồ"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(d.mapQuery)}&z=14&output=embed`}
                    className="h-[320px] w-full"
                    loading="lazy"
                  />
                </div>
                <p className="mt-2 text-xs text-cvr-muted">{l.location}</p>
              </Section>
            </div>

            {/* Cột phụ — môi giới (dính khi cuộn) */}
            <aside className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                <div className="rounded-none border border-cvr-line bg-white p-5 shadow-sm">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-cvr-faint">Liên hệ tư vấn</p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cvr-surface text-lg font-bold text-cvr-ink ring-1 ring-cvr-line">
                      {d.agent.name.split(" ").pop()?.[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-cvr-ink">{d.agent.name}</p>
                      <p className="text-xs text-cvr-muted">{d.agent.role} · Coastal Land</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2.5">
                    <a href={`tel:${d.agent.phone.replace(/\s/g, "")}`} className="flex items-center justify-center gap-2 rounded-lg bg-cvr-ink px-4 py-3 text-sm font-bold text-white transition hover:bg-cvr-body">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.95.68l1.5 4.5a1 1 0 01-.5 1.2l-2.26 1.13a11 11 0 005.52 5.52l1.13-2.26a1 1 0 011.2-.5l4.5 1.5a1 1 0 01.68.95V19a2 2 0 01-2 2h-1C9.7 21 3 14.3 3 6V5z" /></svg>
                      {d.agent.phone}
                    </a>
                    <a href={`https://zalo.me/${d.agent.zalo}`} className="flex items-center justify-center gap-2 rounded-lg border border-cvr-line px-4 py-3 text-sm font-semibold text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink">
                      Nhắn Zalo
                    </a>
                  </div>
                  <p className="mt-3 text-center text-[11px] text-cvr-faint">Mã tin: {d.code} · Đăng {d.postedDate}</p>
                </div>

                <div className="rounded-none border border-cvr-line bg-white p-5 text-sm shadow-sm">
                  <p className="font-semibold text-cvr-ink">Pháp lý & cam kết</p>
                  <ul className="mt-3 space-y-2 text-cvr-body">
                    <li className="flex gap-2"><span className="text-cvr-gold-ink">✓</span> {d.legal}</li>
                    <li className="flex gap-2"><span className="text-cvr-gold-ink">✓</span> Hướng nhà: {d.direction}</li>
                    <li className="flex gap-2"><span className="text-cvr-gold-ink">✓</span> Kiểm chứng thực địa</li>
                    <li className="flex gap-2"><span className="text-cvr-gold-ink">✓</span> Hỗ trợ thủ tục công chứng</li>
                  </ul>
                </div>
              </div>
            </aside>
          </div>

          {/* BĐS tương tự — slider cuộn ngang, hiện hết số tin tương tự (không giới hạn) */}
          {relatedFill.length > 0 && (
            <div className="mt-14">
              <h2 className="mb-5 text-xl font-semibold tracking-tight text-cvr-ink sm:text-2xl">Bất động sản tương tự</h2>
              <ListingSlider items={relatedFill} />
            </div>
          )}
        </div>

        {/* Thanh liên hệ DÍNH (mobile) — Gọi / Zalo bám đáy màn hình (III.4) */}
        <div className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-cvr-line bg-white/95 p-3 backdrop-blur-md lg:hidden">
          <a
            href={`tel:${phoneTel}`}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-cvr-ink py-3 text-sm font-bold text-white transition active:scale-95"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.95.68l1.5 4.5a1 1 0 01-.5 1.2l-2.26 1.13a11 11 0 005.52 5.52l1.13-2.26a1 1 0 011.2-.5l4.5 1.5a1 1 0 01.68.95V19a2 2 0 01-2 2h-1C9.7 21 3 14.3 3 6V5z" /></svg>
            Gọi ngay
          </a>
          <a
            href={`https://zalo.me/${d.agent.zalo}`}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-cvr-line bg-white py-3 text-sm font-semibold text-cvr-body transition active:scale-95"
          >
            Nhắn Zalo
          </a>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 border-t border-cvr-line pt-6">
      <h2 className="mb-4 text-lg font-semibold tracking-tight text-cvr-ink sm:text-xl">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-cvr-line py-3 text-sm">
      <span className="text-cvr-muted">{label}</span>
      <span className="font-medium text-cvr-ink">{value}</span>
    </div>
  );
}

function Stat({ label, value, big, accent }: { label: string; value: string; big?: boolean; accent?: boolean }) {
  return (
    <div>
      <p className="text-xs text-cvr-muted">{label}</p>
      <p className={`font-bold ${accent ? "text-red-500" : "text-cvr-ink"} ${big ? "text-xl" : "text-base"}`}>{value}</p>
    </div>
  );
}
