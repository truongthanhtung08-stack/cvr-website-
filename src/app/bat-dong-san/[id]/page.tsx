import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Gallery from "@/components/Gallery";
import ListingSlider from "@/components/ListingSlider";
import RecordView from "@/components/RecordView";
import PriceHistory from "@/components/PriceHistory";
import { featuredListings, provinceOf, pickRelated } from "@/lib/data";
import { getListing, getListings, getListingDetail } from "@/lib/listingsDb";
import { tierFromBadge, getTier } from "@/lib/packages";
import RichContent from "@/components/RichContent";
import VideoEmbed from "@/components/VideoEmbed";

// Prerender sẵn các tin mẫu; tin mới (id UUID từ Supabase) render theo yêu cầu.
export function generateStaticParams() {
  return featuredListings.map((l) => ({ id: l.id }));
}
export const dynamicParams = true;

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
  const l = await getListing(id); // B2: đọc Supabase, fallback dữ liệu mẫu
  if (!l) return { title: "Không tìm thấy | Coastal Land" };
  return {
    title: `${l.title} — ${l.price} | Coastal Land`,
    description: `${l.title} tại ${l.location}. Diện tích ${l.area}, giá ${l.price}. Xem hình ảnh, vị trí và thông tin chi tiết tại Coastal Land.`,
  };
}

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await getListingDetail(id); // DỮ LIỆU THẬT: ảnh, đặc điểm, tiện ích, người đăng
  if (!d) notFound();
  const l = d.listing;
  // Hạng CVR của tin (đồng bộ với thẻ tin V.7). Không có huy hiệu → tin thường.
  const tier = l.badge ? getTier(tierFromBadge(l.badge)) : null;

  // Liên hệ: người đăng đã nhập → dùng; chưa có → hotline Coastal Land.
  const contact = d.contact ?? { name: "Coastal Land", phone: "0905 000 111", email: "", avatar: null };
  const phoneTel = contact.phone.replace(/\s/g, "");
  const zalo = phoneTel.replace(/\D/g, "");

  // Schema.org RealEstateListing (IV.2) — dữ liệu chuẩn cho Google.
  const priceVnd = parseVnd(l.price);
  const areaNum = parseFloat(l.area.replace(",", "."));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: l.title,
    description: `${l.title} tại ${l.location}. Diện tích ${l.area}, giá ${l.price}.`,
    image: d.images,
    address: { "@type": "PostalAddress", addressLocality: l.location, addressCountry: "VN" },
    ...(Number.isNaN(areaNum) ? {} : { floorSize: { "@type": "QuantitativeValue", value: areaNum, unitCode: "MTK" } }),
    ...(priceVnd == null ? {} : { offers: { "@type": "Offer", priceCurrency: "VND", price: priceVnd, availability: "https://schema.org/InStock" } }),
  };

  // Mục đích tin → breadcrumb + tin liên quan cùng mục đích (bán/thuê)
  const purpose = l.purpose ?? "ban";

  // Tin tương tự: BẮT BUỘC cùng MỤC ĐÍCH (bán↔bán, thuê↔thuê), sắp theo độ liên quan
  // — cùng TỈNH (+2) và cùng LOẠI HÌNH (+1). Hiện HẾT (không giới hạn) để chạy slider.
  const curProvince = provinceOf(l.location);
  const all = await getListings(); // B2: tin tương tự cũng lấy từ Supabase
  const samePurpose = all.filter((x) => x.id !== l.id && (x.purpose ?? "ban") === purpose);
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

          {/* Thư viện ảnh THẬT — tràn full chiều rộng phía trên (kiểu Homedy) */}
          <div className="mb-6">
            <Gallery images={d.images} alt={l.title} />
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Cột chính */}
            <div className="lg:col-span-2">
              {/* Tiêu đề + giá */}
              <div>
                {tier ? (
                  <span className="mb-2 inline-block rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white" style={{ backgroundColor: tier.accent }}>
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
                  {d.addressDetail ? `${d.addressDetail}, ` : ""}{l.location}
                </p>
                <div className="mt-4 flex flex-wrap items-end gap-x-8 gap-y-3 rounded-xl border border-cvr-line bg-cvr-surface p-4">
                  <Stat label="Mức giá" value={l.price} big accent />
                  <Stat label="Diện tích đất" value={l.area} big />
                  {d.builtArea && <Stat label="Diện tích XD" value={d.builtArea} />}
                  {l.pricePerM2 && <Stat label="Giá / m²" value={l.pricePerM2} />}
                  {l.beds && <Stat label="Phòng ngủ" value={`${l.beds}`} />}
                  {l.baths && <Stat label="Phòng tắm" value={`${l.baths}`} />}
                </div>
              </div>

              {/* Mô tả — chỉ hiện khi người đăng có viết (không bịa) */}
              {d.descriptionParas.length > 0 && (
                <Section title="Thông tin mô tả">
                  <div className="space-y-3 whitespace-pre-line text-sm leading-relaxed text-cvr-body">
                    <RichContent paragraphs={d.descriptionParas} />
                  </div>
                </Section>
              )}

              {/* Video — tệp/link người đăng thêm ở mục tải ảnh */}
              {d.videos.length > 0 && (
                <Section title="Video">
                  <div className="space-y-4">
                    {d.videos.map((v, i) => <VideoEmbed key={i} url={v} />)}
                  </div>
                </Section>
              )}

              {/* Đặc điểm bất động sản — chỉ những gì đã nhập */}
              <Section title="Đặc điểm bất động sản">
                <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
                  <Row label="Loại hình" value={l.type} />
                  <Row label="Diện tích đất" value={l.area} />
                  {d.builtArea && <Row label="Diện tích xây dựng" value={d.builtArea} />}
                  {l.beds ? <Row label="Phòng ngủ" value={`${l.beds}`} /> : null}
                  {l.baths ? <Row label="Phòng tắm" value={`${l.baths}`} /> : null}
                  {d.direction && <Row label="Hướng" value={d.direction} />}
                  {d.specs.map((f) => <Row key={f.label} label={f.label} value={f.value} />)}
                  <Row label="Tình trạng pháp lý" value={d.legal ?? "Chưa cập nhật"} />
                  {d.furnish && <Row label="Tình trạng nội thất" value={d.furnish} />}
                </div>
              </Section>

              {/* Nội thất — chỉ khi người đăng tick */}
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

              {/* Tiện ích — chỉ khi có mục được tick */}
              {d.amenityGroups.some((g) => g.items.some((it) => it.active)) && (
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
              )}

              {/* Lịch sử giá — chỉ khi có giá dạng số */}
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
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-cvr-faint">Liên hệ {d.contact ? "người đăng" : "tư vấn"}</p>
                  <div className="flex items-center gap-3">
                    {contact.avatar ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={contact.avatar} alt={contact.name} className="h-12 w-12 shrink-0 rounded-full object-cover ring-1 ring-cvr-line" />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cvr-surface text-lg font-bold text-cvr-ink ring-1 ring-cvr-line">
                        {contact.name.split(" ").pop()?.[0] ?? "C"}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-cvr-ink">{contact.name}</p>
                      <p className="text-xs text-cvr-muted">{d.contact ? "Người đăng tin" : "Chuyên viên"} · Coastal Land</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2.5">
                    <a href={`tel:${phoneTel}`} className="flex items-center justify-center gap-2 rounded-lg bg-cvr-ink px-4 py-3 text-sm font-bold text-white transition hover:bg-cvr-body">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.95.68l1.5 4.5a1 1 0 01-.5 1.2l-2.26 1.13a11 11 0 005.52 5.52l1.13-2.26a1 1 0 011.2-.5l4.5 1.5a1 1 0 01.68.95V19a2 2 0 01-2 2h-1C9.7 21 3 14.3 3 6V5z" /></svg>
                      {contact.phone}
                    </a>
                    <a href={`https://zalo.me/${zalo}`} className="flex items-center justify-center gap-2 rounded-lg border border-cvr-line px-4 py-3 text-sm font-semibold text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink">
                      Nhắn Zalo
                    </a>
                  </div>
                  <p className="mt-3 text-center text-[11px] text-cvr-faint">Mã tin: {l.id.slice(0, 8).toUpperCase()}</p>
                </div>

                <div className="rounded-none border border-cvr-line bg-white p-5 text-sm shadow-sm">
                  <p className="font-semibold text-cvr-ink">Pháp lý & cam kết</p>
                  <ul className="mt-3 space-y-2 text-cvr-body">
                    <li className="flex gap-2"><span className="text-cvr-gold-ink">✓</span> Pháp lý: {d.legal ?? "Liên hệ để biết chi tiết"}</li>
                    {d.direction && <li className="flex gap-2"><span className="text-cvr-gold-ink">✓</span> Hướng: {d.direction}</li>}
                    <li className="flex gap-2"><span className="text-cvr-gold-ink">✓</span> Kiểm chứng thực địa trước khi đăng</li>
                    <li className="flex gap-2"><span className="text-cvr-gold-ink">✓</span> Hỗ trợ thủ tục công chứng, sang tên</li>
                  </ul>
                </div>
              </div>
            </aside>
          </div>

          {/* BĐS tương tự — slide 8 tin + nút "Xem thêm" → ra list theo trang (yêu cầu T19) */}
          {relatedFill.length > 0 && (
            <div className="mt-14">
              <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold tracking-tight text-cvr-ink sm:text-2xl">Bất động sản tương tự</h2>
                <Link
                  href={purpose === "thue" ? "/cho-thue" : "/mua-ban"}
                  className="shrink-0 text-sm font-medium text-cvr-muted transition-colors hover:text-cvr-ink"
                >
                  Xem thêm →
                </Link>
              </div>
              <ListingSlider items={relatedFill.slice(0, 8)} />
            </div>
          )}
        </div>

        {/* Thanh liên hệ DÍNH (mobile) — Gọi / Zalo bám đáy màn hình (III.4) */}
        <div className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-cvr-line bg-white/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden">
          <a
            href={`tel:${phoneTel}`}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-cvr-ink py-3 text-sm font-bold text-white transition active:scale-95"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.95.68l1.5 4.5a1 1 0 01-.5 1.2l-2.26 1.13a11 11 0 005.52 5.52l1.13-2.26a1 1 0 011.2-.5l4.5 1.5a1 1 0 01.68.95V19a2 2 0 01-2 2h-1C9.7 21 3 14.3 3 6V5z" /></svg>
            Gọi ngay
          </a>
          <a
            href={`https://zalo.me/${zalo}`}
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
