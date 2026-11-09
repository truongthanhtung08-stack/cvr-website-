import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { docBangTuKhoaLoi } from "@/lib/tuKhoaLoiDoc";

// ============================================================================
// TỪ KHOÁ LÕI — API CHỈ DÀNH CHO ADMIN (anh 09/11/2026: "chỉnh bảng – lưu – tải lên là web tự cập nhật")
//   GET                    → bản đang chạy trên web (site_content "tu_khoa_loi")
//   POST multipart "tep"   → đọc HE-THONG-TU-KHOA.xlsx (sheet "Từ khoá lõi", cột "Lên web" = x) theo luật tuKhoaLoiDoc.ts
//                            → ghi site_content → làm mới trang (thẻ "noi-dung", "listings") → trả danh sách đổi / giữ
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

export async function GET() {
  const { admin, err } = await chiAdmin();
  if (err) return err;
  const { data } = await admin.from("site_content").select("data").eq("key", "tu_khoa_loi").limit(1);
  return NextResponse.json({ ok: true, hienTai: data?.[0]?.data ?? null });
}

export async function POST(req: Request) {
  const { admin, err } = await chiAdmin();
  if (err) return err;
  const form = await req.formData().catch(() => null);
  const tep = form?.get("tep");
  if (!(tep instanceof File)) return loi("Chưa chọn tệp .xlsx");
  if (tep.size > 10 * 1024 * 1024) return loi("Tệp lớn hơn 10 MB");
  let kq;
  try {
    kq = docBangTuKhoaLoi(Buffer.from(await tep.arrayBuffer()));
  } catch (e) {
    return loi(e instanceof Error ? e.message : "Không đọc được tệp");
  }
  if (new URL(req.url).searchParams.get("xemTruoc")) return NextResponse.json({ ok: true, xemTruoc: true, ...kq });
  const data = { trang: kq.trang, doi: kq.doi, giu: kq.giu, soDong: kq.soDong, tenTep: tep.name, capNhat: new Date().toISOString() };
  const { error } = await admin.from("site_content").upsert({ key: "tu_khoa_loi", data });
  if (error) return loi(`Không lưu được: ${error.message}`, 500);
  // Tiêu đề, H1, mô tả trang lõi + trang con đổi theo → làm mới trang đọc nội dung Admin + trang danh sách
  revalidateTag("noi-dung", "max");
  revalidateTag("listings", "max");
  return NextResponse.json({ ok: true, ...kq });
}
