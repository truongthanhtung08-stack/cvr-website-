import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { chuanHoaSdt, laSdtVN } from "@/lib/phone";
import { tuSuaTkKhoa } from "@/lib/gopTaiKhoan";

// POST /api/xac-thuc/mo-tk-khoa { email | sdt } — đăng nhập mật khẩu báo "banned" (tài khoản khoá đời cũ, gộp trước 05/11/2026)
// → web tự sửa (lib/gopTaiKhoan tuSuaTkKhoa: đủ điều kiện thì đánh dấu gộp, không thì mở khoá) rồi khách đăng nhập lại; vào tài
// khoản cũ thì useAuth tự chuyển sang tài khoản giữ lại. Không trả gì về tài khoản (không tiết lộ ai có tài khoản).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { email?: string; sdt?: string };
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ ok: false });
  const email = (b.email ?? "").trim().toLowerCase();
  const sdt = chuanHoaSdt(b.sdt ?? "");
  if (!email && !laSdtVN(sdt)) return NextResponse.json({ ok: false });
  const so84 = sdt ? `84${sdt.slice(1)}` : "";
  const { data: ds } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const u = (ds?.users ?? []).find((x) => (email ? (x.email ?? "").toLowerCase() === email : x.phone === so84));
  if (u?.banned_until && new Date(u.banned_until).getTime() > Date.now()) await tuSuaTkKhoa(admin, u.id);
  return NextResponse.json({ ok: true });
}
