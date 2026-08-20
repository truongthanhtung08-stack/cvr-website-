import type { MetadataRoute } from "next";
import { getProjects, getArticles } from "@/lib/contentDb";
import { getListings } from "@/lib/listingsDb";
import { projectCategories, rentCategories, saleCategories } from "@/lib/categories";
import { packages, utilityTools } from "@/lib/packages";

// TỰ LÀM MỚI MỖI GIỜ. Trước đây để `force-static` (di sản thời GitHub Pages):
// sitemap chỉ sinh 1 lần lúc build, nên MỌI tin/dự án/bài viết đăng sau lần
// deploy gần nhất đều KHÔNG có trong sitemap → Google không biết mà vào lấy.
export const revalidate = 3600;

// sitemap.xml (Next tự sinh khi build) — giúp Google phát hiện & lập chỉ mục nhanh.
// Gồm các trang tĩnh chính + trang chi tiết động (dự án, tin tức, bất động sản).
// Lỗi tải dữ liệu → CHỈ giữ trang tĩnh, KHÔNG làm hỏng build.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const SITE = "https://coastalland.vn";
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    "", "/mua-ban", "/cho-thue", "/du-an", "/tin-tuc",
    // KHÔNG đưa /so-sanh, /tin-luu, /tim-kiem vào sitemap: nội dung sinh theo
    // từng khách hoặc theo bộ lọc → Google coi là trang mỏng/trùng lặp.
    "/gioi-thieu", "/chuyen-gia", "/bao-gia-dang-tin", "/dang-tin",
    "/chuyen-gia/da-nang", "/chuyen-gia/hue", "/chuyen-gia/cong-ty", "/chuyen-gia/dang-ky",
  ].map((p) => ({
    url: `${SITE}${p}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.8,
  }));

  // TRANG THÔNG TIN & PHÁP LÝ — ít thay đổi, nhưng Google dùng để chấm độ TIN CẬY
  // của một sàn (E-E-A-T): có địa chỉ, có điều khoản, có kênh khiếu nại rõ ràng.
  // Bỏ chúng ra ngoài sitemap là mất không một điểm cộng miễn phí.
  const infoRoutes: MetadataRoute.Sitemap = [
    "/lien-he", "/huong-dan", "/faq", "/quy-dinh", "/quy-che",
    "/dieu-khoan", "/bao-mat", "/tuyen-dung", "/gop-y",
  ].map((p) => ({ url: `${SITE}${p}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.4 }));

  // Trang DANH MỤC loại hình — nhóm từ khoá quan trọng nhất của sàn
  // ("bán căn hộ chung cư Đà Nẵng", "cho thuê văn phòng Huế"…)
  const categoryRoutes: MetadataRoute.Sitemap = [
    ...saleCategories.map((c) => `/mua-ban/${c.slug}`),
    ...rentCategories.map((c) => `/cho-thue/${c.slug}`),
    ...projectCategories.map((c) => `/du-an/${c.slug}`),
  ].map((p) => ({ url: `${SITE}${p}`, lastModified: now, changeFrequency: "daily" as const, priority: 0.9 }));

  // Trang gói dịch vụ & công cụ tiện ích
  const toolRoutes: MetadataRoute.Sitemap = [...packages, ...utilityTools].map((t) => ({
    url: `${SITE}/tien-ich/${t.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  const dynamic: MetadataRoute.Sitemap = [];
  try {
    const [projects, articles, listings] = await Promise.all([
      getProjects(), getArticles(), getListings(),
    ]);
    // KHAI CẢ ẢNH của từng trang (sitemap ảnh). Bất động sản là ngành khách xem
    // BẰNG MẮT: rất nhiều người tìm qua Google Hình ảnh rồi mới bấm vào web.
    // Không khai thì ảnh tin gần như không bao giờ được lập chỉ mục.
    const anhTuyetDoi = (u?: string) => (!u ? [] : [u.startsWith("http") ? u : `${SITE}${u}`]);

    for (const p of projects) {
      dynamic.push({
        url: `${SITE}/du-an/${p.slug}`, lastModified: now, changeFrequency: "weekly", priority: 0.7,
        images: (p.photos?.length ? p.photos.slice(0, 5) : [p.image]).flatMap(anhTuyetDoi),
      });
    }
    for (const a of articles) {
      dynamic.push({
        url: `${SITE}/tin-tuc/${a.slug}`, lastModified: now, changeFrequency: "monthly", priority: 0.6,
        images: anhTuyetDoi(a.image),
      });
    }
    for (const l of listings) {
      dynamic.push({
        url: `${SITE}/bat-dong-san/${l.id}`, lastModified: now, changeFrequency: "weekly", priority: 0.7,
        images: anhTuyetDoi(l.image),
      });
    }
  } catch {
    // Bỏ qua — giữ nguyên các trang tĩnh.
  }

  return [...staticRoutes, ...infoRoutes, ...categoryRoutes, ...toolRoutes, ...dynamic];
}
