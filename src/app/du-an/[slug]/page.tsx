import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { laChuDauTuThat, slugChuDauTu } from "@/lib/chuDauTu";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProjectGallery from "@/components/ProjectGallery";
import ProjectNav from "@/components/ProjectNav";
import ProjectNearby from "@/components/ProjectNearby";
import DuAnTuongTuTraCuu from "@/components/DuAnTuongTuTraCuu";
import { HomeExpandProvider, HomeCollapsible } from "@/components/HomeExpand";
import DanhSachThuGon from "@/components/DanhSachThuGon";
import FloorPlans from "@/components/FloorPlans";
import PropertyCard from "@/components/PropertyCard";
import RelatedListingsTabs from "@/components/RelatedListingsTabs";
import LeadForm from "@/components/LeadForm";
import RichContent from "@/components/RichContent";
import MoTaThuGon from "@/components/MoTaThuGon";
import { chuThuan } from "@/lib/chuThuan";
import VideoEmbed from "@/components/VideoEmbed";
import Breadcrumb, { BreadcrumbJsonLd } from "@/components/Breadcrumb";
import KhuVucLinks from "@/components/KhuVucLinks";
import { ProjectListJsonLd } from "@/components/ListJsonLd";
import ProjectsBrowser from "@/components/ProjectsBrowser";
import TrangDuAnTraCuu from "@/components/TrangDuAnTraCuu";
import { provinceOf, type Project, type Listing } from "@/lib/data";
import { getProject, getProjects, getProjectsNoiBat, getArticles } from "@/lib/contentDb";
import { dongTraCuu } from "@/lib/traCuuDuAn";
import { nhomLoai } from "@/components/TraCuuDuAn";
import { getListings } from "@/lib/listingsDb";
import { duAnThuocNhom, findCategory, projectCategories, type Category } from "@/lib/categories";
import { normalizeVi, cungDuAn } from "@/lib/filters";
import { demTinTheoKhuVuc, moTaKhuVuc, tieuDeKhuVuc, timKhuVuc } from "@/lib/khuVuc";
import { catMoTa, tieuDeGoogle } from "@/lib/thang";

// Đường dẫn /du-an/<slug> phục vụ HAI loại trang:
//   · slug là DANH MỤC loại hình (can-ho-chung-cu, khu-do-thi-moi…) → trang danh sách
//   · còn lại → trang chi tiết một dự án
// Trước đây các slug danh mục rơi vào nhánh chi tiết và trả 200 kèm chữ
// "Không tìm thấy dự án" — Google gọi đây là soft 404, hại hơn cả 404 thật.
// ── DỰ ÁN BẬC 1 — CHỈ CÓ TÊN TỪ TIN (chủ dự án 21/10/2026) ─────────────────
// Tin ghi "Thuộc dự án" mà danh mục dự án chưa có hồ sơ → trang dự án dựng từ chính các tin đó: tên, vị trí, tin đang
// bán / cho thuê. Không ghi gì vào cơ sở dữ liệu (không tốn thêm truy vấn, dùng chung bản đệm getListings). Cowork bổ sung
// hồ sơ (chủ đầu tư, quy mô, tổng quan…) cùng đợt tin → dự án có hồ sơ thật → trang đầy đủ, mở cho Google.
function duAnTuTin(listings: Listing[], slug: string): { ten: string; viTri: string; tin: Listing[] } | null {
  const tin = listings.filter((x) => cungDuAn(x.projectSlug, slug));
  if (tin.length === 0) return null;
  const ten = tin.find((x) => x.projectName)?.projectName ?? slug;
  return { ten, viTri: tin[0].location, tin };
}

function projectsInCategory(projects: Project[], c: Category): Project[] {
  return duAnThuocNhom(projects, c);
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
      // Nhóm chưa có dự án nào → xem được nhưng không cho lập chỉ mục (tránh trang trống — 22/10/2026)
      ...(projectsInCategory(await getProjectsNoiBat().catch(() => []), c).length === 0 ? { robots: { index: false, follow: true } } : {}),
    };
  }

  // Slug là KHU VỰC (da-nang, hue…) → trang "Dự án tại <tỉnh>".
  // Xét TRƯỚC khi tra dự án: tên dự án không bao giờ trùng slug tỉnh.
  const kv = timKhuVuc(slug);
  if (kv) {
    const projects = await getProjectsNoiBat().catch(() => []);
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
  if (!p) {
    // Bậc 1 (21/10/2026): dự án mới chỉ có tên từ tin — khách xem được, Google CHƯA lập chỉ mục (trang mỏng) tới khi có hồ sơ
    const coban = duAnTuTin(await getListings().catch(() => []), slug);
    if (!coban) return { title: "Không tìm thấy dự án", robots: { index: false, follow: true } };
    return {
      title: tieuDeGoogle(coban.ten),
      description: catMoTa(`Dự án ${coban.ten} tại ${coban.viTri}.`),
      alternates: { canonical: `/du-an/${slug}` },
      robots: { index: false, follow: true },
    };
  }
  const desc = `Dự án ${p.name} tại ${p.location}. ${[p.type, p.status].filter(Boolean).join(", ")}. Giá từ ${p.priceFrom} — tiến độ, mặt bằng, tiện ích đầy đủ tại Coastal Land.`;
  return {
    title: tieuDeGoogle(`${p.name} — ${p.priceFrom}`),
    description: catMoTa(desc),
    alternates: { canonical: `/du-an/${p.slug}` },
    openGraph: {
      title: `${p.name} — ${p.priceFrom}`,
      description: desc,
      url: `/du-an/${p.slug}`,
      type: "website",
      ...(p.photos?.length ? { images: [{ url: p.image, alt: p.name }] } : {}),
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
    const [projects, articles] = await Promise.all([getProjectsNoiBat(), getArticles()]);
    const items = projectsInCategory(projects, cat);
    return (
      <>
        <Header />
        <main className="flex-1 bg-white">
          <Breadcrumb items={[{ name: "Dự án", href: "/du-an" }, { name: cat.label, href: `/du-an/${cat.slug}` }]} />
          <div className="mx-auto max-w-7xl px-4 pb-footer sm:px-6 lg:px-8">
            <h1 className="mb-1 mt-3 text-2xl font-semibold tracking-tight text-cvr-ink sm:text-3xl">{cat.h1}</h1>
            <p className="mb-4 text-sm text-cvr-muted">{cat.desc}</p>
            <ProjectsBrowser projects={items} articles={articles} tieuDePhu />
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
    const [projects, articles] = await Promise.all([getProjectsNoiBat(), getArticles()]);
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
          <div className="mx-auto max-w-7xl px-4 pb-footer sm:px-6 lg:px-8">
            <h1 className="mb-1 mt-3 text-2xl font-semibold tracking-tight text-cvr-ink sm:text-3xl">
              Dự án bất động sản tại {kv.name}
            </h1>
            <p className="mb-4 text-sm text-cvr-muted">
              {moTaKhuVuc("duan", kv.name, items.length)}
            </p>
            <ProjectsBrowser projects={items} articles={articles} tieuDePhu />
          </div>
          <KhuVucLinks base="/du-an" demTheoTinh={demTheoTinh} tinhDangXem={kv.name} />
        </main>
        <Footer />
      </>
    );
  }

  // ── Nhánh 2: trang chi tiết một dự án ──
  const [p, listings, tatCaDuAn] = await Promise.all([getProject(slug), getListings(), getProjects()]);
  // Trang dự án TRA CỨU: "Dự án tương tự" (30/10/2026) — theo KHU VỰC + LOẠI HÌNH: cùng tỉnh bắt buộc, cùng nhóm loại hình đứng trước,
  // rồi dự án có nhiều tin hơn; lấy hết (slide 8 + Xem thêm ra danh sách), trong danh bạ Tra cứu
  const duAnTuongTu = (tinh: string, loai: string, bo: string) => {
    const nhom = nhomLoai(loai);
    return dongTraCuu(listings, tatCaDuAn)
      .filter((x) => x.tinh === tinh && !cungDuAn(x.slug, bo))
      .map((x, i) => ({ x, i, khop: nhom && nhomLoai(x.loaiHinh) === nhom ? 0 : 1 }))
      .sort((a, b) => a.khop - b.khop || a.i - b.i)
      .map((e) => e.x);
  };
  if (!p) {
    const coban = duAnTuTin(listings, slug);
    if (!coban) notFound();
    // Dự án bậc 1 (chỉ có tên từ tin) → trang TRA CỨU (chủ dự án 29/10/2026): bảng thông tin cơ bản, ô chưa có ghi "Đang cập nhật"
    return (
      <>
        <Header />
        <main className="flex-1 bg-white">
          <TrangDuAnTraCuu
            d={{
              slug, ten: coban.ten, anhs: [], chuDauTu: "", donViPhatTrien: "", diaChi: coban.viTri, diaChiCu: coban.tin[0]?.locationCu ?? "",
              loaiHinh: "", tinhTrang: "", giaTu: "", thongSo: [], capNhat: "", nguon: "", tongQuan: [], tienIch: [], coHoSo: false,
              videos: [], viTri: null, matBang: [], bangGia: [],
            }}
            tinBan={coban.tin.filter((x) => (x.purpose ?? "ban") === "ban")}
            tinThue={coban.tin.filter((x) => (x.purpose ?? "ban") === "thue")}
            duAnTuongTu={duAnTuongTu(provinceOf(coban.viTri), "", slug)}
          />
        </main>
        <Footer />
      </>
    );
  }

  // Thư viện ảnh: CHỈ ảnh của CHÍNH dự án này.
  // (Trước đây độn thêm ảnh của các dự án khác cho đủ 8 tấm → ảnh các dự án lẫn lộn nhau.)
  const gallery = Array.from(new Set(p.photos?.length ? p.photos : [p.image]));
  // Chưa có ảnh: khung xám + biểu tượng Coastal Land thay ảnh (không lấy ảnh căn hộ chung chung — khách tưởng ảnh thật).
  const coAnh = !!p.photos?.length;
  // Hồ sơ DẠNG THẺ (nạp từ tệp Cowork cho Tra cứu dự án) có trang tra cứu riêng — xem nhánh dangThe phía dưới (29/10/2026)
  const dangThe = !!p.dangThe;

  const province = provinceOf(p.location);
  // Chưa có mốc bàn giao trong hồ sơ → ĐỂ TRỐNG, không lấy tạm tình trạng (22/10/2026: từng hiện "Bàn giao: Đang mở bán",
  // "Dự kiến bàn giao: Đang mở bán" — sai nghĩa, lặp nhãn tình trạng).
  const handover = p.scale.find((s) => s.label.includes("Bàn giao"))?.value ?? "";
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

  // Dự án tương tự — cùng cách trang dự án tra cứu (cùng tỉnh, cùng nhóm loại hình trước), lấy hết cho slide + Xem thêm
  const tuongTuNoiBat = duAnTuongTu(province, p.type, p.slug);

  // Tin của CHÍNH dự án này — gán trong admin qua trường "Thuộc dự án" (details.project).
  // Dự án không có tin nào → để TRỐNG, tuyệt đối KHÔNG độn tin của dự án khác vào.
  // Cùng với tin KHÁCH TỰ GHI ĐÚNG TÊN dự án này (chưa có mã vì lúc đăng dự án chưa có trang) —
  // tạo trang dự án xong là tin tự về đây (chủ dự án 15/10/2026).
  const projectListings = listings.filter((x) => x.projectSlug === p.slug || cungDuAn(x.projectSlug, p.slug)
    || (!x.projectSlug && !!x.projectName && normalizeVi(x.projectName) === normalizeVi(p.name)));
  const relBan = projectListings.filter((x) => (x.purpose ?? "ban") === "ban");
  const relThue = projectListings.filter((x) => (x.purpose ?? "ban") === "thue");
  const hasRelated = projectListings.length > 0;

  // Menu — chỉ mục có nội dung (khớp id các <section>)
  // GỌN (chủ dự án 22/10/2026: "rõ ràng, gọn, tránh lan man"): mục Bảng giá chỉ hiện khi có bảng giá thật để hiện;
  // giá ẩn hoặc chưa có bảng → bỏ hẳn mục (cột phải đã có "Liên hệ" + ô nhận bảng giá), không lặp hộp "Liên hệ".
  const coBangGia = showPrice && priceTable.length > 0;
  const nav = [
    ...(p.overview.length || p.scale.length ? [{ id: "tong-quan", label: "Tổng quan" }] : []),
    ...(p.videos?.length ? [{ id: "video", label: "Video" }] : []),
    { id: "vi-tri", label: "Vị trí" },
    ...(floorPlans.length ? [{ id: "mat-bang", label: "Mặt bằng" }] : []),
    { id: "tien-ich", label: "Tiện ích" },
    { id: "tien-do", label: "Tiến độ" },
    ...(coBangGia ? [{ id: "bang-gia", label: "Bảng giá" }] : []),
    { id: "chu-dau-tu", label: "Chủ đầu tư" },
    // Menu mục của trang (22/10/2026): thông tin dự án → tin thuộc dự án → dự án tương tự
    ...(hasRelated ? [{ id: "tin-du-an", label: "Tin bán / cho thuê" }] : []),
    ...(tuongTuNoiBat.length ? [{ id: "du-an-tuong-tu", label: "Dự án tương tự" }] : []),
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
    description: chuThuan(p.overview?.[0]) || `Dự án ${p.name} tại ${p.location}. Loại hình ${p.type}, tình trạng ${p.status}.`,
    ...(coAnh ? { image: p.photos!.map((x) => (x.startsWith("http") ? x : `${SITE}${x}`)) } : {}),
    address: { "@type": "PostalAddress", streetAddress: p.location, addressCountry: "VN" },
    ...(p.developer ? { developer: { "@type": "Organization", name: p.developer } } : {}),
    ...(p.amenities?.length ? { amenityFeature: p.amenities.slice(0, 12).map((a) => ({ "@type": "LocationFeatureSpecification", name: a })) } : {}),
    // Giá "từ …" chỉ khai khi dự án cho hiện giá (admin đặt priceMode)
    ...(giaTu ? { makesOffer: { "@type": "Offer", priceCurrency: "VND", description: giaTu, availability: "https://schema.org/InStock" } } : {}),
    provider: { "@id": `${SITE}/#to-chuc` }, // nối về thực thể COASTAL LAND ở layout gốc
  };

  // HỒ SƠ DẠNG THẺ (nạp từ tệp Cowork) → trang TRA CỨU: thông tin cơ bản để tra, khác trang Dự án nổi bật (chủ dự án 29/10/2026)
  if (dangThe) {
    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(duAnJsonLd) }} />
        <BreadcrumbJsonLd items={[{ name: "Dự án", href: "/du-an" }, { name: "Tra cứu dự án", href: "/du-an#tra-cuu" }, { name: p.name, href: `/du-an/${p.slug}` }]} />
        <Header />
        <main className="flex-1 bg-white">
          <TrangDuAnTraCuu
            d={{
              slug: p.slug, ten: p.name, anhs: p.photos ?? [],
              chuDauTu: p.developer !== "Đang cập nhật" ? p.developer : "",
              donViPhatTrien: p.developmentUnit ?? "",
              giaTu: showPrice && p.priceFrom !== "Liên hệ" ? p.priceFrom : "",
              tongQuan: p.overview, tienIch: p.amenities,
              videos: p.videos ?? [],
              // Bản đồ khi hồ sơ có số nhà / đường cụ thể hoặc tiện ích xung quanh (chỉ phường thì bản đồ không thêm gì)
              viTri: places.length || (p.diaChiMoi && p.location !== p.diaChiMoi) ? { mapQuery, places } : null,
              matBang: floorPlans,
              bangGia: showPrice ? priceTable : [],
              diaChi: p.location, diaChiCu: p.locationCu ?? "",
              loaiHinh: p.type !== "Dự án bất động sản" ? p.type : "",
              tinhTrang: p.status, thongSo: p.scale, capNhat: p.capNhat ?? "", nguon: p.nguon ?? "", coHoSo: true,
            }}
            tinBan={relBan}
            tinThue={relThue}
            duAnTuongTu={duAnTuongTu(province, p.type, p.slug)}
          />
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(duAnJsonLd) }} />
      {/* BreadcrumbList cho Google (28/10/2026, On-page nhóm A) — chỉ dữ liệu, giao diện trang dự án đã duyệt giữ nguyên */}
      <BreadcrumbJsonLd items={[{ name: "Dự án", href: "/du-an" }, { name: p.name, href: `/du-an/${p.slug}` }]} />
      <Header />
      <main className="flex-1 bg-white">
        {/* MOBILE: pt-0 → ảnh dự án nằm SÁT mép dưới header (không chừa khoảng trắng) */}
        <div className="mx-auto max-w-7xl px-4 pt-0 pb-footer sm:px-6 sm:pt-0 lg:px-8">

          <HomeExpandProvider>
          {/* Nội dung dự án — ẩn khi bấm "Xem thêm" ở mục tin/dự án bên dưới */}
          <HomeCollapsible>

          {/* Thư viện ảnh — MOBILE tràn viền sát 2 mép (giảm khoảng trống trên) · bấm để xem lớn + zoom */}
          <div className="-mx-4 sm:mx-0">
            {coAnh ? <ProjectGallery images={gallery} alt={p.name} /> : (
              <div className="flex h-[190px] items-center justify-center bg-cvr-surface sm:h-[300px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo/symbol-dark.svg" alt="" className="h-16 w-16 opacity-25" />
              </div>
            )}
          </div>

          {/* Tiêu đề + địa chỉ — bố cục cân đối, rõ ràng */}
          <div className="mt-5">
            <div className="flex flex-wrap items-center gap-2">
              {purposes.includes("ban") && <PurposeChip>Bán</PurposeChip>}
              {purposes.includes("thue") && <PurposeChip>Cho thuê</PurposeChip>}
              {p.status && <span className="rounded-full bg-cvr-surface px-3 py-1 text-[12px] font-medium text-cvr-body">{p.status}</span>}
            </div>
            <h1 className="mt-3 text-[21px] font-semibold leading-[1.3] tracking-tight text-cvr-ink sm:text-[28px]">{p.name}</h1>
            <p className="mt-2 flex items-start gap-1.5 text-[14px] leading-relaxed text-cvr-muted sm:text-[15px]">
              <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <span className="min-w-0">{p.location}</span>
            </p>
            {/* Cách gọi theo hệ 3 cấp cũ — số nhà/đường không đổi nên không nhắc lại. */}
            {p.locationCu && (
              <p className="mt-1 pl-[22px] text-[13px] text-cvr-faint">Địa chỉ cũ: {p.locationCu}</p>
            )}
            {/* Kiểu Mã số thuế (15/10/2026): ngày cập nhật + nguồn thông tin — MASTER 3.2 */}
            {p.capNhat && (
              <p className="mt-1 pl-[22px] text-[13px] text-cvr-faint">
                Cập nhật ngày {p.capNhat}{p.nguon ? ` · Nguồn: ${p.nguon}` : ""}
              </p>
            )}
            {/* Chủ đầu tư lớn (Vinhomes, Sun…) cảnh báo web mạo danh — nói rõ đây là thông tin tổng hợp
                (chủ dự án duyệt câu 15/10/2026, docs/YEU-CAU-COWORK-DU-AN-TIN-DANG.md mục E) */}
            <p className="mt-1 pl-[22px] text-[13px] text-cvr-faint">
              Thông tin dự án do Coastal Land tổng hợp từ nguồn công khai, không phải trang chính thức của chủ đầu tư.
            </p>

            {/* Dải thông tin nhanh — cân đối, dễ đọc từng tiêu chí */}
            <div className={`mt-5 grid grid-cols-2 gap-2 ${handover ? "sm:grid-cols-4" : "sm:grid-cols-3 [&>*:last-child]:col-span-2 sm:[&>*:last-child]:col-span-1"}`}>
              {/* Thứ tự (chủ dự án 22/10/2026): chủ đầu tư · loại hình · giá · bàn giao */}
              <Fact label="Chủ đầu tư" value={p.developer} />
              <Fact label="Loại hình" value={p.type} />
              <Fact label="Giá từ" value={sidePrice} accent />
              {handover && <Fact label="Bàn giao" value={handover} />}
            </div>
          </div>

          </HomeCollapsible>

          {/* MENU MỤC DÍNH SUỐT TRANG (22/10/2026): nằm ngoài lưới nội dung nên cuộn tới khối tin thuộc dự án,
              dự án tương tự cuối trang vẫn dính và sáng đúng mục đang xem. */}
          <ProjectNav items={nav} anKhiMo />

          <HomeCollapsible>
          <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
            <div className="reveal is-visible cards-stagger lg:col-span-2 [&>section:first-of-type]:mt-5">

              {/* 1) Tổng quan */}
              {(p.overview.length > 0 || p.scale.length > 0) && (
              <Section id="tong-quan" title="Tổng quan dự án">
                {/* Tổng quan dài → thu gọn + "Xem thêm" như mô tả tin (22/10/2026), để tin của dự án không bị đẩy quá xa */}
                {p.overview.length > 0 && (
                <MoTaThuGon dong={6}>
                  <div className="space-y-3 text-[15px] leading-relaxed text-cvr-body">
                    <RichContent paragraphs={p.overview} title={p.name} />
                  </div>
                </MoTaThuGon>
                )}
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
              )}

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
                <ProjectNearby mapQuery={mapQuery} address={p.location} places={places} zoom={16} />
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
                  {/* Danh sách dài → 6 mục đầu + "Xem thêm" (gọn, 22/10/2026) */}
                  <DanhSachThuGon className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                    {p.amenities.map((a) => (
                      <span key={a} className="flex items-start gap-2.5 rounded-xl border border-cvr-line bg-white px-4 py-3 text-[15px] leading-snug text-cvr-body">
                        <svg className="mt-0.5 h-4 w-4 shrink-0 text-cvr-blue" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        <span className="min-w-0">{a}</span>
                      </span>
                    ))}
                  </DanhSachThuGon>
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
                {/* GỌN (chủ dự án 22/10/2026): bỏ dòng "Trạng thái hiện tại" — thanh tiến độ đã tô bước hiện tại, nhãn tình trạng
                    có ở đầu trang. Chỉ ghi mốc bàn giao khi hồ sơ có. */}
                {handover && <p className="mt-4 text-sm text-cvr-muted">Dự kiến bàn giao: <span className="font-semibold text-cvr-ink">{handover}</span></p>}
              </Section>

              {/* 6) Bảng giá — cấu trúc Loại căn – Diện tích – Hướng – Giá (ẩn/hiện giá) */}
              {coBangGia && (
              <Section id="bang-gia" title="Bảng giá & loại hình">
                  <div className="overflow-hidden rounded-xl border border-cvr-line">
                    <div className="grid grid-cols-[1.4fr_1fr_0.8fr_1fr] bg-white px-4 py-2.5 text-[12px] font-semibold uppercase tracking-wide text-cvr-muted">
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
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-cvr-faint">* Liên hệ để nhận bảng giá &amp; chính sách bán hàng mới nhất.</p>
                  <a href="#tai-tai-lieu" className="rounded-lg bg-cvr-blue px-4 py-2 text-xs font-semibold text-white transition hover:bg-cvr-blue-ink">Nhận bảng giá chi tiết →</a>
                </div>
              </Section>
              )}

              {/* 7) Chủ đầu tư */}
              <Section id="chu-dau-tu" title="Chủ đầu tư">
                {/* GỌN (22/10/2026): có logo thì hiện logo nhỏ; KHÔNG có thì chỉ tên — bỏ ô chữ cái to thay logo. */}
                <div className="flex items-center gap-3">
                  {dev?.logo && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={dev.logo} alt={p.developer} className="h-12 w-12 shrink-0 rounded-lg bg-white object-contain ring-1 ring-cvr-line" />
                  )}
                  <div className="min-w-0 flex-1">
                    {laChuDauTuThat(p.developer) ? (
                      <Link href={`/chu-dau-tu/${slugChuDauTu(p.developer)}`} className="text-base font-semibold text-cvr-ink hover:text-cvr-blue-ink">{p.developer}</Link>
                    ) : (
                      <p className="text-base font-semibold text-cvr-ink">{p.developer}</p>
                    )}
                    {dev?.established && <p className="mt-0.5 text-sm text-cvr-muted">{dev.established}</p>}
                    {dev?.website && (
                      <a href={normalizeUrl(dev.website)} target="_blank" rel="noopener noreferrer" className="mt-0.5 inline-block text-sm font-medium text-cvr-blue-ink hover:text-cvr-blue">
                        {dev.website} ↗
                      </a>
                    )}
                  </div>
                </div>
                {/* Soạn bằng trình soạn kiểu Word — hiện đúng đậm / nghiêng / canh lề / ảnh; chữ trơn cũ vẫn như trước. */}
                {dev?.desc && <div className="mt-4 text-sm leading-relaxed text-cvr-body"><RichContent paragraphs={dev.desc.split("\n")} wysiwyg title={p.developer} /></div>}

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
                {/* Điện thoại: hộp giá nằm cuối trang, lặp lại "Giá từ · Loại hình" ở đầu trang → chỉ hiện khi có liên hệ dự án;
                    máy tính giữ (cột phải dính theo khi cuộn) — 22/10/2026 */}
                <div className={`rounded-2xl border border-cvr-line bg-white p-4 shadow-lux lg:p-5 ${contact ? "" : "hidden lg:block"}`}>
                  {/* Điện thoại: giá + loại hình đã ở đầu trang → hộp chỉ còn người liên hệ + nút gọi (gọn, 22/10/2026). */}
                  <div className="hidden lg:block">
                    <p className="text-xs text-cvr-muted">{showPrice ? "Giá bán từ" : "Giá bán"}</p>
                    <p className="text-2xl font-bold tracking-tight text-cvr-ink">{sidePrice}</p>
                    <p className="mt-1 text-xs text-cvr-muted">{p.type}</p>
                  </div>

                  {/* Liên hệ dự án — CHỈ hiện khi admin đã nhập (không bịa số tổng đài) */}
                  {contact && (
                    <div className="space-y-2.5 lg:mt-4">
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

                </div>

                <div id="tai-tai-lieu" className="scroll-mt-14">
                  <h3 className="mb-1 text-center text-lg font-semibold tracking-tight text-cvr-ink">Tải tài liệu & báo giá</h3>
                  <p className="mb-3 text-center text-xs text-cvr-muted">Nhận brochure, mặt bằng, bảng giá & chính sách mới nhất</p>
                  <LeadForm cta="Đăng ký nhận tài liệu" topics={["Nhận brochure & mặt bằng", "Nhận bảng giá & chính sách", "Đặt lịch tham quan dự án", "Tư vấn vay ngân hàng"]} />
                </div>
              </div>
            </aside>
          </div>

          </HomeCollapsible>

          {/* ── SAU THÔNG TIN DỰ ÁN (chủ dự án 22/10/2026): xem hết dự án → TIN THUỘC DỰ ÁN → DỰ ÁN TƯƠNG TỰ. Mỗi khối: slide,
              "Xem thêm" ra danh sách theo trang, phần còn lại ẩn. 30/10/2026: bỏ "Bất động sản tương tự" — mở dự án → dự án
              tương tự, mở tin → bất động sản tương tự. */}
          {/* Chưa có tin thuộc dự án → ẩn hẳn khối (không phơi "chưa có tin" trước khách — 22/10/2026) */}
          {hasRelated && (
          <section id="tin-du-an" className="scroll-mt-14">
            <RelatedListingsTabs ban={relBan} thue={relThue} tenDuAn={p.name} title={`Tin mua bán, cho thuê tại ${p.name}`} />
          </section>
          )}

          {/* DỰ ÁN TƯƠNG TỰ — CÙNG MỘT KIỂU với trang dự án tra cứu (chủ dự án 30/10/2026): thẻ dự án, slide 8 + Xem thêm → danh sách
              10 dự án / trang; cùng tỉnh, cùng nhóm loại hình trước (cả dự án nổi bật lẫn dự án tra cứu) */}
          <DuAnTuongTuTraCuu ds={tuongTuNoiBat} id="du-an-tuong-tu" />


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
    <section id={id} className="mt-5 scroll-mt-14 rounded-2xl bg-cvr-surface p-4 sm:p-5">
      <h2 className="mb-4 text-[19px] font-semibold tracking-tight text-cvr-ink sm:text-[22px]">{title}</h2>
      {children}
    </section>
  );
}

function Fact({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-white px-4 py-3">
      <p className="text-[12px] uppercase tracking-wide text-cvr-faint">{label}</p>
      <p className={`mt-1 text-[15px] font-semibold leading-snug break-words ${accent ? "text-cvr-blue-ink" : "text-cvr-ink"}`} title={value}>{value}</p>
    </div>
  );
}

function PurposeChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-cvr-ink px-3 py-1 text-[12px] font-semibold text-white">{children}</span>
  );
}
