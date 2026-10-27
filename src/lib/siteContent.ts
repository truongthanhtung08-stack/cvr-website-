// ============================================================================
// ĐỌC NỘI DUNG TĨNH TRANG WEB từ Supabase (bảng site_content) — server-side.
// Admin sửa gì (chữ + ảnh) web hiện NGAY (fetch no-store). Chưa nhập khối nào →
// dùng NỘI DUNG MẶC ĐỊNH trong code (web không bao giờ trống).
// ============================================================================

import { ghepQuyDinh, KHOA_QUY_DINH_GIA, type QuyDinhGia } from "@/lib/quyDinhGia";
import type { ChiSoGiaData } from "@/lib/chiSoGia";
import { asset } from "@/lib/asset";
import { FOOTER_DEFAULT, type FooterData } from "@/lib/footerMacDinh";
import { HOME_AREAS_DEFAULT, type AreaCard } from "@/lib/khuVucMacDinh";
import { homeBanners, projectBanners, type Banner } from "@/lib/banners";
import { BILLING_DEFAULT, chuanHoaCapHoiVien, type BillingData } from "@/lib/billing";

// Lấy 1 khối nội dung theo key. Lỗi/chưa cấu hình/chưa có → null (dùng mặc định).
async function fetchBlock<T>(key: string): Promise<T | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  try {
    const res = await fetch(
      `${url}/rest/v1/site_content?key=eq.${encodeURIComponent(key)}&select=data&limit=1`,
      {
        headers: { apikey: anon, Authorization: `Bearer ${anon}` },
        // CACHE THEO THẺ "noi-dung" thay cho `cache: "no-store"` cũ — xem ghi chú
        // đầy đủ ở src/lib/contentDb.ts và src/app/api/lam-moi/route.ts.
        // Admin lưu trong /admin/noi-dung → gọi /api/lam-moi → cache bay ngay,
        // nên "sửa là hiện" vẫn đúng, mà khách lạ được phục vụ bản dựng sẵn.
        next: { tags: ["noi-dung"], revalidate: 300 },
      },
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
export type { FooterSocial, FooterShot, FooterData } from "@/lib/footerMacDinh";
export { FOOTER_DEFAULT } from "@/lib/footerMacDinh";

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

// ── BẤT ĐỘNG SẢN THEO KHU VỰC (trang chủ) ────────────────────────────────────
// 5 ô: ô ĐẦU = địa điểm lõi (hiển thị lớn 2×2). Lưu key 'home_areas'.
// image = đường dẫn RAW (component tự qua asset()).
export type { AreaCard } from "@/lib/khuVucMacDinh";
export { areaImages, HOME_AREAS_DEFAULT } from "@/lib/khuVucMacDinh";

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
  heroImage: string;        // MÁY TÍNH — khung 4:1 → ảnh 4000×1000
  heroImageMobile?: string; // ĐIỆN THOẠI — khung 16:10 → ảnh 1200×750. Trống → dùng tạm ảnh PC
  story: { eyebrow: string; title: string; paragraphs: string[]; image: string };
  vision: string;
  mission: string;
  values: AboutValue[];
  statsImage: string;
  stats: AboutStat[];
  market: { image: string; eyebrow: string; title: string; desc: string; ctaLabel: string; ctaHref: string };
  cta: { title: string; desc: string; primaryLabel: string; primaryHref: string; secondaryLabel: string; secondaryHref: string };
};

// ẢNH NỀN TRANG GIỚI THIỆU — ảnh của chủ dự án (09/10/2026: "sao bỏ hết mấy cái hình nền của tao"
// → trả lại đủ 4 ảnh như trước 08/10). Admin nhập ảnh khác thì ảnh admin đè lên.
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
    // Ô ảnh admin để TRỐNG → dùng ảnh nền mặc định của chủ dự án (không để trang trơn không ảnh)
    heroImage: data.heroImage || ABOUT_DEFAULT.heroImage,
    statsImage: data.statsImage || ABOUT_DEFAULT.statsImage,
    story: { ...ABOUT_DEFAULT.story, ...data.story, image: data.story?.image || ABOUT_DEFAULT.story.image },
    market: { ...ABOUT_DEFAULT.market, ...data.market, image: data.market?.image || ABOUT_DEFAULT.market.image },
    cta: { ...ABOUT_DEFAULT.cta, ...data.cta },
    values: data.values?.length ? data.values : ABOUT_DEFAULT.values,
    stats: data.stats?.length ? data.stats : ABOUT_DEFAULT.stats,
  };
}

// ── BẢNG GIÁ DỊCH VỤ (/bao-gia-dang-tin) ─────────────────────────────────────
// Lưu key 'pricing' (toàn bộ PricingData). Admin sửa từ mặc định → lưu trọn object.

// ── GÓI ĐĂNG TIN · KHUYẾN MÃI · ĐIỂM · CẤP THÀNH VIÊN ────────────────────────
// Lưu key 'billing' (toàn bộ BillingData). Admin sửa ở /admin/gia-khuyen-mai.
// Quy định & quyền lợi gói — nguồn duy nhất là admin (/admin/gia-chuan → tab Quy định).
export async function getQuyDinhGia(): Promise<QuyDinhGia> {
  return ghepQuyDinh(await fetchBlock<Partial<QuyDinhGia>>(KHOA_QUY_DINH_GIA));
}

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

// ── CHỈ SỐ GIÁ THEO QUÝ ─────────────────────────────────────────────────────
// Lưu key "chi_so_gia". Chủ dự án nhập tay mỗi quý một lần từ báo cáo thị
// trường (Batdongsan · CBRE · Savills · DKRA). Chưa nhập → null, trang tin
// không vẽ biểu đồ xu hướng, chỉ còn mặt bằng giá tính từ tin trên web.
export async function getChiSoGia(): Promise<ChiSoGiaData | null> {
  return fetchBlock<ChiSoGiaData>("chi_so_gia");
}
