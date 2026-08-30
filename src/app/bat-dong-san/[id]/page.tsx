import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Gallery from "@/components/Gallery";
import ListingShowcase from "@/components/ListingShowcase";
import { HomeExpandProvider, HomeCollapsible } from "@/components/HomeExpand";
import RecordView from "@/components/RecordView";
import ListingActions from "@/components/ListingActions";
import PriceHistory from "@/components/PriceHistory";
import ProjectNearby from "@/components/ProjectNearby";
import ProjectNav from "@/components/ProjectNav";
import { BreadcrumbJsonLd } from "@/components/Breadcrumb";
import { provinceOf, districtOf, pickRelated } from "@/lib/data";
import { getListing, getListings, getListingDetail } from "@/lib/listingsDb";
import { tierFromBadge, getTier } from "@/lib/packages";
import RichContent from "@/components/RichContent";
import VideoEmbed from "@/components/VideoEmbed";

// Trang chi tiết đọc Supabase với cache no-store (admin sửa hiện NGAY) → BẮT BUỘC
// render động theo yêu cầu. Không thì Next xếp tĩnh (SSG) rồi lỗi "static→dynamic" → 500.
export const dynamic = "force-dynamic";

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
  if (!l) return { title: "Không tìm thấy", robots: { index: false, follow: true } };
  const desc = `${l.title} tại ${l.location}. Giá ${l.price}${l.area ? `, diện tích ${l.area}` : ""}. Hình thật, liên hệ trực tiếp người đăng trên Coastal Land.`;
  return {
    title: `${l.title} — ${l.price}`,
    description: desc,
    alternates: { canonical: `/bat-dong-san/${id}` },
    openGraph: {
      title: `${l.title} — ${l.price}`,
      description: desc,
      url: `/bat-dong-san/${id}`,
      type: "website",
      ...(l.image ? { images: [{ url: l.image, alt: l.title }] } : {}),
    },
  };
}

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await getListingDetail(id); // DỮ LIỆU THẬT: ảnh, đặc điểm, tiện ích, người đăng
  if (!d) notFound();
  const l = d.listing;
  // Hạng CVR của tin (đồng bộ với thẻ tin V.7). Không có huy hiệu → tin thường.
  const tier = l.badge ? getTier(tierFromBadge(l.badge)) : null;

  // Liên hệ: LUÔN là NGƯỜI ĐĂNG (thành viên) — tin thuộc về thành viên, Coastal Land
  // chỉ là cổng thông tin, KHÔNG đứng tên/không môi giới. Người đăng chưa nhập liên hệ
  // riêng → tên chung "Người đăng tin" + số hotline THẬT để nút gọi/Zalo còn hoạt động.
  // Người đăng CHƯA nhập liên hệ → KHÔNG hiện số nào cả (trước đây đổ về số mẫu
  // "0905 000 111", sau đó là hotline Coastal Land). Thà không có nút gọi còn hơn
  // đưa khách một số KHÔNG phải của người bán — Coastal Land không đứng ra giao dịch.
  const contact = d.contact;
  const phoneTel = contact ? contact.phone.replace(/\s/g, "") : "";
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

  // NHÃN DIỆN TÍCH theo loại hình — căn hộ / nhà phố mà ghi "Diện tích đất" là sai.
  const nhanDienTich = l.type.includes("Đất") ? "Diện tích đất" : "Diện tích";
  const nhanGia = purpose === "thue" ? "Giá thuê" : "Mức giá";

  // Tin tương tự — thứ tự ưu tiên đúng như đã chốt:
  //   1) BẮT BUỘC cùng MỤC ĐÍCH (bán↔bán, thuê↔thuê)
  //   2) cùng DỰ ÁN (+8) → 3) cùng QUẬN/HUYỆN (+4) → 4) cùng TỈNH (+2)
  //   5) cùng LOẠI HÌNH (+1)
  // Lấy HẾT (không giới hạn): slider hiện 8 tin đầu, "Xem thêm" đổ ra danh sách theo trang.
  const curProvince = provinceOf(l.location);
  const curDistrict = districtOf(l.location);
  const all = await getListings(); // B2: tin tương tự cũng lấy từ Supabase
  const samePurpose = all.filter((x) => x.id !== l.id && (x.purpose ?? "ban") === purpose);
  const relatedFill = pickRelated(
    samePurpose,
    (x) =>
      (l.projectSlug && x.projectSlug === l.projectSlug ? 8 : 0) +
      (curDistrict && districtOf(x.location) === curDistrict ? 4 : 0) +
      (provinceOf(x.location) === curProvince ? 2 : 0) +
      (x.type === l.type ? 1 : 0),
    samePurpose.length,
  );

  // MENU DÍNH theo mục — cuộn tới đâu sáng mục đó (giống trang dự án).
  // Chỉ liệt kê mục THẬT SỰ có nội dung để không bấm vào chỗ trống.
  const nav = [
    ...(d.descriptionParas.length > 0 ? [{ id: "mo-ta", label: "Mô tả" }] : []),
    ...(d.videos.length > 0 ? [{ id: "video", label: "Video" }] : []),
    { id: "dac-diem", label: "Đặc điểm" },
    ...(d.interior.length > 0 ? [{ id: "noi-that", label: "Nội thất" }] : []),
    ...(d.amenityGroups.some((g) => g.items.some((it) => it.active)) ? [{ id: "tien-ich", label: "Tiện ích" }] : []),
    ...(priceVnd != null ? [{ id: "lich-su-gia", label: "Lịch sử giá" }] : []),
    { id: "vi-tri", label: "Vị trí" },
  ];

  return (
    <>
      <Header />
      <RecordView id={l.id} />
      {/* Schema.org RealEstateListing — dữ liệu chuẩn cho Google (IV.2) */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* Cây phân cấp cho Google (không hiện trên màn hình — giữ nguyên bố cục đã duyệt) */}
      <BreadcrumbJsonLd
        items={[
          { name: l.purpose === "thue" ? "Nhà đất cho thuê" : "Nhà đất bán", href: l.purpose === "thue" ? "/cho-thue" : "/mua-ban" },
          { name: l.title, href: `/bat-dong-san/${l.id}` },
        ]}
      />
      <main className="flex-1 bg-white">
        {/* MOBILE: pt-0 → ảnh tin nằm SÁT mép dưới header (không chừa khoảng trắng) */}
        <div className="mx-auto max-w-7xl px-4 pb-24 pt-0 sm:px-6 sm:pt-0 lg:px-8 lg:pb-12">

          <HomeExpandProvider>
          {/* Toàn bộ nội dung tin — ẩn khi bấm "Xem thêm" ở mục BĐS tương tự */}
          <HomeCollapsible>

          {/* Thư viện ảnh THẬT — MOBILE tràn viền sát 2 mép + sát header (không khoảng trống) */}
          <div className="-mx-4 mb-6 sm:mx-0">
            <Gallery images={d.images} alt={l.title} listingId={l.id} />
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Cột chính */}
            <div className="reveal is-visible cards-stagger lg:col-span-2 [&>section:first-of-type]:mt-4">
              {/* ═══ TỔNG QUAN TIN ═══ mở tin ra là thấy ngay, theo đúng thứ tự mắt
                  người đọc: tin có đáng tin không → là cái gì → ở đâu → bao nhiêu
                  tiền → rộng bao nhiêu → thông số → thao tác. */}
              <div>
                {/* Hàng nhận diện: hạng tin + mã tin — cho khách cảm giác tin có hồ
                    sơ, có mã tra cứu. Trước đây mã tin nằm tít dưới cột phải, trên
                    điện thoại gần như không ai nhìn thấy. */}
                <div className="flex flex-wrap items-center gap-2">
                  {tier ? (
                    <span className="inline-block rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white" style={{ backgroundColor: tier.accent }}>
                      {tier.name}
                    </span>
                  ) : (
                    <span className="inline-block rounded bg-cvr-surface px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-cvr-muted ring-1 ring-cvr-line">
                      Tin thường
                    </span>
                  )}
                  <span className="text-[12px] font-medium tracking-wide text-cvr-faint">
                    Mã tin: {l.id.slice(0, 8).toUpperCase()}
                  </span>
                </div>

                {/* Tiêu đề — 22px trên điện thoại: đọc thoải mái mà vẫn thấy được
                    giá ngay bên dưới trong cùng một màn hình. */}
                <h1 className="mt-2.5 text-[21px] font-semibold leading-[1.3] tracking-tight text-cvr-ink sm:text-[28px]">{l.title}</h1>

                <p className="mt-2.5 flex items-start gap-1.5 text-[14px] leading-relaxed text-cvr-muted sm:text-[15px]">
                  <svg className="mt-[2px] h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <span className="min-w-0">{d.addressDetail ? d.addressDetail + ", " : ""}{l.location}</span>
                </p>

                {/* KHỐI THÔNG TIN CHÍNH — mọi ô cùng bề ngang nên nội dung dài ngắn
                    khác nhau vẫn cân, không ô nào đẩy lệch ô nào. */}
                <div className="mt-4 rounded-2xl border border-cvr-line bg-white p-4">
                  {/* Bốn ô CÙNG BỀ NGANG — giá dài mấy cũng chỉ xuống dòng trong ô của
                      nó, không đẩy lệch các ô còn lại. Giá vẫn nổi nhờ cỡ chữ + màu,
                      không cần phóng to quá khổ. */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
                    <div className="min-w-0">
                      <p className="text-[12px] text-cvr-muted">{nhanGia}</p>
                      <p className="mt-1 break-words text-[20px] font-bold leading-tight text-red-500 sm:text-[22px]">{l.price}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] text-cvr-muted">{nhanDienTich}</p>
                      <p className="mt-1 break-words text-[17px] font-semibold leading-tight text-cvr-ink">{l.area}</p>
                    </div>
                    {d.builtArea && (
                      <div className="min-w-0">
                        <p className="text-[12px] text-cvr-muted">Diện tích xây dựng</p>
                        <p className="mt-1 break-words text-[17px] font-semibold leading-tight text-cvr-ink">{d.builtArea}</p>
                      </div>
                    )}
                    {l.pricePerM2 && (
                      <div className="min-w-0">
                        <p className="text-[12px] text-cvr-muted">Giá / m²</p>
                        <p className="mt-1 break-words text-[17px] font-semibold leading-tight text-cvr-ink">{l.pricePerM2}</p>
                      </div>
                    )}
                  </div>

                  {/* Thông số phụ — chỉ hiện mục ĐÃ CÓ dữ liệu, không đổ ô trống */}
                  {(l.beds || l.baths || d.direction || d.furnish) && (
                    <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-cvr-line pt-4 sm:grid-cols-4">
                      {l.beds ? <MiniStat label="Phòng ngủ" value={l.beds + " PN"} /> : null}
                      {l.baths ? <MiniStat label="Phòng tắm" value={l.baths + " WC"} /> : null}
                      {d.direction && <MiniStat label="Hướng" value={d.direction} />}
                      {d.furnish && <MiniStat label="Nội thất" value={d.furnish} />}
                    </div>
                  )}
                </div>


                {/* Lưu tin · So sánh · Chia sẻ — trạng thái dùng chung với thẻ tin */}
                <ListingActions id={l.id} title={l.title} />

              </div>

              {/* Menu dính — sáng theo mục đang xem, bấm để cuộn mượt (như trang dự án) */}
              <ProjectNav items={nav} />

              {/* Mô tả — chỉ hiện khi người đăng có viết (không bịa) */}
              {d.descriptionParas.length > 0 && (
                <Section id="mo-ta" title="Thông tin mô tả">
                  <div className="space-y-3 whitespace-pre-line text-[15px] leading-relaxed text-cvr-body">
                    <RichContent paragraphs={d.descriptionParas} title={l.title} />
                  </div>
                </Section>
              )}

              {/* Video — tệp/link người đăng thêm ở mục tải ảnh */}
              {d.videos.length > 0 && (
                <Section id="video" title="Video">
                  <div className="space-y-4">
                    {d.videos.map((v, i) => <VideoEmbed key={i} url={v} />)}
                  </div>
                </Section>
              )}

              {/* Đặc điểm bất động sản — chỉ những gì đã nhập */}
              <Section id="dac-diem" title="Đặc điểm bất động sản">
                <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
                  <Row label="Loại hình" value={l.type} />
                  <Row label={nhanDienTich} value={l.area} />
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
                <Section id="noi-that" title="Nội thất bàn giao">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {d.interior.map((a) => (
                      <span key={a} className="flex items-center gap-2 rounded-lg border border-cvr-line bg-white px-3 py-2.5 text-[13px] text-cvr-body">
                        <svg className="h-4 w-4 shrink-0 text-cvr-gold-ink" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        {a}
                      </span>
                    ))}
                  </div>
                </Section>
              )}

              {/* Tiện ích — chỉ khi có mục được tick */}
              {d.amenityGroups.some((g) => g.items.some((it) => it.active)) && (
                <Section id="tien-ich" title="Tiện ích">
                  <div className="space-y-5">
                    {d.amenityGroups.map((g) => {
                      const active = g.items.filter((it) => it.active);
                      if (active.length === 0) return null;
                      return (
                        <div key={g.group}>
                          <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-cvr-faint">{g.group}</p>
                          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                            {active.map((it) => (
                              <span key={it.name} className="flex items-center gap-2 rounded-lg border border-cvr-line bg-white px-3 py-2.5 text-[13px] text-cvr-body">
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
                <Section id="lich-su-gia" title="Lịch sử giá">
                  <PriceHistory price={priceVnd} />
                </Section>
              )}

              {/* Vị trí — dùng CHUNG khối bản đồ với trang dự án: xem & zoom ngay
                  trên trang · nút chỉ đường từ vị trí người xem · nút mở app / web
                  Google Maps · tiện ích xung quanh (bấm ra Google Maps).
                  Vị trí lấy theo điểm admin GHIM (details.mapPin); chưa ghim thì
                  tự tìm theo địa chỉ tin. */}
              <Section id="vi-tri" title="Vị trí trên bản đồ">
                <ProjectNearby mapQuery={d.mapQuery} address={l.location} places={[]} zoom={d.mapZoom} />
              </Section>
            </div>

            {/* Cột phụ — môi giới (dính khi cuộn) */}
            <aside className="lg:col-span-1">
              {/* Khung liên hệ DÍNH CỐ ĐỊNH khi cuộn — nếu nội dung cao hơn màn hình
                  thì tự cuộn BÊN TRONG khung, không bao giờ trôi khỏi tầm nhìn. */}
              <div className="no-scrollbar sticky top-20 max-h-[calc(100vh-6rem)] space-y-4 overflow-y-auto">
                <div className="rounded-none border border-cvr-line bg-white p-5 shadow-sm">
                  {/* Luôn là "người đăng" — chữ "tư vấn" khiến khách hiểu Coastal Land
                      tư vấn/môi giới bất động sản này. */}
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-cvr-faint">Liên hệ người đăng</p>
                  {contact ? (
                    <>
                      <div className="flex items-center gap-3">
                        {contact.avatar ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={contact.avatar} alt={contact.name} className="h-12 w-12 shrink-0 rounded-full object-cover ring-1 ring-cvr-line" />
                        ) : (
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cvr-surface text-lg font-bold text-cvr-ink ring-1 ring-cvr-line">
                            {contact.name.trim().charAt(0).toUpperCase() || "N"}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-cvr-ink">{contact.name}</p>
                          {/* ⚠️ ĐỊNH VỊ: Coastal Land là CỔNG THÔNG TIN, KHÔNG môi giới.
                              Tin thuộc về THÀNH VIÊN → LUÔN chỉ ghi "Người đăng tin",
                              KHÔNG gắn "Coastal Land" / "Chuyên viên" (nghe như môi giới). */}
                          <p className="text-xs text-cvr-muted">Người đăng tin</p>
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
                    </>
                  ) : (
                    <p className="text-sm leading-relaxed text-cvr-muted">
                      Tin này chưa có thông tin liên hệ.
                    </p>
                  )}
                </div>

                <div className="rounded-none border border-cvr-line bg-white p-5 text-[15px] shadow-sm">
                  {/* ⚠️ Thủ tục công chứng / sang tên là việc của MÔI GIỚI và hai
                      bên giao dịch — KHÔNG phải của Coastal Land. Ô này chỉ nêu
                      thông tin pháp lý + mức độ xác thực, không "cam kết". */}
                  <p className="font-semibold text-cvr-ink">Pháp lý & xác thực</p>
                  <ul className="mt-3 space-y-2.5 leading-relaxed text-cvr-body">
                    <li className="flex gap-2"><span className="text-cvr-gold-ink">✓</span> Pháp lý: {d.legal ?? "Liên hệ để biết chi tiết"}</li>
                    {d.direction && <li className="flex gap-2"><span className="text-cvr-gold-ink">✓</span> Hướng: {d.direction}</li>}
                    <li className="flex gap-2"><span className="text-cvr-gold-ink">✓</span> Tin đã qua kiểm duyệt; Coastal Land nỗ lực xác thực thông tin trước khi đăng</li>
                    <li className="flex gap-2"><span className="text-cvr-gold-ink">✓</span> Thủ tục công chứng, sang tên do môi giới và hai bên thực hiện</li>
                  </ul>
                </div>
              </div>
            </aside>
          </div>

          </HomeCollapsible>

          {/* BĐS tương tự — slide 8 tin · "Xem thêm" → danh sách theo trang (8 tin/trang),
              giữ ĐÚNG thứ tự ưu tiên tương tự; nội dung tin phía trên ẩn đi.
              Tiêu đề do chính khối tự dựng (ẩn khi mở danh sách → không lặp chữ,
              không chừa khoảng trống trên đầu). */}
          <ListingShowcase
            items={relatedFill}
            sectionKey="bds-tuong-tu"
            purpose={purpose === "thue" || purpose === "can-thue" ? "thue" : "ban"}
            title="Bất động sản tương tự"
            heading="Bất động sản tương tự"
            relevance
            emptyNote="Chưa có bất động sản tương tự."
          />
          </HomeExpandProvider>
        </div>

        {/* Thanh liên hệ DÍNH (mobile) — Gọi / Zalo bám đáy màn hình (III.4).
            Tin chưa có liên hệ thì KHÔNG hiện thanh này (không có số để gọi). */}
        {contact && (
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
        )}
      </main>
      <Footer />
    </>
  );
}

function Section({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    // scroll-mt-28: bấm menu cuộn tới thì tiêu đề không bị header + menu dính che
    <section id={id} className="mt-4 scroll-mt-28 rounded-2xl bg-cvr-surface p-4 sm:p-5">
      <h2 className="mb-4 text-[19px] font-semibold tracking-tight text-cvr-ink sm:text-[22px]">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-cvr-line py-3 text-[15px]">
      <span className="shrink-0 whitespace-nowrap text-cvr-muted">{label}</span>
      <span className="min-w-0 text-right font-medium text-cvr-ink">{value}</span>
    </div>
  );
}

// Thông số phụ trong khối giá — nhãn nhỏ mờ ở trên, giá trị đậm ở dưới.
function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[12px] leading-tight text-cvr-muted">{label}</p>
      <p className="mt-1 truncate text-[15px] font-semibold text-cvr-ink">{value}</p>
    </div>
  );
}
