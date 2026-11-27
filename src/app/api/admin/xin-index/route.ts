import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import sitemap from "@/app/sitemap";
import { getTinXetTrang } from "@/lib/listingsDb";
import { tatCaTrang, tieuDe, titleGoogle, giaiMaDanhSach, duongDan, NHOM_CHA, NOI_NHOM } from "@/lib/pseo";
import { laLoiUuTien } from "@/lib/tuKhoaLoiStore";
import { timKhuVuc } from "@/lib/khuVuc";
import nhomTuKhoa from "@/data/nhom-tu-khoa.json";
import { docSoXinIndex, ghiSoXinIndex, duongTuUrl, trangThaiIndex } from "@/lib/xinIndex";

// ============================================================================
// XIN INDEX — API CHỈ DÀNH CHO ADMIN (anh 09/11/2026: "làm sao tôi biết trang nào để index, trang nào đã có")
//   GET  → mọi link trong sitemap (= trang web cho Google index), xếp theo thứ tự xin, kèm số tin + Đã index / Chưa index
//          (luật trạng thái: src/lib/xinIndex.ts — một nguồn với Admin → Từ khoá lõi)
// Lần xin trước 09/11 lấy từ sổ THEO-DOI-INDEX.md (src/data/da-xin-index.json, scripts/nap-da-xin-index.mjs).
// Chi phí: chỉ chạy khi anh mở trang Admin này — đọc sitemap + tin đang có (đã có bộ nhớ đệm "listings").
// ============================================================================
export const dynamic = "force-dynamic";
const CO_TU_KHOA = new Set((nhomTuKhoa as { url: string }[]).map((x) => x.url));

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

export async function GET() {
  const { admin, err } = await chiAdmin();
  if (err) return err;
  const [ds, tin, so] = await Promise.all([sitemap(), getTinXetTrang().catch(() => []), docSoXinIndex(admin)]);
  const pseo = tatCaTrang(tin);
  const gSet = new Set(so.google?.ds ?? []);
  const trang = ds.map((e) => {
    const duong = e.url.replace(/^https:\/\/coastalland\.vn/, "") || "/";
    const n = nhomCua(duong);
    const p = pseo.get(duong);
    // TÊN TRANG = câu từ khoá của trang (anh 27/11/2026: "ghi rõ trên Admin: Trang, URL, đã index, chưa index")
    const seg = duong.split("/").filter(Boolean);
    const tinh = seg.length === 2 && (seg[0] === "mua-ban" || seg[0] === "cho-thue") ? timKhuVuc(seg[1]) : undefined;
    const ten = p ? tieuDe(p.dk) : tinh ? tieuDe({ muc: seg[0] === "cho-thue" ? "thue" : "ban", tinh }) : "";
    return {
      duong,
      ten,
      nhom: n.ten,
      thuTu: n.so,
      uuTien: laLoiUuTien(duong),
      soTin: p?.n ?? null,
      // Trang pSEO chưa đủ tin (dưới ngưỡng index) — không xin
      duTin: p ? p.index : true,
      ...trangThaiIndex(duong, so, gSet),
    };
  });
  trang.sort((a, b) => a.thuTu - b.thuTu || Number(b.uuTien) - Number(a.uuTien) || (b.soTin ?? 0) - (a.soTin ?? 0) || a.duong.localeCompare(b.duong));
  // NHÓM LOẠI CHA (anh 27/11/2026: "Admin quá lộn xộn — lấy loại hình CHA theo bộ lọc, ghi rõ trang, URL, index, lộ trình"):
  // mỗi dòng = khu vực + mục đích + loại cha = MỘT URL; title đúng chữ đang chạy trên web (titleGoogle — một chỗ với trang).
  const TEN_CHA: Record<string, string> = { "": "Nhà đất", nha: "Nhà", dat: "Đất", "can-ho-chung-cu": "Căn hộ chung cư", "nghi-duong": "BĐS nghỉ dưỡng",
    "homestay-farmstay": "BĐS nghỉ dưỡng", "kho-nha-xuong": "BĐS công nghiệp", "phong-tro": "Phòng trọ", "van-phong-mat-bang": "Văn phòng, mặt bằng" };
  const nhomCha: { khuVuc: string; muc: string; cha: string; duong: string; ten: string; manh: boolean; daIndex: boolean; xin: string | null }[] = [];
  for (const noi of NOI_NHOM) for (const [muc, cats] of NHOM_CHA) for (const slug of ["", ...cats]) {
    if (slug === "can-ho-chung-cu" && /^(quang-ngai|quang-tri)/.test(noi)) continue;
    const [t, tp] = noi.split("/");
    const tinh = timKhuVuc(t);
    if (!tinh) continue;
    const dk = slug ? giaiMaDanhSach(muc, slug, noi.split("/"), []) : tp ? giaiMaDanhSach(muc, t, [tp], []) : { muc, tinh };
    if (!dk) continue;
    const duong = duongDan(dk);
    // Chỉ nhóm CÓ câu khách gõ (gợi ý Google, src/data/nhom-tu-khoa.json) — "cái nào không có thì BỎ" (anh 27/11/2026)
    if (!CO_TU_KHOA.has(duong)) continue;
    nhomCha.push({ khuVuc: dk.thanhPho?.name ?? tinh.name, muc: muc === "thue" ? "Cho thuê" : "Mua bán", cha: TEN_CHA[slug], duong, ten: titleGoogle(dk),
      manh: /^(da-nang|hue|khanh-hoa\/nha-trang|gia-lai\/quy-nhon)$/.test(noi), ...trangThaiIndex(duong, so, gSet) });
  }
  return NextResponse.json({ ok: true, trang, nhomCha, google: so.google ? { ngay: so.google.ngay, soTrang: so.google.ds.length } : null });
}

// POST { duong, kq: "da-xin" | "da-co" | "bo" } → ghi tay một trang
// POST { google: { ngay: "yyyy-mm-dd", urls: string[] } } → thay danh sách đã index bằng danh sách mới của Search Console
export async function POST(req: Request) {
  const { admin, err } = await chiAdmin();
  if (err) return err;
  const b = (await req.json().catch(() => ({}))) as { duong?: string; kq?: string; google?: { ngay?: string; urls?: string[] } };
  const so = await docSoXinIndex(admin);
  if (b.google) {
    const ngay = /^\d{4}-\d{2}-\d{2}$/.test(b.google.ngay ?? "") ? b.google.ngay! : new Date().toISOString().slice(0, 10);
    const ds = [...new Set((b.google.urls ?? []).map(duongTuUrl).filter((x): x is string => !!x))];
    if (!ds.length) return loi("Không thấy đường dẫn coastalland.vn nào trong danh sách dán vào");
    so.google = { ngay, ds };
  } else {
    if (!b.duong?.startsWith("/") || b.duong.length > 300) return loi("Đường dẫn không hợp lệ");
    if (b.kq === "da-xin" || b.kq === "da-co") so.trang[b.duong] = { ngay: new Date().toISOString().slice(0, 10), kq: b.kq };
    else delete so.trang[b.duong];
  }
  const { error } = await ghiSoXinIndex(admin, so);
  if (error) return loi(`Không lưu được: ${error.message}`, 500);
  if (b.google) return NextResponse.json({ ok: true, google: { ngay: so.google!.ngay, soTrang: so.google!.ds.length } });
  return NextResponse.json({ ok: true, ...trangThaiIndex(b.duong!, so, new Set(so.google?.ds ?? [])) });
}
