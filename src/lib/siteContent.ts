// ============================================================================
// ĐỌC NỘI DUNG TĨNH TRANG WEB từ Supabase (bảng site_content) — server-side.
// Admin sửa gì (chữ + ảnh) web hiện NGAY (fetch no-store). Chưa nhập khối nào →
// dùng NỘI DUNG MẶC ĐỊNH trong code (web không bao giờ trống).
// ============================================================================

import { asset } from "@/lib/asset";
import { homeBanners, projectBanners, type Banner } from "@/lib/banners";
import { landings as LANDINGS_DEFAULT, type Landing } from "@/lib/landings";
import { PRICING_DEFAULT, type PricingData } from "@/lib/pricingData";
import { BILLING_DEFAULT, chuanHoaCapHoiVien, type BillingData } from "@/lib/billing";

// Lấy 1 khối nội dung theo key. Lỗi/chưa cấu hình/chưa có → null (dùng mặc định).
async function fetchBlock<T>(key: string): Promise<T | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  try {
    const res = await fetch(
      `${url}/rest/v1/site_content?key=eq.${encodeURIComponent(key)}&select=data&limit=1`,
      { headers: { apikey: anon, Authorization: `Bearer ${anon}` }, cache: "no-store" },
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as { data: T }[];
    return rows[0]?.data ?? null;
  } catch {
    return null;
  }
}

// ── TIN CHÍNH TRANG CHỦ ──────────────────────────────────────────────────────
// GHIM một bài viết làm tin chính (ô lớn bên trái khối Tin tức). Không ghim bài
// nào → tự lấy bài mới nhất. Nhờ vậy đăng bài mới KHÔNG làm trôi tin chính.
// Lưu: site_content key "home_featured_article" = { slug }.
export async function getFeaturedArticleSlug(): Promise<string | null> {
  const data = await fetchBlock<{ slug?: string }>("home_featured_article");
  return data?.slug?.trim() || null;
}

// ── HERO TRANG CHỦ ───────────────────────────────────────────────────────────
// Lưu dạng { slides: Banner[] }. Ảnh là đường dẫn RAW → qua asset() khi hiển thị.
export async function getHeroBanners(): Promise<Banner[]> {
  const data = await fetchBlock<{ slides: Banner[] }>("hero_home");
  const slides = data?.slides?.filter((s) => s && s.image);
  return slides?.length ? slides : homeBanners;
}

// ── FOOTER (thông tin công ty) ───────────────────────────────────────────────
export type FooterSocial = { label: string; href: string };
export type FooterShot = { src: string; alt: string };
export type FooterData = {
  tagline: string;      // dòng đậm dưới logo
  description: string;  // đoạn giới thiệu ngắn
  hotline: string;
  email: string;
  address: string;
  company: string;      // tên pháp lý (dòng cuối)
  socials: FooterSocial[];
  images: FooterShot[]; // 3 ảnh minh hoạ (dẫn tới trang Giới thiệu)
};

// Mặc định = đúng nội dung Footer hiện tại (khớp Footer.tsx cũ).
export const FOOTER_DEFAULT: FooterData = {
  tagline: "Bất động sản Duyên hải Miền Trung",
  description:
    "Coastal Land (coastalland.vn) là nền tảng công nghệ và cổng thông tin bất động sản trực tuyến hàng đầu tại Việt Nam.",
  hotline: "+84 377 985 036",
  email: "lienhe@coastalland.vn",
  // Địa chỉ công ty — ghi theo đơn vị hành chính MỚI 2025 (Tỉnh/Thành → Phường/Xã)
  address: "220 Nguyễn Mậu Tài, phường Hòa Xuân, thành phố Đà Nẵng",
  company: "Central Coast Vietnam Real Estate (CVR)",
  socials: [
    { label: "Zalo", href: "#" },
    { label: "Facebook", href: "#" },
    { label: "X", href: "#" },
    { label: "YouTube", href: "#" },
  ],
  images: [
    { src: "/images/gioi-thieu/intro-thanh-pho.jpg", alt: "Đô thị ven biển Duyên hải Miền Trung" },
    { src: "/images/gioi-thieu/villa-bien.jpg", alt: "Biệt thự view biển" },
    { src: "/images/gioi-thieu/ben-du-thuyen.jpg", alt: "Đô thị ven biển" },
  ],
};

export async function getFooter(): Promise<FooterData> {
  const data = await fetchBlock<Partial<FooterData>>("footer");
  if (!data) return FOOTER_DEFAULT;
  // Gộp với mặc định: field nào admin bỏ trống thì giữ mặc định.
  return {
    ...FOOTER_DEFAULT,
    ...data,
    socials: data.socials?.length ? data.socials : FOOTER_DEFAULT.socials,
    images: data.images?.length ? data.images : FOOTER_DEFAULT.images,
  };
}

// Ảnh footer đưa qua asset() để hiển thị đúng mọi môi trường.
export function footerImageSrc(src: string): string {
  return asset(src);
}

// ── 2 BANNER QUẢNG CÁO CUỐI TRANG CHỦ (Đăng tin · Ứng dụng) ──────────────────
// Lưu key 'home_ad'. Dòng 2 mỗi tiêu đề là dòng NHẤN VÀNG (cấu trúc cố định).
export type HomeAdData = {
  seller: {
    image: string;      // ảnh nền villa (RAW path)
    titleLine1: string; // dòng tiêu đề 1 (đen)
    titleLine2: string; // dòng tiêu đề 2 (nhấn vàng)
    body: string;
    ctaLabel: string;
    ctaHref: string;
  };
  app: {
    titleLine1: string; // dòng tiêu đề 1 (trắng)
    titleLine2: string; // dòng tiêu đề 2 (nhấn vàng)
    body: string;
    phones: string;     // ảnh iPhone (RAW path)
    qr: string;         // ảnh QR (RAW path)
    ctaLabel: string;
    ctaHref: string;
    appleHref: string;  // link nút App Store
    googleHref: string; // link nút Google Play
  };
};

export const HOME_AD_DEFAULT: HomeAdData = {
  seller: {
    image: "/images/banner-coastal-35.jpg",
    titleLine1: "Đưa Bất động sản",
    titleLine2: "đến đúng khách hàng.",
    body: "Đăng tin mua bán, cho thuê và dự án trên COASTAL LAND với giao diện thân thiện, thông tin cập nhật chính xác cùng nhiều tính năng khác biệt, Coastal Land đang từng ngày khẳng định giá trị đối với người dùng và khách hàng.",
    ctaLabel: "Đăng tin ngay",
    ctaHref: "/dang-tin",
  },
  app: {
    titleLine1: "Thị trường bất động sản.",
    titleLine2: "Trong tầm tay bạn.",
    body: "Ứng dụng COASTAL LAND giúp bạn tìm kiếm, so sánh, theo dõi và nắm bắt cơ hội mọi lúc, mọi nơi.",
    phones: "/images/app-mockup.png",
    qr: "/images/qr.png",
    ctaLabel: "Tải ứng dụng",
    ctaHref: "#",
    appleHref: "#",
    googleHref: "#",
  },
};

export async function getHomeAd(): Promise<HomeAdData> {
  const data = await fetchBlock<Partial<HomeAdData>>("home_ad");
  if (!data) return HOME_AD_DEFAULT;
  // Gộp theo từng banner: field admin bỏ trống → giữ mặc định.
  return {
    seller: { ...HOME_AD_DEFAULT.seller, ...data.seller },
    app: { ...HOME_AD_DEFAULT.app, ...data.app },
  };
}

// ── BANNER TRANG DỰ ÁN (/du-an) ──────────────────────────────────────────────
// Lưu key 'banner_projects' dạng { slides: Banner[] }. Chưa nhập → banner mặc định.
export async function getProjectBanners(): Promise<Banner[]> {
  const data = await fetchBlock<{ slides: Banner[] }>("banner_projects");
  const slides = data?.slides?.filter((s) => s && s.image);
  return slides?.length ? slides : projectBanners;
}

// ── LANDING PAGES (/landing/[slug]) ──────────────────────────────────────────
// Lưu key 'landings' dạng { items: Landing[] }. Chưa nhập → landing mặc định trong code.
export async function getLandings(): Promise<Landing[]> {
  const data = await fetchBlock<{ items: Landing[] }>("landings");
  const items = data?.items?.filter((l) => l && l.slug);
  return items?.length ? items : LANDINGS_DEFAULT;
}

export async function getLandingBySlug(slug: string): Promise<Landing | undefined> {
  const all = await getLandings();
  return all.find((l) => l.slug === slug);
}

// ── BẤT ĐỘNG SẢN THEO KHU VỰC (trang chủ) ────────────────────────────────────
// 5 ô: ô ĐẦU = địa điểm lõi (hiển thị lớn 2×2). Lưu key 'home_areas'.
// image = đường dẫn RAW (component tự qua asset()).
export type AreaCard = {
  name: string;
  count: string;      // dòng nhỏ dưới tên, vd "1.240 tin"
  image: string;      // ảnh CHÍNH (RAW), vd "/images/tin/1.jpg"
  images?: string[];  // ảnh chạy slide THÊM sau ảnh chính (không có → ô đứng yên)
  href: string;       // bấm ô → tới đâu
};

// Danh sách ảnh của một ô khu vực: ảnh chính đứng đầu, bỏ trùng và ô rỗng.
export function areaImages(a: AreaCard): string[] {
  return Array.from(new Set([a.image, ...(a.images ?? [])].filter(Boolean)));
}

export const HOME_AREAS_DEFAULT: AreaCard[] = [
  { name: "Đà Nẵng", count: "1.240 tin", image: "/images/tin/1.jpg", images: ["/images/tin/2.jpg", "/images/tin/3.jpg"], href: "/mua-ban?tinh=Đà Nẵng" },
  { name: "Huế", count: "586 tin", image: "/images/tin/13.jpg", images: ["/images/tin/14.jpg", "/images/tin/15.jpg"], href: "/mua-ban?tinh=Huế" },
  // ĐỊA DANH (Quy Nhơn, Nha Trang…) KHÔNG mất đi sau sáp nhập — chỉ không còn là
  // cấp tỉnh. Sau 2025 chúng là PHƯỜNG thuộc tỉnh mới, nên lọc theo dạng
  // kv=<Tỉnh mới>//<Địa danh>: Gia Lai//Quy Nhơn khớp cả Phường Quy Nhơn,
  // Quy Nhơn Bắc/Nam/Đông/Tây. Dùng ?tinh=Quy Nhơn như trước sẽ ra 0 tin.
  { name: "Quy Nhơn", count: "198 tin", image: "/images/tin/5.jpg", images: ["/images/tin/6.jpg", "/images/tin/7.jpg"], href: "/mua-ban?kv=Gia Lai//Quy Nhơn" },
  { name: "Nha Trang", count: "324 tin", image: "/images/tin/9.jpg", images: ["/images/tin/10.jpg", "/images/tin/11.jpg"], href: "/mua-ban?kv=Khánh Hòa//Nha Trang" },
  { name: "Quảng Ngãi", count: "256 tin", image: "/images/tin/20.jpg", images: ["/images/tin/21.jpg", "/images/tin/22.jpg"], href: "/mua-ban?tinh=Quảng Ngãi" },
];

export async function getHomeAreas(): Promise<AreaCard[]> {
  const data = await fetchBlock<{ items: AreaCard[] }>("home_areas");
  const items = data?.items?.filter((a) => a && a.name && a.image);
  return items?.length ? items : HOME_AREAS_DEFAULT;
}

// ── TRANG GIỚI THIỆU CÔNG TY (/gioi-thieu) ───────────────────────────────────
// Lưu key 'about'. Icon của "giá trị cốt lõi" giữ trong code (map theo thứ tự).
export type AboutStat = { value: string; label: string; sub: string };
export type AboutValue = { title: string; desc: string };
export type AboutData = {
  heroImage: string;
  story: { eyebrow: string; title: string; paragraphs: string[]; image: string };
  vision: string;
  mission: string;
  values: AboutValue[];
  statsImage: string;
  stats: AboutStat[];
  market: { image: string; eyebrow: string; title: string; desc: string; ctaLabel: string; ctaHref: string };
  cta: { title: string; desc: string; primaryLabel: string; primaryHref: string; secondaryLabel: string; secondaryHref: string };
};

export const ABOUT_DEFAULT: AboutData = {
  heroImage: "/images/gioi-thieu/hero-gioi-thieu.jpg",
  story: {
    eyebrow: "Chúng tôi là ai",
    title: "Nền tảng công nghệ và cổng thông tin Bất động sản hàng đầu",
    paragraphs: [
      "Coastal Land (coastalland.vn) là một trong những nền tảng công nghệ và cổng thông tin bất động sản trực tuyến hàng đầu tại Việt Nam, Chúng tôi khởi đầu từ Đà Nẵng và mở rộng khắp các khu vực đầy tiềm năng thuộc Duyên hải Miền Trung và Tây Nguyên.",
      "Với nền tảng công nghệ ưu việt cùng chiến lược Marketing hiệu quả, Chúng tôi gắn kết và tạo kết nối giữa những người có nhu cầu mua và bán bất động sản, giữa người dùng và các chuyên gia nhằm giúp mọi người tìm kiếm, chia sẻ và giao dịch nhanh chóng, thuận tiện.",
    ],
    image: "/images/gioi-thieu/office.jpg",
  },
  vision: "Trở thành nền tảng PropTech hàng đầu Việt Nam và xây dựng hệ sinh thái bất động sản thân thiện dễ dàng đến người dùng.",
  mission: "Kết nối mọi người mua – bán bất động sản dễ dàng, minh bạch và an toàn; mang công nghệ đến gần người dùng và nâng chuẩn dịch vụ bất động sản.",
  values: [
    { title: "Minh bạch", desc: "Thông tin rõ ràng, pháp lý kiểm chứng — người mua yên tâm, người bán uy tín." },
    { title: "Công nghệ", desc: "Bộ lọc thông minh, gợi ý cá nhân hoá và dữ liệu lớn — tìm đúng bất động sản nhanh nhất." },
    // ⚠️ Coastal Land KHÔNG hỗ trợ pháp lý, KHÔNG tham gia giao dịch — chỉ kết nối.
    { title: "An toàn", desc: "Kết nối trực tiếp người mua, người bán và môi giới; thông tin pháp lý nêu rõ để hai bên tự đối chiếu." },
    { title: "Đồng hành", desc: "Phục vụ người mua, người bán, môi giới và doanh nghiệp — cùng phát triển thị trường bền vững." },
  ],
  statsImage: "/images/gioi-thieu/ben-du-thuyen.jpg",
  stats: [
    { value: "2", label: "Thị trường trọng điểm", sub: "Đà Nẵng · Huế" },
    { value: "1.000+", label: "Tin đăng chọn lọc", sub: "cập nhật mỗi ngày" },
    { value: "24/7", label: "Hỗ trợ trực tuyến", sub: "minh bạch · nhanh" },
  ],
  market: {
    image: "/images/gioi-thieu/chuyen-sau.jpg",
    eyebrow: "Thị trường chuyên sâu",
    title: "Duyên hải Miền Trung",
    desc: "Chúng tôi thấu hiểu nhu cầu của người dùng cũng như tiềm năng các đô thị ven biển Miền Trung — từ căn hộ, nhà phố, đất nền đến bất động sản nghỉ dưỡng — để mỗi kết quả tìm kiếm đều sát nhu cầu thật.",
    ctaLabel: "Khám phá dự án",
    ctaHref: "/du-an",
  },
  cta: {
    title: "Bắt đầu cùng Coastal Land",
    desc: "Đăng tin để tiếp cận khách hàng và nhà đầu tư, hoặc tìm ngay bất động sản phù hợp.",
    primaryLabel: "Đăng tin ngay",
    primaryHref: "/dang-tin",
    secondaryLabel: "Xem bất động sản",
    secondaryHref: "/mua-ban",
  },
};

export async function getAbout(): Promise<AboutData> {
  const data = await fetchBlock<Partial<AboutData>>("about");
  if (!data) return ABOUT_DEFAULT;
  // Gộp với mặc định: field/khối admin bỏ trống → giữ mặc định.
  return {
    ...ABOUT_DEFAULT, ...data,
    story: { ...ABOUT_DEFAULT.story, ...data.story },
    market: { ...ABOUT_DEFAULT.market, ...data.market },
    cta: { ...ABOUT_DEFAULT.cta, ...data.cta },
    values: data.values?.length ? data.values : ABOUT_DEFAULT.values,
    stats: data.stats?.length ? data.stats : ABOUT_DEFAULT.stats,
  };
}

// ── BẢNG GIÁ DỊCH VỤ (/bao-gia-dang-tin) ─────────────────────────────────────
// Lưu key 'pricing' (toàn bộ PricingData). Admin sửa từ mặc định → lưu trọn object.
export async function getPricing(): Promise<PricingData> {
  const data = await fetchBlock<Partial<PricingData>>("pricing");
  if (!data) return PRICING_DEFAULT;
  return { ...PRICING_DEFAULT, ...data, intro: { ...PRICING_DEFAULT.intro, ...data.intro } };
}

// ── GÓI ĐĂNG TIN · KHUYẾN MÃI · ĐIỂM · CẤP THÀNH VIÊN ────────────────────────
// Lưu key 'billing' (toàn bộ BillingData). Admin sửa ở /admin/gia-khuyen-mai.
export async function getBilling(): Promise<BillingData> {
  const data = await fetchBlock<Partial<BillingData>>("billing");
  if (!data) return BILLING_DEFAULT;
  return {
    ...BILLING_DEFAULT,
    ...data,
    plans: data.plans?.length ? data.plans : BILLING_DEFAULT.plans,
    projectPlans: data.projectPlans?.length ? data.projectPlans : BILLING_DEFAULT.projectPlans,
    promos: data.promos ?? [],
    free: { ...BILLING_DEFAULT.free, ...data.free },
    points: { ...BILLING_DEFAULT.points, ...data.points },
    levels: chuanHoaCapHoiVien(data.levels),
    topupAmounts: data.topupAmounts?.length ? data.topupAmounts : BILLING_DEFAULT.topupAmounts,
  };
}
