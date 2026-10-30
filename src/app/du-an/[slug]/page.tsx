import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { laChuDauTuThat, NGUONG_INDEX_CDT, nhomChuDauTu, slugChuDauTu } from "@/lib/chuDauTu";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProjectGallery from "@/components/ProjectGallery";
import AnhTraCuu from "@/components/AnhTraCuu";
import ProjectNav from "@/components/ProjectNav";
import ProjectNearby from "@/components/ProjectNearby";
import { HomeExpandProvider, HomeCollapsible } from "@/components/HomeExpand";
import FloorPlans from "@/components/FloorPlans";
import RelatedListingsTabs from "@/components/RelatedListingsTabs";
import LeadForm from "@/components/LeadForm";
import RichContent from "@/components/RichContent";
import ThuGonTrang from "@/components/ThuGonTrang";
import { chuThuan } from "@/lib/chuThuan";
import VideoEmbed from "@/components/VideoEmbed";
import Breadcrumb, { BreadcrumbJsonLd } from "@/components/Breadcrumb";
import KhuVucLinks from "@/components/KhuVucLinks";
import { ProjectListJsonLd } from "@/components/ListJsonLd";
import ProjectsBrowser from "@/components/ProjectsBrowser";
import { provinceOf, type Project, type Listing } from "@/lib/data";
import { getProject, getProjects, getArticles } from "@/lib/contentDb";
import { dongTraCuu } from "@/lib/traCuuDuAn";
import { getListings } from "@/lib/listingsDb";
import { duAnThuocNhom, findCategory, projectCategories, rentCategories, saleCategories, type Category } from "@/lib/categories";
import { lienKetCho } from "@/lib/pseo";
import { normalizeVi, cungDuAn } from "@/lib/filters";
import { xepThongSo } from "@/lib/thongSoDuAn";
import NhanTinhTrang, { capVip } from "@/components/NhanTinhTrang";
import { giaTriThat, loaiHinhThe } from "@/lib/truongDuAn";
import TabTimKiemPhoBien from "@/components/TabTimKiemPhoBien";
import { demTinTheoKhuVuc, khuVucList, moTaKhuVuc, slugKhuVuc, tieuDeKhuVuc, timKhuVuc } from "@/lib/khuVuc";
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
      ...(projectsInCategory(await getProjects().catch(() => []), c).length === 0 ? { robots: { index: false, follow: true } } : {}),
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
  if (!p) {
    // Bậc 1 (21/10/2026): dự án mới chỉ có tên từ tin — khách xem được, Google CHƯA lập chỉ mục (trang mỏng) tới khi có hồ sơ
    const coban = duAnTuTin(await getListings().catch(() => []), slug);
    if (!coban) {
      // Trang demo tra cứu (chỉ máy dev) — tên thẻ trình duyệt đúng tên dự án mẫu
      const demo = process.env.NODE_ENV !== "production" ? DU_AN_DEMO[slug] : undefined;
      return { title: demo?.name ?? "Không tìm thấy dự án", robots: { index: false, follow: true } };
    }
    return {
      title: tieuDeGoogle(coban.ten),
      description: catMoTa(`Dự án ${coban.ten} tại ${coban.viTri}.`),
      alternates: { canonical: `/du-an/${slug}` },
      robots: { index: false, follow: true },
    };
  }
  // Giá chỉ lên tiêu đề / mô tả khi admin cho hiện giá — ẩn giá thì không lộ, không ghi "Giá từ Liên hệ" (31/10/2026)
  const gia = p.priceMode === "show" && p.priceFrom && p.priceFrom !== "Liên hệ" ? p.priceFrom : "";
  // Trường bắt buộc từ MỘT nguồn (truongDuAn.ts): chữ thay thế "Đang cập nhật"/"Dự án bất động sản" không lên mô tả Google (31/10/2026)
  const desc = `Dự án ${p.name} tại ${giaTriThat(p.location)}. ${[giaTriThat(p.type), giaTriThat(p.status)].filter(Boolean).join(", ")}.${gia ? ` Giá từ ${gia} — tiến độ` : " Tiến độ"}, mặt bằng, tiện ích đầy đủ tại Coastal Land.`;
  const tieuDe = gia ? `${p.name} — ${gia}` : p.name;
  return {
    title: tieuDeGoogle(tieuDe),
    description: catMoTa(desc),
    alternates: { canonical: `/du-an/${p.slug}` },
    openGraph: {
      title: tieuDe,
      description: desc,
      url: `/du-an/${p.slug}`,
      type: "website",
      ...(p.photos?.length ? { images: [{ url: p.image, alt: p.name }] } : {}),
    },
  };
}


// Chuẩn hoá website chủ đầu tư → có http để mở tab mới
function normalizeUrl(u: string): string {
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
}

// Thứ tự ưu tiên dòng thông số trong bảng Tổng quan (nhãn hồ sơ viết tự do → so theo chữ, không dấu)
const laDiaChi = (nhan: string) => /dia chi|dai chi|vi tri/.test(normalizeVi(nhan).replace(/đ/g, "d"));

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // ── Nhánh 1: slug là DANH MỤC loại hình dự án → trang danh sách ──
  const cat = findCategory(projectCategories, slug);
  if (cat) {
    // CÙNG CẤU TRÚC trang Dự án (30/10/2026): Nổi bật = dự án nổi bật thuộc loại hình; Tra cứu = MỌI dự án có hồ sơ thuộc loại hình
    const [tatCa, listings, articles] = await Promise.all([getProjects(), getListings(), getArticles()]);
    const trongNhom = projectsInCategory(tatCa, cat);
    const items = trongNhom.filter((x) => !x.dangThe);
    const slugNhom = new Set(trongNhom.map((x) => x.slug));
    const traCuu = dongTraCuu(listings, tatCa).filter((d) => slugNhom.has(d.slug));
    return (
      <>
        <ProjectListJsonLd items={trongNhom} heading={cat.h1} path={`/du-an/${cat.slug}`} />
        <Header />
        <main className="flex-1 bg-white">
          <Breadcrumb items={[{ name: "Dự án", href: "/du-an" }, { name: cat.label, href: `/du-an/${cat.slug}` }]} />
          <div className="mx-auto max-w-7xl px-4 pb-footer sm:px-6 lg:px-8">
            <h1 className="mb-1 mt-3 text-2xl font-semibold tracking-tight text-cvr-ink sm:text-3xl">{cat.h1}</h1>
            <p className="mb-4 text-sm text-cvr-muted">{cat.desc}</p>
            <HomeExpandProvider>
              <ProjectsBrowser projects={items} articles={articles} tieuDePhu traCuu={traCuu} />
            </HomeExpandProvider>
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
    // CÙNG CẤU TRÚC trang Dự án (30/10/2026): Nổi bật = dự án nổi bật tại tỉnh; Tra cứu = MỌI dự án tại tỉnh (cả dự án chỉ từ tin)
    const [projects, listings, articles] = await Promise.all([getProjects(), getListings(), getArticles()]);
    const trongTinh = projects.filter((x) => normalizeVi(x.location.split(",").pop() ?? "") === normalizeVi(kv.name));
    const items = trongTinh.filter((x) => !x.dangThe);
    const traCuu = dongTraCuu(listings, projects).filter((d) => normalizeVi(d.tinh) === normalizeVi(kv.name));
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
        <ProjectListJsonLd items={trongTinh} heading={tieuDeKhuVuc("duan", kv.name)} path={`/du-an/${kv.slug}`} />
        <Header />
        <main className="flex-1 bg-white">
          <HomeExpandProvider>
          <Breadcrumb items={[{ name: "Dự án", href: "/du-an" }, { name: kv.name, href: `/du-an/${kv.slug}` }]} />
          <div className="mx-auto max-w-7xl px-4 pb-footer sm:px-6 lg:px-8">
            <h1 className="mb-1 mt-3 text-2xl font-semibold tracking-tight text-cvr-ink sm:text-3xl">
              Dự án bất động sản tại {kv.name}
            </h1>
            <p className="mb-4 text-sm text-cvr-muted">
              {moTaKhuVuc("duan", kv.name, trongTinh.length)}
            </p>
            <ProjectsBrowser projects={items} articles={articles} tieuDePhu traCuu={traCuu} />
          </div>
          <HomeCollapsible>
            <KhuVucLinks base="/du-an" demTheoTinh={demTheoTinh} tinhDangXem={kv.name} />
          </HomeCollapsible>
          </HomeExpandProvider>
        </main>
        <Footer />
      </>
    );
  }

  // ── Nhánh 2: trang chi tiết một dự án ──
  const [hoSoDb, listings, tatCaDuAn] = await Promise.all([getProject(slug), getListings(), getProjects()]);
  // DEMO trang dự án tra cứu — CHỈ chạy trên máy (npx next dev), web thật không có đường này (chủ dự án 31/10/2026: "làm demo")
  const hoSo = hoSoDb ?? (process.env.NODE_ENV !== "production" ? DU_AN_DEMO[slug] ?? null : null);
  // MỘT KHUÔN cho mọi dự án (chủ dự án 30/10/2026): dự án nổi bật giữ nguyên trang đã dựng; dự án TRA CỨU (hồ sơ dạng thẻ, hoặc
  // dự án mới chỉ biết từ tin) chạy ĐÚNG khuôn đó — hồ sơ bổ sung tới đâu hiện tới đó, cái gì chưa có thì ẩn.
  const coban = hoSo ? null : duAnTuTin(listings, slug);
  if (!hoSo && !coban) notFound();
  const tuTin = !hoSo;
  const p: Project = hoSo ?? {
    slug, name: coban!.ten, location: coban!.viTri, ...(coban!.tin[0]?.locationCu ? { locationCu: coban!.tin[0].locationCu } : {}),
    priceFrom: "Liên hệ", type: "", status: "", image: "", developer: "", scale: [], amenities: [], overview: [], dangThe: true,
  };

  // Thư viện ảnh: CHỈ ảnh của CHÍNH dự án này.
  // (Trước đây độn thêm ảnh của các dự án khác cho đủ 8 tấm → ảnh các dự án lẫn lộn nhau.)
  const gallery = Array.from(new Set(p.photos?.length ? p.photos : [p.image]));
  // Chưa có ảnh: khung xám + biểu tượng Coastal Land thay ảnh (không lấy ảnh căn hộ chung chung — khách tưởng ảnh thật).
  const coAnh = !!p.photos?.length;
  // DỰ ÁN TRA CỨU = hồ sơ dạng thẻ hoặc dự án chỉ từ tin: cùng khuôn, ẩn phần chưa có (dự án nổi bật: traCuu = false, không đổi gì)
  const traCuu = !!p.dangThe || tuTin;
  const coChuDauTu = !!giaTriThat(p.developer); // trường bắt buộc — một nguồn (truongDuAn.ts); trống → "Đang cập nhật"
  const coLoaiHinh = !!giaTriThat(p.type);

  const province = provinceOf(p.location);
  // DỰ ÁN THEO KHU VỰC ở cột phải (chủ dự án 30/10/2026): mọi tỉnh trên menu đang có dự án, đếm như trang Dự án (danh bạ tra cứu),
  // tỉnh của dự án đang xem đứng đầu
  const demKhuVuc = new Map<string, number>();
  for (const d of dongTraCuu(listings, tatCaDuAn)) {
    if (khuVucList.some((k) => k.name === d.tinh)) demKhuVuc.set(d.tinh, (demKhuVuc.get(d.tinh) ?? 0) + 1);
  }
  const duAnTheoKhuVuc = [...demKhuVuc.entries()].sort((a, b) => (a[0] === province ? -1 : b[0] === province ? 1 : b[1] - a[1]));
  // Bản đồ: điểm admin GHIM trước; chưa ghim thì tìm theo địa chỉ đầy đủ (số nhà, đường, phường, tỉnh) — 30/10/2026
  // ĐỊA CHỈ ĐẦY ĐỦ: hồ sơ ghi địa chỉ chi tiết ở dòng "Địa chỉ" của bảng thông số (vd "Giao lộ Nguyễn Đình Thi với 29/3, phường Hòa Xuân,
  // Đà Nẵng") mà ô số nhà/đường trống → dùng dòng đó: hiện dưới tên dự án + định vị bản đồ đúng chỗ (chủ dự án 30/10/2026)
  const diaChiHoSo = p.scale.find((s) => laDiaChi(s.label))?.value?.trim();
  const diaChiDu = diaChiHoSo && diaChiHoSo.length > giaTriThat(p.location).length ? diaChiHoSo : giaTriThat(p.location) || "Đang cập nhật";
  const mapQuery = p.mapPin ?? `${giaTriThat(diaChiDu) || province}, Việt Nam`;

  const floorPlans = p.floorPlans ?? [];
  const priceTable = p.priceTable ?? [];
  const places = p.places ?? [];
  const dev = p.developerInfo;
  // Khối Chủ đầu tư chỉ khi có thông tin công ty (chỉ có tên thì đã ở dải thông tin) — 30/10/2026
  const coThongTinCdt = coChuDauTu && !!(dev?.logo || dev?.established || dev?.website || dev?.desc);
  // Liên hệ dự án — admin không nhập thì contentDb trả undefined → không hiện khối liên hệ.
  const contact = p.contact;

  // ẨN GIÁ: không hiện bất kỳ thông tin giá/loại căn/diện tích nào — chỉ "Liên hệ".
  const showPrice = p.priceMode === "show";
  const rowPrice = (price: string) => (showPrice && price ? price : "Liên hệ");
  // Giá ở cột phải: ẩn giá → "Liên hệ" thay vì lộ khoảng giá.
  const sidePrice = showPrice ? p.priceFrom : "Liên hệ";
  // TRƯỜNG BẮT BUỘC LUÔN HIỆN (chủ dự án 30/10/2026): trạng thái · chủ đầu tư · loại hình — chưa có dữ liệu thì "Đang cập nhật"
  // Bỏ dải "Chủ đầu tư · Loại hình" dưới địa chỉ (chủ dự án 30/10/2026: dư thừa) — hai trường này đứng ĐẦU bảng Tổng quan dự án
  // BẢNG TỔNG QUAN ĐỦ TRƯỜNG (mẫu chủ dự án duyệt 30/10/2026): Tình trạng · Chủ đầu tư · Đơn vị phát triển · Loại hình · Giá từ ·
  // rồi thông số hồ sơ (quy mô, sản phẩm, khởi công, bàn giao, pháp lý…). Tình trạng, chủ đầu tư, loại hình luôn có ("Đang cập nhật");
  // trường khác chỉ khi có. Thay khối Tiến độ (trùng tình trạng, khởi công, bàn giao) — đã bỏ.
  const hangThongSo: { label: string; value: string; href?: string }[] = [
    // THỨ TỰ KHỚP ADMIN (chủ dự án 30/10/2026): mục cố định theo form Admin (Chủ đầu tư · Đơn vị phát triển · Loại hình · Giá từ),
    // rồi các dòng "Quy mô dự án" ĐÚNG THỨ TỰ ANH NHẬP trong Admin — web không tự xếp lại; mục trùng bỏ
    { label: "Chủ đầu tư", value: coChuDauTu ? p.developer : "Đang cập nhật", href: coChuDauTu && laChuDauTuThat(p.developer) ? `/chu-dau-tu/${slugChuDauTu(p.developer)}` : undefined },
    // Tình trạng ghi thành NHÃN TRÊN ẢNH đầu trang — bảng không lặp lại (chủ dự án 30/10/2026)
    ...(p.developmentUnit ? [{ label: "Đơn vị phát triển", value: p.developmentUnit }] : []),
    { label: "Loại hình", value: coLoaiHinh ? p.type : "Đang cập nhật" },
    // Dự án thường không có nhãn trên ảnh → Tình trạng ghi ngay sau Loại hình (dự án VIP: ở nhãn trên ảnh) — 31/10/2026
    ...(capVip(p.tier) ? [] : [{ label: "Tình trạng", value: giaTriThat(p.status) || "Đang cập nhật" }]),
    // THỨ TỰ CHỦ DỰ ÁN CHỐT: Chủ đầu tư → Loại hình → Diện tích dự án → Quy mô → Loại hình căn hộ → Số lượng căn hộ → các mục khác
    // theo thứ tự Admin. Xếp bằng CÙNG HÀM với form Admin (xepThongSo) — Admin thấy sao, web hiện vậy (31/10/2026)
    ...xepThongSo([
      ...(p.developmentUnit ? [{ label: "Đơn vị phát triển", value: p.developmentUnit }] : []),
      // Admin không ghi giá → không có dòng Giá từ (contentDb tự điền "Liên hệ" — không phải admin ghi)
      ...(showPrice && p.priceFrom !== "Liên hệ" ? [{ label: "Giá từ", value: sidePrice }] : []),
      // bỏ dòng địa chỉ (đã có dưới tên dự án) và tình trạng (nhãn trên ảnh)
      ...p.scale.filter((s) => !["Tình trạng", "Chủ đầu tư", "Loại hình", "Giá từ"].includes(s.label) && !laDiaChi(s.label)),
    ]),
  ].filter((s, i, ds) => ds.findIndex((x) => normalizeVi(x.label) === normalizeVi(s.label)) === i);


  // Tin của CHÍNH dự án này — gán trong admin qua trường "Thuộc dự án" (details.project).
  // Dự án không có tin nào → để TRỐNG, tuyệt đối KHÔNG độn tin của dự án khác vào.
  // Cùng với tin KHÁCH TỰ GHI ĐÚNG TÊN dự án này (chưa có mã vì lúc đăng dự án chưa có trang) —
  // tạo trang dự án xong là tin tự về đây (chủ dự án 15/10/2026).
  const projectListings = listings.filter((x) => x.projectSlug === p.slug || cungDuAn(x.projectSlug, p.slug)
    || (!x.projectSlug && !!x.projectName && normalizeVi(x.projectName) === normalizeVi(p.name)));
  const relBan = projectListings.filter((x) => (x.purpose ?? "ban") === "ban");
  const relThue = projectListings.filter((x) => (x.purpose ?? "ban") === "thue");
  const hasRelated = projectListings.length > 0;

  const tinhDuAn = timKhuVuc(slugKhuVuc(province));
  // pSEO — MỘT HỆ THỐNG, MỘT KHỐI LIÊN KẾT (chủ dự án 31/10/2026): khối "Tìm kiếm phổ biến" của web (tab + lưới link, máy chủ vẽ sẵn) gom
  // ① tin của dự án + trang mua bán / cho thuê cùng loại, cùng tỉnh ② hệ trang dự án: Dự án tại <tỉnh> · loại hình · chủ đầu tư · dự án cùng tỉnh.
  // Chỉ trang đang có tin / dự án (đã qua cổng chất lượng).
  const cacDuAnTinh = dongTraCuu(listings, tatCaDuAn).filter((d) => d.tinh === province && !cungDuAn(d.slug, p.slug))
    .sort((x, y) => y.ban + y.thue - (x.ban + x.thue));
  const loaiCuaDuAn = projectCategories.filter((c) => duAnThuocNhom([p], c).length > 0).map((c) => c.slug);
  // ① Tin của dự án + trang mua bán / cho thuê cùng loại hình, cùng tỉnh (phường của dự án trước) — từ khoá [mục đích] [loại] [dự án] [nơi]
  const loaiNhieuNhat = (ds: typeof listings) => {
    const dem = new Map<string, number>();
    for (const l of ds) if (l.type) dem.set(l.type, (dem.get(l.type) ?? 0) + 1);
    return [...dem.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
  };
  const phuongDA = normalizeVi(diaChiDu.split(",").find((x) => /phường|xã/i.test(x)) ?? "").trim();
  const tabTin = !tinhDuAn ? [] : ([["ban", "Mua bán", "Bán", relBan], ["thue", "Cho thuê", "Cho thuê", relThue]] as const).map(([muc, ten, chu, tin]) => {
    const loai = loaiNhieuNhat([...tin]) || (muc === "ban" ? giaTriThat(p.type) : "");
    const dsCat = muc === "thue" ? rentCategories : saleCategories;
    const cat = loai ? dsCat.find((c) => c.types.includes(loai)) ?? dsCat.find((c) => c.types.some((t) => normalizeVi(loai).includes(normalizeVi(t)))) : undefined;
    const tenLoai = loai ? loaiHinhThe(loai.split(" / ")[0]).toLocaleLowerCase("vi") : "";
    const tenDA = normalizeVi(p.name).includes(normalizeVi(province)) ? p.name : `${p.name} ${province}`;
    const goc = cat ? lienKetCho({ muc, tinh: tinhDuAn }, listings).filter((g) => g.tieuDe === "Theo loại hình").flatMap((g) => g.links)
      .filter((l) => l.href.split("/")[2] === cat.slug) : [];
    const tuKhoa = cat ? lienKetCho({ muc, tinh: tinhDuAn, cat }, listings).filter((g) => g.tieuDe === "Tìm kiếm theo từ khoá").flatMap((g) => g.links)
      .sort((a, b) => Number(!!phuongDA && normalizeVi(b.day ?? b.nhan).includes(phuongDA)) - Number(!!phuongDA && normalizeVi(a.day ?? a.nhan).includes(phuongDA))) : [];
    return { ten, links: [
      ...(tin.length ? [{ href: "#tin-du-an", nhan: [chu, tenLoai && !normalizeVi(p.name).includes(normalizeVi(tenLoai)) ? tenLoai : "", tenDA].filter(Boolean).join(" ") }] : []),
      ...[...goc, ...tuKhoa].map((l) => ({ href: l.href, nhan: l.day ?? l.nhan })),
    ].slice(0, 12) };
  });
  const tabTuKhoa = [
    ...tabTin,
    { ten: `Dự án tại ${province}`, links: [
      ...(tinhDuAn ? [{ href: `/du-an/${tinhDuAn.slug}`, nhan: `Dự án tại ${province}` }] : []),
      ...cacDuAnTinh.slice(0, 23).map((d) => ({ href: `/du-an/${d.slug}`, nhan: d.ten })),
    ] },
    { ten: "Theo loại hình", links: projectCategories.filter((c) => projectsInCategory(tatCaDuAn, c).length > 0)
      .sort((x, y) => Number(loaiCuaDuAn.includes(y.slug)) - Number(loaiCuaDuAn.includes(x.slug)))
      .map((c) => ({ href: `/du-an/${c.slug}`, nhan: c.h1 })) },
    { ten: "Theo chủ đầu tư", links: [...nhomChuDauTu(tatCaDuAn).entries()].filter(([, g]) => g.duAn.length >= NGUONG_INDEX_CDT)
      .map(([slug, g]) => ({ href: `/chu-dau-tu/${slug}`, nhan: g.ten })) },
  ].filter((t) => t.links.length > 0);

  // Menu — chỉ mục có nội dung (khớp id các <section>)
  // GỌN (chủ dự án 22/10/2026: "rõ ràng, gọn, tránh lan man"): mục Bảng giá chỉ hiện khi có bảng giá thật để hiện;
  // giá ẩn hoặc chưa có bảng → bỏ hẳn mục (cột phải đã có "Liên hệ" + ô nhận bảng giá), không lặp hộp "Liên hệ".
  const coBangGia = showPrice && priceTable.length > 0;
  // Tra cứu: Chủ đầu tư · Loại hình · Tình trạng nằm trong bảng Tổng quan như trang nổi bật (chủ dự án 31/10/2026) — đầu trang chỉ ảnh + cột phải
  // Trang tra cứu GỌN (chủ dự án 31/10/2026: "bỏ hết những phần không cần thiết… vì đây là tra cứu"): không thanh mục, không form
  // tải tài liệu. GIỮ "Dự án theo khu vực" (liên kết sang trang dự án từng tỉnh — SEO; chủ dự án: "không được bỏ")
  const coCotPhai = !traCuu || hasRelated || showPrice || !!contact || duAnTheoKhuVuc.length > 0;
  const coMucTongQuan = hangThongSo.length > 0;
  const nav = [
    ...(coMucTongQuan ? [{ id: "tong-quan", label: "Tổng quan" }] : []),
    ...(!traCuu || p.mapPin ? [{ id: "vi-tri", label: "Vị trí" }] : []),
    ...(p.amenities.length ? [{ id: "tien-ich", label: "Tiện ích" }] : []),
    ...(floorPlans.length ? [{ id: "mat-bang", label: "Mặt bằng" }] : []),
    ...(coBangGia ? [{ id: "bang-gia", label: "Bảng giá" }] : []),
    ...(coThongTinCdt ? [{ id: "chu-dau-tu", label: "Chủ đầu tư" }] : []),
    ...(p.videos?.length ? [{ id: "video", label: "Video" }] : []),
    // Menu mục của trang (22/10/2026): thông tin dự án → tin thuộc dự án → dự án tương tự
    ...(hasRelated ? [{ id: "tin-du-an", label: "Tin thuộc dự án" }] : []),
    // Bỏ "Dự án tương tự" khỏi thanh mục (chủ dự án 30/10/2026: thừa) — khối vẫn ở cuối trang
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
    description: chuThuan(p.overview?.[0]) || `Dự án ${p.name} tại ${giaTriThat(p.location)}.`,
    ...(coAnh ? { image: p.photos!.map((x) => (x.startsWith("http") ? x : `${SITE}${x}`)) } : {}),
    address: { "@type": "PostalAddress", streetAddress: giaTriThat(p.location), addressCountry: "VN" },
    ...(giaTriThat(p.developer) ? { developer: { "@type": "Organization", name: giaTriThat(p.developer) } } : {}),
    ...(p.amenities?.length ? { amenityFeature: p.amenities.slice(0, 12).map((a) => ({ "@type": "LocationFeatureSpecification", name: a })) } : {}),
    // Giá "từ …" chỉ khai khi dự án cho hiện giá (admin đặt priceMode)
    ...(giaTu ? { makesOffer: { "@type": "Offer", priceCurrency: "VND", description: giaTu, availability: "https://schema.org/InStock" } } : {}),
    provider: { "@id": `${SITE}/#to-chuc` }, // nối về thực thể COASTAL LAND ở layout gốc
  };

  // Bảng thông tin (trường bắt buộc + mục Admin ghi thêm) — dự án nổi bật: trong mục Tổng quan; dự án tra cứu: ngay dưới tên (31/10/2026)
  const bangThongSo = (ds: typeof hangThongSo) => (
        <div className="grid grid-cols-1 gap-x-10 gap-y-3 sm:grid-cols-2">
          {ds.map((s) => (
            // MẪU B (31/10/2026): 2 cột đúng thứ tự trái → phải; chữ dài tự xuống dòng trong ô, không chiếm trọn hàng
            <div key={s.label} className="flex min-w-0 items-start gap-3 text-[15px]">
              <span className="w-32 shrink-0 text-sm leading-6 text-cvr-muted sm:w-36">{s.label}</span>
              <span className={`min-w-0 leading-6 ${s.value === "Đang cập nhật" ? "text-cvr-faint" : "font-medium text-cvr-ink"}`}>
                {s.href ? <Link href={s.href} className="hover:text-cvr-blue-ink">{s.value}</Link> : s.value}
              </span>
            </div>
          ))}
        </div>
  );

  return (
    <>
      {!tuTin && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(duAnJsonLd) }} />}
      {/* BreadcrumbList cho Google (28/10/2026, On-page nhóm A) — chỉ dữ liệu, giao diện trang dự án đã duyệt giữ nguyên */}
      {/* BreadcrumbList cho Google — chỉ dữ liệu, không hiện đường dẫn trên trang (chủ dự án 31/10/2026: "không cần") */}
      <BreadcrumbJsonLd items={[{ name: "Dự án", href: "/du-an" }, ...(timKhuVuc(slugKhuVuc(province)) ? [{ name: `Dự án tại ${province}`, href: `/du-an/${slugKhuVuc(province)}` }] : []), { name: p.name, href: `/du-an/${p.slug}` }]} />
      <Header />
      <main className="flex-1 bg-white">
        {/* MOBILE: pt-0 → ảnh dự án nằm SÁT mép dưới header (không chừa khoảng trắng) */}
        <div className="mx-auto max-w-7xl px-4 pt-0 pb-footer sm:px-6 sm:pt-0 lg:px-8">

          <HomeExpandProvider>
          {/* Nội dung dự án — ẩn khi bấm "Xem thêm" ở mục tin/dự án bên dưới */}
          <HomeCollapsible>

          {/* Tiêu đề + địa chỉ — bố cục cân đối, rõ ràng */}
          {/* Khoảng thở giữa tên · địa chỉ · thanh mục (trước chật — chủ dự án 30/10/2026) */}
          {(
          <div className={`pb-5 mt-3`}>
            <div className="min-w-0">
            {/* Bỏ nhãn tình trạng trên tên (chủ dự án 30/10/2026: trùng dòng Tình trạng trong bảng Tổng quan) */}
            <h1 className="text-[21px] font-semibold leading-[1.3] tracking-tight text-cvr-ink sm:text-[28px]">{p.name}</h1>
            <p className="mt-3 flex items-start gap-1.5 text-[14px] leading-relaxed text-cvr-muted sm:text-[15px]">
              <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <span className="min-w-0">{diaChiDu}</span>
            </p>
            {/* Cách gọi theo hệ 3 cấp cũ — số nhà/đường không đổi nên không nhắc lại. */}
            {p.locationCu && (
              <p className="mt-1.5 pl-[22px] text-[13px] text-cvr-faint">Địa chỉ cũ: {p.locationCu}</p>
            )}
            {/* Bỏ câu "Thông tin dự án do Coastal Land tổng hợp…" (chủ dự án 30/10/2026) */}
            {tuTin && (
              <p className="mt-3 rounded-xl bg-cvr-surface px-4 py-2.5 text-sm text-cvr-body">Thông tin dự án đang được cập nhật.</p>
            )}
            </div>
          </div>
          )}

          {/* Thư viện ảnh DƯỚI tên + địa chỉ (bố cục kiểu Batdongsan — chủ dự án 31/10/2026) · MOBILE tràn viền sát 2 mép · bấm để xem lớn + zoom.
              Chưa có ảnh: không vẽ khung trống, tên dự án lên đầu trang (chủ dự án 30/10/2026) */}
          {coAnh && !traCuu && (
            <div className="relative -mx-4 mb-2 sm:mx-0">
              {/* Nhãn tình trạng chung mọi nơi (NhanTinhTrang, 31/10/2026): chỉ dự án VIP, màu theo cấp; dự án thường ghi Tình trạng trong bảng Tổng quan */}
              <NhanTinhTrang tier={p.tier} tinhTrang={giaTriThat(p.status)} />
              <ProjectGallery images={gallery} alt={p.name} />
            </div>
          )}

          {/* TRA CỨU — HÀNG ĐẦU TRANG (chủ dự án 31/10/2026): 1 khung ảnh (≥ 2 ảnh tự chạy, hiện trọn không cắt) | cột phải Dự án theo khu vực,
              cùng hàng nên đáy cột phải luôn ngang đáy ảnh. Nằm TRÊN thanh mục như khung ảnh trang nổi bật */}
          {traCuu && (
            <div className="mb-2 grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
              <div className="relative -mx-4 sm:mx-0 lg:col-span-2">
                <NhanTinhTrang tier={p.tier} tinhTrang={giaTriThat(p.status)} />
                <AnhTraCuu images={coAnh ? gallery : []} alt={p.name} />
              </div>
              {duAnTheoKhuVuc.length > 0 && (
                <div className="hidden flex-col rounded-2xl border border-cvr-line bg-white p-5 lg:flex">
                  <p className="text-base font-semibold tracking-tight text-cvr-ink">Dự án theo khu vực</p>
                  <div className="mt-3 flex flex-col flex-1 justify-around">
                    {duAnTheoKhuVuc.map(([ten, so]) => (
                      <Link key={ten} href={`/du-an/${slugKhuVuc(ten)}`} className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-cvr-body transition-colors hover:bg-cvr-surface hover:text-cvr-ink">
                        <span>Dự án tại {ten}</span>
                        <span className="text-xs text-cvr-muted">{so}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          </HomeCollapsible>

          {/* MENU MỤC DÍNH SUỐT TRANG (22/10/2026, đã chốt): nằm ngoài lưới nội dung nên cuộn tới khối tin thuộc dự án,
              dự án tương tự cuối trang vẫn dính và sáng đúng mục đang xem. */}
          {/* Tra cứu: có từ 2 mục thông tin trở lên thì hiện thanh mục như trang nổi bật; 1 mục thì không cần (chủ dự án 31/10/2026) */}
          {(!traCuu || nav.length >= 2) && <ProjectNav items={nav} anKhiMo />}

          {/* BỐ CỤC CHUẨN (chủ dự án 30/10/2026) — dự án nổi bật và dự án tra cứu MỘT KHUÔN: cột trái các khối nội dung | cột phải dính
              (liên hệ, tin thuộc dự án, dự án tại tỉnh, nhận tài liệu), mép trên ngang khối đầu cột trái; phần nào chưa có thông tin thì ẩn */}
          <HomeCollapsible>
          <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
            <div className={`reveal is-visible cards-stagger ${coCotPhai ? "lg:col-span-2" : "lg:col-span-3"} [&>section:first-child]:mt-5 [&>section:first-child]:border-t-0 [&>section:first-child]:pt-0`}>
              {/* THÔNG TIN DỰ ÁN DÀI → THU GỌN (chủ dự án 31/10/2026, kiểu Batdongsan): bao TỪ Tổng quan TỚI mục cuối; "Xem thêm" ở chỗ cắt,
                  "Thu gọn" ở CUỐI phần thông tin; ngắn thì hiện hết. Hỏi đáp nằm ngoài (luôn hiện) */}
              <ThuGonTrang className="[&>section:first-child]:mt-5">
              {/* 1) Tổng quan */}
              {coMucTongQuan && (
              <Section id="tong-quan" title="Tổng quan dự án">
                {/* LOGIC TỔNG QUAN (chủ dự án 30/10/2026): bảng thông số (quy mô, sản phẩm, bàn giao, pháp lý…) lên TRƯỚC, luôn hiện —
                    đọc là biết dự án; phần giới thiệu bên dưới, dài thì thu gọn, nút "Xem thêm / Thu gọn" ở CUỐI khối (ngắn thì không có nút) */}
                {/* Ô THÔNG SỐ XẾP LƯỚI (chủ dự án 30/10/2026: một cột tốn chỗ, xấu): nhãn nhỏ xám trên · giá trị đậm dưới; PC 3 ô / hàng,
                    điện thoại 2 ô; ô đều nhau, giá trị dài tự xuống dòng trong ô */}
                {/* BẢNG THÔNG TIN CHUẨN (chủ dự án 30/10/2026): PC 2 cột thẳng hàng — mỗi mục nhãn xám rộng cố định + giá trị đậm NGAY SAU;
                    thứ tự theo cặp (chủ đầu tư | tình trạng · loại hình | giá · quy mô | diện tích …); điện thoại 1 cột */}
                {/* CHUẨN CHỮ TRANG DỰ ÁN (chủ dự án 31/10/2026): nội dung 15 px · nhãn 14 px · mọi dòng cao 24 px · các dòng cách 12 px ·
                    tiêu đề mục 24 px cách nội dung 20 px · mục cách mục 48 px · ghi chú 13 px */}
                {bangThongSo(hangThongSo)}
                {p.overview.length > 0 && (
                // Cách bảng thông số 32 px (chủ dự án 31/10/2026: cần cách biệt với phần nội dung bên dưới); tra cứu: bảng ở đầu trang
                <div className="mt-8">
                <div>
                  <div className="space-y-3 text-[15px] leading-6 text-cvr-body">
                    <RichContent paragraphs={p.overview} title={p.name} />
                  </div>
                </div>
                </div>
                )}
                {/* Ngày cập nhật + nguồn — cuối khối Tổng quan (mẫu 30/10/2026; trước nằm dưới địa chỉ) */}
                {p.capNhat && (
                  <p className="mt-4 text-[13px] text-cvr-faint">Cập nhật ngày {p.capNhat}{p.nguon ? ` · Nguồn: ${p.nguon}` : ""}</p>
                )}
              </Section>
              )}


              {/* 2) Vị trí — bản đồ + tiện ích xung quanh + chỉ đường từ vị trí của bạn */}
              {/* Tra cứu: trang chỉ ảnh · tên · thông tin cơ bản; bản đồ chỉ khi Admin ghim toạ độ (chủ dự án 31/10/2026) */}
              {(!traCuu || !!p.mapPin) && (
              <Section id="vi-tri" title="Vị trí & tiện ích xung quanh">
                <ProjectNearby mapQuery={mapQuery} address={diaChiDu} places={places} zoom={16} caoBanDo="h-[240px] w-full sm:h-[320px]" />
              </Section>
              )}

              {/* 3) Tiện ích dự án */}
              {p.amenities.length > 0 && (
                <Section id="tien-ich" title="Tiện ích dự án">
                  {/* Danh sách dài → 6 mục đầu + "Xem thêm" (gọn, 22/10/2026) */}
                  {/* 2 cột thẳng hàng với bảng Tổng quan (gap-x-10) — 3 cột chữ dài lổn nhổn (chủ dự án 31/10/2026: cân đo toàn trang) */}
                  <div className="grid grid-cols-1 gap-x-10 gap-y-3 sm:grid-cols-2">
                    {p.amenities.map((a) => (
                      <span key={a} className="flex items-start gap-2.5 text-[15px] leading-6 text-cvr-body">
                        <svg className="mt-1 h-4 w-4 shrink-0 text-cvr-blue" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        <span className="min-w-0">{a}</span>
                      </span>
                    ))}
                  </div>
                </Section>
              )}

              {/* 4) Mặt bằng — ảnh từng tháp/tầng/loại căn, bấm để phóng to */}
              {floorPlans.length > 0 && (
                <Section id="mat-bang" title="Mặt bằng dự án">
                  <FloorPlans items={floorPlans} />
                </Section>
              )}


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

              {/* 7) Chủ đầu tư — chỉ khi có thông tin công ty (logo, năm thành lập, web, giới thiệu); chỉ có tên thì đã ở dải thông
                  tin phía trên, không lặp khối (chủ dự án 30/10/2026) */}
              {coThongTinCdt && (
              <Section id="chu-dau-tu" title="Chủ đầu tư">
                {/* GỌN (22/10/2026): có logo thì hiện logo nhỏ; KHÔNG có thì chỉ tên — bỏ ô chữ cái to thay logo. */}
                <div className="flex items-center gap-3">
                  {dev?.logo && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={dev.logo} alt={p.developer} className="h-12 w-12 shrink-0 rounded-lg bg-white object-contain ring-1 ring-cvr-line" />
                  )}
                  <div className="min-w-0 flex-1">
                    {laChuDauTuThat(p.developer) ? (
                      <Link href={`/chu-dau-tu/${slugChuDauTu(p.developer)}`} className="block text-base font-semibold text-cvr-ink hover:text-cvr-blue-ink">{p.developer}</Link>
                    ) : (
                      <p className="text-base font-semibold text-cvr-ink">{p.developer}</p>
                    )}
                    {dev?.established && <p className="mt-0.5 text-sm text-cvr-muted">{dev.established}</p>}
                    {dev?.website && (
                      <a href={normalizeUrl(dev.website)} target="_blank" rel="noopener noreferrer" className="mt-0.5 block w-fit text-sm font-medium text-cvr-blue-ink hover:text-cvr-blue">
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
              )}

              {/* Video (nếu có) — DƯỚI CÙNG các phần thông tin dự án (chủ dự án 30/10/2026) */}
              {p.videos && p.videos.length > 0 && (
                <Section id="video" title="Video dự án">
                  {/* CÂN ĐO CẢ TRANG (chủ dự án 30/10/2026): mọi khung cao ~320–336 (ảnh đầu 300 · mặt bằng 336 · dự án tương tự 328) — bản đồ 798×320,
                      video 16:9 cao 320 = 569×320 căn giữa · từ 2 video xếp 2 một hàng */}
                  <div className={`grid grid-cols-1 gap-4 ${p.videos.length > 1 ? "sm:grid-cols-2" : "mx-auto max-w-[569px]"}`}>
                    {p.videos.map((v, i) => <VideoEmbed key={i} url={v} />)}
                  </div>
                </Section>
              )}

              </ThuGonTrang>

            </div>

            {/* Cột phụ — dính khi cuộn */}
            {/* CỘT PHẢI LUÔN CÓ, ĐỦ THỨ LIÊN QUAN (chủ dự án 30/10/2026) — mọi dự án cùng một khuôn: giá + liên hệ (khi có) · tin của dự án
                · dự án cùng khu vực · nhận tài liệu & báo giá */}
            {coCotPhai && (
            <aside className={`lg:col-span-1 ${traCuu ? "lg:hidden" : "lg:mt-5"}`}>
              {/* Cột phải CUỘN THEO TRANG, không dính: cột cao hơn màn hình mà dính thì cuộn bị khựng rồi trôi (chủ dự án 30/10/2026) */}
              <div className="h-full space-y-4">
                <div className="space-y-4">
                {/* Tin của dự án (bấm xuống khối tin) — máy tính lẫn điện thoại. Tra cứu: khối tin nằm ngay dưới ảnh nên không lặp hộp này
                    (3 hộp làm cột phải dài hơn ảnh — 31/10/2026) */}
                {/* Tra cứu: không lặp hộp này — khối tin của dự án nằm ngay dưới, cột phải cạnh ảnh chỉ Dự án theo khu vực (31/10/2026) */}
                {hasRelated && !traCuu && (
                  <div className="rounded-2xl border border-cvr-line bg-white p-4 lg:p-5">
                    <p className="text-base font-semibold tracking-tight text-cvr-ink">{`Tin mua bán, cho thuê tại ${p.name}`}</p>
                    <div className="mt-3 flex flex-col">
                      {relBan.length > 0 && <a href="#tin-du-an" className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-cvr-body transition-colors hover:bg-cvr-surface hover:text-cvr-ink"><span>Mua bán</span><span className="text-xs text-cvr-muted">{relBan.length}</span></a>}
                      {relThue.length > 0 && <a href="#tin-du-an" className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-cvr-body transition-colors hover:bg-cvr-surface hover:text-cvr-ink"><span>Cho thuê</span><span className="text-xs text-cvr-muted">{relThue.length}</span></a>}
                    </div>
                  </div>
                )}

                {/* Dự án theo khu vực — cùng khối với trang Dự án, mọi tỉnh đang có dự án → trang /du-an/<tỉnh> */}
                {/* Tra cứu: 3 trường bắt buộc thành hộp đầu cột phải, cùng kiểu hộp khu vực — cột phải cao ngang ảnh, cân 2 bên (31/10/2026) */}
                {/* Điện thoại: hộp này nằm ngay dưới ảnh (cột phải xuống cuối trang) → ở đây chỉ hiện trên máy tính */}

                {duAnTheoKhuVuc.length > 0 && (
                  <div className="rounded-2xl border border-cvr-line bg-white p-4 lg:p-5">
                    <p className="text-base font-semibold tracking-tight text-cvr-ink">Dự án theo khu vực</p>
                    <div className="mt-3 flex flex-col">
                      {duAnTheoKhuVuc.map(([ten, so]) => (
                        <Link key={ten} href={`/du-an/${slugKhuVuc(ten)}`} className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-cvr-body transition-colors hover:bg-cvr-surface hover:text-cvr-ink">
                          <span>Dự án tại {ten}</span>
                          <span className="text-xs text-cvr-muted">{so}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                </div>

                {/* LIÊN HỆ + FORM DÍNH khi cuộn (máy tính) — khối thấp hơn màn hình nên dính êm; các hộp trên cuộn theo trang (30/10/2026) */}
                {/* Tra cứu không giá, không liên hệ → không dựng khối rỗng (khối rỗng vẫn ăn khe 16 px, đẩy mục dưới lệch) */}
                {(!traCuu || showPrice || contact) && (
                <div className="space-y-4 lg:sticky lg:top-24">
                {/* Hộp Liên hệ — ngay trên form nhận tài liệu & báo giá, máy tính lẫn điện thoại (chủ dự án 30/10/2026) */}
                {(showPrice || contact) && (
                  <div className="rounded-2xl border border-cvr-line bg-white p-4 lg:p-5">
                    {showPrice && (
                      <div className={contact ? "mb-4 border-b border-cvr-line pb-4" : undefined}>
                        <p className="text-xs text-cvr-muted">Giá bán từ</p>
                        <p className="text-2xl font-bold tracking-tight text-cvr-ink">{sidePrice}</p>
                      </div>
                    )}
                    {/* Tiêu đề "Liên hệ" — khách biết hộp này để làm gì (chủ dự án 30/10/2026) */}
                    {contact && (
                      <>
                        <p className="mb-3 text-base font-semibold tracking-tight text-cvr-ink">Liên hệ</p>
                        <LienHeDuAn contact={contact} />
                      </>
                    )}
                  </div>
                )}

                {/* Cùng kiểu mọi hộp cột phải: tiêu đề NẰM TRONG khung, cùng cỡ chữ (khung riêng của form tắt đi) — 30/10/2026 */}
                {!traCuu && (
                <div id="tai-tai-lieu" className="scroll-mt-14 overflow-hidden rounded-2xl border border-cvr-line bg-white p-4 lg:p-5 [&>div:last-child]:border-0 [&>div:last-child]:p-0 [&>div:last-child]:shadow-none [&_input]:h-10 [&_select]:h-10">
                  <p className="mb-3 text-base font-semibold tracking-tight text-cvr-ink">Tải tài liệu & báo giá</p>
                  <LeadForm cta="Đăng ký nhận tài liệu" topics={["Nhận brochure & mặt bằng", "Nhận bảng giá & chính sách", "Đặt lịch tham quan dự án", "Tư vấn vay ngân hàng"]} />
                </div>
                )}
                </div>
                )}
              </div>
            </aside>
            )}
          </div>

          </HomeCollapsible>

          {/* ── SAU THÔNG TIN DỰ ÁN (chủ dự án 22/10/2026): xem hết dự án → TIN THUỘC DỰ ÁN → DỰ ÁN TƯƠNG TỰ. Mỗi khối: slide,
              "Xem thêm" ra danh sách theo trang, phần còn lại ẩn. 30/10/2026: bỏ "Bất động sản tương tự" — mở dự án → dự án
              tương tự, mở tin → bất động sản tương tự. */}
          {/* Chưa có tin thuộc dự án → ẩn hẳn khối (không phơi "chưa có tin" trước khách — 22/10/2026) */}
          {hasRelated && (
          <section id="tin-du-an" className="scroll-mt-14">
            <RelatedListingsTabs ban={relBan.slice(0, 8)} thue={relThue.slice(0, 8)} idsBan={relBan.map((x) => x.id)} idsThue={relThue.map((x) => x.id)} tenDuAn={p.name} title={`Tin mua bán, cho thuê tại ${p.name}`} />
          </section>
          )}

          {/* DỰ ÁN TƯƠNG TỰ — CÙNG MỘT KIỂU với trang dự án tra cứu (chủ dự án 30/10/2026): thẻ dự án, slide 8 + Xem thêm → danh sách
              10 dự án / trang; cùng tỉnh, cùng nhóm loại hình trước (cả dự án nổi bật lẫn dự án tra cứu) */}


          {/* pSEO — liên kết sang trang mua bán / cho thuê cùng tỉnh (khối có lề riêng → bù lề khung trang) */}
          {/* pSEO — khối "Tìm kiếm phổ biến" cuối trang như trang chủ, trang danh sách (khối có lề riêng → bù lề khung trang) */}
          {tabTuKhoa.length > 0 && (
            <div className="-mx-4 mt-12 sm:-mx-6 lg:-mx-8">
              <TabTimKiemPhoBien tabs={tabTuKhoa} />
            </div>
          )}
          </HomeExpandProvider>
        </div>
      </main>
      <Footer />
    </>
  );
}

// Người liên hệ dự án — CHỈ khi admin đã nhập (không bịa số tổng đài); dùng chung cột phải máy tính + đầu trang điện thoại
function LienHeDuAn({ contact }: { contact: { name?: string; phone?: string; email?: string } }) {
  return (
    // GỌN (chủ dự án 30/10/2026: "CTA có cần phải TO như vậy"): tên người liên hệ và nút gọi nhỏ cùng một hàng
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
      {contact.name && <p className="min-w-0 text-sm font-semibold text-cvr-ink">{contact.name}</p>}
      {contact.phone && (
        <a
          href={`tel:${contact.phone.replace(/\s/g, "")}`}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-cvr-ink px-3 py-2 text-[13px] font-semibold text-white transition hover:bg-cvr-ink/90"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h2.5a1 1 0 01.97.757l.9 3.6a1 1 0 01-.29.98l-1.5 1.4a14 14 0 006.68 6.68l1.4-1.5a1 1 0 01.98-.29l3.6.9a1 1 0 01.76.97V19a2 2 0 01-2 2A16 16 0 013 5z" /></svg>
          {contact.phone}
        </a>
      )}
      </div>
      {contact.email && (
        <a
          href={`mailto:${contact.email}`}
          className="flex items-center gap-1.5 text-[13px] font-medium text-cvr-body transition hover:text-cvr-blue-ink"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l9 6 9-6M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1z" /></svg>
          {contact.email}
        </a>
      )}
    </div>
  );
}

// Section chuẩn — có id để menu cuộn tới, tiêu đề nhất quán
function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    // KHỐI PHÂN BIỆT GỌN (chủ dự án 30/10/2026: không màu nền, không viền, không gạch ngang — quá nhiều là vô lý): tách phần bằng khoảng trống + tiêu đề
    <section id={id} className="mt-12 scroll-mt-14">
      <h2 className="mb-5 text-[22px] font-semibold tracking-tight text-cvr-ink sm:text-2xl">{title}</h2>
      {children}
    </section>
  );
}



// Dữ liệu DEMO dự án tra cứu (CHỈ máy dev) — đủ trường hợp: nhiều ảnh + thông tin thêm · 1 ảnh, chỉ trường bắt buộc ·
// không ảnh, tên + địa chỉ dài, chỉ trường bắt buộc (dự án chỉ biết từ tin: xem trang thật /du-an/apec-mandala-wyndham-binh-thuan)
const DEMO_GOC = { priceFrom: "Liên hệ", dangThe: true, scale: [], amenities: [], overview: [] };
const DU_AN_DEMO: Record<string, Project> = {
  "demo-tra-cuu": {
    ...DEMO_GOC, slug: "demo-tra-cuu", name: "Dự án mẫu tra cứu (demo)", location: "Đường Bạch Đằng, Phường Hải Châu, Đà Nẵng",
    type: "Căn hộ", status: "Đang mở bán", developer: "Công ty CP ABC", image: "/images/tin/2.jpg",
    photos: ["/images/tin/2.jpg", "/anh/listings/0d4c189f3293a590dd96286f-1784682958486-201631-4.1.webp", "/images/tin/1.jpg"],
    scale: [{ label: "Diện tích dự án", value: "1,2 ha" }, { label: "Quy mô", value: "2 tòa cao 22 tầng" }, { label: "Bàn giao", value: "Quý IV/2026" }],
    amenities: ["Hồ bơi", "Phòng gym", "Công viên"], mapPin: "16.0717,108.2244",
    // Mô tả DÀI (chỉ để thử thu gọn "Xem thêm" của trang tra cứu khi Admin nhập nhiều thông tin)
    overview: Array.from({ length: 8 }, (_, i) => `Đoạn giới thiệu mẫu số ${i + 1} — chỉ để xem bố cục trang dự án tra cứu khi Admin nhập mô tả dài: vị trí, quy mô, tiện ích, pháp lý, tiến độ, chính sách bán hàng của dự án.`),
  },
  "demo-tra-cuu-1-anh": {
    ...DEMO_GOC, slug: "demo-tra-cuu-1-anh", name: "Dự án mẫu một ảnh (demo)", location: "Phường An Hải, Đà Nẵng",
    type: "Căn hộ", status: "", developer: "", image: "/images/tin/1.jpg", photos: ["/images/tin/1.jpg"],
  },
  "demo-tra-cuu-khong-anh": {
    ...DEMO_GOC, slug: "demo-tra-cuu-khong-anh", name: "Khu đô thị mẫu không ảnh có tên dự án rất dài để thử xuống dòng (demo)",
    location: "Lô A1-A5 đường Nguyễn Tất Thành nối dài, Phường Hải Vân, Đà Nẵng", type: "", status: "Sắp mở bán",
    developer: "Công ty Cổ phần Đầu tư Phát triển Đô thị mẫu", image: "", photos: [],
  },
};
