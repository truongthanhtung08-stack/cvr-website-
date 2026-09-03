// ============================================================================
// LỚP ĐỌC NỘI DUNG ADMIN TỰ TẠO (Tin tức + Dự án) TỪ SUPABASE — server-side.
// Đọc bảng `articles` / `projects` qua PostgREST với cache: no-store —
// admin đăng/sửa gì, web hiện NGAY. Map về đúng type Article/Project của FE
// nên mọi component hiển thị giữ nguyên.
//
// FALLBACK AN TOÀN: bảng chưa tạo / Supabase lỗi / CHƯA có bài-dự án thật nào
// → dùng dữ liệu mẫu src/lib/data.ts (web không trống). Ngay khi admin đăng
// nội dung thật đầu tiên → chỉ hiện nội dung thật, mẫu tự ẩn.
// ============================================================================

import type { Article, Project } from "@/lib/data";
import { articles as sampleArticles, projects as sampleProjects, getArticleBySlug, getProjectBySlug } from "@/lib/data";
import { asset } from "@/lib/asset";
import { isVideoUrl } from "@/lib/media";
import { chuThuan } from "@/lib/chuThuan";
import type { ArticleRow, ProjectRow } from "@/lib/contentAdmin";

const ARTICLE_PLACEHOLDER = "/images/segments/canho1.jpg";
const PROJECT_PLACEHOLDER = "/images/segments/canho2.jpg";

// Gọi PostgREST trực tiếp bằng fetch (nội dung đã đăng là công khai — dùng anon key)
async function rest<T>(table: string, query: string): Promise<T[] | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null; // chưa cấu hình env (worktree/CI) → fallback
  try {
    const res = await fetch(`${url}/rest/v1/${table}?${query}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store", // LUÔN lấy dữ liệu mới — admin sửa gì web hiện NGAY
    });
    if (!res.ok) return null; // bảng chưa tạo (404) / lỗi khác → fallback
    return (await res.json()) as T[];
  } catch {
    return null;
  }
}

// "2026-07-22T…" → "22/07/2026"
function fmtDate(iso: string | null): string {
  return new Date(iso ?? Date.now()).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// Tách text thành đoạn (mỗi dòng 1 đoạn, bỏ dòng trống)
function paras(text: string | null): string[] {
  return (text ?? "").split("\n").map((s) => s.trim()).filter(Boolean);
}

// ── TIN TỨC ─────────────────────────────────────────────────────────────────

function articleRowToArticle(r: ArticleRow): Article {
  const content = paras(r.content);
  return {
    slug: r.slug,
    title: r.title,
    // Gỡ ký hiệu soạn thảo (::justify::, **đậm**…) — phần tóm tắt in ra thẳng
    // chứ không qua bộ dựng nội dung, để nguyên là ký hiệu lòi ra ngoài web.
    excerpt: chuThuan(r.excerpt),
    date: fmtDate(r.published_at ?? r.created_at),
    category: r.category,
    image: asset(r.image || ARTICLE_PLACEHOLDER),
    ...(content.length ? { content } : {}),
  };
}

// Toàn bộ bài ĐÃ ĐĂNG (mới nhất trước). Chưa có bài thật/lỗi → bài mẫu.
export async function getArticles(): Promise<Article[]> {
  const rows = await rest<ArticleRow>(
    "articles",
    "select=*&status=eq.published&order=published_at.desc.nullslast&limit=200",
  );
  if (!rows || rows.length === 0) return sampleArticles;
  return rows.map(articleRowToArticle);
}

// Một bài theo slug — không có trong DB → tìm trong bài mẫu
export async function getArticle(slug: string): Promise<Article | null> {
  const rows = await rest<ArticleRow>(
    "articles",
    `select=*&status=eq.published&slug=eq.${encodeURIComponent(slug)}&limit=1`,
  );
  if (rows && rows.length > 0) return articleRowToArticle(rows[0]);
  return getArticleBySlug(slug) ?? null;
}

// ── DỰ ÁN ───────────────────────────────────────────────────────────────────

function projectRowToProject(r: ProjectRow): Project {
  // ĐỊA CHỈ ĐẦY ĐỦ: số nhà/đường (admin nhập) + Phường/Xã + Quận/Huyện + Tỉnh/Thành
  const location = [r.details?.addressDetail, r.ward, r.district, r.province]
    .map((s) => s?.trim())
    .filter(Boolean)
    .join(", ");
  const overview = paras(r.overview);
  // Tách ẢNH và VIDEO: thư viện ảnh chỉ nhận ảnh; video hiện ở mục Video riêng.
  const media = (r.images ?? []).filter(Boolean);
  const photos = media.filter((s) => !isVideoUrl(s));
  const videos = media.filter(isVideoUrl);
  const d = r.details ?? {};
  // Ảnh mặt bằng đưa qua asset() để chạy đúng trên mọi môi trường
  const floorPlans = (d.floorPlans ?? [])
    .filter((f) => f && f.image)
    .map((f) => ({ label: f.label ?? "", image: asset(f.image), note: f.note ?? "" }));
  const dev = d.developerInfo;
  return {
    slug: r.slug,
    name: r.name,
    location: location || "Đang cập nhật",
    priceFrom: r.price_from || "Liên hệ",
    type: r.type || "Dự án bất động sản",
    status: r.status_text || "Đang mở bán",
    image: asset(photos[0] ?? PROJECT_PLACEHOLDER),
    developer: r.developer || "Đang cập nhật",
    scale: (r.scale ?? []).filter((s) => s && s.label && s.value),
    amenities: (r.amenities ?? []).filter(Boolean),
    overview: overview.length ? overview : [`Dự án ${r.name}${location ? ` tại ${location}` : ""} — thông tin đang được Coastal Land cập nhật.`],
    ...(photos.length ? { photos: photos.map(asset) } : {}),
    ...(videos.length ? { videos } : {}),
    tier: d.tier ?? "basic",
    // Chỉ trả contact khi admin ĐÃ nhập ít nhất SĐT hoặc email — không có thì
    // trang dự án bỏ hẳn khối liên hệ (không hiện số tổng đài bịa).
    ...(d.contact && (d.contact.phone?.trim() || d.contact.email?.trim())
      ? { contact: d.contact }
      : {}),
    ...(d.purposes?.length ? { purposes: d.purposes } : {}),
    priceMode: d.priceMode ?? "hidden",
    ...(d.priceTable?.length ? { priceTable: d.priceTable.filter((p) => p && (p.unit || p.area || p.price)) } : {}),
    ...(floorPlans.length ? { floorPlans } : {}),
    ...(d.places?.length ? { places: d.places.filter((p) => p && p.name) } : {}),
    ...(dev && (dev.desc || dev.website || dev.established || dev.logo)
      ? { developerInfo: { ...dev, ...(dev.logo ? { logo: asset(dev.logo) } : {}) } }
      : {}),
    ...(d.developmentUnit?.trim() ? { developmentUnit: d.developmentUnit.trim() } : {}),
  };
}

// Toàn bộ dự án ĐÃ ĐĂNG (mới nhất trước). Chưa có dự án thật/lỗi → dự án mẫu.
export async function getProjects(): Promise<Project[]> {
  const rows = await rest<ProjectRow>(
    "projects",
    "select=*&status=eq.published&order=published_at.desc.nullslast&limit=200",
  );
  if (!rows || rows.length === 0) return sampleProjects;
  return rows.map(projectRowToProject);
}

// Một dự án theo slug — không có trong DB → tìm trong dự án mẫu
export async function getProject(slug: string): Promise<Project | null> {
  const rows = await rest<ProjectRow>(
    "projects",
    `select=*&status=eq.published&slug=eq.${encodeURIComponent(slug)}&limit=1`,
  );
  if (rows && rows.length > 0) return projectRowToProject(rows[0]);
  return getProjectBySlug(slug) ?? null;
}
