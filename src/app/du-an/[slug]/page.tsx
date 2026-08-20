import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProjectGallery from "@/components/ProjectGallery";
import ProjectNav from "@/components/ProjectNav";
import ProjectNearby from "@/components/ProjectNearby";
import ProjectSlider from "@/components/ProjectSlider";
import { HomeExpandProvider, HomeCollapsible } from "@/components/HomeExpand";
import FloorPlans from "@/components/FloorPlans";
import PropertyCard from "@/components/PropertyCard";
import RelatedListingsTabs from "@/components/RelatedListingsTabs";
import LeadForm from "@/components/LeadForm";
import RichContent from "@/components/RichContent";
import VideoEmbed from "@/components/VideoEmbed";
import Breadcrumb from "@/components/Breadcrumb";
import KhuVucLinks from "@/components/KhuVucLinks";
import { ProjectListJsonLd } from "@/components/ListJsonLd";
import ProjectsBrowser from "@/components/ProjectsBrowser";
import { provinceOf, districtOf, segmentOf, pickRelated, type Project } from "@/lib/data";
import { getProject, getProjects, getArticles } from "@/lib/contentDb";
import { getListings } from "@/lib/listingsDb";
import { findCategory, projectCategories, type Category } from "@/lib/categories";
import { normalizeVi } from "@/lib/filters";
import { demTinTheoKhuVuc, moTaKhuVuc, tieuDeKhuVuc, timKhuVuc } from "@/lib/khuVuc";

// Đường dẫn /du-an/<slug> phục vụ HAI loại trang:
//   · slug là DANH MỤC loại hình (can-ho-chung-cu, khu-do-thi-moi…) → trang danh sách
//   · còn lại → trang chi tiết một dự án
// Trước đây các slug danh mục rơi vào nhánh chi tiết và trả 200 kèm chữ
// "Không tìm thấy dự án" — Google gọi đây là soft 404, hại hơn cả 404 thật.
function projectsInCategory(projects: Project[], c: Category): Project[] {
  const keys = c.types.map(normalizeVi);
  return projects.filter((p) => {
    const t = normalizeVi(p.type);
    return keys.some((k) => t.includes(k));
  });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;

  const c = findCategory(projectCategories, slug);
  if (c) {
    return {
      title: c.title,
      description: c.desc,
      alternates: { canonical: `/du-an/${c.slug}` },
      openGraph: { title: c.title, description: c.desc, url: `/du-an/${c.slug}`, type: "website" },
    };
  }

  // Slug là KHU VỰC (da-nang, hue…) → trang "Dự án tại <tỉnh>".
  // Xét TRƯỚC khi tra dự án: tên dự án không bao giờ trùng slug tỉnh.
  const kv = timKhuVuc(slug);
  if (kv) {
    const projects = await getProjects().catch(() => []);
    const soDuAn = demTinTheoKhuVuc(projects, kv.name);
    const title = tieuDeKhuVuc("duan", kv.name);
    const description = moTaKhuVuc("duan", kv.name, soDuAn);
    return {
      title,
      description,
      alternates: { canonical: `/du-an/${kv.slug}` },
      openGraph: { title, description, url: `/du-an/${kv.slug}`, type: "website" },
      // Chưa có dự án nào ở tỉnh đó → xem được nhưng không cho lập chỉ mục
      ...(soDuAn === 0 ? { robots: { index: false, follow: true } } : {}),
    };
  }

  const p = await getProject(slug);
  if (!p) return { title: "Không tìm thấy dự án", robots: { index: false, follow: true } };
  const desc = `Dự án ${p.name} tại ${p.location}. ${p.type}, ${p.status}. Giá từ ${p.priceFrom} — tiến độ, mặt bằng, tiện ích đầy đủ tại Coastal Land.`;
  return {
    title: `${p.name} — ${p.priceFrom}`,
    description: desc,
    alternates: { canonical: `/du-an/${p.slug}` },
    openGraph: {
      title: `${p.name} — ${p.priceFrom}`,
      description: desc,
      url: `/du-an/${p.slug}`,
      type: "website",
      ...(p.image ? { images: [{ url: p.image, alt: p.name }] } : {}),
    },
  };
}

// Các mốc tiến độ
const progressSteps = ["Pháp lý & khởi công", "Thi công phần thô", "Hoàn thiện", "Bàn giao"];
// Tình trạng dự án (admin chọn) → bước sáng trên thanh Tiến độ.
// ⚠️ Thứ tự kiểm tra QUAN TRỌNG: "Chưa mở bán" cũng chứa chữ "mở bán", "Sắp bàn
// giao" cũng chứa "bàn giao" — mục hẹp phải xét TRƯỚC mục rộng.
function currentStep(status: string): number {
  const s = status.toLowerCase();
  if (s.includes("chưa mở")) return 0;
  if (s.includes("sắp mở")) return 0;
  if (s.includes("đã bàn giao")) return 3;
  if (s.includes("sắp bàn giao")) return 2;
  if (s.includes("hoàn thành") || s.includes("hoàn thiện")) return 2;
  if (s.includes("mở bán")) return 1;
  return 1;
}

// Chuẩn hoá website chủ đầu tư → có http để mở tab mới
function normalizeUrl(u: string): string {
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // ── Nhánh 1: slug là DANH MỤC loại hình dự án → trang danh sách ──
  const cat = findCategory(projectCategories, slug);
  if (cat) {
    const [projects, articles] = await Promise.all([getProjects(), getArticles()]);
    const items = projectsInCategory(projects, cat);
    return (
      <>
        <Header />
        <main className="flex-1 bg-white">
          <Breadcrumb items={[{ name: "Dự án", href: "/du-an" }, { name: cat.label, href: `/du-an/${cat.slug}` }]} />
          <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
            <h1 className="mb-1 mt-3 text-2xl font-semibold tracking-tight text-cvr-ink sm:text-3xl">{cat.h1}</h1>
            <p className="mb-4 text-sm text-cvr-muted">{items.length} dự án · {cat.desc}</p>
            <ProjectsBrowser projects={items} articles={articles} />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // ── Nhánh 1B: slug là KHU VỰC → "Dự án tại <tỉnh>" ──
  // Nhóm truy vấn địa phương ("dự án Đà Nẵng", "dự án bất động sản Huế") —
  // trước đây web không có trang nào nhận nhóm này.
  const kv = timKhuVuc(slug);
  if (kv) {
    const [projects, articles] = await Promise.all([getProjects(), getArticles()]);
    const items = projects.filter((x) => normalizeVi(x.location.split(",").pop() ?? "") === normalizeVi(kv.name));
    const demTheoTinh = (() => {
      const m = new Map<string, number>();
      for (const x of projects) {
        const t = x.location.split(",").pop()?.trim() ?? "";
        if (t) m.set(t, (m.get(t) ?? 0) + 1);
      }
      return [...m.entries()].sort((a, b) => b[1] - a[1]);
    })();
    return (
      <>
        <ProjectListJsonLd items={items} heading={tieuDeKhuVuc("duan", kv.name)} path={`/du-an/${kv.slug}`} />
        <Header />
        <main className="flex-1 bg-white">
          <Breadcrumb items={[{ name: "Dự án", href: "/du-an" }, { name: kv.name, href: `/du-an/${kv.slug}` }]} />
          <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
            <h1 className="mb-1 mt-3 text-2xl font-semibold tracking-tight text-cvr-ink sm:text-3xl">
              Dự án bất động sản tại {kv.name}
            </h1>
            <p className="mb-4 text-sm text-cvr-muted">
              {items.length} dự án · {moTaKhuVuc("duan", kv.name, items.length)}
            </p>
            <ProjectsBrowser projects={items} articles={articles} />
          </div>
          <KhuVucLinks base="/du-an" demTheoTinh={demTheoTinh} tinhDangXem={kv.name} />
        </main>
        <Footer />
      </>
    );
  }

  // ── Nhánh 2: trang chi tiết một dự án ──
  const [p, projects, listings, articles] = await Promise.all([getProject(slug), getProjects(), getListings(), getArticles()]);
  if (!p) notFound();

  // Thư viện ảnh: CHỈ ảnh của CHÍNH dự án này.
  // (Trước đây độn thêm ảnh của các dự án khác cho đủ 8 tấm → ảnh các dự án lẫn lộn nhau.)
  const gallery = Array.from(new Set(p.photos?.length ? p.photos : [p.image]));

  const province = provinceOf(p.location);
  const handover = p.scale.find((s) => s.label.includes("Bàn giao"))?.value ?? p.status;
  const mapQuery = `${p.location}, Việt Nam`;
  const step = currentStep(p.status);

  const purposes = p.purposes?.length ? p.purposes : ["ban" as const];
  const floorPlans = p.floorPlans ?? [];
  const priceTable = p.priceTable ?? [];
  const places = p.places ?? [];
  const dev = p.developerInfo;
  // Liên hệ dự án — admin không nhập thì contentDb trả undefined → không hiện khối liên hệ.
  const contact = p.contact;

  // ẨN GIÁ: không hiện bất kỳ thông tin giá/loại căn/diện tích nào — chỉ "Liên hệ".
  const showPrice = p.priceMode === "show";
  const rowPrice = (price: string) => (showPrice && price ? price : "Liên hệ");
  // Giá ở cột phải: ẩn giá → "Liên hệ" thay vì lộ khoảng giá.
  const sidePrice = showPrice ? p.priceFrom : "Liên hệ";

  // Dự án khác — ưu tiên cùng tỉnh + cùng loại hình
  // Dự án liên quan — LẤY HẾT (ưu tiên cùng tỉnh + cùng loại hình) để nút "Xem thêm"
  // còn danh sách mà xổ ra; ProjectSlider tự cắt 8 cái đầu cho slide.
  const others = pickRelated(
    projects.filter((x) => x.slug !== p.slug),
    (x) => (provinceOf(x.location) === province ? 2 : 0) + (x.type === p.type ? 1 : 0),
    projects.length,
  );

  // Tin của CHÍNH dự án này — gán trong admin qua trường "Thuộc dự án" (details.project).
  // Dự án không có tin nào → để TRỐNG, tuyệt đối KHÔNG độn tin của dự án khác vào.
  const projectListings = listings.filter((x) => x.projectSlug === p.slug);
  const relBan = projectListings.filter((x) => (x.purpose ?? "ban") === "ban");
  const relThue = projectListings.filter((x) => (x.purpose ?? "ban") === "thue");
  const hasRelated = projectListings.length > 0;

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

  // ── DỮ LIỆU CÓ CẤU TRÚC CHO GOOGLE (JSON-LD) ──────────────────────────────
  // Trang dự án trước đây KHÔNG khai gì → với Google nó chỉ là một trang chữ.
  // Khai đúng kiểu ResidentialComplex + chủ đầu tư + vị trí + tiện ích + giá từ
  // → Google hiểu đây là một KHU BẤT ĐỘNG SẢN CÓ THẬT, đủ điều kiện hiện kèm
  // ảnh/giá trong kết quả tìm kiếm và nối vào thực thể thương hiệu Coastal Land.
  const SITE = "https://coastalland.vn";
  const giaTu = p.priceMode === "hidden" ? null : p.priceFrom;
  const duAnJsonLd = {
    "@context": "https://schema.org",
    "@type": "ResidentialComplex",
    "@id": `${SITE}/du-an/${p.slug}#du-an`,
    name: p.name,
    url: `${SITE}/du-an/${p.slug}`,
    description: p.overview?.[0] ?? `Dự án ${p.name} tại ${p.location}. Loại hình ${p.type}, tình trạng ${p.status}.`,
    image: (p.photos?.length ? p.photos : [p.image]).map((x) => (x.startsWith("http") ? x : `${SITE}${x}`)),
    address: { "@type": "PostalAddress", streetAddress: p.location, addressCountry: "VN" },
    ...(p.developer ? { developer: { "@type": "Organization", name: p.developer } } : {}),
    ...(p.amenities?.length ? { amenityFeature: p.amenities.slice(0, 12).map((a) => ({ "@type": "LocationFeatureSpecification", name: a })) } : {}),
    // Giá "từ …" chỉ khai khi dự án cho hiện giá (admin đặt priceMode)
    ...(giaTu ? { makesOffer: { "@type": "Offer", priceCurrency: "VND", description: giaTu, availability: "https://schema.org/InStock" } } : {}),
    provider: { "@id": `${SITE}/#to-chuc` }, // nối về thực thể COASTAL LAND ở layout gốc
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(duAnJsonLd) }} />
      <Header />
      <main className="flex-1 bg-white">
        {/* MOBILE: pt-0 → ảnh dự án nằm SÁT mép dưới header (không chừa khoảng trắng) */}
        <div className="mx-auto max-w-7xl px-4 pb-20 pt-0 sm:px-6 sm:pt-0 lg:px-8">

          <HomeExpandProvider>
          {/* Nội dung dự án — ẩn khi bấm "Xem thêm" ở mục tin/dự án bên dưới */}
          <HomeCollapsible>

          {/* Thư viện ảnh — MOBILE tràn viền sát 2 mép (giảm khoảng trống trên) · bấm để xem lớn + zoom */}
          <div className="-mx-4 sm:mx-0">
            <ProjectGallery images={gallery} alt={p.name} />
          </div>

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
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Fact label="Giá từ" value={sidePrice} accent />
              <Fact label="Loại hình" value={p.type} />
              <Fact label="Chủ đầu tư" value={p.developer} />
              <Fact label="Bàn giao" value={handover} />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="reveal is-visible cards-stagger lg:col-span-2">
              {/* Menu dính — sáng theo mục đang xem, bấm để cuộn mượt */}
              <ProjectNav items={nav} />

              {/* 1) Tổng quan */}
              <Section id="tong-quan" title="Tổng quan dự án">
                <div className="space-y-3 text-sm leading-relaxed text-cvr-body">
                  <RichContent paragraphs={p.overview} title={p.name} />
                </div>
                {p.scale.length > 0 && (
                  <div className="mt-6 grid grid-cols-1 gap-x-8 sm:grid-cols-2">
                    {p.scale.map((s) => (
                      <div key={s.label} className="flex items-start justify-between gap-4 border-b border-cvr-line/70 py-3 text-sm">
                        <span className="shrink-0 whitespace-nowrap text-cvr-muted">{s.label}</span>
                        <span className="min-w-0 text-right font-medium text-cvr-ink">{s.value}</span>
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
                {!showPrice ? (
                  /* ẨN GIÁ → không hiện loại căn / diện tích / hướng / giá, chỉ mời liên hệ */
                  <div className="rounded-xl border border-dashed border-cvr-line bg-cvr-surface px-4 py-7 text-center">
                    <p className="text-lg font-semibold tracking-tight text-cvr-ink">Liên hệ</p>
                    <p className="mt-1.5 text-sm text-cvr-body">
                      Bảng giá &amp; chính sách bán hàng của dự án được cung cấp trực tiếp.
                    </p>
                  </div>
                ) : priceTable.length > 0 ? (
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

                {/* Đơn vị phát triển — chỉ hiện khi admin đã nhập (nhiều dự án
                    chủ đầu tư và đơn vị phát triển là hai pháp nhân khác nhau) */}
                {p.developmentUnit && (
                  <div className="mt-4 rounded-xl border border-cvr-line bg-cvr-surface px-4 py-3">
                    <p className="text-xs text-cvr-muted">Đơn vị phát triển</p>
                    <p className="mt-0.5 text-sm font-semibold text-cvr-ink">{p.developmentUnit}</p>
                  </div>
                )}
              </Section>

            </div>

            {/* Cột phụ — giá & liên hệ (dính khi cuộn) */}
            <aside className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                <div className="rounded-2xl border border-cvr-line bg-white p-5 shadow-lux">
                  <p className="text-xs text-cvr-muted">{showPrice ? "Giá bán từ" : "Giá bán"}</p>
                  <p className="text-2xl font-bold tracking-tight text-cvr-ink">{sidePrice}</p>
                  <p className="mt-1 text-xs text-cvr-muted">{p.type}</p>

                  {/* Liên hệ dự án — CHỈ hiện khi admin đã nhập (không bịa số tổng đài) */}
                  {contact && (
                    <div className="mt-4 space-y-2.5">
                      {contact.name && (
                        <p className="text-sm font-semibold text-cvr-ink">{contact.name}</p>
                      )}
                      {contact.phone && (
                        <a
                          href={`tel:${contact.phone.replace(/\s/g, "")}`}
                          className="flex items-center justify-center gap-2 rounded-lg bg-cvr-ink px-4 py-3 text-sm font-bold text-white transition hover:bg-cvr-ink/90"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h2.5a1 1 0 01.97.757l.9 3.6a1 1 0 01-.29.98l-1.5 1.4a14 14 0 006.68 6.68l1.4-1.5a1 1 0 01.98-.29l3.6.9a1 1 0 01.76.97V19a2 2 0 01-2 2A16 16 0 013 5z" /></svg>
                          {contact.phone}
                        </a>
                      )}
                      {contact.email && (
                        <a
                          href={`mailto:${contact.email}`}
                          className="flex items-center justify-center gap-2 rounded-lg border border-cvr-line px-4 py-3 text-sm font-semibold text-cvr-ink transition hover:bg-cvr-surface"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l9 6 9-6M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1z" /></svg>
                          {contact.email}
                        </a>
                      )}
                    </div>
                  )}

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

          </HomeCollapsible>

          {/* ── DƯỚI THÔNG TIN DỰ ÁN: 2 khối, cùng một kiểu ──────────────────
              1) Tin mua bán / cho thuê CỦA CHÍNH dự án này
              2) Dự án liên quan
              Cả hai: slide mặc định → bấm "Xem thêm" ra danh sách trang 1,2,3…
              và ẩn nội dung dự án phía trên (không đổ dài xuống dưới). */}
          <section id="tin-dang" className="scroll-mt-28">
            {hasRelated ? (
              <RelatedListingsTabs
                ban={relBan}
                thue={relThue}
                title={`Tin mua bán liên quan tại dự án ${p.name}`}
              />
            ) : (
              /* Chưa có tin → khối trống, không có nút "Xem thêm" nên ẩn đi khi
                 khối "Dự án liên quan" đang mở danh sách */
              <HomeCollapsible>
                <div className="mt-10">
                  <h2 className="mb-5 text-xl font-semibold tracking-tight text-cvr-ink sm:text-2xl">
                    Tin mua bán liên quan tại dự án {p.name}
                  </h2>
                  <p className="rounded-xl border border-dashed border-cvr-line bg-cvr-surface px-4 py-8 text-center text-sm text-cvr-muted">
                    Dự án chưa có tin mua bán / cho thuê nào.
                  </p>
                </div>
              </HomeCollapsible>
            )}
          </section>

          <ProjectSlider
            projects={others}
            relevance
            title="Dự án tương tự"
            sectionKey="du-an-lien-quan"
            articles={articles}
            emptyNote="Chưa có dự án liên quan."
          />
          </HomeExpandProvider>
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
