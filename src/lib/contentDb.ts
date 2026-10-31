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
import { haiDongDiaChi, heCuaTin } from "@/lib/diaChiHaiHe";
import { articles as sampleArticles, projects as sampleProjects, getArticleBySlug, getProjectBySlug } from "@/lib/data";
import { asset } from "@/lib/asset";
import { isVideoUrl } from "@/lib/media";
import { chuThuan } from "@/lib/chuThuan";
import type { ArticleRow, ProjectRow } from "@/lib/contentAdmin";

const ARTICLE_PLACEHOLDER = "/images/segments/canho1.jpg";

// Nguồn thông tin hồ sơ dự án: chỉ ghi TÊN TRANG (vinpearl.com, melia.com…) — không in nguyên chuỗi ghi chú + đường dẫn dài (30/10/2026)
function tenNguon(nguon: string): string {
  const trang = [...nguon.matchAll(/https?:\/\/(?:www\.)?([^/\s;,)]+)/g)].map((m) => m[1].toLowerCase());
  const ds = [...new Set(trang)];
  return ds.length ? ds.join(", ") : nguon.split(/[;(]/)[0].trim();
}

// Gọi PostgREST trực tiếp bằng fetch (nội dung đã đăng là công khai — dùng anon key)
async function rest<T>(table: string, query: string): Promise<T[] | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null; // chưa cấu hình env (worktree/CI) → fallback
  try {
    const res = await fetch(`${url}/rest/v1/${table}?${query}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      // CACHE THEO THẺ "noi-dung" — thay cho `cache: "no-store"` cũ.
      // Nguyên tắc "admin sửa gì web hiện NGAY" GIỮ NGUYÊN, chỉ đổi cách giữ:
      // admin lưu xong thì trang admin gọi /api/lam-moi → revalidateTag("noi-dung")
      // → cache bay sạch → lượt sau đã là bản mới.
      // Vì sao bỏ no-store: nó khiến MỌI trang thành động, không lượt khách nào
      // được dùng lại. Đo 12/09/2026: khách chờ 500–600 ms và Fast Origin Transfer
      // của Vercel vượt trần miễn phí (16,86 GB / 10 GB) vì lượt nào cũng phải
      // đẩy lại nguyên trang từ Tokyo.
      // 300 giây là lưới an toàn cho trường hợp sửa thẳng trong bảng Supabase
      // (không qua giao diện admin nên không ai gọi làm mới).
      next: { tags: ["noi-dung"], revalidate: 300 },
    });
    if (!res.ok) return null; // bảng chưa tạo (404) / lỗi khác → fallback
    return (await res.json()) as T[];
  } catch {
    return null;
  }
}

// "2026-07-22T…" → "22/07/2026"
function fmtDate(iso: string | null): string {
  return new Date(iso ?? Date.now()).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh",
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
    ngayDangIso: r.published_at ?? r.created_at,
    ngaySuaIso: r.updated_at,
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

// "dd/mm/yyyy" (Cowork ghi) so với updated_at (lần sửa cuối) → chuỗi ngày mới hơn
function ngayMoiHon(ghi: string | undefined, sua: string): string {
  const p = (ghi ?? "").trim().split("/").map(Number); // "dd/mm/yyyy"
  const tGhi = p.length === 3 && p.every((x) => x > 0) ? new Date(p[2], p[1] - 1, p[0]).getTime() : 0;
  const tSua = new Date(sua).getTime() || 0;
  return tGhi > tSua ? ghi!.trim() : fmtDate(sua);
}

function projectRowToProject(r: ProjectRow): Project {
  // ĐỊA CHỈ ĐẦY ĐỦ: số nhà/đường (admin nhập) + Phường/Xã + Quận/Huyện + Tỉnh/Thành.
  // Cùng luật với tin đăng: dòng chính theo hệ MỚI, cách gọi cũ để ở locationCu.
  // Ghi chú trong ngoặc của hồ sơ nạp ("(phường An Hải Bắc, quận Sơn Trà cũ)") bỏ khỏi địa chỉ hiển thị — địa chỉ cũ đã có dòng riêng
  // (chủ dự án 30/10/2026: địa chỉ ghi đúng, gọn: số nhà, đường, phường, tỉnh)
  const soNha = r.details?.addressDetail?.replace(/\s*\([^)]*\)/g, "").replace(/\s+,/g, ",").trim();
  const goc = [soNha, r.ward, r.district, r.province].map((s) => s?.trim()).filter(Boolean).join(", ");
  const hai = r.province
    ? haiDongDiaChi(heCuaTin(r.district), {
        tinh: r.province, quan: r.district ?? "", phuong: r.ward ?? "",
      })
    : { moi: "", cu: "" };
  // Số nhà/đường admin nhập hay kèm sẵn phường, tỉnh ("01 Lê Văn Duyệt, Phường Sơn Trà, Thành phố Đà Nẵng") → bỏ các vế đó trước
  // khi ghép địa chỉ hệ mới, không ghi lặp (30/10/2026)
  const gon = (x: string) => x.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase()
    .replace(/^(phuong|xa|thi tran|thanh pho|tinh|tp\.?|quan|huyen|thi xa)\s+/, "").trim();
  const veTrung = new Set([r.ward, r.district, r.province, ...hai.moi.split(",")].filter(Boolean).map((x) => gon(x!)));
  const soNhaGon = soNha?.split(",").map((x) => x.trim()).filter((x) => x && !veTrung.has(gon(x))).join(", ");
  const location = hai.moi ? [soNhaGon, hai.moi].filter(Boolean).join(", ") : goc;
  // Dòng hệ cũ KHÔNG nhắc lại số nhà/đường — chúng không đổi sau sáp nhập.
  const locationCu = hai.cu;
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
    // Chỉ phường + tỉnh theo hệ MỚI (không số nhà, đường) — thẻ Dự án nổi bật ghi địa chỉ một kiểu (chủ dự án 30/10/2026)
    ...(hai.moi ? { diaChiMoi: hai.moi } : {}),
    ...(d.mapPin?.trim() ? { mapPin: d.mapPin.trim() } : {}),
    ...(locationCu ? { locationCu } : {}),
    priceFrom: r.price_from || "Liên hệ",
    type: r.type || "Dự án bất động sản",
    // Hồ sơ DẠNG THẺ (Cowork nạp hàng loạt cho Tra cứu dự án, 29/10/2026): không tự gán tình trạng, không câu tổng quan
    // thay thế — trống thì trang dự án ẩn mục đó. Hồ sơ nổi bật giữ như cũ.
    // Tình trạng = ĐÚNG Admin ghi; trống thì web ghi "Đang cập nhật" — không tự gán "Đang mở bán" (chủ dự án 31/10/2026: một nguồn = Admin)
    status: r.status_text || "",
    // Chưa có ảnh → "" (chủ dự án 31/10/2026: "chưa có ảnh thì để trống") — thẻ hiện khung xám + biểu tượng, KHÔNG ảnh mẫu
    image: photos[0] ? asset(photos[0]) : "",
    developer: r.developer || "Đang cập nhật",
    scale: (r.scale ?? []).filter((s) => s && s.label && s.value),
    amenities: (r.amenities ?? []).filter(Boolean),
    overview: overview.length ? overview : d.dangThe ? [] : [`Dự án ${r.name}${location ? ` tại ${location}` : ""} — thông tin đang được Coastal Land cập nhật.`],
    ...(photos.length ? { photos: photos.map(asset) } : {}),
    ...(videos.length ? { videos } : {}),
    tier: d.tier ?? "basic",
    ...(d.dangThe ? { dangThe: true } : {}),
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
    // Ngày cập nhật: ngày Cowork ghi khi nạp, không có thì lần sửa cuối trong admin
    // NGÀY CẬP NHẬT = ngày MỚI NHẤT giữa ngày Cowork ghi khi nạp và lần sửa cuối trong Admin — anh sửa hôm nào hiện đúng hôm đó (30/10/2026)
    capNhat: ngayMoiHon(d.ngayCapNhat, r.updated_at),
    ...(d.nguon?.trim() ? { nguon: tenNguon(d.nguon) } : {}),
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

// DỰ ÁN NỔI BẬT = hồ sơ admin dựng đầy đủ (chủ dự án 29/10/2026). Hồ sơ DẠNG THẺ (nạp hàng loạt từ tệp Cowork — tên, chủ đầu tư,
// địa chỉ, loại hình, ≥ 1 ảnh) chỉ hiện ở Tra cứu dự án (/du-an/tra-cuu).
export async function getProjectsNoiBat(): Promise<Project[]> {
  return (await getProjects()).filter((p) => !p.dangThe);
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
