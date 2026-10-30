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
import FloorPlans from "@/components/FloorPlans";
import RelatedListingsTabs from "@/components/RelatedListingsTabs";
import LeadForm from "@/components/LeadForm";
import RichContent from "@/components/RichContent";
import { chuThuan } from "@/lib/chuThuan";
import VideoEmbed from "@/components/VideoEmbed";
import Breadcrumb, { BreadcrumbJsonLd } from "@/components/Breadcrumb";
import KhuVucLinks from "@/components/KhuVucLinks";
import { ProjectListJsonLd } from "@/components/ListJsonLd";
import ProjectsBrowser from "@/components/ProjectsBrowser";
import { provinceOf, type Project, type Listing } from "@/lib/data";
import { getProject, getProjects, getArticles } from "@/lib/contentDb";
import { dongTraCuu } from "@/lib/traCuuDuAn";
import { nhomLoai } from "@/components/TraCuuDuAn";
import { getListings } from "@/lib/listingsDb";
import { duAnThuocNhom, findCategory, projectCategories, type Category } from "@/lib/categories";
import { normalizeVi, cungDuAn } from "@/lib/filters";
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


// Chuẩn hoá website chủ đầu tư → có http để mở tab mới
function normalizeUrl(u: string): string {
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
}

// Thứ tự ưu tiên dòng thông số trong bảng Tổng quan (nhãn hồ sơ viết tự do → so theo chữ, không dấu)
const UU_TIEN = ["dia chi|dai chi", "vi tri", "quy mo", "dien tich", "so luong", "so can", "loai hinh can", "san pham", "ban giao", "tieu chuan", "phap ly", "so huu", "khoi cong"];
// Nhóm hàng của bảng Tổng quan: 0 chung · 1 địa chỉ · 2 quy mô · 3 bàn giao & pháp lý · 4 khác
const laDiaChi = (nhan: string) => /dia chi|dai chi|vi tri/.test(normalizeVi(nhan).replace(/đ/g, "d"));
function nhomThongSo<T extends { label: string }>(ds: T[]): T[][] {
  const nhomCua = (nhan: string) => {
    const x = normalizeVi(nhan).replace(/đ/g, "d");
    if (/chu dau tu|don vi phat trien|tinh trang|^loai hinh$|gia tu/.test(x)) return 0;
    if (laDiaChi(nhan)) return 1;
    if (/quy mo|dien tich|so luong|so can|loai hinh can|san pham|so tang|so toa/.test(x)) return 2;
    if (/khoi cong|ban giao|tieu chuan|phap ly|so huu/.test(x)) return 3;
    return 4;
  };
  const g: T[][] = [[], [], [], [], []];
  for (const s of ds) g[nhomCua(s.label)].push(s);
  return g.filter((n) => n.length);
}
function hangUuTien(nhan: string): number {
  const x = normalizeVi(nhan).replace(/đ/g, "d");
  const i = UU_TIEN.findIndex((k) => k.split("|").some((y) => x.includes(y)));
  return i < 0 ? UU_TIEN.length : i;
}

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
  const [hoSo, listings, tatCaDuAn] = await Promise.all([getProject(slug), getListings(), getProjects()]);
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
  const coChuDauTu = !traCuu || (!!p.developer && p.developer !== "Đang cập nhật");
  const coLoaiHinh = !traCuu || (!!p.type && p.type !== "Dự án bất động sản");

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
  const diaChiDu = diaChiHoSo && diaChiHoSo.length > p.location.length ? diaChiHoSo : p.location;
  const mapQuery = p.mapPin ?? `${diaChiDu}, Việt Nam`;

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
    // Chủ đầu tư đứng ĐẦU (chủ dự án 30/10/2026)
    { label: "Chủ đầu tư", value: coChuDauTu ? p.developer : "Đang cập nhật", href: coChuDauTu && laChuDauTuThat(p.developer) ? `/chu-dau-tu/${slugChuDauTu(p.developer)}` : undefined },
    { label: "Tình trạng", value: p.status || "Đang cập nhật" },
    { label: "Loại hình", value: coLoaiHinh ? p.type : "Đang cập nhật" },
    ...(p.developmentUnit ? [{ label: "Đơn vị phát triển", value: p.developmentUnit }] : []),
    ...(showPrice ? [{ label: "Giá từ", value: sidePrice }] : []),
    // Thông số hồ sơ: QUAN TRỌNG LÊN TRƯỚC (chủ dự án 30/10/2026) — địa chỉ · quy mô · diện tích · số căn · loại căn · bàn giao · pháp lý
    // / sở hữu · khởi công; nhãn khác giữ thứ tự hồ sơ, xếp sau
    ...p.scale
      // bỏ dòng địa chỉ: đã có ngay dưới tên dự án (chủ dự án 30/10/2026)
      .filter((s) => !["Tình trạng", "Chủ đầu tư", "Loại hình", "Giá từ"].includes(s.label) && !laDiaChi(s.label))
      .map((s, i) => ({ s, i, h: hangUuTien(s.label) }))
      .sort((a, b) => a.h - b.h || a.i - b.i)
      .map((x) => x.s),
  ];

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
    { id: "tong-quan", label: "Tổng quan" },
    { id: "vi-tri", label: "Vị trí" },
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
    description: chuThuan(p.overview?.[0]) || `Dự án ${p.name} tại ${p.location}. Loại hình ${p.type}, tình trạng ${p.status}.`,
    ...(coAnh ? { image: p.photos!.map((x) => (x.startsWith("http") ? x : `${SITE}${x}`)) } : {}),
    address: { "@type": "PostalAddress", streetAddress: p.location, addressCountry: "VN" },
    ...(p.developer ? { developer: { "@type": "Organization", name: p.developer } } : {}),
    ...(p.amenities?.length ? { amenityFeature: p.amenities.slice(0, 12).map((a) => ({ "@type": "LocationFeatureSpecification", name: a })) } : {}),
    // Giá "từ …" chỉ khai khi dự án cho hiện giá (admin đặt priceMode)
    ...(giaTu ? { makesOffer: { "@type": "Offer", priceCurrency: "VND", description: giaTu, availability: "https://schema.org/InStock" } } : {}),
    provider: { "@id": `${SITE}/#to-chuc` }, // nối về thực thể COASTAL LAND ở layout gốc
  };

  return (
    <>
      {!tuTin && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(duAnJsonLd) }} />}
      {/* BreadcrumbList cho Google (28/10/2026, On-page nhóm A) — chỉ dữ liệu, giao diện trang dự án đã duyệt giữ nguyên */}
      <BreadcrumbJsonLd items={[{ name: "Dự án", href: "/du-an" }, { name: p.name, href: `/du-an/${p.slug}` }]} />
      <Header />
      <main className="flex-1 bg-white">
        {/* MOBILE: pt-0 → ảnh dự án nằm SÁT mép dưới header (không chừa khoảng trắng) */}
        <div className="mx-auto max-w-7xl px-4 pt-0 pb-footer sm:px-6 sm:pt-0 lg:px-8">

          <HomeExpandProvider>
          {/* Nội dung dự án — ẩn khi bấm "Xem thêm" ở mục tin/dự án bên dưới */}
          <HomeCollapsible>

          {/* Thư viện ảnh — MOBILE tràn viền sát 2 mép (giảm khoảng trống trên) · bấm để xem lớn + zoom.
              Chưa có ảnh: không vẽ khung trống, tên dự án lên đầu trang (chủ dự án 30/10/2026) */}
          {coAnh && (
            <div className="relative -mx-4 sm:mx-0">
              <ProjectGallery images={gallery} alt={p.name} />
              {/* Dự án có video: nút ▶ Video góc trái dưới ảnh → khối Video ngay sau Tổng quan (mẫu 30/10/2026) */}
              {!!p.videos?.length && (
                <a href="#video" className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-[13px] font-medium text-white backdrop-blur-sm hover:bg-black/75">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M8 5v14l11-7z" /></svg>
                  Video
                </a>
              )}
            </div>
          )}

          {/* Tiêu đề + địa chỉ — bố cục cân đối, rõ ràng */}
          {/* Khoảng thở giữa tên · địa chỉ · thanh mục (trước chật — chủ dự án 30/10/2026) */}
          <div className={`pb-5 ${coAnh ? "mt-6" : "mt-3"}`}>
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

          </HomeCollapsible>

          {/* MENU MỤC DÍNH SUỐT TRANG (22/10/2026, đã chốt): nằm ngoài lưới nội dung nên cuộn tới khối tin thuộc dự án,
              dự án tương tự cuối trang vẫn dính và sáng đúng mục đang xem. */}
          <ProjectNav items={nav} anKhiMo />

          {/* BỐ CỤC CHUẨN (chủ dự án 30/10/2026) — dự án nổi bật và dự án tra cứu MỘT KHUÔN: cột trái các khối nội dung | cột phải dính
              (liên hệ, tin thuộc dự án, dự án tại tỉnh, nhận tài liệu), mép trên ngang khối đầu cột trái; phần nào chưa có thông tin thì ẩn */}
          <HomeCollapsible>
          <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
            <div className={`reveal is-visible cards-stagger lg:col-span-2 [&>section:first-of-type]:mt-5 [&>section:first-of-type]:border-t-0 [&>section:first-of-type]:pt-0`}>

              {/* 1) Tổng quan */}
              {hangThongSo.length > 0 && (
              <Section id="tong-quan" title="Tổng quan dự án">
                {/* LOGIC TỔNG QUAN (chủ dự án 30/10/2026): bảng thông số (quy mô, sản phẩm, bàn giao, pháp lý…) lên TRƯỚC, luôn hiện —
                    đọc là biết dự án; phần giới thiệu bên dưới, dài thì thu gọn, nút "Xem thêm / Thu gọn" ở CUỐI khối (ngắn thì không có nút) */}
                {/* Ô THÔNG SỐ XẾP LƯỚI (chủ dự án 30/10/2026: một cột tốn chỗ, xấu): nhãn nhỏ xám trên · giá trị đậm dưới; PC 3 ô / hàng,
                    điện thoại 2 ô; ô đều nhau, giá trị dài tự xuống dòng trong ô */}
                {/* BẢNG THÔNG TIN CHUẨN (chủ dự án 30/10/2026): PC 2 cột thẳng hàng — mỗi mục nhãn xám rộng cố định + giá trị đậm NGAY SAU;
                    thứ tự theo cặp (chủ đầu tư | tình trạng · loại hình | giá · quy mô | diện tích …); điện thoại 1 cột */}
                <div className="grid grid-cols-1 gap-x-10 gap-y-3 sm:grid-cols-2">
                  {nhomThongSo(hangThongSo).flat().map((s) => (
                    <div key={s.label} className="flex min-w-0 items-start gap-3 text-sm">
                      <span className="w-32 shrink-0 text-cvr-muted sm:w-36">{s.label}</span>
                      <span className={`min-w-0 ${s.value === "Đang cập nhật" ? "text-cvr-faint" : "font-medium text-cvr-ink"}`}>
                        {s.href ? <Link href={s.href} className="hover:text-cvr-blue-ink">{s.value}</Link> : s.value}
                      </span>
                    </div>
                  ))}
                </div>
                {p.overview.length > 0 && (
                <div className="mt-5">
                {/* TRANG DỰ ÁN HIỆN ĐỦ, KHÔNG CẮT TỪNG PHẦN — trang dài là chuẩn (chủ dự án 30/10/2026) */}
                <div>
                  <div className="space-y-3 text-[15px] leading-relaxed text-cvr-body">
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
              <Section id="vi-tri" title="Vị trí & tiện ích xung quanh">
                <ProjectNearby mapQuery={mapQuery} address={diaChiDu} places={places} zoom={16} caoBanDo="h-[220px] w-full sm:h-[260px]" />
              </Section>

              {/* 3) Tiện ích dự án */}
              {p.amenities.length > 0 && (
                <Section id="tien-ich" title="Tiện ích dự án">
                  {/* Danh sách dài → 6 mục đầu + "Xem thêm" (gọn, 22/10/2026) */}
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                    {p.amenities.map((a) => (
                      <span key={a} className="flex items-start gap-2.5 py-1.5 text-[15px] leading-snug text-cvr-body">
                        <svg className="mt-0.5 h-4 w-4 shrink-0 text-cvr-blue" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
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
                  {/* Video thẳng mép các phần khác: 1 video rộng hết khung · từ 2 video xếp 2 một hàng (chủ dự án 30/10/2026: thu nhỏ lệch trái là vô lý) */}
                  <div className={`grid grid-cols-1 gap-4 ${p.videos.length > 1 ? "sm:grid-cols-2" : ""}`}>
                    {p.videos.map((v, i) => <VideoEmbed key={i} url={v} />)}
                  </div>
                </Section>
              )}

            </div>

            {/* Cột phụ — dính khi cuộn */}
            {/* CỘT PHẢI LUÔN CÓ, ĐỦ THỨ LIÊN QUAN (chủ dự án 30/10/2026) — mọi dự án cùng một khuôn: giá + liên hệ (khi có) · tin của dự án
                · dự án cùng khu vực · nhận tài liệu & báo giá */}
            <aside className="lg:col-span-1 lg:mt-5">
              {/* Cột phải CUỘN THEO TRANG, không dính: cột cao hơn màn hình mà dính thì cuộn bị khựng rồi trôi (chủ dự án 30/10/2026) */}
              <div className="h-full space-y-4">
                {/* Tin của dự án (bấm xuống khối tin) — máy tính lẫn điện thoại */}
                {hasRelated && (
                  <div className="rounded-2xl border border-cvr-line bg-white p-4 lg:p-5">
                    <p className="text-base font-semibold tracking-tight text-cvr-ink">{`Tin mua bán, cho thuê tại ${p.name}`}</p>
                    <div className="mt-3 flex flex-col">
                      {relBan.length > 0 && <a href="#tin-du-an" className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-cvr-body transition-colors hover:bg-cvr-surface hover:text-cvr-ink"><span>Mua bán</span><span className="text-xs text-cvr-muted">{relBan.length}</span></a>}
                      {relThue.length > 0 && <a href="#tin-du-an" className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-cvr-body transition-colors hover:bg-cvr-surface hover:text-cvr-ink"><span>Cho thuê</span><span className="text-xs text-cvr-muted">{relThue.length}</span></a>}
                    </div>
                  </div>
                )}

                {/* Dự án theo khu vực — cùng khối với trang Dự án, mọi tỉnh đang có dự án → trang /du-an/<tỉnh> */}
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

                {/* LIÊN HỆ + FORM DÍNH khi cuộn (máy tính) — khối thấp hơn màn hình nên dính êm; các hộp trên cuộn theo trang (30/10/2026) */}
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
                <div id="tai-tai-lieu" className="scroll-mt-14 overflow-hidden rounded-2xl border border-cvr-line bg-white p-4 lg:p-5 [&>div:last-child]:border-0 [&>div:last-child]:p-0 [&>div:last-child]:shadow-none [&_input]:h-10 [&_select]:h-10">
                  <p className="mb-3 text-base font-semibold tracking-tight text-cvr-ink">Tải tài liệu & báo giá</p>
                  <LeadForm cta="Đăng ký nhận tài liệu" topics={["Nhận brochure & mặt bằng", "Nhận bảng giá & chính sách", "Đặt lịch tham quan dự án", "Tư vấn vay ngân hàng"]} />
                </div>
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
    <section id={id} className="mt-10 scroll-mt-14 sm:mt-12">
      <h2 className="mb-4 text-xl font-semibold tracking-tight text-cvr-ink sm:text-2xl">{title}</h2>
      {children}
    </section>
  );
}


