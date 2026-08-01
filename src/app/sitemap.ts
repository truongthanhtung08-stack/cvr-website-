import type { MetadataRoute } from "next";
import { getProjects, getArticles } from "@/lib/contentDb";
import { getListings } from "@/lib/listingsDb";

// Bắt buộc TĨNH cho static export (GitHub Pages): dữ liệu lấy 1 lần lúc build.
export const dynamic = "force-static";

// sitemap.xml (Next tự sinh khi build) — giúp Google phát hiện & lập chỉ mục nhanh.
// Gồm các trang tĩnh chính + trang chi tiết động (dự án, tin tức, bất động sản).
// Lỗi tải dữ liệu → CHỈ giữ trang tĩnh, KHÔNG làm hỏng build.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const SITE = "https://coastalland.vn";
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    "", "/mua-ban", "/cho-thue", "/du-an", "/tin-tuc",
    "/gioi-thieu", "/chuyen-gia", "/bao-gia-dang-tin", "/dang-tin", "/so-sanh",
  ].map((p) => ({
    url: `${SITE}${p}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.8,
  }));

  const dynamic: MetadataRoute.Sitemap = [];
  try {
    const [projects, articles, listings] = await Promise.all([
      getProjects(), getArticles(), getListings(),
    ]);
    for (const p of projects) {
      dynamic.push({ url: `${SITE}/du-an/${p.slug}`, lastModified: now, changeFrequency: "weekly", priority: 0.7 });
    }
    for (const a of articles) {
      dynamic.push({ url: `${SITE}/tin-tuc/${a.slug}`, lastModified: now, changeFrequency: "monthly", priority: 0.6 });
    }
    for (const l of listings) {
      dynamic.push({ url: `${SITE}/bat-dong-san/${l.id}`, lastModified: now, changeFrequency: "weekly", priority: 0.7 });
    }
  } catch {
    // Bỏ qua — giữ nguyên các trang tĩnh.
  }

  return [...staticRoutes, ...dynamic];
}
