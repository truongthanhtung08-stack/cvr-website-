// ============================================================================
// ĐỌC NỘI DUNG TĨNH TRANG WEB từ Supabase (bảng site_content) — server-side.
// Admin sửa gì (chữ + ảnh) web hiện NGAY (fetch no-store). Chưa nhập khối nào →
// dùng NỘI DUNG MẶC ĐỊNH trong code (web không bao giờ trống).
// ============================================================================

import { asset } from "@/lib/asset";
import { homeBanners, projectBanners, type Banner } from "@/lib/banners";
import { landings as LANDINGS_DEFAULT, type Landing } from "@/lib/landings";

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
  address: "Đà Nẵng",
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
    phones: "/images/app-phones.png",
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
