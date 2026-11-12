import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { docBangTuKhoaLoi, docThuongHieu } from "@/lib/tuKhoaLoiDoc";
import { getTinXetTrang } from "@/lib/listingsDb";
import { tatCaTrang, tieuDe, NGUONG_INDEX } from "@/lib/pseo";
import daXinTuSo from "@/data/da-xin-index.json";

// ============================================================================
// TỪ KHOÁ LÕI — API CHỈ DÀNH CHO ADMIN (anh 09/11/2026: "chỉnh bảng – lưu – tải lên là web tự cập nhật")
//   GET                    → bản đang chạy trên web (site_content "tu_khoa_loi")
//   POST multipart "tep"   → đọc HE-THONG-TU-KHOA.xlsx (sheet "Từ khoá lõi", cột "Lên web" = x) theo luật tuKhoaLoiDoc.ts
//                            → ghi site_content → làm mới trang (thẻ "noi-dung", "listings") → trả danh sách đổi / giữ
//                            + sheet "Thương hiệu" (nếu có) → thuongHieu: tên, 2 câu, định nghĩa, cách gõ, kênh, hỏi đáp (12/11/2026)
//   POST ?xemTruoc=1       → chỉ đọc tệp, trả danh sách đổi / giữ, KHÔNG ghi gì
// ============================================================================
export const dynamic = "force-dynamic";

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

// BẢNG THEO DÕI TRANG LÕI (anh 12/11/2026: "mở trang thấy rất lộn xộn — cái nào index rồi, chưa index, đủ thông tin, chưa đủ; tôi không
// theo dõi được"): mỗi trang lõi MỘT dòng — tầng tỉnh · loại hình + tỉnh · thành phố — số tin, đủ chuẩn index chưa (cùng cổng với
// sitemap), đã xin index ngày nào / đã có trên Google (sổ Admin → Xin index). Chỉ chạy khi anh mở trang này.
type Ghi = { ngay: string; kq: "da-xin" | "da-co" };
async function theoDoi(admin: NonNullable<ReturnType<typeof createAdminClient>>, bang: Record<string, unknown>) {
  const [tin, { data: x }] = await Promise.all([getTinXetTrang().catch(() => []), admin.from("site_content").select("data").eq("key", "xin_index").limit(1)]);
  const ghi = ((x?.[0]?.data as { trang?: Record<string, Ghi> } | undefined)?.trang ?? {}) as Record<string, Ghi>;
  const so = daXinTuSo as Record<string, string>;
  const dong = new Map<string, { trang: string; muc: "ban" | "thue"; tinh: string; tang: string; tuKhoa: string; soTin: number; duChuan: boolean; trongBang: boolean; xin: Ghi | null }>();
  for (const p of tatCaTrang(tin).values()) {
    const d = p.dk;
    if (d.phuong || d.duong || d.huong || d.phapLy || d.kiet || d.phongNgu || d.giaDuoi) continue;
    if (d.thanhPho && d.cat) continue; // thành phố: chỉ tầng nhà đất
    const tang = d.thanhPho ? "Thành phố" : d.cat ? "Loại hình + tỉnh" : "Tỉnh";
    dong.set(p.path, { trang: p.path, muc: d.muc, tinh: d.tinh.name, tang, tuKhoa: tieuDe(d), soTin: p.n, duChuan: p.index, trongBang: p.path in bang, xin: null });
  }
  for (const t of Object.keys(bang)) if (!dong.has(t)) {
    const muc = t.startsWith("/cho-thue") ? "thue" : "ban";
    dong.set(t, { trang: t, muc, tinh: "", tang: t.split("/").length > 3 ? "Loại hình + tỉnh" : "Tỉnh", tuKhoa: "", soTin: 0, duChuan: false, trongBang: true, xin: null });
  }
  for (const r of dong.values()) r.xin = ghi[r.trang] ?? (so[r.trang] ? { ngay: so[r.trang], kq: "da-xin" } : null);
  return { nguong: NGUONG_INDEX, dong: [...dong.values()].sort((a, b) => a.muc.localeCompare(b.muc) || a.tinh.localeCompare(b.tinh) || a.tang.localeCompare(b.tang) || b.soTin - a.soTin) };
}

export async function GET() {
  const { admin, err } = await chiAdmin();
  if (err) return err;
  const { data } = await admin.from("site_content").select("data").eq("key", "tu_khoa_loi").limit(1);
  const hienTai = (data?.[0]?.data ?? null) as { trang?: Record<string, unknown> } | null;
  return NextResponse.json({ ok: true, hienTai, theoDoi: await theoDoi(admin, hienTai?.trang ?? {}) });
}

export async function POST(req: Request) {
  const { admin, err } = await chiAdmin();
  if (err) return err;
  const form = await req.formData().catch(() => null);
  const tep = form?.get("tep");
  if (!(tep instanceof File)) return loi("Chưa chọn tệp .xlsx");
  if (tep.size > 10 * 1024 * 1024) return loi("Tệp lớn hơn 10 MB");
  let kq;
  let th: ReturnType<typeof docThuongHieu>;
  try {
    const buf = Buffer.from(await tep.arrayBuffer());
    kq = docBangTuKhoaLoi(buf);
    th = docThuongHieu(buf);
  } catch (e) {
    return loi(e instanceof Error ? e.message : "Không đọc được tệp");
  }
  if (th.loi) return loi(th.loi);
  if (new URL(req.url).searchParams.get("xemTruoc")) return NextResponse.json({ ok: true, xemTruoc: true, ...kq, thuongHieu: th.thuongHieu });
  // Không có sheet Thương hiệu trong tệp → giữ bản thương hiệu đã nạp lần trước (không xoá mất)
  const { data: cu } = await admin.from("site_content").select("data").eq("key", "tu_khoa_loi").limit(1);
  const thuongHieu = th.thuongHieu ?? (cu?.[0]?.data as { thuongHieu?: unknown } | undefined)?.thuongHieu ?? null;
  const data = { trang: kq.trang, doi: kq.doi, giu: kq.giu, soDong: kq.soDong, tenTep: tep.name, capNhat: new Date().toISOString(), thuongHieu };
  const { error } = await admin.from("site_content").upsert({ key: "tu_khoa_loi", data });
  if (error) return loi(`Không lưu được: ${error.message}`, 500);
  // Tiêu đề, H1, mô tả trang lõi + trang con đổi theo → làm mới trang đọc nội dung Admin + trang danh sách
  revalidateTag("noi-dung", "max");
  revalidateTag("listings", "max");
  return NextResponse.json({ ok: true, ...kq, thuongHieu });
}
