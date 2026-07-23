// ============================================================================
// ĐỌC NỘI DUNG TĨNH TRANG WEB từ Supabase (bảng site_content) — server-side.
// Admin sửa gì (chữ + ảnh) web hiện NGAY (fetch no-store). Chưa nhập khối nào →
// dùng NỘI DUNG MẶC ĐỊNH trong code (web không bao giờ trống).
// ============================================================================

import { asset } from "@/lib/asset";
import { homeBanners, type Banner } from "@/lib/banners";
import { areas as AREAS_DEFAULT, type Area } from "@/lib/data";

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
