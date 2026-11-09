import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import sitemap from "@/app/sitemap";
import { getTinXetTrang } from "@/lib/listingsDb";
import { tatCaTrang } from "@/lib/pseo";
import { laLoiUuTien } from "@/lib/tuKhoaLoiStore";
import { timKhuVuc } from "@/lib/khuVuc";
import daXinTuSo from "@/data/da-xin-index.json";

// ============================================================================
// XIN INDEX — API CHỈ DÀNH CHO ADMIN (anh 09/11/2026: "làm sao tôi biết trang nào để index, trang nào đã có")
//   GET  → mọi link trong sitemap (= trang web cho Google index), xếp theo thứ tự xin, kèm số tin + lần đã xin
//   POST { duong, kq } → ghi "đã xin" / "đã có trên Google" / bỏ ghi, vào site_content "xin_index"
// Lần xin trước 09/11 lấy từ sổ THEO-DOI-INDEX.md (src/data/da-xin-index.json, scripts/nap-da-xin-index.mjs).
// Chi phí: chỉ chạy khi anh mở trang Admin này — đọc sitemap + tin đang có (đã có bộ nhớ đệm "listings").
// ============================================================================
export const dynamic = "force-dynamic";

type Ghi = { ngay: string; kq: "da-xin" | "da-co" };
const loi = (message: string, status = 400) => NextResponse.json({ ok: false, message }, { status });

async function chiAdmin() {
  const ssr = await createClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return { err: loi("Chưa đăng nhập", 401) };
  const { data: me } = await ssr.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") return { err: loi("Chỉ quản trị viên", 403) };
  const admin = createAdminClient();
  if (!admin) return { err: loi("Thiếu SUPABASE_SERVICE_ROLE_KEY trên máy chủ.", 500) };
  return { admin };
}

// Thứ tự xin (kế hoạch SEO): mục chính → trang tỉnh → trang loại hình + tỉnh (lõi, Cha ưu tiên) → loại hình cả nước → trang con
// (longtail) → tin đăng → dự án → tin tức → còn lại.
function nhomCua(duong: string): { so: number; ten: string } {
  const p = duong.split("/").filter(Boolean);
  if (p.length === 0 || (p.length === 1 && ["mua-ban", "cho-thue", "du-an", "tin-tuc"].includes(p[0]))) return { so: 1, ten: "Mục chính" };
  if (p[0] === "mua-ban" || p[0] === "cho-thue") {
    if (p.length === 2) return timKhuVuc(p[1]) ? { so: 2, ten: "Trang tỉnh" } : { so: 4, ten: "Loại hình cả nước" };
    if (p.length === 3 && timKhuVuc(p[2])) return { so: 3, ten: "Loại hình + tỉnh" };
    return { so: 5, ten: "Trang con" };
  }
  if (p[0] === "bat-dong-san") return { so: 6, ten: "Tin đăng" };
  if (p[0] === "du-an") return { so: 7, ten: "Dự án" };
  if (p[0] === "tin-tuc") return { so: 8, ten: "Tin tức" };
  return { so: 9, ten: "Khác" };
}

async function docDaXin(admin: NonNullable<ReturnType<typeof createAdminClient>>): Promise<Record<string, Ghi>> {
  const { data } = await admin.from("site_content").select("data").eq("key", "xin_index").limit(1);
  return (data?.[0]?.data as { trang?: Record<string, Ghi> } | undefined)?.trang ?? {};
}

export async function GET() {
  const { admin, err } = await chiAdmin();
  if (err) return err;
  const [ds, tin, ghi] = await Promise.all([sitemap(), getTinXetTrang().catch(() => []), docDaXin(admin)]);
  const pseo = tatCaTrang(tin);
  const so = daXinTuSo as Record<string, string>;
  const trang = ds.map((e) => {
    const duong = e.url.replace(/^https:\/\/coastalland\.vn/, "") || "/";
    const n = nhomCua(duong);
    // Tin đăng: sổ cũ ghi theo mã 8 ký tự cuối đường dẫn
    const ma = duong.startsWith("/bat-dong-san/") ? duong.slice(-8) : "";
    const cu = so[duong] ?? (ma ? so[`ma:${ma}`] : undefined);
    return {
      duong,
      nhom: n.ten,
      thuTu: n.so,
      uuTien: laLoiUuTien(duong),
      soTin: pseo.get(duong)?.n ?? null,
      ghi: ghi[duong] ?? (cu ? { ngay: cu, kq: "da-xin" as const } : null),
    };
  });
  trang.sort((a, b) => a.thuTu - b.thuTu || Number(b.uuTien) - Number(a.uuTien) || (b.soTin ?? 0) - (a.soTin ?? 0) || a.duong.localeCompare(b.duong));
  return NextResponse.json({ ok: true, trang });
}

export async function POST(req: Request) {
  const { admin, err } = await chiAdmin();
  if (err) return err;
  const b = (await req.json().catch(() => ({}))) as { duong?: string; kq?: string };
  if (!b.duong?.startsWith("/") || b.duong.length > 300) return loi("Đường dẫn không hợp lệ");
  const ghi = await docDaXin(admin);
  if (b.kq === "da-xin" || b.kq === "da-co") ghi[b.duong] = { ngay: new Date().toISOString().slice(0, 10), kq: b.kq };
  else delete ghi[b.duong];
  const { error } = await admin.from("site_content").upsert({ key: "xin_index", data: { trang: ghi } });
  if (error) return loi(`Không lưu được: ${error.message}`, 500);
  return NextResponse.json({ ok: true, ghi: ghi[b.duong] ?? null });
}
